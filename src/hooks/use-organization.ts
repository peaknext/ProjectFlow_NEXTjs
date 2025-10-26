/**
 * useOrganization - Hooks for fetching organizational data (HospMissions, ActionPlans)
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Query keys
export const organizationKeys = {
  all: ['organization'] as const,
  hospMissions: () => [...organizationKeys.all, 'hosp-missions'] as const,
  actionPlans: () => [...organizationKeys.all, 'action-plans'] as const,
  actionPlansByMission: (hospMissionId: string) => [
    ...organizationKeys.actionPlans(),
    'by-mission',
    hospMissionId,
  ] as const,
  missionGroups: () => [...organizationKeys.all, 'mission-groups'] as const,
  divisions: (missionGroupId?: string) =>
    missionGroupId
      ? [...organizationKeys.all, 'divisions', missionGroupId] as const
      : [...organizationKeys.all, 'divisions'] as const,
  departments: (divisionId?: string) =>
    divisionId
      ? [...organizationKeys.all, 'departments', divisionId] as const
      : [...organizationKeys.all, 'departments'] as const,
};

// Types
export interface HospMission {
  id: string;
  name: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface ActionPlan {
  id: string;
  name: string;
  hospMissionId: string;
}

export interface MissionGroup {
  id: string;
  name: string;
  description?: string;
}

export interface Division {
  id: string;
  name: string;
  missionGroupId: string;
  missionGroup?: {
    id: string;
    name: string;
  };
}

export interface Department {
  id: string;
  name: string;
  divisionId: string;
  division?: {
    id: string;
    name: string;
    missionGroupId: string;
  };
}

// Hooks
export function useHospMissions() {
  return useQuery({
    queryKey: organizationKeys.hospMissions(),
    queryFn: async () => {
      const response = await api.get<{ hospMissions: HospMission[] }>(
        '/api/organization/hosp-missions'
      );
      return response.hospMissions;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useActionPlans(hospMissionId?: string) {
  return useQuery({
    queryKey: hospMissionId
      ? organizationKeys.actionPlansByMission(hospMissionId)
      : organizationKeys.actionPlans(),
    queryFn: async () => {
      const url = hospMissionId
        ? `/api/organization/action-plans?missionId=${hospMissionId}`
        : '/api/organization/action-plans';

      const response = await api.get<{ plans: any[]; total: number }>(url);

      // Map to simpler format
      return response.plans.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        hospMissionId: plan.hospMissionId || '',
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: hospMissionId !== undefined || hospMissionId === undefined, // Always enabled
  });
}

export function useMissionGroups() {
  return useQuery({
    queryKey: organizationKeys.missionGroups(),
    queryFn: async () => {
      const response = await api.get<{ missionGroups: MissionGroup[] }>(
        '/api/organization/mission-groups'
      );
      return response.missionGroups;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (rarely changes)
  });
}

export function useDivisions(missionGroupId?: string) {
  return useQuery({
    queryKey: organizationKeys.divisions(missionGroupId),
    queryFn: async () => {
      const url = missionGroupId
        ? `/api/organization/divisions?missionGroupId=${missionGroupId}`
        : '/api/organization/divisions';

      const response = await api.get<{ divisions: Division[] }>(url);
      return response.divisions;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always fetch (will filter on client side if needed)
  });
}

export function useDepartments(divisionId?: string) {
  return useQuery({
    queryKey: organizationKeys.departments(divisionId),
    queryFn: async () => {
      const url = divisionId
        ? `/api/organization/departments?divisionId=${divisionId}`
        : '/api/organization/departments';

      const response = await api.get<{ departments: Department[] }>(url);
      return response.departments;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Always fetch
  });
}
