@echo off
cd /d "%~dp0"
set "ROOT=%~dp0"
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LINK=%STARTUP%\UK San-Andreas Helper.bat"

> "%LINK%" echo @echo off
>> "%LINK%" echo start "" "%ROOT%standalone.html"

echo Готово!
echo Программа будет открываться при каждом входе в Windows.
echo Файл: %LINK%
pause
