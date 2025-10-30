/**
 * Centralized Logging Utility
 *
 * Provides structured logging with environment-aware behavior.
 * In production, only warnings and errors are logged.
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: 'user001' });
 * logger.warn('Rate limit approaching', { requests: 90, limit: 100 });
 * logger.error('Failed to create task', error, { taskId: 'task001' });
 * logger.security('Unauthorized access attempt', { ip: '1.2.3.4', userId: 'user001' });
 * ```
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security';

interface LogMeta {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private isTest = process.env.NODE_ENV === 'test';

  /**
   * Info level - Development only
   * Use for general information and debugging
   */
  info(message: string, meta?: LogMeta): void {
    if (this.isDevelopment && !this.isTest) {
      this.log('info', message, meta);
    }
  }

  /**
   * Warning level - All environments
   * Use for non-critical issues that should be monitored
   */
  warn(message: string, meta?: LogMeta): void {
    this.log('warn', message, meta);
  }

  /**
   * Error level - All environments
   * Use for errors that need immediate attention
   */
  error(message: string, error?: Error | unknown, meta?: LogMeta): void {
    const errorMeta = this.extractErrorInfo(error);
    this.log('error', message, { ...meta, ...errorMeta });

    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToErrorTracking({ message, error, meta });
    // }
  }

  /**
   * Security level - All environments with extra details
   * Use for security-relevant events (auth failures, permission denials, etc.)
   */
  security(message: string, meta?: LogMeta): void {
    const timestamp = new Date().toISOString();
    const securityMeta = {
      ...meta,
      timestamp,
      environment: process.env.NODE_ENV,
      level: 'SECURITY',
    };

    // Always log security events
    console.warn(`[SECURITY] ${message}`, securityMeta);

    // TODO: Send to security monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   sendToSecurityMonitoring({ message, meta: securityMeta });
    // }
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, meta?: LogMeta): void {
    const timestamp = new Date().toISOString();
    const prefix = this.getPrefix(level);

    if (meta && Object.keys(meta).length > 0) {
      switch (level) {
        case 'info':
          console.log(`${prefix} ${message}`, { timestamp, ...meta });
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`, { timestamp, ...meta });
          break;
        case 'error':
          console.error(`${prefix} ${message}`, { timestamp, ...meta });
          break;
      }
    } else {
      switch (level) {
        case 'info':
          console.log(`${prefix} ${message}`);
          break;
        case 'warn':
          console.warn(`${prefix} ${message}`);
          break;
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
      }
    }
  }

  /**
   * Get log prefix based on level
   */
  private getPrefix(level: LogLevel): string {
    const prefixes = {
      info: '[INFO]',
      warn: '[WARN]',
      error: '[ERROR]',
      security: '[SECURITY]',
    };
    return prefixes[level];
  }

  /**
   * Extract error information for logging
   */
  private extractErrorInfo(error: Error | unknown): LogMeta {
    if (!error) return {};

    if (error instanceof Error) {
      return {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: this.isDevelopment ? error.stack : undefined,
      };
    }

    if (typeof error === 'string') {
      return { errorMessage: error };
    }

    return { error: String(error) };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for external use
export type { LogMeta };
