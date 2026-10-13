import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, AlertTriangle, XCircle, Clock, PauseCircle, ShieldAlert, Check, Info } from 'lucide-react';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 tracking-wide border',
  {
    variants: {
      variant: {
        default:
          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
        primary:
          'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 border-blue-300 dark:border-blue-700',
        secondary:
          'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
        success:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
        danger:
          'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-200 border-rose-300 dark:border-rose-700',
        warning:
          'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        info:
          'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-200 border-sky-300 dark:border-sky-700',
        outline:
          'text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, className })} {...props} />
  );
}

// Specialized enterprise accessible status badge with icon + clear typography hierarchy (Requirement #9)
export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, className = '', ...props }) => {
  const normalized = status ? status.toUpperCase().trim() : 'UNKNOWN';
  
  let variant: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'secondary' | 'default' = 'default';
  let icon: React.ReactNode = null;
  let defaultLabel = status || 'Unknown';

  if (normalized.includes('SUCCESS') || normalized.includes('ACTIVE') || normalized.includes('APPROVED') || normalized.includes('RESOLVED') || normalized === 'OK') {
    variant = 'success';
    icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-emerald-700 dark:text-emerald-300" />;
    if (normalized === 'SUCCESS') defaultLabel = '✓ Success';
    else if (normalized === 'ACTIVE') defaultLabel = '✓ Active';
    else defaultLabel = `✓ ${status}`;
  } else if (normalized.includes('FAIL') || normalized.includes('DENY') || normalized.includes('INACTIVE') || normalized.includes('REJECT') || normalized.includes('DELETE') || normalized.includes('ERROR')) {
    variant = 'danger';
    icon = <XCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-rose-700 dark:text-rose-300" />;
    if (normalized.includes('FAIL')) defaultLabel = '× Failed';
    else if (normalized === 'INACTIVE') defaultLabel = '× Inactive';
    else defaultLabel = `× ${status}`;
  } else if (normalized.includes('PENDING') || normalized.includes('PROGRESS') || normalized.includes('WAITING')) {
    variant = 'info';
    icon = <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-sky-700 dark:text-sky-300 animate-pulse" />;
    defaultLabel = `○ ${status}`;
  } else if (normalized.includes('WARN') || normalized.includes('SUSPEND') || normalized.includes('LOCK')) {
    variant = 'warning';
    icon = normalized.includes('SUSPEND') ? <PauseCircle className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-amber-800 dark:text-amber-300" /> : <AlertTriangle className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-amber-800 dark:text-amber-300" />;
    if (normalized === 'SUSPENDED') defaultLabel = '! Suspended';
    else defaultLabel = `! ${status}`;
  } else {
    variant = 'secondary';
    icon = <Info className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-indigo-700 dark:text-indigo-300" />;
    defaultLabel = status;
  }

  return (
    <Badge variant={variant} className={`font-extrabold whitespace-nowrap px-2.5 py-1 ${className}`} {...props}>
      {icon}
      <span>{label || defaultLabel}</span>
    </Badge>
  );
};
