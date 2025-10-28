/**
 * Password Validation Schema
 * Server-side password validation to enforce strong password policy
 *
 * Security: VULN-008 Fix
 */

import { z } from 'zod';

// Common weak passwords to block
const COMMON_WEAK_PASSWORDS = [
  'password',
  'password123',
  'password123!',
  'admin123',
  'admin123!',
  '12345678',
  'qwerty',
  'letmein',
  'welcome',
  'monkey',
];

/**
 * Password schema with strong validation rules
 *
 * Requirements:
 * - 8-128 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 * - Not in common weak passwords list
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^a-zA-Z0-9]/,
    'Password must contain at least one special character (!@#$%^&* etc.)'
  )
  .refine((password) => {
    // Check against common weak passwords (case-insensitive)
    const lowerPassword = password.toLowerCase();
    return !COMMON_WEAK_PASSWORDS.some((weak) =>
      lowerPassword.includes(weak.toLowerCase())
    );
  }, 'Password is too common or weak. Please choose a stronger password.');

/**
 * Password confirmation schema
 * Used for forms that require password and confirmation
 */
export const passwordConfirmationSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Validate password strength (returns detailed error messages)
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  const lowerPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.some((weak) => lowerPassword.includes(weak.toLowerCase()))) {
    errors.push('Password is too common or weak');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate password strength score (0-100)
 */
export function calculatePasswordScore(password: string): number {
  let score = 0;

  // Length score (max 30 points)
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety (max 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Complexity (max 30 points)
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 10;
  if (uniqueChars >= 12) score += 10;
  if (uniqueChars >= 16) score += 10;

  // Penalty for common patterns
  const lowerPassword = password.toLowerCase();
  if (COMMON_WEAK_PASSWORDS.some((weak) => lowerPassword.includes(weak))) {
    score -= 30;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): {
  label: string;
  color: 'red' | 'orange' | 'yellow' | 'green';
} {
  if (score >= 80) return { label: 'Very Strong', color: 'green' };
  if (score >= 60) return { label: 'Strong', color: 'green' };
  if (score >= 40) return { label: 'Medium', color: 'yellow' };
  if (score >= 20) return { label: 'Weak', color: 'orange' };
  return { label: 'Very Weak', color: 'red' };
}
