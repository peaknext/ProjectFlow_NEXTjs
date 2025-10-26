/**
 * Project types for project management page
 */

export interface ProjectWithDetails {
  id: string;
  name: string;
  description: string | null;
  departmentId: string;
  ownerUserId: string;
  status: string;
  progress?: number; // 0-100 percentage, calculated from tasks
  createdAt: string;
  updatedAt: string;

  // Relations
  owner: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  department: {
    id: string;
    name: string;
    divisionId: string;
    division: {
      id: string;
      name: string;
      missionGroupId: string;
      missionGroup: {
        id: string;
        name: string;
      };
    };
  };

  // Aggregated data
  _count: {
    tasks: number;
  };
  tasks: Array<{
    id: string;
    isClosed: boolean;
    statusId: string;
    status: {
      type: string; // "NOT_STARTED" | "IN_PROGRESS" | "DONE"
    };
  }>;
  statuses: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  phases: Array<{
    id: string;
    name: string;
    phaseOrder: number;
    startDate: string | null;
    endDate: string | null;
  }>;
}

export interface ProjectFilters {
  missionGroupId: string | null;
  divisionId: string | null;
  departmentId: string | null;
  searchQuery: string;
}

export interface CurrentPhase {
  name: string;
  order: number;
  status: "upcoming" | "active" | "completed";
}
