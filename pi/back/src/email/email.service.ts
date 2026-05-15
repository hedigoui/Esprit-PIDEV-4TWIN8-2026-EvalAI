import { Injectable } from '@nestjs/common';

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

@Injectable()
export class EmailService {
  private readonly fromAddress =
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    'EvalAI Platform <onboarding@resend.dev>';

  private readonly testRecipient = process.env.EMAIL_TEST_RECIPIENT?.trim();

  constructor() {
    console.log('Initializing EmailService...');
    console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Not set');
    console.log('RESEND_FROM_EMAIL:', this.fromAddress);
  }

  private async sendMail({ to, subject, html, text }: SendMailInput): Promise<string> {
    const apiKey = process.env.RESEND_API_KEY;
    const recipient = this.testRecipient || to;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    console.log('📤 Sending email via Resend API:', {
      to: recipient,
      originalTo: to,
      subject,
      from: this.fromAddress,
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: this.fromAddress,
        to: [recipient],
        subject,
        html,
        text,
      }),
    });

    const raw = await response.text();
    console.log(`📥 Resend API response (${response.status}):`, raw.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Resend API error:', raw);
      throw new Error(`Resend request failed (${response.status}): ${raw}`);
    }

    try {
      const parsed = JSON.parse(raw) as { id?: string };
      return parsed.id || '';
    } catch {
      return '';
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`Attempting to send welcome email to ${email} for ${name}`);

    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Welcome to EvalAI Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #E31837; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="color: #E31837; margin: 0;">Welcome to EvalAI!</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We're excited to have you on board. EvalAI is an AI-Powered Oral Performance Assessment platform that will help you improve your communication skills.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h2 style="color: #E31837; font-size: 18px; margin-top: 0;">Getting Started:</h2>
            <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
              <li>Complete your profile</li>
              <li>Explore the dashboard</li>
              <li>Start your first practice session</li>
            </ul>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">If you have any questions, feel free to contact our support team.</p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666;">Best regards,<br><strong>The EvalAI Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      const messageId = await this.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`✅ Welcome email sent successfully to ${email}`);
      console.log('Message ID:', messageId);
    } catch (error) {
      const err = error as { message?: string; code?: string; command?: string };
      console.error(`❌ Failed to send welcome email to ${email}:`, {
        message: err.message,
        code: err.code,
        command: err.command,
      });
      throw error;
    }
  }

  async sendStatusChangeEmail(
    email: string,
    name: string,
    isActive: boolean,
  ): Promise<void> {
    const status = isActive ? 'activated' : 'deactivated';
    const statusColor = isActive ? '#22c55e' : '#ef4444';
    const backgroundColor = isActive ? '#e8f5e9' : '#ffebee';
    const borderColor = isActive ? '#22c55e' : '#ef4444';

    console.log(
      `Attempting to send status change email to ${email} for ${name} - Status: ${status}`,
    );

    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: `Account ${status} - EvalAI Platform`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #E31837; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="color: #333; margin: 0;"><span style="color: ${statusColor};">Account ${status}</span></h1>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Your EvalAI account has been <strong style="color: ${statusColor}; font-size: 18px;">${status}</strong>.
          </p>
          
          <div style="background: ${backgroundColor}; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid ${borderColor};">
            <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
              ${
                isActive
                  ? '✨ <strong style="color: #22c55e;">Good news!</strong> Your account is now active. You can log in and start using all the features of our platform.'
                  : '⚠️ <strong style="color: #ef4444;">Important:</strong> Your account has been deactivated. If you believe this is a mistake, please contact our support team.'
              }
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666;">Best regards,<br><strong>The EvalAI Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      const messageId = await this.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`✅ Status change email sent successfully to ${email}`);
      console.log('Message ID:', messageId);
    } catch (error) {
      const err = error as { message?: string; code?: string; command?: string };
      console.error(`❌ Failed to send status change email to ${email}:`, {
        message: err.message,
        code: err.code,
        command: err.command,
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    console.log(
      `Attempting to send password reset email to ${email} for ${name}`,
    );

    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Reset Your Password - EvalAI Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #E31837; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="color: #E31837; margin: 0;">Password Reset Request</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We received a request to reset your password for your EvalAI account. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #E31837; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #E31837; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
              ⚠️ <strong>Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            If you're having trouble clicking the button, copy and paste the URL above into your web browser.
          </p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666;">Best regards,<br><strong>The EvalAI Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      const messageId = await this.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`✅ Password reset email sent successfully to ${email}`);
      console.log('Message ID:', messageId);
    } catch (error) {
      const err = error as { message?: string; code?: string; command?: string };
      console.error(`❌ Failed to send password reset email to ${email}:`, {
        message: err.message,
        code: err.code,
        command: err.command,
      });
      throw error;
    }
  }

  async sendNewPasswordEmail(
    email: string,
    name: string,
    newPassword: string,
  ): Promise<void> {
    console.log(
      `Attempting to send new password email to ${email} for ${name}`,
    );

    const frontendUrl =
      process.env.FRONTEND_URL || 'https://evalai-wz24.onrender.com';

    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Your New Password - EvalAI Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #E31837; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="color: #E31837; margin: 0;">Your New Password</h1>
          </div>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We received a request to reset your password. Your new temporary password is:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: white; border: 2px solid #E31837; border-radius: 8px; padding: 20px; display: inline-block;">
              <div style="font-size: 32px; font-weight: bold; color: #E31837; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${newPassword}
              </div>
            </div>
          </div>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1565C0; font-size: 16px; line-height: 1.6;">
              <strong>📝 Next Steps:</strong><br>
              1. Use this password to sign in to your account<br>
              2. Go to Settings and change your password to something more secure<br>
              3. Keep your password safe and don't share it with anyone
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${frontendUrl}" style="display: inline-block; background-color: #E31837; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Sign In Now
            </a>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
              ⚠️ <strong>Security Notice:</strong> This is a temporary password. Please change it immediately after signing in for your account security. If you didn't request a password reset, please contact support immediately.
            </p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666;">Best regards,<br><strong>The EvalAI Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      const messageId = await this.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`✅ New password email sent successfully to ${email}`);
      console.log('Message ID:', messageId);
    } catch (error) {
      const err = error as { message?: string; code?: string; command?: string };
      console.error(`❌ Failed to send new password email to ${email}:`, {
        fullError: error,
        message: err.message,
        code: err.code,
        command: err.command,
      });
      console.error('Error details:', JSON.stringify(error));
      throw error;
    }
  }

  async sendEvaluationResultEmail(
    email: string,
    name: string,
    payload: {
      title?: string;
      cefrLevel?: string;
      score?: number;
      comments?: string;
    },
  ): Promise<string> {
    const title = payload.title || 'Oral Performance';
    const cefr = payload.cefrLevel || 'N/A';
    const score = typeof payload.score === 'number' ? `${Math.round(payload.score)}/100` : 'N/A';
    const comments = payload.comments || '';

    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Your Evaluation Is Ready - EvalAI Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #E31837; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <span style="color: white; font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="color: #E31837; margin: 0;">Evaluation Completed</h1>
          </div>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Your instructor has submitted your evaluation.</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px solid #eee;">
            <p style="margin: 0 0 10px; color: #555;"><strong>Session:</strong> ${title}</p>
            <p style="margin: 0 0 10px; color: #555;"><strong>CEFR Level:</strong> <span style="color: #E31837; font-weight: 700;">${cefr}</span></p>
            <p style="margin: 0; color: #555;"><strong>Score:</strong> ${score}</p>
          </div>

          ${comments ? `<div style="background: #fff; padding: 16px; border-radius: 8px; border-left: 4px solid #E31837;"><strong>Instructor Comments</strong><p style="margin: 8px 0 0; color: #555; line-height: 1.6;">${comments}</p></div>` : ''}

          <div style="margin-top: 30px; padding: 20px; background-color: #f0f0f0; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #666;">Best regards,<br><strong>The EvalAI Team</strong></p>
          </div>
        </div>
      `,
    };

    try {
      const messageId = await this.sendMail({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html,
      });
      console.log(`✅ Evaluation result email sent to ${email}`);
      return messageId || '';
    } catch (error) {
      const err = error as { message?: string; code?: string; command?: string };
      console.error(`❌ Failed to send evaluation result email to ${email}:`, {
        message: err.message,
        code: err.code,
      });
      throw error;
    }
  }
}
