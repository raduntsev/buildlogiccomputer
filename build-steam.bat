@echo off
cd /d %~dp0
python build.py || goto :err
copy /y dist\offline.html desktop\index.html
cd desktop
call npm install || goto :err
call npx electron-builder --win dir portable --x64 || goto :err
echo.
echo Done: desktop\dist\win-unpacked
pause
exit /b 0
:err
echo Build failed.
pause
exit /b 1
