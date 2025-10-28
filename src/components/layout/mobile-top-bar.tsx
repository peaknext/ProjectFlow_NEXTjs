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
 */

'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Menu, Search, MoreVertical, Filter, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { MobileMenu } from '@/components/layout/mobile-menu';

export function MobileTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  // State management
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Determine page title based on route
  const getPageTitle = (): string => {
    // Main pages
    if (pathname === '/dashboard') return 'ProjectFlows';
    if (pathname === '/my-tasks') return 'งานของฉัน';
    if (pathname === '/notifications') return 'แจ้งเตือน';

    // Management pages
    if (pathname === '/users') return 'บุคลากร';
    if (pathname === '/reports') return 'รายงาน';
    if (pathname === '/settings') return 'ตั้งค่า';
    if (pathname === '/profile') return 'โปรไฟล์';

    // Department pages
    if (pathname === '/department/tasks') return 'งานหน่วยงาน';

    // Project pages (dynamic)
    if (pathname?.includes('/projects/')) {
      // Extract view type (board, list, calendar)
      if (pathname.endsWith('/board')) return 'Board View';
      if (pathname.endsWith('/list')) return 'List View';
      if (pathname.endsWith('/calendar')) return 'Calendar View';
      return 'โปรเจกต์';
    }

    return 'ProjectFlows';
  };

  // Determine if back button should show (not on main pages)
  const showBackButton = (): boolean => {
    // Main pages where hamburger menu should show instead
    const mainPages = [
      '/dashboard',
      '/my-tasks',
      '/notifications',
      '/users',
      '/reports',
      '/department/tasks',
    ];
    return !mainPages.includes(pathname);
  };

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleSearch = () => {
    setSearchOpen(true);
  };

  // Render context-specific action buttons
  const renderContextActions = () => {
    const actions: React.ReactElement[] = [];

    const buttonClassName = "h-9 w-9 transition-transform duration-150 active:scale-95";

    // Dashboard - Search
    if (pathname === '/dashboard') {
      actions.push(
        <Button
          key="search"
          variant="ghost"
          size="icon"
          onClick={handleSearch}
          aria-label="Search"
          className={buttonClassName}
        >
          <Search className="h-5 w-5" />
        </Button>
      );
    }

    // My Tasks - Filter
    if (pathname === '/my-tasks') {
      actions.push(
        <Button
          key="filter"
          variant="ghost"
          size="icon"
          onClick={() => console.log('Filter my tasks')}
          aria-label="Filter"
          className={buttonClassName}
        >
          <Filter className="h-5 w-5" />
        </Button>
      );
    }

    // Project views - View switcher (Board/List/Calendar)
    if (pathname?.includes('/projects/')) {
      actions.push(
        <Button
          key="view-switcher"
          variant="ghost"
          size="icon"
          onClick={() => console.log('Switch view')}
          aria-label="Switch view"
          className={buttonClassName}
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
      );
    }

    // Department Tasks - Filter
    if (pathname === '/department/tasks') {
      actions.push(
        <Button
          key="filter"
          variant="ghost"
          size="icon"
          onClick={() => console.log('Filter department tasks')}
          aria-label="Filter"
          className={buttonClassName}
        >
          <Filter className="h-5 w-5" />
        </Button>
      );
    }

    // Users - Filter
    if (pathname === '/users') {
      actions.push(
        <Button
          key="filter"
          variant="ghost"
          size="icon"
          onClick={() => console.log('Filter users')}
          aria-label="Filter"
          className={buttonClassName}
        >
          <Filter className="h-5 w-5" />
        </Button>
      );
    }

    return actions;
  };

  const pageTitle = getPageTitle();
  const hasBackButton = showBackButton();

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'bg-card/95 backdrop-blur-md border-b', // Add backdrop blur
        'h-14', // 56px height
        'flex items-center justify-between',
        'px-4',
        // Animations
        'transition-all duration-200 ease-in-out',
        'animate-in slide-in-from-top-4 fade-in duration-300'
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
            className="h-9 w-9 transition-transform duration-150 active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={openMobileMenu}
            aria-label="Menu"
            className="h-9 w-9 transition-transform duration-150 active:scale-95"
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
            className="h-5 w-5 animate-in fade-in duration-200"
          />
        )}
        <h1 className="text-base font-semibold truncate transition-opacity duration-200">
          {pageTitle}
        </h1>
      </div>

      {/* Right Side - Context actions */}
      <div className="flex items-center gap-1">
        {renderContextActions()}
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </header>
  );
}
