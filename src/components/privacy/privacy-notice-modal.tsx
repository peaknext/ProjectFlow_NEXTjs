"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Cookie, FileText, Settings } from "lucide-react";
import { CookieSettingsModal } from "./cookie-settings-modal";

interface PrivacyNoticeModalProps {
  open: boolean;
  onAcceptAll: () => void;
  onDeclineOptional: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export function PrivacyNoticeModal({
  open,
  onAcceptAll,
  onDeclineOptional,
  onClose,
  canClose = false,
}: PrivacyNoticeModalProps) {
  const [showCookieSettings, setShowCookieSettings] = useState(false);

  const handleOpenCookieSettings = () => {
    setShowCookieSettings(true);
  };

  const handleCloseCookieSettings = () => {
    setShowCookieSettings(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={canClose ? onClose : undefined}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-3xl max-h-[95vh] sm:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl md:text-2xl leading-tight">
                  ประกาศความเป็นส่วนตัวและการใช้คุกกี้
                </DialogTitle>
                <DialogDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                  กรุณาอ่านและยอมรับนโยบายก่อนเข้าใช้งานระบบ
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="privacy" className="flex-1 overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                <TabsTrigger value="privacy" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">นโยบายความเป็นส่วนตัว</span>
                </TabsTrigger>
                <TabsTrigger value="cookies" className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
                  <Cookie className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">นโยบายคุกกี้</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[300px] sm:h-[400px] px-4 sm:px-6 py-3 sm:py-4 flex-1">
              <TabsContent value="privacy" className="mt-0 space-y-4 text-sm">
                <section>
                  <h3 className="font-semibold text-base mb-2">1. ข้อมูลที่เราเก็บรวบรวม</h3>
                  <p className="text-muted-foreground mb-3">
                    เราเก็บรวบรวมข้อมูลส่วนบุคคลของคุณเพื่อการใช้งานระบบจัดการโปรเจกต์และงานภายในองค์กร ดังนี้:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>ข้อมูลส่วนตัว: ชื่อ-นามสกุล, อีเมล, คำนำหน้าชื่อ, รูปโปรไฟล์</li>
                    <li>ข้อมูลการทำงาน: ตำแหน่งงาน, หน่วยงาน, กลุ่มงาน, เบอร์โทรภายใน, สถานที่ปฏิบัติงาน</li>
                    <li>ข้อมูลการใช้งาน: บันทึกกิจกรรม, การเข้าสู่ระบบ, การจัดการงานและโปรเจกต์</li>
                    <li>ข้อมูลเทคนิค: IP Address, Browser Type, เวลาการเข้าใช้งาน</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">2. วัตถุประสงค์การใช้ข้อมูล</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>การจัดการบัญชีผู้ใช้และการยืนยันตัวตน</li>
                    <li>การมอบหมายงานและติดตามความคืบหน้าโปรเจกต์</li>
                    <li>การแจ้งเตือนและการสื่อสารภายในทีม</li>
                    <li>การสร้างรายงานและวิเคราะห์ประสิทธิภาพการทำงาน</li>
                    <li>การปรับปรุงและพัฒนาระบบ</li>
                    <li>การรักษาความปลอดภัยและป้องกันการใช้งานที่ไม่เหมาะสม</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">3. การเก็บรักษาและรักษาความปลอดภัย</h3>
                  <p className="text-muted-foreground mb-2">
                    เราใช้มาตรการรักษาความปลอดภัยระดับสูงในการปกป้องข้อมูลของคุณ:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>รหัสผ่านเข้ารหัสด้วย bcrypt (ไม่สามารถอ่านได้)</li>
                    <li>การเชื่อมต่อผ่าน HTTPS (SSL/TLS)</li>
                    <li>Session Token แบบ httpOnly Cookie (ป้องกัน XSS)</li>
                    <li>CSRF Protection และ CORS Policy</li>
                    <li>Rate Limiting และ Input Sanitization</li>
                    <li>การควบคุมสิทธิ์การเข้าถึงตามบทบาท (RBAC)</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">4. การแบ่งปันข้อมูล</h3>
                  <p className="text-muted-foreground">
                    ข้อมูลของคุณจะถูกใช้เฉพาะภายในองค์กรเท่านั้น และจะไม่ถูกเปิดเผยต่อบุคคลภายนอก
                    เว้นแต่จะได้รับความยินยอมจากคุณหรือเป็นไปตามที่กฎหมายกำหนด
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">5. สิทธิของเจ้าของข้อมูล</h3>
                  <p className="text-muted-foreground mb-2">คุณมีสิทธิ์:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                    <li>เข้าถึงและขอสำเนาข้อมูลส่วนบุคคลของคุณ</li>
                    <li>ขอแก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์</li>
                    <li>ขอลบหรือระงับการใช้ข้อมูล (ในกรณีที่ไม่กระทบต่อการทำงาน)</li>
                    <li>คัดค้านการประมวลผลข้อมูล</li>
                    <li>ขอถ่ายโอนข้อมูล</li>
                  </ul>
                  <p className="text-muted-foreground mt-2">
                    ติดต่อผู้ดูแลระบบ (ADMIN) เพื่อใช้สิทธิ์ดังกล่าว
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">6. ระยะเวลาเก็บรักษาข้อมูล</h3>
                  <p className="text-muted-foreground">
                    ข้อมูลจะถูกเก็บรักษาตราบเท่าที่คุณยังคงเป็นพนักงาน และเป็นเวลา 7 วัน
                    หลังจากบัญชีถูกปิดใช้งาน หรือตามที่กฎหมายกำหนด
                    (ข้อมูลจะถูก Soft Delete และลบถาวรหลัง 7 วัน)
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">7. การติดต่อ</h3>
                  <p className="text-muted-foreground">
                    หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัว กรุณาติดต่อผู้ดูแลระบบ
                  </p>
                </section>

                <section className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground italic">
                    นโยบายฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่ 28 ตุลาคม 2568<br />
                    เวอร์ชัน 1.0 | อัปเดตล่าสุด: 28 ตุลาคม 2568
                  </p>
                </section>
              </TabsContent>

              <TabsContent value="cookies" className="mt-0 space-y-4 text-sm">
                <section>
                  <h3 className="font-semibold text-base mb-2">คุกกี้คืออะไร?</h3>
                  <p className="text-muted-foreground">
                    คุกกี้ (Cookies) คือไฟล์ข้อความขนาดเล็กที่ถูกจัดเก็บในอุปกรณ์ของคุณเมื่อเข้าชมเว็บไซต์
                    เพื่อช่วยให้เว็บไซต์สามารถจดจำข้อมูลของคุณและปรับปรุงประสบการณ์การใช้งาน
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">คุกกี้ที่เราใช้</h3>

                  <div className="space-y-3 mt-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                          จำเป็น
                        </span>
                        คุกกี้ที่จำเป็น (Necessary Cookies)
                      </h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        คุกกี้เหล่านี้มีความจำเป็นต่อการทำงานของระบบ ไม่สามารถปิดได้
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground ml-2">
                        <li><code className="bg-muted px-1 rounded">sessionToken</code> - เก็บ Session สำหรับการเข้าสู่ระบบ (httpOnly, secure, อายุ 7 วัน)</li>
                        <li><code className="bg-muted px-1 rounded">privacy_consent</code> - เก็บการยินยอมนโยบายความเป็นส่วนตัว (อายุ 15 วัน)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          เลือกได้
                        </span>
                        คุกกี้เพื่อการทำงาน (Functional Cookies)
                      </h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        คุกกี้เหล่านี้ช่วยปรับปรุงประสบการณ์การใช้งาน
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground ml-2">
                        <li><code className="bg-muted px-1 rounded">theme</code> - เก็บธีมที่เลือก (สว่าง/มืด)</li>
                        <li><code className="bg-muted px-1 rounded">ui_preferences</code> - การตั้งค่า UI (ซ่อน/แสดงงานปิด, การจัดเรียง)</li>
                        <li><code className="bg-muted px-1 rounded">view_mode</code> - โหมดการแสดงผล (Board/List/Calendar)</li>
                      </ul>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-1 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded text-xs">
                          เลือกได้
                        </span>
                        คุกกี้เพื่อการวิเคราะห์ (Analytics Cookies)
                      </h4>
                      <p className="text-muted-foreground text-xs mb-2">
                        คุกกี้เหล่านี้ช่วยให้เราเข้าใจว่าผู้ใช้ใช้งานระบบอย่างไร เพื่อปรับปรุงและพัฒนา
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs text-muted-foreground ml-2">
                        <li>การติดตามการใช้งานฟีเจอร์ต่างๆ</li>
                        <li>เวลาที่ใช้ในแต่ละหน้า</li>
                        <li>อัตราการทำงานสำเร็จ/ล้มเหลว</li>
                        <li className="text-yellow-600 dark:text-yellow-400">⚠️ ยังไม่ได้ใช้งานในเวอร์ชันปัจจุบัน</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">การจัดการคุกกี้</h3>
                  <p className="text-muted-foreground mb-2">
                    คุณสามารถจัดการการตั้งค่าคุกกี้ได้ผ่านปุ่ม "ตั้งค่าคุกกี้" ด้านล่าง
                  </p>
                  <p className="text-muted-foreground text-xs">
                    <strong>หมายเหตุ:</strong> การปิดคุกกี้ที่จำเป็นจะทำให้ไม่สามารถใช้งานระบบได้
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-base mb-2">ระยะเวลาการยินยอม</h3>
                  <p className="text-muted-foreground">
                    การยอมรับนโยบายคุกกี้จะมีอายุ <strong>15 วัน</strong> หากคุณไม่เข้าใช้งานระบบ
                    หลังจากนั้นจะต้องยอมรับนโยบายอีกครั้ง
                  </p>
                  <p className="text-muted-foreground mt-2">
                    เมื่อคุณเข้าสู่ระบบสำเร็จ ระยะเวลาการยินยอมจะ<strong>ต่ออายุอัตโนมัติ</strong>อีก 15 วัน
                  </p>
                </section>

                <section className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground italic">
                    นโยบายคุกกี้ฉบับนี้มีผลบังคับใช้ตั้งแต่วันที่ 28 ตุลาคม 2568<br />
                    เวอร์ชัน 1.0 | อัปเดตล่าสุด: 28 ตุลาคม 2568
                  </p>
                </section>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/30 flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleOpenCookieSettings}
              className="flex-1 sm:flex-none gap-1 sm:gap-2 min-h-[44px] text-sm"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">ตั้งค่าคุกกี้</span>
            </Button>
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={onDeclineOptional}
                className="flex-1 min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">ยอมรับเฉพาะที่จำเป็น</span>
              </Button>
              <Button
                onClick={onAcceptAll}
                className="flex-1 min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
              >
                <span className="truncate">ยอมรับทั้งหมด</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CookieSettingsModal
        open={showCookieSettings}
        onClose={handleCloseCookieSettings}
      />
    </>
  );
}
