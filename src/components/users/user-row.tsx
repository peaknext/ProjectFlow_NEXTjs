/**
 * User Row Component
 * Individual table row for each user
 *
 * Features:
 * - Avatar with fallback initials
 * - Role badge with color
 * - Status toggle with optimistic update
 * - Actions dropdown (edit, delete)
 * - Permission checks (ADMIN/CHIEF can delete)
 * - AlertDialog confirmation for delete
 * - Department breadcrumb
 */

"use client";

import { useState } from "react";
import { User, ROLE_LABELS } from "@/types/user";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2, Shield, Loader2, Mail, Building2 } from "lucide-react";
import { useUpdateUserStatus, useDeleteUser } from "@/hooks/use-users";
import { useUIStore } from "@/stores/use-ui-store";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface UserRowProps {
  user: User;
  viewMode?: "table" | "card";
}

export function UserRow({ user, viewMode = "table" }: UserRowProps) {
  const { user: currentUser } = useAuth();
  const openEditUserModal = useUIStore((state) => state.openEditUserModal);
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Generate initials from full name
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Permission checks
  // Only ADMIN can edit users (via Edit Modal)
  // HEAD/LEADER/CHIEF can only toggle status, not edit other fields
  const canEdit = (() => {
    if (!currentUser) return false;
    if (currentUser.role !== "ADMIN") return false; // Only ADMIN can edit

    // Cannot edit self
    if (currentUser.id === user.id) return false;

    // Cannot edit other ADMIN users
    if (user.role === "ADMIN") return false;

    return true;
  })();

  // Only ADMIN can delete users
  const canDelete = (() => {
    if (!currentUser) return false;
    if (currentUser.role !== "ADMIN") return false; // Only ADMIN can delete

    // Cannot delete self
    if (currentUser.id === user.id) return false;

    // Cannot delete other ADMIN users
    if (user.role === "ADMIN") return false;

    return true;
  })();

  // Check if Actions column should be shown
  const showActions = currentUser?.role === "ADMIN";

  const handleStatusToggle = async (checked: boolean) => {
    const newStatus = checked ? "ACTIVE" : "SUSPENDED";

    try {
      await updateStatus.mutateAsync({
        userId: user.id,
        status: newStatus,
      });

      toast.success(
        checked ? "เปิดใช้งานบัญชีเรียบร้อย" : "ระงับการใช้งานบัญชีเรียบร้อย"
      );
    } catch (error: any) {
      const message =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ";
      toast.error(message);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success("ลบผู้ใช้สำเร็จ", {
        description: `ผู้ใช้ "${user.fullName}" ถูกลบเรียบร้อยแล้ว`,
      });
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Delete user error:", error);
      const message =
        error.response?.data?.error || "เกิดข้อผิดพลาดในการลบผู้ใช้";
      toast.error("ไม่สามารถลบผู้ใช้ได้", {
        description: message,
      });
    }
  };

  // Card Layout (Mobile)
  if (viewMode === "card") {
    return (
      <>
        <Card className="p-4">
          {/* Header: Avatar + Name + Status + Actions */}
          <div className="flex items-start gap-3 mb-3">
            {/* Avatar */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage
                src={user.profileImageUrl || undefined}
                alt={user.fullName}
              />
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Name + Job Title + Email */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-base">{user.fullName}</div>
              {user.jobTitle && (
                <div className="text-xs text-muted-foreground">
                  {user.jobTitle.jobTitleTh}
                  {user.jobLevel && ` ${user.jobLevel}`}
                </div>
              )}
              {/* Email - Moved from body */}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                {user.isVerified && (
                  <Shield className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Actions - Top Right */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">เปิดเมนู</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit ? (
                    <DropdownMenuItem onClick={() => openEditUserModal(user)}>
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="opacity-50">
                      <Edit className="h-4 w-4 mr-2" />
                      แก้ไข
                      <span className="ml-2 text-xs text-muted-foreground">
                        (ไม่มีสิทธิ์)
                      </span>
                    </DropdownMenuItem>
                  )}
                  {canDelete ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleDeleteClick}
                        className="text-red-600 dark:text-red-400 focus:text-red-600 focus:dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        ลบ
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Body: Department, Role */}
          <div className="space-y-2 text-sm">
            {/* Department */}
            <div className="flex items-start gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {user.department ? (
                <div className="flex-1">
                  <div>{user.department.name}</div>
                  {user.department.division && (
                    <div className="text-xs opacity-70">
                      {user.department.division.name}
                    </div>
                  )}
                </div>
              ) : (
                <span>-</span>
              )}
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-medium text-foreground">
                บทบาท:
              </span>
              <span className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary">
                {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            {/* Status Switch - Bottom Right */}
            <div className="flex items-center justify-end gap-2 pt-3 mt-1 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {user.userStatus === "ACTIVE" ? "ใช้งานอยู่" : "ระงับ"}
              </span>
              <Switch
                checked={user.userStatus === "ACTIVE"}
                onCheckedChange={handleStatusToggle}
                disabled={updateStatus.isPending}
                aria-label={`สถานะ ${user.userStatus === "ACTIVE" ? "ใช้งานอยู่" : "ระงับ"}`}
              />
            </div>
          </div>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  คุณแน่ใจหรือไม่ที่จะลบผู้ใช้{" "}
                  <strong className="text-foreground">{user.fullName}</strong>?
                </p>
                <p className="text-sm font-medium text-destructive">
                  ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteUser.isPending}>
                ยกเลิก
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                disabled={deleteUser.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังลบ...
                  </>
                ) : (
                  "ลบผู้ใช้"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Table Layout (Desktop) - default
  return (
    <>
      <TableRow>
        {/* Avatar + Name */}
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.profileImageUrl || undefined}
                alt={user.fullName}
              />
              <AvatarFallback className="text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.fullName}</div>
              {user.jobTitle && (
                <div className="text-xs text-muted-foreground">
                  {user.jobTitle.jobTitleTh}
                  {user.jobLevel && `${user.jobLevel}`}
                </div>
              )}
            </div>
          </div>
        </TableCell>

        {/* Email */}
        <TableCell>
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.email}</span>
            {user.isVerified && (
              <Shield
                className="h-3 w-3 text-green-600 dark:text-green-400"
              />
            )}
          </div>
        </TableCell>

        {/* Department */}
        <TableCell>
          {user.department ? (
            <div className="text-sm">
              <div>{user.department.name}</div>
              {user.department.division && (
                <div className="text-xs text-muted-foreground">
                  {user.department.division.name}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </TableCell>

        {/* Role */}
        <TableCell>
          <span className="text-sm">
            {ROLE_LABELS[user.role] || user.role}
          </span>
        </TableCell>

        {/* Status */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Switch
              checked={user.userStatus === "ACTIVE"}
              onCheckedChange={handleStatusToggle}
              disabled={updateStatus.isPending}
              aria-label={`สถานะ ${user.userStatus === "ACTIVE" ? "ใช้งานอยู่" : "ระงับ"}`}
            />
            <span className="text-sm">
              {user.userStatus === "ACTIVE" ? "ใช้งานอยู่" : "ระงับ"}
            </span>
          </div>
        </TableCell>

        {/* Actions - Only show for ADMIN */}
        {showActions && (
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">เปิดเมนู</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit ? (
                  <DropdownMenuItem onClick={() => openEditUserModal(user)}>
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled className="opacity-50">
                    <Edit className="h-4 w-4 mr-2" />
                    แก้ไข
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ไม่มีสิทธิ์)
                    </span>
                  </DropdownMenuItem>
                )}
                {canDelete ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteClick}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 focus:dark:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      ลบ
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        )}
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                คุณแน่ใจหรือไม่ที่จะลบผู้ใช้{" "}
                <strong className="text-foreground">{user.fullName}</strong>?
              </p>
              <p className="text-sm font-medium text-destructive">
                ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUser.isPending}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบผู้ใช้"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
