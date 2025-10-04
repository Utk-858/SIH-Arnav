"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const redis_1 = require("./services/redis");
const scheduler_1 = require("./services/scheduler");
// Load environment variables
dotenv_1.default.config();
// Import routes
const patients_1 = __importDefault(require("./routes/patients"));
const dietPlans_1 = __importDefault(require("./routes/dietPlans"));
const messMenus_1 = __importDefault(require("./routes/messMenus"));
const vitals_1 = __importDefault(require("./routes/vitals"));
const mealTracking_1 = __importDefault(require("./routes/mealTracking"));
const consultations_1 = __importDefault(require("./routes/consultations"));
const patientFeedback_1 = __importDefault(require("./routes/patientFeedback"));
const ai_1 = __importDefault(require("./routes/ai"));
const foods_1 = __importDefault(require("./routes/foods"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const policies_1 = __importDefault(require("./routes/policies"));
// Initialize Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || [
        'http://localhost:3000',
        'http://localhost:9002',
        'http://localhost:9003',
        'https://your-project-id.web.app',
        'https://your-project-id.firebaseapp.com'
    ],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'SolveAI Backend API'
    });
});
// API routes
app.use('/api/patients', patients_1.default);
app.use('/api/diet-plans', dietPlans_1.default);
app.use('/api/mess-menus', messMenus_1.default);
app.use('/api/vitals', vitals_1.default);
app.use('/api/meal-tracking', mealTracking_1.default);
app.use('/api/consultations', consultations_1.default);
app.use('/api/patient-feedback', patientFeedback_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/foods', foods_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/policies', policies_1.default);
// 404 handler - must be placed after all other routes
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});
// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Initialize Redis connection
async function initializeServices() {
    try {
        await redis_1.redisService.connect();
        console.log('✅ Redis connected successfully');
    }
    catch (error) {
        console.error('❌ Redis connection failed:', error);
        // Continue without Redis in development
        if (process.env.NODE_ENV === 'production') {
            throw error;
        }
    }
}
// Start server
async function startServer() {
    await initializeServices();
    (0, scheduler_1.initializeScheduler)();
    app.listen(PORT, () => {
        console.log(`🚀 SolveAI Backend API running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/health`);
        console.log(`🤖 AI endpoints: http://localhost:${PORT}/api/ai`);
        console.log(`🔔 Notifications: http://localhost:${PORT}/api/notifications`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}
startServer().catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=index.js.map