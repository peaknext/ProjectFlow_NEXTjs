/**
 * POST /api/admin/users
 * Create new user (ADMIN only)
 *
 * Features:
 * - ADMIN only access
 * - Auto-generates secure random password
 * - Sets isVerified = true, userStatus = ACTIVE
 * - Sends password reset email to user
 * - Supports new fields: workLocation, internalPhone
 */

import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import { hashPassword, generateSecureToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { formatFullName } from '@/lib/user-utils';
import crypto from 'crypto';

/**
 * Generate a secure random password
 * Format: 16 characters with uppercase, lowercase, numbers, and special characters
 */
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = 4; i < 16; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  // Get current user to check role
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Only ADMIN can create users
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return errorResponse(
      'FORBIDDEN',
      'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถสร้างผู้ใช้ใหม่ได้',
      403
    );
  }

  try {
    const body = await req.json();
    const {
      email,
      titlePrefix,
      firstName,
      lastName,
      departmentId,
      role,
      jobTitleId,
      jobLevel,
      workLocation,
      internalPhone,
    } = body;

    // Validation
    if (!email || !firstName || !lastName || !departmentId || !role) {
      return errorResponse(
        'VALIDATION_ERROR',
        'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (email, firstName, lastName, departmentId, role)',
        400
      );
    }

    // Generate fullName for backward compatibility
    const fullName = formatFullName(titlePrefix, firstName, lastName);

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('VALIDATION_ERROR', 'รูปแบบอีเมลไม่ถูกต้อง', 400);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return errorResponse(
        'EMAIL_EXISTS',
        'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น',
        400
      );
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      return errorResponse('VALIDATION_ERROR', 'ไม่พบหน่วยงานที่ระบุ', 400);
    }

    // Validate role
    const validRoles = ['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER'];
    if (!validRoles.includes(role)) {
      return errorResponse('VALIDATION_ERROR', 'บทบาทไม่ถูกต้อง', 400);
    }

    // Generate secure random password
    const randomPassword = generateSecurePassword();
    // Security: VULN-001 Fix - using bcrypt instead of SHA256
    const passwordHash = await hashPassword(randomPassword);

    // Generate reset token for first-time password setup
    const resetToken = generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create user with auto-verified status
    const user = await prisma.user.create({
      data: {
        email,
        titlePrefix: titlePrefix || null,
        firstName,
        lastName,
        fullName, // Auto-generated for backward compatibility
        passwordHash,
        salt: '', // Legacy field - not used with bcrypt
        departmentId,
        role,
        jobTitleId: jobTitleId || null,
        jobLevel: jobLevel || null,
        workLocation: workLocation || null,
        internalPhone: internalPhone || null,
        isVerified: true, // Auto-verified since created by ADMIN
        userStatus: 'ACTIVE', // Active immediately
        resetToken,
        resetTokenExpiry,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        jobTitleId: true,
        jobTitle: {
          select: {
            id: true,
            jobTitleTh: true,
            jobTitleEn: true,
          },
        },
        jobLevel: true,
        workLocation: true,
        internalPhone: true,
        userStatus: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Send password reset email to user
    try {
      await sendPasswordResetEmail(email, fullName, resetToken);
    } catch (emailError) {
      console.error('[AdminCreateUser] Failed to send reset email:', emailError);
      // Don't fail the user creation if email fails
      // The user is created successfully, just log the error
    }

    return successResponse(
      {
        user,
        message: 'สร้างผู้ใช้สำเร็จ อีเมลสำหรับตั้งรหัสผ่านได้ถูกส่งไปยังผู้ใช้แล้ว',
      },
      201
    );
  } catch (error: any) {
    console.error('[AdminCreateUser] Error:', error);
    return errorResponse(
      'SERVER_ERROR',
      'เกิดข้อผิดพลาดในการสร้างผู้ใช้',
      500
    );
  }
}

// Export with authentication middleware
export const POST = withAuth(handler);
