"use client";

import { Database, Code, Wrench, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ServiceRequest } from "@/hooks/use-service-requests";
import type { RequestStatus, ServiceRequestType } from "@/generated/prisma";

interface RequestCardProps {
  request: ServiceRequest;
  onClick: () => void;
}

const statusConfig: Record<
  RequestStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  PENDING: {
    label: "รอการอนุมัติ",
    variant: "secondary",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  },
  APPROVED: {
    label: "อนุมัติแล้ว",
    variant: "default",
    className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  REJECTED: {
    label: "ไม่อนุมัติ",
    variant: "destructive",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    variant: "default",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    variant: "outline",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
  },
  CANCELLED: {
    label: "ยกเลิก",
    variant: "outline",
  },
};

const typeConfig: Record<
  ServiceRequestType,
  { label: string; icon: LucideIcon }
> = {
  DATA: { label: "ขอข้อมูล", icon: Database },
  PROGRAM: { label: "พัฒนาโปรแกรม", icon: Code },
  IT_ISSUE: { label: "แจ้งปัญหา IT", icon: Wrench },
};

export function RequestCard({ request, onClick }: RequestCardProps) {
  const statusInfo = statusConfig[request.status];
  const typeInfo = typeConfig[request.type];
  const TypeIcon = typeInfo.icon;

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <TypeIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {request.requestNumber}
              </span>
              {request.lastKnownQueuePosition &&
                request.status === "PENDING" && (
                  <Badge
                    variant="outline"
                    className="w-fit text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
                  >
                    คิวที่ {request.lastKnownQueuePosition}
                  </Badge>
                )}
            </div>
          </div>
          <Badge
            variant={statusInfo.variant}
            className={cn("whitespace-nowrap", statusInfo.className)}
          >
            {statusInfo.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-medium line-clamp-1">{request.subject}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{typeInfo.label}</span>
          <span>
            {new Date(request.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Card>
  );
}
