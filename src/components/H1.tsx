import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
  variant?: 'large' | 'small';
}

const H1: React.FC<Props> = ({ children, className, variant = 'large' }) => {
  const baseClass =
    variant === 'small'
      ? 'font-sans text-xl font-semibold lg:text-2xl'
      : 'font-serif text-2xl font-medium lg:text-4xl';
  return <h1 className={cn(baseClass, className)}>{children}</h1>;
};

export default H1;
