/**
 * API Middleware
 * Authentication and permission wrapper for API routes
 *
 * Security:
 * - VULN-006 Fix: CSRF protection via origin validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, type Session } from './auth';
import { checkPermission } from './permissions';
import { ErrorResponses, handleApiError } from './api-response';
import { prisma } from './db';
import { validateCsrfProtection } from './csrf';

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
      // BYPASS AUTH FOR TESTING - DEVELOPMENT ONLY
      // Security: Only allow in development environment to prevent accidental production bypass
      if (
        process.env.NODE_ENV === 'development' &&
        process.env.BYPASS_AUTH === 'true'
      ) {
        console.warn('⚠️  BYPASS_AUTH is ENABLED - Development mode only!');
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
          sessionToken: 'bypass-token',
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

        // CSRF Protection (still needed in bypass mode for security testing)
        const csrfValidation = validateCsrfProtection(req, user.id);
        if (!csrfValidation.success) {
          console.warn('🚨 CSRF validation failed (bypass mode):', csrfValidation.error);
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CSRF_VALIDATION_FAILED',
                message: csrfValidation.error || 'CSRF validation failed',
              },
            },
            { status: 403 }
          );
        }

        return await handler(authenticatedReq, context);
      }

      // Production: Ensure BYPASS_AUTH is never enabled
      if (process.env.BYPASS_AUTH === 'true') {
        console.error('🚨 SECURITY ALERT: BYPASS_AUTH is enabled in production! This is a critical security vulnerability.');
        // In production, ignore BYPASS_AUTH and require proper authentication
      }

      const session = await getSession(req);

      if (!session) {
        return ErrorResponses.unauthorized();
      }

      // Attach session to request
      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.session = session;

      // CSRF Protection
      // Security: VULN-006 Fix - Validate request origin for state-changing operations
      const csrfValidation = validateCsrfProtection(req, session.userId);
      if (!csrfValidation.success) {
        console.warn('🚨 CSRF validation failed:', csrfValidation.error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CSRF_VALIDATION_FAILED',
              message: csrfValidation.error || 'CSRF validation failed',
            },
          },
          { status: 403 }
        );
      }

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
