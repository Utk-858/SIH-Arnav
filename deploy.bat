@echo off
REM SolveAI Deployment Script for Windows
REM This script handles deployment of both frontend and backend services

echo 🚀 Starting SolveAI deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    exit /b 1
)

echo [SUCCESS] Docker and Docker Compose are installed

REM Check environment files
echo [INFO] Checking environment files...

if not exist ".env.production" (
    echo [WARNING] .env.production not found. Creating from template...
    copy env.example .env.production
    echo [WARNING] Please update .env.production with your production values
)

if not exist "backend\.env.production" (
    echo [WARNING] backend\.env.production not found. Creating from template...
    copy backend\env.example backend\.env.production
    echo [WARNING] Please update backend\.env.production with your production values
)

echo [SUCCESS] Environment files are ready

REM Build and deploy services
echo [INFO] Building and deploying services...

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down

REM Build images
echo [INFO] Building Docker images...
docker-compose build --no-cache

REM Start services
echo [INFO] Starting services...
docker-compose up -d

REM Wait for services to be healthy
echo [INFO] Waiting for services to be healthy...
timeout /t 30 /nobreak >nul

REM Check service health
echo [INFO] Checking service health...

REM Check backend health
curl -f http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Backend service is healthy
) else (
    echo [ERROR] Backend service is not responding
    exit /b 1
)

REM Check frontend health (basic connectivity check)
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Frontend service is responding
) else (
    echo [WARNING] Frontend service may not be fully ready yet
)

echo [SUCCESS] Services deployed successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8080
echo 💚 Health Check: http://localhost:8080/health
echo.
echo To view logs:
echo   docker-compose logs -f
echo.
echo To stop services:
echo   docker-compose down

goto :eof

REM Handle command line arguments
if "%1"=="stop" goto stop_services
if "%1"=="restart" goto restart_services
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
goto main

:stop_services
echo [INFO] Stopping services...
docker-compose down
echo [SUCCESS] Services stopped
goto :eof

:restart_services
echo [INFO] Restarting services...
docker-compose restart
echo [INFO] Checking service health...
curl -f http://localhost:8080/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Services restarted
) else (
    echo [ERROR] Services failed to restart properly
)
goto :eof

:show_logs
docker-compose logs -f
goto :eof

:show_status
docker-compose ps
goto :eof

:main
goto :eof