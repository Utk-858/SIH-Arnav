export declare class FirestoreService {
    static create<T extends {
        id?: string;
    }>(collectionName: string, data: Omit<T, 'id'>): Promise<T>;
    static getById<T>(collectionName: string, id: string): Promise<T | null>;
    static getAll<T>(collectionName: string, queryBuilder?: (query: any) => any): Promise<T[]>;
    static update<T extends {
        id: string;
    }>(collectionName: string, id: string, data: Partial<Omit<T, 'id'>>): Promise<void>;
    static delete(collectionName: string, id: string): Promise<void>;
}
export declare const patientsService: {
    getAll: () => Promise<Patient[]>;
    getById: (id: string) => Promise<Patient | null>;
    getByDietitian: (dietitianId: string) => Promise<Patient[]>;
    create: (data: Omit<Patient, "id">) => Promise<Patient>;
    update: (id: string, data: Partial<Omit<Patient, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
export declare const hospitalsService: {
    getAll: () => Promise<Hospital[]>;
    getById: (id: string) => Promise<Hospital | null>;
    create: (data: Omit<Hospital, "id">) => Promise<Hospital>;
    update: (id: string, data: Partial<Omit<Hospital, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
export declare const usersService: {
    getAll: () => Promise<User[]>;
    getById: (uid: string) => Promise<User | null>;
    getByRole: (role: User["role"]) => Promise<User[]>;
    getByHospital: (hospitalId: string) => Promise<User[]>;
    create: (data: Omit<User, "id">) => Promise<User>;
    update: (uid: string, data: Partial<Omit<User, "uid">>) => Promise<void>;
    delete: (uid: string) => Promise<void>;
};
export declare const vitalsService: {
    getByPatient: (patientId: string) => Promise<Vitals[]>;
    create: (data: Omit<Vitals, "id">) => Promise<Vitals>;
    update: (id: string, data: Partial<Omit<Vitals, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
export declare const consultationsService: {
    getAll: () => Promise<Consultation[]>;
    getByPatient: (patientId: string) => Promise<Consultation[]>;
    getByDietitian: (dietitianId: string) => Promise<Consultation[]>;
    create: (data: Omit<Consultation, "id">) => Promise<Consultation>;
    update: (id: string, data: Partial<Omit<Consultation, "id">>) => Promise<void>;
};
export declare const dietPlansService: {
    getAll: () => Promise<DietPlan[]>;
    getByPatient: (patientId: string) => Promise<DietPlan[]>;
    create: (data: Omit<DietPlan, "id">) => Promise<DietPlan>;
    update: (id: string, data: Partial<Omit<DietPlan, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
interface Patient {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    code: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
    dietaryHabits?: string;
    allergies?: string[];
    medicalHistory?: string;
    currentMedications?: string;
    doshaType?: 'Vata' | 'Pitta' | 'Kapha' | 'Mixed';
    hospitalId?: string;
    dietitianId?: string;
    registrationDate: Date;
    lastUpdated: Date;
}
interface User {
    id: string;
    uid: string;
    email: string;
    displayName: string;
    role: 'patient' | 'dietitian' | 'hospital-admin';
    hospitalId?: string;
    patientId?: string;
    createdAt: Date;
    lastLogin: Date;
}
interface Hospital {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    adminId: string;
    createdAt: Date;
}
interface Vitals {
    id: string;
    patientId: string;
    recordedBy: string;
    date: Date;
    bloodPressure: {
        systolic: number;
        diastolic: number;
    };
    bloodSugar?: {
        fasting: number;
        postPrandial?: number;
    };
    thyroid?: {
        tsh: number;
        t3?: number;
        t4?: number;
    };
    cholesterol?: {
        total: number;
        hdl: number;
        ldl: number;
        triglycerides: number;
    };
    bmi: number;
    weight: number;
    height: number;
    temperature?: number;
    pulse?: number;
    notes?: string;
}
interface Consultation {
    id: string;
    patientId: string;
    dietitianId: string;
    date: Date;
    notes: string;
    recommendations: string;
    followUpDate?: Date;
    status: 'scheduled' | 'completed' | 'cancelled';
}
interface DietPlan {
    id: string;
    patientId: string;
    dietitianId: string;
    title: string;
    description: string;
    dietDays: any[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export {};
//# sourceMappingURL=firestore.d.ts.map