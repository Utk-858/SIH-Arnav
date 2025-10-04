// Notification service for managing notifications and settings

import { FirestoreService } from './firestore';
import { Notification, NotificationSettings, NotificationType } from '../types';

// Notification service functions
export const notificationsService = {
  // Get all notifications for a user
  getAll: (userId: string) =>
    FirestoreService.getAll<Notification>('notifications', (query) =>
      query.where('userId', '==', userId).orderBy('createdAt', 'desc')
    ),

  // Get unread notifications for a user
  getUnread: (userId: string) =>
    FirestoreService.getAll<Notification>('notifications', (query) =>
      query.where('userId', '==', userId).where('isRead', '==', false).orderBy('createdAt', 'desc')
    ),

  // Get notification by ID
  getById: (id: string) => FirestoreService.getById<Notification>('notifications', id),

  // Create notification
  create: (data: Omit<Notification, 'id'>) =>
    FirestoreService.create<Notification>('notifications', data),

  // Update notification
  update: (id: string, data: Partial<Omit<Notification, 'id'>>) =>
    FirestoreService.update<Notification>('notifications', id, data),

  // Delete notification
  delete: (id: string) => FirestoreService.delete('notifications', id),

  // Mark notification as read
  markAsRead: (id: string) =>
    FirestoreService.update<Notification>('notifications', id, {
      isRead: true,
      readAt: new Date()
    }),

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string) => {
    const unreadNotifications = await notificationsService.getUnread(userId);
    const updatePromises = unreadNotifications.map(notification =>
      notificationsService.markAsRead(notification.id)
    );
    await Promise.all(updatePromises);
  },

  // Get scheduled notifications that are due
  getDueNotifications: () =>
    FirestoreService.getAll<Notification>('notifications', (query) =>
      query.where('scheduledFor', '<=', new Date()).where('sentAt', '==', null)
    ),

  // Send notification (mark as sent)
  sendNotification: (id: string) =>
    FirestoreService.update<Notification>('notifications', id, {
      sentAt: new Date()
    }),
};

// Notification settings service functions
export const notificationSettingsService = {
  // Get settings for a user
  getByUserId: (userId: string) =>
    FirestoreService.getAll<NotificationSettings>('notificationSettings', (query) =>
      query.where('userId', '==', userId).limit(1)
    ).then(settings => settings[0] || null),

  // Create or update settings
  upsert: async (userId: string, data: Partial<Omit<NotificationSettings, 'id' | 'userId'>>) => {
    const existing = await notificationSettingsService.getByUserId(userId);

    if (existing) {
      await FirestoreService.update<NotificationSettings>('notificationSettings', existing.id, data);
      return { ...existing, ...data } as NotificationSettings;
    } else {
      const defaultSettings: Omit<NotificationSettings, 'id'> = {
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
      return FirestoreService.create<NotificationSettings>('notificationSettings', defaultSettings);
    }
  },

  // Update settings
  update: (id: string, data: Partial<Omit<NotificationSettings, 'id'>>) =>
    FirestoreService.update<NotificationSettings>('notificationSettings', id, data),

  // Delete settings
  delete: (id: string) => FirestoreService.delete('notificationSettings', id),
};

// Helper functions for creating specific notification types
export const notificationHelpers = {
  // Create meal reminder notification
  createMealReminder: (
    userId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    scheduledFor: Date
  ): Omit<Notification, 'id'> => ({
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
  createWaterReminder: (
    userId: string,
    targetGlasses: number,
    scheduledFor: Date
  ): Omit<Notification, 'id'> => ({
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
  createDietNotes: (
    userId: string,
    notes: string,
    dietPlanId?: string,
    patientId?: string
  ): Omit<Notification, 'id'> => ({
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
  createGeneral: (
    userId: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    data?: any
  ): Omit<Notification, 'id'> => ({
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
  createDietPlanDelivery: (
    userId: string,
    dietPlanId: string,
    dietPlanTitle: string,
    dietitianName?: string
  ): Omit<Notification, 'id'> => ({
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
  createDietPlanActivation: (
    userId: string,
    dietPlanId: string,
    dietPlanTitle: string,
    dietitianName?: string
  ): Omit<Notification, 'id'> => ({
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