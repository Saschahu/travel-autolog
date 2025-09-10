import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

export const MobileLayout = ({ children, className }: MobileLayoutProps) => {
  return (
    <div className={cn(
      "min-h-screen bg-background flex flex-col overflow-y-auto",
      "max-w-md mx-auto", // Mobile-first design
      className
    )}>
      {children}
    </div>
  );
};