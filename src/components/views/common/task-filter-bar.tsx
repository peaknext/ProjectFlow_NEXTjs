/**
 * TaskFilterBar - แถบค้นหาและตัวกรองงาน
 * ใช้ร่วมกันระหว่าง Board View, Calendar View, และ List View
 */

'use client';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface TaskFilters {
  search: string;
  statusId: string;
  priorityId: string;
  assigneeId: string;
  hideClosed: boolean;
}

interface Status {
  id: string;
  name: string;
}

interface User {
  id: string;
  fullName: string;
}

interface TaskFilterBarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  statuses: Status[];
  assignees: User[];
  className?: string;
}

/**
 * TaskFilterBar Component
 *
 * แถบค้นหาและตัวกรองงาน ประกอบด้วย:
 * - ช่องค้นหา
 * - ตัวกรองสถานะ
 * - ตัวกรองความสำคัญ
 * - ตัวกรองผู้รับผิดชอบ
 * - สวิตช์ซ่อนงานที่ปิดแล้ว
 */
export function TaskFilterBar({
  filters,
  onFiltersChange,
  statuses,
  assignees,
  className
}: TaskFilterBarProps) {
  const updateFilter = (key: keyof TaskFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหางาน..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="max-w-sm bg-white dark:bg-gray-800"
          />
        </div>

        {/* Filter Label */}
        <span className="text-sm text-muted-foreground font-medium">ตัวกรอง:</span>

        {/* Status Filter */}
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(value) => updateFilter('statusId', value === 'ALL' ? '' : value)}
        >
          <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priorityId || 'ALL'}
          onValueChange={(value) => updateFilter('priorityId', value === 'ALL' ? '' : value)}
        >
          <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            <SelectItem value="1">ด่วนมาก</SelectItem>
            <SelectItem value="2">สูง</SelectItem>
            <SelectItem value="3">ปานกลาง</SelectItem>
            <SelectItem value="4">ต่ำ</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={filters.assigneeId || 'ALL'}
          onValueChange={(value) => updateFilter('assigneeId', value === 'ALL' ? '' : value)}
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="ทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            {assignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Hide Closed Tasks Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="hide-closed" className="cursor-pointer text-sm">
            ซ่อนงานที่ปิดแล้ว
          </Label>
          <Switch
            id="hide-closed"
            checked={filters.hideClosed}
            onCheckedChange={(checked) => updateFilter('hideClosed', checked)}
          />
        </div>
      </div>
    </div>
  );
}
