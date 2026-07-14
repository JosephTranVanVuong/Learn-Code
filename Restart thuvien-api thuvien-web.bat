@echo off
echo Dang khoi dong lai thuvien-api va thuvien-web...
echo.
pm2 restart thuvien-api thuvien-web
echo.
echo Trang thai hien tai:
pm2 list
echo.
pause
