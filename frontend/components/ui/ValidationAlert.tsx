'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Info, RefreshCw, XCircle } from 'lucide-react';

interface ValidationAlertProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  message?: string;
  fieldErrors?: { field: string; message: string }[];
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Enterprise Validation & Alert Display Component (Section 13)
 * Fully compliant with ARIA accessibility standards, supports field error breakdowns and retry loops.
 */
export function ValidationAlert({
  type = 'error',
  title,
  message,
  fieldErrors = [],
  onRetry,
  onDismiss,
  className = '',
}: ValidationAlertProps) {
  if (!message && (!fieldErrors || fieldErrors.length === 0)) return null;

  const styles = {
    error: {
      container: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200',
      icon: <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Validation Failed',
    },
    warning: {
      container: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
      icon: <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Operational Warning',
    },
    success: {
      container: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />,
      defaultTitle: 'Success',
    },
    info: {
      container: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200',
      icon: <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />,
      defaultTitle: 'System Information',
    },
  }[type];

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`p-4 rounded-xl border flex items-start space-x-3 shadow-2xs transition-all ${styles.container} ${className}`}
    >
      {styles.icon}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs tracking-wide uppercase">{title || styles.defaultTitle}</h4>
          <div className="flex items-center space-x-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-slate-800/60 hover:bg-white border border-current/20 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 mr-1 animate-spin-once" /> Retry
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-xs font-bold opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                title="Dismiss Alert"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {message && <p className="text-xs font-medium leading-relaxed">{message}</p>}

        {fieldErrors.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs font-mono bg-white/50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-current/10">
            {fieldErrors.map((err, idx) => (
              <li key={idx} className="flex items-start">
                <span className="font-extrabold text-[11px] mr-1.5 opacity-80">[{err.field}]:</span>
                <span className="font-semibold">{err.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
