"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserRow } from "./user-row";
import type { User } from "@/types/user";
import { useAuth } from "@/hooks/use-auth";

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  sortColumn: "name" | "email" | "department" | "role";
  sortDirection: "asc" | "desc";
  onSort: (column: "name" | "email" | "department" | "role") => void;
}

export function UsersTable({
  users,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
}: UsersTableProps) {
  const { user } = useAuth();

  // Check if Actions column should be shown
  const showActions = user?.role === "ADMIN";

  const SortIcon = ({ column }: { column: "name" | "email" | "department" | "role" }) => (
    <ArrowUpDown
      className={`ml-2 h-4 w-4 ${
        sortColumn === column ? "text-primary" : "text-muted-foreground"
      }`}
    />
  );

  if (isLoading) {
    return (
      <div className="flex-1 overflow-hidden">
        {/* Desktop Loading - Table Skeleton */}
        <div className="max-md:hidden bg-card rounded-lg border border-border">
          <div className="p-6 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded-md mb-2" />
                  <div className="h-3 w-64 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
                <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Loading - Card Skeleton */}
        <div className="md:hidden space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="h-12 w-12 bg-muted animate-pulse rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-md mb-2" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded-md mb-2" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md flex-shrink-0" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16">
          <UsersIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            ไม่พบผู้ใช้
          </p>
          <p className="text-sm text-muted-foreground">
            ลองปรับเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Desktop - Table View */}
      <div className="max-md:hidden bg-card rounded-lg border border-border h-full flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="border-b border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort("name")}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <span className="font-semibold">ชื่อ</span>
                    <SortIcon column="name" />
                  </Button>
                </TableHead>
                <TableHead className="w-[25%]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort("email")}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <span className="font-semibold">อีเมล</span>
                    <SortIcon column="email" />
                  </Button>
                </TableHead>
                <TableHead className="w-[20%]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort("department")}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <span className="font-semibold">หน่วยงาน</span>
                    <SortIcon column="department" />
                  </Button>
                </TableHead>
                <TableHead className="w-[12%]">
                  <Button
                    variant="ghost"
                    onClick={() => onSort("role")}
                    className="h-auto p-0 hover:bg-transparent"
                  >
                    <span className="font-semibold">บทบาท</span>
                    <SortIcon column="role" />
                  </Button>
                </TableHead>
                <TableHead className="w-[8%]">
                  <span className="font-semibold">สถานะ</span>
                </TableHead>
                {/* Actions - Only show for ADMIN */}
                {showActions && (
                  <TableHead className="w-[5%] text-right">
                    <span className="font-semibold">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-auto flex-1">
          <Table>
            <TableBody>
              {users.map((user) => (
                <UserRow key={user.id} user={user} viewMode="table" />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile - Card View */}
      <div className="md:hidden flex-1 overflow-auto space-y-3">
        {users.map((user) => (
          <UserRow key={user.id} user={user} viewMode="card" />
        ))}
      </div>
    </div>
  );
}
