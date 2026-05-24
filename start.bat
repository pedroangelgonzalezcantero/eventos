@echo off
echo.
echo ============================================
echo   SALON DE CELEBRACIONES - Sistema Web
echo ============================================
echo.
echo Verificando PostgreSQL (Docker)...
docker start eventos_postgres 2>nul || docker-compose up -d postgres
ping -n 4 127.0.0.1 > nul

echo Iniciando Backend (Spring Boot)...
start "Backend API" cmd /k "cd /d %~dp0 && mvn spring-boot:run"

echo Esperando que el backend arranque (15s)...
ping -n 16 127.0.0.1 > nul

echo Iniciando Frontend (React + Vite)...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  Backend:  http://localhost:8080
echo  Frontend: http://localhost:5173
echo  DB:       PostgreSQL (Docker) localhost:5432
echo.
echo  Usuarios:
echo   admin   / admin123  (Oficina)
echo   cocina  / cocina123 (Cocina)
echo   dj      / dj123     (DJ)
echo   sala    / sala123   (Sala)
echo ============================================
echo.
pause
