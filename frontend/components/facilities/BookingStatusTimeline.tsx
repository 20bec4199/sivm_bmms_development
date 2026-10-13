'use client';

import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ShieldCheck, UserCheck, CalendarCheck, HelpCircle } from 'lucide-react';

interface BookingStatusTimelineProps {
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
}

export const BookingStatusTimeline: React.FC<BookingStatusTimelineProps> = ({
  status = 'PENDING',
  checkInTime,
  checkOutTime,
  rejectionReason,
  createdAt
}) => {
  const s = status.toUpperCase();
  
  const isRejected = s === 'REJECTED';
  const isCancelled = s === 'CANCELLED';
  const isNoShow = s === 'NO_SHOW';
  const isExpired = s === 'EXPIRED';
  const isErrorState = isRejected || isCancelled || isNoShow || isExpired;

  const steps = [
    { label: 'Submitted', desc: createdAt ? new Date(createdAt).toLocaleDateString() : 'Request logged', done: true, icon: <CalendarCheck size={14} /> },
    { label: 'Approval Status', desc: isErrorState ? (isRejected ? 'Rejected by Manager' : isCancelled ? 'Cancelled' : s) : (s === 'PENDING' || s === 'DRAFT' ? 'Pending Review' : 'Approved'), done: s !== 'PENDING' && s !== 'DRAFT', error: isErrorState, icon: isErrorState ? <XCircle size={14} /> : <ShieldCheck size={14} /> },
    { label: 'Facility Check-In', desc: checkInTime ? new Date(checkInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : (s === 'COMPLETED' ? 'Verified' : 'Pending QR scan'), done: !!checkInTime || s === 'COMPLETED', icon: <UserCheck size={14} /> },
    { label: 'Completed', desc: checkOutTime ? 'Departed' : (s === 'COMPLETED' ? 'Finished' : 'Upcoming'), done: s === 'COMPLETED', icon: <CheckCircle2 size={14} /> },
  ];

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-3 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
        {steps.map((step, idx) => {
          let bgCircle = step.done ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700';
          if (step.error) bgCircle = 'bg-red-600 text-white border-red-600';
          else if (!step.done && idx === 1 && s === 'PENDING') bgCircle = 'bg-amber-500 text-white border-amber-500 animate-pulse';

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 w-1/4 px-1">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shadow-xs ${bgCircle}`}>
                {step.icon}
              </div>
              <span className={`text-[11px] font-bold mt-1 text-center ${step.error ? 'text-red-600 dark:text-red-400' : step.done ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>
                {step.label}
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center line-clamp-1">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {isRejected && rejectionReason && (
        <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-lg text-xs flex items-start space-x-2 text-red-800 dark:text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Rejection Reason Provided by Building Management:</span>
            <p className="mt-0.5 leading-relaxed font-normal">{rejectionReason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
