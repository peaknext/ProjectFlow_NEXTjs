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

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { X, Save, Loader2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-picker-popover";
import { useUIStore } from "@/stores/use-ui-store";
import { useProjectEditDetails, useEditProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  // Animation state (same as CreateProjectModal)
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const { projectId, isOpen } = editProjectModal;

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
    formState: { errors },
  } = useForm<EditProjectFormData>({
    defaultValues: {
      description: "",
      phases: [],
      statuses: [],
    },
  });

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

  // Handle close
  const handleClose = () => {
    closeEditProjectModal();
  };

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

      toast.success(`แก้ไขโปรเจค "${project?.name}" สำเร็จ`);
      handleClose();
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

      {/* Side Panel */}
      <div
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
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              แก้ไขโปรเจค
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="ปิด"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
        </header>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
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
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
              {/* Read-Only: Project Information (Blue info box) */}
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">ชื่อโปรเจค:</span>
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
                <Label htmlFor="description" className="text-sm font-medium">
                  คำอธิบาย
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="อธิบายวัตถุประสงค์และขอบเขตของโปรเจค..."
                  {...register("description")}
                  className="mt-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              {/* Project Metadata (Read-Only) */}
              <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span>สร้างโดย:</span>
                  <span className="font-medium text-foreground">
                    {project.creator?.fullName || '-'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>วันที่สร้าง:</span>
                  <span className="font-medium text-foreground">
                    {project.createdAt
                      ? (() => {
                          const date = new Date(project.createdAt);
                          const thaiYear = date.getFullYear() + 543;
                          const dateStr = format(date, 'd MMMM yyyy, HH:mm', { locale: th });
                          return dateStr.replace(/\d{4}/, thaiYear.toString());
                        })()
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Editable: Phases Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  ห้วงเวลาดำเนินงาน
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    แก้ไขวันที่เริ่มต้นและสิ้นสุดของแต่ละ Phase
                  </span>
                </h3>

                {/* Phases Container */}
                {project.phases && project.phases.length > 0 ? (
                  <div className="space-y-4">
                    {project.phases.map((phase, index) => (
                      <div
                        key={phase.id}
                        className="flex items-end gap-4 p-4 rounded-lg bg-black/5 dark:bg-white/5"
                      >
                        {/* Read-only Phase Name */}
                        <div className="flex-1">
                          <Label className="block text-sm font-medium mb-2">
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
                          <Label className="block text-sm font-medium mb-2">
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
                                className="h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                              />
                            )}
                          />
                        </div>

                        {/* Editable: End Date */}
                        <div className="flex-1">
                          <Label className="block text-sm font-medium mb-2">
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
                                className="h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                              />
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">โปรเจคนี้ยังไม่มีข้อมูล Phase</p>
                  </div>
                )}
              </div>

              {/* Editable: Statuses Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  สถานะงาน
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    แก้ไขสีของแต่ละสถานะ
                  </span>
                </h3>

                {/* Statuses Container */}
                {project.statuses && project.statuses.length > 0 ? (
                  <div className="space-y-3">
                    {project.statuses.map((status, index) => (
                      <div
                        key={status.id}
                        className="flex items-center gap-4 p-4 rounded-lg bg-black/5 dark:bg-white/5"
                      >
                        {/* Read-only Status Name */}
                        <div className="flex-1">
                          <Label className="block text-sm font-medium mb-2">
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
                          <Label className="block text-sm font-medium mb-2">
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
                                    className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer h-[46px]"
                                  >
                                    <span
                                      className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 flex-shrink-0"
                                      style={{ backgroundColor: field.value }}
                                    />
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                  </button>
                                </PopoverTrigger>
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
                              </Popover>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">โปรเจคนี้ยังไม่มีข้อมูล Status</p>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0 rounded-b-xl">
          <Button
            type="button"
            onClick={handleFormSubmit(onSubmit)}
            disabled={editProjectMutation.isPending || isLoading}
            className="flex items-center justify-center px-6 py-2.5 text-base font-semibold rounded-lg shadow-md h-[46px] min-w-[150px]"
          >
            {editProjectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                <span>บันทึก</span>
              </>
            )}
          </Button>
        </footer>
      </div>
    </>
  );
}
