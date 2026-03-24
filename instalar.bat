@echo off
echo =====================================
echo   Manut-Pro - Instalando dependencias
echo =====================================

echo.
echo [1/2] Instalando backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do backend.
    pause
    exit /b 1
)

echo.
echo [2/2] Instalando frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias do frontend.
    pause
    exit /b 1
)

cd ..
echo.
echo =====================================
echo   Instalacao concluida!
echo   Execute: iniciar.bat
echo =====================================
pause
