import nodemailer from 'nodemailer';
import { User } from '../models/User';
import { logger } from '../utils/logger';

interface EmailTemplate {
  subject: string;
  html: string;
}

const getEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailTemplates = {
  welcomeDay1: (displayName: string): EmailTemplate => ({
    subject: '🎉 Welcome to TodoPro - Your Task Management Journey Begins!',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .content { padding: 30px; background: #f9f9f9; border-radius: 8px; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .tips { background: #fff; padding: 20px; border-left: 4px solid #667eea; margin: 15px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, ${displayName}! 👋</h1>
              <p>Get ready to master your productivity</p>
            </div>
            
            <div class="content">
              <h2>We're excited to have you on board!</h2>
              <p>TodoPro is your advanced task management companion designed to help you organize, prioritize, and accomplish your goals.</p>
              
              <h3>✨ Key Features You Can Use Right Now:</h3>
              <ul>
                <li><strong>Smart Categories:</strong> Organize tasks by Work, Personal, Shopping, Health</li>
                <li><strong>Priority Levels:</strong> Set High, Medium, or Low priority for each task</li>
                <li><strong>Drag-and-Drop:</strong> Reorder tasks exactly how you want them</li>
                <li><strong>Offline Support:</strong> Access your tasks without internet connection</li>
                <li><strong>Due Dates:</strong> Set deadlines and never miss a task</li>
              </ul>
              
              <div class="tips">
                <strong>💡 Pro Tip:</strong> Start by adding 3-5 tasks for today. Focus on what matters most!
              </div>
              
              <a href="https://todopro.app" class="cta-button">Get Started Now</a>
              
              <p>Questions? We're here to help. Just reply to this email!</p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 TodoPro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  tipsDay3: (displayName: string): EmailTemplate => ({
    subject: '💡 3 Power Tips to Master TodoPro (Day 3)',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
            .tip { background: #fff; padding: 20px; border-left: 4px solid #f5576c; margin: 15px 0; border-radius: 6px; }
            .tip h3 { margin-top: 0; color: #f5576c; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Doing Great! 🚀</h1>
              <p>3 Days In - Here Are Your Power Tips</p>
            </div>
            
            <div class="tip">
              <h3>🎯 Tip 1: Use Categories Strategically</h3>
              <p>Group related tasks by category. This helps your brain categorize and process information faster. Use consistent categories for better organization.</p>
            </div>
            
            <div class="tip">
              <h3>⚡ Tip 2: Master Priority Levels</h3>
              <p>Set priorities like this: High = Must do today, Medium = Important this week, Low = Nice to have. This prevents overwhelm!</p>
            </div>
            
            <div class="tip">
              <h3>📱 Tip 3: Install the App</h3>
              <p>Make TodoPro part of your daily flow by installing it on your phone. You'll get the "Install" prompt when you next open the app. One click and it's on your home screen!</p>
            </div>
            
            <a href="https://todopro.app" class="cta-button">Open TodoPro</a>
            
            <p style="margin-top: 30px; color: #666;">
              Next week we'll share insights about your productivity patterns. Keep building those great habits! 💪
            </p>
            
            <div class="footer">
              <p>&copy; 2026 TodoPro. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  checkInDay7: (displayName: string, stats?: { totalTodos?: number; completedTodos?: number }): EmailTemplate => {
    const completionRate = stats?.totalTodos 
      ? Math.round((stats.completedTodos || 0) / stats.totalTodos * 100)
      : 0;

    return {
      subject: `📊 Week 1 Check-In: Your TodoPro Progress, ${displayName}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
              .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .stat-box { background: #f9f9f9; padding: 20px; text-align: center; border-radius: 6px; }
              .stat-number { font-size: 32px; font-weight: bold; color: #4facfe; }
              .stat-label { font-size: 12px; color: #999; text-transform: uppercase; }
              .achievement { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #ffc107; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 One Week Anniversary!</h1>
                <p>Here's how you're doing with TodoPro</p>
              </div>
              
              <div class="stats">
                <div class="stat-box">
                  <div class="stat-number">${stats?.totalTodos || 0}</div>
                  <div class="stat-label">Total Tasks</div>
                </div>
                <div class="stat-box">
                  <div class="stat-number">${stats?.completedTodos || 0}</div>
                  <div class="stat-label">Completed</div>
                </div>
              </div>
              
              <div style="text-align: center; padding: 20px; background: #f0f0f0; border-radius: 6px; margin: 20px 0;">
                <p style="font-size: 24px; margin: 0;">📈 ${completionRate}% Completion Rate</p>
              </div>
              
              <div class="achievement">
                <strong>🏆 Achievement Unlocked: Week 1 Master!</strong>
                <p>You've successfully started your productivity journey. Keep this momentum going!</p>
              </div>
              
              <h3>📝 What's Next?</h3>
              <ul>
                <li><strong>Set Recurring Tasks:</strong> Create weekly or monthly tasks for habits</li>
                <li><strong>Review & Adjust:</strong> Check what's working and what's not</li>
                <li><strong>Build Streaks:</strong> Try to maintain a daily completion streak</li>
                <li><strong>Collaborate:</strong> Share your progress with friends (coming soon!)</li>
              </ul>
              
              <a href="https://todopro.app" class="cta-button">Continue Your Journey</a>
              
              <p style="margin-top: 30px; color: #666;">
                We're constantly working to improve TodoPro. Have feedback? We'd love to hear it!
              </p>
              
              <div class="footer">
                <p>&copy; 2026 TodoPro. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },
};

export const emailDripService = {
  async scheduleEmailDrip(userId: string, email: string, displayName: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const now = new Date();
      const dripSchedule = {
        day1WelcomeSent: false,
        day1WelcomeSentAt: null,
        day3TipsSent: false,
        day3TipsSentAt: null,
        day7CheckInSent: false,
        day7CheckInSentAt: null,
        createdAt: now,
      };

      (user as any).emailDripSchedule = dripSchedule;
      await user.save();

      await this.sendWelcomeEmail(userId, email, displayName);
    } catch (error) {
      logger.error('Error scheduling email drip:', error);
    }
  },

  async sendWelcomeEmail(userId: string, email: string, displayName: string): Promise<void> {
    try {
      const transporter = getEmailTransporter();
      const template = emailTemplates.welcomeDay1(displayName);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@todopro.app',
        to: email,
        subject: template.subject,
        html: template.html,
      });

      await User.findByIdAndUpdate(userId, {
        'emailDripSchedule.day1WelcomeSent': true,
        'emailDripSchedule.day1WelcomeSentAt': new Date(),
      });

      logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
      logger.error('Error sending welcome email:', error);
    }
  },

  async sendTipsEmail(userId: string, email: string, displayName: string): Promise<void> {
    try {
      const transporter = getEmailTransporter();
      const template = emailTemplates.tipsDay3(displayName);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@todopro.app',
        to: email,
        subject: template.subject,
        html: template.html,
      });

      await User.findByIdAndUpdate(userId, {
        'emailDripSchedule.day3TipsSent': true,
        'emailDripSchedule.day3TipsSentAt': new Date(),
      });

      logger.info(`Tips email sent to ${email}`);
    } catch (error) {
      logger.error('Error sending tips email:', error);
    }
  },

  async sendCheckInEmail(userId: string, email: string, displayName: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const { Todo } = require('../models/Todo');
      const stats = await Todo.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalTodos: { $sum: 1 },
            completedTodos: { $sum: { $cond: ['$completed', 1, 0] } },
          },
        },
      ]);

      const userStats = stats[0] || { totalTodos: 0, completedTodos: 0 };

      const transporter = getEmailTransporter();
      const template = emailTemplates.checkInDay7(displayName, userStats);

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@todopro.app',
        to: email,
        subject: template.subject,
        html: template.html,
      });

      await User.findByIdAndUpdate(userId, {
        'emailDripSchedule.day7CheckInSent': true,
        'emailDripSchedule.day7CheckInSentAt': new Date(),
      });

      logger.info(`Check-in email sent to ${email}`);
    } catch (error) {
      logger.error('Error sending check-in email:', error);
    }
  },

  async processPendingEmails(): Promise<void> {
    try {
      const now = new Date();
      const day3 = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const day3Users = await User.find({
        'emailDripSchedule.day3TipsSent': false,
        'emailDripSchedule.createdAt': { $lte: day3 },
      });

      for (const user of day3Users) {
        await this.sendTipsEmail(user._id.toString(), user.email, user.displayName);
      }

      const day7Users = await User.find({
        'emailDripSchedule.day7CheckInSent': false,
        'emailDripSchedule.createdAt': { $lte: day7 },
      });

      for (const user of day7Users) {
        await this.sendCheckInEmail(user._id.toString(), user.email, user.displayName);
      }

      logger.info('Processed pending email drips');
    } catch (error) {
      logger.error('Error processing pending emails:', error);
    }
  },
};
