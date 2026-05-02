@echo off
echo Starting TOEIC Brain App...
echo.

cd /d "%~dp0backend"
start "Backend - FastAPI" cmd /k "python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

cd /d "%~dp0frontend"
start "Frontend - Next.js" cmd /k "npm run dev"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
