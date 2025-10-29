/**
 * MobileMenu Component
 *
 * Hamburger menu drawer for mobile navigation.
 * Slides in from left side of screen.
 *
 * Features:
 * - User profile section (avatar, name, role, department)
 * - Workspace navigation (project selector with collapsible tree)
 * - Navigation links (Reports, Users, Settings)
 * - Dark mode toggle
 * - Logout button
 *
 * Opens when user clicks hamburger icon (☰) in mobile-top-bar or bottom-navigation
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  FolderKanban,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Moon,
  Sun,
  Plus,
  Calendar,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/use-ui-store';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useFiscalYearStore,
  useFiscalYearBadgeText,
  useIsDefaultFiscalYear,
} from '@/stores/use-fiscal-year-store';
import {
  getCurrentFiscalYear,
  getAvailableFiscalYears,
} from '@/lib/fiscal-year';

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const [workspaceExpanded, setWorkspaceExpanded] = useState(true);
  const [fiscalYearExpanded, setFiscalYearExpanded] = useState(true);

  const { data: projectsData } = useProjects();
  const projects = projectsData?.projects || [];

  const openCreateProjectModal = useUIStore((state) => state.openCreateProjectModal);

  // Fiscal Year Filter
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);
  const setSelectedYears = useFiscalYearStore((state) => state.setSelectedYears);
  const resetToCurrentYear = useFiscalYearStore((state) => state.resetToCurrentYear);
  const selectAllYears = useFiscalYearStore((state) => state.selectAllYears);

  const badgeText = useFiscalYearBadgeText();
  const isDefault = useIsDefaultFiscalYear();
  const currentYear = getCurrentFiscalYear();
  const availableYears = getAvailableFiscalYears();

  const isYearSelected = (year: number) => selectedYears.includes(year);

  const toggleYear = (year: number) => {
    if (isYearSelected(year)) {
      if (selectedYears.length === 1) return; // Prevent empty
      setSelectedYears(selectedYears.filter((y) => y !== year));
    } else {
      setSelectedYears([...selectedYears, year]);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}/mobile`);
    handleClose();
  };

  const handleCreateProject = () => {
    openCreateProjectModal();
    handleClose();
  };

  const handleLogout = () => {
    handleClose();
    logout();
  };

  // Check if user has access to Reports/Users pages
  const canViewReports = user?.role && ['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER'].includes(user.role);
  const canViewUsers = user?.role && ['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        {/* Hidden title for screen reader accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>เมนู</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full px-6 pt-6">
          {/* User Profile Section - Clickable */}
          {user && (
            <div className="mb-6">
              <Link href="/profile" onClick={handleClose}>
                <button className="w-full flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={
                        user.profileImageUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                      }
                      alt={user.fullName}
                    />
                    <AvatarFallback>{user.fullName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm truncate">{user.fullName}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {user.role}
                    </Badge>
                    {user.department && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {user.department.name}
                      </p>
                    )}
                  </div>
                </button>
              </Link>
            </div>
          )}

          <Separator className="my-4" />

          {/* Workspace Section */}
          <div className="mb-4">
            <button
              onClick={() => setWorkspaceExpanded(!workspaceExpanded)}
              className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                <span className="text-sm font-medium">WORKSPACE</span>
              </div>
              <motion.div
                animate={{ rotate: workspaceExpanded ? 0 : -90 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {workspaceExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 ml-6 space-y-1">
                    {projects.length > 0 ? (
                      <>
                        {projects.slice(0, 10).map((project: any) => (
                          <button
                            key={project.id}
                            onClick={() => handleProjectClick(project.id)}
                            className={cn(
                              'w-full text-left p-2 rounded-md text-sm transition-colors',
                              'hover:bg-accent',
                              pathname?.includes(`/projects/${project.id}`) && 'bg-accent font-medium'
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <FolderKanban className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{project.name}</span>
                            </div>
                          </button>
                        ))}

                        {projects.length > 10 && (
                          <p className="text-xs text-muted-foreground pl-2 pt-1">
                            และอีก {projects.length - 10} โปรเจกต์...
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground pl-2">ไม่มีโปรเจกต์</p>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateProject}
                      className="w-full justify-start mt-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      สร้างโปรเจกต์ใหม่
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="my-4" />

          {/* Fiscal Year Filter Section */}
          <div className="mb-4">
            <button
              onClick={() => setFiscalYearExpanded(!fiscalYearExpanded)}
              className="flex items-center justify-between w-full p-2 rounded-md hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">ปีงบประมาณ</span>
                {!isDefault && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {badgeText}
                  </Badge>
                )}
              </div>
              <motion.div
                animate={{ rotate: fiscalYearExpanded ? 0 : -90 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </button>

            <AnimatePresence initial={false}>
              {fiscalYearExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 ml-6 space-y-2">
                    {/* Current Selection Display */}
                    <div className="p-2 rounded-md bg-accent/50 mb-3">
                      <div className="text-xs text-muted-foreground mb-1">กำลังดู:</div>
                      <div className="text-sm font-medium">
                        {badgeText === "ทุกปี" ? "ทุกปี" : `ปีงบ ${badgeText}`}
                      </div>
                    </div>

                    {/* Year List with Checkboxes */}
                    {availableYears.map((year) => {
                      const isSelected = isYearSelected(year);
                      const isCurrent = year === currentYear;
                      const isOnlySelected = isSelected && selectedYears.length === 1;

                      return (
                        <div
                          key={year}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-md transition-colors",
                            isSelected && "bg-accent",
                            !isOnlySelected && "hover:bg-accent cursor-pointer",
                            isOnlySelected && "opacity-60 cursor-not-allowed"
                          )}
                          onClick={() => !isOnlySelected && toggleYear(year)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => !isOnlySelected && toggleYear(year)}
                            disabled={isOnlySelected}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="text-sm flex-1">
                            {year}
                            {isCurrent && (
                              <span className="ml-1.5 text-xs text-muted-foreground">
                                (ปัจจุบัน)
                              </span>
                            )}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={selectAllYears}
                      >
                        ทุกปี
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={resetToCurrentYear}
                      >
                        ปีปัจจุบัน
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="my-4" />

          {/* Navigation Links */}
          <div className="space-y-1 mb-4">
            {canViewReports && (
              <Link href="/reports" onClick={handleClose}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    pathname === '/reports' && 'bg-accent font-medium'
                  )}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  รายงาน
                </Button>
              </Link>
            )}

            {canViewUsers && (
              <Link href="/users" onClick={handleClose}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start',
                    pathname === '/users' && 'bg-accent font-medium'
                  )}
                >
                  <Users className="h-4 w-4 mr-3" />
                  บุคลากร
                </Button>
              </Link>
            )}

            <Link href="/profile" onClick={handleClose}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start',
                  pathname === '/profile' && 'bg-accent font-medium'
                )}
              >
                <Settings className="h-4 w-4 mr-3" />
                ตั้งค่าโปรไฟล์
              </Button>
            </Link>
          </div>

          <Separator className="my-4" />

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-2 rounded-md hover:bg-accent transition-colors">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>

          <Separator className="my-4" />

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <LogOut className="h-4 w-4 mr-3" />
            ออกจากระบบ
          </Button>

          {/* Bottom Spacing */}
          <div className="h-6" />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
