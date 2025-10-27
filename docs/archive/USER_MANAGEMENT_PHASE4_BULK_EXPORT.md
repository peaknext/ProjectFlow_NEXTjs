# User Management - Phase 4, Bulk Actions & Export

**Continuation of:** USER_MANAGEMENT_IMPLEMENTATION_PLAN.md

---

## 📝 Phase 4: Edit User Modal

**Duration:** 3-4 hours
**File:** `src/components/modals/edit-user-modal.tsx`

### Step 4.1: Setup Modal Structure (30 min)

#### Checklist:
- [ ] Create `src/components/modals/edit-user-modal.tsx`
- [ ] Register modal in UI store with user data
- [ ] Add to dashboard layout imports
- [ ] Setup form with pre-filled values
- [ ] Add tabs for Profile and Security

**Code Template:**
```typescript
// src/components/modals/edit-user-modal.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/use-ui-store';
import { useUpdateUser } from '@/hooks/use-users';
import { User } from '@/types/user';
import { toast } from 'sonner';

const editUserSchema = z.object({
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  departmentId: z.string().nullable(),
  role: z.enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER']),
  profileImageUrl: z.string().url().nullable().optional(),
  jobTitle: z.string().optional(),
  jobLevel: z.string().optional(),
  additionalRoles: z.record(z.string()).nullable().optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export function EditUserModal() {
  const { modals, closeModal } = useUIStore();
  const modalData = modals.editUser;
  const isOpen = modalData?.isOpen || false;
  const user = modalData?.data as User | undefined;

  const [activeTab, setActiveTab] = useState('profile');
  const updateUser = useUpdateUser();

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      fullName: '',
      departmentId: null,
      role: 'USER',
      profileImageUrl: null,
      jobTitle: '',
      jobLevel: '',
      additionalRoles: null,
    },
  });

  // Pre-fill form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        departmentId: user.departmentId,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        jobTitle: user.jobTitle || '',
        jobLevel: user.jobLevel || '',
        additionalRoles: user.additionalRoles || null,
      });
    }
  }, [user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data,
      });

      toast.success(`อัปเดตข้อมูล ${data.fullName} เรียบร้อยแล้ว`);
      closeModal('editUser');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
  };

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal('editUser')}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>แก้ไขข้อมูลผู้ใช้</SheetTitle>
          <SheetDescription>
            แก้ไขข้อมูลของ {user.fullName}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">ข้อมูลส่วนตัว</TabsTrigger>
            <TabsTrigger value="security">ความปลอดภัย</TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="profile" className="space-y-6">
              {/* Profile form fields - will add in next step */}
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              {/* Security controls - will add in next step */}
            </TabsContent>

            <div className="flex gap-2 justify-end pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => closeModal('editUser')}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

**UI Store Registration:**
```typescript
// src/stores/use-ui-store.ts
// Add to ModalState interface:
editUser?: {
  isOpen: boolean;
  data?: User;
};

// Add to openModal function:
case 'editUser':
  set({ modals: { ...state.modals, editUser: { isOpen: true, data } } });
  break;

// Add to closeModal function:
case 'editUser':
  set({ modals: { ...state.modals, editUser: { isOpen: false, data: undefined } } });
  break;
