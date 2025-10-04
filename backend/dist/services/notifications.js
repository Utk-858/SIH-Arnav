"use strict";
// Notification service for managing notifications and settings
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationHelpers = exports.notificationSettingsService = exports.notificationsService = void 0;
const firestore_1 = require("./firestore");
// Notification service functions
exports.notificationsService = {
    // Get all notifications for a user
    getAll: (userId) => firestore_1.FirestoreService.getAll('notifications', (query) => query.where('userId', '==', userId).orderBy('createdAt', 'desc')),
    // Get unread notifications for a user
    getUnread: (userId) => firestore_1.FirestoreService.getAll('notifications', (query) => query.where('userId', '==', userId).where('isRead', '==', false).orderBy('createdAt', 'desc')),
    // Get notification by ID
    getById: (id) => firestore_1.FirestoreService.getById('notifications', id),
    // Create notification
    create: (data) => firestore_1.FirestoreService.create('notifications', data),
    // Update notification
    update: (id, data) => firestore_1.FirestoreService.update('notifications', id, data),
    // Delete notification
    delete: (id) => firestore_1.FirestoreService.delete('notifications', id),
    // Mark notification as read
    markAsRead: (id) => firestore_1.FirestoreService.update('notifications', id, {
        isRead: true,
        readAt: new Date()
    }),
    // Mark all notifications as read for a user
    markAllAsRead: async (userId) => {
        const unreadNotifications = await exports.notificationsService.getUnread(userId);
        const updatePromises = unreadNotifications.map(notification => exports.notificationsService.markAsRead(notification.id));
        await Promise.all(updatePromises);
    },
    // Get scheduled notifications that are due
    getDueNotifications: () => firestore_1.FirestoreService.getAll('notifications', (query) => query.where('scheduledFor', '<=', new Date()).where('sentAt', '==', null)),
    // Send notification (mark as sent)
    sendNotification: (id) => firestore_1.FirestoreService.update('notifications', id, {
        sentAt: new Date()
    }),
};
// Notification settings service functions
exports.notificationSettingsService = {
    // Get settings for a user
    getByUserId: (userId) => firestore_1.FirestoreService.getAll('notificationSettings', (query) => query.where('userId', '==', userId).limit(1)).then(settings => settings[0] || null),
    // Create or update settings
    upsert: async (userId, data) => {
        const existing = await exports.notificationSettingsService.getByUserId(userId);
        if (existing) {
            await firestore_1.FirestoreService.update('notificationSettings', existing.id, data);
            return { ...existing, ...data };
        }
        else {
            const defaultSettings = {
                userId,
                mealReminders: true,
                waterReminders: true,
                dietNotes: true,
                pushNotifications: false,
                emailNotifications: false,
                reminderTimes: {
                    breakfast: '08:00',
                    lunch: '13:00',
                    dinner: '19:00',
                    snacks: ['10:00', '16:00']
                },
                waterReminderInterval: 120, // 2 hours
                createdAt: new Date(),
                updatedAt: new Date(),
                ...data
            };
            return firestore_1.FirestoreService.create('notificationSettings', defaultSettings);
        }
    },
    // Update settings
    update: (id, data) => firestore_1.FirestoreService.update('notificationSettings', id, data),
    // Delete settings
    delete: (id) => firestore_1.FirestoreService.delete('notificationSettings', id),
};
// Helper functions for creating specific notification types
exports.notificationHelpers = {
    // Create meal reminder notification
    createMealReminder: (userId, mealType, scheduledFor) => ({
        userId,
        type: 'meal_reminder',
        title: `Time for ${mealType}`,
        message: `It's time for your ${mealType} according to your diet plan.`,
        data: { mealType },
        scheduledFor,
        isRead: false,
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    // Create water intake reminder
    createWaterReminder: (userId, targetGlasses, scheduledFor) => ({
        userId,
        type: 'water_intake',
        title: 'Stay Hydrated',
        message: `Remember to drink water. Your daily target is ${targetGlasses} glasses.`,
        data: { waterTarget: targetGlasses },
        scheduledFor,
        isRead: false,
        priority: 'low',
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    // Create diet notes notification
    createDietNotes: (userId, notes, dietPlanId, patientId) => ({
        userId,
        type: 'diet_notes',
        title: 'Important Diet Notes',
        message: notes,
        data: { dietPlanId, patientId },
        isRead: false,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    // Create general notification
    createGeneral: (userId, title, message, priority = 'medium', data) => ({
        userId,
        type: 'general',
        title,
        message,
        data,
        isRead: false,
        priority,
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    // Create diet plan delivery notification
    createDietPlanDelivery: (userId, dietPlanId, dietPlanTitle, dietitianName) => ({
        userId,
        type: 'diet_plan_delivery',
        title: 'New Diet Plan Available',
        message: `Your new diet plan "${dietPlanTitle}" has been delivered${dietitianName ? ` by ${dietitianName}` : ''}. Please review and start following it.`,
        data: { dietPlanId },
        isRead: false,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
    // Create diet plan activation notification
    createDietPlanActivation: (userId, dietPlanId, dietPlanTitle, dietitianName) => ({
        userId,
        type: 'diet_plan_activation',
        title: 'Diet Plan Activated',
        message: `Your diet plan "${dietPlanTitle}" has been activated${dietitianName ? ` by ${dietitianName}` : ''}. You can now start following it.`,
        data: { dietPlanId },
        isRead: false,
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
    }),
};
//# sourceMappingURL=notifications.js.map