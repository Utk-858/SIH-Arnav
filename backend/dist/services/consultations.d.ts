import { Consultation } from '../types';
export declare const consultationsService: {
    getAll: () => Promise<Consultation[]>;
    getById: (id: string) => Promise<Consultation | null>;
    getByPatient: (patientId: string) => Promise<Consultation[]>;
    getByDietitian: (dietitianId: string) => Promise<Consultation[]>;
    create: (data: Omit<Consultation, "id">) => Promise<Consultation>;
    update: (id: string, data: Partial<Omit<Consultation, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=consultations.d.ts.map