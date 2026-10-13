import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  className = '', 
  label, 
  error, 
  id, 
  ...props 
}, ref) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`block w-full rounded-xl border px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 placeholder-slate-400 shadow-sm focus:bg-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:focus:bg-slate-900 dark:text-white dark:border-slate-700 dark:placeholder-slate-500 ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-200'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';
