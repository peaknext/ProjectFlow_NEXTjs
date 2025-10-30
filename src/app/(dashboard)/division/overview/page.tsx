/**
 * Division Overview Page
 * Executive-level view for LEADER role managing multiple departments
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useDivisionOverview } from "@/hooks/use-division-overview";
import { useNavigationStore } from "@/stores/use-navigation-store";
import { DivisionToolbar } from "@/components/layout/division-toolbar";
import { DivisionView } from "@/components/views/division-overview/division-view";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Loader2 } from "lucide-react";
import type { DivisionFilters } from "@/types/division";

function DivisionOverviewContent() {
  const { user, isLoading: isLoadingUser } = useAuth();
  const searchParams = useSearchParams();
  const { divisionId: navDivisionId, setDivision } = useNavigationStore();
  const [filters, setFilters] = useState<DivisionFilters>({
    includeCompleted: false,
  });

  // Get divisionId from URL query param or fallback to user's division
  const divisionIdFromUrl = searchParams.get("divisionId");
  const divisionId =
    divisionIdFromUrl || navDivisionId || user?.department?.division?.id;

  // Check permission
  const hasAccess = user && ["ADMIN", "CHIEF", "LEADER"].includes(user.role);

  // Fetch data
  const { data, isLoading, error } = useDivisionOverview(
    divisionId || "",
    filters,
    { enabled: !!divisionId && hasAccess }
  );

  // Update navigation store when division data loads
  useEffect(() => {
    if (data?.division) {
      const division = data.division;
      const missionGroup = division.missionGroup;

      setDivision(
        division.id,
        division.name,
        missionGroup?.id || null,
        missionGroup?.name || null
      );
    }
  }, [data, setDivision]);

  // Loading user data
  if (isLoadingUser) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลผู้ใช้...</p>
          </div>
        </div>
      </div>
    );
  }

  // Access denied
  if (!hasAccess) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
                  <p className="text-sm text-muted-foreground">
                    คุณไม่มีสิทธิ์เข้าถึงหน้ามุมมองกลุ่มงาน
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No division assigned
  if (!divisionId) {
    return (
      <div className="flex flex-col h-full">
        <DivisionToolbar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <ShieldAlert className="h-12 w-12 text-yellow-500" />
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">ไม่พบข้อมูลกลุ่มงาน</h2>
                  <p className="text-sm text-muted-foreground">
                    บัญชีของคุณยังไม่ได้ถูกกำหนดกลุ่มงาน
                  </p>
                  <p className="text-xs text-muted-foreground">
                    กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดกลุ่มงานให้กับบัญชีของคุณ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <DivisionToolbar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <DivisionToolbar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
                  <p className="text-sm text-muted-foreground">
                    {error.message || "กรุณาลองใหม่อีกครั้ง"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success - Pattern เหมือน List View
  return (
    <div className="flex flex-col h-full">
      <DivisionToolbar
        filters={filters}
        onFiltersChange={setFilters}
        divisionId={divisionId}
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <DivisionView data={data!} />
        </div>
      </div>
    </div>
  );
}

export default function DivisionOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-full">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
            </div>
          </div>
        </div>
      }
    >
      <DivisionOverviewContent />
    </Suspense>
  );
}
