/**
 * Users Page Error Boundary
 * Shows error message when page fails to load
 */

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Users page error:', error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="text-center space-y-4 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
          <p className="text-muted-foreground">
            ไม่สามารถโหลดข้อมูลผู้ใช้ได้
          </p>

          {error.message && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={reset} variant="default">
            ลองใหม่อีกครั้ง
          </Button>
          <Button onClick={() => window.location.href = '/dashboard'} variant="outline">
            กลับหน้าหลัก
          </Button>
        </div>
      </div>
    </div>
  );
}
