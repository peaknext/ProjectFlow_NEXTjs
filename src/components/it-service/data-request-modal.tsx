"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Database, Code } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
  dataRequestFormSchema,
  type DataRequestFormData,
  urgencyLabels,
  purposeLabels,
} from "@/lib/validations/service-request";

interface DataRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Data/Program Request Form Modal
 *
 * Features:
 * - Request type selection (Data or Program)
 * - Subject and description fields
 * - Urgency level selector
 * - Auto-filled requester information
 * - Success state with request number
 * - Redirect to tracking page after submission
 */
export function DataRequestModal({
  open,
  onOpenChange,
}: DataRequestModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [requestNumber, setRequestNumber] = useState("");

  const form = useForm<DataRequestFormData>({
    resolver: zodResolver(dataRequestFormSchema),
    defaultValues: {
      type: "DATA",
      subject: "",
      description: "",
      urgency: "MEDIUM",
      purposes: [],
      otherPurpose: "",
    },
  });

  const selectedType = form.watch("type");
  const selectedPurposes = form.watch("purposes");

  const handleSubmit = async (data: DataRequestFormData) => {
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
        purposes: data.purposes,
        otherPurpose: data.otherPurpose || null,
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
              <DialogTitle>ฟอร์มขอข้อมูล / พัฒนาโปรแกรม</DialogTitle>
              <DialogDescription>กรอกข้อมูลคำร้องขอของคุณ</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6 px-6 pb-6"
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
                              value="DATA"
                              id="type-data"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="type-data"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Database className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-semibold">ขอข้อมูล</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  ขอข้อมูลจากระบบ, รายงาน
                                </div>
                              </div>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="PROGRAM"
                              id="type-program"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="type-program"
                              className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Code className="mb-3 h-6 w-6" />
                              <div className="text-center">
                                <div className="font-semibold">
                                  พัฒนาโปรแกรม
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  พัฒนา/แก้ไขโปรแกรม
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
                            selectedType === "DATA"
                              ? "เช่น: ขอข้อมูลจำนวนผู้ป่วย OPD ประจำเดือน"
                              : "เช่น: พัฒนาระบบลงทะเบียนผู้ป่วยออนไลน์"
                          }
                          className="bg-white dark:bg-background"
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
                            selectedType === "DATA"
                              ? "ระบุรายละเอียดข้อมูลที่ต้องการ เช่น รูปแบบข้อมูล, ช่วงเวลา, วัตถุประสงค์การใช้งาน..."
                              : "ระบุรายละเอียดโปรแกรมที่ต้องการพัฒนา เช่น ฟีเจอร์ที่ต้องการ, ผู้ใช้งาน, ข้อกำหนดพิเศษ..."
                          }
                          className="min-h-[150px] resize-y bg-white dark:bg-background"
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

                {/* Purpose Checkboxes */}
                <FormField
                  control={form.control}
                  name="purposes"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>วัตถุประสงค์การขอ *</FormLabel>
                        <FormDescription>
                          เลือกวัตถุประสงค์อย่างน้อย 1 ข้อ
                        </FormDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {(["EXECUTIVE", "EDUCATION", "CAPABILITY", "OTHER"] as const).map((purpose) => (
                          <FormField
                            key={purpose}
                            control={form.control}
                            name="purposes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={purpose}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(purpose)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, purpose])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== purpose
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {purposeLabels[purpose]}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Other Purpose Text Input (shown when OTHER is checked) */}
                {selectedPurposes?.includes("OTHER") && (
                  <FormField
                    control={form.control}
                    name="otherPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ระบุวัตถุประสงค์อื่นๆ *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ระบุรายละเอียดวัตถุประสงค์อื่นๆ"
                            className="bg-white dark:bg-background"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                          <SelectTrigger className="bg-white dark:bg-background">
                            <SelectValue placeholder="เลือกความเร่งด่วน" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[300]">
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
