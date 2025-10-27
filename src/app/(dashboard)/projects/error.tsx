"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Projects page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
        error
      </span>
      <h2 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {error.message || "ไม่สามารถโหลดหน้าจัดการโปรเจกต์ได้"}
      </p>
      <Button onClick={reset}>ลองใหม่อีกครั้ง</Button>
    </div>
  );
}
