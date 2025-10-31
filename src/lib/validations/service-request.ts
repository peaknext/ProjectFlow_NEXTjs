import { z } from "zod";

/**
 * Service Request Form Validation Schemas
 *
 * Used for validating request submission forms:
 * - Data/Program Request Form
 * - IT Issue Request Form
 */

// Request urgency levels
export const requestUrgencySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

// Data/Program request type
export const dataRequestTypeSchema = z.enum(["DATA", "PROGRAM"]);

// Hardware/Network request type
export const hardwareNetworkRequestTypeSchema = z.enum(["HARDWARE", "NETWORK"]);

/**
 * Data/Program Request Form Schema
 *
 * Fields:
 * - type: DATA or PROGRAM
 * - subject: Request title (max 200 chars)
 * - description: Detailed description (max 2000 chars)
 * - urgency: Priority level
 * - purposes: Array of purpose options (EXECUTIVE, EDUCATION, CAPABILITY, OTHER)
 * - otherPurpose: Details when OTHER is selected
 */
export const dataRequestFormSchema = z.object({
  type: dataRequestTypeSchema,
  subject: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร")
    .trim(),
  description: z
    .string()
    .min(20, "รายละเอียดต้องมีอย่างน้อย 20 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร")
    .trim(),
  urgency: requestUrgencySchema,
  purposes: z
    .array(z.enum(["EXECUTIVE", "EDUCATION", "CAPABILITY", "OTHER"]))
    .min(1, "กรุณาเลือกวัตถุประสงค์อย่างน้อย 1 ข้อ"),
  otherPurpose: z
    .string()
    .max(200, "รายละเอียดต้องไม่เกิน 200 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type DataRequestFormData = z.infer<typeof dataRequestFormSchema>;

/**
 * Hardware/Network Request Form Schema
 *
 * Fields:
 * - type: HARDWARE or NETWORK
 * - subject: Request title (max 200 chars)
 * - description: Detailed description (max 2000 chars)
 * - urgency: Priority level
 * - location: Optional location for installation/setup (max 100 chars)
 */
export const hardwareNetworkRequestFormSchema = z.object({
  type: hardwareNetworkRequestTypeSchema,
  subject: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร")
    .trim(),
  description: z
    .string()
    .min(20, "รายละเอียดต้องมีอย่างน้อย 20 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร")
    .trim(),
  urgency: requestUrgencySchema,
  location: z
    .string()
    .max(100, "สถานที่ต้องไม่เกิน 100 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type HardwareNetworkRequestFormData = z.infer<typeof hardwareNetworkRequestFormSchema>;

/**
 * IT Issue Request Form Schema
 *
 * Fields:
 * - subject: Issue title (max 200 chars)
 * - description: Detailed description (max 2000 chars)
 * - urgency: Priority level
 * - location: Optional location where issue occurred (max 100 chars)
 */
export const itIssueRequestFormSchema = z.object({
  subject: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องต้องไม่เกิน 200 ตัวอักษร")
    .trim(),
  description: z
    .string()
    .min(20, "รายละเอียดต้องมีอย่างน้อย 20 ตัวอักษร")
    .max(2000, "รายละเอียดต้องไม่เกิน 2,000 ตัวอักษร")
    .trim(),
  urgency: requestUrgencySchema,
  location: z
    .string()
    .max(100, "สถานที่ต้องไม่เกิน 100 ตัวอักษร")
    .trim()
    .optional()
    .or(z.literal("")),
});

export type ITIssueRequestFormData = z.infer<typeof itIssueRequestFormSchema>;

/**
 * Urgency level labels (Thai)
 */
export const urgencyLabels: Record<string, string> = {
  LOW: "ต่ำ",
  MEDIUM: "ปานกลาง",
  HIGH: "สูง",
  CRITICAL: "วิกฤต",
};

/**
 * Urgency level colors (for badges)
 */
export const urgencyColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
};

/**
 * Request type labels (Thai)
 */
export const requestTypeLabels: Record<string, string> = {
  DATA: "ขอข้อมูล",
  PROGRAM: "พัฒนาโปรแกรม",
  HARDWARE: "ขอฮาร์ดแวร์",
  NETWORK: "ขอเครือข่าย",
  IT_ISSUE: "แจ้งปัญหา IT",
};

/**
 * Request purpose labels (Thai)
 */
export const purposeLabels: Record<string, string> = {
  EXECUTIVE: "ผู้บริหาร",
  EDUCATION: "ศึกษาต่อ",
  CAPABILITY: "เพิ่มสมรรถนะบุคลากร",
  OTHER: "อื่นๆ",
};
