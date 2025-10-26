import { z } from 'zod';

/**
 * Task creation validation schema
 * Matches GAS CreateTaskModal form requirements
 */
export const createTaskSchema = z.object({
  name: z
    .string()
    .min(1, 'กรุณากรอกชื่องาน')
    .max(500, 'ชื่องานยาวเกินไป (สูงสุด 500 ตัวอักษร)'),

  description: z
    .string()
    .max(5000, 'คำอธิบายยาวเกินไป (สูงสุด 5000 ตัวอักษร)')
    .optional()
    .default(''),

  projectId: z
    .string()
    .min(1, 'กรุณาเลือกโปรเจค'),

  statusId: z
    .string()
    .optional(),

  priority: z
    .number()
    .int()
    .min(1, 'ระดับความเร่งด่วนไม่ถูกต้อง')
    .max(4, 'ระดับความเร่งด่วนไม่ถูกต้อง')
    .default(3), // Default: ปกติ

  difficulty: z
    .number()
    .int()
    .min(1, 'ระดับความยากไม่ถูกต้อง')
    .max(3, 'ระดับความยากไม่ถูกต้อง')
    .default(2), // Default: ปกติ

  assigneeUserIds: z
    .array(z.string())
    .default([]),

  startDate: z
    .string()
    .datetime()
    .optional()
    .nullable(),

  dueDate: z
    .string()
    .datetime()
    .optional()
    .nullable(),

  parentTaskId: z
    .string()
    .optional()
    .nullable(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Priority levels matching GAS implementation
 */
export const TASK_PRIORITIES = [
  { id: 1, name: 'ด่วนที่สุด', color: '#ef4444' },
  { id: 2, name: 'ด่วน', color: '#f97316' },
  { id: 3, name: 'ปกติ', color: '#eab308' },
  { id: 4, name: 'ต่ำ', color: '#22c55e' },
] as const;

/**
 * Difficulty levels matching GAS implementation
 */
export const TASK_DIFFICULTIES = [
  { id: 1, name: 'ง่าย', color: '#22c55e' },
  { id: 2, name: 'ปกติ', color: '#eab308' },
  { id: 3, name: 'ยาก', color: '#ef4444' },
] as const;
