"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpDown, ArrowUp, ArrowDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportStatistics, ReportUser } from "@/hooks/use-reports";

interface ReportsTableProps {
  statistics: ReportStatistics;
  users: ReportUser[];
}

type SortColumn = "name" | "total" | "notStarted" | "inProgress" | "done" | "overdue";
type SortDirection = "asc" | "desc";

export function ReportsTable({ statistics, users }: ReportsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Create user lookup map by fullName
  const userMap = new Map(users.map(u => [u.fullName, u]));

  // Convert workload data to table rows
  const tableData = Object.entries(statistics.workloadByType).map(
    ([name, data]) => ({
      name,
      user: userMap.get(name), // Get user data for avatar
      total: data.total,
      notStarted: data["Not Started"],
      inProgress: data["In Progress"],
      done: data.Done,
      overdue: data.overdue,
    })
  );

  // Sort data
  const sortedData = [...tableData].sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;

    if (sortColumn === "name") {
      valueA = a.name;
      valueB = b.name;
      // Thai locale sorting
      return sortDirection === "asc"
        ? valueA.localeCompare(valueB, "th")
        : valueB.localeCompare(valueA, "th");
    } else {
      valueA = a[sortColumn];
      valueB = b[sortColumn];
      return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
    }
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, default to desc
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("name")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  ผู้รับผิดชอบ
                  <SortIcon column="name" />
                </Button>
              </TableHead>
              <TableHead className="text-center w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("total")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  งานทั้งหมด
                  <SortIcon column="total" />
                </Button>
              </TableHead>
              <TableHead className="text-center w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("notStarted")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  ยังไม่เริ่ม
                  <SortIcon column="notStarted" />
                </Button>
              </TableHead>
              <TableHead className="text-center w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("inProgress")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  กำลังทำ
                  <SortIcon column="inProgress" />
                </Button>
              </TableHead>
              <TableHead className="text-center w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("done")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  เสร็จแล้ว
                  <SortIcon column="done" />
                </Button>
              </TableHead>
              <TableHead className="text-center w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("overdue")}
                  className="h-8 px-2 hover:bg-transparent"
                >
                  เกินกำหนด
                  <SortIcon column="overdue" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  ไม่มีข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={row.user?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {row.name === "Unassigned" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            row.name.substring(0, 2).toUpperCase()
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <span>{row.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{row.total}</TableCell>
                  <TableCell className="text-center text-slate-600 dark:text-slate-400">
                    {row.notStarted}
                  </TableCell>
                  <TableCell className="text-center text-blue-600 dark:text-blue-400">
                    {row.inProgress}
                  </TableCell>
                  <TableCell className="text-center text-green-600 dark:text-green-400">
                    {row.done}
                  </TableCell>
                  <TableCell
                    className={`text-center font-semibold ${
                      row.overdue > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {row.overdue}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
