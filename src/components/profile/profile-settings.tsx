"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, authKeys } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Loader2,
  ClipboardPaste,
  Check,
  X,
  ChevronsUpDown,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommonTitlePrefixes } from "@/lib/user-utils";
import { useToast } from "@/hooks/use-toast";

// Preset avatar URLs
const PRESET_AVATARS = [
  "https://mockmind-api.uifaces.co/content/human/80.jpg",
  "https://mockmind-api.uifaces.co/content/human/125.jpg",
  "https://mockmind-api.uifaces.co/content/human/222.jpg",
  "https://mockmind-api.uifaces.co/content/human/108.jpg",
  "https://mockmind-api.uifaces.co/content/human/104.jpg",
  "https://mockmind-api.uifaces.co/content/human/92.jpg",
  "https://mockmind-api.uifaces.co/content/human/91.jpg",
  "https://mockmind-api.uifaces.co/content/human/128.jpg",
  "https://mockmind-api.uifaces.co/content/human/112.jpg",
  "https://mockmind-api.uifaces.co/content/human/219.jpg",
  "https://mockmind-api.uifaces.co/content/human/97.jpg",
  "https://mockmind-api.uifaces.co/content/human/90.jpg",
  "https://mockmind-api.uifaces.co/content/human/124.jpg",
  "https://mockmind-api.uifaces.co/content/human/221.jpg",
  "https://mockmind-api.uifaces.co/content/human/99.jpg",
  "https://mockmind-api.uifaces.co/content/human/98.jpg",
];

interface JobTitle {
  id: string;
  jobTitleTh: string;
  jobTitleEn: string;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Personal Information
  const [titlePrefix, setTitlePrefix] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Work Information
  const [jobTitleId, setJobTitleId] = useState("");
  const [jobLevel, setJobLevel] = useState("");
  const [workLocation, setWorkLocation] = useState("");
  const [internalPhone, setInternalPhone] = useState("");

  // Profile Image
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Initial values for dirty check
  const [initialValues, setInitialValues] = useState({
    titlePrefix: "",
    firstName: "",
    lastName: "",
    jobTitleId: "",
    jobLevel: "",
    workLocation: "",
    internalPhone: "",
    profileImageUrl: "",
  });

  // Password Change (always empty on mount)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordPopover, setShowPasswordPopover] = useState(false);
  const [jobTitleOpen, setJobTitleOpen] = useState(false);
  const [titlePrefixOpen, setTitlePrefixOpen] = useState(false);

  // UI states
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  // Loading states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isLoadingJobTitles, setIsLoadingJobTitles] = useState(false);

  // Check if form has changes (dirty check)
  const isDirty =
    titlePrefix !== initialValues.titlePrefix ||
    firstName !== initialValues.firstName ||
    lastName !== initialValues.lastName ||
    jobTitleId !== initialValues.jobTitleId ||
    jobLevel !== initialValues.jobLevel ||
    workLocation !== initialValues.workLocation ||
    internalPhone !== initialValues.internalPhone ||
    profileImageUrl !== initialValues.profileImageUrl;

