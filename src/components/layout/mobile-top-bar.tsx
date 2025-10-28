/**
 * MobileTopBar Component
 *
 * Dynamic top bar for mobile devices
 * Features:
 * - Sticky positioning
 * - Dynamic back button (route-based)
 * - Page title (auto or custom)
 * - Context actions (search, filter, etc.)
 *
 * Layout:
 * ┌────────────────────────────────────────┐
 * │ [←/☰]  Page Title        [🔍] [⋮]    │
 * └────────────────────────────────────────┘
 *
 * TODO Phase 3: Full implementation with dynamic behavior
 */

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Menu, Search, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine page title based on route
  const getPageTitle = (): string => {
    if (pathname === '/dashboard') return 'ProjectFlows';
    if (pathname === '/my-tasks') return 'งานของฉัน';
    if (pathname === '/notifications') return 'แจ้งเตือน';
    if (pathname?.includes('/projects/')) {
      // TODO: Get project name from context
      return 'Project';
    }
    return 'ProjectFlows';
  };

  // Determine if back button should show (not on main pages)
  const showBackButton = (): boolean => {
    const mainPages = ['/dashboard', '/my-tasks', '/notifications'];
    return !mainPages.includes(pathname);
  };

  // TODO Phase 4: Implement mobile menu drawer
  const openMobileMenu = () => {
    console.log('Mobile menu not yet implemented');
  };

  const handleBackClick = () => {
    router.back();
  };

  const pageTitle = getPageTitle();
  const hasBackButton = showBackButton();

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'bg-card border-b',
        'h-14', // 56px height
        'flex items-center justify-between',
        'px-4'
      )}
    >
      {/* Left Side - Back button or Hamburger menu */}
      <div className="flex items-center gap-2">
        {hasBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            aria-label="Back"
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={openMobileMenu}
            aria-label="Menu"
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Center - Page Title or Logo */}
      <div className="flex-1 flex items-center justify-center gap-2 mx-2">
        {pathname === '/dashboard' && (
          <Image
            src="/ProjectFlowLogo.svg"
            alt="ProjectFlows"
            width={20}
            height={20}
            className="h-5 w-5"
          />
        )}
        <h1 className="text-base font-semibold truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right Side - Context actions */}
      <div className="flex items-center gap-1">
        {/* Search button - TODO: Implement in later phase */}
        {pathname === '/dashboard' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log('Search not implemented')}
            aria-label="Search"
            className="h-9 w-9"
          >
            <Search className="h-5 w-5" />
          </Button>
        )}

        {/* More actions - TODO: Context-specific actions */}
        {/* <Button
          variant="ghost"
          size="icon"
          aria-label="More actions"
          className="h-9 w-9"
        >
          <MoreVertical className="h-5 w-5" />
        </Button> */}
      </div>
    </header>
  );
}
