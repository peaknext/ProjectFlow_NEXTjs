/**
 * API Middleware
 * Authentication and permission wrapper for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, type Session } from './auth';
import { checkPermission } from './permissions';
import { ErrorResponses, handleApiError } from './api-response';
import { prisma } from './db';

// Extend NextRequest to include session
export interface AuthenticatedRequest extends NextRequest {
  session: Session;
}

type ApiHandler<T = any> = (
  req: AuthenticatedRequest,
  context: T
) => Promise<NextResponse>;

// Next.js 15 compatible route handler type
type NextRouteHandler<T = any> = (
  req: NextRequest,
  context: T
) => Promise<NextResponse> | NextResponse;

/**
 * Require authentication middleware
 * Attaches session to request
 */
export function withAuth<T = any>(handler: ApiHandler<T>): NextRouteHandler<T> {
  return async (req: NextRequest, context: T) => {
    try {
      // BYPASS AUTH FOR TESTING (controlled by .env)
      if (process.env.BYPASS_AUTH === 'true') {
        const authenticatedReq = req as AuthenticatedRequest;

        // Fetch real user from database (defaults to user001, or use BYPASS_USER_ID env)
        const bypassUserId = process.env.BYPASS_USER_ID || 'user001';
        const user = await prisma.user.findUnique({
          where: { id: bypassUserId },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            departmentId: true,
            userStatus: true,
            profileImageUrl: true,
          },
        });

        if (!user) {
          console.error(`BYPASS_AUTH: User ${bypassUserId} not found in database`);
          return ErrorResponses.unauthorized();
        }

        // Create session from real user data
        authenticatedReq.session = {
          userId: user.id,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            departmentId: user.departmentId,
            userStatus: user.userStatus,
            profileImageUrl: user.profileImageUrl,
          },
        };
        return await handler(authenticatedReq, context);
      }

      const session = await getSession(req);

      if (!session) {
        return ErrorResponses.unauthorized();
      }

      // Attach session to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.session = session;

      return await handler(authenticatedReq, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Require specific permission middleware
 */
export function withPermission<T = any>(
  permission: string,
  handler: ApiHandler<T>,
  contextExtractor?: (req: NextRequest, context: T) => {
    projectId?: string;
    taskId?: string;
    departmentId?: string;
  }
): NextRouteHandler<T> {
  return withAuth(async (req: AuthenticatedRequest, context: T) => {
    try {
      // Extract context for permission check
      const permissionContext = contextExtractor
        ? contextExtractor(req, context)
        : undefined;

      // Check permission
      const hasPermission = await checkPermission(
        req.session.userId,
        permission,
        permissionContext
      );

      if (!hasPermission) {
        return ErrorResponses.forbidden();
      }

      return await handler(req, context);
    } catch (error) {
      return handleApiError(error);
    }
  });
}

/**
 * Combined middleware with error handling
 */
export function apiHandler<T = any>(handler: ApiHandler<T>): NextRouteHandler<T> {
  return async (req: NextRequest, context: T) => {
    try {
      return await handler(req as AuthenticatedRequest, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

/**
 * Role-based access middleware
 */
export function withRole<T = any>(
  allowedRoles: string[],
  handler: ApiHandler<T>
): NextRouteHandler<T> {
  return withAuth(async (req: AuthenticatedRequest, context: T) => {
    if (!allowedRoles.includes(req.session.user.role)) {
      return ErrorResponses.forbidden();
    }

    return await handler(req, context);
  });
}
