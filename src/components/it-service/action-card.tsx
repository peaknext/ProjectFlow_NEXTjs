"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Action Card Component
 *
 * Large action button with icon, title, and description.
 * Used on IT Service portal page for main actions.
 *
 * Features:
 * - 3 color variants (blue, green, purple)
 * - Hover effects (scale, shadow, border)
 * - Gradient background
 * - Dark mode support
 */

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  color: "blue" | "green" | "purple";
  onClick: () => void;
}

const colorClasses = {
  blue: "text-blue-600 dark:text-blue-400",
  green: "text-green-600 dark:text-green-400",
  purple: "text-purple-600 dark:text-purple-400",
};

const bgColorClasses = {
  blue: "bg-blue-50 dark:bg-blue-950/20",
  green: "bg-green-50 dark:bg-green-950/20",
  purple: "bg-purple-50 dark:bg-purple-950/20",
};

export function ActionCard({
  icon: Icon,
  title,
  description,
  color,
  onClick,
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border-2 p-6 sm:p-8",
        "hover:shadow-lg hover:scale-[1.02] transition-all duration-300",
        "bg-gradient-to-br from-white to-gray-50",
        "dark:from-gray-900 dark:to-gray-800",
        "hover:border-primary",
        "text-left w-full"
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4 text-center">
        <div
          className={cn(
            "flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full",
            "transition-transform group-hover:scale-110",
            bgColorClasses[color]
          )}
        >
          <Icon className={cn("h-8 w-8 sm:h-10 sm:w-10", colorClasses[color])} />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
