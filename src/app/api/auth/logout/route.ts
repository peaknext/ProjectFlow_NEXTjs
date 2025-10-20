/**
 * POST /api/auth/logout
 * User logout endpoint
 */

import { NextRequest } from 'next/server';
import { getSession, deleteSession } from '@/lib/auth';
import { successResponse, ErrorResponses } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session) {
      return ErrorResponses.unauthorized();
    }

    // Delete session
    await deleteSession(session.sessionToken);

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return ErrorResponses.internalError('Logout failed');
  }
}
