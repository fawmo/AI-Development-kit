@echo off
setlocal
cd /d "%~dp0"

set "MSG=%~1"
if "%MSG%"=="" (
    set /p "MSG=Enter commit message (Press Enter for default): "
)
if "%MSG%"=="" (
    set "MSG=chore(toolkit): sync updates"
)

echo.
echo ==> Staging changes...
git add .

echo ==> Committing: "%MSG%"
git commit -m "%MSG%"
if errorlevel 1 goto end

echo ==> Pushing to remote...
git push

:end
echo.
echo All done!
endlocal
