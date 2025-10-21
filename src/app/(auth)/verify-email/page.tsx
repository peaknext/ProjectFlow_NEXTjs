'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendVerification } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userEmail = searchParams.get('email');

    if (userEmail) {
      setEmail(userEmail);
    }

    if (!token) {
      setStatus('error');
      return;
    }

    // Auto-verify on mount
    verifyEmail(token);
    setStatus('success');
  }, [searchParams, verifyEmail]);

  const handleResend = () => {
    if (email) {
      resendVerification(email);
    }
  };

  return (
    <div className="flex items-center justify-center w-full">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            status === 'loading' ? 'bg-blue-500' :
            status === 'success' ? 'bg-green-500' :
            'bg-red-500'
          }`}>
            {status === 'loading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-6 h-6 text-white" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-white" />}
          </div>
        </div>
        <CardTitle className="text-2xl text-center">
          {status === 'loading' && 'กำลังยืนยันอีเมล...'}
          {status === 'success' && 'ยืนยันอีเมลสำเร็จ!'}
          {status === 'error' && 'ยืนยันอีเมลไม่สำเร็จ'}
        </CardTitle>
        <CardDescription className="text-center">
          {status === 'loading' && 'กรุณารอสักครู่...'}
          {status === 'success' && 'บัญชีของคุณได้รับการยืนยันแล้ว'}
          {status === 'error' && 'ลิงก์ยืนยันอีเมลหมดอายุหรือไม่ถูกต้อง'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'success' && (
          <>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200 text-center">
                คุณสามารถเข้าสู่ระบบได้แล้ว
                <br />
                <span className="text-xs text-muted-foreground">
                  กำลังนำคุณไปหน้าเข้าสู่ระบบ...
                </span>
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href="/login">
                ไปหน้าเข้าสู่ระบบ
              </Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 text-center">
                ลิงก์ยืนยันอีเมลอาจหมดอายุหรือไม่ถูกต้อง
                <br />
                กรุณาขอส่งลิงก์ใหม่อีกครั้ง
              </p>
            </div>

            {email && (
              <Button
                onClick={handleResend}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                ส่งลิงก์ยืนยันอีกครั้ง
              </Button>
            )}

            <Button asChild variant="default" className="w-full">
              <Link href="/login">
                กลับไปหน้าเข้าสู่ระบบ
              </Link>
            </Button>
          </>
        )}
      </CardContent>
      </Card>
    </div>
  );
}
