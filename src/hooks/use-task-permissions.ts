import { useMemo } from 'react';
import { useSession } from '@/hooks/use-session';

interface Task {
  id: string;
  creatorId?: string;
  assigneeUserId?: string | null; // Legacy single assignee
  assigneeUserIds?: string[]; // Multi-assignee support
  isClosed?: boolean;
  projectId?: string;
}

interface TaskPermissions {
  canView: boolean;
  canEdit: boolean;
  canClose: boolean;
  canComment: boolean;
  canAddChecklist: boolean;
  canAddSubtask: boolean;
}

/**
 * useTaskPermissions Hook
 *
 * Determines user permissions for a task based on:
 * - User role (ADMIN, CHIEF, LEADER, HEAD, MEMBER, USER)
 * - Task ownership (creator or assignee - supports multi-assignee)
 * - Task state (open or closed)
 * - Organization hierarchy
 *
 * Permission Rules:
 * - canView: Anyone in organization
 * - canEdit: Creator, Any Assignee, CHIEF+, Dept HEAD+ (unless closed)
 * - canClose: Same as canEdit (unless already closed)
 * - canComment: Anyone in organization (unless closed)
 * - canAddChecklist: Same as canEdit (unless closed)
 * - canAddSubtask: Same as canEdit (unless closed)
 *
 * @param task - The task to check permissions for
 * @returns TaskPermissions object
 *
 * @example
 * const permissions = useTaskPermissions(task);
 * <Input disabled={!permissions.canEdit} />
 * <Button disabled={!permissions.canClose}>Close Task</Button>
 */
export function useTaskPermissions(
  task: Task | undefined | null
): TaskPermissions {
  const { data: session } = useSession();

  const permissions = useMemo((): TaskPermissions => {
    // Default: no permissions
    if (!task || !session) {
      return {
        canView: false,
        canEdit: false,
        canClose: false,
        canComment: false,
        canAddChecklist: false,
        canAddSubtask: false
      };
    }

    const userId = session.userId;
    const userRole = session.user?.role;

    // Check if user is task creator or assignee
    const isCreator = task.creatorId === userId;
    const isAssignee = task.assigneeUserId === userId || task.assigneeUserIds?.includes(userId) || false;
    const isOwner = isCreator || isAssignee;

    // Check if user is high-level admin
    const isAdmin = userRole === 'ADMIN';
    const isChief = userRole === 'CHIEF';
    const isLeader = userRole === 'LEADER';
    const isHead = userRole === 'HEAD';
    const isHighLevel = isAdmin || isChief || isLeader || isHead;

    // Determine base edit permission (before considering closed state)
    const canEditBase = isOwner || isHighLevel;

    // Check if task is closed
    const isClosed = task.isClosed === true;

    return {
      // Anyone in organization can view
      canView: true,

      // Can edit if owner/high-level AND task is not closed
      canEdit: canEditBase && !isClosed,

      // Can close if can edit AND task is not already closed
      canClose: canEditBase && !isClosed,

      // Can comment if task is not closed
      canComment: !isClosed,

      // Can add checklist if can edit AND task is not closed
      canAddChecklist: canEditBase && !isClosed,

      // Can add subtask if can edit AND task is not closed
      canAddSubtask: canEditBase && !isClosed
    };
  }, [task, session]);

  return permissions;
}

/**
 * getPermissionNotice
 *
 * Returns a user-friendly notice message based on permission state.
 * Used to show informative messages in the UI.
 *
 * @param task - The task
 * @param permissions - The permissions object
 * @returns string - Notice message or empty string
 *
 * @example
 * const notice = getPermissionNotice(task, permissions);
 * {notice && <div className="text-sm text-blue-600">{notice}</div>}
 */
export function getPermissionNotice(
  task: Task | undefined | null,
  permissions: TaskPermissions
): string {
  if (!task) return '';

  // Task is closed
  if (task.isClosed) {
    return 'งานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขได้';
  }

  // User can view but not edit (but can comment/add checklist/subtask)
  if (!permissions.canEdit && permissions.canComment) {
    return 'คุณสามารถเพิ่ม Subtask, Checklist และ Comment ได้ แต่ไม่สามารถแก้ไขข้อมูลหลักของงานได้';
  }

  // User has no permissions at all
  if (!permissions.canView) {
    return 'คุณไม่มีสิทธิ์เข้าถึงงานนี้';
  }

  return '';
}

/**
 * canEditTask (Utility Function)
 *
 * Simplified check for task edit permission.
 * Exported for use in places where hooks can't be used.
 *
 * @param task - The task
 * @param userId - Current user ID
 * @param userRole - Current user role
 * @returns boolean
 */
export function canEditTask(
  task: Task | undefined | null,
  userId: string | undefined,
  userRole: string | undefined
): boolean {
  if (!task || !userId) return false;

  const isCreator = task.creatorId === userId;
  const isAssignee = task.assigneeUserId === userId || task.assigneeUserIds?.includes(userId) || false;
  const isOwner = isCreator || isAssignee;

  const isHighLevel = ['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(userRole || '');

  const canEditBase = isOwner || isHighLevel;
  const isClosed = task.isClosed === true;

  return canEditBase && !isClosed;
}
