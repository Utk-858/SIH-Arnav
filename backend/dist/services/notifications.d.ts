import { Notification, NotificationSettings } from '../types';
export declare const notificationsService: {
    getAll: (userId: string) => Promise<Notification[]>;
    getUnread: (userId: string) => Promise<Notification[]>;
    getById: (id: string) => Promise<Notification | null>;
    create: (data: Omit<Notification, "id">) => Promise<Notification>;
    update: (id: string, data: Partial<Omit<Notification, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    getDueNotifications: () => Promise<Notification[]>;
    sendNotification: (id: string) => Promise<void>;
};
export declare const notificationSettingsService: {
    getByUserId: (userId: string) => Promise<NotificationSettings>;
    upsert: (userId: string, data: Partial<Omit<NotificationSettings, "id" | "userId">>) => Promise<NotificationSettings>;
    update: (id: string, data: Partial<Omit<NotificationSettings, "id">>) => Promise<void>;
    delete: (id: string) => Promise<void>;
};
export declare const notificationHelpers: {
    createMealReminder: (userId: string, mealType: "breakfast" | "lunch" | "dinner" | "snacks", scheduledFor: Date) => Omit<Notification, "id">;
    createWaterReminder: (userId: string, targetGlasses: number, scheduledFor: Date) => Omit<Notification, "id">;
    createDietNotes: (userId: string, notes: string, dietPlanId?: string, patientId?: string) => Omit<Notification, "id">;
    createGeneral: (userId: string, title: string, message: string, priority?: "low" | "medium" | "high", data?: any) => Omit<Notification, "id">;
    createDietPlanDelivery: (userId: string, dietPlanId: string, dietPlanTitle: string, dietitianName?: string) => Omit<Notification, "id">;
    createDietPlanActivation: (userId: string, dietPlanId: string, dietPlanTitle: string, dietitianName?: string) => Omit<Notification, "id">;
};
//# sourceMappingURL=notifications.d.ts.map