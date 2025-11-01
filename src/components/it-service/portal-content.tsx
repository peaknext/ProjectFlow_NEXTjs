"use client";

import { useState } from "react";
import {
  Database,
  Network,
  Wrench,
  SearchIcon,
} from "lucide-react";
import { ActionCard } from "@/components/it-service/action-card";
import { DataRequestModal } from "@/components/it-service/data-request-modal";
import { ITIssueModal } from "@/components/it-service/it-issue-modal";
import { HardwareNetworkModal } from "@/components/it-service/hardware-network-modal";

/**
 * IT Service Portal Content
 *
 * Displays 4 action cards for creating requests:
 * 1. Data/Program Request
 * 2. Hardware/Network Request
 * 3. IT Issue Report
 * 4. Track Request (focuses on search in "My Requests" tab)
 */
export function ITServicePortalContent() {
  // Modal state
  const [showDataRequestModal, setShowDataRequestModal] = useState(false);
  const [showHardwareNetworkModal, setShowHardwareNetworkModal] = useState(false);
  const [showITIssueModal, setShowITIssueModal] = useState(false);

  // Handle action card clicks
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
    // Switch to "My Requests" tab
    // This will be handled by parent component via query params or event
    const event = new CustomEvent("switchToMyRequests");
    window.dispatchEvent(event);
  };

  return (
    <>
      {/* Action Cards Section */}
      <div className="flex items-center justify-center min-h-[500px] p-6">
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

      {/* Modals */}
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
    </>
  );
}
