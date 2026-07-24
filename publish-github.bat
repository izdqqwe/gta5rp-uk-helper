@echo off
cd /d "%~dp0"
echo ========================================
echo  Публикация на GitHub Pages
echo ========================================
echo.

where git >nul 2>&1
if errorlevel 1 (
  echo Git не найден. Перезагрузи ПК после установки Git.
  pause
  exit /b 1
)

where gh >nul 2>&1
if errorlevel 1 (
  echo GitHub CLI не найден. Перезагрузи ПК или установи: winget install GitHub.cli
  pause
  exit /b 1
)

gh auth status >nul 2>&1
if errorlevel 1 (
  echo Сначала войди в GitHub:
  gh auth login
  pause
  exit /b 1
)

set /p REPO_NAME="Имя репозитория (Enter = gta5rp-uk-helper): "
if "%REPO_NAME%"=="" set REPO_NAME=gta5rp-uk-helper

if not exist .git (
  git init
  git branch -M main
)

git add index.html law-engine.js .nojekyll README.md
git commit -m "Publish UK San-Andreas Helper for GitHub Pages" 2>nul
if errorlevel 1 (
  git add -A
  git commit -m "Update UK San-Andreas Helper" 2>nul
)

gh repo view %REPO_NAME% >nul 2>&1
if errorlevel 1 (
  echo Создаю репозиторий %REPO_NAME%...
  gh repo create %REPO_NAME% --public --source=. --remote=origin --push
) else (
  git remote remove origin 2>nul
  for /f "delims=" %%i in ('gh api user -q .login') do set GH_USER=%%i
  git remote add origin https://github.com/%GH_USER%/%REPO_NAME%.git
  git push -u origin main
)

echo.
echo Включаю GitHub Pages...
for /f "delims=" %%i in ('gh api user -q .login') do set GH_USER=%%i
gh api -X POST "repos/%GH_USER%/%REPO_NAME%/pages" -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>nul
gh api -X PUT "repos/%GH_USER%/%REPO_NAME%/pages" -f "build_type=legacy" -f "source[branch]=main" -f "source[path]=/" 2>nul

set PAGE_URL=https://%GH_USER%.github.io/%REPO_NAME%/

echo.
echo ========================================
echo  ГОТОВО!
echo  Сайт: %PAGE_URL%
echo  Может открыться через 1-3 минуты.
echo ========================================
echo.
echo Добавь ссылку в закладки на телефоне.
pause
