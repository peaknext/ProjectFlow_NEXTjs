/**
 * UI Store - UI state management
 * Manages loading states, modals, and UI interactions
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export type CloseTaskType = 'completing' | 'aborting';

interface ModalState {
  createTask: {
    isOpen: boolean;
    projectId?: string;
    projectName?: string;
    departmentId?: string; // For filtering projects by department in modal
    availableProjects?: Array<{ id: string; name: string; status?: string }>; // Pre-filtered projects
    defaultStatusId?: string;
    parentTaskId?: string; // For creating subtasks
    defaultStartDate?: string;
    defaultDueDate?: string;
  };
  editTask: {
    isOpen: boolean;
    taskId?: string;
  };
  createProject: {
    isOpen: boolean;
  };
  editProject: {
    isOpen: boolean;
    projectId?: string;
  };
  createUser: {
    isOpen: boolean;
  };
  editUser: {
    isOpen: boolean;
    data?: any; // User data to edit
  };
  taskPanel: {
    isOpen: boolean;
    taskId?: string;
  };
}

interface UIState {
  // Loading states
  closingTasks: Set<string>;
  closingTypes: Map<string, CloseTaskType>;
  creatingTask: boolean;
  updatingTask: Set<string>;

  // Modals
  modals: ModalState;

  // Pinned tasks (per user)
  pinnedTaskIds: string[];

  // Getters (convenience)
  createTaskModal: ModalState['createTask'];

  // Actions - Loading states
  setTaskClosing: (taskId: string, type: CloseTaskType) => void;
  setTaskClosingComplete: (taskId: string) => void;
  setCreatingTask: (isCreating: boolean) => void;
  setTaskUpdating: (taskId: string, isUpdating: boolean) => void;

  // Actions - Modals
  openCreateTaskModal: (options?: {
    projectId?: string;
    projectName?: string;
    departmentId?: string; // For filtering projects by department
    availableProjects?: Array<{ id: string; name: string; status?: string }>; // Pre-filtered projects
    parentTaskId?: string;
    defaultStatusId?: string;
    defaultStartDate?: string;
    defaultDueDate?: string;
  }) => void;
  closeCreateTaskModal: () => void;
  openEditTaskModal: (taskId: string) => void;
  closeEditTaskModal: () => void;
  openCreateProjectModal: () => void;
  closeCreateProjectModal: () => void;
  openEditProjectModal: (projectId: string) => void;
  closeEditProjectModal: () => void;
  openCreateUserModal: () => void;
  closeCreateUserModal: () => void;
  openEditUserModal: (userData: any) => void;
  closeEditUserModal: () => void;
  openTaskPanel: (taskId: string) => void;
  closeTaskPanel: () => void;
  closeAllModals: () => void;

  // Actions - Pinned tasks
  setPinnedTasks: (taskIds: string[]) => void;
  togglePinTask: (taskId: string) => void;

  // Actions - Reset
  reset: () => void;
}

const initialModalState: ModalState = {
  createTask: { isOpen: false },
  editTask: { isOpen: false },
  createProject: { isOpen: false },
  editProject: { isOpen: false },
  createUser: { isOpen: false },
  editUser: { isOpen: false },
  taskPanel: { isOpen: false },
};

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      closingTasks: new Set(),
      closingTypes: new Map(),
      creatingTask: false,
      updatingTask: new Set(),
      modals: initialModalState,
      pinnedTaskIds: [],

      // Getters
      get createTaskModal() {
        return get().modals.createTask;
      },

      // Loading state actions
      setTaskClosing: (taskId, type) =>
        set((state) => ({
          closingTasks: new Set(state.closingTasks).add(taskId),
          closingTypes: new Map(state.closingTypes).set(taskId, type),
        })),

      setTaskClosingComplete: (taskId) =>
        set((state) => {
          const newClosing = new Set(state.closingTasks);
          const newTypes = new Map(state.closingTypes);
          newClosing.delete(taskId);
          newTypes.delete(taskId);
          return {
            closingTasks: newClosing,
            closingTypes: newTypes,
          };
        }),

      setCreatingTask: (isCreating) => set({ creatingTask: isCreating }),

      setTaskUpdating: (taskId, isUpdating) =>
        set((state) => {
          const newUpdating = new Set(state.updatingTask);
          if (isUpdating) {
            newUpdating.add(taskId);
          } else {
            newUpdating.delete(taskId);
          }
          return { updatingTask: newUpdating };
        }),

      // Modal actions
      openCreateTaskModal: (options = {}) =>
        set((state) => ({
          modals: {
            ...state.modals,
            createTask: {
              isOpen: true,
              projectId: options.projectId,
              projectName: options.projectName,
              departmentId: options.departmentId, // Store departmentId for filtering
              availableProjects: options.availableProjects, // Store pre-filtered projects
              defaultStatusId: options.defaultStatusId,
              parentTaskId: options.parentTaskId,
              defaultStartDate: options.defaultStartDate,
              defaultDueDate: options.defaultDueDate,
            },
          },
        })),

      closeCreateTaskModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            createTask: { isOpen: false },
          },
        })),

      openEditTaskModal: (taskId) =>
        set((state) => ({
          modals: {
            ...state.modals,
            editTask: { isOpen: true, taskId },
          },
        })),

      closeEditTaskModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            editTask: { isOpen: false },
          },
        })),

      openCreateProjectModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            createProject: { isOpen: true },
          },
        })),

      closeCreateProjectModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            createProject: { isOpen: false },
          },
        })),

      openEditProjectModal: (projectId) =>
        set((state) => ({
          modals: {
            ...state.modals,
            editProject: { isOpen: true, projectId },
          },
        })),

      closeEditProjectModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            editProject: { isOpen: false },
          },
        })),

      openCreateUserModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            createUser: { isOpen: true },
          },
        })),

      closeCreateUserModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            createUser: { isOpen: false },
          },
        })),

      openEditUserModal: (userData) =>
        set((state) => ({
          modals: {
            ...state.modals,
            editUser: { isOpen: true, data: userData },
          },
        })),

      closeEditUserModal: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            editUser: { isOpen: false },
          },
        })),

      openTaskPanel: (taskId) =>
        set((state) => ({
          modals: {
            ...state.modals,
            taskPanel: { isOpen: true, taskId },
          },
        })),

      closeTaskPanel: () =>
        set((state) => ({
          modals: {
            ...state.modals,
            taskPanel: { isOpen: false },
          },
        })),

      closeAllModals: () => set({ modals: initialModalState }),

      // Pinned tasks actions
      setPinnedTasks: (taskIds) => set({ pinnedTaskIds: taskIds }),

      togglePinTask: (taskId) =>
        set((state) => {
          const newPinned = state.pinnedTaskIds.includes(taskId)
            ? state.pinnedTaskIds.filter((id) => id !== taskId)
            : [...state.pinnedTaskIds, taskId];
          return { pinnedTaskIds: newPinned };
        }),

      // Reset
      reset: () =>
        set({
          closingTasks: new Set(),
          closingTypes: new Map(),
          creatingTask: false,
          updatingTask: new Set(),
          modals: initialModalState,
          pinnedTaskIds: [],
        }),
    }),
    {
      name: 'UIStore',
    }
  )
);
