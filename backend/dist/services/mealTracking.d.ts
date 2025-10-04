import { MealTracking } from '../types';
export declare const mealTrackingService: {
    getAll: () => Promise<MealTracking[]>;
    getById: (id: string) => Promise<MealTracking | null>;
    getByPatient: (patientId: string) => Promise<MealTracking[]>;
    getByDietPlan: (dietPlanId: string) => Promise<MealTracking[]>;
    create: (data: Omit<MealTracking, "id">) => Promise<MealTracking>;
    update: (id: string, data: Partial<Omit<MealTracking, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=mealTracking.d.ts.map