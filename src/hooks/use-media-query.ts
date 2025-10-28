/**
 * useMediaQuery Hook
 *
 * React hook for detecting media query matches with SSR support.
 * Listens for viewport changes and updates state reactively.
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 769px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *
 * return isMobile ? <MobileLayout /> : <DesktopLayout />;
 * ```
 *
 * @param query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns boolean - true if media query matches, false otherwise
 */

'use client';

import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  // Initialize with false to prevent hydration mismatch
  // On client mount, it will update to actual value
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create MediaQueryList object
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Define listener callback
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Attach listener
    // Modern browsers use addEventListener
    media.addEventListener('change', listener);

    // Cleanup function
    return () => {
      media.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
}

/**
 * Common breakpoint queries for convenience
 * Based on Tailwind CSS default breakpoints
 */
export const BREAKPOINTS = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',

  // Mobile-first (max-width)
  mobile: '(max-width: 767px)',      // < 768px
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',

  // Touch device detection
  touch: '(hover: none) and (pointer: coarse)',
  mouse: '(hover: hover) and (pointer: fine)',

  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',

  // Color scheme
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
} as const;

/**
 * Convenience hooks for common breakpoints
 *
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * const isDesktop = useIsDesktop();
 * const isTouchDevice = useIsTouchDevice();
 * ```
 */
export function useIsMobile(): boolean {
  return useMediaQuery(BREAKPOINTS.mobile);
}

export function useIsTablet(): boolean {
  return useMediaQuery(BREAKPOINTS.tablet);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(BREAKPOINTS.desktop);
}

export function useIsTouchDevice(): boolean {
  return useMediaQuery(BREAKPOINTS.touch);
}

export function useIsDarkMode(): boolean {
  return useMediaQuery(BREAKPOINTS.darkMode);
}
