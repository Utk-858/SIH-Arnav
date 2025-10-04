#!/bin/bash

# SolveAI Deployment Script
# This script handles deployment of both frontend and backend services

set -e

echo "🚀 Starting SolveAI deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

# Check environment files
check_env_files() {
    print_status "Checking environment files..."

    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Creating from template..."
        cp env.example .env.production
        print_warning "Please update .env.production with your production values"
    fi

    if [ ! -f "backend/.env.production" ]; then
        print_warning "backend/.env.production not found. Creating from template..."
        cp backend/env.example backend/.env.production
        print_warning "Please update backend/.env.production with your production values"
    fi

    print_success "Environment files are ready"
}

# Build and deploy services
deploy_services() {
    print_status "Building and deploying services..."

    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose down || true

    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache

    # Start services
    print_status "Starting services..."
    docker-compose up -d

    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    check_service_health

    print_success "Services deployed successfully!"
}

# Check service health
check_service_health() {
    print_status "Checking service health..."

    # Check backend health
    if curl -f http://localhost:8080/health &> /dev/null; then
        print_success "Backend service is healthy"
    else
        print_error "Backend service is not responding"
        exit 1
    fi

    # Check frontend health (basic connectivity check)
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend service is responding"
    else
        print_warning "Frontend service may not be fully ready yet"
    fi
}

# Show deployment info
show_deployment_info() {
    print_success "Deployment completed!"
    echo ""
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8080"
    echo "💚 Health Check: http://localhost:8080/health"
    echo ""
    echo "To view logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "To stop services:"
    echo "  docker-compose down"
}

# Main deployment function
main() {
    print_status "SolveAI Deployment Script"
    echo "=========================="

    check_docker
    check_env_files
    deploy_services
    show_deployment_info
}

# Handle command line arguments
case "${1:-}" in
    "stop")
        print_status "Stopping services..."
        docker-compose down
        print_success "Services stopped"
        ;;
    "restart")
        print_status "Restarting services..."
        docker-compose restart
        check_service_health
        print_success "Services restarted"
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        main
        ;;
esac