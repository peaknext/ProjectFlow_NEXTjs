"use client";

import { DepartmentStats } from "@/hooks/use-department-tasks";
import { FileText, CheckCircle2, AlertCircle, Clock } from "lucide-react";

interface DepartmentHeaderProps {
  departmentName: string;
  divisionName: string;
  stats: DepartmentStats;
}

export function DepartmentHeader({
  departmentName,
  divisionName,
  stats,
}: DepartmentHeaderProps) {
  const completionPercentage = Math.round(stats.completionRate * 100);

  return (
    <div className="mb-6">
      {/* Department Title */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {departmentName}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {divisionName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                งานทั้งหมด
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalTasks}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                เสร็จแล้ว
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {stats.completedTasks}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-3">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                เลยกำหนด
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {stats.overdueTasks}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Due Soon Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                ใกล้กำหนด
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {stats.dueSoonTasks}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            ความคืบหน้าโดยรวม
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {completionPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            {stats.totalProjects} โครงการ ({stats.activeProjects} ใช้งานอยู่)
          </span>
          <span>
            {stats.completedTasks} / {stats.totalTasks} งาน
          </span>
        </div>
      </div>
    </div>
  );
}
