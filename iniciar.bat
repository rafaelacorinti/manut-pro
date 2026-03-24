@echo off
echo =====================================
echo   Manut-Pro - Iniciando sistema
echo =====================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo Login:    admin@manutpro.com / admin123
echo.

start "Manut-Pro Backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"
echo Aguardando backend iniciar...
timeout /t 4 /nobreak >nul

start "Manut-Pro Frontend" cmd /k "cd /d "%~dp0frontend" && npx vite --port 5173"
echo Aguardando frontend iniciar...
timeout /t 6 /nobreak >nul

start "" "http://localhost:5173"
echo.
echo Sistema iniciado! Pressione qualquer tecla para fechar esta janela.
pause >nul
