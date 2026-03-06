import sqlite3
import base64
import json
import logging
import os
from datetime import datetime
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException, Request, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="连锁门店库存管理系统 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = os.path.join(os.path.dirname(__file__), "inventory.db")

# ========== 工具函数 ==========
def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def success(data: Any, message: str = "操作成功"):
    return {"code": 200, "message": message, "data": data}

def fail(code: int, message: str):
    return {"code": code, "message": message, "data": None}

def generate_order_no(prefix: str):
    now = datetime.now()
    import random
    ts = now.strftime("%Y%m%d%H%M%S")
    rand = f"{random.randint(0, 9999):04d}"
    return f"{prefix}{ts}{rand}"

# ========== 数据库初始化与假数据 ==========
@app.on_event("startup")
def startup_event():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.executescript("""
            CREATE TABLE IF NOT EXISTS stores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, address TEXT, contact_person TEXT, phone TEXT, status TEXT DEFAULT 'active');
            CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, parent_id INTEGER, FOREIGN KEY (parent_id) REFERENCES categories(id));
            CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, category_id INTEGER, spec TEXT, expiry_days INTEGER, barcode TEXT UNIQUE, alert_threshold INTEGER DEFAULT 10, price REAL, FOREIGN KEY (category_id) REFERENCES categories(id));
            CREATE TABLE IF NOT EXISTS suppliers (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, contact_person TEXT, phone TEXT, address TEXT);
            CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, real_name TEXT, role TEXT NOT NULL, store_id INTEGER, status TEXT DEFAULT 'active', FOREIGN KEY (store_id) REFERENCES stores(id));
            CREATE TABLE IF NOT EXISTS inventory (store_id INTEGER, product_id INTEGER, quantity INTEGER DEFAULT 0, PRIMARY KEY (store_id, product_id), FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (product_id) REFERENCES products(id));
            CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL, order_no TEXT UNIQUE, store_id INTEGER, target_store_id INTEGER, supplier_id INTEGER, channel TEXT, user_id INTEGER, date TEXT DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'pending', remark TEXT, FOREIGN KEY (store_id) REFERENCES stores(id), FOREIGN KEY (target_store_id) REFERENCES stores(id), FOREIGN KEY (supplier_id) REFERENCES suppliers(id), FOREIGN KEY (user_id) REFERENCES users(id));
            CREATE TABLE IF NOT EXISTS transaction_items (id INTEGER PRIMARY KEY AUTOINCREMENT, transaction_id INTEGER, product_id INTEGER, quantity INTEGER, batch_no TEXT, expiry_date TEXT, FOREIGN KEY (transaction_id) REFERENCES transactions(id), FOREIGN KEY (product_id) REFERENCES products(id));
            CREATE TABLE IF NOT EXISTS operation_log (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, operation TEXT, detail TEXT, create_time TEXT DEFAULT CURRENT_TIMESTAMP);
        """)
        try: cursor.execute("ALTER TABLE transactions ADD COLUMN channel TEXT") 
        except sqlite3.OperationalError: pass

        if cursor.execute("SELECT COUNT(*) FROM stores").fetchone()[0] == 0:
            cursor.executemany("INSERT INTO stores (name, address, contact_person, phone) VALUES (?, ?, ?, ?)", [("总部旗舰店", "北京市朝阳区", "张经理", "13800138000"), ("上海分店", "上海市黄浦区", "李店长", "13900139000"), ("广州分店", "广东省广州市天河区", "王店长", "13700137000")])
            cursor.executemany("INSERT INTO categories (name) VALUES (?)", [("食品饮料",), ("日用百货",), ("生鲜果蔬",)])
            cursor.executemany("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)", [("矿泉水 500ml", 1, "24瓶/箱", 365, "6901234567890", 2.0, 50), ("洗发水 400ml", 2, "瓶", 1095, "6909876543210", 35.0, 20), ("可乐 330ml", 1, "24罐/箱", 270, "6901234567891", 3.0, 30), ("牙膏 120g", 2, "支", 730, "6909876543211", 12.0, 15), ("苹果", 3, "500g", 7, "6901234567892", 8.0, 100)])
            cursor.executemany("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?, ?, ?, ?)", [("哇哈哈集团", "陈经理", "0571-12345678", "浙江省杭州市"), ("联合利华", "张经理", "021-87654321", "上海市浦东新区"), ("本地水果批发", "刘老板", "13600136000", "北京市新发地")])
            cursor.executemany("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?, ?, ?, ?, ?)", [("admin", "admin123", "系统管理员", "admin", 1), ("manager", "manager123", "王店长", "manager", 2), ("staff01", "staff123", "赵店员", "staff", 1)])
            cursor.executemany("INSERT INTO inventory (store_id, product_id, quantity) VALUES (?, ?, ?)", [(1, 1, 200), (1, 2, 50), (1, 3, 150), (1, 4, 30), (1, 5, 80), (2, 1, 100), (2, 2, 25), (2, 3, 80), (3, 1, 60), (3, 5, 5)])
            cursor.execute("INSERT INTO transactions (type, order_no, store_id, supplier_id, user_id, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)", ("inbound", "RK202603010001", 1, 1, 1, "completed", "2026-03-01 10:00:00"))
            t1 = cursor.lastrowid
            cursor.executemany("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)", [(t1, 1, 200, "B20260301", "2027-03-01"), (t1, 3, 150, "B20260301", "2026-12-01")])
            cursor.execute("INSERT INTO transactions (type, order_no, store_id, supplier_id, user_id, status, date) VALUES (?, ?, ?, ?, ?, ?, ?)", ("inbound", "RK202603020001", 2, 2, 2, "completed", "2026-03-02 14:30:00"))
            cursor.execute("INSERT INTO transaction_items (transaction_id, product_id, quantity, batch_no, expiry_date) VALUES (?, ?, ?, ?, ?)", (cursor.lastrowid, 2, 25, "B20260302", "2029-03-02"))
        conn.commit()

