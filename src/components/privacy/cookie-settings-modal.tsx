"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cookie, Check, AlertTriangle } from "lucide-react";
import { usePrivacyConsent, PrivacyConsent } from "@/hooks/use-privacy-consent";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CookieSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function CookieSettingsModal({ open, onClose }: CookieSettingsModalProps) {
  const { consent, acceptWithSettings } = usePrivacyConsent();

  const [settings, setSettings] = useState<PrivacyConsent['cookieSettings']>({
    necessary: true,
    analytics: consent?.cookieSettings.analytics ?? false,
    functional: consent?.cookieSettings.functional ?? false,
  });

  const handleToggle = (key: keyof PrivacyConsent['cookieSettings']) => {
    if (key === 'necessary') return; // Cannot toggle necessary cookies

    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    acceptWithSettings(settings);
    onClose();
  };

  const handleAcceptAll = () => {
    const allEnabled = {
      necessary: true,
      analytics: true,
      functional: true,
    };
    setSettings(allEnabled);
    acceptWithSettings(allEnabled);
    onClose();
  };

  const handleDeclineOptional = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      functional: false,
    };
    setSettings(onlyNecessary);
    acceptWithSettings(onlyNecessary);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Cookie className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl">ตั้งค่าคุกกี้</DialogTitle>
              <DialogDescription className="mt-1">
                จัดการการตั้งค่าคุกกี้ตามความต้องการของคุณ
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[500px] px-6 py-4">
          <div className="space-y-6">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                คุกกี้ที่จำเป็นจะเปิดใช้งานอยู่เสมอ เนื่องจากจำเป็นต่อการทำงานของระบบ
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label className="text-base font-semibold">
                        คุกกี้ที่จำเป็น
                      </Label>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                        จำเป็น
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      คุกกี้เหล่านี้มีความจำเป็นต่อการทำงานของระบบ ไม่สามารถปิดได้
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={settings.necessary}
                        disabled
                        className="data-[state=checked]:bg-green-600"
                      />
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 ml-1">
                  <div className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-muted rounded">sessionToken</code>
                    <span>- Session สำหรับการเข้าสู่ระบบ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-muted rounded">privacy_consent</code>
                    <span>- การยินยอมนโยบายความเป็นส่วนตัว</span>
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label
                        htmlFor="functional-cookies"
                        className="text-base font-semibold cursor-pointer"
                      >
                        คุกกี้เพื่อการทำงาน
                      </Label>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                        เลือกได้
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ช่วยปรับปรุงประสบการณ์การใช้งาน เช่น จดจำธีม, การตั้งค่า UI, โหมดการแสดงผล
                    </p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      id="functional-cookies"
                      checked={settings.functional}
                      onCheckedChange={() => handleToggle('functional')}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 ml-1">
                  <div className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-muted rounded">theme</code>
                    <span>- ธีมสีที่เลือก (สว่าง/มืด)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-muted rounded">ui_preferences</code>
                    <span>- การตั้งค่า UI (ซ่อน/แสดงงานปิด, การจัดเรียง)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-1.5 py-0.5 bg-muted rounded">view_mode</code>
                    <span>- โหมดการแสดงผล (Board/List/Calendar)</span>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Label
                        htmlFor="analytics-cookies"
                        className="text-base font-semibold cursor-pointer"
                      >
                        คุกกี้เพื่อการวิเคราะห์
                      </Label>
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs font-medium">
                        เลือกได้
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ช่วยให้เราเข้าใจว่าผู้ใช้ใช้งานระบบอย่างไร เพื่อปรับปรุงและพัฒนา
                    </p>
                  </div>
                  <div className="ml-4">
                    <Switch
                      id="analytics-cookies"
                      checked={settings.analytics}
                      onCheckedChange={() => handleToggle('analytics')}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground ml-1">
                  <ul className="space-y-1 list-disc list-inside">
                    <li>การติดตามการใช้งานฟีเจอร์ต่างๆ</li>
                    <li>เวลาที่ใช้ในแต่ละหน้า</li>
                    <li>อัตราการทำงานสำเร็จ/ล้มเหลว</li>
                  </ul>
                  <p className="mt-2 text-yellow-600 dark:text-yellow-400">
                    ⚠️ ยังไม่ได้ใช้งานในเวอร์ชันปัจจุบัน
                  </p>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <p>
                <strong>หมายเหตุ:</strong> การเปลี่ยนแปลงการตั้งค่าจะมีผลทันที
                และการยินยอมจะมีอายุ 15 วัน เมื่อเข้าสู่ระบบสำเร็จจะต่ออายุอัตโนมัติอีก 15 วัน
              </p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
          <Button
            variant="outline"
            onClick={handleDeclineOptional}
            className="flex-1 sm:flex-none"
          >
            ปฏิเสธทั้งหมด
          </Button>
          <div className="flex gap-2 flex-1">
            <Button
              variant="outline"
              onClick={handleAcceptAll}
              className="flex-1"
            >
              ยอมรับทั้งหมด
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-2" />
              บันทึก
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
