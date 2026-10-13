import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER || 'mtamilselvan9221@gmail.com';
    const rawPass = process.env.SMTP_PASS || 'wtfgkcvymoywbytk';
    const pass = rawPass.replace(/\s+/g, ''); // Ensure no spaces in the app password

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      family: 4, // Force IPv4 to fix ENETUNREACH error on Render
    } as any);
  }

  async sendEmail(to: string, subject: string, html: string) {
    this.initTransporter(); // Ensures we have the absolute latest credentials from .env without a restart
    const fs = require('fs');
    const dotenv = require('dotenv');
    let envConfig: any = {};
    try { envConfig = dotenv.parse(fs.readFileSync('.env')); } catch (e) {}

    try {
      const info = await this.transporter.sendMail({
        from: envConfig.SMTP_FROM || process.env.SMTP_FROM || 'noreply@sivm.com',
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  async sendAdminInvitation(email: string, firstName: string, orgName: string, setupLink: string) {
    const subject = `You have been invited as an Administrator for ${orgName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">Welcome to SIVM, ${firstName}!</h2>
        <p style="color: #555; line-height: 1.5;">
          You have been invited to serve as an Organization Administrator for <strong>${orgName}</strong> on the Building Management System platform.
        </p>
        <p style="color: #555; line-height: 1.5;">
          Please click the button below to verify your email address and set up your password. This link will expire in 7 days.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${setupLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Set Up Your Account
          </a>
        </div>
        <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 15px;">
          If you did not expect this invitation, please ignore this email.
        </p>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }
}
