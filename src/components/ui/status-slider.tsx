'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface StatusSliderProps {
  statuses: Status[];
  value: string; // statusId
  onChange: (statusId: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * StatusSlider Component
 *
 * Dynamic range slider with gradient track based on project statuses.
 * Features:
 * - Dynamic gradient (filled portion uses status colors)
 * - Thumb color matches current status
 * - Labels below slider (status names)
 * - Feedback text above slider (current status name)
 * - Focus ring matches status color
 * - Dark mode support
 *
 * @example
 * <StatusSlider
 *   statuses={projectStatuses}
 *   value={task.statusId}
 *   onChange={(newStatusId) => setStatusId(newStatusId)}
 *   disabled={isClosed || !canEdit}
 * />
 */
export function StatusSlider({
  statuses,
  value,
  onChange,
  disabled = false,
  className
}: StatusSliderProps) {
  // Sort statuses by order to ensure correct sequence
  const sortedStatuses = useMemo(() => {
    return [...statuses].sort((a, b) => a.order - b.order);
  }, [statuses]);

  // Find current index from statusId
  const currentIndex = useMemo(() => {
    const index = sortedStatuses.findIndex(s => s.id === value);
    return index >= 0 ? index : 0;
  }, [sortedStatuses, value]);

  // Current status object
  const currentStatus = useMemo(() => {
    return sortedStatuses[currentIndex] || sortedStatuses[0];
  }, [sortedStatuses, currentIndex]);

  // Track slider value (index)
  const [sliderValue, setSliderValue] = useState(currentIndex);

  // Update slider value when external value changes
  useEffect(() => {
    setSliderValue(currentIndex);
  }, [currentIndex]);

  // Generate gradient stops for the filled portion
  const gradientBackground = useMemo(() => {
    if (sortedStatuses.length === 0) return 'linear-gradient(to right, #e5e7eb, #e5e7eb)';

    const totalSteps = sortedStatuses.length - 1;
    if (totalSteps === 0) return `linear-gradient(to right, ${sortedStatuses[0].color}, ${sortedStatuses[0].color})`;

    const cutoffPercent = (sliderValue / totalSteps) * 100;

    // Build gradient stops for filled portion (0 to current index)
    const gradientStops = sortedStatuses
      .slice(0, sliderValue + 1)
      .map((status, i) => {
        const stopPercent = (i / totalSteps) * 100;
        return `${status.color} ${stopPercent}%`;
      })
      .join(', ');

    // Neutral color for unfilled portion (dark mode aware)
    const neutralColor = '#e5e7eb'; // Will be overridden by CSS for dark mode

    // If slider is not at the end, add neutral color for remaining portion
    if (sliderValue < totalSteps) {
      return `linear-gradient(to right, ${gradientStops}, ${neutralColor} ${cutoffPercent}%, ${neutralColor} 100%)`;
    }

    // If slider is at the end, fill entirely with gradient
    return `linear-gradient(to right, ${gradientStops})`;
  }, [sortedStatuses, sliderValue]);

  // Handle slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setSliderValue(newIndex);

    const newStatus = sortedStatuses[newIndex];
    if (newStatus) {
      onChange(newStatus.id);
    }
  };

  // Convert hex to rgba for focus ring
  const hexToRgba = (hex: string, alpha: number = 0.4): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (sortedStatuses.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No statuses available
      </div>
    );
  }

  const totalSteps = sortedStatuses.length - 1;

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Current Status Feedback */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          สถานะ
        </span>
        <span
          className="text-sm font-semibold h-6"
          style={{ color: currentStatus.color }}
        >
          {currentStatus.name}
        </span>
      </div>

      {/* Slider Container */}
      <div className="status-slider-container px-10 pt-10 pb-20">
        {/* Range Input */}
        <input
          type="range"
          min={0}
          max={totalSteps}
          step={1}
          value={sliderValue}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            'w-full h-2 rounded-lg appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'slider-thumb'
          )}
          style={{
            background: gradientBackground,
            // @ts-ignore - CSS custom properties
            '--thumb-color': currentStatus.color,
            '--focus-ring-color': hexToRgba(currentStatus.color, 0.4)
          }}
        />

        {/* Status Labels */}
        <div className="flex justify-between text-xs text-muted-light dark:text-muted-dark mt-1 px-1">
          {sortedStatuses.map((status) => (
            <span
              key={status.id}
              className={cn(
                'transition-colors',
                status.id === currentStatus.id && 'font-semibold'
              )}
              style={{
                color: status.id === currentStatus.id ? status.color : undefined
              }}
            >
              {status.name}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* Webkit (Chrome, Safari) */
        input[type='range'].slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--thumb-color);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease;
        }

        input[type='range'].slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        input[type='range'].slider-thumb:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 4px var(--focus-ring-color);
        }

        /* Firefox */
        input[type='range'].slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--thumb-color);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s ease;
        }

        input[type='range'].slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        input[type='range'].slider-thumb:focus::-moz-range-thumb {
          box-shadow: 0 0 0 4px var(--focus-ring-color);
        }

        /* Dark mode neutral color override */
        @media (prefers-color-scheme: dark) {
          input[type='range'].slider-thumb {
            /* Will use inline style gradient */
          }
        }
      `}</style>
    </div>
  );
}
