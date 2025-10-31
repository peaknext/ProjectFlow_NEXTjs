"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Server, Network } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { serviceRequestKeys } from "@/hooks/use-service-requests";
import {
  hardwareNetworkRequestFormSchema,
  type HardwareNetworkRequestFormData,
  urgencyLabels,
} from "@/lib/validations/service-request";

interface HardwareNetworkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Hardware/Network Request Form Modal
 *
 * Features:
 * - Request type selection (Hardware or Network)
 * - Subject and description fields
 * - Urgency level selector
 * - Optional location field
 * - Auto-filled requester information
 * - Success state with request number
 * - Redirect to tracking page after submission
 */
export function HardwareNetworkModal({
  open,
  onOpenChange,
}: HardwareNetworkModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const form = useForm<HardwareNetworkRequestFormData>({
    resolver: zodResolver(hardwareNetworkRequestFormSchema),
    defaultValues: {
      type: "HARDWARE",
      subject: "",
      description: "",
      urgency: "MEDIUM",
      location: "",
    },
  });

  const selectedType = form.watch("type");

  const handleSubmit = async (data: HardwareNetworkRequestFormData) => {
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
        type: data.type,
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        {isSuccess ? (
          // Success State
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">ส่งคำร้องสำเร็จ</h3>
              <p className="text-muted-foreground">
                หมายเลขคำร้อง:{" "}
                <span className="font-mono font-semibold">{requestNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                กำลังเปลี่ยนเส้นทางไปหน้าติดตามงาน...
              </p>
            </div>
          </div>
        ) : (
          // Form State
          <>
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>ฟอร์มขอฮาร์ดแวร์ / เครือข่าย</DialogTitle>
              <DialogDescription>กรอกข้อมูลคำร้องขอของคุณ</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto pr-1">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6 pb-6"
                >
                {/* Requester Information (Read-only) */}
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <h4 className="font-semibold text-sm">ข้อมูลผู้ยื่นคำร้อง</h4>
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
                      <p className="font-medium">
                        {user?.department?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">เบอร์โทร:</span>
                      <p className="font-medium">
                        {user?.internalPhone || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>ประเภทคำร้อง *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem
                              value="HARDWARE"
                              id="type-hardware"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="type-hardware"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Server className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-semibold">ขอฮาร์ดแวร์</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  คอมพิวเตอร์, เครื่องพิมพ์, อุปกรณ์
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="NETWORK"
                              id="type-network"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="type-network"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Network className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-semibold">
                                  ขอเครือข่าย
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  อินเทอร์เน็ต, LAN, Wi-Fi
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subject */}
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>หัวเรื่อง *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            selectedType === "HARDWARE"
                              ? "เช่น: ขอคอมพิวเตอร์ตั้งโต๊ะ สำหรับพนักงานใหม่"
                              : "เช่น: ขอติดตั้งอินเทอร์เน็ตที่ห้องประชุม"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ระบุหัวเรื่องคำร้องของคุณโดยสังเขป (5-200 ตัวอักษร)
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
                      <FormLabel>รายละเอียด *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={
                            selectedType === "HARDWARE"
                              ? "ระบุรายละเอียดฮาร์ดแวร์ที่ต้องการ เช่น สเปคที่ต้องการ, วัตถุประสงค์การใช้งาน, จำนวน..."
                              : "ระบุรายละเอียดเครือข่ายที่ต้องการ เช่น ความเร็วที่ต้องการ, จำนวนจุดเชื่อมต่อ, วัตถุประสงค์..."
                          }
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        อธิบายรายละเอียดคำร้องให้ชัดเจน (20-2,000 ตัวอักษร)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>สถานที่ติดตั้ง</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น: ห้องทำงาน 201, แผนกผู้ป่วยนอก"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        ระบุสถานที่ที่ต้องการติดตั้ง/ใช้งาน (ถ้ามี)
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
                            {urgencyLabels.CRITICAL} - เร่งด่วนมาก
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        เลือกระดับความเร่งด่วนของคำร้องนี้
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
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isSubmitting ? "กำลังส่งคำร้อง..." : "ส่งคำร้อง"}
                  </Button>
                </div>
              </form>
            </Form>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
