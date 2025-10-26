"use client";

import { useAuth } from "@/hooks/use-auth";
import { ProjectsView } from "@/components/projects/projects-view";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { hasAnyRole } from "@/lib/role-utils";

export default function ProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Check permissions - only ADMIN, CHIEF, LEADER, HEAD can access
  // Uses effective role (primary + additional roles combined)
  const canAccessProjectManagement = user?.role && hasAnyRole(
    user.role,
    user.additionalRoles,
    ["ADMIN", "CHIEF", "LEADER", "HEAD"]
  );

  useEffect(() => {
    // Redirect if user cannot access
    if (!isLoading && !canAccessProjectManagement) {
      router.push("/dashboard");
    }
  }, [isLoading, canAccessProjectManagement, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!canAccessProjectManagement) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
          block
        </span>
        <h3 className="text-xl font-semibold mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-muted-foreground text-center max-w-md">
          คุณไม่มีสิทธิ์ในการจัดการโปรเจค กรุณาติดต่อผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  return <ProjectsView />;
}
