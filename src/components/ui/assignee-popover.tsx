'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/common/user-avatar';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface AssigneePopoverProps {
  users: User[];
  selectedUserIds: string[];
  onSave: (userIds: string[]) => void;
  onCancel?: () => void;
  disabled?: boolean;
  maxVisible?: number;
  className?: string;
}

/**
 * AssigneePopover Component
 *
 * Multi-select dropdown for task assignees with search and avatars.
 * Features:
 * - Multi-select with checkboxes
 * - Search/filter by name
 * - User avatar + name display
 * - Selected state with checkmark
 * - Save/Cancel buttons
 * - Stacked avatars in trigger (max 3 + overflow)
 *
 * @example
 * <AssigneePopover
 *   users={projectUsers}
 *   selectedUserIds={assigneeIds}
 *   onSave={(newIds) => setAssigneeIds(newIds)}
 *   disabled={isClosed || !canEdit}
 * />
 */
export function AssigneePopover({
  users,
  selectedUserIds,
  onSave,
  onCancel,
  disabled = false,
  maxVisible = 3,
  className
}: AssigneePopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Get selected users for display
  const selectedUsers = useMemo(() => {
    return selectedUserIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
  }, [selectedUserIds, users]);

  const handleToggleUser = (userId: string) => {
    // Instant update - call onSave immediately
    const newSelectedIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter(id => id !== userId)
      : [...selectedUserIds, userId];

    onSave(newSelectedIds);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Clear search when closing
      setSearchQuery('');
    }
    setOpen(isOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center justify-start gap-2 h-[46px] w-full px-3 py-2 text-base text-left',
            'bg-white dark:bg-background border border-input rounded-lg',
            'text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
            className
          )}
        >
          {selectedUsers.length === 0 ? (
            <span className="text-muted-foreground">มอบหมายผู้รับผิดชอบ</span>
          ) : (
            <StackedAvatars users={selectedUsers} maxVisible={maxVisible} />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="p-3 border-b">
            <Input
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
          </div>

          {/* User List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                ไม่พบผู้ใช้
              </div>
            ) : (
              <ul className="py-1">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() => handleToggleUser(user.id)}
                        className={cn(
                          'flex items-center justify-between gap-3 w-full px-4 py-2.5',
                          'hover:bg-accent cursor-pointer',
                          'transition-colors'
                        )}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <UserAvatar user={user} size="md" />
                          <div className="flex flex-col items-start min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {user.fullName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * StackedAvatars Component
 *
 * Displays stacked user avatars with overflow count.
 * Shows up to maxVisible avatars, then "+N" for remaining.
 */
interface StackedAvatarsProps {
  users: User[];
  maxVisible?: number;
  className?: string;
}

export function StackedAvatars({
  users,
  maxVisible = 3,
  className
}: StackedAvatarsProps) {
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className={cn('flex items-center', className)}>
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className={cn(index > 0 && '-ml-2')}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <UserAvatar
            user={user}
            size="md"
            className="border-2 border-white dark:border-background"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white dark:border-background bg-muted text-xs font-semibold text-muted-foreground -ml-2"
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

/**
 * AssigneeTrigger Component (for use in forms)
 *
 * Standalone trigger button that shows selected assignees.
 * Used in conjunction with AssigneePopover.
 */
interface AssigneeTriggerProps {
  users: User[];
  selectedUserIds: string[];
  onClick?: () => void;
  disabled?: boolean;
  maxVisible?: number;
  className?: string;
}

export function AssigneeTrigger({
  users,
  selectedUserIds,
  onClick,
  disabled = false,
  maxVisible = 3,
  className
}: AssigneeTriggerProps) {
  const selectedUsers = useMemo(() => {
    return selectedUserIds
      .map(id => users.find(u => u.id === id))
      .filter(Boolean) as User[];
  }, [selectedUserIds, users]);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-start gap-2 h-[46px] w-full px-3 py-2 text-base text-left',
        'bg-background border border-input rounded-lg',
        'text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors',
        className
      )}
    >
      {selectedUsers.length === 0 ? (
        <span className="text-muted-foreground">มอบหมายผู้รับผิดชอบ</span>
      ) : (
        <StackedAvatars users={selectedUsers} maxVisible={maxVisible} />
      )}
    </button>
  );
}
