/**
 * User Row Component
 * Individual table row for each user
 *
 * Features:
 * - Avatar with fallback initials
 * - Role badge with color
 * - Status toggle with optimistic update
 * - Actions dropdown (edit, delete)
 * - Permission checks
 * - Department breadcrumb
 */

'use client';

import { User, ROLE_LABELS, ROLE_COLORS } from '@/types/user';
import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react';
import { useUpdateUserStatus, useDeleteUser } from '@/hooks/use-users';
import { useUIStore } from '@/stores/use-ui-store';
import { toast } from 'sonner';

interface UserRowProps {
  user: User;
}

export function UserRow({ user }: UserRowProps) {
  const { openModal } = useUIStore();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  // Generate initials from full name
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleStatusToggle = async (checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'SUSPENDED';

    try {
      await updateStatus.mutateAsync({
        userId: user.id,
        status: newStatus,
      });

      toast.success(
        checked ? 'เปิดใช้งานบัญชีเรียบร้อย' : 'ระงับการใช้งานบัญชีเรียบร้อย'
      );
    } catch (error: any) {
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`ต้องการลบ ${user.fullName} ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success(`ลบผู้ใช้ ${user.fullName} เรียบร้อยแล้ว`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้';
      toast.error(message);
    }
  };

  return (
    <TableRow>
      {/* Avatar + Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImageUrl || undefined} alt={user.fullName} />
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.fullName}</div>
            {user.jobTitle && (
              <div className="text-xs text-muted-foreground">
                {user.jobTitle.jobTitleTh}
                {user.jobLevel && ` (${user.jobLevel})`}
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
            <Shield className="h-3 w-3 text-green-600 dark:text-green-400" title="ยืนยันแล้ว" />
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
        <Badge className={ROLE_COLORS[user.role] || ''} variant="secondary">
          {ROLE_LABELS[user.role] || user.role}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.userStatus === 'ACTIVE'}
            onCheckedChange={handleStatusToggle}
            disabled={updateStatus.isPending}
            aria-label={`สถานะ ${user.userStatus === 'ACTIVE' ? 'ใช้งานอยู่' : 'ระงับ'}`}
          />
          <span className="text-sm">
            {user.userStatus === 'ACTIVE' ? 'ใช้งานอยู่' : 'ระงับ'}
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">เปิดเมนู</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openModal('editUser', user)}>
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={deleteUser.isPending}
              className="text-red-600 dark:text-red-400 focus:text-red-600 focus:dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
