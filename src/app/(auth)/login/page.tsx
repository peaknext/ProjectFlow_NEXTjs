"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();

  // Local state for persistent error (recommended by TanStack Query for forms)
  const [displayError, setDisplayError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Capture error from mutation and store in local state
  const errorJustSetRef = useRef(false);

  useEffect(() => {
    if (loginError) {
      const errorMessage = (loginError as any)?.response?.data?.message ||
                          'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง';
      setDisplayError(errorMessage);
      errorJustSetRef.current = true; // Mark that error was just set
    }
  }, [loginError]);

  // Watch form values and clear error when user types
  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Store previous values to detect actual changes
  const prevEmailRef = useRef<string | undefined>(undefined);
  const prevPasswordRef = useRef<string | undefined>(undefined);

  useEffect(() => {

    // Skip clearing error if it was just set (first render after error)
    if (errorJustSetRef.current) {
      errorJustSetRef.current = false;
      prevEmailRef.current = emailValue;
      prevPasswordRef.current = passwordValue;
      return;
    }

    // Only clear error if values actually changed (user is typing)
    const emailChanged = emailValue !== prevEmailRef.current;
    const passwordChanged = passwordValue !== prevPasswordRef.current;


    if (displayError && (emailChanged || passwordChanged)) {
      setDisplayError(null);
    }

    // Update previous values
    prevEmailRef.current = emailValue;
    prevPasswordRef.current = passwordValue;
  }, [emailValue, passwordValue, displayError]);

  const onSubmit = (data: LoginFormData) => {
    // Clear error before submitting
    setDisplayError(null);

    login({
      email: data.email,
      password: data.password,
    });
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Logo + Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size={16} marginRight={3} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ProjectFlows
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            ยินดีต้อนรับ! กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="login-email">อีเมล</Label>
            <Input
              id="login-email"
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="login-password">รหัสผ่าน</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register("password")}
              className="h-[50px] text-base"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              href="/request-reset"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              ลืมรหัสผ่าน?
            </Link>
          </div>

          {/* Login Error Alert */}
          {displayError && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {displayError}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-[50px] text-base"
          >
            {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            เข้าสู่ระบบ
          </Button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            ลงทะเบียน
          </Link>
        </p>
      </div>
    </div>
  );
}