  // Load user data and set initial values
  useEffect(() => {
    if (user) {
      // Debug: log user data
      console.log('Profile page loaded user:', {
        firstName: user.firstName,
        lastName: user.lastName,
        titlePrefix: user.titlePrefix,
        fullName: user.fullName,
      });

      // If firstName or lastName is missing, try to split from fullName
      let firstName = user.firstName || "";
      let lastName = user.lastName || "";

      if ((!firstName || !lastName) && user.fullName) {
        console.warn('firstName or lastName missing, splitting from fullName:', user.fullName);
        // Remove title prefix from fullName
        let name = user.fullName;
        const prefixes = ["นาย", "นาง", "นางสาว", "ดร.", "พญ.", "นพ.", "รศ.", "ศ.", "ผศ."];
        for (const prefix of prefixes) {
          if (name.startsWith(prefix)) {
            name = name.substring(prefix.length).trim();
            break;
          }
        }

        // Split by space (assume first part is firstName, rest is lastName)
        const parts = name.split(" ");
        if (parts.length > 0) {
          firstName = firstName || parts[0];
          lastName = lastName || parts.slice(1).join(" ");
        }
        console.log('Split result:', { firstName, lastName });
      }

      const values = {
        titlePrefix: user.titlePrefix || "",
        firstName,
        lastName,
        jobTitleId: user.jobTitleId || "",
        jobLevel: user.jobLevel || "",
        workLocation: user.workLocation || "",
        internalPhone: user.internalPhone || "",
        profileImageUrl: user.profileImageUrl || "",
      };

      // Set form values
      setTitlePrefix(values.titlePrefix);
      setFirstName(values.firstName);
      setLastName(values.lastName);
      setJobTitleId(values.jobTitleId);
      setJobLevel(values.jobLevel);
      setWorkLocation(values.workLocation);
      setInternalPhone(values.internalPhone);
      setProfileImageUrl(values.profileImageUrl);

      // Set initial values for dirty check
      setInitialValues(values);

      // Always clear password fields when entering page
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [user]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load job titles
  useEffect(() => {
    const fetchJobTitles = async () => {
      setIsLoadingJobTitles(true);
      try {
        const response = await api.get("/api/job-titles");
        setJobTitles(response.jobTitles || []);
      } catch (error) {
        console.error("Failed to load job titles:", error);
      } finally {
        setIsLoadingJobTitles(false);
      }
    };

    fetchJobTitles();
  }, []);

  // Password strength calculation (same as register page)
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length > 0 && password.length < 8) return 1;
    return score;
  };

  const strength = checkPasswordStrength(newPassword);

  // Requirements check
  const requirements = {
    length: newPassword.length >= 8,
    case: /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  // Strength meter
  const getStrengthMeter = () => {
    switch (strength) {
      case 1:
        return { width: "25%", color: "#ef4444", text: "อ่อนแอ" };
      case 2:
        return { width: "50%", color: "#f97316", text: "พอใช้" };
      case 3:
        return { width: "75%", color: "#eab308", text: "ดี" };
      case 4:
        return { width: "100%", color: "#22c55e", text: "ปลอดภัย" };
      default:
        return { width: "0%", color: "transparent", text: "" };
    }
  };

  const meter = getStrengthMeter();

  // Password match validation
  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && newPassword !== confirmPassword;

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกชื่อและนามสกุล",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      await api.patch("/api/users/me", {
        titlePrefix,
        firstName,
        lastName,
        jobTitleId: jobTitleId || null,
        jobLevel,
        workLocation,
        internalPhone,
        profileImageUrl,
      });

      toast({
        title: "สำเร็จ",
        description: "อัพเดทข้อมูลโปรไฟล์เรียบร้อยแล้ว",
      });

      // Update initial values to current values (no longer dirty)
      setInitialValues({
        titlePrefix,
        firstName,
        lastName,
        jobTitleId,
        jobLevel,
        workLocation,
        internalPhone,
        profileImageUrl,
      });

