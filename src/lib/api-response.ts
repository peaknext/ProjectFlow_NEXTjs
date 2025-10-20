/**
 * API Response Utilities
 * Standardized response format and error handling
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Success response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode }
  );
}

/**
 * Error response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  // Custom API Error
  if (error instanceof ApiError) {
    return errorResponse(
      error.code,
      error.message,
      error.statusCode,
      error.details
    );
  }

  // Zod Validation Error
  if (error instanceof ZodError) {
    return errorResponse(
      'VALIDATION_ERROR',
      'Invalid request data',
      400,
      error.errors
    );
  }

  // Prisma Errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };

    switch (prismaError.code) {
      case 'P2002':
        return errorResponse(
          'DUPLICATE_ENTRY',
          'A record with this value already exists',
          409,
          prismaError.meta
        );

      case 'P2025':
        return errorResponse(
          'NOT_FOUND',
          'Record not found',
          404,
          prismaError.meta
        );

      case 'P2003':
        return errorResponse(
          'FOREIGN_KEY_CONSTRAINT',
          'Referenced record does not exist',
          400,
          prismaError.meta
        );

      default:
        return errorResponse(
          'DATABASE_ERROR',
          'Database operation failed',
          500,
          { code: prismaError.code }
        );
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return errorResponse('INTERNAL_ERROR', error.message, 500);
  }

  // Unknown error
  return errorResponse('UNKNOWN_ERROR', 'An unexpected error occurred', 500);
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  unauthorized: () =>
    errorResponse('UNAUTHORIZED', 'Authentication required', 401),

  forbidden: () =>
    errorResponse('FORBIDDEN', 'You do not have permission to access this resource', 403),

  notFound: (resource: string = 'Resource') =>
    errorResponse('NOT_FOUND', `${resource} not found`, 404),

  badRequest: (message: string = 'Invalid request') =>
    errorResponse('BAD_REQUEST', message, 400),

  conflict: (message: string = 'Resource already exists') =>
    errorResponse('CONFLICT', message, 409),

  internalError: (message: string = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500),
};
