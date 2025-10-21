/**
 * PriorityBadge - แสดง badge สำหรับระดับความสำคัญของงาน
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, MinusCircle, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const PRIORITY_CONFIG = {
  1: {
    label: 'ด่วนมาก',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: AlertCircle,
  },
  2: {
    label: 'สูง',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    icon: AlertTriangle,
  },
  3: {
    label: 'ปานกลาง',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    icon: MinusCircle,
  },
  4: {
    label: 'ต่ำ',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
    icon: ArrowDown,
  },
};

export function PriorityBadge({
  priority,
  className,
  showIcon = true,
  size = 'sm',
}: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG[3];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && <Icon className={cn(iconSizes[size], 'mr-1')} />}
      {config.label}
    </Badge>
  );
}

/**
 * PriorityDot - แสดงจุดสีสำหรับระดับความสำคัญ (แบบกะทัดรัด)
 */
export function PriorityDot({ priority, className }: { priority: number; className?: string }) {
  const colors = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-yellow-500',
    4: 'bg-green-500',
  };

  const color = colors[priority as keyof typeof colors] || colors[3];

  return (
    <div
      className={cn('h-2 w-2 rounded-full', color, className)}
      title={PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]?.label || 'ปานกลาง'}
    />
  );
}
