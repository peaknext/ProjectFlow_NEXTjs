"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  calculateProjectProgress,
  getCurrentPhase,
  getPhaseColorClasses,
  getProgressColorClasses,
} from "@/lib/project-utils";
import type { ProjectWithDetails } from "@/types/project";

interface ProjectRowProps {
  project: ProjectWithDetails;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Calculate progress
  const progress = calculateProjectProgress(project);
  const currentPhase = getCurrentPhase(project.phases);
  const progressColors = getProgressColorClasses(progress);
  const phaseColors = getPhaseColorClasses(currentPhase.order);

  // Get user initials for avatar fallback
  const initials = project.owner.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Check permissions
  const canEdit = user?.role && ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role);
  const canDelete = user?.role && ["ADMIN", "CHIEF"].includes(user.role);

  // Handlers
  const handleRowClick = () => {
    // Navigate to Board View
    router.push(`/projects/${project.id}/board`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Open edit modal
    console.log("Edit project:", project.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Show delete confirmation
    console.log("Delete project:", project.id);
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={handleRowClick}
    >
      {/* Project Name + Progress */}
      <TableCell>
        <div>
          <div className="font-medium text-foreground mb-2 truncate">
            {project.name}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[200px] flex items-center gap-2">
              <Progress value={progress} className="h-2.5" />
              <span className={`text-sm font-medium whitespace-nowrap ${progressColors.text}`}>
                {progress.toFixed(1)}%
              </span>
            </div>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              จำนวนงาน: {project._count.tasks}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Owner */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                project.owner.profileImageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  project.owner.fullName
                )}&background=3b82f6&color=fff&size=128`
              }
              alt={project.owner.fullName}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm truncate">{project.owner.fullName}</span>
        </div>
      </TableCell>

      {/* Phase */}
      <TableCell>
        <Badge
          variant="secondary"
          className={`${phaseColors} truncate inline-flex`}
        >
          {currentPhase.name}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="h-8 w-8 hover:bg-accent"
              title="แก้ไข"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 hover:bg-destructive/10 text-destructive"
              title="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
