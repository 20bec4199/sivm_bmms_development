'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, XCircle, Clock, Wrench, AlertCircle } from 'lucide-react';

interface FacilityStatusBadgeProps {
  status?: string;
  isActive?: boolean;
  className?: string;
}

export const FacilityStatusBadge: React.FC<FacilityStatusBadgeProps> = ({ status = 'ACTIVE', isActive = true, className = '' }) => {
  const normStatus = !isActive ? 'INACTIVE' : status.toUpperCase();

  if (normStatus === 'ACTIVE') {
    return (
      <Badge variant="success" className={`font-bold text-[11px] px-2.5 py-0.5 shadow-xs flex items-center gap-1 w-fit ${className}`}>
        <CheckCircle2 size={13} className="text-emerald-500" /> Active & Reservable
      </Badge>
    );
  }

  if (normStatus === 'UNDER_MAINTENANCE' || normStatus === 'MAINTENANCE') {
    return (
      <Badge variant="outline" className={`font-bold text-[11px] bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 px-2.5 py-0.5 shadow-xs flex items-center gap-1 w-fit ${className}`}>
        <Wrench size={13} className="text-amber-500 animate-pulse" /> Under Maintenance
      </Badge>
    );
  }

  if (normStatus === 'TEMPORARILY_UNAVAILABLE' || normStatus === 'UNAVAILABLE') {
    return (
      <Badge variant="outline" className={`font-bold text-[11px] bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 px-2.5 py-0.5 shadow-xs flex items-center gap-1 w-fit ${className}`}>
        <Clock size={13} className="text-orange-500" /> Temporarily Closed
      </Badge>
    );
  }

  if (normStatus === 'PERMANENTLY_CLOSED') {
    return (
      <Badge variant="outline" className={`font-bold text-[11px] bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-800 dark:text-slate-300 px-2.5 py-0.5 shadow-xs flex items-center gap-1 w-fit ${className}`}>
        <XCircle size={13} /> Permanently Closed
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={`font-bold text-[11px] bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 px-2.5 py-0.5 shadow-xs flex items-center gap-1 w-fit ${className}`}>
      <AlertCircle size={13} /> Inactive
    </Badge>
  );
};
