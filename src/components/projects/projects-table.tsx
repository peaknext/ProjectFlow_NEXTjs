"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectRow } from "./project-row";
import type { ProjectWithDetails } from "@/types/project";

interface ProjectsTableProps {
  projects: ProjectWithDetails[];
  isLoading: boolean;
  sortColumn: "name" | "owner" | "phase";
  sortDirection: "asc" | "desc";
  onSort: (column: "name" | "owner" | "phase") => void;
}

export function ProjectsTable({
  projects,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
}: ProjectsTableProps) {
  const SortIcon = ({ column }: { column: "name" | "owner" | "phase" }) => (
    <ArrowUpDown
      className={`ml-2 h-4 w-4 ${
        sortColumn === column ? "text-primary" : "text-muted-foreground"
      }`}
    />
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border flex-1 overflow-hidden">
        <div className="p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-5 w-48 bg-muted animate-pulse rounded-md mb-2" />
                <div className="h-2 w-[200px] bg-muted animate-pulse rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16">
          <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            ไม่พบโปรเจกต์
          </p>
          <p className="text-sm text-muted-foreground">
            ลองปรับเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border h-full flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="border-b border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">
                <Button
                  variant="ghost"
                  onClick={() => onSort("name")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <span className="font-semibold">ชื่อโปรเจกต์</span>
                  <SortIcon column="name" />
                </Button>
              </TableHead>
              <TableHead className="w-[25%]">
                <Button
                  variant="ghost"
                  onClick={() => onSort("owner")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <span className="font-semibold">เจ้าของโปรเจกต์</span>
                  <SortIcon column="owner" />
                </Button>
              </TableHead>
              <TableHead className="w-[20%]">
                <Button
                  variant="ghost"
                  onClick={() => onSort("phase")}
                  className="h-auto p-0 hover:bg-transparent"
                >
                  <span className="font-semibold">Phase ปัจจุบัน</span>
                  <SortIcon column="phase" />
                </Button>
              </TableHead>
              <TableHead className="w-[15%] text-right">
                <span className="font-semibold">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Body */}
      <div className="overflow-auto flex-1">
        <Table>
          <TableBody>
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
