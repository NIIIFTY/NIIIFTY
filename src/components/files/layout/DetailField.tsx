import React, { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/Utils';

interface DetailFieldProps {
  label: string;
  value?: string | ReactNode;
  className?: string;
  valueClassName?: string;
}

export function DetailField({ label, value, className, valueClassName }: DetailFieldProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-zinc-600 dark:text-zinc-400">{label}</Label>
      <div className={cn("text-zinc-900 dark:text-zinc-100 font-medium break-words leading-relaxed", valueClassName)}>
        {value || <span className="text-zinc-400 italic">Not provided</span>}
      </div>
    </div>
  );
}
