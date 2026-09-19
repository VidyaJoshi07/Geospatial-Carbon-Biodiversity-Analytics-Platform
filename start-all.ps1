# Darukaa.Earth Full-Stack Launcher (PowerShell)
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Starting DARUKAA.EARTH Full-Stack Application" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

$pythonCmd = "C:\Users\HP\AppData\Local\Programs\Python\Python312\python.exe"
$nodeDir = "C:\Users\HP\AppData\Local\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64"
$env:PATH = "$nodeDir;$env:PATH"

# 1. Start Backend in separate window
Write-Host "[1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; & '$pythonCmd' -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Frontend in separate window
Write-Host "[2/3] Starting Vite React Frontend on http://127.0.0.1:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; `$env:PATH = '$nodeDir;' + `$env:PATH; & '$nodeDir\node.exe' ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173"

Start-Sleep -Seconds 2

# 3. Open Browser
Write-Host "[3/3] Launching Web Browser..." -ForegroundColor Green
Start-Process "http://127.0.0.1:5173/"

Write-Host "===================================================" -ForegroundColor Green
Write-Host "  Darukaa.Earth is now running!" -ForegroundColor Green
Write-Host "  Frontend: http://127.0.0.1:5173/" -ForegroundColor White
Write-Host "  API Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green
