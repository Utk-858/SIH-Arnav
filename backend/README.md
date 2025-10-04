# SolveAI Backend API

Backend API server for the SolveAI Ayurvedic Diet Management platform.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Firebase Firestore (via Firebase Admin SDK)
- **Caching**: Redis
- **AI**: LangChain + Google Vertex AI (Gemini 1.5 Pro)
- **Security**: Helmet, CORS
- **Development**: Nodemon, ts-node

## Features

### ✅ Implemented
- RESTful API endpoints for all core entities
- Firebase Firestore integration with Admin SDK
- Redis caching for performance optimization
- AI-powered diet plan generation using Vertex AI
- Ayurvedic dosha analysis and food alternatives
- Weather API integration (WeatherAPI.com) for location-based recommendations
- Comprehensive error handling and logging
- Health check endpoints

### 🚧 In Development
- External API integrations (USDA, IFCT, Ayurvedic databases)
- Speech-to-text processing
- Real-time notifications
- Advanced analytics

## Quick Start

### Prerequisites
- Node.js 18+
- Redis server
- Firebase project with Firestore enabled
- Google Cloud project with Vertex AI enabled

### Installation

```bash
cd backend
npm install
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
# Server
PORT=3001
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Redis
REDIS_URL=redis://localhost:6379

# Google Cloud (for Vertex AI)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=asia-south1
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/:id` | Get patient by ID |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |

### AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-diet` | Generate personalized diet plan |
| POST | `/api/ai/analyze-dosha` | Analyze patient dosha |
| POST | `/api/ai/suggest-alternatives` | Suggest food alternatives |
| POST | `/api/ai/generate-timings` | Generate meal timings |
| GET | `/api/ai/health` | AI service health check |

### Other Endpoints

- `/api/diet-plans` - Diet plan management
- `/api/mess-menus` - Hospital mess menu management
- `/api/vitals` - Patient vitals tracking
- `/api/meal-tracking` - Meal adherence tracking

## Architecture

```
Frontend (Next.js) → Backend API (Express.js) → Firestore + Redis
                                      ↓
                                 Vertex AI (Gemini)
```

### Key Components

1. **Routes** (`src/routes/`): API endpoint handlers
2. **Services** (`src/services/`): Business logic and external integrations
3. **Middleware** (`src/middleware/`): Authentication, validation, etc.
4. **Utils** (`src/utils/`): Helper functions and utilities

## Caching Strategy

Redis is used for:
- **Patient data**: 1 hour TTL
- **Diet plans**: 30 minutes TTL
- **AI responses**: 2 hours TTL
- **Session management**: 24 hours TTL
- **Rate limiting**: Sliding window

## AI Integration

Powered by Google Vertex AI (Gemini 1.5 Pro) for:
- **Diet Plan Generation**: Personalized Ayurvedic diet plans
- **Dosha Analysis**: Constitution assessment and imbalance detection
- **Food Alternatives**: Ayurvedic-compatible substitute suggestions
- **Meal Timing**: Optimal scheduling based on dosha and routine

## Security

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Request throttling
- **Input Validation**: Comprehensive data validation
- **Firebase Auth**: Secure authentication integration

## Development

### Scripts
```bash
npm run dev      # Development server with hot reload
npm run build    # TypeScript compilation
npm run start    # Production server
npm run clean    # Clean build artifacts
```

### Project Structure
```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic & integrations
│   ├── middleware/      # Express middleware
│   ├── utils/          # Helper functions
│   └── types/          # TypeScript type definitions
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Google Cloud Run
```bash
gcloud run deploy solveai-backend \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

## Contributing

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include JSDoc comments for functions
4. Test all endpoints thoroughly
5. Update documentation for new features

## License

ISC License - see package.json for details.