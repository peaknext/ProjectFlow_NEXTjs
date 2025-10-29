/**
 * EditProjectModal - Edit existing project details
 * Matches GAS EditProjectModal.html layout EXACTLY
 *
 * Editable Fields:
 * - Description
 * - Phase dates (start/end)
 * - Status colors
 *
 * Read-Only Fields:
 * - Project name
 * - Department
 * - Division
 * - Mission Group
 * - Phase names
 * - Status names
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { X, Save, Loader2, Palette, Eye, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-picker-popover";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUIStore } from "@/stores/use-ui-store";
import { useProjectEditDetails, useEditProject } from "@/hooks/use-projects";
import { useSession } from "@/hooks/use-session";
import { useSwipeToClose } from "@/hooks/use-swipe-to-close";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

// Color presets (same as CreateProjectModal)
const COLOR_PRESETS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#eab308", // yellow-500
  "#84cc16", // lime-500
  "#22c55e", // green-500
  "#10b981", // emerald-500
  "#14b8a6", // teal-500
  "#06b6d4", // cyan-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a855f7", // purple-500
  "#d946ef", // fuchsia-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
  "#94a3b8", // slate-400
  "#64748b", // slate-500
  "#475569", // slate-600
];

interface Phase {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface EditProjectFormData {
  description: string;
  phases: Phase[];
  statuses: Status[];
}

export function EditProjectModal() {
  const queryClient = useQueryClient();
  const editProjectModal = useUIStore((state) => state.modals.editProject);
  const closeEditProjectModal = useUIStore(
    (state) => state.closeEditProjectModal
  );
  const isMobile = useIsMobile();

  // Animation state (same as CreateProjectModal)
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const { projectId, isOpen } = editProjectModal;

  // Get current user session for permission check
  const { data: session } = useSession();

  // Check if user can edit projects (ADMIN, CHIEF, LEADER, HEAD can edit)
  const canEdit = useMemo(() => {
    if (!session?.user?.role) return false;
    return ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(session.user.role);
  }, [session?.user?.role]);

  // Fetch project edit details
  const {
    data: project,
    isLoading,
    error,
  } = useProjectEditDetails(projectId || "", {
    enabled: !!projectId && isOpen,
  });

  // Edit project mutation
  const editProjectMutation = useEditProject();

  // Form state management
  const {
    register,
    control,
    reset,
    handleSubmit: handleFormSubmit,
    formState: { errors, isDirty },
  } = useForm<EditProjectFormData>({
    defaultValues: {
      description: "",
      phases: [],
      statuses: [],
    },
  });

  // Unsaved changes confirmation
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Handle open/close animations (SAME AS CreateProjectModal)
  useEffect(() => {
    if (isOpen) {
      // Opening: render immediately, then trigger animation
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Closing: trigger animation, then unmount after animation completes
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Populate form when project data loads
  useEffect(() => {
    if (project) {
      reset({
        description: project.description || "",
        phases: project.phases || [],
        statuses: project.statuses || [],
      });
    }
  }, [project, reset]);

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (isDirty && canEdit) {
      setShowUnsavedWarning(true);
    } else {
      closeEditProjectModal();
    }
  };

  // Confirm close without saving
  const confirmClose = () => {
    setShowUnsavedWarning(false);
    closeEditProjectModal();
  };

  // Cancel close
  const cancelClose = () => {
    setShowUnsavedWarning(false);
  };

  // Swipe-to-close gesture for mobile
  const swipeHandlers = useSwipeToClose({
    onClose: handleClose,
    threshold: 100,
    velocityThreshold: 500,
  });

  // Handle form submission
  const onSubmit = async (data: EditProjectFormData) => {
    if (!projectId) return;

    try {
      await editProjectMutation.mutateAsync({
        projectId,
        updates: {
          description: data.description,
          phases: data.phases.map((phase) => ({
            id: phase.id,
            startDate: phase.startDate,
            endDate: phase.endDate,
          })),
          statuses: data.statuses.map((status) => ({
            id: status.id,
            color: status.color,
          })),
        },
      });

      toast.success(`แก้ไขโปรเจกต์ "${project?.name}" สำเร็จ`);
      // Close modal directly without dirty check (already saved successfully)
      closeEditProjectModal();
    } catch (error: any) {
      console.error("[EditProjectModal] Error saving:", error);
      toast.error(
        `ไม่สามารถบันทึกการเปลี่ยนแปลงได้: ${error.message || "เกิดข้อผิดพลาด"}`
      );
    }
  };

  // Don't render if not open
  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-[100]",
          "transition-opacity duration-300 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleClose}
      />

      {/* Side Panel with Swipe-to-Close */}
      <motion.div
        {...swipeHandlers}
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-3xl",
          "bg-background/90 backdrop-blur-sm",
          "shadow-2xl z-[101] rounded-xl",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <header className={cn(
          "flex items-center justify-between p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900",
          // Desktop: rounded top-left corner
          "md:rounded-tl-xl",
          // Mobile: no rounded corners (full-screen)
          "max-md:rounded-none"
        )}>
          <div className="flex items-center gap-2">
            {/* Mobile: Back button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                title="กลับ"
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
              แก้ไขโปรเจกต์
            </h2>
          </div>

          {/* Desktop: Close Button (X) */}
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              title="ปิด"
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </header>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  กำลังโหลดข้อมูล...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-destructive">
                  ไม่สามารถโหลดข้อมูลได้
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {error instanceof Error ? error.message : "เกิดข้อผิดพลาด"}
                </p>
              </div>
            </div>
          )}

          {project && (
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              {/* Read-Only: Project Information (Blue info box) */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 md:p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-xs md:text-sm">
                  <div>
                    <span className="text-muted-foreground">ชื่อโปรเจกต์:</span>
                    <span className="ml-2 font-medium">{project.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">หน่วยงาน:</span>
                    <span className="ml-2 font-medium">
                      {project.departmentName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">กลุ่มงาน:</span>
                    <span className="ml-2 font-medium">
                      {project.divisionName || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">กลุ่มภารกิจ:</span>
                    <span className="ml-2 font-medium">
                      {project.missionGroupName || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Editable: Description */}
              <div>
                <Label htmlFor="description" className="text-xs md:text-sm font-medium">
                  คำอธิบาย
                  {!canEdit && (
                    <span className="ml-2 text-[10px] md:text-xs text-amber-600 dark:text-amber-500">
                      (ดูอย่างเดียว)
                    </span>
                  )}
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="อธิบายวัตถุประสงค์และขอบเขตของโปรเจกต์..."
                  {...register("description")}
                  disabled={!canEdit}
                  className={cn(
                    "mt-1.5 border-slate-300 dark:border-slate-700",
                    canEdit
                      ? "bg-white dark:bg-slate-800"
                      : "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed text-muted-foreground"
                  )}
                />
              </div>

              {/* Project Metadata (Read-Only) */}
              <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span>สร้างโดย:</span>
                  {(project as any).creator && (
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={(project as any).creator.profileImageUrl || undefined}
                        alt={(project as any).creator.fullName}
                      />
                      <AvatarFallback className="text-[10px]">
                        {((project as any).creator.fullName || '').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <span className="font-medium text-foreground">
                    {(project as any).creator?.fullName || "-"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>วันที่สร้าง:</span>
                  <span className="font-medium text-foreground">
                    {(project as any).createdAt
                      ? (() => {
                          const date = new Date((project as any).createdAt);
                          const thaiYear = date.getFullYear() + 543;
                          const dateStr = format(date, "d MMMM yyyy, HH:mm", {
                            locale: th,
                          });
                          return dateStr.replace(/\d{4}/, thaiYear.toString());
                        })()
                      : "-"}
                  </span>
                </div>
              </div>

              {/* Editable: Phases Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 md:pt-6 space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">
                  ห้วงเวลาดำเนินงาน
                  <span className="text-xs md:text-sm font-normal text-muted-foreground ml-2 block md:inline mt-1 md:mt-0">
                    แก้ไขวันที่เริ่มต้นและสิ้นสุดของแต่ละ Phase
                  </span>
                </h3>

                {/* Phases Container */}
                {project.phases && project.phases.length > 0 ? (
                  <div className="space-y-3 md:space-y-4">
                    {project.phases.map((phase, index) => (
                      <div
                        key={phase.id}
                        className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-black/5 dark:bg-white/5"
                      >
                        {/* Read-only Phase Name */}
                        <div className="flex-1">
                          <Label className="block text-xs md:text-sm font-medium mb-1.5">
                            ชื่อ
                          </Label>
                          <Input
                            type="text"
                            value={phase.name}
                            disabled
                            className="h-10 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-muted-foreground cursor-not-allowed"
                          />
                        </div>

                        {/* Editable: Start Date */}
                        <div className="flex-1">
                          <Label className="block text-xs md:text-sm font-medium mb-1.5">
                            วันที่เริ่มต้น
                          </Label>
                          <Controller
                            control={control}
                            name={`phases.${index}.startDate`}
                            render={({ field }) => (
                              <DateInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="เลือกวันที่"
                                disabled={!canEdit}
                                className={cn(
                                  "h-10 border-slate-300 dark:border-slate-700",
                                  canEdit
                                    ? "bg-white dark:bg-slate-800"
                                    : "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
                                )}
                              />
                            )}
                          />
                        </div>

                        {/* Editable: End Date */}
                        <div className="flex-1">
                          <Label className="block text-xs md:text-sm font-medium mb-1.5">
                            วันที่สิ้นสุด
                          </Label>
                          <Controller
                            control={control}
                            name={`phases.${index}.endDate`}
                            render={({ field }) => (
                              <DateInput
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="เลือกวันที่"
                                disabled={!canEdit}
                                className={cn(
                                  "h-10 border-slate-300 dark:border-slate-700",
                                  canEdit
                                    ? "bg-white dark:bg-slate-800"
                                    : "bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed"
                                )}
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs md:text-sm">โปรเจกต์นี้ยังไม่มีข้อมูล Phase</p>
                  </div>
                )}
              </div>

              {/* Editable: Statuses Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 md:pt-6 space-y-3 md:space-y-4">
                <h3 className="text-base md:text-lg font-semibold">
                  สถานะงาน
                  <span className="text-xs md:text-sm font-normal text-muted-foreground ml-2 block md:inline mt-1 md:mt-0">
                    แก้ไขสีของแต่ละสถานะ
                  </span>
                </h3>

                {/* Statuses Container */}
                {project.statuses && project.statuses.length > 0 ? (
                  <div className="space-y-3">
                    {project.statuses.map((status, index) => (
                      <div
                        key={status.id}
                        className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-black/5 dark:bg-white/5"
                      >
                        {/* Read-only Status Name */}
                        <div className="flex-1">
                          <Label className="block text-xs md:text-sm font-medium mb-1.5">
                            ชื่อสถานะ
                          </Label>
                          <Input
                            type="text"
                            value={status.name}
                            disabled
                            className="h-10 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-muted-foreground cursor-not-allowed"
                          />
                        </div>

                        {/* Editable: Color */}
                        <div className="flex-shrink-0">
                          <Label className="block text-xs md:text-sm font-medium mb-1.5">
                            สี
                          </Label>
                          <Controller
                            control={control}
                            name={`statuses.${index}.color`}
                            render={({ field }) => (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    disabled={!canEdit}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 border rounded-lg h-10",
                                      canEdit
                                        ? "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                                        : "bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 cursor-not-allowed"
                                    )}
                                  >
                                    <span
                                      className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex-shrink-0"
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
                                {canEdit && (
                                  <PopoverContent
                                    className="w-[280px] p-3"
                                    align="end"
                                  >
                                    <div className="grid grid-cols-5 gap-2">
                                      {COLOR_PRESETS.map((color) => (
                                        <button
                                          key={color}
                                          type="button"
                                          className="w-10 h-10 rounded border border-slate-300 dark:border-slate-700 hover:scale-110 transition-transform"
                                          style={{ backgroundColor: color }}
                                          onClick={() => field.onChange(color)}
                                        />
                                      ))}
                                    </div>
                                  </PopoverContent>
                                )}
                              </Popover>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-xs md:text-sm">โปรเจกต์นี้ยังไม่มีข้อมูล Status</p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className={cn(
          "flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-0 p-3 md:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0",
          // Desktop: rounded bottom corners
          "md:rounded-b-xl",
          // Mobile: no rounded corners
          "max-md:rounded-none"
        )}>
          {!canEdit && (
            <div className="flex items-center gap-2 text-xs md:text-sm text-amber-600 dark:text-amber-500">
              <Eye className="h-4 w-4" />
              <span>คุณกำลังดูข้อมูลแบบอ่านอย่างเดียว</span>
            </div>
          )}
          {canEdit && (
            <>
              {/* Show unsaved changes indicator */}
              {isDirty && (
                <div className="flex items-center gap-2 text-xs md:text-sm text-amber-600 dark:text-amber-500">
                  <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse"></span>
                  <span>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
                </div>
              )}
              {!isDirty && <div className="hidden md:block"></div>}

              {/* Save button - disabled when no changes */}
              <Button
                type="button"
                onClick={handleFormSubmit(onSubmit)}
                disabled={
                  !isDirty || editProjectMutation.isPending || isLoading
                }
                className="flex items-center justify-center px-6 py-2.5 text-sm md:text-base font-semibold rounded-lg shadow-md h-10 md:h-[46px] w-full md:w-auto md:min-w-[150px]"
              >
                {editProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 md:h-5 w-4 md:w-5 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 md:h-5 w-4 md:w-5" />
                    <span>บันทึก</span>
                  </>
                )}
              </Button>
            </>
          )}
        </footer>
      </motion.div>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog
        open={showUnsavedWarning}
        onOpenChange={setShowUnsavedWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก หากปิดหน้าต่างนี้
              การเปลี่ยนแปลงทั้งหมดจะสูญหาย
              คุณต้องการปิดหน้าต่างโดยไม่บันทึกหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClose}
              className="bg-red-600 hover:bg-red-700"
            >
              ปิดโดยไม่บันทึก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
