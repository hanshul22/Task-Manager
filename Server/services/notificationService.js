const emailService = require('./emailService');
const Task = require('../Models/task');
const User = require('../Models/UserModel');

class NotificationService {
    constructor() {
        this.reminderJobs = new Map(); // Store scheduled reminder jobs
    }

    // Send welcome email when user registers
    async sendWelcomeNotification(user) {
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await emailService.sendWelcomeEmail(user);
                console.log(`Welcome email sent to ${user.email}`);
            }
        } catch (error) {
            console.error('Failed to send welcome email:', error.message);
        }
    }

    // Send password reset email
    async sendPasswordResetNotification(user, resetToken) {
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await emailService.sendPasswordResetEmail(user, resetToken);
                console.log(`Password reset email sent to ${user.email}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to send password reset email:', error.message);
            throw error;
        }
    }

    // Send task reminder notification
    async sendTaskReminder(taskId, userId) {
        try {
            const task = await Task.findById(taskId).populate('user');
            if (!task || task.user._id.toString() !== userId) {
                console.log('Task not found or user mismatch for reminder');
                return;
            }

            if (task.isCompleted) {
                console.log('Task already completed, skipping reminder');
                return;
            }

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await emailService.sendTaskReminderEmail(task.user, task);
                console.log(`Task reminder sent for: ${task.title}`);
            }
        } catch (error) {
            console.error('Failed to send task reminder:', error.message);
        }
    }

    // Send overdue tasks notification
    async sendOverdueTasksNotification(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                console.log('User not found for overdue notification');
                return;
            }

            // Get overdue tasks
            const overdueTasks = await Task.find({
                user: userId,
                dueDate: { $lt: new Date() },
                isCompleted: false,
                isDeleted: { $ne: true }
            }).sort({ dueDate: 1 });

            if (overdueTasks.length === 0) {
                console.log('No overdue tasks found');
                return;
            }

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await emailService.sendTaskOverdueEmail(user, overdueTasks);
                console.log(`Overdue tasks notification sent to ${user.email} for ${overdueTasks.length} tasks`);
            }
        } catch (error) {
            console.error('Failed to send overdue tasks notification:', error.message);
        }
    }

    // Schedule task reminder (would be better with a job queue like Bull or Agenda)
    scheduleTaskReminder(task) {
        try {
            if (!task.dueDate) return;

            const now = new Date();
            const dueDate = new Date(task.dueDate);
            const reminderTime = new Date(dueDate.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before

            if (reminderTime > now) {
                const timeUntilReminder = reminderTime.getTime() - now.getTime();

                // Don't schedule if more than 7 days in future (to avoid memory issues)
                const maxScheduleTime = 7 * 24 * 60 * 60 * 1000; // 7 days
                if (timeUntilReminder <= maxScheduleTime) {
                    const timeoutId = setTimeout(() => {
                        this.sendTaskReminder(task._id, task.user);
                        this.reminderJobs.delete(task._id.toString());
                    }, timeUntilReminder);

                    this.reminderJobs.set(task._id.toString(), timeoutId);
                    console.log(`Scheduled reminder for task: ${task.title} at ${reminderTime}`);
                }
            }
        } catch (error) {
            console.error('Failed to schedule task reminder:', error.message);
        }
    }

    // Cancel scheduled reminder
    cancelTaskReminder(taskId) {
        const timeoutId = this.reminderJobs.get(taskId.toString());
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.reminderJobs.delete(taskId.toString());
            console.log(`Cancelled reminder for task: ${taskId}`);
        }
    }

    // Check for overdue tasks (should be called periodically)
    async checkOverdueTasks() {
        try {
            console.log('Checking for overdue tasks...');

            // Get all users with overdue tasks
            const usersWithOverdueTasks = await Task.aggregate([
                {
                    $match: {
                        dueDate: { $lt: new Date() },
                        isCompleted: false,
                        isDeleted: { $ne: true }
                    }
                },
                {
                    $group: {
                        _id: '$user',
                        overdueCount: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        overdueCount: { $gt: 0 }
                    }
                }
            ]);

            for (const userGroup of usersWithOverdueTasks) {
                // Send notification to each user with overdue tasks
                await this.sendOverdueTasksNotification(userGroup._id);
            }

            console.log(`Processed overdue notifications for ${usersWithOverdueTasks.length} users`);
        } catch (error) {
            console.error('Error checking overdue tasks:', error.message);
        }
    }

    // Start periodic overdue task checker (every 24 hours)
    startOverdueTaskChecker() {
        // Run immediately on start
        this.checkOverdueTasks();

        // Then run every 24 hours
        setInterval(() => {
            this.checkOverdueTasks();
        }, 24 * 60 * 60 * 1000); // 24 hours

        console.log('Overdue task checker started (runs every 24 hours)');
    }

    // Get notification statistics
    async getNotificationStats(userId) {
        try {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

            const stats = await Task.aggregate([
                { $match: { user: userId, isDeleted: { $ne: true } } },
                {
                    $facet: {
                        overdue: [
                            {
                                $match: {
                                    dueDate: { $lt: today },
                                    isCompleted: false
                                }
                            },
                            { $count: "count" }
                        ],
                        dueToday: [
                            {
                                $match: {
                                    dueDate: { $gte: today, $lt: tomorrow },
                                    isCompleted: false
                                }
                            },
                            { $count: "count" }
                        ],
                        dueThisWeek: [
                            {
                                $match: {
                                    dueDate: { $gte: tomorrow, $lt: nextWeek },
                                    isCompleted: false
                                }
                            },
                            { $count: "count" }
                        ],
                        scheduledReminders: [
                            {
                                $match: {
                                    dueDate: { $gt: now },
                                    isCompleted: false
                                }
                            },
                            { $count: "count" }
                        ]
                    }
                }
            ]);

            return {
                overdue: stats[0].overdue[0]?.count || 0,
                dueToday: stats[0].dueToday[0]?.count || 0,
                dueThisWeek: stats[0].dueThisWeek[0]?.count || 0,
                scheduledReminders: stats[0].scheduledReminders[0]?.count || 0,
                activeReminderJobs: this.reminderJobs.size
            };
        } catch (error) {
            console.error('Failed to get notification stats:', error.message);
            return {
                overdue: 0,
                dueToday: 0,
                dueThisWeek: 0,
                scheduledReminders: 0,
                activeReminderJobs: 0
            };
        }
    }
}

// Create and export singleton instance
const notificationService = new NotificationService();

// Start the overdue task checker
if (process.env.NODE_ENV !== 'test') {
    notificationService.startOverdueTaskChecker();
}

module.exports = notificationService; 