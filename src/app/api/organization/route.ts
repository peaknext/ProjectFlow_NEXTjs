/**
 * GET /api/organization
 * Get complete organization structure
 * Returns all mission groups, divisions, and departments in a hierarchical format
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';

async function handler(req: NextRequest) {
  // Get query parameters
  const { searchParams } = new URL(req.url);
  const includeInactive = searchParams.get('includeInactive') === 'true';

  // Build where clause
  const where = includeInactive ? {} : { deletedAt: null };

  // Fetch complete organization structure
  const missionGroups = await prisma.missionGroup.findMany({
    where,
    include: {
      chief: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImageUrl: true,
        },
      },
      divisions: {
        where,
        include: {
          leader: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profileImageUrl: true,
            },
          },
          departments: {
            where,
            include: {
              head: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  profileImageUrl: true,
                },
              },
              _count: {
                select: {
                  users: true,
                  projects: true,
                },
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

  // Calculate statistics
  const stats = {
    totalMissionGroups: missionGroups.length,
    totalDivisions: missionGroups.reduce(
      (acc, mg) => acc + mg.divisions.length,
      0
    ),
    totalDepartments: missionGroups.reduce(
      (acc, mg) =>
        acc +
        mg.divisions.reduce((acc2, div) => acc2 + div.departments.length, 0),
      0
    ),
    totalUsers: missionGroups.reduce(
      (acc, mg) =>
        acc +
        mg.divisions.reduce(
          (acc2, div) =>
            acc2 +
            div.departments.reduce(
              (acc3, dept) => acc3 + dept._count.users,
              0
            ),
          0
        ),
      0
    ),
    totalProjects: missionGroups.reduce(
      (acc, mg) =>
        acc +
        mg.divisions.reduce(
          (acc2, div) =>
            acc2 +
            div.departments.reduce(
              (acc3, dept) => acc3 + dept._count.projects,
              0
            ),
          0
        ),
      0
    ),
  };

  return successResponse({
    organization: missionGroups,
    stats,
    includeInactive,
  });
}

export const GET = withAuth(handler);
