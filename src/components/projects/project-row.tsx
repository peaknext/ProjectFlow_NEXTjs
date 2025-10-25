"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/use-ui-store";
import { useDeleteProject } from "@/hooks/use-projects";
import { toast } from "sonner";
import {
  calculateProjectProgress,
  getCurrentPhase,
  getProgressColorClasses,
} from "@/lib/project-utils";
import type { ProjectWithDetails } from "@/types/project";

interface ProjectRowProps {
  project: ProjectWithDetails;
}

export function ProjectRow({ project }: ProjectRowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const openEditProjectModal = useUIStore((state) => state.openEditProjectModal);

  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Use cached progress from database (0-1, convert to 0-100 for display)
  // Fallback to calculation if not available
  const progress = project.progress !== null && project.progress !== undefined
    ? Math.round(project.progress * 100)
    : calculateProjectProgress(project);
  const currentPhase = getCurrentPhase(project.phases);
  const progressColors = getProgressColorClasses(progress);

  // Get user initials for avatar fallback
  const initials = project.owner.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Delete mutation
  const deleteMutation = useDeleteProject();

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
    openEditProjectModal(project.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(project.id);
      toast.success("ลบโปรเจคสำเร็จ", {
        description: `โปรเจค "${project.name}" ถูกลบเรียบร้อยแล้ว`,
      });
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Delete project error:", error);

      // Handle specific error for projects with tasks
      if (error?.response?.data?.code === "PROJECT_HAS_TASKS") {
        const taskCount = project._count.tasks;
        toast.error("ไม่สามารถลบโปรเจคได้", {
          description: `โปรเจคนี้มีงานอยู่ ${taskCount} งาน กรุณาลบหรือย้ายงานทั้งหมดก่อนลบโปรเจค`,
          duration: 5000,
        });
      } else {
        toast.error("ไม่สามารถลบโปรเจคได้", {
          description: "กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ กรุณาติดต่อผู้ดูแลระบบ",
        });
      }
    }
  };

  return (
    <>
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
          <span className="text-sm">
            {currentPhase.name}
          </span>
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
                onClick={handleDeleteClick}
                className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                title="ลบ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบโปรเจค</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>คุณแน่ใจหรือไม่ที่จะลบโปรเจค <strong className="text-foreground">{project.name}</strong>?</p>
              <p className="text-sm text-muted-foreground">
                การลบโปรเจคจะลบข้อมูลต่อไปนี้ออกจากระบบ:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>งานทั้งหมด ({project._count.tasks} งาน)</li>
                <li>สถานะและ Phase ของโปรเจค</li>
                <li>ความคิดเห็นและ Checklist ในงาน</li>
                <li>ประวัติการดำเนินงานทั้งหมด</li>
              </ul>
              <p className="text-sm font-medium text-destructive">
                ⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังลบ...
                </>
              ) : (
                "ลบโปรเจค"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