# ========== Pydantic 实体 ==========
class LoginReq(BaseModel):
    username: str
    password: str

class StoreReq(BaseModel):
    name: Optional[str] = None
    storeName: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact: Optional[str] = None
    phone: Optional[str] = None
    status: str = 'active'

class UserReq(BaseModel):
    username: str
    password: str
    real_name: Optional[str] = None
    role: str
    store_id: Optional[int] = None

class ProductReq(BaseModel):
    name: str
    category_id: Optional[int] = None
    spec: Optional[str] = None
    expiry_days: Optional[int] = None
    barcode: Optional[str] = None
    price: Optional[float] = None
    alert_threshold: int = 10

class SupplierReq(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

# ========== 基础模块 ==========
@app.post("/api/login")
def login(req: LoginReq):
    with get_db() as c:
        u = c.execute("SELECT * FROM users WHERE username = ? AND password = ?", (req.username, req.password)).fetchone()
        if u:
            ud = dict(u); ud.pop("password", None)
            ts = int(datetime.now().timestamp() * 1000)
            token = base64.b64encode(json.dumps({"userId": ud["id"], "username": ud["username"], "role": ud["role"], "ts": ts}).encode()).decode()
            return success({"token": token, "user": ud}, "登录成功")
        return JSONResponse(status_code=401, content=fail(401, "用户名或密码错误"))

@app.get("/api/stores")
def get_stores():
    return success([dict(r) for r in get_db().execute("SELECT * FROM stores").fetchall()])

@app.post("/api/stores")
@app.post("/api/store/add")
def add_store(req: StoreReq):
    fn, fc = req.storeName or req.name, req.contact or req.contact_person
    if not fn: return JSONResponse(status_code=400, content=fail(400, "门店名称不能为空"))
    with get_db() as c:
        cursor = c.cursor()
        cursor.execute("INSERT INTO stores (name, address, contact_person, phone, status) VALUES (?,?,?,?,?)", (fn, req.address, fc, req.phone, req.status))
        c.commit(); return success(cursor.lastrowid, "新增成功")

@app.put("/api/stores/{sid}")
@app.delete("/api/stores/{sid}")
def edit_store(sid: int, req: StoreReq = None, request: Request = None):
    with get_db() as c:
        if request.method == "DELETE":
            c.execute("DELETE FROM stores WHERE id=?", (sid,))
            c.commit(); return success(None, "删除成功")
        c.execute("UPDATE stores SET name=?, address=?, contact_person=?, phone=?, status=? WHERE id=?", (req.name, req.address, req.contact_person, req.phone, req.status, sid))
        c.commit(); return success(None, "更新成功")

@app.get("/api/users")
def get_users(): return success([dict(r) for r in get_db().execute("SELECT u.id, u.username, u.real_name, u.role, u.store_id, u.status, s.name as store_name FROM users u LEFT JOIN stores s ON u.store_id = s.id").fetchall()])
@app.post("/api/users")
def add_user(req: UserReq):
    try:
        with get_db() as c:
            cursor = c.cursor()
            cursor.execute("INSERT INTO users (username, password, real_name, role, store_id) VALUES (?,?,?,?,?)", (req.username, req.password, req.real_name, req.role, req.store_id))
            c.commit(); return success(cursor.lastrowid, "新增成功")
    except sqlite3.IntegrityError: return JSONResponse(status_code=400, content=fail(400, "已存在"))

# -------- 商品管理 --------
@app.get("/api/products")
def get_products(): return success([dict(r) for r in get_db().execute("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id=c.id").fetchall()])

@app.post("/api/products")
def add_product(req: ProductReq):
    try:
        with get_db() as c:
            cursor = c.cursor()
            cursor.execute("INSERT INTO products (name, category_id, spec, expiry_days, barcode, price, alert_threshold) VALUES (?,?,?,?,?,?,?)", (req.name, req.category_id, req.spec, req.expiry_days, req.barcode, req.price, req.alert_threshold))
            c.commit(); return success(cursor.lastrowid, "成功")
    except sqlite3.IntegrityError: return JSONResponse(status_code=400, content=fail(400, "条码存在"))

@app.put("/api/products/{pid}")
@app.delete("/api/products/{pid}")
def edit_product(pid: int, req: ProductReq = None, request: Request = None):
    with get_db() as c:
        if request.method == "DELETE":
            c.execute("DELETE FROM products WHERE id=?", (pid,)); c.commit(); return success(None)
        c.execute("UPDATE products SET name=?, category_id=?, spec=?, expiry_days=?, barcode=?, price=?, alert_threshold=? WHERE id=?", (req.name, req.category_id, req.spec, req.expiry_days, req.barcode, req.price, req.alert_threshold, pid))
        c.commit(); return success(None)

@app.get("/api/categories")
def get_cats(): return success([dict(r) for r in get_db().execute("SELECT * FROM categories").fetchall()])

# -------- 供应商 --------
@app.get("/api/suppliers")
def get_supps(): return success([dict(r) for r in get_db().execute("SELECT * FROM suppliers").fetchall()])

@app.post("/api/suppliers")
def add_supps(req: SupplierReq):
    with get_db() as c:
        cursor = c.cursor(); cursor.execute("INSERT INTO suppliers (name, contact_person, phone, address) VALUES (?,?,?,?)", (req.name, req.contact_person, req.phone, req.address))
        c.commit(); return success(cursor.lastrowid)

@app.delete("/api/suppliers/{sid}")
def del_supps(sid:int):
    with get_db() as c: c.execute("DELETE FROM suppliers WHERE id=?",(sid,)); c.commit(); return success(None)

# ========== 库存核心业务 ==========
@app.get("/api/inventory")
def get_inv(store_id: Optional[int] = None):
    q = "SELECT i.*, p.name as product_name, p.barcode, p.spec, p.alert_threshold, p.price, s.name as store_name FROM inventory i JOIN products p ON i.product_id=p.id JOIN stores s ON i.store_id=s.id"
    params = []
    if store_id: q += " WHERE i.store_id = ?"; params.append(store_id)
    return success([dict(r) for r in get_db().execute(q, params).fetchall()])

@app.get("/api/inventory/detail")
def get_inv_det(storeId: int, productId: int):
    r = get_db().execute("SELECT i.*, p.name as product_name, s.name as store_name FROM inventory i JOIN products p ON i.product_id=p.id JOIN stores s ON i.store_id=s.id WHERE i.store_id=? AND i.product_id=?", (storeId, productId)).fetchone()
    return success(dict(r) if r else {"store_id":storeId,"product_id":productId,"quantity":0,"stockNum":0})

# ---- 事务基类字典请求 ----
@app.get("/api/transactions/inbound")
def tx_inb(): return success([dict(r) for r in get_db().execute("SELECT t.*, s.name as store_name, sp.name as supplier_name FROM transactions t LEFT JOIN stores s ON t.store_id=s.id LEFT JOIN suppliers sp ON t.supplier_id=sp.id WHERE t.type='inbound' ORDER BY t.date DESC").fetchall()])

@app.get("/api/transactions/outbound")
def tx_out(): return success([dict(r) for r in get_db().execute("SELECT t.*, s.name as store_name FROM transactions t LEFT JOIN stores s ON t.store_id=s.id WHERE t.type='outbound' ORDER BY t.date DESC").fetchall()])

@app.post("/api/inventory/inbound")
def inbound_post(payload: dict = Body(...)):
    store_id = payload.get("storeId") or payload.get("store_id")
    supp_id = payload.get("supplierId") or payload.get("supplier_id")
    items = payload.get("items", [])
    if not store_id or not items: return JSONResponse(status_code=400, content=fail(400, "参数空"))
    
    orderNo = generate_order_no("RK")
    with get_db() as c:
        cursor = c.cursor()
        cursor.execute("INSERT INTO transactions(type, order_no, store_id, supplier_id, user_id, status, remark) VALUES(?,?,?,?,?,?,?)",("inbound", orderNo, store_id, supp_id, 1, "pending", payload.get("remark")))
        tid = cursor.lastrowid
        for it in items:
            pid = it.get("productId") or it.get("product_id")
            num = it.get("num") or it.get("quantity")
            bno = it.get("batchNo") or it.get("batch_no")
            exp = it.get("expiryDate") or it.get("expiry_date")
            cursor.execute("INSERT INTO transaction_items(transaction_id, product_id, quantity, batch_no, expiry_date) VALUES(?,?,?,?,?)", (tid, pid, num, bno, exp))
        cursor.execute("INSERT INTO operation_log(user_id, operation, detail) VALUES(?,?,?)", (1, "创建采购入库", orderNo))
        c.commit(); return success(orderNo)

@app.post("/api/inventory/inbound/audit")
def inbound_audit(payload: dict = Body(...)):
    with get_db() as c:
        cur = c.cursor()
        txn = cur.execute("SELECT * FROM transactions WHERE order_no=? AND type='inbound'", (payload.get("orderNo"),)).fetchone()
        if not txn: return JSONResponse(status_code=404, content=fail(404, "单据不存在"))
        if payload.get("status", "").lower() == "approved":
            items = cur.execute("SELECT * FROM transaction_items WHERE transaction_id=?",(txn["id"],)).fetchall()
            for it in items:
                ex = cur.execute("SELECT * FROM inventory WHERE store_id=? AND product_id=?",(txn["store_id"], it["product_id"])).fetchone()
                if ex: cur.execute("UPDATE inventory SET quantity = quantity + ? WHERE store_id=? AND product_id=?",(it["quantity"],txn["store_id"],it["product_id"]))
                else: cur.execute("INSERT INTO inventory(store_id, product_id, quantity) VALUES(?,?,?)",(txn["store_id"],it["product_id"],it["quantity"]))
            cur.execute("UPDATE transactions SET status='completed' WHERE id=?", (txn["id"],))
        else:
            cur.execute("UPDATE transactions SET status='cancelled' WHERE id=?", (txn["id"],))
        c.commit(); return success(None)

@app.post("/api/inventory/outbound")
def outbound_post(payload: dict = Body(...)):
    store_id = payload.get("storeId") or payload.get("store_id")
    items = payload.get("items", [])
    if not store_id or not items: return JSONResponse(status_code=400, content=fail(400, "空"))
    
    with get_db() as c:
        cur = c.cursor()
        for it in items:
            pid = it.get("productId") or it.get("product_id")
            num = int(it.get("num") or it.get("quantity") or 0)
            inv = cur.execute("SELECT quantity FROM inventory WHERE store_id=? AND product_id=?",(store_id,pid)).fetchone()
            if not inv or inv["quantity"] < num:
                return JSONResponse(status_code=400, content=fail(400, f"库存不足 {pid}"))
                
        orderNo = generate_order_no("XS")
        cur.execute("INSERT INTO transactions(type, order_no, store_id, channel, user_id, status, remark) VALUES(?,?,?,?,?,?,?)",("outbound", orderNo, store_id, payload.get("channel","offline"), 1, "completed", payload.get("remark")))
        tid = cur.lastrowid
        for it in items:
            pid = it.get("productId") or it.get("product_id")
            num = int(it.get("num") or it.get("quantity") or 0)
            cur.execute("INSERT INTO transaction_items(transaction_id, product_id, quantity) VALUES(?,?,?)", (tid, pid, num))
            cur.execute("UPDATE inventory SET quantity = quantity - ? WHERE store_id=? AND product_id=?",(num, store_id, pid))
        c.commit(); return success(orderNo)

@app.get("/api/transactions/transfer")
def tx_db(): return success([dict(r) for r in get_db().execute("SELECT t.*, s1.name as from_store, s2.name as to_store FROM transactions t LEFT JOIN stores s1 ON t.store_id=s1.id LEFT JOIN stores s2 ON t.target_store_id=s2.id WHERE t.type='transfer' ORDER BY t.date DESC").fetchall()])

@app.post("/api/inventory/transfer")
def transfer_post(payload: dict = Body(...)):
    fo = payload.get("fromStoreId") or payload.get("from_store_id")
    to = payload.get("toStoreId") or payload.get("to_store_id")
    its = payload.get("items", [])
    if fo == to: return JSONResponse(status_code=400, content=fail(400, "不可互调"))
    orderNo = generate_order_no("DB")
    with get_db() as c:
        cur = c.cursor()
        cur.execute("INSERT INTO transactions(type, order_no, store_id, target_store_id, user_id, status) VALUES(?,?,?,?,?,?)",("transfer", orderNo, fo, to, 1, "pending"))
        tid = cur.lastrowid
        for it in its:
            pid = it.get("productId") or it.get("product_id"); num = it.get("num") or it.get("quantity")
            cur.execute("INSERT INTO transaction_items(transaction_id, product_id, quantity) VALUES(?,?,?)", (tid,pid,num))
        c.commit(); return success(orderNo)

@app.post("/api/inventory/transfer/audit")
def transfer_audit(payload: dict = Body(...)):
    with get_db() as c:
        cur = c.cursor()
        txn = cur.execute("SELECT * FROM transactions WHERE order_no=? AND type='transfer'", (payload.get("orderNo"),)).fetchone()
        if payload.get("status", "").lower() == "approved":
            items = cur.execute("SELECT * FROM transaction_items WHERE transaction_id=?",(txn["id"],)).fetchall()
            for it in items:
                cur.execute("UPDATE inventory SET quantity=quantity-? WHERE store_id=? AND product_id=?",(it["quantity"],txn["store_id"],it["product_id"]))
                if cur.execute("SELECT 1 FROM inventory WHERE store_id=? AND product_id=?",(txn["target_store_id"],it["product_id"])).fetchone():
                    cur.execute("UPDATE inventory SET quantity=quantity+? WHERE store_id=? AND product_id=?",(it["quantity"],txn["target_store_id"],it["product_id"]))
                else: cur.execute("INSERT INTO inventory(store_id,product_id,quantity) VALUES(?,?,?)",(txn["target_store_id"],it["product_id"],it["quantity"]))
            cur.execute("UPDATE transactions SET status='completed' WHERE id=?",(txn["id"],))
        else: cur.execute("UPDATE transactions SET status='cancelled' WHERE id=?",(txn["id"],))
        c.commit(); return success(None)

@app.get("/api/dashboard/stats")
def ds():
    with get_db() as c:
        tot = c.execute("SELECT COALESCE(SUM(quantity), 0) FROM inventory").fetchone()[0]
        val = c.execute("SELECT COALESCE(SUM(i.quantity * p.price), 0) FROM inventory i JOIN products p ON i.product_id=p.id").fetchone()[0]
        ss = [dict(r) for r in c.execute("SELECT s.name, COALESCE(SUM(i.quantity), 0) as quantity FROM stores s LEFT JOIN inventory i ON s.id=i.store_id GROUP BY s.id").fetchall()]
        wc = c.execute("SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id=p.id WHERE i.quantity <= p.alert_threshold").fetchone()[0]
        rc = [dict(r) for r in c.execute("SELECT t.order_no, t.date, s.name as store_name, ti.quantity, p.name as product_name FROM transactions t JOIN stores s ON t.store_id=s.id JOIN transaction_items ti ON t.id=ti.transaction_id JOIN products p ON ti.product_id=p.id WHERE t.type='inbound' AND t.status='completed' limit 5").fetchall()]
        return success({"totalQuantity":tot,"totalValue":val,"storeStats":ss,"warningCount":wc,"recentInbound":rc})

@app.get("/api/statistics/inventory-overview")
def io(storeId: Optional[int] = None):
    q = "SELECT s.id as storeId, s.name as storeName, COALESCE(SUM(i.quantity),0) as totalStock, COALESCE(SUM(i.quantity*p.price),0) as totalAmount FROM stores s LEFT JOIN inventory i ON s.id=i.store_id LEFT JOIN products p ON i.product_id=p.id"
    params = []
    if storeId: q += " WHERE s.id=?"; params.append(storeId)
    q += " GROUP BY s.id"
    return success([dict(r) for r in get_db().execute(q, params).fetchall()])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
