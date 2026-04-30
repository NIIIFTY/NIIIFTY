import React, { ReactNode } from 'react';
import { cn } from '@/utils/Utils';

interface DetailCardProps {
  title: string;
  icon: React.ElementType;
  children: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
  headerAppend?: ReactNode;
}

export function DetailCard({ title, icon: Icon, children, size = 'lg', className, headerAppend }: DetailCardProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50",
        size === 'lg' ? 'p-8 space-y-8' : 'p-5 flex flex-col gap-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-zinc-500">
          <Icon size={16} />
          <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        {headerAppend && <div>{headerAppend}</div>}
      </div>
      {children}
    </div>
  );
}
