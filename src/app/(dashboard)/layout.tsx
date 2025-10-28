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
 */

'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import { DesktopLayout } from '@/components/layout/desktop-layout';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { useIsMobile } from '@/hooks/use-media-query';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Detect mobile viewport (< 768px)
  const isMobile = useIsMobile();

  return (
    <AuthGuard>
      {/* Switch between mobile and desktop layouts based on viewport */}
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </AuthGuard>
  );
}
