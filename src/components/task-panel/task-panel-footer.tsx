"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useCloseTask } from "@/hooks/use-tasks";
import { useTaskPermissions } from "@/hooks/use-task-permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  name: string;
  statusId: string;
  isClosed?: boolean;
  closeType?: "COMPLETED" | "ABORTED" | null;
}

interface Status {
  id: string;
  name: string;
  order: number;
  type: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
}

interface TaskPanelFooterProps {
  task?: Task | null;
  isLoading?: boolean;
  isDirty?: boolean;
  isSubmitting?: boolean;
  onSave?: (() => Promise<void>) | null;
  statuses?: Status[];
  currentStatusId?: string;
}

/**
 * TaskPanelFooter Component
 *
 * Footer section with Close Task and Save Changes buttons.
 * Features:
 * - Close Task button (context-aware label)
 * - Save Changes button (dirty state detection)
 * - Loading spinners
 * - Close task confirmation dialog
 * - Permission-based disabling
 *
 * @example
 * <TaskPanelFooter
 *   task={task}
 *   initialData={initialFormData}
 *   currentData={currentFormData}
 *   onSave={handleSave}
 *   statuses={projectStatuses}
 * />
 */
export function TaskPanelFooter({
  task,
  isLoading,
  isDirty = false,
  isSubmitting = false,
  onSave,
  statuses = [],
  currentStatusId,
}: TaskPanelFooterProps) {
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeType, setCloseType] = useState<"COMPLETED" | "ABORTED">(
    "COMPLETED"
  );

  const permissions = useTaskPermissions(task);
  const { mutate: closeTask, isPending: isClosing } = useCloseTask();

  // Determine close button properties based on current status type
  const getCloseButtonProps = () => {
    if (!task || !statuses.length) {
      return { label: "ปิดงาน", isDone: false, icon: XCircle, className: "" };
    }

    // Use currentStatusId from form if available, otherwise fall back to task.statusId
    const statusIdToCheck = currentStatusId || task.statusId;
    const currentStatus = statuses.find((s) => s.id === statusIdToCheck);
    if (!currentStatus) {
      return { label: "ปิดงาน", isDone: false, icon: XCircle, className: "" };
    }

    // Check if status type is DONE
    if (currentStatus.type === "DONE") {
      return {
        label: "แล้วเสร็จ",
        isDone: true,
        icon: CheckCircle2,
        className:
          "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950",
      };
    }

    // Status is NOT_STARTED or IN_PROGRESS
    return {
      label: "ยกเลิกงาน",
      isDone: false,
      icon: XCircle,
      className:
        "text-slate-600 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-800",
    };
  };

  const handleSaveChanges = async () => {
    if (!onSave) return;
    await onSave();
  };

  const handleCloseTask = () => {
    if (!task) return;

    closeTask(
      { taskId: task.id, closeType },
      {
        onSuccess: () => {
          setShowCloseDialog(false);
        },
      }
    );
  };

  const handleOpenCloseDialog = () => {
    if (!task || !statuses.length) return;

    // Use currentStatusId from form if available, otherwise fall back to task.statusId
    const statusIdToCheck = currentStatusId || task.statusId;
    const currentStatus = statuses.find((s) => s.id === statusIdToCheck);
    if (!currentStatus) return;

    // Auto-select close type based on status type
    // DONE → COMPLETED, NOT_STARTED/IN_PROGRESS → ABORTED
    setCloseType(currentStatus.type === "DONE" ? "COMPLETED" : "ABORTED");
    setShowCloseDialog(true);
  };

  // Don't show close button if task is already closed
  const showCloseButton = task && !task.isClosed && permissions.canClose;

  // Don't show save button if user can't edit or task is closed
  const showSaveButton = task && !task.isClosed && permissions.canEdit;

  const closeButtonProps = getCloseButtonProps();
  const CloseIcon = closeButtonProps.icon;

  return (
    <>
      <footer className="flex justify-between items-center p-4 lg:p-6 bg-white dark:bg-slate-900 rounded-bl-xl border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
        {/* Close Task Button (Left) */}
        {showCloseButton ? (
          <Button
            variant="ghost"
            onClick={handleOpenCloseDialog}
            disabled={isLoading || isClosing}
            className={cn("gap-2", closeButtonProps.className)}
          >
            {isClosing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CloseIcon className="h-4 w-4" />
            )}
            <span>{closeButtonProps.label}</span>
          </Button>
        ) : (
          <div /> // Empty spacer
        )}

        {/* Save Changes Button (Right) */}
        {showSaveButton ? (
          <Button
            onClick={handleSaveChanges}
            disabled={!isDirty || isLoading || isSubmitting || !onSave}
            className={cn(
              "px-6 py-2.5 font-semibold shadow-md text-base",
              "h-[46px] min-w-[200px]"
            )}
          >
            {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            <span>{isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</span>
          </Button>
        ) : null}
      </footer>

      {/* Close Task Confirmation Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {closeButtonProps.isDone ? "ปิดงาน" : "ยกเลิกงาน"}
            </DialogTitle>
            <DialogDescription>
              {closeButtonProps.isDone
                ? "เมื่อปิดงานแล้ว จะไม่สามารถแกไขงานได้อีก คุณยืนยันที่จะปิดงานนี้หรือไม่?"
                : "เมื่อยกเลิกงานแล้ว จะไม่สามารถแกไขงานได้อีก คุณยืนยันที่จะยกเลิกงานนี้หรือไม่"}
            </DialogDescription>
          </DialogHeader>

          {closeButtonProps.isDone ? (
            // DONE status → Show only COMPLETED option with confirmation message
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-green-900 dark:text-green-100">
                  ปิดงาน
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  ปิดงานและบันทึกว่างานนี้สำเร็จแล้ว และจะไม่สามารถแกไขได้อีก
                </div>
              </div>
            </div>
          ) : (
            // NOT_STARTED/IN_PROGRESS → Show only ABORTED option with warning
            <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-slate-200 bg-slate-50 dark:bg-slate-900 dark:border-slate-700">
              <XCircle className="h-6 w-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  ยกเลิกงาน
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  งานนี้จะถูกปิดในขณะที่ยังไม่เสร็จสมบูรณ์
                  และจะไม่สามารถแก้ไขได้อีก
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={isClosing}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleCloseTask}
              disabled={isClosing}
              className={cn(
                closeButtonProps.isDone
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-slate-600 hover:bg-slate-700 text-white"
              )}
            >
              {isClosing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ยืนยัน{closeButtonProps.isDone ? "ปิดงาน" : "ยกเลิกงาน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
