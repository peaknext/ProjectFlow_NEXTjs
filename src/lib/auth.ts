/**
 * Authentication Library
 * Session management, password hashing, token generation
 */

import { NextRequest } from 'next/server';
import { prisma } from './db';
import crypto from 'crypto';

export interface Session {
  userId: string;
  sessionToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    departmentId: string | null;
    userStatus: string;
    profileImageUrl: string | null;
  };
}

/**
 * Get session from request
 * Checks Authorization header for Bearer token
 */
export async function getSession(req: NextRequest): Promise<Session | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const sessionToken = authHeader.substring(7); // Remove "Bearer "

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            departmentId: true,
            userStatus: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    // Check user status
    if (session.user.userStatus !== 'ACTIVE') {
      return null;
    }

    return {
      userId: session.userId,
      sessionToken: session.sessionToken,
      user: session.user,
    };
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

/**
 * Create new session for user
 * Returns session token and expiry
 */
export async function createSession(
  userId: string
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSecureToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
  });

  return { sessionToken, expiresAt };
}

/**
 * Delete session (logout)
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  await prisma.session.deleteMany({ where: { sessionToken } });
}

/**
 * Hash password with salt
 * Compatible with GAS implementation
 */
export function hashPassword(password: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

/**
 * Verify password against hash
 */
export function verifyPassword(
  password: string,
  salt: string,
  passwordHash: string
): boolean {
  const hash = hashPassword(password, salt);
  return hash === passwordHash;
}

/**
 * Generate secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
