import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 sm:w-5 sm:h-5',
    sm: 'w-5 h-5 sm:w-6 sm:h-6',
    md: 'w-6 h-6 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
    xl: 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16'
  };

  const borderClasses = {
    xs: 'border border-transparent',
    sm: 'border border-transparent',
    md: 'border-2 border-transparent',
    lg: 'border-2 border-transparent',
    xl: 'border-[3px] border-transparent'
  };

  const innerSpacing = {
    xs: 'inset-0.5',
    sm: 'inset-0.5',
    md: 'inset-1',
    lg: 'inset-1',
    xl: 'inset-1.5'
  };

  return (
    <div className={cn('relative inline-block', sizeClasses[size], className)}>
      <div className={cn(
        'absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-purple-500 animate-spin',
        borderClasses[size]
      )}>
        <div className={cn('absolute rounded-full bg-gaming-bg', innerSpacing[size])}></div>
      </div>
      <div className="absolute inset-0 rounded-full shadow-lg shadow-purple-500/30 animate-pulse"></div>
    </div>
  );
};

export default LoadingSpinner;
