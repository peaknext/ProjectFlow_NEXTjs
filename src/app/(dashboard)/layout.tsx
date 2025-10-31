/**
 * Dashboard Layout (Responsive)
 *
 * Main layout wrapper that switches between desktop and mobile layouts
 * based on viewport size (breakpoint: 768px)
 *
 * Desktop (>= 768px): Sidebar + Top Navbar
 * Mobile (< 768px): Bottom Navigation + Mobile Top Bar
 *
 * All pages under (dashboard) route use this layout.
 *
 * Special case: IT Service pages with USER role use clean layout (no sidebar)
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { ITServiceTopBar } from '@/components/layout/it-service-top-bar';
import { useIsMobile } from '@/hooks/use-media-query';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect mobile viewport (< 768px)
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Define allowed paths for USER role (pages that USER can access)
  const userAllowedPaths = ['/it-service', '/profile', '/settings'];
  const isUserAllowedPath = pathname && userAllowedPaths.some(path => pathname.startsWith(path));

  // Check if user is in IT Service pages with USER role
  // IT Service pages handle their own layout via ITServiceLayout component
  const isITServicePageWithUserRole =
    pathname?.startsWith('/it-service') && user?.role === 'USER';

  // Check if USER role is in allowed pages (profile/settings) - use clean layout
  const isUserInAllowedPage =
    user?.role === 'USER' &&
    pathname &&
    (pathname.startsWith('/profile') || pathname.startsWith('/settings'));

  // Redirect USER role away from dashboard pages to IT Service
  // Except for allowed pages (profile, settings)
  useEffect(() => {
    if (user && user.role === 'USER' && pathname && !isUserAllowedPath) {
      router.replace('/it-service');
    }
  }, [user, pathname, router, isUserAllowedPath]);

  // Show loading screen while redirecting USER role
  if (user && user.role === 'USER' && pathname && !isUserAllowedPath) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      {/* IT Service pages with USER role: let ITServiceLayout handle layout */}
      {isITServicePageWithUserRole ? (
        children
      ) : /* Profile/Settings pages with USER role: use clean layout (no sidebar) */ isUserInAllowedPage ? (
        <div className="flex h-screen flex-col bg-background">
          {/* Top bar for USER role (logo, fiscal year, notifications, user dropdown) */}
          <ITServiceTopBar />
          {/* Content area (scrollable) */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      ) : (
        // Regular dashboard pages: use responsive layout
        <>
          {isMobile ? (
            <MobileLayout>{children}</MobileLayout>
          ) : (
            <DesktopLayout>{children}</DesktopLayout>
          )}
        </>
      )}
    </AuthGuard>
  );
}
