"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ITServiceTopBar } from "./it-service-top-bar";

/**
 * IT Service Layout (USER role only)
 *
 * Clean portal layout for USER role with:
 * - ITServiceTopBar (profile, notifications, global filter)
 * - No dashboard sidebar
 * - Full-screen content area
 *
 * This layout is ONLY used by USER role.
 * non-USER roles use standard DesktopLayout with sidebar.
 */
interface ITServiceLayoutProps {
  children: React.ReactNode;
}

export function ITServiceLayout({ children }: ITServiceLayoutProps) {
  const { isLoading } = useAuth();
  const router = useRouter();

  // Check if IT Service module is enabled (TODO: implement in Phase 5)
  // For now, assume it's always enabled
  const isITServiceEnabled = true;

  useEffect(() => {
    // Redirect if IT Service is disabled
    if (!isLoading && !isITServiceEnabled) {
      router.push("/access-denied");
    }
  }, [isLoading, isITServiceEnabled, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // If IT Service is disabled, show message
  if (!isITServiceEnabled) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold">IT Service ปิดใช้งานชั่วคราว</h1>
          <p className="text-muted-foreground">
            ระบบคำร้องขอบริการ IT ถูกปิดใช้งานชั่วคราวโดยผู้ดูแลระบบ
          </p>
        </div>
      </div>
    );
  }

  // Clean portal layout (USER role only)
  return (
    <div className="flex h-screen flex-col">
      <ITServiceTopBar />
      <main className="flex-1 overflow-hidden p-6">{children}</main>
    </div>
  );
}
