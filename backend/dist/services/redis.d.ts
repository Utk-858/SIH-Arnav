declare class RedisService {
    private client;
    private _isConnected;
    private _isConnecting;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    get<T = any>(key: string): Promise<T | null>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    setWithTTL(key: string, value: any, ttlSeconds: number): Promise<void>;
    cachePatientData(patientId: string, data: any): Promise<void>;
    getCachedPatientData(patientId: string): Promise<any | null>;
    cacheDietPlan(planId: string, data: any): Promise<void>;
    getCachedDietPlan(planId: string): Promise<any | null>;
    cacheAIResponse(query: string, response: any): Promise<void>;
    getCachedAIResponse(query: string): Promise<any | null>;
    cacheNutritionalData(foodId: string, data: any): Promise<void>;
    getCachedNutritionalData(foodId: string): Promise<any | null>;
    setSession(sessionId: string, data: any): Promise<void>;
    getSession(sessionId: string): Promise<any | null>;
    deleteSession(sessionId: string): Promise<void>;
    incrementRateLimit(identifier: string, windowSeconds?: number): Promise<number>;
    getRateLimit(identifier: string): Promise<number>;
    ping(): Promise<boolean>;
    get isConnected(): boolean;
}
export declare const redisService: RedisService;
export default redisService;
//# sourceMappingURL=redis.d.ts.map