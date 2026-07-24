@echo off
cd /d "%~dp0"
echo GTA 5 RP - UK San-Andreas Helper
echo.

python --version >nul 2>&1
if errorlevel 1 (
  echo Python не найден. Установи Python 3.10+ с https://python.org
  pause
  exit /b 1
)

echo Установка зависимостей...
python -m pip install -r requirements.txt -q

echo.
echo Сервер: http://127.0.0.1:8000
echo Закрой окно для остановки.
echo.

python -m uvicorn src.app:app --host 127.0.0.1 --port 8000
