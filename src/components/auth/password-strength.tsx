import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const strengthPercentage = (strength / 5) * 100;

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (strength <= 2) return 'อ่อนแอ';
    if (strength <= 3) return 'ปานกลาง';
    if (strength <= 4) return 'ดี';
    return 'แข็งแรง';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">ความแข็งแรงของรหัสผ่าน:</span>
          <span className={cn(
            'font-medium',
            strength <= 2 && 'text-red-500',
            strength === 3 && 'text-yellow-500',
            strength === 4 && 'text-blue-500',
            strength === 5 && 'text-green-500'
          )}>
            {getStrengthText()}
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', getStrengthColor())}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1 text-sm">
        <RequirementItem
          checked={checks.length}
          label="อย่างน้อย 8 ตัวอักษร"
        />
        <RequirementItem
          checked={checks.uppercase}
          label="มีตัวพิมพ์ใหญ่ (A-Z)"
        />
        <RequirementItem
          checked={checks.lowercase}
          label="มีตัวพิมพ์เล็ก (a-z)"
        />
        <RequirementItem
          checked={checks.number}
          label="มีตัวเลข (0-9)"
        />
        <RequirementItem
          checked={checks.special}
          label="มีอักขระพิเศษ (!@#$%^&*)"
        />
      </div>
    </div>
  );
}

function RequirementItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {checked ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-gray-400" />
      )}
      <span className={cn(
        checked ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        {label}
      </span>
    </div>
  );
}
