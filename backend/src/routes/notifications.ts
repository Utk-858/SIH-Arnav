// Notifications API routes

import express from 'express';
import { notificationsService, notificationSettingsService, notificationHelpers } from '../services/notifications';
import { scheduleMealReminders } from '../services/scheduler';
import { redisService } from '../services/redis';

const router = express.Router();

// GET /api/notifications - Get all notifications for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Check cache first
    const cacheKey = `notifications:${userId}`;
    let notifications = await redisService.get(cacheKey);

    if (!notifications) {
      // Fetch from Firestore
      notifications = await notificationsService.getAll(userId);

      // Cache for 5 minutes
      await redisService.setWithTTL(cacheKey, notifications, 300);
    }

    res.json({
      success: true,
      data: notifications,
      cached: notifications !== null
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

// GET /api/notifications/unread - Get unread notifications for current user
router.get('/unread', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const notifications = await notificationsService.getUnread(userId);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error: any) {
    console.error('Error fetching unread notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread notifications',
      message: error.message
    });
  }
});

// GET /api/notifications/:id - Get notification by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    const notification = await notificationsService.getById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification',
      message: error.message
    });
  }
});

// POST /api/notifications - Create new notification
router.post('/', async (req, res) => {
  try {
    const notificationData = req.body;
    const userId = req.headers['user-id'] as string;

    // Validate required fields
    if (!notificationData.title || !notificationData.message || !notificationData.type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, message, type'
      });
    }

    // Ensure user can only create notifications for themselves (or admin can create for others)
    if (notificationData.userId !== userId) {
      // TODO: Add role-based access control
      notificationData.userId = userId;
    }

    const newNotification = await notificationsService.create(notificationData);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.status(201).json({
      success: true,
      data: newNotification,
      message: 'Notification created successfully'
    });
  } catch (error: any) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    const notification = await notificationsService.getById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await notificationsService.markAsRead(id);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await notificationsService.markAllAsRead(userId);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    const notification = await notificationsService.getById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    await notificationsService.delete(id);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

// Notification Settings Routes

// GET /api/notifications/settings - Get notification settings for current user
router.get('/settings', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const settings = await notificationSettingsService.getByUserId(userId);

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification settings',
      message: error.message
    });
  }
});

// PUT /api/notifications/settings - Update notification settings
router.put('/settings', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;
    const settingsData = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const updatedSettings = await notificationSettingsService.upsert(userId, settingsData);

    res.json({
      success: true,
      data: updatedSettings,
      message: 'Notification settings updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings',
      message: error.message
    });
  }
});

// Helper routes for creating specific notifications

// POST /api/notifications/meal-reminder - Create meal reminder
router.post('/meal-reminder', async (req, res) => {
  try {
    const { mealType, scheduledFor } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId || !mealType || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: mealType, scheduledFor'
      });
    }

    const notificationData = notificationHelpers.createMealReminder(
      userId,
      mealType,
      new Date(scheduledFor)
    );

    const notification = await notificationsService.create(notificationData);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Meal reminder created successfully'
    });
  } catch (error: any) {
    console.error('Error creating meal reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create meal reminder',
      message: error.message
    });
  }
});

// POST /api/notifications/water-reminder - Create water reminder
router.post('/water-reminder', async (req, res) => {
  try {
    const { targetGlasses, scheduledFor } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId || !targetGlasses || !scheduledFor) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: targetGlasses, scheduledFor'
      });
    }

    const notificationData = notificationHelpers.createWaterReminder(
      userId,
      targetGlasses,
      new Date(scheduledFor)
    );

    const notification = await notificationsService.create(notificationData);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Water reminder created successfully'
    });
  } catch (error: any) {
    console.error('Error creating water reminder:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create water reminder',
      message: error.message
    });
  }
});

// POST /api/notifications/diet-notes - Create diet notes notification
router.post('/diet-notes', async (req, res) => {
  try {
    const { notes, dietPlanId, patientId } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId || !notes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: notes'
      });
    }

    const notificationData = notificationHelpers.createDietNotes(
      userId,
      notes,
      dietPlanId,
      patientId
    );

    const notification = await notificationsService.create(notificationData);

    // Invalidate cache
    await redisService.delete(`notifications:${userId}`);

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Diet notes notification created successfully'
    });
  } catch (error: any) {
    console.error('Error creating diet notes notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create diet notes notification',
      message: error.message
    });
  }
});

// POST /api/notifications/schedule-meal-reminders - Schedule meal reminders for user
router.post('/schedule-meal-reminders', async (req, res) => {
  try {
    const userId = req.headers['user-id'] as string;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    await scheduleMealReminders(userId);

    res.json({
      success: true,
      message: 'Meal reminders scheduled successfully'
    });
  } catch (error: any) {
    console.error('Error scheduling meal reminders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to schedule meal reminders',
      message: error.message
    });
  }
});

// FCM Token Management Routes

// POST /api/notifications/register-token - Register FCM token
router.post('/register-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fcmToken'
      });
    }

    // Store FCM token in Firestore (you might want to create a separate collection for this)
    // For now, we'll store it in a simple key-value store or extend the user profile
    // TODO: Create a proper FCM tokens collection

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error: any) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register FCM token',
      message: error.message
    });
  }
});

// POST /api/notifications/unregister-token - Unregister FCM token
router.post('/unregister-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.headers['user-id'] as string;

    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: fcmToken'
      });
    }

    // Remove FCM token from storage
    // TODO: Remove from FCM tokens collection

    res.json({
      success: true,
      message: 'FCM token unregistered successfully'
    });
  } catch (error: any) {
    console.error('Error unregistering FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister FCM token',
      message: error.message
    });
  }
});

export default router;