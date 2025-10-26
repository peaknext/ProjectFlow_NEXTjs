"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound, Loader2, ArrowLeft, Mail } from "lucide-react";

const requestResetSchema = z.object({
  email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
});

type RequestResetFormData = z.infer<typeof requestResetSchema>;

export default function RequestResetPage() {
  const { requestReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
  });

  const onSubmit = async (data: RequestResetFormData) => {
    setIsLoading(true);
    setSubmittedEmail(data.email);

    try {
      await requestReset(data.email);
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center w-full">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว
            </CardTitle>
            <CardDescription className="text-center">
              กรุณาตรวจสอบอีเมลของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200 text-center">
                เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยัง
                <br />
                <strong>{submittedEmail}</strong>
                <br />
                <span className="text-xs text-muted-foreground mt-2 block">
                  กรุณาตรวจสอบกล่องจดหมายของคุณ (รวมถึง Spam/Junk)
                </span>
              </p>
            </div>

            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ไม่ได้รับอีเมล?{" "}
              <button
                onClick={() => setIsSuccess(false)}
                className="text-primary hover:underline"
              >
                ส่งอีกครั้ง
              </button>
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
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <KeyRound className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">รีเซ็ตรหัสผ่าน</CardTitle>
          <CardDescription className="text-center">
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="E-mail address"
                autoComplete="email"
                {...register("email")}
                className={`h-[50px] text-base ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-[50px] text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังส่ง...
                </>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center mt-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>กลับไปหน้าเข้าสู่ระบบ</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
