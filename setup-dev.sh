#!/bin/bash

# SolveAI Development Setup Script
# This script sets up the development environment for SolveAI

set -e  # Exit on any error

echo "🚀 Setting up SolveAI development environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18 or higher is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) is installed${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker Desktop first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Copy environment files
echo -e "${YELLOW}📝 Setting up environment files...${NC}"

if [ ! -f ".env.local" ]; then
    cp env.example .env.local
    echo -e "${YELLOW}📝 Created .env.local from template. Please update with your actual values.${NC}"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/env.example backend/.env
    echo -e "${YELLOW}📝 Created backend/.env from template. Please update with your actual values.${NC}"
fi

echo -e "${GREEN}✅ Environment files set up${NC}"

# Build backend
echo -e "${YELLOW}🔨 Building backend...${NC}"
cd backend
npm run build
cd ..

echo -e "${GREEN}✅ Backend built successfully${NC}"

echo -e "${GREEN}🎉 Development environment setup completed!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update .env.local with your Firebase configuration"
echo "2. Update backend/.env with your Google Cloud configuration"
echo "3. Run 'docker-compose up' to start the development environment"
echo "4. Or run 'npm run dev' to start the frontend and 'cd backend && npm run dev' for the backend"
echo ""
echo -e "${YELLOW}🐳 To run with Docker:${NC}"
echo "docker-compose up --build"
echo ""
echo -e "${YELLOW}🔧 To run locally:${NC}"
echo "Terminal 1: npm run dev"
echo "Terminal 2: cd backend && npm run dev"
