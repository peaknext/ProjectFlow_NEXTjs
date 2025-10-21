/**
 * App Store - Global application state management
 * Manages user session, current project context, and filter states
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  profileImageUrl?: string | null;
  permissions: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  isArchived: boolean;
  departmentId: string | null;
  divisionId: string | null;
  missionGroupId: string | null;
  dateCreated: string;
  dateModified: string;
}

export interface FilterState {
  assignees: string[];
  statuses: string[];
  priorities: number[];
  dueDate: string | null;
  searchQuery: string;
  showClosedTasks: boolean;
}

export interface ListSortState {
  column: string;
  direction: 'asc' | 'desc';
}

// Store state interface
interface AppState {
  // Session
  currentUser: User | null;
  sessionToken: string | null;

  // Current view context
  currentProjectId: string | null;
  currentProjectDetails: Project | null;

  // UI State
  filterState: FilterState;
  listSortState: ListSortState;
  currentView: 'board' | 'list' | 'calendar';

  // Actions - Session
  setCurrentUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  logout: () => void;

  // Actions - Project
  setCurrentProject: (projectId: string | null, details?: Project | null) => void;
  clearCurrentProject: () => void;

  // Actions - Filters
  setFilterState: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;

  // Actions - Sorting
  setListSortState: (sort: Partial<ListSortState>) => void;

  // Actions - View
  setCurrentView: (view: 'board' | 'list' | 'calendar') => void;

  // Actions - Reset
  reset: () => void;
}

// Initial filter state
const initialFilterState: FilterState = {
  assignees: [],
  statuses: [],
  priorities: [],
  dueDate: null,
  searchQuery: '',
  showClosedTasks: false,
};

// Initial sort state
const initialListSortState: ListSortState = {
  column: 'dateCreated',
  direction: 'desc',
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        sessionToken: null,
        currentProjectId: null,
        currentProjectDetails: null,
        filterState: initialFilterState,
        listSortState: initialListSortState,
        currentView: 'board',

        // Session actions
        setCurrentUser: (user) => set({ currentUser: user }),

        setSessionToken: (token) => {
          set({ sessionToken: token });
          if (typeof window !== 'undefined') {
            if (token) {
              localStorage.setItem('sessionToken', token);
            } else {
              localStorage.removeItem('sessionToken');
            }
          }
        },

        logout: () => {
          set({
            currentUser: null,
            sessionToken: null,
            currentProjectId: null,
            currentProjectDetails: null,
          });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('currentUser');
          }
        },

        // Project actions
        setCurrentProject: (projectId, details) =>
          set({
            currentProjectId: projectId,
            currentProjectDetails: details || null,
          }),

        clearCurrentProject: () =>
          set({
            currentProjectId: null,
            currentProjectDetails: null,
          }),

        // Filter actions
        setFilterState: (filters) =>
          set((state) => ({
            filterState: { ...state.filterState, ...filters },
          })),

        clearFilters: () => set({ filterState: initialFilterState }),

        // Sort actions
        setListSortState: (sort) =>
          set((state) => ({
            listSortState: { ...state.listSortState, ...sort },
          })),

        // View actions
        setCurrentView: (view) => set({ currentView: view }),

        // Reset all
        reset: () =>
          set({
            currentUser: null,
            sessionToken: null,
            currentProjectId: null,
            currentProjectDetails: null,
            filterState: initialFilterState,
            listSortState: initialListSortState,
            currentView: 'board',
          }),
      }),
      {
        name: 'projectflow-app-storage',
        // Only persist session data
        partialize: (state) => ({
          sessionToken: state.sessionToken,
          currentUser: state.currentUser,
        }),
      }
    ),
    {
      name: 'AppStore',
    }
  )
);
