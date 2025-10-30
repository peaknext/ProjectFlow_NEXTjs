/**
 * CreateTaskModal - Task creation slide panel
 * Matches GAS CreateTaskModal design with existing components
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CornerDownRight,
  Loader2,
  Calendar as CalendarIcon,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AssigneePopover } from "@/components/ui/assignee-popover";
import { StatusSlider } from "@/components/ui/status-slider";
import { PriorityPopover } from "@/components/ui/priority-popover";
import { DifficultyPopover } from "@/components/ui/difficulty-popover";
import { DateInput } from "@/components/ui/date-picker-popover";
import { ProjectPopover } from "@/components/ui/project-popover";
import { ParentTaskPopover } from "@/components/ui/parent-task-popover";
import { useUIStore } from "@/stores/use-ui-store";
import { useCreateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useIsMobile } from "@/hooks/use-media-query";
import { useSwipeToClose } from "@/hooks/use-swipe-to-close";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WorkspaceData, BoardData } from "@/types/api-responses";
import type { PriorityValue } from "@/components/ui/priority-popover";
import type { DifficultyValue } from "@/components/ui/difficulty-popover";

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface Task {
  id: string;
  name: string;
  projectId: string;
}

interface Project {
  id: string;
  name: string;
  status?: string;
}

interface TaskFormData {
  name: string;
  description: string;
  statusId: string;
  priority: string;
  difficulty: string;
  startDate: string | null;
  dueDate: string | null;
  assigneeUserIds: string[];
  parentTaskId?: string;
  projectId: string;
}

export function CreateTaskModal() {
  const queryClient = useQueryClient();
  const createTaskModal = useUIStore((state) => state.modals.createTask);
  const closeCreateTaskModal = useUIStore(
    (state) => state.closeCreateTaskModal
  );
  const createTask = useCreateTask();
  const isMobile = useIsMobile();

  // Swipe-to-close gesture for mobile
  const swipeHandlers = useSwipeToClose({
    onClose: closeCreateTaskModal,
    threshold: 100,
    velocityThreshold: 500,
  });

  // Fetch all accessible projects (with permission check)
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({
    limit: 1000, // Get all accessible projects
    status: "ACTIVE", // Only active projects
  });

  // Animation state (same as TaskPanel)
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Project-specific data
  const [projectUsers, setProjectUsers] = useState<User[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<Status[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form state management
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit: handleFormSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      name: "",
      description: "",
      statusId: "",
      priority: "3",
      difficulty: "2",
      startDate: null,
      dueDate: null,
      assigneeUserIds: [],
      projectId: "",
    },
  });

  const watchProjectId = watch("projectId");

  // Handle open/close animations (SAME AS TASKPANEL)
  useEffect(() => {
    if (createTaskModal.isOpen) {
      // Opening: render immediately, then trigger animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
      // Load initial data when opening
      loadInitialData();
    } else {
      // Closing: trigger animation, then unmount after animation completes
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
        // Reset form AFTER animation completes
        resetForm();
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [createTaskModal.isOpen]);

  // Reload projects when projectsData changes
  useEffect(() => {
    if (createTaskModal.isOpen && projectsData?.projects) {
      loadInitialData();
    }
  }, [projectsData?.projects]);

  // Load project data when project is selected
  useEffect(() => {
    if (watchProjectId) {
      loadProjectData(watchProjectId);
    }
  }, [watchProjectId]);

  async function loadInitialData() {
    // Reset form first (but keep default values)
    reset({
      name: "",
      description: "",
      statusId: "",
      priority: "3",
      difficulty: "2",
      startDate: createTaskModal.defaultStartDate || null,
      dueDate: createTaskModal.defaultDueDate || null,
      assigneeUserIds: [],
      projectId: createTaskModal.projectId || "", // Keep projectId if provided
    });

    // Load available projects for selector
    let projects: Project[] = [];

    // PRIORITY 1: Use projects from useProjects hook (with permission check)
    if (projectsData?.projects && projectsData.projects.length > 0) {
      // Map to expected Project interface (keep departmentId for filtering)
      projects = projectsData.projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        departmentId: p.departmentId, // Keep for filtering
      }));

      // Filter by departmentId if provided (additional client-side filter)
      if (createTaskModal.departmentId) {
        const filteredProjects = projects.filter(
          (p: any) => p.departmentId === createTaskModal.departmentId
        );
        projects = filteredProjects;
      }
    }
    // PRIORITY 2: Fallback to pre-filtered projects (for backward compatibility)
    else if (
      createTaskModal.availableProjects &&
      createTaskModal.availableProjects.length > 0
    ) {
      projects = createTaskModal.availableProjects;
    }
    // PRIORITY 3: Fallback to workspace cache (last resort)
    else {
      try {
        const cachedWorkspace = queryClient.getQueryData(["workspace"]) as { workspace: WorkspaceData } | undefined;

        if (cachedWorkspace?.workspace) {
          // If departmentId is provided, filter projects by department
          if (createTaskModal.departmentId) {
            projects = extractProjectsFromWorkspace(
              cachedWorkspace.workspace,
              createTaskModal.departmentId
            );
          } else {
            projects = extractProjectsFromWorkspace(cachedWorkspace.workspace);
          }
        }
      } catch (error) {
        console.error("Failed to load projects from workspace cache:", error);
      }
    }

    // If opened from project view with projectId
    if (createTaskModal.projectId && createTaskModal.projectName) {
      const project = {
        id: createTaskModal.projectId,
        name: createTaskModal.projectName,
      };
      setSelectedProject(project);

      // Make sure current project is in availableProjects
      if (!projects.find((p) => p.id === createTaskModal.projectId)) {
        projects = [project, ...projects];
      }

      // Load project data immediately (don't wait for useEffect)
      await loadProjectData(createTaskModal.projectId);
    }
    // Auto-select if only 1 project available
    else if (projects.length === 1) {
      const project = projects[0];
      setSelectedProject(project);
      setValue("projectId", project.id);

      // Load project data immediately
      await loadProjectData(project.id);
    } else {
      setSelectedProject(null);
      // Clear project data
      setProjectUsers([]);
      setProjectStatuses([]);
      setProjectTasks([]);
    }

    setAvailableProjects(projects);
  }

  function extractProjectsFromWorkspace(
    workspace: any,
    filterDepartmentId?: string
  ): Project[] {
    const projects: Project[] = [];

    if (workspace.viewType === "hierarchical" && workspace.hierarchical) {
      workspace.hierarchical.forEach((mg: any) => {
        mg.divisions?.forEach((div: any) => {
          div.departments?.forEach((dept: any) => {
            // If filterDepartmentId is provided, only include projects from that department
            if (filterDepartmentId && dept.id !== filterDepartmentId) {
              return; // Skip this department
            }

            dept.projects?.forEach((proj: any) => {
              projects.push({
                id: proj.id,
                name: proj.name,
                status: proj.status,
              });
            });
          });
        });
      });
    } else if (workspace.viewType === "flat" && workspace.flat) {
      workspace.flat.forEach((item: any) => {
        if (item.type === "project") {
          projects.push({
            id: item.id,
            name: item.name,
            status: item.metadata?.status,
          });
        }
      });
    }

    return projects;
  }

  async function loadProjectData(projectId: string) {
    setIsLoadingProjectData(true);
    try {
      // Try cache first
      const cachedData = queryClient.getQueryData([
        "project-board",
        projectId,
      ]) as BoardData | undefined;

      if (cachedData) {
        setProjectUsers(cachedData.departmentUsers || []);
        setProjectStatuses(cachedData.statuses || []);
        setProjectTasks(
          cachedData.tasks?.filter((t) => !t.parentTaskId) || []
        );

        // Set default status
        if (cachedData.statuses && cachedData.statuses.length > 0) {
          setValue("statusId", cachedData.statuses[0].id);
        }
      } else {
        // Fetch from API
        const response = await api.get(`/api/projects/${projectId}/board`);
        setProjectUsers(response.users || []);
        setProjectStatuses(response.statuses || []);
        setProjectTasks(
          response.tasks?.filter((t: any) => !t.parentTaskId) || []
        );

        if (response.statuses && response.statuses.length > 0) {
          setValue("statusId", response.statuses[0].id);
        }
      }

      // Reset assignees when project changes
      setValue("assigneeUserIds", []);
    } catch (error) {
      console.error("Failed to load project data:", error);
      toast.error("ไม่สามารถโหลดข้อมูลโปรเจกต์ได้");
    } finally {
      setIsLoadingProjectData(false);
    }
  }

  function resetForm() {
    // Clear all form state
    reset({
      name: "",
      description: "",
      statusId: "",
      priority: "3",
      difficulty: "2",
      startDate: null,
      dueDate: null,
      assigneeUserIds: [],
      projectId: "",
    });
    setSelectedProject(null);
    setProjectUsers([]);
    setProjectStatuses([]);
    setProjectTasks([]);
    setAvailableProjects([]);
  }

  const onSubmit = async (data: TaskFormData) => {
    // Validate project selection
    if (!data.projectId) {
      toast.error("กรุณาเลือกโปรเจกต์");
      return;
    }

    // Prepare form data
    const formData = {
      name: data.name.trim(),
      description: data.description.trim(),
      projectId: data.projectId,
      statusId: data.statusId,
      priority: parseInt(data.priority, 10),
      difficulty: parseInt(data.difficulty, 10),
      assigneeUserIds: data.assigneeUserIds,
      startDate: data.startDate,
      dueDate: data.dueDate,
      parentTaskId: createTaskModal.parentTaskId || data.parentTaskId,
    };

    // Close modal immediately (optimistic)
    closeCreateTaskModal();

    // Create task with optimistic update
    createTask.mutate(formData, {
      onSuccess: () => {
        toast.success("สร้างงานสำเร็จ");
        resetForm();
      },
      onError: (error: any) => {
        toast.error(`ไม่สามารถสร้างงานได้: ${error.message}`);
      },
    });
  };

  const parentTask = createTaskModal.parentTaskId
    ? projectTasks.find((t) => t.id === createTaskModal.parentTaskId)
    : null;

  // Prevent body scroll when panel is open (SAME AS TASKPANEL)
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-[100]",
          "transition-opacity duration-300 ease-in-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={closeCreateTaskModal}
      />

      {/* Slide Panel with Swipe-to-Close */}
      <motion.div
        {...swipeHandlers}
        className={cn(
          "fixed top-0 right-0 h-full w-full",
          // Desktop: slide panel with max-width and rounded corners
          "md:max-w-3xl md:rounded-l-xl",
          // Mobile: full-screen (no rounded corners, no max-width)
          "max-md:max-w-none max-md:rounded-none",
          "bg-background/90 backdrop-blur-sm shadow-2xl z-[101]",
          "flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <header
          className={cn(
            "flex items-center justify-between p-4",
            "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700",
            "md:rounded-tl-xl",
            "max-md:rounded-none",
            "flex-shrink-0"
          )}
        >
          <div className="flex items-center gap-2">
            {/* Mobile: Back button */}
            {isMobile && (
              <button
                onClick={closeCreateTaskModal}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              สร้างงานใหม่
            </h2>
          </div>

          {/* Desktop: Close Button (X) */}
          {!isMobile && (
            <button
              onClick={closeCreateTaskModal}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          {/* Parent Task Info (when creating subtask) */}
          {parentTask && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
              <CornerDownRight className="h-4 w-4" />
              <span>เป็นงานย่อยของ:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {parentTask.name}
              </span>
            </div>
          )}

          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-8">
            {/* Project Selector - Mobile Only (ก่อน Task Name) */}
            <div className="md:hidden">
              <Label className="block mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  โปรเจกต์ <span className="text-red-500">*</span>
                </span>
              </Label>
              <Controller
                name="projectId"
                control={control}
                rules={{ required: "กรุณาเลือกโปรเจกต์" }}
                render={({ field }) => (
                  <ProjectPopover
                    projects={availableProjects}
                    value={field.value}
                    onChange={(projectId) => {
                      field.onChange(projectId);
                      const proj = availableProjects.find(
                        (p) => p.id === projectId
                      );
                      setSelectedProject(proj || null);
                    }}
                    disabled={
                      !!createTaskModal.projectId ||
                      isLoadingProjectData ||
                      isLoadingProjects
                    }
                    placeholder={
                      isLoadingProjects
                        ? "กำลังโหลดโปรเจกต์..."
                        : "เลือกโปรเจกต์"
                    }
                    required
                  />
                )}
              />
              {errors.projectId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.projectId.message}
                </p>
              )}
            </div>

            {/* Task Name (required) */}
            <div>
              <Label htmlFor="task-name">
                ชื่องาน <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-name"
                {...register("name", { required: "กรุณากรอกชื่องาน" })}
                placeholder="ชื่องานของคุณ..."
                className={cn(
                  "h-[46px] text-base font-normal mt-1 bg-white dark:bg-slate-800",
                  errors.name && "border-red-500"
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Status Slider (full width) */}
            <Controller
              name="statusId"
              control={control}
              render={({ field }) => (
                <StatusSlider
                  statuses={projectStatuses}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isLoadingProjectData}
                />
              )}
            />

            {/* Grid: Assignee, Priority, Difficulty, Dates, Project */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Assignee Selector */}
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    ผู้รับผิดชอบ
                  </span>
                </Label>
                <Controller
                  name="assigneeUserIds"
                  control={control}
                  render={({ field }) => (
                    <AssigneePopover
                      users={projectUsers}
                      selectedUserIds={field.value}
                      onSave={(newIds) => field.onChange(newIds)}
                      disabled={isLoadingProjectData}
                      size="lg"
                    />
                  )}
                />
              </div>

              {/* Priority Selector */}
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    ความเร่งด่วน
                  </span>
                </Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <PriorityPopover
                      value={(field.value || '3') as PriorityValue}
                      onChange={(newValue) => field.onChange(newValue)}
                    />
                  )}
                />
              </div>

              {/* Difficulty Selector */}
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    ระดับความยาก
                  </span>
                </Label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <DifficultyPopover
                      value={(field.value || '3') as DifficultyValue}
                      onChange={(newValue) => field.onChange(newValue)}
                    />
                  )}
                />
              </div>

              {/* Start Date Picker */}
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    วันเริ่มงาน
                  </span>
                </Label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value}
                      onChange={(newDate) => field.onChange(newDate)}
                      placeholder="เลือกวันที่"
                    />
                  )}
                />
              </div>

              {/* Due Date Picker */}
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    วันสิ้นสุด
                  </span>
                </Label>
                <Controller
                  name="dueDate"
                  control={control}
                  render={({ field }) => (
                    <DateInput
                      value={field.value}
                      onChange={(newDate) => field.onChange(newDate)}
                      placeholder="เลือกวันที่"
                    />
                  )}
                />
              </div>

              {/* Project Selector - Desktop Only (ใน Grid) */}
              <div className="max-md:hidden">
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    โปรเจกต์ <span className="text-red-500">*</span>
                  </span>
                </Label>
                <Controller
                  name="projectId"
                  control={control}
                  rules={{ required: "กรุณาเลือกโปรเจกต์" }}
                  render={({ field }) => (
                    <ProjectPopover
                      projects={availableProjects}
                      value={field.value}
                      onChange={(projectId) => {
                        field.onChange(projectId);
                        const proj = availableProjects.find(
                          (p) => p.id === projectId
                        );
                        setSelectedProject(proj || null);
                      }}
                      disabled={
                        !!createTaskModal.projectId ||
                        isLoadingProjectData ||
                        isLoadingProjects
                      }
                      placeholder={
                        isLoadingProjects
                          ? "กำลังโหลดโปรเจกต์..."
                          : "เลือกโปรเจกต์"
                      }
                      required
                    />
                  )}
                />
                {errors.projectId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.projectId.message}
                  </p>
                )}
              </div>
            </div>

            {/* Parent Task Selector (unless creating subtask) - FULL WIDTH */}
            {!createTaskModal.parentTaskId && projectTasks.length > 0 && (
              <div>
                <Label className="block mb-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    งานหลัก (ถ้ามี)
                  </span>
                </Label>
                <Controller
                  name="parentTaskId"
                  control={control}
                  render={({ field }) => (
                    <ParentTaskPopover
                      tasks={projectTasks}
                      value={field.value}
                      onChange={(taskId) => field.onChange(taskId)}
                      placeholder="ไม่มี (งานหลัก)"
                    />
                  )}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="เพิ่มรายละเอียดเกี่ยวกับงานนี้..."
                rows={4}
                className="mt-1 bg-white dark:bg-slate-800"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer
          className={cn(
            "flex justify-end gap-3 p-4",
            "bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700",
            "md:rounded-bl-xl",
            "max-md:rounded-none",
            "flex-shrink-0"
          )}
        >
          <Button
            onClick={handleFormSubmit(onSubmit)}
            disabled={createTask.isPending || isLoadingProjectData}
            className="flex items-center justify-center px-6 py-2.5 text-sm md:text-base font-semibold rounded-lg shadow-md h-10 md:h-[46px] w-full md:w-auto md:min-w-[150px]"
          >
            {createTask.isPending && (
              <Loader2 className="mr-2 h-4 md:h-5 w-4 md:w-5 animate-spin" />
            )}
            สร้างงาน
          </Button>
        </footer>
      </motion.div>
    </>
  );
}
