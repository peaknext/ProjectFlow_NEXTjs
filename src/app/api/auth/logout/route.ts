/**
 * POST /api/auth/logout
 * User logout endpoint
 *
 * Security:
 * - VULN-003 Fix: Clear httpOnly cookie on logout
 */

import { NextRequest } from 'next/server';
import { getSession, deleteSession } from '@/lib/auth';
import { successResponse, ErrorResponses } from '@/lib/api-response';
import { clearSessionCookie } from '@/lib/cookie-utils';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return ErrorResponses.unauthorized();
    }

    // Delete session from database
    await deleteSession(session.sessionToken);

    // Create success response
    const response = successResponse({ message: 'Logged out successfully' });

    // Clear httpOnly cookie
    // Security: VULN-003 Fix - Remove session cookie
    clearSessionCookie(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return ErrorResponses.internalError('Logout failed');
  }
}
