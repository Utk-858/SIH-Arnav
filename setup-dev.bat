@echo off
setlocal enabledelayedexpansion

echo 🚀 Setting up SolveAI development environment...

REM Colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js v18 or higher first.
    pause
    exit /b 1
)

echo ✅ Node.js is installed

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is installed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Frontend dependencies installation failed
    pause
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ❌ Backend dependencies installation failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Dependencies installed successfully

REM Copy environment files
echo 📝 Setting up environment files...

if not exist ".env.local" (
    copy env.example .env.local
    echo 📝 Created .env.local from template. Please update with your actual values.
)

if not exist "backend\.env" (
    copy backend\env.example backend\.env
    echo 📝 Created backend\.env from template. Please update with your actual values.
)

echo ✅ Environment files set up

REM Build backend
echo 🔨 Building backend...
cd backend
call npm run build
if errorlevel 1 (
    echo ❌ Backend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Backend built successfully

echo 🎉 Development environment setup completed!
echo.
echo 📝 Next steps:
echo 1. Update .env.local with your Firebase configuration
echo 2. Update backend\.env with your Google Cloud configuration
echo 3. Run 'docker-compose up' to start the development environment
echo 4. Or run 'npm run dev' to start the frontend and 'cd backend ^&^& npm run dev' for the backend
echo.
echo 🐳 To run with Docker:
echo docker-compose up --build
echo.
echo 🔧 To run locally:
echo Terminal 1: npm run dev
echo Terminal 2: cd backend ^&^& npm run dev

pause
