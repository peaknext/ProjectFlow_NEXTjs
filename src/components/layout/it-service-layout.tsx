"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ITServiceTopBar } from "./it-service-top-bar";

/**
 * IT Service Layout Wrapper
 *
 * Conditional layout based on user role:
 * - USER: Clean portal (no sidebar, custom top bar)
 * - Others: Regular dashboard layout with sidebar
 *
 * This component wraps IT Service pages and determines
 * whether to show clean portal or use default (dashboard) layout
 */
interface ITServiceLayoutProps {
  children: React.ReactNode;
}

export function ITServiceLayout({ children }: ITServiceLayoutProps) {
  const { user, isLoading } = useAuth();
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

  // USER role: Show clean portal (no sidebar)
  if (user?.role === "USER") {
    return (
      <div className="flex h-screen flex-col">
        <ITServiceTopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  // Other roles: Use default (dashboard) layout with sidebar
  // The (dashboard) layout will handle sidebar rendering
  return <>{children}</>;
}
