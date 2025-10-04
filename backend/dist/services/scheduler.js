"use strict";
// Notification scheduler service
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleMealReminders = scheduleMealReminders;
exports.scheduleWaterReminders = scheduleWaterReminders;
exports.sendDueNotifications = sendDueNotifications;
exports.scheduleDailyRemindersForAllUsers = scheduleDailyRemindersForAllUsers;
exports.initializeScheduler = initializeScheduler;
const notifications_1 = require("./notifications");
const firestore_1 = require("./firestore");
const messaging_1 = require("firebase-admin/messaging");
// Helper function to get today's date at specific time
function getTodayAtTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}
// Helper function to get tomorrow's date at specific time
function getTomorrowAtTime(timeString) {
    const date = getTodayAtTime(timeString);
    date.setDate(date.getDate() + 1);
    return date;
}
// Schedule meal reminders for a user
async function scheduleMealReminders(userId) {
    try {
        // Get user's notification settings
        const settings = await notifications_1.notificationSettingsService.getByUserId(userId);
        if (!settings || !settings.mealReminders) {
            return; // User doesn't want meal reminders
        }
        // Get user's active diet plan to determine meal times
        // For now, use default times from settings
        const reminderTimes = settings.reminderTimes;
        // Schedule breakfast reminder
        const breakfastTime = getTodayAtTime(reminderTimes.breakfast);
        if (breakfastTime > new Date()) {
            await notifications_1.notificationsService.create({
                userId,
                type: 'meal_reminder',
                title: 'Breakfast Time',
                message: 'It\'s time for your breakfast according to your diet plan.',
                data: { mealType: 'breakfast' },
                scheduledFor: breakfastTime,
                isRead: false,
                priority: 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // Schedule lunch reminder
        const lunchTime = getTodayAtTime(reminderTimes.lunch);
        if (lunchTime > new Date()) {
            await notifications_1.notificationsService.create({
                userId,
                type: 'meal_reminder',
                title: 'Lunch Time',
                message: 'It\'s time for your lunch according to your diet plan.',
                data: { mealType: 'lunch' },
                scheduledFor: lunchTime,
                isRead: false,
                priority: 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // Schedule dinner reminder
        const dinnerTime = getTodayAtTime(reminderTimes.dinner);
        if (dinnerTime > new Date()) {
            await notifications_1.notificationsService.create({
                userId,
                type: 'meal_reminder',
                title: 'Dinner Time',
                message: 'It\'s time for your dinner according to your diet plan.',
                data: { mealType: 'dinner' },
                scheduledFor: dinnerTime,
                isRead: false,
                priority: 'medium',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        // Schedule snack reminders
        for (const snackTime of reminderTimes.snacks) {
            const snackDateTime = getTodayAtTime(snackTime);
            if (snackDateTime > new Date()) {
                await notifications_1.notificationsService.create({
                    userId,
                    type: 'meal_reminder',
                    title: 'Snack Time',
                    message: 'It\'s time for your snack according to your diet plan.',
                    data: { mealType: 'snacks' },
                    scheduledFor: snackDateTime,
                    isRead: false,
                    priority: 'low',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    }
    catch (error) {
        console.error('Error scheduling meal reminders:', error);
    }
}
// Schedule water intake reminders for a user
async function scheduleWaterReminders(userId) {
    try {
        // Get user's notification settings
        const settings = await notifications_1.notificationSettingsService.getByUserId(userId);
        if (!settings || !settings.waterReminders) {
            return; // User doesn't want water reminders
        }
        const intervalMinutes = settings.waterReminderInterval;
        const targetGlasses = 8; // Default daily target
        // Schedule reminders throughout the day
        const startHour = 8; // Start at 8 AM
        const endHour = 20; // End at 8 PM
        for (let hour = startHour; hour <= endHour; hour += intervalMinutes / 60) {
            const reminderTime = new Date();
            reminderTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
            if (reminderTime > new Date()) {
                await notifications_1.notificationsService.create({
                    userId,
                    type: 'water_intake',
                    title: 'Stay Hydrated',
                    message: `Remember to drink water. Your daily target is ${targetGlasses} glasses.`,
                    data: { waterTarget: targetGlasses },
                    scheduledFor: reminderTime,
                    isRead: false,
                    priority: 'low',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
        }
    }
    catch (error) {
        console.error('Error scheduling water reminders:', error);
    }
}
// Send due notifications (called by cron job or scheduler)
async function sendDueNotifications() {
    try {
        const dueNotifications = await notifications_1.notificationsService.getDueNotifications();
        const messaging = (0, messaging_1.getMessaging)();
        for (const notification of dueNotifications) {
            try {
                // Mark as sent
                await notifications_1.notificationsService.sendNotification(notification.id);
                // Get user's FCM tokens (TODO: Implement proper token storage)
                // For now, we'll skip FCM sending and just log
                console.log(`Sending notification to ${notification.userId}: ${notification.title}`);
                // TODO: Get FCM tokens for user and send push notifications
                /*
                const userTokens = await getUserFCMTokens(notification.userId);
        
                if (userTokens.length > 0) {
                  const message = {
                    notification: {
                      title: notification.title,
                      body: notification.message,
                    },
                    data: {
                      notificationId: notification.id,
                      type: notification.type,
                      url: '/dashboard', // Default URL
                    },
                    tokens: userTokens,
                  };
        
                  const response = await messaging.sendMulticast(message);
                  console.log(`FCM sent to ${response.successCount} devices, failed: ${response.failureCount}`);
                }
                */
                // TODO: Send email notifications if enabled
            }
            catch (error) {
                console.error(`Error sending notification ${notification.id}:`, error);
            }
        }
        return dueNotifications.length;
    }
    catch (error) {
        console.error('Error sending due notifications:', error);
        return 0;
    }
}
// Schedule daily reminders for all users (should be called daily)
async function scheduleDailyRemindersForAllUsers() {
    try {
        // Get all patients (assuming patients are the main users for notifications)
        const patients = await firestore_1.patientsService.getAll();
        let scheduledCount = 0;
        for (const patient of patients) {
            // Use patient.id as userId for now
            // TODO: Add proper userId field to Patient model
            const userId = patient.id;
            await scheduleMealReminders(userId);
            await scheduleWaterReminders(userId);
            scheduledCount++;
        }
        console.log(`Scheduled daily reminders for ${scheduledCount} users`);
        return scheduledCount;
    }
    catch (error) {
        console.error('Error scheduling daily reminders:', error);
        return 0;
    }
}
// Initialize scheduler (call this when server starts)
function initializeScheduler() {
    // Schedule daily reminders at 6 AM every day
    const now = new Date();
    const next6AM = new Date(now);
    next6AM.setHours(6, 0, 0, 0);
    if (next6AM <= now) {
        next6AM.setDate(next6AM.getDate() + 1);
    }
    const timeUntil6AM = next6AM.getTime() - now.getTime();
    setTimeout(() => {
        scheduleDailyRemindersForAllUsers();
        // Then schedule every 24 hours
        setInterval(scheduleDailyRemindersForAllUsers, 24 * 60 * 60 * 1000);
    }, timeUntil6AM);
    // Check for due notifications every minute
    setInterval(sendDueNotifications, 60 * 1000);
    console.log('✅ Notification scheduler initialized');
}
//# sourceMappingURL=scheduler.js.map