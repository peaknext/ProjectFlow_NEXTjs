import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSyncMutation } from "@/lib/use-sync-mutation";
import type { ServiceRequestType, RequestStatus } from "@/generated/prisma";

/**
 * React Query hooks for Service Requests
 */

// Query keys
export const serviceRequestKeys = {
  all: ["service-requests"] as const,
  lists: () => [...serviceRequestKeys.all, "list"] as const,
  list: (filters: ServiceRequestFilters) =>
    [...serviceRequestKeys.lists(), filters] as const,
  details: () => [...serviceRequestKeys.all, "detail"] as const,
  detail: (id: string) => [...serviceRequestKeys.details(), id] as const,
  timeline: (id: string) =>
    [...serviceRequestKeys.detail(id), "timeline"] as const,
  comments: (id: string) =>
    [...serviceRequestKeys.detail(id), "comments"] as const,
  queue: (id: string) => [...serviceRequestKeys.detail(id), "queue"] as const,
};

// Types
export interface ServiceRequestFilters {
  type?: ServiceRequestType;
  status?: RequestStatus;
  fiscalYears?: number[];
  search?: string;
  myRequests?: boolean;
}

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  type: ServiceRequestType;
  fiscalYear: number;
  requesterId: string;
  requesterName: string;
  requesterJobTitle?: string | null;
  requesterDivision?: string | null;
  requesterPhone?: string | null;
  requesterEmail: string;
  subject: string;
  description: string;
  purpose?: string | null;
  purposeOther?: string | null;
  deadline?: number | null;
  issueTime?: string | null;
  approverId?: string | null;
  approverName?: string | null;
  approverJobTitle?: string | null;
  approvedAt?: string | null;
  status: RequestStatus;
  documentHtml: string;
  taskId?: string | null;
  lastKnownQueuePosition?: number | null;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    fullName: string;
    profileImageUrl?: string | null;
  };
  approver?: {
    id: string;
    fullName: string;
    profileImageUrl?: string | null;
  } | null;
  task?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateServiceRequestData {
  type: ServiceRequestType;
  subject: string;
  description: string;
  purpose?: string;
  purposeOther?: string;
  deadline?: number;
  issueTime?: string;
}

// Hooks

/**
 * Fetch list of service requests with filters
 */
export function useServiceRequests(filters: ServiceRequestFilters = {}) {
  return useQuery({
    queryKey: serviceRequestKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string> = {};

      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.fiscalYears && filters.fiscalYears.length > 0) {
        params.fiscalYears = filters.fiscalYears.join(",");
      }
      if (filters.search) params.search = filters.search;
      if (filters.myRequests) params.myRequests = "true";

      const data = await api.get<{ requests: ServiceRequest[] }>(
        "/api/service-requests",
        { params }
      );

      return data.requests;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch single service request detail
 */
export function useServiceRequest(id: string) {
  return useQuery({
    queryKey: serviceRequestKeys.detail(id),
    queryFn: async () => {
      const data = await api.get<{ serviceRequest: ServiceRequest }>(
        `/api/service-requests/${id}`
      );
      return data.serviceRequest;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create new service request
 */
export function useCreateServiceRequest() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: CreateServiceRequestData) => {
      return await api.post<{ serviceRequest: ServiceRequest }>(
        "/api/service-requests",
        data
      );
    },
    onSuccess: () => {
      // Invalidate all lists
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.lists(),
      });
    },
  });
}

/**
 * Update service request (requester can update pending requests)
 */
export function useUpdateServiceRequest(id: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: Partial<CreateServiceRequestData>) => {
      return await api.patch<{ serviceRequest: ServiceRequest }>(
        `/api/service-requests/${id}`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.lists(),
      });
    },
  });
}

/**
 * Delete service request (requester can delete pending requests)
 */
export function useDeleteServiceRequest() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/api/service-requests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.lists(),
      });
    },
  });
}

/**
 * Approve service request (with project selection)
 */
export function useApproveServiceRequest(id: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: {
      projectId: string;
      assigneeUserIds?: string[];
      comment?: string;
    }) => {
      return await api.post<{
        serviceRequest: ServiceRequest;
        task: { id: string; name: string };
      }>(`/api/service-requests/${id}/approve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.lists(),
      });
    },
  });
}

/**
 * Reject service request
 */
export function useRejectServiceRequest(id: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: { reason: string }) => {
      return await api.post<{ serviceRequest: ServiceRequest }>(
        `/api/service-requests/${id}/reject`,
        data
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.lists(),
      });
    },
  });
}

/**
 * Fetch request timeline
 */
export function useRequestTimeline(id: string) {
  return useQuery({
    queryKey: serviceRequestKeys.timeline(id),
    queryFn: async () => {
      const data = await api.get<{
        timeline: Array<{
          id: string;
          action: string;
          description: string;
          userId?: string | null;
          userName?: string | null;
          createdAt: string;
        }>;
      }>(`/api/service-requests/${id}/timeline`);
      return data.timeline;
    },
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Fetch request comments
 */
export function useRequestComments(id: string) {
  return useQuery({
    queryKey: serviceRequestKeys.comments(id),
    queryFn: async () => {
      const data = await api.get<{
        comments: Array<{
          id: string;
          commentText: string;
          createdAt: string;
          commentor: {
            id: string;
            fullName: string;
            profileImageUrl?: string | null;
            jobTitle?: {
              jobTitleTh: string;
            } | null;
          };
        }>;
      }>(`/api/service-requests/${id}/comments`);
      return data.comments;
    },
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Add comment to request
 */
export function useAddRequestComment(id: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: { commentText: string }) => {
      return await api.post<{
        comment: {
          id: string;
          commentText: string;
          createdAt: string;
        };
      }>(`/api/service-requests/${id}/comments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.comments(id),
      });
      queryClient.invalidateQueries({
        queryKey: serviceRequestKeys.timeline(id),
      });
    },
  });
}

/**
 * Fetch queue position
 */
export function useRequestQueue(id: string, type: ServiceRequestType) {
  return useQuery({
    queryKey: serviceRequestKeys.queue(id),
    queryFn: async () => {
      const data = await api.get<{
        position: number;
        totalPending: number;
        estimatedWaitTime: number;
      }>(`/api/service-requests/${id}/queue`);
      return data;
    },
    enabled: !!id && !!type,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}
