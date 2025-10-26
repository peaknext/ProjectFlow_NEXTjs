'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useTaskChecklists,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem
} from '@/hooks/use-tasks';
import { useTaskPermissions } from '@/hooks/use-task-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  isClosed?: boolean;
}

interface ChecklistItem {
  id: string;
  taskId: string;
  name: string;
  isChecked: boolean;
  order: number;
}

interface ChecklistsSectionProps {
  taskId: string;
  task?: Task | null;
}

/**
 * ChecklistsSection Component
 *
 * Displays and manages checklist items.
 * Features:
 * - Checkbox toggle (immediate save with optimistic update)
 * - Completed items show line-through text
 * - Delete button (hidden until hover, confirmation dialog)
 * - "Add Checklist Item" button (inline input appears)
 * - Shows "X/Y completed" count in section header
 * - Disabled for closed tasks
 * - Loading skeleton
 *
 * @example
 * <ChecklistsSection taskId={task.id} task={task} />
 */
export function ChecklistsSection({ taskId, task }: ChecklistsSectionProps) {
  const permissions = useTaskPermissions(task);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [deleteDialogItem, setDeleteDialogItem] = useState<ChecklistItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch checklists
  const { data: checklistsData, isLoading } = useTaskChecklists(taskId);
  const checklists = checklistsData?.items || [];

  // Mutations
  const { mutate: createItem, isPending: isCreating } = useCreateChecklistItem(taskId);
  const { mutate: updateItem } = useUpdateChecklistItem(taskId);
  const { mutate: deleteItem, isPending: isDeleting } = useDeleteChecklistItem(taskId);

  // Calculate completion count
  const completedCount = checklists.filter(item => item.isChecked).length;
  const totalCount = checklists.length;

  // Handle click outside to close add form
  useEffect(() => {
    if (!showAddForm) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowAddForm(false);
        setNewItemName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddForm]);

  // Handle checkbox toggle
  const handleToggle = (item: ChecklistItem) => {
    updateItem({
      itemId: item.id,
      data: { isChecked: !item.isChecked }
    });
  };

  // Handle add checklist item
  const handleAddItem = (keepFormOpen = false) => {
    if (!newItemName.trim()) return;

    createItem(
      {
        name: newItemName.trim(),
        order: totalCount
      },
      {
        onSuccess: () => {
          setNewItemName('');
          if (keepFormOpen) {
            // Keep form open and refocus input for next item
            // Use setTimeout to ensure focus happens after state update
            setTimeout(() => {
              inputRef.current?.focus();
            }, 0);
          } else {
            setShowAddForm(false);
          }
        }
      }
    );
  };

  // Handle cancel
  const handleCancel = () => {
    setShowAddForm(false);
    setNewItemName('');
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!deleteDialogItem) return;

    deleteItem(
      { itemId: deleteDialogItem.id },
      {
        onSuccess: () => {
          setDeleteDialogItem(null);
        }
      }
    );
  };

  return (
    <>
      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-8 space-y-4">
        {/* Header with count */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            รายการสิ่งที่ต้องทำ
          </h3>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} เสร็จสิ้น
            </span>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        )}

        {/* Checklist items */}
        {!isLoading && checklists.length > 0 && (
          <div className="space-y-1">
            {checklists.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-1.5 rounded-md group',
                  'hover:bg-subtle-light dark:hover:bg-subtle-dark',
                  'transition-colors'
                )}
              >
                {/* Checkbox */}
                <Checkbox
                  checked={item.isChecked}
                  onCheckedChange={() => handleToggle(item)}
                  disabled={!permissions.canAddChecklist}
                  className="flex-shrink-0"
                />

                {/* Item name */}
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.isChecked
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  )}
                >
                  {item.name}
                </span>

                {/* Delete button (hover-visible) */}
                {permissions.canAddChecklist && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialogItem(item)}
                    className={cn(
                      'h-8 w-8 rounded-full',
                      'text-muted-foreground hover:text-red-600',
                      'hover:bg-red-100 dark:hover:bg-red-900/40',
                      'opacity-0 group-hover:opacity-100',
                      'transition-opacity'
                    )}
                    title="ลบรายการ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && checklists.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            ยังไม่มีรายการ
          </p>
        )}

        {/* Add form (inline) */}
        {showAddForm && permissions.canAddChecklist && (
          <div ref={containerRef} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isCreating) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddItem(true); // Keep form open
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }
              }}
              placeholder="ชื่อรายการ..."
              disabled={isCreating}
              autoFocus
              className="flex-1 bg-white dark:bg-background"
            />
            <Button
              size="sm"
              onClick={() => handleAddItem(false)} // Close form after save
              disabled={!newItemName.trim() || isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'บันทึก'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isCreating}
            >
              ยกเลิก
            </Button>
          </div>
        )}

        {/* Add checklist button */}
        {!showAddForm && permissions.canAddChecklist && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="text-primary hover:text-primary/80 font-medium gap-1"
          >
            <Plus className="h-4 w-4" />
            <span>เพิ่มรายการ</span>
          </Button>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deleteDialogItem}
        onOpenChange={(open) => !open && setDeleteDialogItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรายการนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบ "{deleteDialogItem?.name}"?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
