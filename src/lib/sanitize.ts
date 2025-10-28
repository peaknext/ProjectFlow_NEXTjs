/**
 * Input Sanitization Utility
 *
 * Security: VULN-009 Fix - Prevent XSS attacks
 *
 * This module provides functions to sanitize user input to prevent
 * Cross-Site Scripting (XSS) attacks.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content
 *
 * Removes potentially dangerous HTML/JavaScript while preserving safe formatting.
 * Used for rich text fields like comments and task descriptions.
 *
 * @param html - Raw HTML string from user input
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    // Allow common formatting tags
    ALLOWED_TAGS: [
      'b',
      'i',
      'u',
      'strong',
      'em',
      'p',
      'br',
      'ul',
      'ol',
      'li',
      'a',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'code',
      'pre',
    ],
    // Allow safe attributes
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    // Ensure links are safe
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Add rel="noopener noreferrer" to all links
    ADD_ATTR: ['target'],
    // Remove scripts and event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    // Keep relative URLs
    KEEP_CONTENT: true,
    // Return a string
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
}

/**
 * Sanitize plain text
 *
 * Removes all HTML tags and encodes special characters.
 * Used for fields that should not contain any HTML (e.g., names, titles).
 *
 * @param text - Raw text string from user input
 * @returns Sanitized plain text string
 */
export function sanitizePlainText(text: string): string {
  if (!text) return '';

  // Strip all HTML tags
  const stripped = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Encode special characters
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize URL
 *
 * Ensures URL is safe and doesn't contain javascript: or data: URIs.
 *
 * @param url - Raw URL string from user input
 * @returns Sanitized URL string or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // Remove whitespace
  url = url.trim();

  // Check for dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ];

  const lowerUrl = url.toLowerCase();
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn(`🚨 Blocked dangerous URL protocol: ${protocol}`);
      return '';
    }
  }

  // Only allow http, https, mailto, tel protocols or relative URLs
  if (
    !lowerUrl.startsWith('http://') &&
    !lowerUrl.startsWith('https://') &&
    !lowerUrl.startsWith('mailto:') &&
    !lowerUrl.startsWith('tel:') &&
    !lowerUrl.startsWith('/')
  ) {
    // Assume https if no protocol specified
    return `https://${url}`;
  }

  return url;
}

/**
 * Sanitize mention content
 *
 * Used for @mentions in comments to prevent XSS through mention text.
 *
 * @param mention - Raw mention string (e.g., "@user123")
 * @returns Sanitized mention string
 */
export function sanitizeMention(mention: string): string {
  if (!mention) return '';

  // Remove any HTML tags
  const cleaned = DOMPurify.sanitize(mention, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });

  // Validate mention format (@username or @userid)
  const mentionRegex = /^@[\w\-]+$/;
  if (!mentionRegex.test(cleaned)) {
    console.warn('🚨 Invalid mention format:', mention);
    return '';
  }

  return cleaned;
}

/**
 * Sanitize file name
 *
 * Removes dangerous characters from file names to prevent path traversal.
 *
 * @param filename - Raw file name from user input
 * @returns Sanitized file name
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  // Remove path separators and null bytes
  let cleaned = filename
    .replace(/[\/\\]/g, '')
    .replace(/\0/g, '')
    .replace(/\.\./g, '');

  // Remove leading dots
  cleaned = cleaned.replace(/^\.+/, '');

  // Limit length
  if (cleaned.length > 255) {
    const ext = cleaned.split('.').pop() || '';
    const nameLength = 255 - ext.length - 1;
    cleaned = cleaned.substring(0, nameLength) + '.' + ext;
  }

  return cleaned || 'file';
}

/**
 * Sanitize search query
 *
 * Sanitizes search queries to prevent SQL injection and XSS.
 *
 * @param query - Raw search query from user input
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove HTML tags
  const cleaned = DOMPurify.sanitize(query, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });

  // Trim and normalize whitespace
  return cleaned.trim().replace(/\s+/g, ' ');
}
