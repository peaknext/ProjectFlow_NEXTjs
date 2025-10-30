/**
 * Workspace API Endpoint
 * Returns workspace structure based on user's role and permissions
 *
 * Permission Logic (supports additionalRoles):
 * - ADMIN: See entire hierarchy (all Mission Groups → Divisions → Departments → Projects)
 * - CHIEF: See entire Mission Group hierarchy (primary + additional roles)
 * - LEADER: See entire Division hierarchy (primary + additional roles)
 * - HEAD/MEMBER: See all projects in their Department (primary + additional roles)
 * - USER: See only projects they're involved in
 *
 * additionalRoles Support:
 * - Users can have multiple roles across different departments
 * - Each department is evaluated with its specific role level
 * - Scopes are aggregated from all roles (primary + additional)
 * - Example: Chief (MG A) + Member (MG B) → sees ALL of MG A + dept in MG B
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';
import type { AuthenticatedRequest } from '@/lib/api-middleware';
import { getUserAccessibleScope, type AccessibleScope } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  const userId = req.session.userId;

  try {
    // Get user with organization info + additionalRoles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        departmentId: true,
        additionalRoles: true, // ⭐ Now includes additionalRoles
        department: {
          select: {
            id: true,
            name: true,
            divisionId: true,
            division: {
              select: {
                id: true,
                name: true,
                missionGroupId: true,
                missionGroup: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse('NOT_FOUND', 'User not found', 404);
    }

    // Calculate accessible scope based on primary role + additionalRoles
    const scope = await getUserAccessibleScope(userId);

    // Determine workspace structure based on role and scope
    switch (user.role) {
      case 'ADMIN':
        return successResponse({
          workspace: await getAdminWorkspace(),
        });

      case 'CHIEF':
        return successResponse({
          workspace: await getChiefWorkspace(user, scope),
        });

      case 'LEADER':
        return successResponse({
          workspace: await getLeaderWorkspace(user, scope),
        });

      case 'HEAD':
      case 'MEMBER':
        return successResponse({
          workspace: await getDepartmentWorkspace(user, scope),
        });

      case 'USER':
      default:
        return successResponse({
          workspace: await getUserWorkspace(user, scope),
        });
    }
  } catch (error) {
    console.error('Workspace fetch error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch workspace',
      500,
      { error: String(error) }
    );
  }
}

/**
 * ADMIN: Full hierarchical view
 */
async function getAdminWorkspace() {
  const missionGroups = await prisma.missionGroup.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      divisions: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          departments: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              projects: {
                where: { dateDeleted: null },
                select: {
                  id: true,
                  name: true,
                  status: true,
                  departmentId: true,
                },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    viewType: 'hierarchical' as const,
    userRole: 'ADMIN' as const,
    hierarchical: missionGroups.map((mg) => ({
      id: mg.id,
      name: mg.name,
      divisions: mg.divisions.map((div) => ({
        id: div.id,
        name: div.name,
        missionGroupId: mg.id,
        departments: div.departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          divisionId: div.id,
          projects: dept.projects,
        })),
      })),
    })),
  };
}

/**
 * CHIEF: Hierarchical view of ALL accessible Mission Groups
 * Now supports additionalRoles - can see multiple MGs
 * Shows ALL divisions and departments in accessible mission groups
 */
