import { PolicyDocument, PolicySearchRequest, DietPlanCompliance } from '../types';
export declare const policiesService: {
    getAll: () => Promise<PolicyDocument[]>;
    getById: (id: string) => Promise<PolicyDocument | null>;
    getByCategory: (category: string) => Promise<PolicyDocument[]>;
    getBySource: (source: string) => Promise<PolicyDocument[]>;
    search: (searchRequest: PolicySearchRequest) => Promise<PolicyDocument[]>;
    create: (data: Omit<PolicyDocument, "id">) => Promise<PolicyDocument>;
    update: (id: string, data: Partial<Omit<PolicyDocument, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    getByDosha: (doshaType: "vata" | "pitta" | "kapha") => Promise<PolicyDocument[]>;
    getByConditions: (conditions: string[]) => Promise<PolicyDocument[]>;
    getBySeason: (season: "spring" | "summer" | "monsoon" | "autumn" | "winter") => Promise<PolicyDocument[]>;
    checkCompliance: (dietPlanId: string, patientId: string) => Promise<DietPlanCompliance>;
    getStats: () => Promise<{
        total: number;
        active: number;
        byCategory: Record<string, number>;
        bySource: Record<string, number>;
        recentUpdates: number;
    }>;
};
//# sourceMappingURL=policies.d.ts.map