import { DietPlan } from '../types';
export declare const dietPlansService: {
    getAll: () => Promise<DietPlan[]>;
    getById: (id: string) => Promise<DietPlan | null>;
    getByPatient: (patientId: string) => Promise<DietPlan[]>;
    getByDietitian: (dietitianId: string) => Promise<DietPlan[]>;
    create: (data: Omit<DietPlan, "id">) => Promise<DietPlan>;
    update: (id: string, data: Partial<Omit<DietPlan, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=dietPlans.d.ts.map