import React from 'react';
import { cn } from '@/lib/utils';

export interface BlueskyIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const BlueskyIcon = ({ size = 24, className, ...props }: BlueskyIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 27 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('transition-all', className)}
      {...props}
    >
      <path d="M6.1075 1.99382C9.09982 4.25439 12.3184 8.83789 13.5001 11.2977C14.6819 8.83808 17.9003 4.25435 20.8927 1.99382C23.0518 0.362678 26.5501 -0.899405 26.5501 3.11661C26.5501 3.91866 26.0931 9.85427 25.8251 10.8179C24.8935 14.1681 21.4986 15.0226 18.4789 14.5054C23.7574 15.4095 25.1002 18.4039 22.2002 21.3984C16.6927 27.0855 14.2843 19.9715 13.6669 18.1486C13.5537 17.8145 13.5008 17.6581 13.5 17.7911C13.4992 17.6581 13.4463 17.8145 13.3332 18.1486C12.7161 19.9715 10.3077 27.0857 4.79983 21.3984C1.89985 18.4039 3.24261 15.4093 8.5212 14.5054C5.50134 15.0226 2.10645 14.1681 1.17495 10.8179C0.906917 9.85418 0.449951 3.91857 0.449951 3.11661C0.449951 -0.899405 3.94834 0.362678 6.10735 1.99382H6.1075Z" />
    </svg>
  );
};
