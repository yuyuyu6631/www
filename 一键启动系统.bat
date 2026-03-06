@echo off
CHCP 65001
echo ==========================================
echo   连锁零售门店库存管理系统 - 一键启动脚本
echo ==========================================

echo.
echo [1/3] 正在启动后端 Python FastAPI 服务...
start "库存系统-后端服务" cmd /k "cd /d %~dp0backend && py main.py"
timeout /t 3 >nul

echo.
echo [2/3] 正在启动前端 React 界面...
start "库存系统-前端界面" cmd /k "cd /d %~dp0 && npm run dev"
timeout /t 5 >nul

echo.
echo [3/3] 正在打开浏览器访问系统...
start http://localhost:5173/

echo.
echo ==========================================
echo   系统已启动！
echo   后端地址: http://127.0.0.1:8000
echo   前端地址: http://localhost:5173
echo   演示账号: admin / admin123
echo ==========================================
pause
