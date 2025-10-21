/**
 * UserAvatar - แสดง avatar ของผู้ใช้พร้อม fallback
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: {
    fullName: string;
    email?: string;
    profileImageUrl?: string | null;
  } | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg',
};

/**
 * สร้างตัวอักษรย่อจากชื่อเต็ม
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  // เอาตัวอักษรแรกของคำแรกและคำสุดท้าย
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * สร้างสีพื้นหลังจากชื่อ (deterministic)
 */
function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function UserAvatar({
  user,
  size = 'md',
  className,
  showTooltip = true,
}: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn(sizeClasses[size], 'bg-muted', className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">
          ?
        </AvatarFallback>
      </Avatar>
    );
  }

  const initials = getInitials(user.fullName);
  const bgColor = getColorFromName(user.fullName);

  return (
    <Avatar
      className={cn(sizeClasses[size], className)}
      title={showTooltip ? user.fullName : undefined}
    >
      {user.profileImageUrl && (
        <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
      )}
      <AvatarFallback className={cn(bgColor, 'text-white font-medium')}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * UserAvatarGroup - แสดงกลุ่ม avatars พร้อมจำนวนที่เหลือ
 */
interface UserAvatarGroupProps {
  users: Array<{
    fullName: string;
    email?: string;
    profileImageUrl?: string | null;
  }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatarGroup({
  users,
  max = 3,
  size = 'sm',
  className,
}: UserAvatarGroupProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayUsers.map((user, index) => (
        <UserAvatar
          key={index}
          user={user}
          size={size}
          className="ring-2 ring-background"
        />
      ))}
      {remainingCount > 0 && (
        <Avatar className={cn(sizeClasses[size], 'ring-2 ring-background')}>
          <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
