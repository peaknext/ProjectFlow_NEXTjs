"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { serviceRequestKeys } from "@/hooks/use-service-requests";
import {
  itIssueRequestFormSchema,
  type ITIssueRequestFormData,
  urgencyLabels,
} from "@/lib/validations/service-request";

interface ITIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * IT Issue Request Form Modal
 *
 * Features:
 * - Subject and description fields
 * - Optional location field
 * - Urgency level selector
 * - Auto-filled requester information
 * - Success state with request number
 * - Redirect to tracking page after submission
 */
export function ITIssueModal({ open, onOpenChange }: ITIssueModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const form = useForm<ITIssueRequestFormData>({
    resolver: zodResolver(itIssueRequestFormSchema),
    defaultValues: {
      subject: "",
      description: "",
      urgency: "MEDIUM",
      location: "",
    },
  });

  const handleSubmit = async (data: ITIssueRequestFormData) => {
    setIsSubmitting(true);

    try {
      // Submit to API
      const response = await api.post<{
        request: {
          id: string;
          requestNumber: string;
          type: string;
          subject: string;
          status: string;
        };
      }>("/api/service-requests", {
        type: "IT_ISSUE",
        subject: data.subject,
        description: data.description,
        urgency: data.urgency,
        location: data.location || null,
      });

      // Invalidate queries to refresh request list
      queryClient.invalidateQueries({ queryKey: serviceRequestKeys.lists() });

      // Show success state
      setRequestNumber(response.request.requestNumber);
      setIsSuccess(true);

      toast({
        title: "ส่งคำร้องสำเร็จ",
        description: `หมายเลขคำร้อง: ${response.request.requestNumber}`,
      });

      // Redirect to tracking page after 2 seconds
      setTimeout(() => {
        router.push(`/it-service/${response.request.id}`);
        onOpenChange(false);
        setIsSuccess(false);
        form.reset();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.response?.data?.message || "ไม่สามารถส่งคำร้องได้",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
      setIsSuccess(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">ส่งคำร้องสำเร็จ</h3>
              <p className="text-muted-foreground">
                หมายเลขคำร้อง: <span className="font-mono font-semibold">{requestNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                กำลังเปลี่ยนเส้นทางไปหน้าติดตามงาน...
              </p>
            </div>
          </div>
        ) : (
          // Form State
          <>
            <DialogHeader>
              <DialogTitle>ฟอร์มแจ้งปัญหา IT</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลปัญหาที่พบ ข้อมูลผู้แจ้งจะถูกเติมอัตโนมัติ
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Requester Information (Read-only) */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <h4 className="font-semibold text-sm">ข้อมูลผู้แจ้งปัญหา</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">ชื่อ-สกุล:</span>
                      <p className="font-medium">{user?.fullName || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อีเมล:</span>
                      <p className="font-medium">{user?.email || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">หน่วยงาน:</span>
                      <p className="font-medium">{user?.department?.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">เบอร์โทร:</span>
                      <p className="font-medium">{user?.internalPhone || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หัวเรื่อง *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น: คอมพิวเตอร์เปิดไม่ติด, เครือข่ายขาดการเชื่อมต่อ"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ระบุหัวเรื่องปัญหาโดยสังเขป (5-200 ตัวอักษร)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียดปัญหา *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="อธิบายปัญหาที่พบโดยละเอียด เช่น อาการที่เกิดขึ้น, เวลาที่เกิดปัญหา, สิ่งที่ได้ลองทำไปแล้ว..."
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        อธิบายปัญหาให้ชัดเจนเพื่อให้สามารถแก้ไขได้อย่างรวดเร็ว (20-2,000 ตัวอักษร)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location (Optional) */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานที่</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น: ห้องทำงาน 201, แผนกผู้ป่วยนอก"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ระบุสถานที่ที่เกิดปัญหา (ถ้ามี)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Urgency */}
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ความเร่งด่วน *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกความเร่งด่วน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">
                            {urgencyLabels.LOW} - ไม่เร่งด่วน
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            {urgencyLabels.MEDIUM} - เร่งด่วนปานกลาง
                          </SelectItem>
                          <SelectItem value="HIGH">
                            {urgencyLabels.HIGH} - เร่งด่วน
                          </SelectItem>
                          <SelectItem value="CRITICAL">
                            {urgencyLabels.CRITICAL} - เร่งด่วนมาก (ระบบหยุด)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        เลือกระดับความเร่งด่วนตามผลกระทบของปัญหา
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้อง"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
