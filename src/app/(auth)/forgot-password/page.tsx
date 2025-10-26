"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api-client";

const forgotPasswordSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setError(null);

      // Call API to request password reset
      await api.post("/api/auth/request-reset", {
        email: data.email,
      });

      // Show success message
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Failed to send reset email:", err);
      setError(
        err.response?.data?.error?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      );
    }
  };

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
              ส่งลิงก์แล้ว!
            </CardTitle>
            <CardDescription className="text-center">
              เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว
              <br />
              กรุณาตรวจสอบกล่องจดหมายของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 <strong>ในโหมด Development:</strong>{" "}
                  ลิงก์รีเซ็ตรหัสผ่านจะแสดงใน console ของ server
                </p>
              </div>

              <Link href="/login">
                <Button className="w-full h-[50px] text-base">
                  กลับไปหน้าเข้าสู่ระบบ
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
              <KeyRound className="w-6 h-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">ลืมรหัสผ่าน?</CardTitle>
          <CardDescription className="text-center">
            กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านให้คุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

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
                placeholder="E-mail address"
                autoComplete="email"
                {...register("email")}
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
