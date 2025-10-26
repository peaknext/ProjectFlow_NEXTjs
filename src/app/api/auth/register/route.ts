/**
 * POST /api/auth/register
 * User registration endpoint
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { hashPassword, generateSecureToken } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';
import { sendVerificationEmail } from '@/lib/email';
import { formatFullName } from '@/lib/user-utils';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  titlePrefix: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  departmentId: z.string().optional(),
  jobTitle: z.string().optional(),
  jobLevel: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse(
        'USER_EXISTS',
        'User with this email already exists',
        400
      );
    }

    // Check if department exists (if provided)
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        return errorResponse(
          'DEPARTMENT_NOT_FOUND',
          'Department not found',
          404
        );
      }
    }

    // Generate salt and hash password
    const salt = generateSecureToken();
    const passwordHash = hashPassword(data.password, salt);

    // Generate email verification token
    const verificationToken = generateSecureToken();

    // Generate fullName for backward compatibility
    const fullName = formatFullName(
      data.titlePrefix,
      data.firstName,
      data.lastName
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        titlePrefix: data.titlePrefix || null,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName, // Auto-generated
        passwordHash,
        salt,
        departmentId: data.departmentId || null,
        jobTitleId: null,
        jobLevel: data.jobLevel || null,
        verificationToken,
        isVerified: false,
        role: 'USER', // Default role
        userStatus: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        departmentId: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.fullName, verificationToken);
    } catch (emailError) {
      // Log email error but don't fail registration
      console.error('Failed to send verification email:', emailError);
      // User can still request resend later
    }

    return successResponse(
      {
        user,
        message:
          'Registration successful. Please check your email to verify your account.',
        verificationRequired: true,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
