/**
 * EditUserModal - User editing slide panel (ADMIN only)
 *
 * Key Features:
 * - ADMIN only access
 * - Side panel animation (same as CreateUserModal & TaskPanel)
 * - Edit all user fields including profile image URL and notes
 * - Department selector with search (Popover)
 * - Role selector (Select dropdown with 6 roles)
 * - Optimistic updates for instant UI feedback
 * - Pre-populated form with existing user data
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { X, Loader2, ChevronDown, Check, ChevronsUpDown, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { useUIStore } from '@/stores/use-ui-store';
import { useWorkspace } from '@/hooks/use-workspace';
import { useUpdateUser } from '@/hooks/use-users';
import { useSwipeToClose } from '@/hooks/use-swipe-to-close';
import { getCommonTitlePrefixes } from '@/lib/user-utils';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { User } from '@/types/user';

interface Department {
  id: string;
  name: string;
  divisionId: string;
}

interface JobTitle {
  id: string;
  jobTitleTh: string;
  jobTitleEn: string;
}

interface UserFormData {
  email: string;
  titlePrefix?: string;
  firstName: string;
  lastName: string;
  departmentId: string;
  role: 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';
  jobTitleId?: string;
  jobLevel?: string;
  workLocation?: string;
  internalPhone?: string;
  profileImageUrl?: string; // NEW
  notes?: string; // NEW
}

export function EditUserModal() {
  const editUserModal = useUIStore((state) => state.modals.editUser);
  const closeEditUserModal = useUIStore((state) => state.closeEditUserModal);

  // Animation state (same as CreateUserModal & TaskPanel)
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Update user mutation
  const updateUserMutation = useUpdateUser();

  // Workspace data
  const { data: workspaceData } = useWorkspace();

  // Fetch job titles
  const { data: jobTitlesData, isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ['jobTitles'],
    queryFn: async () => {
      const response = await api.get<{ jobTitles: JobTitle[] }>('/api/job-titles');
      return response.jobTitles;
    },
  });

  // Popover/Combobox state
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [titlePrefixOpen, setTitlePrefixOpen] = useState(false);
  const [jobTitleOpen, setJobTitleOpen] = useState(false);

  // Form state management
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit: handleFormSubmit,
    formState: { errors, isDirty }
  } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      titlePrefix: '',
      firstName: '',
      lastName: '',
      departmentId: '',
      role: 'MEMBER',
      jobTitleId: '',
      jobLevel: '',
      workLocation: '',
      internalPhone: '',
      profileImageUrl: '',
      notes: '',
    }
  });

  // Unsaved changes confirmation
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Watch form values
  const watchDepartmentId = watch('departmentId');

  // Handle open/close animations (SAME AS CREATEUSERMODAL & TASKPANEL)
  useEffect(() => {
    if (editUserModal.isOpen && editUserModal.data) {
      // Opening: render immediately, then trigger animation
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });

      // Pre-populate form with existing user data
      const user = editUserModal.data as User;
      reset({
        email: user.email || '',
        titlePrefix: user.titlePrefix || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        departmentId: user.departmentId || '',
        role: user.role || 'MEMBER',
        jobTitleId: user.jobTitleId || '',
        jobLevel: user.jobLevel || '',
        workLocation: user.workLocation || '',
        internalPhone: user.internalPhone || '',
        profileImageUrl: user.profileImageUrl || '',
        notes: (user as any).notes || '', // Type cast because notes might not be in type yet
      });
    } else {
      // Closing: trigger animation, then unmount after animation completes
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [editUserModal.isOpen, editUserModal.data, reset]);

  // Extract departments from workspace (flatten all departments)
  const departments: Department[] = [];

  if (workspaceData?.hierarchical) {
    workspaceData.hierarchical.forEach((mg) => {
      mg.divisions?.forEach((div) => {
        div.departments?.forEach((dept) => {
          departments.push({ id: dept.id, name: dept.name, divisionId: div.id });
        });
      });
    });
  }

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      closeEditUserModal();
    }
  };

  // Confirm close without saving
  const confirmClose = () => {
    setShowUnsavedWarning(false);
    closeEditUserModal();
  };

  // Cancel close
  const cancelClose = () => {
    setShowUnsavedWarning(false);
  };

  // Swipe-to-close gesture for mobile
  const swipeHandlers = useSwipeToClose({
    onClose: handleClose,
    threshold: 100,
    velocityThreshold: 500,
  });

  // Handle form submission
  const onSubmit = async (data: UserFormData) => {
    if (!editUserModal.data) return;

    const user = editUserModal.data as User;

    // Validation
    if (!data.firstName?.trim()) {
      toast.error('กรุณากรอกชื่อ');
      return;
    }

    if (!data.lastName?.trim()) {
      toast.error('กรุณากรอกนามสกุล');
      return;
    }

    if (!data.departmentId) {
      toast.error('กรุณาเลือกหน่วยงาน');
      return;
    }

    if (!data.role) {
      toast.error('กรุณาเลือกบทบาท');
      return;
    }

    // Update user with optimistic update
    updateUserMutation.mutate(
      {
        userId: user.id,
        data: {
          titlePrefix: data.titlePrefix?.trim() || undefined,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          departmentId: data.departmentId,
          role: data.role,
          jobTitleId: data.jobTitleId || undefined,
          jobLevel: data.jobLevel?.trim() || undefined,
          workLocation: data.workLocation?.trim() || undefined,
          internalPhone: data.internalPhone?.trim() || undefined,
          profileImageUrl: data.profileImageUrl?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        },
      },
      {
        onSuccess: (response: any) => {
          // Use formatFullName to match backend format (no space between title and firstName)
          const fullName = data.titlePrefix
            ? `${data.titlePrefix}${data.firstName} ${data.lastName}`
            : `${data.firstName} ${data.lastName}`;
          toast.success(`แก้ไขข้อมูล "${fullName}" สำเร็จ`);
          // Close modal directly without dirty check (already saved successfully)
          closeEditUserModal();
        },
        onError: (error: any) => {
          console.error('[EditUserModal] Error updating user:', error);
          toast.error(error.message || 'ไม่สามารถแก้ไขข้อมูลผู้ใช้ได้');
        },
      }
    );
  };

  // Don't render if not open
  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-[100]',
          'transition-opacity duration-300 ease-in-out',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={handleClose}
      />

      {/* Side Panel with Swipe-to-Close */}
      <motion.div
        {...swipeHandlers}
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-2xl',
          'bg-background/90 backdrop-blur-sm',
          'shadow-2xl z-[101] rounded-xl',
          'flex flex-col',
          'transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-900 rounded-t-xl">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">แก้ไขข้อมูลผู้ใช้</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full p-2 h-auto w-auto hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </Button>
        </div>

        {/* Body (Scrollable) */}
        <form onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

            {/* Title Prefix + First Name + Last Name (3 columns) */}
            <div className="grid grid-cols-3 gap-4">
              {/* Title Prefix - Combobox with custom input */}
              <div>
                <Label htmlFor="titlePrefix" className="text-sm font-medium">
                  คำนำหน้าชื่อ
                </Label>
                <Controller
                  name="titlePrefix"
                  control={control}
                  render={({ field }) => (
                    <Popover open={titlePrefixOpen} onOpenChange={setTitlePrefixOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={titlePrefixOpen}
                          className="w-full justify-between mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        >
                          <span className={cn(!field.value && "text-muted-foreground")}>
                            {field.value || "-- ไม่ระบุ --"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0" align="start">
                        <Command
                          onKeyDown={(e) => {
                            // Close popover on Enter when no item is selected (custom value)
                            if (e.key === 'Enter' && field.value) {
                              e.preventDefault();
                              setTitlePrefixOpen(false);
                            }
                          }}
                        >
                          <CommandInput
                            placeholder="ค้นหาหรือพิมพ์คำนำหน้า..."
                            value={field.value || ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                          />
                          <CommandList>
                            <CommandEmpty>ไม่พบข้อมูล (กด Enter เพื่อใช้คำนำหน้าที่พิมพ์)</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => {
                                  field.onChange('');
                                  setTitlePrefixOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                -- ไม่ระบุ --
                              </CommandItem>
                              {getCommonTitlePrefixes().map((item) => (
                                <CommandItem
                                  key={item.value}
                                  value={item.value}
                                  onSelect={(currentValue) => {
                                    field.onChange(currentValue);
                                    setTitlePrefixOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === item.value ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {item.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              {/* First Name */}
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium">
                  ชื่อ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="เช่น สมชาย"
                  {...register('firstName')}
                  className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium">
                  นามสกุล <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  placeholder="เช่น ใจดี"
                  {...register('lastName')}
                  className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                อีเมล <span className="text-xs text-muted-foreground italic">(ไม่สามารถแก้ไขได้)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register('email')}
                disabled
                className="mt-1 h-[46px] bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 cursor-not-allowed text-muted-foreground"
              />
            </div>

            {/* Department + Role (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Department Selector */}
              <div>
                <Label htmlFor="department" className="text-sm font-medium">
                  หน่วยงาน <span className="text-red-500">*</span>
                </Label>
                <Popover
                  open={departmentPopoverOpen}
                  onOpenChange={setDepartmentPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between mt-1 h-[46px] text-base bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                    >
                      <span className={cn("truncate", !watchDepartmentId && "text-muted-foreground")}>
                        {watchDepartmentId
                          ? departments.find(d => d.id === watchDepartmentId)?.name
                          : "เลือกหน่วยงาน"}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <div className="p-2 border-b border-border">
                      <Input
                        placeholder="ค้นหาหน่วยงาน..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        className="h-9 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {departments
                        .filter(dept => dept.name.toLowerCase().includes(departmentSearch.toLowerCase()))
                        .map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            className={cn(
                              "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                              watchDepartmentId === dept.id && "bg-accent"
                            )}
                            onClick={() => {
                              setValue('departmentId', dept.id, { shouldDirty: true });
                              setDepartmentPopoverOpen(false);
                              setDepartmentSearch('');
                            }}
                          >
                            {dept.name}
                          </button>
                        ))}
                      {departments.filter(dept => dept.name.toLowerCase().includes(departmentSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                          ไม่พบหน่วยงาน
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Role Selector */}
              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  บทบาท <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                        <SelectValue placeholder="เลือกบทบาท" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">ผู้ใช้ (USER)</SelectItem>
                        <SelectItem value="MEMBER">สมาชิก (MEMBER)</SelectItem>
                        <SelectItem value="HEAD">หัวหน้าหน่วยงาน (HEAD)</SelectItem>
                        <SelectItem value="LEADER">หัวหน้ากลุ่มงาน (LEADER)</SelectItem>
                        <SelectItem value="CHIEF">หัวหน้ากลุ่มภารกิจ (CHIEF)</SelectItem>
                        <SelectItem value="ADMIN">ผู้ดูแลระบบ (ADMIN)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Job Title + Job Level (2 columns) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Job Title - Combobox (searchable) */}
              <div>
                <Label htmlFor="jobTitleId" className="text-sm font-medium">
                  ตำแหน่ง
                </Label>
                <Controller
                  name="jobTitleId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={jobTitleOpen} onOpenChange={setJobTitleOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={jobTitleOpen}
                          disabled={isLoadingJobTitles}
                          className="w-full justify-between mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        >
                          <span className={cn(!field.value && "text-muted-foreground truncate")}>
                            {isLoadingJobTitles
                              ? "กำลังโหลด..."
                              : field.value
                              ? jobTitlesData?.find((jt) => jt.id === field.value)?.jobTitleTh || "-- ไม่ระบุ --"
                              : "-- ไม่ระบุ --"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="ค้นหาตำแหน่ง..." />
                          <CommandList>
                            <CommandEmpty>ไม่พบตำแหน่งที่ค้นหา</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value=""
                                onSelect={() => {
                                  field.onChange('');
                                  setJobTitleOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    !field.value ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                -- ไม่ระบุ --
                              </CommandItem>
                              {jobTitlesData?.map((jobTitle) => (
                                <CommandItem
                                  key={jobTitle.id}
                                  value={jobTitle.jobTitleTh}
                                  onSelect={() => {
                                    field.onChange(jobTitle.id);
                                    setJobTitleOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === jobTitle.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {jobTitle.jobTitleTh}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>

              {/* Job Level - Select dropdown */}
              <div>
                <Label htmlFor="jobLevel" className="text-sm font-medium">
                  ระดับ
                </Label>
                <Controller
                  name="jobLevel"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || 'NONE'}
                      onValueChange={(value) => {
                        field.onChange(value === 'NONE' ? '' : value);
                      }}
                    >
                      <SelectTrigger className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">
                        <SelectValue placeholder="-- ไม่ระบุ --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">-- ไม่ระบุ --</SelectItem>
                        <SelectItem value="ปฏิบัติการ">ปฏิบัติการ</SelectItem>
                        <SelectItem value="ชำนาญการ">ชำนาญการ</SelectItem>
                        <SelectItem value="ชำนาญการพิเศษ">ชำนาญการพิเศษ</SelectItem>
                        <SelectItem value="เชี่ยวชาญ">เชี่ยวชาญ</SelectItem>
                        <SelectItem value="ทรงคุณวุฒิ">ทรงคุณวุฒิ</SelectItem>
                        <SelectItem value="ชำนาญงาน">ชำนาญงาน</SelectItem>
                        <SelectItem value="ปฏิบัติงาน">ปฏิบัติงาน</SelectItem>
                        <SelectItem value="อาวุโส">อาวุโส</SelectItem>
                        <SelectItem value="บริหารต้น">บริหารต้น</SelectItem>
                        <SelectItem value="บริหารสูง">บริหารสูง</SelectItem>
                        <SelectItem value="อำนวยการต้น">อำนวยการต้น</SelectItem>
                        <SelectItem value="อำนวยการสูง">อำนวยการสูง</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Work Location */}
            <div>
              <Label htmlFor="workLocation" className="text-sm font-medium">
                สถานที่ปฏิบัติงาน
              </Label>
              <Input
                id="workLocation"
                placeholder="เช่น อาคาร 1 ชั้น 3"
                {...register('workLocation')}
                className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Internal Phone */}
            <div>
              <Label htmlFor="internalPhone" className="text-sm font-medium">
                เบอร์โทรภายใน
              </Label>
              <Input
                id="internalPhone"
                placeholder="เช่น 1234, 5678"
                {...register('internalPhone')}
                className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Profile Image URL - NEW */}
            <div>
              <Label htmlFor="profileImageUrl" className="text-sm font-medium">
                Profile Image URL
              </Label>
              <Input
                id="profileImageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...register('profileImageUrl')}
                className="mt-1 h-[46px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Notes - NEW */}
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                หมายเหตุเพิ่มเติม
              </Label>
              <Textarea
                id="notes"
                placeholder="หมายเหตุสำหรับผู้ดูแลระบบ..."
                {...register('notes')}
                className="mt-1 min-h-[100px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
              />
            </div>

          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 rounded-b-xl">
            {/* Show unsaved changes indicator */}
            {isDirty ? (
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
                <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500 animate-pulse"></span>
                <span>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</span>
              </div>
            ) : (
              <div></div>
            )}

            {/* Save button - disabled when no changes */}
            <Button
              type="submit"
              disabled={!isDirty || updateUserMutation.isPending}
              className="flex items-center justify-center px-6 py-2.5 text-base font-semibold rounded-lg shadow-md h-[46px] min-w-[150px]"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  <span>บันทึก</span>
                </>
              )}
            </Button>
          </footer>
        </form>
      </motion.div>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก</AlertDialogTitle>
            <AlertDialogDescription>
              คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก หากปิดหน้าต่างนี้ การเปลี่ยนแปลงทั้งหมดจะสูญหาย
              คุณต้องการปิดหน้าต่างโดยไม่บันทึกหรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose} className="bg-red-600 hover:bg-red-700">
              ปิดโดยไม่บันทึก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
