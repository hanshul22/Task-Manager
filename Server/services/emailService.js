const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            this.transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: process.env.EMAIL_PORT || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Verify connection configuration
            this.transporter.verify((error, success) => {
                if (error) {
                    console.log('Email configuration error:', error);
                } else {
                    console.log('Email service ready');
                }
            });
        } catch (error) {
            console.error('Failed to initialize email transporter:', error);
        }
    }

    async sendEmail({ to, subject, html, text }) {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }

            const mailOptions = {
                from: `"Task Manager" <${process.env.EMAIL_USER}>`,
                to,
                subject,
                html,
                text
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', result.messageId);
            return result;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(user) {
        const subject = 'Welcome to Task Manager!';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome to Task Manager!</h2>
                <p>Hello ${user.name},</p>
                <p>Thank you for joining Task Manager. We're excited to help you stay organized and productive!</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="color: #007bff; margin-top: 0;">Getting Started</h3>
                    <ul>
                        <li>Create your first task</li>
                        <li>Organize tasks with tags</li>
                        <li>Set due dates and priorities</li>
                        <li>Track your progress</li>
                    </ul>
                </div>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy organizing!</p>
                <p><strong>The Task Manager Team</strong></p>
            </div>
        `;

        const text = `Welcome to Task Manager! Hello ${user.name}, Thank you for joining Task Manager. We're excited to help you stay organized and productive!`;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
            text
        });
    }

    async sendPasswordResetEmail(user, resetToken) {
        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const subject = 'Password Reset Request';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>Hello ${user.name},</p>
                <p>We received a request to reset your password for your Task Manager account.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Reset Password
                    </a>
                </div>
                
                <p>This link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request this password reset, please ignore this email.</p>
                
                <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <strong>Security Note:</strong> Never share this link with anyone. Our team will never ask for your password via email.
                </div>
                
                <p>Best regards,</p>
                <p><strong>The Task Manager Team</strong></p>
            </div>
        `;

        const text = `Password Reset Request. Hello ${user.name}, We received a request to reset your password. Click this link to reset: ${resetUrl} This link expires in 1 hour.`;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
            text
        });
    }

    async sendTaskReminderEmail(user, task) {
        const subject = `Task Reminder: ${task.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Task Reminder</h2>
                <p>Hello ${user.name},</p>
                <p>This is a reminder about your upcoming task:</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <h3 style="margin-top: 0; color: #007bff;">${task.title}</h3>
                    ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
                    <p><strong>Priority:</strong> <span style="text-transform: capitalize;">${task.priority}</span></p>
                    <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</p>
                    ${task.tags && task.tags.length > 0 ? `<p><strong>Tags:</strong> ${task.tags.join(', ')}</p>` : ''}
                </div>
                
                <p>Don't forget to mark it as complete when you're done!</p>
                <p>Stay productive!</p>
                <p><strong>The Task Manager Team</strong></p>
            </div>
        `;

        const text = `Task Reminder: ${task.title}. Hello ${user.name}, This is a reminder about your task due on ${new Date(task.dueDate).toLocaleDateString()}.`;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
            text
        });
    }

    async sendTaskOverdueEmail(user, tasks) {
        const subject = `You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''}`;
        const tasksList = tasks.map(task => `
            <li style="margin-bottom: 10px;">
                <strong>${task.title}</strong> - Due: ${new Date(task.dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}
            </li>
        `).join('');

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc3545;">Overdue Tasks Alert</h2>
                <p>Hello ${user.name},</p>
                <p>You have ${tasks.length} overdue task${tasks.length > 1 ? 's' : ''} that need your attention:</p>
                
                <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
                    <ul style="margin: 0; padding-left: 20px;">
                        ${tasksList}
                    </ul>
                </div>
                
                <p>We recommend reviewing these tasks and updating their status or due dates as needed.</p>
                <p>Stay on top of your goals!</p>
                <p><strong>The Task Manager Team</strong></p>
            </div>
        `;

        const text = `Overdue Tasks Alert. Hello ${user.name}, You have ${tasks.length} overdue tasks. Please review and update them.`;

        return this.sendEmail({
            to: user.email,
            subject,
            html,
            text
        });
    }
}

// Create and export a singleton instance
const emailService = new EmailService();
module.exports = emailService; 