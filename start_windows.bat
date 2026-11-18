@echo off
cd /d "%~dp0"
echo FlowCraft — локальный сервер для BPMN-конструктора
start "" http://localhost:8000
py -m http.server 8000
if errorlevel 1 (
  echo Не удалось запустить Python. Попробуйте команду: python -m http.server 8000
  pause
)
