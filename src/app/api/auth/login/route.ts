/**
 * POST /api/auth/login
 * User login endpoint
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSession, verifyPassword } from '@/lib/auth';
import { getRolePermissions } from '@/lib/permissions';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-response';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { department: true },
    });

    if (!user) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return errorResponse(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
        401
      );
    }

    // Check user status
    if (user.userStatus !== 'ACTIVE') {
      return errorResponse(
        'ACCOUNT_SUSPENDED',
        'Your account has been suspended. Please contact administrator.',
        403
      );
    }

    // Create session
    const { sessionToken, expiresAt } = await createSession(user.id);

    // Get user permissions
    const permissions = getRolePermissions(user.role);

    // Return user data + session token
    return successResponse(
      {
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          departmentId: user.departmentId,
          department: user.department
            ? {
                id: user.department.id,
                name: user.department.name,
              }
            : null,
          permissions,
        },
      },
      200
    );
  } catch (error) {
    return handleApiError(error);
  }
}
