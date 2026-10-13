'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FacilityStatusBadge } from './FacilityStatusBadge';
import { FacilityCategoryBadge } from './FacilityCategoryBadge';
import { Users, DollarSign, MapPin, Calendar, Clock, ChevronRight, Sparkles, Shield, AlertCircle } from 'lucide-react';

interface FacilityCardProps {
  facility: any;
  onAction?: (facility: any) => void;
  actionLabel?: string;
  isManagerView?: boolean;
  onConfigure?: (facilityId: string) => void;
  onQuickBook?: (facility: any) => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  onAction,
  actionLabel = 'Check Availability & Book',
  isManagerView = false,
  onConfigure,
  onQuickBook
}) => {
  const isFree = !facility.hourlyRate || facility.hourlyRate === 0;
  const deposit = facility.depositAmount || 0;
  const isAvailable = facility.isActive !== false && (!facility.status || facility.status === 'ACTIVE');

  // Pricing badge formulation
  const getPricingDisplay = () => {
    if (facility.pricingConfig?.type === 'FREE' || isFree) {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs">
          Complimentary
        </Badge>
      );
    }
    const amount = facility.pricingConfig?.amount ?? facility.hourlyRate;
    const type = facility.pricingConfig?.type || 'PER_HOUR';
    const unit = type === 'PER_DAY' ? 'day' : type === 'PER_SLOT' ? 'slot' : 'hour';
    return (
      <div className="flex flex-col text-right">
        <span className="font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
          ${Number(amount).toFixed(2)} <span className="text-xs text-slate-500 font-normal">/{unit}</span>
        </span>
        {deposit > 0 && (
          <span className="text-[10px] font-medium text-slate-500 font-mono">+$${Number(deposit).toFixed(2)} deposit</span>
        )}
      </div>
    );
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:border-indigo-500/40 dark:hover:border-indigo-500/40">
      {/* Header Image or Gradient Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-tr from-indigo-900 via-slate-800 to-indigo-700">
        {facility.imageUrl ? (
          <img src={facility.imageUrl} alt={facility.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/20 via-slate-900/60 to-slate-950/90" />
            <span className="text-5xl opacity-40 select-none font-bold text-white tracking-widest uppercase">
              {facility.name.substring(0, 3)}
            </span>
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <FacilityCategoryBadge category={facility.category || 'Recreation'} />
        </div>

        <div className="absolute top-3 right-3 z-10">
          <FacilityStatusBadge status={facility.status || 'ACTIVE'} isActive={facility.isActive} />
        </div>

        {/* Bottom Location Band */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent pt-6 pb-2.5 px-4 flex items-center justify-between text-white text-xs z-10">
          <div className="flex items-center space-x-1.5 font-medium truncate max-w-[70%]">
            <MapPin size={14} className="text-indigo-400 shrink-0" />
            <span className="truncate text-slate-100">{facility.locationName || facility.exactLocation || 'Linked Property Hierarchy'}</span>
          </div>
          <div className="flex items-center space-x-1 font-mono font-bold bg-slate-800/80 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] border border-slate-700">
            <Users size={12} className="text-indigo-400" />
            <span>{facility.capacity || 20} Max</span>
          </div>
        </div>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {facility.name}
            </h3>
            {getPricingDisplay()}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {facility.shortDescription || facility.description || 'Configurable community facility managed under multi-tenant facility protocols.'}
          </p>
        </div>

        {/* Operational & Booking Quick Specs */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3 text-slate-500 font-medium">
            <span className="flex items-center space-x-1">
              <Clock size={13} className="text-indigo-500" />
              <span>{facility.bookingConfig?.type === 'FULL_DAY' ? 'Daily Slots' : `${facility.bookingConfig?.slotIntervalMinutes || 60}m Slots`}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Shield size={13} className="text-emerald-500" />
              <span>{facility.approvalConfig?.type === 'AUTO' ? 'Auto-Approve' : 'Manager Review'}</span>
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex items-center gap-2">
          {isManagerView ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-indigo-600 dark:text-indigo-400 font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              onClick={() => onConfigure && onConfigure(facility.id)}
            >
              ⚙️ Configure Facility Rules
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-sm group-hover:shadow-indigo-500/20 transition-all"
              disabled={!isAvailable}
              onClick={() => onAction && onAction(facility)}
            >
              <span>{isAvailable ? actionLabel : 'Currently Unavailable'}</span>
              {isAvailable && <ChevronRight size={16} className="ml-1 group-hover:translate-x-0.5 transition-transform" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
