# SolveAI Deployment Guide

This guide provides instructions for deploying the SolveAI Ayurvedic Diet Management platform, which consists of a Next.js frontend and a Node.js/Express backend API.

## Architecture Overview

- **Frontend**: Next.js application with TypeScript, Tailwind CSS, and Firebase integration
- **Backend**: Node.js/Express API with TypeScript, SQLite database, and Firebase Admin SDK
- **Database**: SQLite for food data, Firestore for user data
- **Deployment**: Docker containers with docker-compose orchestration

## Prerequisites

- Docker and Docker Compose installed
- Firebase project with Firestore enabled
- Google Cloud Project with necessary APIs enabled
- Service account key for Firebase Admin SDK

## Quick Start

### 1. Environment Setup

Copy and configure environment files:

```bash
# Frontend environment
cp env.example .env.production

# Backend environment
cp backend/env.example backend/.env.production
```

Update the following critical environment variables:

#### Frontend (.env.production)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

#### Backend (backend/.env.production)
```env
GOOGLE_CLOUD_PROJECT_ID=your_project_id
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_service_account_email
GOOGLE_MAPS_API_KEY=your_maps_api_key
JWT_SECRET=your_secure_secret
```

### 2. Deploy Locally

For local development and testing:

```bash
# Using bash (Linux/Mac)
./deploy.sh

# Using batch (Windows)
deploy.bat
```

This will:
- Build Docker images for both services
- Start containers with proper networking
- Run health checks
- Display service URLs

### 3. Access Your Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## Production Deployment

### Option 1: Cloud Run (Recommended)

#### Backend Deployment
```bash
# Build and push backend image
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/backend
gcloud run deploy solveai-backend \
  --image gcr.io/YOUR_PROJECT/backend \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

#### Frontend Deployment
```bash
# Build and deploy frontend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/frontend
gcloud run deploy solveai-frontend \
  --image gcr.io/YOUR_PROJECT/frontend \
  --platform managed \
  --port 3000 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Option 2: App Engine

Create `app.yaml` files for each service:

#### backend/app.yaml
```yaml
runtime: nodejs18
service: backend

env_variables:
  NODE_ENV: production
  PORT: 8080

handlers:
- url: /.*
  script: auto
  secure: always
```

#### app.yaml (frontend)
```yaml
runtime: nodejs18
service: default

env_variables:
  NODE_ENV: production

handlers:
- url: /.*
  script: auto
  secure: always
```

Deploy with:
```bash
gcloud app deploy backend/app.yaml
gcloud app deploy app.yaml
```

### Option 3: Kubernetes

Use the provided docker-compose.yml as a reference for Kubernetes manifests.

## Deployment Scripts

### Available Commands

```bash
# Deploy all services
./deploy.sh
deploy.bat

# Stop services
./deploy.sh stop
deploy.bat stop

# Restart services
./deploy.sh restart
deploy.bat restart

# View logs
./deploy.sh logs
deploy.bat logs

# Check status
./deploy.sh status
deploy.bat status
```

## Environment Variables Reference

### Required Variables

#### Frontend
- `NEXT_PUBLIC_FIREBASE_*`: Firebase configuration
- `NEXT_PUBLIC_BACKEND_URL`: Backend service URL
- `GOOGLE_MAPS_API_KEY`: Google Maps API key

#### Backend
- `GOOGLE_CLOUD_PROJECT_ID`: GCP project ID
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `GOOGLE_MAPS_API_KEY`: Google Maps API key
- `JWT_SECRET`: JWT signing secret

### Optional Variables

#### Backend
- `REDIS_URL`: Redis connection URL for caching
- `PORT`: Server port (default: 8080)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origins

## Health Checks

The backend includes a health check endpoint at `/health` that verifies:
- Service availability
- Database connectivity
- External service dependencies

## Monitoring and Logging

### Docker Logs
```bash
docker-compose logs -f [service_name]
```

### Cloud Logging
- **Cloud Run**: Use Cloud Logging console
- **App Engine**: Use GCP Logging
- **Kubernetes**: Use kubectl logs

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 8080 are available
2. **Environment variables**: Verify all required variables are set
3. **Firebase permissions**: Ensure service account has proper Firestore access
4. **Database issues**: Check SQLite file permissions in Docker

### Health Check Failures

If health checks fail:
1. Check service logs: `docker-compose logs backend`
2. Verify environment variables
3. Ensure external services (Firebase, Google Cloud) are accessible
4. Check network connectivity between containers

### Performance Optimization

1. **Enable Redis**: Set `REDIS_URL` for caching
2. **Database optimization**: Ensure SQLite database is properly indexed
3. **Image optimization**: Use multi-stage Docker builds (already configured)
4. **CDN**: Configure CDN for static assets in production

## Security Considerations

1. **Environment variables**: Never commit secrets to version control
2. **Service accounts**: Use minimal required permissions
3. **CORS**: Configure appropriate CORS origins for production
4. **HTTPS**: Always use HTTPS in production
5. **Secrets management**: Use GCP Secret Manager for sensitive data

## Backup and Recovery

### Database Backup
```bash
# SQLite backup
docker exec solveai_backend sqlite3 /app/data/ifct2017.db .dump > backup.sql

# Restore
docker exec -i solveai_backend sqlite3 /app/data/ifct2017.db < backup.sql
```

### Firestore Backup
Use GCP Console or gcloud commands for Firestore backups.

## Support

For deployment issues:
1. Check the troubleshooting section above
2. Review Docker and service logs
3. Verify environment configuration
4. Ensure all prerequisites are met

## Version History

- v1.0.0: Initial deployment setup with Docker and cloud deployment options