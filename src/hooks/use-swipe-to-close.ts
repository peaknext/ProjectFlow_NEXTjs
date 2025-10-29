/**
 * useSwipeToClose Hook
 *
 * Provides swipe-to-close functionality for modals/panels on mobile
 * Swipe right (left to right) gesture closes the modal
 *
 * Usage:
 * const swipeHandlers = useSwipeToClose(onClose);
 * <motion.div {...swipeHandlers}>...</motion.div>
 */

import { PanInfo } from 'framer-motion';

interface UseSwipeToCloseOptions {
  threshold?: number;
  velocityThreshold?: number;
  onClose: () => void;
}

export function useSwipeToClose({
  threshold = 100,
  velocityThreshold = 500,
  onClose,
}: UseSwipeToCloseOptions) {
  const handlePanEnd = (_event: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Only respond to rightward swipe (left to right)
    if (offset.x < 0) return;

    // Check if swipe is significant enough
    const isSignificantSwipe =
      offset.x > threshold || velocity.x > velocityThreshold;

    if (isSignificantSwipe) {
      onClose();
    }
  };

  return {
    drag: 'x' as const,
    dragConstraints: { left: 0, right: 0 },
    dragElastic: { left: 0, right: 0.3 },
    onDragEnd: handlePanEnd,
  };
}
