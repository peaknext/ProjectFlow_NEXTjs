"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useServiceRequests } from "@/hooks/use-service-requests";
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";
import type { ServiceRequestType, RequestStatus } from "@/generated/prisma";

/**
 * Manage Requests Content
 *
 * Displays table of all requests for approvers to manage.
 * Includes filters and queue management.
 */
export function ManageRequestsContent() {
  const router = useRouter();
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  // Filters
  const [typeFilter, setTypeFilter] = useState<ServiceRequestType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch requests with filters
  const { data: requests, isLoading } = useServiceRequests({
    type: typeFilter === "ALL" ? undefined : typeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: searchQuery || undefined,
    myRequests: false, // Show all requests in approver's scope
    fiscalYears: selectedYears,
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "outline";
      case "APPROVED":
        return "default";
      case "REJECTED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get type label in Thai
  const getTypeLabel = (type: ServiceRequestType) => {
    switch (type) {
      case "DATA":
        return "ขอข้อมูล";
      case "PROGRAM":
        return "ขอโปรแกรม";
      case "IT_ISSUE":
        return "แจ้งปัญหา IT";
      default:
        return type;
    }
  };

  // Get status label in Thai
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "รออนุมัติ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ไม่อนุมัติ";
      case "IN_PROGRESS":
        return "กำลังดำเนินการ";
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "CANCELLED":
        return "ยกเลิก";
      default:
        return status;
    }
  };

  // Calculate queue position for pending requests
  const calculateQueuePosition = (requestId: string, type: ServiceRequestType) => {
    if (!requests) return null;

    const pendingOfType = requests
      .filter((r) => r.type === type && r.status === "PENDING")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const position = pendingOfType.findIndex((r) => r.id === requestId);
    return position >= 0 ? position + 1 : null;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>จัดการคำร้อง IT Service</CardTitle>
              <CardDescription className="mt-1">
                อนุมัติและจัดการคำร้องขอบริการ IT
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-sm">
              {requests?.length || 0} คำร้อง
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>กรองข้อมูล</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาเลขที่คำร้อง, เรื่อง, รายละเอียด..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as ServiceRequestType | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ประเภทคำร้อง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกประเภท</SelectItem>
                <SelectItem value="DATA">ขอข้อมูล</SelectItem>
                <SelectItem value="PROGRAM">ขอโปรแกรม</SelectItem>
                <SelectItem value="IT_ISSUE">แจ้งปัญหา IT</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as RequestStatus | "ALL")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกสถานะ</SelectItem>
                <SelectItem value="PENDING">รออนุมัติ</SelectItem>
                <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                <SelectItem value="REJECTED">ไม่อนุมัติ</SelectItem>
                <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
                <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>คำร้องทั้งหมด ({requests?.length || 0} รายการ)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : !requests || requests.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">ไม่พบคำร้อง</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เลขที่คำร้อง</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>เรื่อง</TableHead>
                  <TableHead>ผู้ส่งคำร้อง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>คิว</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => {
                  const queuePosition =
                    request.status === "PENDING"
                      ? calculateQueuePosition(request.id, request.type)
                      : null;

                  return (
                    <TableRow
                      key={request.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/it-service/${request.id}`)}
                    >
                      <TableCell className="font-mono text-sm">
                        {request.requestNumber}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getTypeLabel(request.type)}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.subject}
                      </TableCell>
                      <TableCell>{request.requesterName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(request.status)}
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {queuePosition ? (
                          <Badge variant="outline" className="font-mono">
                            #{queuePosition}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.createdAt), "d MMM yy", {
                          locale: th,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "PENDING" ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/it-service/${request.id}`);
                            }}
                          >
                            พิจารณา
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/it-service/${request.id}`);
                            }}
                          >
                            ดูรายละเอียด
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
