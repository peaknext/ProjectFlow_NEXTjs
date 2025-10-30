"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentSummary } from "@/types/division";

interface DepartmentComparisonTableProps {
  departments: DepartmentSummary[];
}

type SortField =
  | "name"
  | "projects"
  | "tasks"
  | "completionRate"
  | "progress"
  | "personnel";
type SortDirection = "asc" | "desc";

export function DepartmentComparisonTable({
  departments,
}: DepartmentComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Sort departments
  const sortedDepartments = useMemo(() => {
    const sorted = [...departments].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case "name":
          compareValue = a.name.localeCompare(b.name, "th");
          break;
        case "projects":
          compareValue = a.projectCount.total - b.projectCount.total;
          break;
        case "tasks":
          compareValue = a.taskStats.total - b.taskStats.total;
          break;
        case "completionRate":
          compareValue = a.completionRate - b.completionRate;
          break;
        case "progress":
          compareValue = a.progress - b.progress;
          break;
        case "personnel":
          compareValue = a.personnelCount - b.personnelCount;
          break;
      }

      return sortDirection === "asc" ? compareValue : -compareValue;
    });

    return sorted;
  }, [departments, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Risk level badge
  const getRiskBadge = (level: "low" | "medium" | "high") => {
    const variants = {
      low: "bg-green-500/10 text-green-700 dark:text-green-400",
      medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
      high: "bg-red-500/10 text-red-700 dark:text-red-400",
    };

    const labels = {
      low: "ต่ำ",
      medium: "ปานกลาง",
      high: "สูง",
    };

    return (
      <Badge variant="secondary" className={cn(variants[level])}>
        {labels[level]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>เปรียบเทียบหน่วยงาน</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* Department Name */}
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    หน่วยงาน
                    <SortIcon field="name" />
                  </div>
                </TableHead>

                {/* Projects */}
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("projects")}
                >
                  <div className="flex items-center justify-center">
                    โปรเจกต์
                    <SortIcon field="projects" />
                  </div>
                </TableHead>

                {/* Tasks */}
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("tasks")}
                >
                  <div className="flex items-center justify-center">
                    งาน
                    <SortIcon field="tasks" />
                  </div>
                </TableHead>

                {/* Completion Rate */}
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("completionRate")}
                >
                  <div className="flex items-center justify-center">
                    อัตราเสร็จสิ้น
                    <SortIcon field="completionRate" />
                  </div>
                </TableHead>

                {/* Progress */}
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("progress")}
                >
                  <div className="flex items-center">
                    ความคืบหน้า
                    <SortIcon field="progress" />
                  </div>
                </TableHead>

                {/* Personnel */}
                <TableHead
                  className="cursor-pointer select-none text-center"
                  onClick={() => handleSort("personnel")}
                >
                  <div className="flex items-center justify-center">
                    บุคลากร
                    <SortIcon field="personnel" />
                  </div>
                </TableHead>

                {/* Risk Level */}
                <TableHead className="text-center">ความเสี่ยง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDepartments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    ไม่พบข้อมูลหน่วยงาน
                  </TableCell>
                </TableRow>
              ) : (
                sortedDepartments.map((dept) => (
                  <TableRow key={dept.id}>
                    {/* Department Name */}
                    <TableCell className="font-medium">
                      {dept.name}
                    </TableCell>

                    {/* Projects */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <div className="font-semibold">{dept.projectCount.total}</div>
                        <div className="text-xs text-muted-foreground">
                          {dept.projectCount.active} ใช้งาน
                        </div>
                      </div>
                    </TableCell>

                    {/* Tasks */}
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center cursor-help">
                              <div className="font-semibold">{dept.taskStats.total}</div>
                              <div className="text-xs text-muted-foreground">
                                {dept.taskStats.completed} เสร็จ
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1 text-xs">
                              <div>กำลังดำเนินการ: {dept.taskStats.inProgress}</div>
                              <div>เกินกำหนด: {dept.taskStats.overdue}</div>
                              <div>ใกล้ครบกำหนด: {dept.taskStats.dueSoon}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Completion Rate */}
                    <TableCell className="text-center">
                      <div className="font-semibold">{dept.completionRate}%</div>
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={dept.progress} className="flex-1" />
                        <span className="text-sm text-muted-foreground min-w-[40px]">
                          {dept.progress}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Personnel */}
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center gap-1 cursor-help">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{dept.personnelCount}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold mb-2">บุคลากรหลัก</div>
                              {dept.topPersonnel.length > 0 ? (
                                dept.topPersonnel.map((person) => (
                                  <div key={person.id} className="flex items-center gap-2 text-xs">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={person.profileImageUrl || undefined} />
                                      <AvatarFallback className="text-[10px]">
                                        {person.fullName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{person.fullName}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  ไม่มีข้อมูลบุคลากร
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>

                    {/* Risk Level */}
                    <TableCell className="text-center">
                      {getRiskBadge(dept.riskLevel)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
