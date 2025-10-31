"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  AlertCircle,
  Search as SearchIcon,
  Database,
  Code,
  Wrench,
  Network,
} from "lucide-react";
import { ITServiceLayout } from "@/components/layout/it-service-layout";
import { ActionCard } from "@/components/it-service/action-card";
import { RequestCard } from "@/components/it-service/request-card";
import { RequestListFilters } from "@/components/it-service/request-list-filters";
import { DataRequestModal } from "@/components/it-service/data-request-modal";
import { ITIssueModal } from "@/components/it-service/it-issue-modal";
import { HardwareNetworkModal } from "@/components/it-service/hardware-network-modal";
import { Button } from "@/components/ui/button";
import {
  useServiceRequests,
  type ServiceRequestFilters,
} from "@/hooks/use-service-requests";
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";
import { useAuth } from "@/hooks/use-auth";

/**
 * IT Service Portal Page
 *
 * Main entry point for IT Service module.
 *
 * Layout:
 * - Left side: 3 action cards (Data/Program, IT Issue, Track)
 * - Right sidebar: Request list with filters
 *
 * Features:
 * - Create new requests via modals (Data/Program or IT Issue forms)
 * - Track existing requests
 * - Filter and search requests
 * - View request details
 */

export default function ITServicePortalPage() {
  const router = useRouter();
  const { user } = useAuth();
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  // Filters state
  const [filters, setFilters] = useState<ServiceRequestFilters>({
    fiscalYears: selectedYears,
    myRequests: user?.role === "USER", // Default to "my requests" for USER role
  });

  // Fetch requests with filters
  const { data: requests, isLoading, error } = useServiceRequests(filters);

  // Modal state
  const [showDataRequestModal, setShowDataRequestModal] = useState(false);
  const [showHardwareNetworkModal, setShowHardwareNetworkModal] = useState(false);
  const [showITIssueModal, setShowITIssueModal] = useState(false);

  // Handle filter changes
  const handleFiltersChange = (newFilters: ServiceRequestFilters) => {
    setFilters({ ...newFilters, fiscalYears: selectedYears });
  };

  // Handle filter reset
  const handleFiltersReset = () => {
    setFilters({
      fiscalYears: selectedYears,
      myRequests: user?.role === "USER",
    });
  };

  // Handle request card click
  const handleRequestClick = (requestId: string) => {
    router.push(`/it-service/${requestId}`);
  };

  // Handle action card clicks (will open modals)
  const handleDataRequestClick = () => {
    setShowDataRequestModal(true);
  };

  const handleHardwareNetworkClick = () => {
    setShowHardwareNetworkModal(true);
  };

  const handleITIssueClick = () => {
    setShowITIssueModal(true);
  };

  const handleTrackRequestClick = () => {
    // Scroll to request list or highlight search
    const searchInput = document.querySelector('input[placeholder*="ค้นหา"]');
    if (searchInput) {
      (searchInput as HTMLInputElement).focus();
    }
  };

  return (
    <ITServiceLayout>
      <div className="flex h-full flex-col lg:flex-row">
        {/* Left Side - Action Cards + Mobile Request List */}
        <div className="flex-1 overflow-auto">
          {/* Action Cards Section */}
          <div className="p-4 sm:p-6 lg:min-h-full lg:flex lg:items-center lg:justify-center">
            <div className="w-full max-w-5xl">
              {/* Action Cards Grid */}
              <div className="grid gap-6 sm:gap-8 md:gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Data Request Card */}
              <ActionCard
                icon={Database}
                title="ขอข้อมูล / พัฒนาโปรแกรม"
                color="blue"
                onClick={handleDataRequestClick}
              />

              {/* Hardware/Network Request Card */}
              <ActionCard
                icon={Network}
                title="ขอฮาร์ดแวร์ / เครือข่าย"
                color="orange"
                onClick={handleHardwareNetworkClick}
              />

              {/* IT Issue Card */}
              <ActionCard
                icon={Wrench}
                title="แจ้งปัญหา IT"
                color="green"
                onClick={handleITIssueClick}
              />

              {/* Track Request Card */}
              <ActionCard
                icon={SearchIcon}
                title="ติดตามคำร้อง"
                color="purple"
                onClick={handleTrackRequestClick}
              />
              </div>
            </div>
          </div>

          {/* Mobile Request List (shown below cards on mobile, hidden on lg+) */}
          <div className="lg:hidden border-t bg-muted/30">
            <div className="p-4 border-b bg-background">
              <h2 className="text-lg font-semibold">คำร้องของคุณ</h2>
              <p className="text-sm text-muted-foreground">
                {requests?.length || 0} คำร้อง
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Filters */}
              <RequestListFilters
                filters={filters}
                onChange={handleFiltersChange}
                onReset={handleFiltersReset}
              />

              {/* Loading State */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    กำลังโหลดข้อมูล...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <p className="text-sm font-medium text-destructive">
                      เกิดข้อผิดพลาด
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    ไม่สามารถโหลดข้อมูลคำร้องได้
                  </p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && (!requests || requests.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-sm font-medium">ไม่มีคำร้อง</h3>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {filters.myRequests
                      ? "คุณยังไม่มีคำร้องใดๆ ในระบบ"
                      : "ไม่พบคำร้องตามเงื่อนไขที่กำหนด"}
                  </p>
                  {(filters.type ||
                    filters.status ||
                    filters.search ||
                    filters.myRequests) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFiltersReset}
                      className="mt-4"
                    >
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
              )}

              {/* Request Cards List */}
              {!isLoading && !error && requests && requests.length > 0 && (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onClick={() => handleRequestClick(request.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Request Submission Modals */}
          <DataRequestModal
            open={showDataRequestModal}
            onOpenChange={setShowDataRequestModal}
          />

          <HardwareNetworkModal
            open={showHardwareNetworkModal}
            onOpenChange={setShowHardwareNetworkModal}
          />

          <ITIssueModal
            open={showITIssueModal}
            onOpenChange={setShowITIssueModal}
          />
        </div>

        {/* Right Sidebar - Request List (hidden on mobile, shown on lg+) */}
        <div className="hidden lg:block lg:w-96 border-l bg-muted/30 overflow-auto">
          <div className="sticky top-0 z-10 border-b bg-background p-4">
            <h2 className="text-lg font-semibold">คำร้องของคุณ</h2>
            <p className="text-sm text-muted-foreground">
              {requests?.length || 0} คำร้อง
            </p>
          </div>

          <div className="p-4 space-y-4">
            {/* Filters */}
            <RequestListFilters
              filters={filters}
              onChange={handleFiltersChange}
              onReset={handleFiltersReset}
            />

            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="mt-4 text-sm text-muted-foreground">
                  กำลังโหลดข้อมูล...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    เกิดข้อผิดพลาด
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  ไม่สามารถโหลดข้อมูลคำร้องได้
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && (!requests || requests.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-sm font-medium">ไม่มีคำร้อง</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {filters.myRequests
                    ? "คุณยังไม่มีคำร้องใดๆ ในระบบ"
                    : "ไม่พบคำร้องตามเงื่อนไขที่กำหนด"}
                </p>
                {(filters.type ||
                  filters.status ||
                  filters.search ||
                  filters.myRequests) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFiltersReset}
                    className="mt-4"
                  >
                    ล้างตัวกรอง
                  </Button>
                )}
              </div>
            )}

            {/* Request Cards List */}
            {!isLoading && !error && requests && requests.length > 0 && (
              <div className="space-y-3">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => handleRequestClick(request.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ITServiceLayout>
  );
}
