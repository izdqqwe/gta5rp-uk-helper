@echo off
cd /d "%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT=%DESKTOP%\UK Helper.bat"

copy /Y "%~dp0open.bat" "%SHORTCUT%" >nul

echo Ярлык создан на рабочем столе: UK Helper.bat
pause