async function getChiefWorkspace(user: any, scope: AccessibleScope) {
  if (!user.department) {
    return {
      viewType: 'hierarchical' as const,
      userRole: 'CHIEF' as const,
      hierarchical: [],
    };
  }

  // Query ALL accessible mission groups (supports multiple MGs via additionalRoles)
  const missionGroups = await prisma.missionGroup.findMany({
    where: {
      id: { in: scope.missionGroupIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      divisions: {
        where: {
          id: { in: scope.divisionIds },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          departments: {
            where: {
              // ⭐ CHIEF sees ALL departments in accessible divisions, not filtered by scope.departmentIds
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              projects: {
                where: { dateDeleted: null },
                select: {
                  id: true,
                  name: true,
                  status: true,
                  departmentId: true,
                },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    viewType: 'hierarchical' as const,
    userRole: 'CHIEF' as const,
    hierarchical: missionGroups.map((mg) => ({
      id: mg.id,
      name: mg.name,
      divisions: mg.divisions.map((div) => ({
        id: div.id,
        name: div.name,
        missionGroupId: mg.id,
        departments: div.departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          divisionId: div.id,
          projects: dept.projects,
        })),
      })),
    })),
  };
}

/**
 * LEADER: Hierarchical view of ALL accessible Divisions
 * Now supports additionalRoles - can see multiple divisions across multiple MGs
 * Shows ALL departments in accessible divisions (not just user's own department)
 */
async function getLeaderWorkspace(user: any, scope: AccessibleScope) {
  if (!user.department) {
    return {
      viewType: 'hierarchical' as const,
      userRole: 'LEADER' as const,
      hierarchical: [],
    };
  }

  // Query ALL accessible mission groups and divisions (supports multiple divisions via additionalRoles)
  const missionGroups = await prisma.missionGroup.findMany({
    where: {
      id: { in: scope.missionGroupIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      divisions: {
        where: {
          id: { in: scope.divisionIds },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          departments: {
            where: {
              // ⭐ LEADER sees ALL departments in their division(s), not filtered by scope.departmentIds
              deletedAt: null,
            },
            select: {
              id: true,
              name: true,
              projects: {
                where: { dateDeleted: null },
                select: {
                  id: true,
                  name: true,
                  status: true,
                  departmentId: true,
                },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    viewType: 'hierarchical' as const,
    userRole: 'LEADER' as const,
    hierarchical: missionGroups.map((mg) => ({
      id: mg.id,
      name: mg.name,
      divisions: mg.divisions.map((div) => ({
        id: div.id,
        name: div.name,
        missionGroupId: mg.id,
        departments: div.departments.map((dept) => ({
          id: dept.id,
          name: dept.name,
          divisionId: div.id,
          projects: dept.projects,
        })),
      })),
    })),
  };
}

/**
 * HEAD/MEMBER: Flat list + Hierarchical structure of accessible departments
 * Now supports additionalRoles - can see projects from multiple departments
 * Returns both flat (for sidebar) and hierarchical (for reports filters)
 */
async function getDepartmentWorkspace(user: any, scope: AccessibleScope) {
  if (!user.department) {
    return {
      viewType: 'flat' as const,
      userRole: user.role,
      flat: [],
      hierarchical: [],
    };
  }

  // Query ALL accessible departments with their organization hierarchy and projects
  const departments = await prisma.department.findMany({
    where: {
      id: { in: scope.departmentIds },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      divisionId: true,
      division: {
        select: {
          id: true,
          name: true,
          missionGroupId: true,
          missionGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      projects: {
        where: { dateDeleted: null },
        select: {
          id: true,
          name: true,
          status: true,
          departmentId: true,
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Create flat list of projects from ALL accessible departments
  const flat = departments.flatMap((department) =>
    department.projects.map((project) => ({
      type: 'project' as const,
      id: project.id,
      name: project.name,
      parentName: department.name,
      metadata: {
        departmentId: project.departmentId,
        status: project.status,
      },
    }))
  );

  // Build hierarchical structure for reports filters
  // Group departments by MissionGroup → Division
  const missionGroupMap = new Map<string, any>();

  for (const dept of departments) {
    if (!dept.division?.missionGroup) continue;

    const mgId = dept.division.missionGroup.id;
    const divId = dept.division.id;

    // Get or create mission group
    if (!missionGroupMap.has(mgId)) {
      missionGroupMap.set(mgId, {
        id: mgId,
        name: dept.division.missionGroup.name,
        divisions: new Map<string, any>(),
      });
    }
    const mg = missionGroupMap.get(mgId)!;

    // Get or create division
    if (!mg.divisions.has(divId)) {
      mg.divisions.set(divId, {
        id: divId,
        name: dept.division.name,
        missionGroupId: mgId,
        departments: [],
      });
    }
    const div = mg.divisions.get(divId)!;

    // Add department
    div.departments.push({
      id: dept.id,
      name: dept.name,
      divisionId: divId,
      projects: dept.projects,
    });
  }

  // Convert maps to arrays
  const hierarchical = Array.from(missionGroupMap.values()).map((mg) => ({
    id: mg.id,
    name: mg.name,
    divisions: Array.from(mg.divisions.values()),
  }));

  return {
    viewType: 'flat' as const,
    userRole: user.role,
    flat,
    hierarchical, // ⭐ Now includes hierarchical for reports filters
  };
}

/**
 * USER: Flat list of projects they're involved in
 * Filtered by accessible departments from scope
 */
async function getUserWorkspace(user: any, scope: AccessibleScope) {
  // Get projects where user is assigned to tasks or is project owner
  // AND project is in accessible departments
  const projects = await prisma.project.findMany({
    where: {
      dateDeleted: null,
      departmentId: { in: scope.departmentIds }, // Filter by accessible departments
      OR: [
        {
          ownerUserId: user.id,
        },
        {
          tasks: {
            some: {
              OR: [
                {
                  assignees: {
                    some: {
                      userId: user.id,
                    },
                  },
                },
                { creatorUserId: user.id },
              ],
              deletedAt: null,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      status: true,
      departmentId: true,
      department: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const flat = projects.map((project) => ({
    type: 'project' as const,
    id: project.id,
    name: project.name,
    parentName: project.department?.name || 'ไม่ระบุ',
    metadata: {
      departmentId: project.departmentId,
      status: project.status,
    },
  }));

  return {
    viewType: 'flat' as const,
    userRole: 'USER' as const,
    flat,
  };
}

export const GET = withAuth(handler);
