@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  echo Python 3 launcher not found. Install Python 3 or open FlowCraft_demo.html.
  pause
  exit /b 1
)
start "FlowCraft local server" cmd /k "py -m http.server 8000"
timeout /t 2 /nobreak >nul
start "" http://localhost:8000
endlocal
