/**
 * SwipeablePages Component
 *
 * Enables swipe gestures to navigate between main pages on mobile devices.
 * Desktop mode: Renders children normally without swipe functionality.
 * Mobile mode: Adds horizontal swipe detection with smooth transitions.
 *
 * Page order:
 * 1. งานของฉัน (/my-tasks)
 * 2. เช็คลิสต์ (/checklist)
 * 3. ปฏิทิน (/calendar)
 * 4. แจ้งเตือน (/notifications)
 *
 * Swipe behavior:
 * - Swipe left → Next page (if available)
 * - Swipe right → Previous page (if available)
 * - Threshold: 50px or velocity > 500
 */

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion, PanInfo } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-media-query';
import { useUIStore } from '@/stores/use-ui-store';

interface SwipeablePagesProps {
  children: React.ReactNode;
}

// Define page order for swipe navigation
const PAGE_ORDER = [
  '/my-tasks',
  '/checklist',
  '/calendar',
  '/notifications',
] as const;

export function SwipeablePages({ children }: SwipeablePagesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isAnyModalOpen = useUIStore((state) => state.isAnyModalOpen());

  // Desktop mode: render children without swipe
  if (!isMobile) {
    return <>{children}</>;
  }

  // Find current page index
  const currentIndex = PAGE_ORDER.findIndex((path) => path === pathname);

  // Not a swipeable page, render normally
  if (currentIndex === -1) {
    return <>{children}</>;
  }

  // Modal/Panel is open: disable swipe to prevent gesture conflict
  if (isAnyModalOpen) {
    return <div className="h-full w-full">{children}</div>;
  }

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    // Determine swipe direction
    const isSignificantSwipe =
      Math.abs(offset.x) > swipeThreshold ||
      Math.abs(velocity.x) > velocityThreshold;

    if (!isSignificantSwipe) {
      return; // Not a significant swipe, ignore
    }

    // Swipe left → Next page
    if (offset.x < 0 && currentIndex < PAGE_ORDER.length - 1) {
      const nextPage = PAGE_ORDER[currentIndex + 1];
      router.push(nextPage);
    }

    // Swipe right → Previous page
    if (offset.x > 0 && currentIndex > 0) {
      const prevPage = PAGE_ORDER[currentIndex - 1];
      router.push(prevPage);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="h-full w-full"
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
