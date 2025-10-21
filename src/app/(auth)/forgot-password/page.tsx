'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, KeyRound } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // TODO: Implement forgot password logic
    console.log('Forgot password:', data);
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="flex items-center justify-center w-full">
      <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-500">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center">
          ลืมรหัสผ่าน?
        </CardTitle>
        <CardDescription className="text-center">
          กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="forgot-email"
              className="block text-sm font-medium"
            >
              อีเมล
            </label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="your.email@hospital.test"
              autoComplete="email"
              {...register('email')}
              className="h-[50px] text-base"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
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
            ส่งลิงก์รีเซ็ตรหัสผ่าน
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
