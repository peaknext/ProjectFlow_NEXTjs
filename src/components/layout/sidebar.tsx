"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SyncStatusFooter } from "@/components/layout/sync-status-footer";
import { WorkspaceNavigation } from "@/components/navigation/workspace-navigation";
import { useAuth } from "@/hooks/use-auth";

const mainNavigation = [
  {
    name: "แดชบอร์ด",
    href: "/dashboard",
    icon: LayoutDashboard,
    enabled: true,
    requiredRoles: [], // All roles can access
  },
  {
    name: "งาน",
    href: "/department/tasks", // Department Tasks View as default
    icon: CheckSquare,
    enabled: true,
    requiredRoles: [], // All roles can access
  },
  {
    name: "โปรเจกต์",
    href: "/projects", // Project management page
    icon: FolderKanban,
    enabled: true,
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // Only management roles
  },
  {
    name: "รายงาน",
    href: "/reports",
    icon: BarChart3,
    enabled: true, // ✅ Implemented 2025-10-25
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER"], // All except USER
  },
  {
    name: "บุคลากร",
    href: "/users", // User management page
    icon: Users,
    enabled: true, // ✅ Implemented 2025-10-24
    requiredRoles: ["ADMIN", "CHIEF", "LEADER", "HEAD"], // Only management roles
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter navigation items based on user role
  const visibleNavigation = mainNavigation.filter((item) => {
    // If no role requirements, show to everyone
    if (!item.requiredRoles || item.requiredRoles.length === 0) return true;

    // Check if user role is in required roles
    return user?.role && item.requiredRoles.includes(user.role);
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Main Navigation - Fixed */}
      <nav className="flex flex-col gap-2 px-4 pt-4 pb-4">
        {visibleNavigation.map((item) => {
          // Default active state logic
          let isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");

          // Special logic for "งาน" (Tasks) - should be active for all task-related views
          if (item.name === "งาน") {
            // Highlight "งาน" for all task-related paths:
            // - /department/tasks
            // - /division/overview (Division View)
            // - /projects/[projectId]/board
            // - /projects/[projectId]/calendar
            // - /projects/[projectId]/list
            isActive =
              isActive ||
              pathname?.startsWith("/division/") ||
              (pathname?.includes("/projects/") &&
                (pathname?.endsWith("/board") ||
                  pathname?.endsWith("/calendar") ||
                  pathname?.endsWith("/list")));
          }

          // Special logic for "โปรเจกต์" (Projects) - should ONLY be active on /projects page
          if (item.name === "โปรเจกต์") {
            // Only active on exact /projects path, not on /projects/[projectId]/...
            isActive = pathname === "/projects";
          }

          return (
            <Link
              key={item.name}
              href={item.enabled ? item.href : "#"}
              className={cn(!item.enabled && "cursor-not-allowed")}
            >
              <Button
                variant="ghost"
                size="lg"
                disabled={!item.enabled}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  isActive && item.enabled
                    ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                    : "hover:bg-primary/10",
                  !item.enabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium text-base">{item.name}</span>
                {!item.enabled && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    (เร็วๆ นี้)
                  </span>
                )}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Workspace Section Header - Fixed */}
      <div className="bg-muted px-4 py-2 border-y">
        <div className="text-xs font-semibold uppercase tracking-wider">
          WORKSPACE
        </div>
      </div>

      {/* Workspace Navigation - Scrollable */}
      <ScrollArea className="flex-1">
        <WorkspaceNavigation />
      </ScrollArea>

      {/* Footer - Fixed with Sync Status */}
      <SyncStatusFooter />
    </div>
  );
}
