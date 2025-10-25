/**
 * Backfill Project Progress Script
 *
 * This script calculates and stores progress values for all projects in the database.
 * Run this script once to populate the progress field for existing projects.
 *
 * Usage: node scripts/backfill-project-progress.js
 */

const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

/**
 * Calculate project progress using GAS formula (inline version)
 * Progress = Σ(statusOrder × difficulty) / Σ(Smax × difficulty) × 100
 */
function calculateProgress(tasks, statuses) {
  // Filter out ABORTED tasks
  const validTasks = tasks.filter((task) => task.closeType !== 'ABORTED');
  const abortedTasks = tasks.filter((task) => task.closeType === 'ABORTED');

  const totalTasks = validTasks.length;

  // If no valid tasks, return 0%
  if (totalTasks === 0) {
    return {
      progress: 0,
      completedWeight: 0,
      totalWeight: 0,
      totalTasks: 0,
      abortedTasks: abortedTasks.length,
    };
  }

  // Find Smax (maximum status order)
  const Smax = statuses.length > 0 ? Math.max(...statuses.map((s) => s.order)) : 1;

  // Calculate progress
  let completedWeight = 0; // Σ(statusOrder × difficulty)
  let totalWeight = 0; // Σ(Smax × difficulty)

  validTasks.forEach((task) => {
    const statusOrder = task.status?.order || 1;
    const difficulty = task.difficulty || 2; // Default to 2 if not set

    // Validate difficulty is 1-5
    const validDifficulty = [1, 2, 3, 4, 5].includes(difficulty) ? difficulty : 2;

    completedWeight += statusOrder * validDifficulty;
    totalWeight += Smax * validDifficulty;
  });

  // Calculate progress percentage (round to 2 decimal places)
  const progress =
    totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100 * 100) / 100 : 0;

  return {
    progress,
    completedWeight,
    totalWeight,
    totalTasks,
    abortedTasks: abortedTasks.length,
  };
}

async function backfillProgress() {
  console.log('🚀 Starting project progress backfill...\n');

  try {
    // Fetch all active projects with tasks and statuses
    const projects = await prisma.project.findMany({
      where: { dateDeleted: null },
      include: {
        tasks: {
          where: { deletedAt: null, parentTaskId: null },
          select: {
            difficulty: true,
            closeType: true,
            status: {
              select: { order: true }
            }
          }
        },
        statuses: {
          select: { order: true }
        }
      }
    });

    console.log(`📊 Found ${projects.length} projects to process\n`);

    let updated = 0;
    let failed = 0;

    for (const project of projects) {
      try {
        // Calculate progress using the inline utility
        const result = calculateProgress(project.tasks, project.statuses);

        // Update project with calculated progress
        await prisma.project.update({
          where: { id: project.id },
          data: {
            progress: result.progress,
            progressUpdatedAt: new Date()
          }
        });

        console.log(`✅ ${project.name}: ${result.progress.toFixed(1)}% (${result.totalTasks} tasks)`);
        updated++;
      } catch (error) {
        console.error(`❌ Failed to update ${project.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n📈 Backfill Summary:');
    console.log(`   ✅ Updated: ${updated} projects`);
    console.log(`   ❌ Failed: ${failed} projects`);
    console.log(`   📊 Total: ${projects.length} projects`);
    console.log('\n✨ Backfill complete!\n');

  } catch (error) {
    console.error('💥 Fatal error during backfill:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillProgress();
