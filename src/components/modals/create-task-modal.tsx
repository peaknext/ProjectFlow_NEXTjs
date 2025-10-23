/**
 * CreateTaskModal - Task creation slide panel
 * Matches GAS CreateTaskModal design with existing components
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { CornerDownRight, Loader2, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusSlider } from '@/components/ui/status-slider';
import { AssigneePopover } from '@/components/ui/assignee-popover';
import { PriorityPopover, PriorityValue } from '@/components/ui/priority-popover';
import { DifficultyPopover, DifficultyValue } from '@/components/ui/difficulty-popover';
import { DateInput } from '@/components/ui/date-picker-popover';
import { ProjectPopover } from '@/components/ui/project-popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIStore } from '@/stores/use-ui-store';
import { useCreateTask } from '@/hooks/use-tasks';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface User {
  id: string;
  fullName: string;
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
  const closeCreateTaskModal = useUIStore((state) => state.closeCreateTaskModal);
  const createTask = useCreateTask();

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
    formState: { errors }
  } = useForm<TaskFormData>({
    defaultValues: {
      name: '',
      description: '',
      statusId: '',
      priority: '3',
      difficulty: '2',
      startDate: null,
      dueDate: null,
      assigneeUserIds: [],
      projectId: ''
    }
  });

  const watchProjectId = watch('projectId');

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

  // Load project data when project is selected
  useEffect(() => {
    if (watchProjectId) {
      loadProjectData(watchProjectId);
    }
  }, [watchProjectId]);

  async function loadInitialData() {
    // Reset form first (but keep default values)
    reset({
      name: '',
      description: '',
      statusId: '',
      priority: '3',
      difficulty: '2',
      startDate: createTaskModal.defaultStartDate || null,
      dueDate: createTaskModal.defaultDueDate || null,
      assigneeUserIds: [],
      projectId: createTaskModal.projectId || '' // Keep projectId if provided
    });

    // Load available projects for selector
    let projects: Project[] = [];
    try {
      const cachedWorkspace = queryClient.getQueryData(['workspace']) as any;
      if (cachedWorkspace?.workspace) {
        projects = extractProjectsFromWorkspace(cachedWorkspace.workspace);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }

    // If opened from project view with projectId
    if (createTaskModal.projectId && createTaskModal.projectName) {
      const project = {
        id: createTaskModal.projectId,
        name: createTaskModal.projectName,
      };
      setSelectedProject(project);

      // Make sure current project is in availableProjects
      if (!projects.find(p => p.id === createTaskModal.projectId)) {
        projects = [project, ...projects];
      }

      // Load project data immediately (don't wait for useEffect)
      await loadProjectData(createTaskModal.projectId);
    } else {
      setSelectedProject(null);
      // Clear project data
      setProjectUsers([]);
      setProjectStatuses([]);
      setProjectTasks([]);
    }

    setAvailableProjects(projects);
  }

  function extractProjectsFromWorkspace(workspace: any): Project[] {
    const projects: Project[] = [];

    if (workspace.viewType === 'hierarchical' && workspace.hierarchical) {
      workspace.hierarchical.forEach((mg: any) => {
        mg.divisions?.forEach((div: any) => {
          div.departments?.forEach((dept: any) => {
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
    } else if (workspace.viewType === 'flat' && workspace.flat) {
      workspace.flat.forEach((item: any) => {
        if (item.type === 'project') {
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
      const cachedData = queryClient.getQueryData(['project-board', projectId]) as any;

      if (cachedData) {
        setProjectUsers(cachedData.users || []);
        setProjectStatuses(cachedData.statuses || []);
        setProjectTasks(
          cachedData.tasks?.filter((t: any) => !t.parentTaskId) || []
        );

        // Set default status
        if (cachedData.statuses && cachedData.statuses.length > 0) {
          setValue('statusId', cachedData.statuses[0].id);
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
          setValue('statusId', response.statuses[0].id);
        }
      }

      // Reset assignees when project changes
      setValue('assigneeUserIds', []);
    } catch (error) {
      console.error('Failed to load project data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลโปรเจคได้');
    } finally {
      setIsLoadingProjectData(false);
    }
  }

  function resetForm() {
    // Clear all form state
    reset({
      name: '',
      description: '',
      statusId: '',
      priority: '3',
      difficulty: '2',
      startDate: null,
      dueDate: null,
      assigneeUserIds: [],
      projectId: ''
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
      toast.error('กรุณาเลือกโปรเจค');
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
        toast.success('สร้างงานสำเร็จ');
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
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
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

      {/* Slide Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-3xl",
          "bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm",
          "rounded-l-xl shadow-2xl z-[101]",
          "flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            สร้างงานใหม่
          </h2>
          <button
            onClick={closeCreateTaskModal}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
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
            {/* Task Name (required) */}
            <div>
              <Label htmlFor="task-name">
                ชื่องาน <span className="text-red-500">*</span>
              </Label>
              <Input
                id="task-name"
                {...register('name', { required: 'กรุณากรอกชื่องาน' })}
                placeholder="ชื่องานของคุณ..."
                className={cn(
                  'h-[46px] text-base font-normal mt-1 bg-white dark:bg-slate-800',
                  errors.name && 'border-red-500'
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Status Slider */}
            <div className="my-8">
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
            </div>

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
                      value={field.value as PriorityValue}
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
                      value={field.value as DifficultyValue}
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

              {/* Project Selector */}
              <div>
                <Label>
                  โปรเจค <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="projectId"
                  control={control}
                  rules={{ required: 'กรุณาเลือกโปรเจค' }}
                  render={({ field }) => (
                    <ProjectPopover
                      projects={availableProjects}
                      value={field.value}
                      onChange={(projectId) => {
                        field.onChange(projectId);
                        const proj = availableProjects.find(p => p.id === projectId);
                        setSelectedProject(proj || null);
                      }}
                      disabled={!!createTaskModal.projectId || isLoadingProjectData}
                      placeholder="เลือกโปรเจค"
                      required
                    />
                  )}
                />
                {errors.projectId && (
                  <p className="text-red-500 text-xs mt-1">{errors.projectId.message}</p>
                )}
              </div>
            </div>

            {/* Parent Task Selector (unless creating subtask) */}
            {!createTaskModal.parentTaskId && projectTasks.length > 0 && (
              <div>
                <Label htmlFor="parent-task">งานหลัก (Parent Task)</Label>
                <Controller
                  name="parentTaskId"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="parent-task" className="mt-1">
                        <SelectValue placeholder="เลือกงานหลัก (ถ้ามี)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {projectTasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="เพิ่มรายละเอียดเกี่ยวกับงานนี้..."
                rows={4}
                className="mt-1 bg-white dark:bg-slate-800"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="flex justify-end gap-3 p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Button
            variant="outline"
            onClick={closeCreateTaskModal}
            disabled={createTask.isPending}
            className="min-w-[100px]"
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleFormSubmit(onSubmit)}
            disabled={createTask.isPending || isLoadingProjectData}
            className="min-w-[150px]"
          >
            {createTask.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            สร้างงาน
          </Button>
        </footer>
      </div>
    </>
  );
}
