/**
 * CreateProjectModal - Project creation slide panel
 * Matches GAS CreateProjectModal.html layout EXACTLY
 *
 * Key Features:
 * - Side panel animation (same as TaskPanel)
 * - Organization hierarchy: Mission Group → Division → Department (3 cols, cascade)
 * - Hospital Mission → Action Plan (2 cols, cascade)
 * - Dynamic Phases management (3 default: วางแผน, ดำเนินงาน, ประเมินผล)
 * - Dynamic Statuses management (3 default with exact GAS colors)
 * - Form validation
 * - API integration
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, Loader2, Palette, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-picker-popover";
import { useUIStore } from "@/stores/use-ui-store";
import { useWorkspace } from "@/hooks/use-workspace";
import { useHospMissions, useActionPlans } from "@/hooks/use-organization";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@/hooks/use-projects";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Phase {
  name: string;
  startDate: string | null;
  endDate: string | null;
  order: number;
}

interface Status {
  name: string;
  color: string;
  order: number;
  statusType: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "ABORTED";
}

interface ProjectFormData {
  name: string;
  description: string;
  missionGroupId: string;
  divisionId: string;
  departmentId: string;
  hospMissionId: string;
  actionPlanId: string;
  phases: Phase[];
  statuses: Status[];
}

interface MissionGroup {
  id: string;
  name: string;
}

interface Division {
  id: string;
  name: string;
  missionGroupId: string;
}

interface Department {
  id: string;
  name: string;
  divisionId: string;
}

interface HospMission {
  id: string;
  name: string;
}

interface ActionPlan {
  id: string;
  name: string;
  hospMissionId: string;
}

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

// GAS Default Phases (Thai names)
const DEFAULT_PHASES: Phase[] = [
  { name: "วางแผน", startDate: null, endDate: null, order: 1 },
  { name: "ดำเนินงาน", startDate: null, endDate: null, order: 2 },
  { name: "ประเมินผล", startDate: null, endDate: null, order: 3 },
];

// GAS Default Statuses (Thai names + exact colors)
const DEFAULT_STATUSES: Status[] = [
  {
    name: "รอดำเนินการ",
    color: "#94a3b8",
    order: 1,
    statusType: "NOT_STARTED",
  }, // slate-400
  {
    name: "กำลังดำเนินการ",
    color: "#3b82f6",
    order: 2,
    statusType: "IN_PROGRESS",
  }, // blue-500
  { name: "เสร็จสิ้น", color: "#22c55e", order: 3, statusType: "DONE" }, // green-500
];

export function CreateProjectModal() {
  const queryClient = useQueryClient();
  const createProjectModal = useUIStore((state) => state.modals.createProject);
  const closeCreateProjectModal = useUIStore(
    (state) => state.closeCreateProjectModal
  );

  // Animation state (same as TaskPanel)
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Create project mutation with optimistic updates
  const createProjectMutation = useCreateProject();

  // Workspace data
  const { data: workspaceData } = useWorkspace();

  // Current user data
  const { user } = useAuth();

  // Popover states
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [hospMissionPopoverOpen, setHospMissionPopoverOpen] = useState(false);
  const [actionPlanPopoverOpen, setActionPlanPopoverOpen] = useState(false);

  // Search states
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [hospMissionSearch, setHospMissionSearch] = useState("");
  const [actionPlanSearch, setActionPlanSearch] = useState("");

  // Form state management
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    defaultValues: {
      name: "",
      description: "",
      missionGroupId: "",
      divisionId: "",
      departmentId: "",
      hospMissionId: "",
      actionPlanId: "",
      phases: DEFAULT_PHASES,
      statuses: DEFAULT_STATUSES,
    },
  });

  const {
    fields: phaseFields,
    append: appendPhase,
    remove: removePhase,
  } = useFieldArray({
    control,
    name: "phases",
  });

  const {
    fields: statusFields,
    append: appendStatus,
    remove: removeStatus,
  } = useFieldArray({
    control,
    name: "statuses",
  });

  // Watch form values (MUST be after useForm)
  const watchDepartmentId = watch("departmentId");
  const watchHospMissionId = watch("hospMissionId");

  // Organization data (MUST be after watch values)
  const { data: hospMissions = [] } = useHospMissions();
  const { data: actionPlans = [] } = useActionPlans(watchHospMissionId);

  // Handle open/close animations (SAME AS TASKPANEL)
  useEffect(() => {
    if (createProjectModal.isOpen) {
      // Opening: render immediately, then trigger animation
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      // Reset form to defaults with user's primary department
      reset({
        name: "",
        description: "",
        missionGroupId: "",
        divisionId: "",
        departmentId: user?.departmentId || "",
        hospMissionId: "",
        actionPlanId: "",
        phases: DEFAULT_PHASES,
        statuses: DEFAULT_STATUSES,
      });
    } else {
      // Closing: trigger animation, then unmount after animation completes
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [createProjectModal.isOpen, reset, user]);

  // Extract departments from workspace (flatten all departments)
  const departments: Department[] = [];

  if (workspaceData?.hierarchical) {
    workspaceData.hierarchical.forEach((mg) => {
      mg.divisions?.forEach((div) => {
        div.departments?.forEach((dept) => {
          departments.push({
            id: dept.id,
            name: dept.name,
            divisionId: div.id,
          });
        });
      });
    });
  }

  // Cascade reset handler for action plans
  useEffect(() => {
    // Reset Action Plan when Hospital Mission changes
    if (watchHospMissionId) {
      setValue("actionPlanId", "");
    }
  }, [watchHospMissionId, setValue]);

  // Handle close
  const handleClose = () => {
    closeCreateProjectModal();
  };

  // Handle form submission
  const onSubmit = async (data: ProjectFormData) => {
    // Validate
    if (!data.name.trim()) {
      toast.error("กรุณากรอกชื่อโปรเจกต์");
      return;
    }

    if (!data.departmentId) {
      toast.error("กรุณาเลือกหน่วยงาน");
      return;
    }

    if (data.statuses.length === 0) {
      toast.error("กรุณาเพิ่มอย่างน้อย 1 Status");
      return;
    }

    // Format phases data
    const phasesData = data.phases
      .filter((p) => p.name.trim()) // Only include phases with names
      .map((phase, index) => ({
        name: phase.name.trim(),
        phaseOrder: index + 1,
        startDate: phase.startDate || null,
        endDate: phase.endDate || null,
      }));

    // Format statuses data
    const statusesData = data.statuses.map((status, index) => ({
      name: status.name.trim(),
      color: status.color,
      order: index + 1,
      statusType: status.statusType,
    })) as any;

    // Close modal immediately (optimistic)
    handleClose();

    // Create project with optimistic update
    createProjectMutation.mutate(
      {
        name: data.name.trim(),
        description: data.description.trim(),
        departmentId: data.departmentId,
        hospMissionId: data.hospMissionId || null,
        actionPlanId: data.actionPlanId || null,
        phases: phasesData,
        statuses: statusesData,
      },
      {
        onSuccess: () => {
          toast.success(`สร้างโปรเจกต์ "${data.name}" สำเร็จ`);
        },
        onError: (error: any) => {
          console.error("[CreateProjectModal] Error creating project:", error);
          toast.error(error.message || "ไม่สามารถสร้างโปรเจกต์ได้");
        },
      }
    );
  };

  // Handle add phase
  const handleAddPhase = () => {
    appendPhase({
      name: "",
      startDate: null,
      endDate: null,
      order: phaseFields.length + 1,
    });
  };

  // Handle add status
  const handleAddStatus = () => {
    const nextColor = COLOR_PRESETS[statusFields.length % COLOR_PRESETS.length];
    appendStatus({
      name: "",
      color: nextColor,
      order: statusFields.length + 1,
      statusType: "IN_PROGRESS",
    });
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            สร้างโปรเจกต์ใหม่
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full p-2 h-auto w-auto hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>

        {/* Body (Scrollable) - Match GAS layout */}
        <form
          onSubmit={handleFormSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
            {/* Project Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                ชื่อโปรเจกต์ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="ชื่อโปรเจกต์ของคุณ..."
                {...register("name")}
                className="mt-1 text-lg font-semibold h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Department Selector */}
            <div>
              <Label htmlFor="department" className="text-sm font-medium">
                หน่วยงาน <span className="text-red-500">*</span>
              </Label>
              <Popover
                open={departmentPopoverOpen && user?.role !== "HEAD"}
                onOpenChange={(open) => {
                  if (user?.role !== "HEAD") {
                    setDepartmentPopoverOpen(open);
                    if (!open) setDepartmentSearch("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={user?.role === "HEAD"}
                    className={cn(
                      "w-full justify-between mt-1 h-[46px] text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700",
                      user?.role === "HEAD" && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        !watchDepartmentId && "text-muted-foreground truncate"
                      )}
                    >
                      {watchDepartmentId
                        ? departments.find((d) => d.id === watchDepartmentId)
                            ?.name
                        : "เลือกหน่วยงาน"}
                    </span>
                    {user?.role !== "HEAD" && (
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="p-2 border-b border-border">
                    <Input
                      placeholder="ค้นหาหน่วยงาน..."
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      className="h-9 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {departments
                      .filter((dept) =>
                        dept.name
                          .toLowerCase()
                          .includes(departmentSearch.toLowerCase())
                      )
                      .map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                            watchDepartmentId === dept.id && "bg-accent"
                          )}
                          onClick={() => {
                            setValue("departmentId", dept.id);
                            setDepartmentPopoverOpen(false);
                            setDepartmentSearch("");
                          }}
                        >
                          {dept.name}
                        </button>
                      ))}
                    {departments.filter((dept) =>
                      dept.name
                        .toLowerCase()
                        .includes(departmentSearch.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        ไม่พบหน่วยงาน
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                รายละเอียด
              </Label>
              <Textarea
                id="description"
                placeholder="อธิบายวัตถุประสงค์และขอบเขตของโปรเจกต์..."
                {...register("description")}
                rows={4}
                className="mt-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Hospital Mission & Action Plan (2 columns grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hospital Mission Selector */}
              <div>
                <Label className="text-sm font-medium">
                  ยุทธศาสตร์โรงพยาบาล
                </Label>
                <Popover
                  open={hospMissionPopoverOpen}
                  onOpenChange={setHospMissionPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between mt-1 h-[46px] text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    >
                      <span
                        className={cn(
                          "truncate flex-1 text-left",
                          !watchHospMissionId && "text-muted-foreground"
                        )}
                      >
                        {watchHospMissionId
                          ? hospMissions.find(
                              (hm) => hm.id === watchHospMissionId
                            )?.name
                          : "เลือกยุทธศาสตร์..."}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="max-h-[300px] overflow-y-auto">
                      {hospMissions.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                          ยังไม่มีข้อมูลยุทธศาสตร์
                        </div>
                      ) : (
                        hospMissions.map((hm) => (
                          <button
                            key={hm.id}
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                              watchHospMissionId === hm.id && "bg-accent"
                            )}
                            onClick={() => {
                              setValue("hospMissionId", hm.id);
                              setHospMissionPopoverOpen(false);
                            }}
                          >
                            {hm.name}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Action Plan Selector */}
              <div>
                <Label className="text-sm font-medium">แผนปฏิบัติการ</Label>
                <Popover
                  open={actionPlanPopoverOpen}
                  onOpenChange={setActionPlanPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between mt-1 h-[46px] text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    >
                      <span
                        className={cn(
                          "truncate flex-1 text-left",
                          !watch("actionPlanId") && "text-muted-foreground"
                        )}
                      >
                        {watch("actionPlanId")
                          ? actionPlans.find(
                              (ap) => ap.id === watch("actionPlanId")
                            )?.name
                          : "เลือกแผนปฏิบัติการ..."}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="max-h-[300px] overflow-y-auto">
                      {actionPlans.length === 0 ? (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                          {watchHospMissionId
                            ? "ไม่มีแผนปฏิบัติการ"
                            : "กรุณาเลือกยุทธศาสตร์ก่อน"}
                        </div>
                      ) : (
                        actionPlans.map((ap) => (
                          <button
                            key={ap.id}
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                              watch("actionPlanId") === ap.id && "bg-accent"
                            )}
                            onClick={() => {
                              setValue("actionPlanId", ap.id);
                              setActionPlanPopoverOpen(false);
                            }}
                          >
                            {ap.name}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Phases Section (match GAS with header + description) */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-lg font-semibold">
                ห้วงเวลาดำเนินงาน
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ห้วงระยะเวลาดำเนินงานในแต่ละช่วงของโปรเจกต์
                </span>
              </h3>

              <div className="space-y-4">
                {phaseFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-4 p-4 rounded-lg bg-black/5 dark:bg-white/5"
                  >
                    <div className="flex-1">
                      <Label className="block text-sm font-medium mb-2">
                        ชื่อ
                      </Label>
                      <Input
                        placeholder="เช่น Planning, Execution"
                        {...register(`phases.${index}.name`)}
                        className="h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      />
                    </div>
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removePhase(index)}
                      className="h-10 w-10 p-2 text-muted-foreground hover:text-destructive flex-shrink-0 self-end pb-2"
                      title="ลบ Phase"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Phase Button */}
              <button
                type="button"
                onClick={handleAddPhase}
                className="flex items-center justify-center gap-2 w-full text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มห้วงเวลา</span>
              </button>
            </div>

            {/* Statuses Section (match GAS with long description) */}
            <div className="border-t border-border pt-6 space-y-4">
              <h3 className="text-lg font-semibold">
                สถานะงานในโปรเจกต์ <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  สร้างตัวเลือกสำหรับสถานะของงานแต่ละงานภายใต้โปรเจกต์
                  ลำดับแรกจะมีค่าเป็นสถานะรอดำเนินการ
                  ลำดับถัดมาจะมีค่าเป็นสถานะอยู่ระหว่างดำเนินการ
                  และลำดับสุดท้ายจะมีค่าเป็นสถานะเสร็จสิ้น
                </span>
              </h3>

              <div className="space-y-4">
                {statusFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-4 p-4 rounded-lg bg-black/5 dark:bg-white/5"
                  >
                    <div className="flex-1">
                      <Label className="block text-sm font-medium mb-2">
                        ชื่อสถานะ
                      </Label>
                      <Input
                        placeholder="เช่น To Do, In Progress"
                        {...register(`statuses.${index}.name`)}
                        className="h-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      />
                    </div>
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
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer h-10"
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeStatus(index)}
                      className="h-10 w-10 p-2 text-muted-foreground hover:text-destructive flex-shrink-0 self-end pb-2"
                      title="ลบ Status"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Status Button */}
              <button
                type="button"
                onClick={handleAddStatus}
                className="flex items-center justify-center gap-2 w-full text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>เพิ่มสถานะงาน</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex justify-end p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 rounded-b-xl">
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="flex items-center justify-center px-6 py-2.5 text-base font-semibold rounded-lg shadow-md h-[46px] min-w-[150px]"
            >
              {createProjectMutation.isPending && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              <span>
                {createProjectMutation.isPending
                  ? "กำลังสร้าง..."
                  : "สร้างโปรเจกต์"}
              </span>
            </Button>
          </footer>
        </form>
      </div>
    </>
  );
}
