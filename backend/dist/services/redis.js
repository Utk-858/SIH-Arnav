"use strict";
// Redis caching service
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisService = void 0;
const redis_1 = require("redis");
class RedisService {
    constructor() {
        this._isConnected = false;
        this._isConnecting = false;
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.log('❌ Redis: Max reconnection attempts reached');
                        return new Error('Max reconnection attempts reached');
                    }
                    const delay = Math.min(retries * 100, 3000);
                    console.log(`🔄 Redis: Reconnecting in ${delay}ms...`);
                    return delay;
                }
            }
        });
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
            this._isConnected = false;
        });
        this.client.on('connect', () => {
            console.log('✅ Redis TCP connected');
        });
        this.client.on('ready', () => {
            console.log('✅ Redis ready');
            this._isConnected = true;
            this._isConnecting = false;
        });
        this.client.on('end', () => {
            console.log('❌ Redis disconnected');
            this._isConnected = false;
            this._isConnecting = false;
        });
        this.client.on('reconnecting', () => {
            console.log('🔄 Redis reconnecting...');
            this._isConnecting = true;
        });
    }
    async connect() {
        if (this._isConnected || this._isConnecting) {
            return;
        }
        try {
            this._isConnecting = true;
            await this.client.connect();
        }
        catch (error) {
            console.error('⚠️  Redis connection failed, continuing without cache:', error);
            this._isConnected = false;
            this._isConnecting = false;
            // Don't throw, allow app to continue without Redis
        }
    }
    async disconnect() {
        if (this._isConnected || this.client.isOpen) {
            try {
                await this.client.disconnect();
                this._isConnected = false;
                this._isConnecting = false;
            }
            catch (error) {
                console.error('Redis disconnect error:', error);
            }
        }
    }
    // Generic cache operations
    async set(key, value, ttlSeconds) {
        if (!this.isConnected)
            return;
        try {
            const serializedValue = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serializedValue);
            }
            else {
                await this.client.set(key, serializedValue);
            }
        }
        catch (error) {
            console.error('Redis SET error:', error);
            // Gracefully degrade - don't throw
        }
    }
    async get(key) {
        if (!this.isConnected)
            return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            console.error('Redis GET error:', error);
            return null; // Gracefully degrade
        }
    }
    async delete(key) {
        if (!this.isConnected)
            return false;
        try {
            const result = await this.client.del(key);
            return result > 0;
        }
        catch (error) {
            console.error('Redis DELETE error:', error);
            return false;
        }
    }
    async exists(key) {
        if (!this.isConnected)
            return false;
        try {
            const result = await this.client.exists(key);
            return result > 0;
        }
        catch (error) {
            console.error('Redis EXISTS error:', error);
            return false;
        }
    }
    // Cache with TTL (Time To Live)
    async setWithTTL(key, value, ttlSeconds) {
        await this.set(key, value, ttlSeconds);
    }
    // Cache patient data
    async cachePatientData(patientId, data) {
        const key = `patient:${patientId}`;
        await this.setWithTTL(key, data, 3600); // 1 hour TTL
    }
    async getCachedPatientData(patientId) {
        const key = `patient:${patientId}`;
        return await this.get(key);
    }
    // Cache diet plans
    async cacheDietPlan(planId, data) {
        const key = `diet_plan:${planId}`;
        await this.setWithTTL(key, data, 1800); // 30 minutes TTL
    }
    async getCachedDietPlan(planId) {
        const key = `diet_plan:${planId}`;
        return await this.get(key);
    }
    // Cache AI responses
    async cacheAIResponse(query, response) {
        const key = `ai_response:${Buffer.from(query).toString('base64').slice(0, 50)}`;
        await this.setWithTTL(key, response, 7200); // 2 hours TTL
    }
    async getCachedAIResponse(query) {
        const key = `ai_response:${Buffer.from(query).toString('base64').slice(0, 50)}`;
        return await this.get(key);
    }
    // Cache nutritional data
    async cacheNutritionalData(foodId, data) {
        const key = `nutrition:${foodId}`;
        await this.setWithTTL(key, data, 86400); // 24 hours TTL
    }
    async getCachedNutritionalData(foodId) {
        const key = `nutrition:${foodId}`;
        return await this.get(key);
    }
    // Session management
    async setSession(sessionId, data) {
        const key = `session:${sessionId}`;
        await this.setWithTTL(key, data, 86400); // 24 hours TTL
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.get(key);
    }
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.delete(key);
    }
    // Rate limiting
    async incrementRateLimit(identifier, windowSeconds = 60) {
        if (!this.isConnected)
            return 1; // Allow if Redis not available
        try {
            const key = `rate_limit:${identifier}`;
            const count = await this.client.incr(key);
            if (count === 1) {
                await this.client.expire(key, windowSeconds);
            }
            return count;
        }
        catch (error) {
            console.error('Redis rate limit error:', error);
            return 1; // Allow on error
        }
    }
    async getRateLimit(identifier) {
        if (!this.isConnected)
            return 0;
        try {
            const key = `rate_limit:${identifier}`;
            const count = await this.client.get(key);
            return count ? parseInt(count) : 0;
        }
        catch (error) {
            console.error('Redis get rate limit error:', error);
            return 0;
        }
    }
    // Health check
    async ping() {
        if (!this.isConnected)
            return false;
        try {
            const result = await this.client.ping();
            return result === 'PONG';
        }
        catch (error) {
            return false;
        }
    }
    // Get connection status
    get isConnected() {
        return this._isConnected && this.client.isOpen;
    }
}
// Export singleton instance
exports.redisService = new RedisService();
exports.default = exports.redisService;
//# sourceMappingURL=redis.js.map