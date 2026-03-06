import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("inventory.db");

// ========== 统一响应工具 ==========
function success(data: any, message = "操作成功") {
  return { code: 200, message, data };
}

function fail(code: number, message: string) {
  return { code, message, data: null };
}

function generateOrderNo(prefix: string) {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${ts}${rand}`;
}

// ========== 数据库初始化 ==========
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    contact_person TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category_id INTEGER,
    spec TEXT,
    expiry_days INTEGER,
    barcode TEXT UNIQUE,
    alert_threshold INTEGER DEFAULT 10,
    price REAL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    address TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    role TEXT NOT NULL,
    store_id INTEGER,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    store_id INTEGER,
    product_id INTEGER,
    quantity INTEGER DEFAULT 0,
    PRIMARY KEY (store_id, product_id),
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    order_no TEXT UNIQUE,
    store_id INTEGER,
    target_store_id INTEGER,
    supplier_id INTEGER,
    channel TEXT,
    user_id INTEGER,
    date TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending',
    remark TEXT,
    FOREIGN KEY (store_id) REFERENCES stores(id),
    FOREIGN KEY (target_store_id) REFERENCES stores(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    batch_no TEXT,
    expiry_date TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS operation_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation TEXT,
    detail TEXT,
    create_time TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// 添加 channel 列（防止旧库缺列）
try { db.exec("ALTER TABLE transactions ADD COLUMN channel TEXT"); } catch (_) { /* 列已存在 */ }

// ========== 种子数据 ==========
const storeCount = db.prepare("SELECT COUNT(*) as count FROM stores").get() as { count: number };
if (storeCount.count === 0) {
  db.prepare("INSERT INTO stores (name, address, contact_person, phone) VALUES (?, ?, ?, ?)").run("总部旗舰店", "北京市朝阳区", "张经理", "13800138000");
  db.prepare("INSERT INTO stores (name, address, contact_person, phone) VALUES (?, ?, ?, ?)").run("上海分店", "上海市黄浦区", "李店长", "13900139000");
  db.prepare("INSERT INTO stores (name, address, contact_person, phone) VALUES (?, ?, ?, ?)").run("广州分店", "广东省广州市天河区", "王店长", "13700137000");

  db.prepare("INSERT INTO categories (name) VALUES (?)").run("食品饮料");
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("日用百货");
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("生鲜果蔬");

  db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run("矿泉水 500ml", 1, "24瓶/箱", 365, "6901234567890", 2.0, 50);
  db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run("洗发水 400ml", 2, "瓶", 1095, "6909876543210", 35.0, 20);
  db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run("可乐 330ml", 1, "24罐/箱", 270, "6901234567891", 3.0, 30);
  db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run("牙膏 120g", 2, "支", 730, "6909876543211", 12.0, 15);
  db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run("苹果", 3, "500g", 7, "6901234567892", 8.0, 100);

  db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run("哇哈哈集团", "陈经理", "0571-12345678", "浙江省杭州市");
  db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run("联合利华", "张经理", "021-87654321", "上海市浦东新区");
  db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run("本地水果批发", "刘老板", "13600136000", "北京市新发地");

  db.prepare("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?, ?, ?, ?, ?)").run("admin", "admin123", "系统管理员", "admin", 1);
  db.prepare("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?, ?, ?, ?, ?)").run("manager", "manager123", "王店长", "manager", 2);
  db.prepare("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?, ?, ?, ?, ?)").run("staff01", "staff123", "赵店员", "staff", 1);

  // 初始库存数据
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(1, 1, 200);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(1, 2, 50);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(1, 3, 150);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(1, 4, 30);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(1, 5, 80);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(2, 1, 100);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(2, 2, 25);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(2, 3, 80);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(3, 1, 60);
  db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(3, 5, 5);  // 低库存，触发预警

  // 初始交易数据（入库记录）
  const txn1 = db.prepare("INSERT INTO transactions (type, order_no, store_id, supplier_id, user_id, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)").run("inbound", "RK202603010001", 1, 1, 1, "completed", "2026-03-01 10:00:00");
  db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)").run(txn1.lastInsertRowid, 1, 200, "B20260301", "2027-03-01");
  db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)").run(txn1.lastInsertRowid, 3, 150, "B20260301", "2026-12-01");

  const txn2 = db.prepare("INSERT INTO transactions (type, order_no, store_id, supplier_id, user_id, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)").run("inbound", "RK202603020001", 2, 2, 2, "completed", "2026-03-02 14:30:00");
  db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)").run(txn2.lastInsertRowid, 2, 25, "B20260302", "2029-03-02");
}

// ========== 启动服务器 ==========
async function startServer() {
  const app = express();
  app.use(express.json());

  // ============================
  // 认证接口
  // ============================
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json(fail(400, "用户名和密码不能为空"));
    }
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      // 生成简单的模拟 JWT Token
      const token = Buffer.from(JSON.stringify({ userId: user.id, username: user.username, role: user.role, ts: Date.now() })).toString('base64');
      res.json(success({ token, user: userWithoutPassword }, "登录成功"));
    } else {
      res.status(401).json(fail(401, "用户名或密码错误"));
    }
  });

  // ============================
  // 门店管理
  // ============================
  app.get("/api/stores", (req, res) => {
    const stores = db.prepare("SELECT * FROM stores").all();
    res.json(success(stores));
  });

  app.post("/api/stores", (req, res) => {
    const { name, address, contact_person, phone, status } = req.body;
    if (!name) return res.status(400).json(fail(400, "门店名称不能为空"));
    const info = db.prepare("INSERT INTO stores (name, address, contact_person, phone, status) VALUES (?, ?, ?, ?, ?)").run(name, address, contact_person, phone, status || 'active');
    res.json(success(info.lastInsertRowid, "新增成功"));
  });

  // 兼容需求文档中 /store/add 路径
  app.post("/api/store/add", (req, res) => {
    const { storeName, name, address, contact, contact_person, phone } = req.body;
    const finalName = storeName || name;
    const finalContact = contact || contact_person;
    if (!finalName) return res.status(400).json(fail(400, "门店名称不能为空"));
    const info = db.prepare("INSERT INTO stores (name, address, contact_person, phone) VALUES (?, ?, ?, ?)").run(finalName, address, finalContact, phone);
    res.json(success(info.lastInsertRowid, "新增成功"));
  });

  app.put("/api/stores/:id", (req, res) => {
    const { name, address, contact_person, phone, status } = req.body;
    db.prepare("UPDATE stores SET name=?, address=?, contact_person=?, phone=?, status=? WHERE id=?").run(name, address, contact_person, phone, status, req.params.id);
    res.json(success(null, "更新成功"));
  });

  app.delete("/api/stores/:id", (req, res) => {
    db.prepare("DELETE FROM stores WHERE id=?").run(req.params.id);
    res.json(success(null, "删除成功"));
  });

  // ============================
  // 商品管理
  // ============================
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `).all();
    res.json(success(products));
  });

  app.post("/api/products", (req, res) => {
    const { name, category_id, spec, expiry_days, barcode, price, alert_threshold } = req.body;
    if (!name) return res.status(400).json(fail(400, "商品名称不能为空"));
    try {
      const info = db.prepare("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)").run(name, category_id, spec, expiry_days, barcode, price, alert_threshold || 10);
      res.json(success(info.lastInsertRowid, "新增成功"));
    } catch (e: any) {
      if (e.message.includes("UNIQUE")) {
        res.status(400).json(fail(400, "条码已存在"));
      } else {
        res.status(500).json(fail(500, "新增失败"));
      }
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category_id, spec, expiry_days, barcode, price, alert_threshold } = req.body;
    db.prepare("UPDATE products SET name=?, category_id=?, spec=?, expiry_days=?, barcode=?, price=?, alert_threshold=? WHERE id=?").run(name, category_id, spec, expiry_days, barcode, price, alert_threshold, req.params.id);
    res.json(success(null, "更新成功"));
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id=?").run(req.params.id);
    res.json(success(null, "删除成功"));
  });

  // ============================
  // 分类管理
  // ============================
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(success(categories));
  });

  // ============================
  // 供应商管理
  // ============================
  app.get("/api/suppliers", (req, res) => {
    const suppliers = db.prepare("SELECT * FROM suppliers").all();
    res.json(success(suppliers));
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, contact_person, phone, address } = req.body;
    if (!name) return res.status(400).json(fail(400, "供应商名称不能为空"));
    const info = db.prepare("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)").run(name, contact_person, phone, address);
    res.json(success(info.lastInsertRowid, "新增成功"));
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { name, contact_person, phone, address } = req.body;
    db.prepare("UPDATE suppliers SET name=?, contact_person=?, phone=?, address=? WHERE id=?").run(name, contact_person, phone, address, req.params.id);
    res.json(success(null, "更新成功"));
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    db.prepare("DELETE FROM suppliers WHERE id=?").run(req.params.id);
    res.json(success(null, "删除成功"));
  });

  // ============================
  // 用户管理
  // ============================
  app.get("/api/users", (req, res) => {
    const users = db.prepare(`
      SELECT u.id, u.username, u.real_name, u.role, u.store_id, u.status, s.name as store_name
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
    `).all();
    res.json(success(users));
  });

  app.post("/api/users", (req, res) => {
    const { username, password, real_name, role, store_id } = req.body;
    if (!username || !password || !role) return res.status(400).json(fail(400, "用户名、密码、角色不能为空"));
    try {
      const info = db.prepare("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?, ?, ?, ?, ?)").run(username, password, real_name, role, store_id);
      res.json(success(info.lastInsertRowid, "新增成功"));
    } catch (e: any) {
      if (e.message.includes("UNIQUE")) {
        res.status(400).json(fail(400, "用户名已存在"));
      } else {
        res.status(500).json(fail(500, "新增失败"));
      }
    }
  });

  // ============================
  // 库存查询
  // ============================
  app.get("/api/inventory", (req, res) => {
    const { store_id } = req.query;
    let query = `
      SELECT i.*, p.name as product_name, p.barcode, p.spec, p.alert_threshold, p.price, s.name as store_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN stores s ON i.store_id = s.id
    `;
    const params: any[] = [];
    if (store_id) {
      query += " WHERE i.store_id = ?";
      params.push(store_id);
    }
    const inventory = db.prepare(query).all(...params);
    res.json(success(inventory));
  });

  // 单个商品库存详情
  app.get("/api/inventory/detail", (req, res) => {
    const { storeId, productId } = req.query;
    const inv = db.prepare(`
      SELECT i.*, p.name as product_name, s.name as store_name
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      JOIN stores s ON i.store_id = s.id
      WHERE i.store_id = ? AND i.product_id = ?
    `).get(storeId, productId);
    if (inv) {
      res.json(success(inv));
    } else {
      res.json(success({ store_id: storeId, product_id: productId, quantity: 0, stockNum: 0 }));
    }
  });

  // ============================
  // 采购入库
  // ============================
  app.get("/api/transactions/inbound", (req, res) => {
    const list = db.prepare(`
      SELECT t.*, s.name as store_name, sp.name as supplier_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN suppliers sp ON t.supplier_id = sp.id
      WHERE t.type = 'inbound'
      ORDER BY t.date DESC
    `).all();
    res.json(success(list));
  });

  app.post("/api/inventory/inbound", (req, res) => {
    const { supplierId, supplier_id, storeId, store_id, items, remark } = req.body;
    const finalSupplierId = supplierId || supplier_id;
    const finalStoreId = storeId || store_id;
    if (!finalStoreId || !items || items.length === 0) {
      return res.status(400).json(fail(400, "门店和商品明细不能为空"));
    }

    // 校验商品效期
    const now = new Date().toISOString().split('T')[0];
    for (const item of items) {
      const expiry = item.expiryDate || item.expiry_date;
      if (expiry && expiry < now) {
        return res.status(400).json(fail(400, "商品效期已过"));
      }
    }

    const orderNo = generateOrderNo("RK");
    const txn = db.prepare(`INSERT INTO transactions (type, order_no, store_id, supplier_id, user_id, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?)`).run("inbound", orderNo, finalStoreId, finalSupplierId, 1, "pending", remark || null);

    for (const item of items) {
      const productId = item.productId || item.product_id;
      const num = item.num || item.quantity;
      const batchNo = item.batchNo || item.batch_no;
      const expiryDate = item.expiryDate || item.expiry_date;
      db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)").run(txn.lastInsertRowid, productId, num, batchNo, expiryDate);
    }

    db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "创建采购入库单", `单号: ${orderNo}`);
    res.json(success(orderNo, "入库单创建成功"));
  });

  // 审核入库单
  app.post("/api/inventory/inbound/audit", (req, res) => {
    const { orderNo, status } = req.body;
    if (!orderNo) return res.status(400).json(fail(400, "单号不能为空"));

    const txn = db.prepare("SELECT * FROM transactions WHERE order_no = ? AND type = 'inbound'").get(orderNo) as any;
    if (!txn) return res.status(404).json(fail(404, "入库单不存在"));
    if (txn.status !== 'pending') return res.status(400).json(fail(400, "该入库单已处理"));

    if (status === 'APPROVED' || status === 'approved') {
      // 更新库存
      const items = db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?").all(txn.id) as any[];
      for (const item of items) {
        const existing = db.prepare("SELECT * FROM inventory WHERE store_id = ? AND product_id = ?").get(txn.store_id, item.product_id) as any;
        if (existing) {
          db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE store_id = ? AND product_id = ?").run(item.quantity, txn.store_id, item.product_id);
        } else {
          db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(txn.store_id, item.product_id, item.quantity);
        }
      }
      db.prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(txn.id);
      db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "审核入库单通过", `单号: ${orderNo}`);
      res.json(success(null, "审核通过，库存已更新"));
    } else {
      db.prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ?").run(txn.id);
      db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "审核入库单驳回", `单号: ${orderNo}`);
      res.json(success(null, "已驳回"));
    }
  });

  // ============================
  // 销售出库
  // ============================
  app.get("/api/transactions/outbound", (req, res) => {
    const list = db.prepare(`
      SELECT t.*, s.name as store_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.type = 'outbound'
      ORDER BY t.date DESC
    `).all();
    res.json(success(list));
  });

  app.post("/api/inventory/outbound", (req, res) => {
    const { storeId, store_id, channel, items, remark } = req.body;
    const finalStoreId = storeId || store_id;
    if (!finalStoreId || !items || items.length === 0) {
      return res.status(400).json(fail(400, "门店和商品明细不能为空"));
    }

    // 校验库存是否充足
    for (const item of items) {
      const productId = item.productId || item.product_id;
      const num = item.num || item.quantity;
      const inv = db.prepare("SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?").get(finalStoreId, productId) as any;
      if (!inv || inv.quantity < num) {
        const product = db.prepare("SELECT name FROM products WHERE id = ?").get(productId) as any;
        return res.status(400).json(fail(400, `库存不足: ${product?.name || productId}，当前库存 ${inv?.quantity || 0}，需求 ${num}`));
      }
    }

    const orderNo = generateOrderNo("XS");
    const txn = db.prepare("INSERT INTO transactions (type, order_no, store_id, channel, user_id, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?)").run("outbound", orderNo, finalStoreId, channel || 'offline', 1, "completed", remark || null);

    for (const item of items) {
      const productId = item.productId || item.product_id;
      const num = item.num || item.quantity;
      db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity) VALUES (?, ?, ?)").run(txn.lastInsertRowid, productId, num);
      // 扣减库存
      db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE store_id = ? AND product_id = ?").run(num, finalStoreId, productId);
    }

    db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "销售出库", `单号: ${orderNo}`);
    res.json(success(orderNo, "出库成功"));
  });

  // ============================
  // 跨店调拨
  // ============================
  app.get("/api/transactions/transfer", (req, res) => {
    const list = db.prepare(`
      SELECT t.*, 
        s1.name as from_store, 
        s2.name as to_store
      FROM transactions t
      LEFT JOIN stores s1 ON t.store_id = s1.id
      LEFT JOIN stores s2 ON t.target_store_id = s2.id
      WHERE t.type = 'transfer'
      ORDER BY t.date DESC
    `).all();
    res.json(success(list));
  });

  app.post("/api/inventory/transfer", (req, res) => {
    const { fromStoreId, from_store_id, toStoreId, to_store_id, items, remark } = req.body;
    const outStoreId = fromStoreId || from_store_id;
    const inStoreId = toStoreId || to_store_id;
    if (!outStoreId || !inStoreId) return res.status(400).json(fail(400, "调出和调入门店不能为空"));
    if (outStoreId === inStoreId) return res.status(400).json(fail(400, "调出和调入门店不能相同"));
    if (!items || items.length === 0) return res.status(400).json(fail(400, "商品明细不能为空"));

    // 校验调出门店库存
    for (const item of items) {
      const productId = item.productId || item.product_id;
      const num = item.num || item.quantity;
      const inv = db.prepare("SELECT quantity FROM inventory WHERE store_id = ? AND product_id = ?").get(outStoreId, productId) as any;
      if (!inv || inv.quantity < num) {
        return res.status(400).json(fail(400, `调出门店库存不足`));
      }
    }

    const orderNo = generateOrderNo("DB");
    db.prepare("INSERT INTO transactions (type, order_no, store_id, target_store_id, user_id, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?)").run("transfer", orderNo, outStoreId, inStoreId, 1, "pending", remark || null);

    const txnId = (db.prepare("SELECT last_insert_rowid() as id").get() as any).id;
    for (const item of items) {
      const productId = item.productId || item.product_id;
      const num = item.num || item.quantity;
      db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity) VALUES (?, ?, ?)").run(txnId, productId, num);
    }

    db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "创建跨店调拨单", `单号: ${orderNo}`);
    res.json(success(orderNo, "调拨单创建成功"));
  });

  // 审核调拨单
  app.post("/api/inventory/transfer/audit", (req, res) => {
    const { orderNo, status } = req.body;
    const txn = db.prepare("SELECT * FROM transactions WHERE order_no = ? AND type = 'transfer'").get(orderNo) as any;
    if (!txn) return res.status(404).json(fail(404, "调拨单不存在"));
    if (txn.status !== 'pending') return res.status(400).json(fail(400, "该调拨单已处理"));

    if (status === 'APPROVED' || status === 'approved') {
      const items = db.prepare("SELECT * FROM transaction_items WHERE transaction_id = ?").all(txn.id) as any[];
      for (const item of items) {
        // 调出门店扣减
        db.prepare("UPDATE inventory SET quantity = quantity - ? WHERE store_id = ? AND product_id = ?").run(item.quantity, txn.store_id, item.product_id);
        // 调入门店增加
        const existing = db.prepare("SELECT * FROM inventory WHERE store_id = ? AND product_id = ?").get(txn.target_store_id, item.product_id) as any;
        if (existing) {
          db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE store_id = ? AND product_id = ?").run(item.quantity, txn.target_store_id, item.product_id);
        } else {
          db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(txn.target_store_id, item.product_id, item.quantity);
        }
      }
      db.prepare("UPDATE transactions SET status = 'completed' WHERE id = ?").run(txn.id);
      res.json(success(null, "调拨审核通过"));
    } else {
      db.prepare("UPDATE transactions SET status = 'cancelled' WHERE id = ?").run(txn.id);
      res.json(success(null, "已驳回"));
    }
  });

  // ============================
  // 报损报溢
  // ============================
  app.get("/api/transactions/adjustment", (req, res) => {
    const list = db.prepare(`
      SELECT t.*, s.name as store_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.type IN ('loss', 'overflow')
      ORDER BY t.date DESC
    `).all();
    res.json(success(list));
  });

  app.post("/api/inventory/adjustment", (req, res) => {
    const { type, storeId, store_id, items, remark } = req.body;
    const finalStoreId = storeId || store_id;
    if (!type || !finalStoreId) return res.status(400).json(fail(400, "类型和门店不能为空"));

    const orderNo = generateOrderNo(type === 'loss' ? 'BS' : 'BY');
    const txn = db.prepare("INSERT INTO transactions (type, order_no, store_id, user_id, status, remark) VALUES (?, ?, ?, ?, ?, ?)").run(type, orderNo, finalStoreId, 1, "completed", remark || null);

    if (items && items.length > 0) {
      for (const item of items) {
        const productId = item.productId || item.product_id;
        const num = item.num || item.quantity;
        db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity) VALUES (?, ?, ?)").run(txn.lastInsertRowid, productId, num);
        if (type === 'loss') {
          db.prepare("UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE store_id = ? AND product_id = ?").run(num, finalStoreId, productId);
        } else {
          const existing = db.prepare("SELECT * FROM inventory WHERE store_id = ? AND product_id = ?").get(finalStoreId, productId);
          if (existing) {
            db.prepare("UPDATE inventory SET quantity = quantity + ? WHERE store_id = ? AND product_id = ?").run(num, finalStoreId, productId);
          } else {
            db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(finalStoreId, productId, num);
          }
        }
      }
    }

    db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, type === 'loss' ? '报损' : '报溢', `单号: ${orderNo}`);
    res.json(success(orderNo, type === 'loss' ? '报损成功' : '报溢成功'));
  });

  // ============================
  // 库存盘点
  // ============================
  app.get("/api/transactions/counting", (req, res) => {
    const list = db.prepare(`
      SELECT t.*, s.name as store_name
      FROM transactions t
      LEFT JOIN stores s ON t.store_id = s.id
      WHERE t.type = 'adjustment'
      ORDER BY t.date DESC
    `).all();
    res.json(success(list));
  });

  app.post("/api/inventory/counting", (req, res) => {
    const { storeId, store_id, items, remark } = req.body;
    const finalStoreId = storeId || store_id;
    if (!finalStoreId) return res.status(400).json(fail(400, "门店不能为空"));

    const orderNo = generateOrderNo("PD");
    db.prepare("INSERT INTO transactions (type, order_no, store_id, user_id, status, remark) VALUES (?, ?, ?, ?, ?, ?)").run("adjustment", orderNo, finalStoreId, 1, "completed", remark || '库存盘点');

    if (items && items.length > 0) {
      const txnId = (db.prepare("SELECT last_insert_rowid() as id").get() as any).id;
      for (const item of items) {
        const productId = item.productId || item.product_id;
        const actualQty = item.actualQuantity || item.quantity;
        db.prepare("INSERT INTO transaction_items (transaction_id, product_id, quantity) VALUES (?, ?, ?)").run(txnId, productId, actualQty);
        // 直接设置库存为实盘数量
        const existing = db.prepare("SELECT * FROM inventory WHERE store_id = ? AND product_id = ?").get(finalStoreId, productId);
        if (existing) {
          db.prepare("UPDATE inventory SET quantity = ? WHERE store_id = ? AND product_id = ?").run(actualQty, finalStoreId, productId);
        } else {
          db.prepare("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)").run(finalStoreId, productId, actualQty);
        }
      }
    }

    db.prepare("INSERT INTO operation_log (user_id, operation, detail) VALUES (?, ?, ?)").run(1, "库存盘点", `单号: ${orderNo}`);
    res.json(success(orderNo, "盘点完成"));
  });

  // ============================
  // 数据统计 - Dashboard
  // ============================
  app.get("/api/dashboard/stats", (req, res) => {
    const totalInventory = db.prepare("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory").get() as { total: number };
    const totalValue = db.prepare(`
      SELECT COALESCE(SUM(i.quantity * p.price), 0) as total 
      FROM inventory i 
      JOIN products p ON i.product_id = p.id
    `).get() as { total: number };
    const storeStats = db.prepare(`
      SELECT s.name, COALESCE(SUM(i.quantity), 0) as quantity
      FROM stores s
      LEFT JOIN inventory i ON s.id = i.store_id
      GROUP BY s.id
    `).all();
    const warningCount = db.prepare(`
      SELECT COUNT(*) as count FROM inventory i 
      JOIN products p ON i.product_id = p.id 
      WHERE i.quantity <= p.alert_threshold
    `).get() as { count: number };

    // 最近入库动态
    const recentInbound = db.prepare(`
      SELECT t.order_no, t.date, s.name as store_name, ti.quantity, p.name as product_name
      FROM transactions t
      JOIN stores s ON t.store_id = s.id
      JOIN transaction_items ti ON t.id = ti.transaction_id
      JOIN products p ON ti.product_id = p.id
      WHERE t.type = 'inbound' AND t.status = 'completed'
      ORDER BY t.date DESC
      LIMIT 5
    `).all();

    res.json(success({
      totalQuantity: totalInventory.total,
      totalValue: totalValue.total,
      storeStats,
      warningCount: warningCount.count,
      recentInbound
    }));
  });

  // 库存总览统计（按需求文档）
  app.get("/api/statistics/inventory-overview", (req, res) => {
    const { startTime, endTime, storeId } = req.query;
    let query = `
      SELECT s.id as storeId, s.name as storeName, 
        COALESCE(SUM(i.quantity), 0) as totalStock,
        COALESCE(SUM(i.quantity * p.price), 0) as totalAmount
      FROM stores s
      LEFT JOIN inventory i ON s.id = i.store_id
      LEFT JOIN products p ON i.product_id = p.id
    `;
    const params: any[] = [];
    if (storeId) {
      query += " WHERE s.id = ?";
      params.push(storeId);
    }
    query += " GROUP BY s.id";
    const data = db.prepare(query).all(...params);
    res.json(success(data));
  });

  // ============================
  // 操作日志
  // ============================
  app.get("/api/logs", (req, res) => {
    const logs = db.prepare(`
      SELECT l.*, u.username, u.real_name
      FROM operation_log l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.create_time DESC
      LIMIT 100
    `).all();
    res.json(success(logs));
  });

  // ============================
  // Vite middleware (前端)
  // ============================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
