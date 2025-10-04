import { PatientFeedback } from '../types';
export declare const patientFeedbackService: {
    getAll: () => Promise<PatientFeedback[]>;
    getById: (id: string) => Promise<PatientFeedback | null>;
    getByPatient: (patientId: string) => Promise<PatientFeedback[]>;
    getByDietPlan: (dietPlanId: string) => Promise<PatientFeedback[]>;
    create: (data: Omit<PatientFeedback, "id">) => Promise<PatientFeedback>;
    update: (id: string, data: Partial<Omit<PatientFeedback, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=patientFeedback.d.ts.map