"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Inbox, User } from "lucide-react";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useAuth } from "@/hooks/use-auth";
import { ITServicePortalContent } from "@/components/it-service/portal-content";
import { ManageRequestsContent } from "@/components/it-service/manage-requests-content";
import { MyRequestsContent } from "@/components/it-service/my-requests-content";
import { Badge } from "@/components/ui/badge";

/**
 * IT Service Admin Page (Non-USER roles only)
 *
 * 3 Tabs:
 * 1. IT Service Portal - Create new requests (action cards)
 * 2. จัดการคำร้อง - Manage all requests (approver view)
 * 3. คำร้องของฉัน - View own requests
 *
 * URL: /it-service-admin
 */
export default function ITServiceAdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("portal");

  // Fetch pending requests count for badge (for approvers)
  const isManagementRole =
    user?.role && ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role);
  const { data: pendingRequests } = useServiceRequests(
    isManagementRole ? { status: "PENDING" } : { myRequests: true, status: "PENDING" }
  );
  const pendingCount = pendingRequests?.length || 0;

  // Listen for "Track Request" card click to switch to "My Requests" tab
  useEffect(() => {
    const handleSwitchToMyRequests = () => {
      setActiveTab("my-requests");
    };

    window.addEventListener("switchToMyRequests", handleSwitchToMyRequests);
    return () => {
      window.removeEventListener("switchToMyRequests", handleSwitchToMyRequests);
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IT Service</h1>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบบริการด้านไอที
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b bg-muted/30 px-6">
          <TabsList className="bg-transparent h-12 p-0 space-x-4">
            <TabsTrigger
              value="portal"
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              IT Service Portal
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Inbox className="h-4 w-4 mr-2" />
              จัดการคำร้อง
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="my-requests"
              className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <User className="h-4 w-4 mr-2" />
              คำร้องของฉัน
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-auto">
          <TabsContent value="portal" className="mt-0 h-full">
            <ITServicePortalContent />
          </TabsContent>

          <TabsContent value="manage" className="mt-0 h-full">
            <ManageRequestsContent />
          </TabsContent>

          <TabsContent value="my-requests" className="mt-0 h-full">
            <MyRequestsContent />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
