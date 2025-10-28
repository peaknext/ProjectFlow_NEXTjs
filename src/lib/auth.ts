/**
 * Authentication Library
 * Session management, password hashing, token generation
 *
 * Security Updates:
 * - VULN-001 Fix: Migrated from SHA256 to bcrypt for password hashing
 * - VULN-003 Fix: Session tokens now in httpOnly cookies instead of localStorage
 * - bcrypt provides industry-standard password security with key stretching
 */

import { NextRequest } from 'next/server';
import { prisma } from './db';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { getSessionToken } from './cookie-utils';

// bcrypt configuration
const SALT_ROUNDS = 12; // Industry standard (2^12 iterations)

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
 *
 * Security: VULN-003 Fix - Now reads from httpOnly cookie instead of Authorization header
 *
 * Priority order:
 * 1. httpOnly cookie (preferred, XSS-safe)
 * 2. Authorization header (backward compatibility during transition)
 */
export async function getSession(req: NextRequest): Promise<Session | null> {
  try {
    let sessionToken: string | null = null;

    // 1. Try to get session token from httpOnly cookie (preferred)
    // Security: VULN-003 Fix - httpOnly cookies cannot be accessed via JavaScript
    sessionToken = getSessionToken(req.cookies);

    // 2. Fallback to Authorization header (backward compatibility)
    // TODO: Remove this fallback after frontend migration is complete
    if (!sessionToken) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7); // Remove "Bearer "
      }
    }

    if (!sessionToken) {
      return null;
    }

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
 * Hash password using bcrypt
 * Security: VULN-001 Fix - bcrypt with 12 rounds (industry standard)
 *
 * @param password - Plain text password
 * @returns Promise<string> - bcrypt hash (includes salt)
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password against bcrypt hash
 * Security: VULN-001 Fix - uses bcrypt.compare() with constant-time comparison
 *
 * @param password - Plain text password
 * @param passwordHash - bcrypt hash from database
 * @returns Promise<boolean> - true if password matches
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return await bcrypt.compare(password, passwordHash);
}

/**
 * @deprecated Legacy SHA256 password hashing (INSECURE - DO NOT USE)
 * Only kept for reference during migration period
 * Will be removed after all users have migrated to bcrypt
 */
export function hashPasswordLegacy(password: string, salt: string): string {
  return crypto
    .createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

/**
 * @deprecated Legacy password verification (INSECURE - DO NOT USE)
 * Only kept for reference during migration period
 */
export function verifyPasswordLegacy(
  password: string,
  salt: string,
  passwordHash: string
): boolean {
  const hash = hashPasswordLegacy(password, salt);
  return hash === passwordHash;
}

/**
 * Generate secure random token
 * Security: Using 64 bytes (128 hex characters) for enhanced security
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(64).toString('hex'); // 128 characters
}

/**
 * Generate UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}
