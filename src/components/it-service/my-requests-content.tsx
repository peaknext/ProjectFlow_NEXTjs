"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { FileText, Search, Eye } from "lucide-react";
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
import type { ServiceRequestType, RequestStatus } from "@/generated/prisma";

/**
 * My Requests Content
 *
 * Displays user's own service requests with filters.
 */
export function MyRequestsContent() {
  const router = useRouter();

  // Filters
  const [typeFilter, setTypeFilter] = useState<ServiceRequestType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch requests with filters
  const { data: requests, isLoading } = useServiceRequests({
    type: typeFilter === "ALL" ? undefined : typeFilter,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: searchQuery || undefined,
    myRequests: true, // Only show user's own requests
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
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "default";
      case "CANCELLED":
        return "secondary";
      default:
        return "default";
    }
  };

  // Get status label
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) {
      case "PENDING":
        return "รอดำเนินการ";
      case "APPROVED":
        return "อนุมัติแล้ว";
      case "REJECTED":
        return "ปฏิเสธ";
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

  // Get type label
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

  // Handle click to view detail
  const handleRequestClick = (requestId: string) => {
    router.push(`/it-service/${requestId}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>คำร้องของฉัน</CardTitle>
              <CardDescription>ติดตามสถานะคำร้องทั้งหมดของคุณ</CardDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ประเภทคำร้อง</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  <SelectItem value="DATA">ขอข้อมูล</SelectItem>
                  <SelectItem value="PROGRAM">ขอโปรแกรม</SelectItem>
                  <SelectItem value="IT_ISSUE">แจ้งปัญหา IT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">สถานะ</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                  <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                  <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
                  <SelectItem value="IN_PROGRESS">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                  <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาจากเรื่อง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
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
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">ไม่พบคำร้อง</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">เลขที่</TableHead>
                  <TableHead>เรื่อง</TableHead>
                  <TableHead className="w-[150px]">ประเภท</TableHead>
                  <TableHead className="w-[150px]">สถานะ</TableHead>
                  <TableHead className="w-[150px]">วันที่ส่ง</TableHead>
                  <TableHead className="w-[100px] text-center">
                    ดูรายละเอียด
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRequestClick(request.id)}
                  >
                    <TableCell className="font-mono text-sm">
                      {request.requestNumber}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {request.subject}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(request.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.createdAt), "d MMM yy", {
                        locale: th,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestClick(request.id);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
