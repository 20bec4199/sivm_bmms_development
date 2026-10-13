import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card = ({ className = '', children, ...props }: CardProps) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ className = '', children, ...props }: CardProps) => {
  return (
    <div className={`px-5 py-5 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle = ({ className = '', children, ...props }: CardProps) => {
  return (
    <h3 className={`text-base sm:text-lg font-extrabold leading-6 text-slate-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardContent = ({ className = '', children, ...props }: CardProps) => {
  return (
    <div className={`px-5 py-5 sm:p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardDescription = ({ className = '', children, ...props }: CardProps) => {
  return (
    <p className={`text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1.5 ${className}`} {...props}>
      {children}
    </p>
  );
};

