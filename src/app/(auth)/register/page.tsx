'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getCommonTitlePrefixes } from '@/lib/user-utils';

const registerSchema = z.object({
  titlePrefix: z.string().optional(),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  divisionId: z.string().min(1, 'กรุณาเลือกกลุ่มงาน'),
  departmentId: z.string().min(1, 'กรุณาเลือกหน่วยงาน'),
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็ก')
    .regex(/[0-9]/, 'ต้องมีตัวเลข')
    .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษ'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface Division {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const { register: registerUser, isRegistering } = useAuth();
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDivision, setSelectedDivision] = useState('');
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      divisionId: '',
      departmentId: '',
    },
  });

  const watchedPassword = watch('password', '');
  const watchedConfirmPassword = watch('confirmPassword', '');

  // Load divisions on mount
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const response = await fetch('/api/public/divisions');
        const data = await response.json();
        if (data.success) {
          setDivisions(data.data.divisions);
        }
      } catch (error) {
        console.error('Failed to load divisions:', error);
      } finally {
        setLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, []);

  // Load departments when division changes
  useEffect(() => {
    if (!selectedDivision) {
      setDepartments([]);
      setValue('departmentId', '');
      return;
    }

    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await fetch(`/api/public/departments?divisionId=${selectedDivision}`);
        const data = await response.json();
        if (data.success) {
          setDepartments(data.data.departments);
        }
      } catch (error) {
        console.error('Failed to load departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [selectedDivision, setValue]);

  // Password strength calculation (exact GAS logic)
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

  const strength = checkPasswordStrength(watchedPassword);

  // Requirements check (exact GAS logic)
  const requirements = {
    length: watchedPassword.length >= 8,
    case: /[a-z]/.test(watchedPassword) && /[A-Z]/.test(watchedPassword),
    number: /\d/.test(watchedPassword),
    special: /[^A-Za-z0-9]/.test(watchedPassword),
  };

  // Strength meter colors and widths (exact GAS logic)
  const getStrengthMeter = () => {
    switch (strength) {
      case 1:
        return { width: '25%', color: '#ef4444', text: 'อ่อนแอ' };
      case 2:
        return { width: '50%', color: '#f97316', text: 'พอใช้' };
      case 3:
        return { width: '75%', color: '#eab308', text: 'ดี' };
      case 4:
        return { width: '100%', color: '#22c55e', text: 'ปลอดภัย' };
      default:
        return { width: '0%', color: 'transparent', text: '' };
    }
  };

  const meter = getStrengthMeter();

  // Password match validation
  const passwordsMatch = watchedPassword && watchedConfirmPassword && watchedPassword === watchedConfirmPassword;
  const passwordsDontMatch = watchedConfirmPassword && watchedPassword !== watchedConfirmPassword;

  const onSubmit = (data: RegisterFormData) => {
    registerUser({
      titlePrefix: data.titlePrefix,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      departmentId: data.departmentId,
    });
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-3xl mx-auto p-8 space-y-6 bg-card backdrop-blur-sm rounded-xl shadow-2xl border border-border">
        {/* Logo + Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size={16} marginRight={4} />
            <h1 className="text-3xl sm:text-4xl font-bold">
              สร้างบัญชีใหม่
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            กรุณากรอกข้อมูลเพื่อสมัครใช้งาน ProjectFlows
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Title Prefix (Full width) */}
          <div>
            <label htmlFor="titlePrefix" className="block text-sm font-medium mb-1">
              คำนำหน้าชื่อ (ถ้ามี)
            </label>
            <select
              id="titlePrefix"
              {...register('titlePrefix')}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-ring focus:border-ring transition-colors text-sm sm:text-base"
            >
              <option value="">-- ไม่ระบุ --</option>
              {getCommonTitlePrefixes().map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* First Name + Last Name */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                ชื่อ <span className="text-destructive">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                placeholder="เช่น สมชาย"
                autoComplete="given-name"
                {...register('firstName')}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-ring focus:border-ring transition-colors text-sm sm:text-base"
              />
              <p className="text-sm text-destructive mt-1 h-4">{errors.firstName?.message || ''}</p>
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                นามสกุล <span className="text-destructive">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                placeholder="เช่น ใจดี"
                autoComplete="family-name"
                {...register('lastName')}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-ring focus:border-ring transition-colors text-sm sm:text-base"
              />
              <p className="text-sm text-destructive mt-1 h-4">{errors.lastName?.message || ''}</p>
            </div>
          </div>

          {/* Email (Full width) */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              อีเมล <span className="text-destructive">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="กรอกอีเมล"
              autoComplete="email"
              {...register('email')}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-ring focus:border-ring transition-colors text-sm sm:text-base"
            />
            <p className="text-sm text-destructive mt-1 h-4">{errors.email?.message || ''}</p>
          </div>

          {/* Division + Department */}
          <div className="grid grid-cols-2 gap-4">
            {/* Division */}
            <div>
              <label htmlFor="divisionId" className="block text-sm font-medium mb-1">
                กลุ่มงาน
              </label>
              <div className="relative">
                <select
                  id="divisionId"
                  {...register('divisionId')}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    setValue('divisionId', e.target.value);
                  }}
                  disabled={loadingDivisions}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground focus:ring-blue-600 focus:border-blue-600 transition-colors text-sm sm:text-base disabled:opacity-50"
                >
                  <option value="">เลือกกลุ่มงาน...</option>
                  {divisions.map((division) => (
                    <option key={division.id} value={division.id}>{division.name}</option>
                  ))}
                </select>
                {loadingDivisions && (
                  <div className="absolute top-1/2 right-10 -translate-y-1/2">
                    <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
              <p className="text-sm text-destructive mt-1 h-4">{errors.divisionId?.message || ''}</p>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="departmentId" className="block text-sm font-medium mb-1">
                หน่วยงาน
              </label>
              <div className="relative">
                <select
                  id="departmentId"
                  {...register('departmentId')}
                  disabled={!selectedDivision || loadingDepartments}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground focus:ring-blue-600 focus:border-blue-600 transition-colors text-sm sm:text-base disabled:opacity-50"
                >
                  <option value="">เลือกหน่วยงาน...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {loadingDepartments && (
                  <div className="absolute top-1/2 right-10 -translate-y-1/2">
                    <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                  </div>
                )}
              </div>
              <p className="text-sm text-destructive mt-1 h-4">{errors.departmentId?.message || ''}</p>
            </div>
          </div>

          {/* Password with Popover */}
          <div className="relative pt-2">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                รหัสผ่าน
              </label>
              <input
                id="password"
                type="password"
                placeholder="ตั้งรหัสผ่านของคุณ"
                autoComplete="new-password"
                {...register('password')}
                onFocus={() => setShowPopover(true)}
                onBlur={() => setShowPopover(false)}
                className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:ring-ring focus:border-ring transition-colors text-sm sm:text-base"
              />
            </div>

            {/* Password Popover - ด้านขวาของ input */}
            <div
              className={`absolute left-full top-0 ml-4 w-72 z-10 transition-all duration-200 ease-in-out ${
                showPopover ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <div className="bg-popover rounded-lg shadow-xl border border-border p-4 relative">
                {/* Arrow pointing left */}
                <div className="absolute top-1/2 -left-2 w-4 h-4 bg-popover transform -translate-y-1/2 rotate-45 border-l border-b border-border"></div>

                <p className="text-sm font-semibold text-popover-foreground mb-2">
                  รหัสผ่านควรประกอบด้วย:
                </p>
                <ul className="space-y-1 text-sm">
                  <li className={`flex items-center transition-colors ${requirements.length ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                      {requirements.length ? '✓' : '○'}
                    </span>
                    <span>อย่างน้อย 8 ตัวอักษร</span>
                  </li>
                  <li className={`flex items-center transition-colors ${requirements.case ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                      {requirements.case ? '✓' : '○'}
                    </span>
                    <span>มีตัวพิมพ์เล็กและใหญ่ (a-Z)</span>
                  </li>
                  <li className={`flex items-center transition-colors ${requirements.number ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                      {requirements.number ? '✓' : '○'}
                    </span>
                    <span>มีตัวเลขอย่างน้อย 1 ตัว (0-9)</span>
                  </li>
                  <li className={`flex items-center transition-colors ${requirements.special ? 'text-green-500' : 'text-muted-foreground'}`}>
                    <span className="w-5 h-5 mr-2 flex items-center justify-center">
                      {requirements.special ? '✓' : '○'}
                    </span>
                    <span>มีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$)</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="mt-2 space-y-2">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 ease-in-out"
                  style={{
                    width: meter.width,
                    backgroundColor: meter.color,
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground h-4">
                {meter.text}
              </p>
            </div>

            {/* Confirm Password */}
            <div className="mt-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="กรอกรหัสผ่านอีกครั้ง"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-foreground placeholder-gray-400 dark:placeholder-gray-500 focus:ring-blue-600 focus:border-blue-600 transition-colors text-sm sm:text-base"
                />
                {/* Confirmation Icon */}
                {watchedConfirmPassword && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    {passwordsMatch ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : passwordsDontMatch ? (
                      <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : null}
                  </span>
                )}
              </div>
              {/* Password Match Feedback */}
              <p className={`text-xs mt-1 h-4 ${passwordsMatch ? 'text-green-500' : passwordsDontMatch ? 'text-destructive' : ''}`}>
                {passwordsMatch ? 'รหัสผ่านตรงกัน' : passwordsDontMatch ? 'รหัสผ่านไม่ตรงกัน' : ''}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isRegistering}
              className="w-full h-[50px] text-base"
            >
              {isRegistering && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ลงทะเบียน
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground">
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
