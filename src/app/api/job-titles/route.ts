/**
 * GET /api/job-titles
 * Get all job titles (ตำแหน่งงาน)
 * Public endpoint - can be accessed by all authenticated users
 */

import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-response';

async function handler(req: AuthenticatedRequest) {
  try {
    // Fetch all job titles ordered by Thai name
    const jobTitles = await prisma.jobTitle.findMany({
      select: {
        id: true,
        jobTitleTh: true,
        jobTitleEn: true,
      },
      orderBy: {
        jobTitleTh: 'asc',
      },
    });

    return successResponse({
      jobTitles,
      total: jobTitles.length,
    });
  } catch (error: any) {
    console.error('[JobTitles] Error fetching job titles:', error);
    return errorResponse(
      'SERVER_ERROR',
      'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน',
      500
    );
  }
}

// Export with authentication middleware
export const GET = withAuth(handler);
