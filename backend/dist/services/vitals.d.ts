import { Vitals } from '../types';
export declare const vitalsService: {
    getAll: () => Promise<Vitals[]>;
    getById: (id: string) => Promise<Vitals | null>;
    getByPatient: (patientId: string) => Promise<Vitals[]>;
    create: (data: Omit<Vitals, "id">) => Promise<Vitals>;
    update: (id: string, data: Partial<Omit<Vitals, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=vitals.d.ts.map