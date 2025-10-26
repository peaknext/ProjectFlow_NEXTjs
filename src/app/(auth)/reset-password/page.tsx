'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api-client';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState(false);
  const [showPopover, setShowPopover] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchedPassword = watch('password', '');
  const watchedConfirmPassword = watch('confirmPassword', '');

  useEffect(() => {
    const resetToken = searchParams.get('token');

    if (!resetToken) {
      setTokenError(true);
      return;
    }

    setToken(resetToken);
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setTokenError(true);
      return;
    }

    try {
      setError(null);

      // Call API to reset password
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: data.password,
      });

      // Show success message
      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Failed to reset password:', err);
      const errorMessage = err.response?.data?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';

      // Check if token is expired or invalid
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('หมดอายุ')) {
        setTokenError(true);
      } else {
        setError(errorMessage);
      }
    }
  };

  // Password strength calculation (from register page)
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

  // Requirements check (from register page)
  const requirements = {
    length: watchedPassword.length >= 8,
    case: /[a-z]/.test(watchedPassword) && /[A-Z]/.test(watchedPassword),
    number: /\d/.test(watchedPassword),
    special: /[^A-Za-z0-9]/.test(watchedPassword),
  };

  // Strength meter colors and widths (from register page)
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

  // Password match validation (from register page)
  const passwordsMatch = watchedPassword && watchedConfirmPassword && watchedPassword === watchedConfirmPassword;
  const passwordsDontMatch = watchedConfirmPassword && watchedPassword !== watchedConfirmPassword;

  // Show token error
  if (tokenError) {
    return (
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-500">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              ลิงก์ไม่ถูกต้อง
            </CardTitle>
            <CardDescription className="text-center">
              ลิงก์รีเซ็ตรหัสผ่านหมดอายุหรือไม่ถูกต้อง
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200 text-center">
                  กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง
                  <br />
                  ลิงก์มีอายุ 1 ชั่วโมง
                </p>
              </div>

              <Link href="/forgot-password">
                <Button className="w-full h-[50px] text-base">
                  ขอลิงก์รีเซ็ตรหัสผ่านใหม่
                </Button>
              </Link>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                >
                  <span>←</span>
                  <span>กลับไปหน้าเข้าสู่ระบบ</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              เปลี่ยนรหัสผ่านสำเร็จ!
            </CardTitle>
            <CardDescription className="text-center">
              รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว
              <br />
              กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  ✓ คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
                </p>
              </div>

              <Link href="/login">
                <Button className="w-full h-[50px] text-base">
                  ไปยังหน้าเข้าสู่ระบบ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            ตั้งรหัสผ่านใหม่
          </CardTitle>
          <CardDescription className="text-center">
            กรอกรหัสผ่านใหม่สำหรับบัญชีของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Password with Popover */}
            <div className="relative">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                >
                  รหัสผ่านใหม่
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('password')}
                  onFocus={() => setShowPopover(true)}
                  onBlur={() => setTimeout(() => setShowPopover(false), 200)}
                  className="h-[50px] text-base"
                />
              </div>

              {/* Password Popover - ด้านขวาของ input */}
              <div
                className={`absolute left-full top-0 ml-4 w-72 z-10 transition-all duration-200 ease-in-out ${
                  showPopover ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow-xl border dark:border-gray-600 p-4 relative">
                  {/* Arrow pointing left */}
                  <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white dark:bg-gray-700 transform -translate-y-1/2 rotate-45 border-l border-b dark:border-gray-600"></div>

                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    รหัสผ่านควรประกอบด้วย:
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li className={`flex items-center transition-colors ${requirements.length ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.length ? '✓' : '○'}
                      </span>
                      <span>อย่างน้อย 8 ตัวอักษร</span>
                    </li>
                    <li className={`flex items-center transition-colors ${requirements.case ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.case ? '✓' : '○'}
                      </span>
                      <span>มีตัวพิมพ์เล็กและใหญ่ (a-Z)</span>
                    </li>
                    <li className={`flex items-center transition-colors ${requirements.number ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      <span className="w-5 h-5 mr-2 flex items-center justify-center">
                        {requirements.number ? '✓' : '○'}
                      </span>
                      <span>มีตัวเลขอย่างน้อย 1 ตัว (0-9)</span>
                    </li>
                    <li className={`flex items-center transition-colors ${requirements.special ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
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
                <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 ease-in-out"
                    style={{
                      width: meter.width,
                      backgroundColor: meter.color,
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 h-4">
                  {meter.text}
                </p>
              </div>
            </div>

            {/* Confirm Password with Real-time Matching */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="h-[50px] text-base pr-10"
                />
                {/* Confirmation Icon */}
                {watchedConfirmPassword && (
                  <span className="absolute top-1/2 right-3 -translate-y-1/2">
                    {passwordsMatch ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : passwordsDontMatch ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : null}
                  </span>
                )}
              </div>
              {/* Password Match Feedback */}
              <p className={`text-xs mt-1 h-4 ${passwordsMatch ? 'text-green-500' : passwordsDontMatch ? 'text-red-500' : ''}`}>
                {passwordsMatch ? 'รหัสผ่านตรงกัน' : passwordsDontMatch ? 'รหัสผ่านไม่ตรงกัน' : ''}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-[50px] text-base"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              ตั้งรหัสผ่านใหม่
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              <span>←</span>
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
