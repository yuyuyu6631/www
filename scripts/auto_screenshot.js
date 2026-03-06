import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
const BASE_URL = 'http://localhost:3000';

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PAGES_TO_CAPTURE = [
    { name: '工作台_Dashboard', url: '/' },
    { name: '基础信息_门店管理', url: '/stores' },
    { name: '基础信息_商品管理', url: '/products' },
    { name: '基础信息_供应商管理', url: '/suppliers' },
    { name: '基础信息_用户管理', url: '/users' },
    { name: '库存业务_采购入库', url: '/inbound' },
    { name: '库存业务_销售出库', url: '/outbound' },
    { name: '库存业务_跨店调拨', url: '/transfer' },
    { name: '库存业务_库存盘点', url: '/counting' },
    { name: '库存业务_报损报溢', url: '/adjustment' },
    { name: '统计分析_库存总览', url: '/stock-overview' },
    { name: '统计分析_周转率分析', url: '/turnover' },
    { name: '统计分析_临期预警', url: '/warning' },
    { name: '统计分析_缺货统计', url: '/shortage' },
];

async function runScreenshots() {
    console.log('🚀 开始执行自动化截图脚本...');

    // 尝试使用 Windows 自带的 Edge 或 Chrome 浏览器路径
    const possiblePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ];

    let executablePath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    const launchOptions = {
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    };

    if (executablePath) {
        console.log(`使用本地浏览器执行: ${executablePath}`);
        launchOptions.executablePath = executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    try {
        // 1. 登录流程
        console.log(`正在打开登录页: ${BASE_URL}/login`);
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });

        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '00_登录页面.png'), fullPage: true });

        // 输入账密并登录
        console.log('正在执行自动登录...');
        await page.type('#login_form_username', 'admin');
        await page.type('#login_form_password', 'admin123');
        await page.click('button[type="submit"]');

        // 等待跳转完成
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ 登录成功，开始遍历业务页面截取...');

        // 2. 遍历各内部页面截图
        for (let i = 0; i < PAGES_TO_CAPTURE.length; i++) {
            const target = PAGES_TO_CAPTURE[i];
            const fullUrl = `${BASE_URL}${target.url}`;
            console.log(`[${i + 1}/${PAGES_TO_CAPTURE.length}] 正在截取: ${target.name} (${fullUrl})`);

            await page.goto(fullUrl, { waitUntil: 'networkidle2' });

            // 等待可能的动画或图表渲染
            await sleep(1500);

            const filename = `${String(i + 1).padStart(2, '0')}_${target.name}.png`;
            await page.screenshot({
                path: path.join(SCREENSHOT_DIR, filename),
                fullPage: true
            });

            console.log(`   📸 保存成功: ${filename}`);
        }

        console.log('🎉 所有页面自动化截图已完成！文件保存在 screenshots 目录下。');

    } catch (error) {
        console.error('❌ 截图脚本执行发生异常:', error);
    } finally {
        await browser.close();
    }
}

runScreenshots();