```

**Acceptance Criteria:**
- ✅ Modal opens with user data
- ✅ Form pre-fills with current values
- ✅ Tabs switch correctly
- ✅ Form resets on close

---

### Step 4.2: Profile Tab Implementation (1 hour)

#### Checklist:
- [ ] Add full name field
- [ ] Add avatar upload (URL input for now)
- [ ] Add department cascade selector
- [ ] Add role selector (with warning if changing)
- [ ] Add job title/level fields

**Code Template (Profile Tab):**
```typescript
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspace } from '@/hooks/use-workspace';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Inside TabsContent for profile:
<TabsContent value="profile" className="space-y-6">
  {/* Avatar Preview */}
  <div className="flex items-center gap-4">
    <Avatar className="h-20 w-20">
      <AvatarImage src={form.watch('profileImageUrl') || undefined} />
      <AvatarFallback className="text-lg">
        {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </AvatarFallback>
    </Avatar>
    <div className="flex-1">
      <FormField
        control={form.control}
        name="profileImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL รูปโปรไฟล์</FormLabel>
            <FormControl>
              <Input
                placeholder="https://example.com/avatar.jpg"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormDescription>
              ใส่ URL ของรูปภาพ หรือเว้นว่างไว้เพื่อใช้ชื่อย่อ
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>

  <div className="border-t pt-6 space-y-4">
    <h3 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h3>

    {/* Full Name */}
    <FormField
      control={form.control}
      name="fullName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>ชื่อ-นามสกุล *</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Email (Read-only) */}
    <div>
      <FormLabel>อีเมล</FormLabel>
      <Input value={user.email} disabled className="bg-muted" />
      <p className="text-xs text-muted-foreground mt-1">
        อีเมลไม่สามารถเปลี่ยนแปลงได้
        {user.isVerified && ' • ✓ ยืนยันแล้ว'}
      </p>
    </div>

    {/* Job Title */}
    <FormField
      control={form.control}
      name="jobTitle"
      render={({ field }) => (
        <FormItem>
          <FormLabel>ตำแหน่ง</FormLabel>
          <FormControl>
            <Input placeholder="เช่น นักวิชาการคอมพิวเตอร์" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Job Level */}
    <FormField
      control={form.control}
      name="jobLevel"
      render={({ field }) => (
        <FormItem>
          <FormLabel>ระดับ</FormLabel>
          <FormControl>
            <Input placeholder="เช่น ชำนาญการ" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>

  <div className="border-t pt-6 space-y-4">
    <h3 className="text-lg font-semibold">หน่วยงานและบทบาท</h3>

    {/* Department Selector - simplified version */}
    <FormField
      control={form.control}
      name="departmentId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>หน่วยงาน</FormLabel>
          <FormDescription>
            ปัจจุบัน: {user.department?.name || 'ไม่ระบุ'}
            {user.department?.division && ` (${user.department.division.name})`}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Role Selector with Warning */}
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => {
        const roleChanged = field.value !== user.role;

        return (
          <FormItem>
            <FormLabel>บทบาท *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
                <SelectItem value="CHIEF">หัวหน้ากลุ่มภารกิจ</SelectItem>
                <SelectItem value="LEADER">หัวหน้ากลุ่มงาน</SelectItem>
                <SelectItem value="HEAD">หัวหน้าหน่วยงาน</SelectItem>
                <SelectItem value="MEMBER">สมาชิก</SelectItem>
                <SelectItem value="USER">ผู้ใช้</SelectItem>
              </SelectContent>
            </Select>
            {roleChanged && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  การเปลี่ยนบทบาทจะส่งผลต่อสิทธิ์การเข้าถึงข้อมูล
                </AlertDescription>
              </Alert>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  </div>
</TabsContent>
```

**Acceptance Criteria:**
- ✅ Avatar preview updates on URL change
- ✅ All fields editable except email
- ✅ Role change shows warning
- ✅ Current department displayed
- ✅ Form validation works

---

### Step 4.3: Security Tab Implementation (1 hour)

#### Checklist:
- [ ] Add reset password button
- [ ] Add change status controls
- [ ] Add view sessions button (future feature)
- [ ] Add force logout button

**Code Template (Security Tab):**
```typescript
import { Badge } from '@/components/ui/badge';
import { useUpdateUserStatus } from '@/hooks/use-users';
import { Shield, Key, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Inside component:
const updateStatus = useUpdateUserStatus();
const [showResetPassword, setShowResetPassword] = useState(false);

const handleStatusChange = async (newStatus: string) => {
  try {
    await updateStatus.mutateAsync({
      userId: user.id,
      status: newStatus,
    });

    toast.success(
      newStatus === 'ACTIVE'
        ? 'เปิดใช้งานบัญชีเรียบร้อย'
        : 'ระงับการใช้งานบัญชีเรียบร้อย'
    );
  } catch (error) {
    toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
  }
};

// Inside TabsContent for security:
<TabsContent value="security" className="space-y-6">
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">สถานะบัญชี</h3>

    {/* Current Status */}
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <p className="font-medium">สถานะปัจจุบัน</p>
        <p className="text-sm text-muted-foreground">
          บัญชีนี้{' '}
          {user.userStatus === 'ACTIVE'
            ? 'ใช้งานอยู่'
            : user.userStatus === 'SUSPENDED'
            ? 'ถูกระงับ'
            : 'ไม่ใช้งาน'}
        </p>
      </div>
      <Badge
        variant={user.userStatus === 'ACTIVE' ? 'default' : 'destructive'}
      >
        {user.userStatus === 'ACTIVE' ? 'ใช้งานอยู่' : 'ระงับ'}
      </Badge>
    </div>

    {/* Status Actions */}
    <div className="space-y-2">
      {user.userStatus === 'ACTIVE' ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              ระงับการใช้งานบัญชี
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ยืนยันการระงับบัญชี</AlertDialogTitle>
              <AlertDialogDescription>
                การระงับบัญชีจะทำให้ {user.fullName} ไม่สามารถเข้าสู่ระบบได้
                และเซสชันทั้งหมดจะถูกยกเลิก คุณต้องการดำเนินการต่อหรือไม่?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleStatusChange('SUSPENDED')}
                className="bg-destructive hover:bg-destructive/90"
              >
                ระงับบัญชี
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="default"
          className="w-full"
          onClick={() => handleStatusChange('ACTIVE')}
        >
          <Shield className="h-4 w-4 mr-2" />
          เปิดใช้งานบัญชีอีกครั้ง
        </Button>
      )}
    </div>
  </div>

  <div className="border-t pt-6 space-y-4">
    <h3 className="text-lg font-semibold">การจัดการรหัสผ่าน</h3>

    <div className="space-y-2">
      <Button variant="outline" className="w-full">
        <Key className="h-4 w-4 mr-2" />
        รีเซ็ตรหัสผ่าน
      </Button>
      <p className="text-xs text-muted-foreground">
        จะส่งอีเมลสำหรับตั้งรหัสผ่านใหม่ไปยัง {user.email}
      </p>
    </div>
  </div>

  <div className="border-t pt-6 space-y-4">
    <h3 className="text-lg font-semibold">เซสชัน</h3>

    <div className="space-y-2">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            ยกเลิกเซสชันทั้งหมด
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการยกเลิกเซสชัน</AlertDialogTitle>
            <AlertDialogDescription>
              จะทำการออกจากระบบทุกอุปกรณ์ของ {user.fullName}{' '}
              และต้องเข้าสู่ระบบใหม่อีกครั้ง
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-xs text-muted-foreground">
        บังคับให้ออกจากระบบทุกอุปกรณ์ (เซสชันทั้งหมดจะถูกยกเลิก)
      </p>
    </div>
  </div>

  <div className="border-t pt-6 space-y-4">
    <h3 className="text-lg font-semibold">ข้อมูลบัญชี</h3>

    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">สร้างเมื่อ:</span>
        <span>{new Date(user.createdAt).toLocaleDateString('th-TH')}</span>
      </div>
      {user.updatedAt && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">แก้ไขล่าสุด:</span>
          <span>{new Date(user.updatedAt).toLocaleDateString('th-TH')}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-muted-foreground">อีเมลยืนยัน:</span>
        <span>{user.isVerified ? '✓ ยืนยันแล้ว' : '✗ ยังไม่ยืนยัน'}</span>
      </div>
    </div>
  </div>
</TabsContent>
```

**Acceptance Criteria:**
- ✅ Status change works with confirmation
- ✅ Reset password button shows (functionality placeholder)
- ✅ Force logout button shows with confirmation
- ✅ Account info displays correctly
- ✅ Proper warning messages

---

### Phase 4 Testing Checklist

- [ ] Open edit user modal from user row
- [ ] Verify form pre-fills with current data
- [ ] Edit full name and save
- [ ] Edit job title/level and save
- [ ] Change role and verify warning shows
- [ ] Switch to security tab
- [ ] Test suspend account with confirmation
- [ ] Test reactivate account
- [ ] Verify user list updates after save
- [ ] Test form validation
- [ ] Test in dark mode

**Expected Time:** 3-4 hours

---

## 🔄 Bulk Actions Implementation

**Duration:** 2-3 hours

### Step 5.1: Add Selection Checkbox (30 min)

#### Checklist:
- [ ] Add checkbox column to table header
- [ ] Add checkbox to each user row
- [ ] Manage selected users state
- [ ] Add "Select All" functionality

**Code Template:**
```typescript
// In users-view.tsx:
const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

const handleSelectAll = (checked: boolean) => {
  if (checked) {
    setSelectedUserIds(data?.users.map(u => u.id) || []);
  } else {
    setSelectedUserIds([]);
  }
};

const handleSelectUser = (userId: string, checked: boolean) => {
  if (checked) {
    setSelectedUserIds(prev => [...prev, userId]);
  } else {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  }
};

// In users-table.tsx header:
<TableHead className="w-12">
  <Checkbox
    checked={selectedUserIds.length === users.length && users.length > 0}
    onCheckedChange={handleSelectAll}
  />
</TableHead>

// In user-row.tsx:
<TableCell>
  <Checkbox
    checked={selectedUserIds.includes(user.id)}
    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
  />
</TableCell>
```

**Acceptance Criteria:**
- ✅ Checkboxes appear in table
- ✅ Select all works correctly
- ✅ Individual selection works
- ✅ Selected count displays

---

### Step 5.2: Bulk Action Bar (1 hour)

#### Checklist:
- [ ] Create bulk action bar component
- [ ] Show when users selected
- [ ] Add bulk status change dropdown
- [ ] Add bulk delete button
- [ ] Show selected count

**Code Template:**
```typescript
// src/components/users/bulk-action-bar.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Shield, Trash2 } from 'lucide-react';
import { useBulkUpdateUsers } from '@/hooks/use-users';
import { toast } from 'sonner';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  selectedUserIds: string[];
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  selectedUserIds,
}: BulkActionBarProps) {
  const bulkUpdate = useBulkUpdateUsers();

  const handleBulkStatusChange = async (status: string) => {
    try {
      const result = await bulkUpdate.mutateAsync({
        userIds: selectedUserIds,
        status,
      });

      toast.success(
        `อัปเดต ${result.succeeded} จาก ${result.total} คน เรียบร้อย`
      );

      if (result.failed > 0) {
        toast.warning(`ไม่สำเร็จ ${result.failed} คน`);
      }

      onClearSelection();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">เลือก {selectedCount} คน</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <Select onValueChange={handleBulkStatusChange}>
        <SelectTrigger className="w-40 h-8">
          <SelectValue placeholder="เปลี่ยนสถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ACTIVE">
            <Shield className="h-3 w-3 mr-2 inline" />
            เปิดใช้งาน
          </SelectItem>
          <SelectItem value="SUSPENDED">
            <Shield className="h-3 w-3 mr-2 inline" />
            ระงับ
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="destructive"
        size="sm"
        disabled={bulkUpdate.isPending}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        ลบทั้งหมด
      </Button>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Bar appears when users selected
- ✅ Shows correct selected count
- ✅ Bulk status change works
- ✅ Progress indicator during update
- ✅ Success/error messages display

---

### Step 5.3: Integration & Testing (30 min)

#### Checklist:
- [ ] Integrate bulk action bar into users view
- [ ] Test bulk status change (multiple users)
- [ ] Test clear selection
- [ ] Test with permission checks

**Acceptance Criteria:**
- ✅ Bulk actions work correctly
- ✅ Shows loading state
- ✅ Reports success/failure counts
- ✅ Permission checks enforced

---

## 📤 Export Feature Implementation

**Duration:** 1 hour

### Step 6.1: Export Button & Logic (1 hour)

#### Checklist:
- [ ] Add export button to filter bar
- [ ] Implement CSV generation
- [ ] Include filtered/all users option
- [ ] Add download trigger

**Code Template:**
```typescript
// In users-filter-bar.tsx:
import { Download } from 'lucide-react';

const exportToCSV = (users: User[]) => {
  // CSV headers
  const headers = [
    'ชื่อ-นามสกุล',
    'อีเมล',
    'บทบาท',
    'หน่วยงาน',
    'กลุ่มงาน',
    'สถานะ',
    'ตำแหน่ง',
    'ระดับ',
    'วันที่สร้าง',
  ];

  // CSV rows
  const rows = users.map(user => [
    user.fullName,
    user.email,
    ROLE_LABELS[user.role] || user.role,
    user.department?.name || '-',
    user.department?.division?.name || '-',
    user.userStatus === 'ACTIVE' ? 'ใช้งานอยู่' : 'ระงับ',
    user.jobTitle || '-',
    user.jobLevel || '-',
    new Date(user.createdAt).toLocaleDateString('th-TH'),
  ]);

  // Generate CSV content
  const csvContent = [
    '\ufeff', // BOM for UTF-8
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `users_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toast.success(`ส่งออกข้อมูล ${users.length} คน เรียบร้อย`);
};

// Add button to filter bar:
<Button
  variant="outline"
  size="sm"
  onClick={() => exportToCSV(allUsers)}
  disabled={!allUsers || allUsers.length === 0}
>
  <Download className="h-4 w-4 mr-2" />
  ส่งออก CSV
</Button>
```

**Acceptance Criteria:**
- ✅ Export button appears
- ✅ CSV file downloads correctly
- ✅ Contains all user data
- ✅ Thai encoding works (UTF-8 BOM)
- ✅ Success toast shows

---

## 📚 Quick Start Guide

For developers implementing this plan:

### Getting Started

1. **Clone and Setup:**
```bash
git pull origin main
npm install
npm run prisma:generate
PORT=3010 npm run dev
```

2. **Create Feature Branch:**
```bash
git checkout -b feature/user-management
```

3. **Follow Implementation Order:**
- Day 1: Phase 1 (Hooks) + Phase 2 start (Types, Page setup)
- Day 2: Phase 2 complete (Filter bar, Table, Rows, Pagination)
- Day 3: Phase 3 (Create User Modal)
- Day 4: Phase 4 (Edit User Modal) + Bulk Actions + Export

4. **Test Frequently:**
```bash
# After each major step:
npm run dev
# Visit http://localhost:3010/users
# Test in React Query Devtools
```

5. **Commit Often:**
```bash
git add .
git commit -m "feat(users): implement [phase name]"
```

---

## 🎯 Success Metrics

**After completing all phases, verify:**

- [ ] **Functional**: All CRUD operations work
- [ ] **Performance**: Page loads < 1s, filters < 100ms
- [ ] **UX**: Optimistic updates, proper loading states
- [ ] **Permission**: Only authorized users can access
- [ ] **Testing**: All acceptance criteria passed
- [ ] **Documentation**: Code is commented and clear
- [ ] **Mobile**: Responsive on tablet/mobile
- [ ] **Accessibility**: Keyboard navigation works

---

## 📖 Additional Resources

- **Reference Implementation**: Project Management page (`src/components/projects/`)
- **Pattern Guide**: `OPTIMISTIC_UPDATE_PATTERN.md`
- **Permission Guide**: `PERMISSION_SYSTEM_REVIEW_2025-10-24.md`
- **API Documentation**: `migration_plan/02_API_MIGRATION.md`

---

**Document Version:** 1.0
**Part 2 of User Management Implementation Plan**
**Last Updated:** 2025-10-24