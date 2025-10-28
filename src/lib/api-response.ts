/**
 * API Response Utilities
 * Standardized response format and error handling
 *
 * Security:
 * - VULN-003 Fix: Filter sensitive fields from error responses
 * - VULN-010 Fix: Generic error messages in production
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// List of sensitive field names to filter from error details
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'salt',
  'sessionToken',
  'resetToken',
  'apiKey',
  'secret',
  'privateKey',
  'accessToken',
  'refreshToken',
  'creditCard',
  'ssn',
  'taxId',
];

/**
 * Sanitize error details by removing sensitive fields
 *
 * Security: VULN-003 Fix - Prevent exposure of sensitive data in errors
 *
 * @param details - Error details to sanitize
 * @returns Sanitized error details
 */
function sanitizeErrorDetails(details: any): any {
  if (!details) return undefined;

  // In production, return minimal details
  if (process.env.NODE_ENV === 'production') {
    // For validation errors, only return field names, not values
    if (Array.isArray(details)) {
      return details.map((item) => ({
        field: item.path?.join('.') || 'unknown',
        message: item.message || 'Validation failed',
      }));
    }

    // For objects, filter sensitive fields
    if (typeof details === 'object' && details !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(details)) {
        // Skip sensitive fields
        if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
          continue;
        }

        // Recursively sanitize nested objects
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeErrorDetails(value);
        } else {
          sanitized[key] = value;
        }
      }
      return Object.keys(sanitized).length > 0 ? sanitized : undefined;
    }

    return undefined;
  }

  // In development, return full details for debugging
  return details;
}

/**
 * Get generic error message for production
 *
 * Security: VULN-010 Fix - Prevent information leakage via verbose errors
 *
 * @param message - Original error message
 * @param code - Error code
 * @returns Generic or original message based on environment
 */
function getErrorMessage(message: string, code: string): string {
  // In production, use generic messages for certain error types
  if (process.env.NODE_ENV === 'production') {
    switch (code) {
      case 'INTERNAL_ERROR':
      case 'DATABASE_ERROR':
      case 'UNKNOWN_ERROR':
        return 'An error occurred while processing your request';

      case 'VALIDATION_ERROR':
        return 'Invalid request data';

      case 'UNAUTHORIZED':
        return 'Authentication required';

      case 'FORBIDDEN':
        return 'Access denied';

      default:
        // For other errors, return the original message
        // (assuming they don't contain sensitive info)
        return message;
    }
  }

  // In development, return original message for debugging
  return message;
}

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
 *
 * Security:
 * - VULN-003 Fix: Sanitize error details
 * - VULN-010 Fix: Generic messages in production
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  // Sanitize error details to remove sensitive fields
  const sanitizedDetails = sanitizeErrorDetails(details);

  // Use generic message in production for certain error codes
  const finalMessage = getErrorMessage(message, code);

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: finalMessage,
        ...(sanitizedDetails && { details: sanitizedDetails }),
      },
    },
    { status: statusCode }
  );
}

/**
 * Handle API errors and return appropriate response
 *
 * Security:
 * - VULN-003 Fix: Sanitized error logging
 * - VULN-010 Fix: Generic error messages
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  // Log errors securely (don't log sensitive data in production)
  if (process.env.NODE_ENV === 'production') {
    // In production, log minimal error info
    if (error instanceof Error) {
      console.error('API Error:', {
        name: error.name,
        message: error.message,
        // Don't log stack trace in production
      });
    } else {
      console.error('API Error:', 'Unknown error type');
    }
  } else {
    // In development, log full error for debugging
    console.error('API Error:', error);
  }

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
      error.issues // Will be sanitized by errorResponse
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
          process.env.NODE_ENV === 'development' ? prismaError.meta : undefined
        );

      case 'P2025':
        return errorResponse(
          'NOT_FOUND',
          'Record not found',
          404,
          process.env.NODE_ENV === 'development' ? prismaError.meta : undefined
        );

      case 'P2003':
        return errorResponse(
          'FOREIGN_KEY_CONSTRAINT',
          'Referenced record does not exist',
          400,
          process.env.NODE_ENV === 'development' ? prismaError.meta : undefined
        );

      default:
        return errorResponse(
          'DATABASE_ERROR',
          'Database operation failed',
          500,
          process.env.NODE_ENV === 'development' ? { code: prismaError.code } : undefined
        );
    }
  }

  // Generic Error
  if (error instanceof Error) {
    // In production, don't expose internal error messages
    const message = process.env.NODE_ENV === 'production'
      ? 'An error occurred while processing your request'
      : error.message;

    return errorResponse(
      'INTERNAL_ERROR',
      message,
      500,
      // Never expose stack trace to clients
      undefined
    );
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
