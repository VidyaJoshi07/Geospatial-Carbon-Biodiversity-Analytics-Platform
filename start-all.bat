@echo off
echo ===================================================
echo   Starting DARUKAA.EARTH Full-Stack Application
echo ===================================================

set PYTHON_CMD=C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe
set NODE_DIR=C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64
set PATH=%NODE_DIR%;%PATH%

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "Darukaa Backend API" cmd /k "cd backend && "%PYTHON_CMD%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 >nul

echo [2/3] Starting Vite React Frontend on http://127.0.0.1:5173 ...
start "Darukaa Frontend Vite" cmd /k "cd frontend && "%NODE_DIR%\node.exe" ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"

timeout /t 2 >nul

echo [3/3] Opening Browser at http://127.0.0.1:5173/ ...
start http://127.0.0.1:5173/

echo ===================================================
echo   Darukaa.Earth is now running!
echo   Frontend: http://127.0.0.1:5173/
echo   API Docs: http://127.0.0.1:8000/docs
echo ===================================================
