/**
 * Email Service using Resend
 * Handles sending verification emails and other transactional emails
 */

import { Resend } from 'resend';
import VerificationEmail from '@/emails/verification-email';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address (must be verified in Resend dashboard)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send verification email to user
 * @param email User's email address
 * @param userName User's full name
 * @param verificationToken Token for email verification
 * @returns Promise with email send result
 */
export async function sendVerificationEmail(
  email: string,
  userName: string,
  verificationToken: string
) {
  try {
    // Build verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Development mode - log verification link to console
    if (process.env.BYPASS_EMAIL === 'true') {
      console.log('\n' + '='.repeat(70));
      console.log('📧 EMAIL VERIFICATION (DEVELOPMENT MODE)');
      console.log('='.repeat(70));
      console.log('To:', email);
      console.log('Name:', userName);
      console.log('Verification URL:', verificationUrl);
      console.log('='.repeat(70) + '\n');
      return { success: true, messageId: 'dev-mode' };
    }

    // Production mode - send real email using Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'ยืนยันอีเมลของคุณสำหรับ ProjectFlows',
      react: VerificationEmail({
        userName,
        verificationUrl,
      }),
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      throw new Error('Failed to send verification email');
    }

    console.log('Verification email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

/**
 * Send password reset email to user
 * @param email User's email address
 * @param userName User's full name
 * @param resetToken Token for password reset
 * @returns Promise with email send result
 */
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Development mode - log reset link to console
    if (process.env.BYPASS_EMAIL === 'true') {
      console.log('\n' + '='.repeat(70));
      console.log('📧 PASSWORD RESET EMAIL (DEVELOPMENT MODE)');
      console.log('='.repeat(70));
      console.log('To:', email);
      console.log('Name:', userName);
      console.log('Reset URL:', resetUrl);
      console.log('Expires in: 1 hour');
      console.log('='.repeat(70) + '\n');
      return { success: true, messageId: 'dev-mode' };
    }

    // Production mode - send real email
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'รีเซ็ตรหัสผ่านของคุณ - ProjectFlows',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>รีเซ็ตรหัสผ่าน</h1>
          <p>สวัสดี ${userName},</p>
          <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชี ProjectFlows กรุณาคลิกลิงก์ด้านล่าง:</p>
          <p><a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">รีเซ็ตรหัสผ่าน</a></p>
          <p>หรือคัดลอกลิงก์นี้: ${resetUrl}</p>
          <p style="color: #6b7280; font-size: 12px;">ลิงก์นี้จะหมดอายุภายใน 1 ชั่วโมง</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
