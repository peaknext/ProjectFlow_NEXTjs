"use client";

import { useState, useMemo } from "react";
import { Plus, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/use-ui-store";
import { useUsers } from "@/hooks/use-users";
import { UsersFilterBar } from "./users-filter-bar";
import { UsersTable } from "./users-table";
import { UsersPagination } from "./users-pagination";
import type { UserFilters, User } from "@/types/user";

export function UsersView() {
  const { user } = useAuth();

  // Permission check: Only ADMIN, CHIEF, LEADER, HEAD can access
  const canAccessUserManagement =
    user?.role && ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role);

  // Show access denied if user doesn't have permission
  if (!canAccessUserManagement) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/20 p-4">
              <ShieldAlert className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
            <p className="text-muted-foreground">
              คุณไม่มีสิทธิ์เข้าถึงหน้าจัดการบุคลากร
            </p>
            <p className="text-sm text-muted-foreground">
              เฉพาะผู้ดูแลระบบและหัวหน้างานเท่านั้นที่สามารถเข้าถึงหน้านี้ได้
            </p>
          </div>

          <Button onClick={() => (window.location.href = "/dashboard")}>
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    );
  }

  // State
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 50, // Load all at once for client-side filtering
    search: "",
    role: "ALL",
    status: "ALL",
    missionGroupId: null,
    divisionId: null,
    departmentId: null,
  });
  const [sortColumn, setSortColumn] = useState<
    "name" | "email" | "department" | "role"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch users - API handles role/status/search filtering
  const { data, isLoading, error, refetch } = useUsers({
    page: 1,
    limit: 500, // Get all users for client-side filtering
    search: filters.search,
    role: filters.role,
    status: filters.status,
    departmentId: undefined,
  });

  const allUsers = data?.users || [];

  // Check if user can create users (ADMIN only)
  const canCreateUser = user?.role === 'ADMIN';

  // Client-side filtering by organization hierarchy
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];

    // Filter by mission group (via department)
    if (filters.missionGroupId) {
      result = result.filter((u) => {
        if (!u.department?.division?.missionGroup) return false;
        return u.department.division.missionGroup.id === filters.missionGroupId;
      });
    }

    // Filter by division (via department)
    if (filters.divisionId) {
      result = result.filter((u) => {
        if (!u.department?.division) return false;
        return u.department.division.id === filters.divisionId;
      });
    }

    // Filter by department
    if (filters.departmentId) {
      result = result.filter((u) => u.departmentId === filters.departmentId);
    }

    return result;
  }, [
    allUsers,
    filters.missionGroupId,
    filters.divisionId,
    filters.departmentId,
  ]);

  // Client-side sorting
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];

    sorted.sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortColumn) {
        case "name":
          aValue = a.fullName.toLowerCase();
          bValue = b.fullName.toLowerCase();
          break;
        case "email":
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        case "department":
          aValue = a.department?.name?.toLowerCase() || "";
          bValue = b.department?.name?.toLowerCase() || "";
          break;
        case "role":
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        default:
          return 0;
      }

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredUsers, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (column: "name" | "email" | "department" | "role") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      search: "",
      role: "ALL",
      status: "ALL",
      missionGroupId: null,
      divisionId: null,
      departmentId: null,
    });
    setCurrentPage(1);
  };

  const openCreateUserModal = useUIStore((state) => state.openCreateUserModal);

  const handleCreateUser = () => {
    openCreateUserModal();
  };

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-md">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
              <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
            <p className="text-muted-foreground">
              ไม่สามารถโหลดข้อมูลผู้ใช้ได้
            </p>

            {error instanceof Error && (
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} variant="default">
              ลองใหม่อีกครั้ง
            </Button>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              variant="outline"
            >
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-0">
      {/* Header - Desktop Only */}
      <div className="max-md:hidden flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold">จัดการบุคลากร</h1>
          <p className="text-muted-foreground mt-1">
            จัดการและดูแลบัญชีผู้ใช้ในระบบ
          </p>
        </div>
        {canCreateUser && (
          <Button
            onClick={handleCreateUser}
            size="lg"
            className="px-8 py-6 text-lg"
          >
            <Plus className="mr-2 h-6 w-6" />
            สร้างผู้ใช้
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex-shrink-0 mb-4">
        <UsersFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          totalCount={allUsers.length}
          filteredCount={sortedUsers.length}
          canCreateUser={canCreateUser}
          onCreateUser={handleCreateUser}
        />
      </div>

      {/* Users Table - Scrollable Area */}
      <div className="flex-1 min-h-0 mb-4">
        <UsersTable
          users={paginatedUsers}
          isLoading={isLoading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Pagination */}
      {sortedUsers.length > 0 && (
        <div className="flex-shrink-0">
          <UsersPagination
            page={currentPage}
            limit={pageSize}
            total={sortedUsers.length}
            totalPages={totalPages}
            hasNext={currentPage < totalPages}
            hasPrev={currentPage > 1}
            onPageChange={handlePageChange}
            onLimitChange={handlePageSizeChange}
          />
        </div>
      )}
    </div>
  );
}
