/**
 * Navigation Store
 * Manages navigation state for multi-level workspace hierarchy
 *
 * Tracks current level: Mission Group → Division → Department → Project
 * Preserves parent hierarchy when navigating deeper
 *
 * Pattern: Similar to GAS appState.navigation
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NavigationLevel = 'missionGroup' | 'division' | 'department' | 'project';

interface NavigationState {
  // Current navigation level
  currentLevel: NavigationLevel | null;

  // Mission Group level
  missionGroupId: string | null;
  missionGroupName: string | null;

  // Division level
  divisionId: string | null;
  divisionName: string | null;

  // Department level
  departmentId: string | null;
  departmentName: string | null;

  // Project level
  projectId: string | null;
  projectName: string | null;

  // Actions
  setMissionGroup: (id: string, name: string) => void;
  setDivision: (id: string, name: string, missionGroupId?: string, missionGroupName?: string) => void;
  setDepartment: (
    id: string,
    name: string,
    divisionId?: string,
    divisionName?: string,
    missionGroupId?: string,
    missionGroupName?: string
  ) => void;
  setProject: (
    id: string,
    name: string,
    departmentId?: string,
    departmentName?: string,
    divisionId?: string,
    divisionName?: string,
    missionGroupId?: string,
    missionGroupName?: string
  ) => void;
  navigateToLevel: (level: NavigationLevel, id: string, name: string, context?: Partial<NavigationState>) => void;
  clearNavigation: () => void;
  reset: () => void;
}

const initialState = {
  currentLevel: null,
  missionGroupId: null,
  missionGroupName: null,
  divisionId: null,
  divisionName: null,
  departmentId: null,
  departmentName: null,
  projectId: null,
  projectName: null,
};

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set) => ({
      ...initialState,

      /**
       * Navigate to Mission Group level
       * Clears all child levels (Division, Department, Project)
       */
      setMissionGroup: (id, name) => {
        set({
          currentLevel: 'missionGroup',
          missionGroupId: id,
          missionGroupName: name,
          divisionId: null,
          divisionName: null,
          departmentId: null,
          departmentName: null,
          projectId: null,
          projectName: null,
        }, false, 'setMissionGroup');
      },

      /**
       * Navigate to Division level
       * Preserves Mission Group if provided, clears Department and Project
       */
      setDivision: (id, name, missionGroupId, missionGroupName) => {
        set((state) => ({
          currentLevel: 'division',
          missionGroupId: missionGroupId ?? state.missionGroupId,
          missionGroupName: missionGroupName ?? state.missionGroupName,
          divisionId: id,
          divisionName: name,
          departmentId: null,
          departmentName: null,
          projectId: null,
          projectName: null,
        }), false, 'setDivision');
      },

      /**
       * Navigate to Department level
       * Preserves parent hierarchy if provided, clears Project
       */
      setDepartment: (id, name, divisionId, divisionName, missionGroupId, missionGroupName) => {
        set((state) => ({
          currentLevel: 'department',
          missionGroupId: missionGroupId ?? state.missionGroupId,
          missionGroupName: missionGroupName ?? state.missionGroupName,
          divisionId: divisionId ?? state.divisionId,
          divisionName: divisionName ?? state.divisionName,
          departmentId: id,
          departmentName: name,
          projectId: null,
          projectName: null,
        }), false, 'setDepartment');
      },

      /**
       * Navigate to Project level
       * Preserves entire parent hierarchy if provided
       */
      setProject: (
        id,
        name,
        departmentId,
        departmentName,
        divisionId,
        divisionName,
        missionGroupId,
        missionGroupName
      ) => {
        set((state) => ({
          currentLevel: 'project',
          missionGroupId: missionGroupId ?? state.missionGroupId,
          missionGroupName: missionGroupName ?? state.missionGroupName,
          divisionId: divisionId ?? state.divisionId,
          divisionName: divisionName ?? state.divisionName,
          departmentId: departmentId ?? state.departmentId,
          departmentName: departmentName ?? state.departmentName,
          projectId: id,
          projectName: name,
        }), false, 'setProject');
      },

      /**
       * Generic navigation function
       * Automatically handles level-specific logic
       */
      navigateToLevel: (level, id, name, context = {}) => {
        set((state) => {
          const newState: Partial<NavigationState> = {
            currentLevel: level,
          };

          switch (level) {
            case 'missionGroup':
              return {
                ...initialState,
                currentLevel: 'missionGroup',
                missionGroupId: id,
                missionGroupName: name,
              };

            case 'division':
              return {
                currentLevel: 'division',
                missionGroupId: context.missionGroupId ?? state.missionGroupId,
                missionGroupName: context.missionGroupName ?? state.missionGroupName,
                divisionId: id,
                divisionName: name,
                departmentId: null,
                departmentName: null,
                projectId: null,
                projectName: null,
              };

            case 'department':
              return {
                currentLevel: 'department',
                missionGroupId: context.missionGroupId ?? state.missionGroupId,
                missionGroupName: context.missionGroupName ?? state.missionGroupName,
                divisionId: context.divisionId ?? state.divisionId,
                divisionName: context.divisionName ?? state.divisionName,
                departmentId: id,
                departmentName: name,
                projectId: null,
                projectName: null,
              };

            case 'project':
              return {
                currentLevel: 'project',
                missionGroupId: context.missionGroupId ?? state.missionGroupId,
                missionGroupName: context.missionGroupName ?? state.missionGroupName,
                divisionId: context.divisionId ?? state.divisionId,
                divisionName: context.divisionName ?? state.divisionName,
                departmentId: context.departmentId ?? state.departmentId,
                departmentName: context.departmentName ?? state.departmentName,
                projectId: id,
                projectName: name,
              };

            default:
              return state;
          }
        }, false, 'navigateToLevel');
      },

      /**
       * Clear navigation back to initial state
       */
      clearNavigation: () => {
        set(initialState, false, 'clearNavigation');
      },

      /**
       * Alias for clearNavigation
       */
      reset: () => {
        set(initialState, false, 'reset');
      },
    }),
    { name: 'NavigationStore' }
  )
);

/**
 * Helper hook to get breadcrumb path as array
 * Returns ordered path from Mission Group to current level
 */
export function useBreadcrumbPath() {
  const navigation = useNavigationStore();
  const path: Array<{ level: NavigationLevel; id: string; name: string }> = [];

  if (navigation.missionGroupId && navigation.missionGroupName) {
    path.push({
      level: 'missionGroup',
      id: navigation.missionGroupId,
      name: navigation.missionGroupName,
    });
  }

  if (navigation.divisionId && navigation.divisionName) {
    path.push({
      level: 'division',
      id: navigation.divisionId,
      name: navigation.divisionName,
    });
  }

  if (navigation.departmentId && navigation.departmentName) {
    path.push({
      level: 'department',
      id: navigation.departmentId,
      name: navigation.departmentName,
    });
  }

  if (navigation.projectId && navigation.projectName) {
    path.push({
      level: 'project',
      id: navigation.projectId,
      name: navigation.projectName,
    });
  }

  return { path, currentLevel: navigation.currentLevel };
}
