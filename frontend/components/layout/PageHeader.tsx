import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageHeader = ({ title, description, action }: PageHeaderProps) => {
  return (
    <div className="sm:flex sm:items-center sm:justify-between mb-10 pb-6 border-b border-slate-200 dark:border-white/5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400 max-w-3xl">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-4 sm:ml-4 sm:mt-0 flex gap-3 shadow-sm rounded-lg">
          {action}
        </div>
      )}
    </div>
  );
};