      // Refetch user data
      await queryClient.invalidateQueries({ queryKey: authKeys.user() });
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถอัพเดทข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านใหม่ไม่ตรงกัน",
        variant: "destructive",
      });
      return;
    }

    if (strength < 4) {
      toast({
        title: "ข้อผิดพลาด",
        description: "รหัสผ่านไม่ปลอดภัยพอ กรุณาตั้งรหัสผ่านที่แข็งแรงกว่านี้",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("/api/users/me/change-password", {
        currentPassword,
        newPassword,
      });

      toast({
        title: "สำเร็จ",
        description: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "ข้อผิดพลาด",
        description: error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle paste from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setProfileImageUrl(text);
      toast({
        title: "สำเร็จ",
        description: "วาง URL จากคลิปบอร์ดเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ไม่สามารถอ่านข้อมูลจากคลิปบอร์ดได้",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 md:px-6 pt-2 md:pt-3 pb-4 md:pb-6 space-y-4 md:space-y-6">
      <div className="mb-4 md:mb-8 hidden">
        <h1 className="text-2xl md:text-3xl font-bold">ตั้งค่าโปรไฟล์</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          จัดการข้อมูลส่วนตัวและการตั้งค่าบัญชีของคุณ
        </p>
      </div>

      {/* Section 1: Personal Information */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 border-b px-4 md:px-6 py-2.5 md:py-3">
          <h2 className="text-base md:text-lg font-semibold">ข้อมูลส่วนตัว</h2>
        </div>
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <div>
              <Label htmlFor="titlePrefix" className="text-xs md:text-sm">
                คำนำหน้าชื่อ
              </Label>
              <Popover open={titlePrefixOpen} onOpenChange={setTitlePrefixOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={titlePrefixOpen}
                    className="w-full justify-between mt-1.5 h-10 bg-muted/30"
                  >
                    <span
                      className={cn(!titlePrefix && "text-muted-foreground")}
                    >
                      {titlePrefix || "-- ไม่ระบุ --"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && titlePrefix) {
                        e.preventDefault();
                        setTitlePrefixOpen(false);
                      }
                    }}
                  >
                    <CommandInput
                      placeholder="ค้นหาหรือพิมพ์คำนำหน้า..."
                      value={titlePrefix}
                      onValueChange={(value) => setTitlePrefix(value)}
                    />
                    <CommandList>
                      <CommandEmpty>
                        ไม่พบข้อมูล (กด Enter เพื่อใช้คำนำหน้าที่พิมพ์)
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value=""
                          onSelect={() => {
                            setTitlePrefix("");
                            setTitlePrefixOpen(false);
                          }}
                        >
                          -- ไม่ระบุ --
                        </CommandItem>
                        {getCommonTitlePrefixes().map((item) => (
                          <CommandItem
                            key={item.value}
                            value={item.value}
                            onSelect={(currentValue) => {
                              setTitlePrefix(currentValue);
                              setTitlePrefixOpen(false);
                            }}
                          >
                            {item.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="firstName" className="text-xs md:text-sm">
                ชื่อ *
              </Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1.5 h-10 bg-muted/30"
                placeholder="ชื่อ"
              />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-xs md:text-sm">
                นามสกุล *
              </Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1.5 h-10 bg-muted/30"
                placeholder="นามสกุล"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-xs md:text-sm">
              อีเมล
            </Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="mt-1.5 h-10 bg-muted/50 cursor-not-allowed"
            />
          </div>
        </div>
      </Card>

      {/* Section 2: Change Password */}
      <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-600 ring-1 ring-blue-100 dark:ring-blue-900/30">
        <div className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-200/50 dark:border-blue-800/30 px-4 md:px-6 py-2.5 md:py-3">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 md:h-5 w-4 md:w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base md:text-lg font-semibold text-blue-900 dark:text-blue-100">
              เปลี่ยนรหัสผ่าน
            </h2>
          </div>
        </div>

        {/* Form Fields - Centered */}
        <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-w-2xl mx-auto mb-4 md:mb-6">
          <div>
            <Label htmlFor="currentPassword" className="text-xs md:text-sm">
              รหัสผ่านปัจจุบัน *
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1.5 h-10 bg-muted/30"
              placeholder="กรอกรหัสผ่านปัจจุบัน"
              autoComplete="current-password"
            />
          </div>

          <div className="relative">
            <Label htmlFor="newPassword" className="text-xs md:text-sm">
              รหัสผ่านใหม่ *
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setShowPasswordPopover(true)}
              onBlur={() =>
                setTimeout(() => setShowPasswordPopover(false), 200)
              }
              className="mt-1.5 h-10 bg-muted/30"
              placeholder="ตั้งรหัสผ่านใหม่"
              autoComplete="new-password"
            />

            {/* Password Requirements Popover */}
            {showPasswordPopover && (
              <div className="absolute left-0 md:left-full top-full md:top-0 mt-2 md:mt-0 md:ml-4 w-full md:w-72 z-50 animate-in fade-in-0 zoom-in-95">
                <div className="bg-card rounded-lg shadow-xl border p-4 relative">
                  {/* Arrow - hide on mobile, show on desktop */}
                  <div className="hidden md:block absolute top-1/2 -left-2 w-4 h-4 bg-card transform -translate-y-1/2 rotate-45 border-l border-b"></div>

                  <p className="text-sm font-semibold mb-2">
                    รหัสผ่านควรประกอบด้วย:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li
                      className={`flex items-center ${requirements.length ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.length ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <span>อย่างน้อย 8 ตัวอักษร</span>
                    </li>
                    <li
                      className={`flex items-center ${requirements.case ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.case ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <span>มีตัวพิมพ์เล็กและใหญ่ (a-Z)</span>
                    </li>
                    <li
                      className={`flex items-center ${requirements.number ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.number ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <span>มีตัวเลขอย่างน้อย 1 ตัว (0-9)</span>
                    </li>
                    <li
                      className={`flex items-center ${requirements.special ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.special ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </span>
                      <span>มีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$)</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Strength Meter - Always Visible */}
            <div className="mt-2 space-y-2">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: meter.width,
                    backgroundColor: meter.color,
                  }}
                />
              </div>
              {newPassword && (
                <p
                  className="text-sm font-medium"
                  style={{ color: meter.color }}
                >
                  {meter.text}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs md:text-sm">
              ยืนยันรหัสผ่านใหม่ *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 h-10 bg-muted/30 pr-10"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                autoComplete="new-password"
              />
              {confirmPassword && (
                <span className="absolute top-1/2 right-3 -translate-y-1/2">
                  {passwordsMatch ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : passwordsDontMatch ? (
                    <X className="h-5 w-5 text-red-500" />
                  ) : null}
                </span>
              )}
            </div>
            {confirmPassword && (
              <p
                className={`text-xs mt-1 ${passwordsMatch ? "text-green-500" : passwordsDontMatch ? "text-red-500" : ""}`}
              >
                {passwordsMatch
                  ? "รหัสผ่านตรงกัน"
                  : passwordsDontMatch
                    ? "รหัสผ่านไม่ตรงกัน"
                    : ""}
              </p>
            )}
          </div>
        </div>

        {/* Button - Bottom Right */}
        <div className="flex justify-end px-4 md:px-6 pb-4 md:pb-6">
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !passwordsMatch || strength < 4}
            size="lg"
            className="w-full md:w-auto px-8"
          >
            {isChangingPassword && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            เปลี่ยนรหัสผ่าน
          </Button>
        </div>
      </Card>

      {/* Section 3: Work Information */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 border-b px-4 md:px-6 py-2.5 md:py-3">
          <h2 className="text-base md:text-lg font-semibold">ข้อมูลงาน</h2>
        </div>
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          <div>
            <Label htmlFor="department" className="text-xs md:text-sm">
              หน่วยงาน
            </Label>
            <Input
              id="department"
              value={user.department?.name || "ไม่ระบุ"}
              disabled
              className="mt-1.5 h-10 bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-xs md:text-sm">
              บทบาท
            </Label>
            <Input
              id="role"
              value={user.role}
              disabled
              className="mt-1.5 h-10 bg-muted/50 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label htmlFor="jobTitle" className="text-xs md:text-sm">
                ตำแหน่ง
              </Label>
              <Popover open={jobTitleOpen} onOpenChange={setJobTitleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={jobTitleOpen}
                    disabled={isLoadingJobTitles}
                    className="w-full justify-between mt-1.5 h-10 bg-muted/30"
                  >
                    <span
                      className={cn(
                        !jobTitleId && "text-muted-foreground truncate"
                      )}
                    >
                      {isLoadingJobTitles
                        ? "กำลังโหลด..."
                        : jobTitleId
                          ? jobTitles.find((jt) => jt.id === jobTitleId)
                              ?.jobTitleTh || "-- ไม่ระบุ --"
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
                            setJobTitleId("");
                            setJobTitleOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !jobTitleId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          -- ไม่ระบุ --
                        </CommandItem>
                        {jobTitles.map((jobTitle) => (
                          <CommandItem
                            key={jobTitle.id}
                            value={jobTitle.jobTitleTh}
                            onSelect={() => {
                              setJobTitleId(jobTitle.id);
                              setJobTitleOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                jobTitleId === jobTitle.id
                                  ? "opacity-100"
                                  : "opacity-0"
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
            </div>
            <div>
              <Label htmlFor="jobLevel" className="text-xs md:text-sm">
                ระดับ
              </Label>
              <Select
                value={jobLevel || "NONE"}
                onValueChange={(value) =>
                  setJobLevel(value === "NONE" ? "" : value)
                }
              >
                <SelectTrigger className="mt-1.5 h-10 bg-muted/30">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <Label htmlFor="workLocation" className="text-xs md:text-sm">
                สถานที่ปฏิบัติงาน
              </Label>
              <Input
                id="workLocation"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                className="mt-1.5 h-10 bg-muted/30"
                placeholder="เช่น อาคาร A ชั้น 2"
              />
            </div>
            <div>
              <Label htmlFor="internalPhone" className="text-xs md:text-sm">
                เบอร์โทรภายใน
              </Label>
              <Input
                id="internalPhone"
                value={internalPhone}
                onChange={(e) => setInternalPhone(e.target.value)}
                className="mt-1.5 h-10 bg-muted/30"
                placeholder="เช่น 1234"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Section 4: Profile Image */}
      <Card className="overflow-hidden">
        <div className="bg-muted/50 border-b px-4 md:px-6 py-2.5 md:py-3">
          <h2 className="text-base md:text-lg font-semibold">รูปโปรไฟล์</h2>
        </div>
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 flex-shrink-0">
              <AvatarImage src={profileImageUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {user.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label htmlFor="profileImageUrl" className="text-xs md:text-sm">
                URL รูปโปรไฟล์
              </Label>
              <div className="flex gap-2">
                <Input
                  id="profileImageUrl"
                  value={profileImageUrl}
                  onChange={(e) => setProfileImageUrl(e.target.value)}
                  className="h-10 bg-muted/30"
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                  onClick={handlePasteFromClipboard}
                  title="วาง URL จากคลิปบอร์ด"
                >
                  <ClipboardPaste className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                วาง URL ของรูปภาพ หรือเลือกจากอวตารสำเร็จรูปด้านล่าง
              </p>
            </div>
          </div>

          <div>
            <Label className="text-base mb-2 md:mb-3 block">เลือกอวตารสำเร็จรูป</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 md:gap-3">
              {PRESET_AVATARS.map((url, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setProfileImageUrl(url)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                    profileImageUrl === url
                      ? "border-primary ring-2 ring-primary ring-offset-2"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <Avatar className="h-full w-full">
                    <AvatarImage src={url} />
                    <AvatarFallback>{index + 1}</AvatarFallback>
                  </Avatar>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Save Profile Button */}
      <div className="flex justify-end px-2 md:px-0">
        <Button
          onClick={handleUpdateProfile}
          disabled={!isDirty || isUpdating}
          size="lg"
          className="w-full md:w-auto px-8"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          บันทึกข้อมูลโปรไฟล์
        </Button>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </AlertDialogTitle>
            <AlertDialogDescription>
              คุณมีการเปลี่ยนแปลงข้อมูลที่ยังไม่ได้บันทึก หากคุณออกจากหน้านี้
              การเปลี่ยนแปลงทั้งหมดจะสูญหาย
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingNavigation) {
                  router.push(pendingNavigation);
                }
              }}
            >
              ออกจากหน้า
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
