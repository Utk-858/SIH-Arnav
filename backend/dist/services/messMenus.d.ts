import { MessMenu } from '../types';
export declare const messMenusService: {
    getAll: () => Promise<MessMenu[]>;
    getById: (id: string) => Promise<MessMenu | null>;
    getByHospital: (hospitalId: string) => Promise<MessMenu[]>;
    getByDateAndHospital: (date: Date, hospitalId: string) => Promise<MessMenu[]>;
    create: (data: Omit<MessMenu, "id">) => Promise<MessMenu>;
    update: (id: string, data: Partial<Omit<MessMenu, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
//# sourceMappingURL=messMenus.d.ts.map