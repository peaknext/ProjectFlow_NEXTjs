/**
 * Sync Status Footer - Replaces sidebar footer with sync animation
 * Shows copyright info normally, switches to sync animation during optimistic updates
 */

"use client";

import { useSyncStore } from "@/stores/use-sync-store";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function SyncStatusFooter() {
  const { isSyncing, startSync, endSync } = useSyncStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Test function - double click to see animation
  const handleDoubleClick = () => {
    startSync();
    setTimeout(() => endSync(), 2000);
  };

  return (
    <div
      className="border-t bg-muted/30 px-4 py-3 cursor-pointer select-none"
      onDoubleClick={handleDoubleClick}
      title="Double-click to test sync animation"
    >
      <div className="relative h-[40px] flex items-center justify-center">
        {/* Default State: Copyright Info */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isSyncing ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          <div className="text-xs text-center text-muted-foreground space-y-0.5">
            <div className="font-medium">ProjectFlows version 1.0.0</div>
            <div>©2025 นพ.เกียรติศักดิ์ พรหมเสนสา</div>
          </div>
        </div>

        {/* Syncing State: Connection Animation */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
            isSyncing ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <SyncAnimation isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

function SyncAnimation({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {/* Computer Icon */}
      <svg
        className={cn("w-6 h-6", isDark ? "text-gray-400" : "text-gray-600")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" />
        <path d="M8 21h8" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 17v4" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* Animated Connection Lines */}
      <div className="flex gap-0.5">
        <div
          className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            isDark ? "bg-gray-400" : "bg-gray-600"
          )}
          style={{ animationDelay: "0ms", animationDuration: "1s" }}
        />
        <div
          className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            isDark ? "bg-gray-400" : "bg-gray-600"
          )}
          style={{ animationDelay: "200ms", animationDuration: "1s" }}
        />
        <div
          className={cn(
            "w-1 h-1 rounded-full animate-pulse",
            isDark ? "bg-gray-400" : "bg-gray-600"
          )}
          style={{ animationDelay: "400ms", animationDuration: "1s" }}
        />
      </div>

      {/* Database Icon */}
      <svg
        className={cn("w-6 h-6", isDark ? "text-gray-400" : "text-gray-600")}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" strokeWidth="2" />
        <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" strokeWidth="2" />
      </svg>
    </div>
  );
}
