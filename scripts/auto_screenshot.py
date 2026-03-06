import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.options import Options

# 获取当前脚本所在目录
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCREENSHOT_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), 'screenshots')
BASE_URL = 'http://localhost:5173'

# 确保截图目录存在
if not os.path.exists(SCREENSHOT_DIR):
    os.makedirs(SCREENSHOT_DIR)

# 配置需要截图的页面路由清单
PAGES_TO_CAPTURE = [
    {"name": "工作台_Dashboard", "url": "/"},
    {"name": "基础信息_门店管理", "url": "/stores"},
    {"name": "基础信息_商品管理", "url": "/products"},
    {"name": "基础信息_供应商管理", "url": "/suppliers"},
    {"name": "基础信息_用户管理", "url": "/users"},
    {"name": "库存业务_采购入库", "url": "/inbound"},
    {"name": "库存业务_销售出库", "url": "/outbound"},
    {"name": "库存业务_跨店调拨", "url": "/transfer"},
    {"name": "库存业务_库存盘点", "url": "/counting"},
    {"name": "库存业务_报损报溢", "url": "/adjustment"},
    {"name": "统计分析_库存总览", "url": "/stock-overview"},
    {"name": "统计分析_周转率分析", "url": "/turnover"},
    {"name": "统计分析_临期预警", "url": "/warning"},
    {"name": "统计分析_缺货统计", "url": "/shortage"},
]

def run_screenshots():
    print('🚀 开始执行 Python (Selenium) 自动化截图脚本...')

    # 配置 Edge 浏览器选项 (如果打算用 Chrome，换成 webdriver.ChromeOptions())
    options = Options()
    # options.add_argument('--headless')  # 如果不想看浏览器弹出来，可以取消注释这行使用无头模式
    options.add_argument('--window-size=1440,900')
    
    # 也可以指定本地浏览器的路径，如果环境变量 PATH 里没有的话
    # options.binary_location = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    try:
        # 启动 WebDriver
        driver = webdriver.Edge(options=options)
        wait = WebDriverWait(driver, 10)

        # 1. 登录流程
        print(f"正在打开登录页: {BASE_URL}/login")
        driver.get(f"{BASE_URL}/login")
        
        # 等待页面加载完成 (隐式等待或简单休眠)
        time.sleep(2)
        
        # 截取登录页
        login_screenshot_path = os.path.join(SCREENSHOT_DIR, '00_登录页面.png')
        driver.save_screenshot(login_screenshot_path)
        
        # 执行自动登录
        print('正在执行自动登录...')
        username_input = wait.until(EC.presence_of_element_located((By.ID, "login_form_username")))
        password_input = driver.find_element(By.ID, "login_form_password")
        submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

        username_input.send_keys("admin")
        password_input.send_keys("admin123")
        submit_button.click()
        
        # 等待页面跳转，检查 URL 变化或主要元素渲染 (随便找一个一定存在的侧边栏或 Layout)
        time.sleep(3)
        print('✅ 登录成功，开始遍历业务页面截取...')

        # 2. 遍历各个模块并截图
        for i, target in enumerate(PAGES_TO_CAPTURE):
            full_url = f"{BASE_URL}{target['url']}"
            print(f"[{i + 1}/{len(PAGES_TO_CAPTURE)}] 正在截取: {target['name']} ({full_url})")
            
            # 跳转到对应模块
            driver.get(full_url)
            
            # 等待表格、图表、动画等渲染完成
            time.sleep(2) 
            
            # 处理文件名编号
            idx_str = str(i + 1).zfill(2)
            filename = f"{idx_str}_{target['name']}.png"
            filepath = os.path.join(SCREENSHOT_DIR, filename)
            
            # 使用 JS 设置全屏高度以应对长图 (简单方案)
            width = driver.execute_script("return document.body.parentNode.scrollWidth")
            height = driver.execute_script("return document.body.parentNode.scrollHeight")
            driver.set_window_size(width, height)
            
            driver.save_screenshot(filepath)
            
            # 存完改回来
            driver.set_window_size(1440, 900)
            print(f"   📸 保存成功: {filename}")

        print('🎉 所有页面自动化截图已完成！文件保存在 screenshots 目录下。')

    except Exception as e:
        print('❌ 截图脚本执行发生异常:', e)
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    run_screenshots()
