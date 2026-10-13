'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Dumbbell, Waves, Users, Coffee, Car, Briefcase, Sparkles, Building, Landmark, ShieldCheck, Gamepad } from 'lucide-react';

interface FacilityCategoryBadgeProps {
  category?: string;
  className?: string;
}

export const FacilityCategoryBadge: React.FC<FacilityCategoryBadgeProps> = ({ category = 'Recreation', className = '' }) => {
  const cat = category.trim().toUpperCase();

  let icon = <Building size={13} />;
  let colorStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';

  if (cat.includes('SPORT') || cat.includes('GYM') || cat.includes('FITNESS')) {
    icon = <Dumbbell size={13} className="text-blue-500" />;
    colorStyle = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
  } else if (cat.includes('POOL') || cat.includes('SWIM') || cat.includes('WATER') || cat.includes('RECREATION')) {
    icon = <Waves size={13} className="text-cyan-500" />;
    colorStyle = 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800';
  } else if (cat.includes('MEETING') || cat.includes('CONFERENCE') || cat.includes('WORKSPACE') || cat.includes('BUSINESS')) {
    icon = <Briefcase size={13} className="text-purple-500" />;
    colorStyle = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
  } else if (cat.includes('EVENT') || cat.includes('COMMUNITY') || cat.includes('HALL') || cat.includes('CLUBHOUSE')) {
    icon = <Users size={13} className="text-pink-500" />;
    colorStyle = 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800';
  } else if (cat.includes('PARKING') || cat.includes('VEHICLE') || cat.includes('GARAGE') || cat.includes('CHARGING')) {
    icon = <Car size={13} className="text-slate-500" />;
    colorStyle = 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  } else if (cat.includes('ENTERTAINMENT') || cat.includes('GAME') || cat.includes('CINEMA') || cat.includes('LOUNGE')) {
    icon = <Gamepad size={13} className="text-rose-500" />;
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  } else if (cat.includes('CUSTOM') || cat.includes('SPECIAL')) {
    icon = <Sparkles size={13} className="text-amber-500" />;
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
  }

  return (
    <Badge variant="outline" className={`font-semibold text-[11px] px-2 py-0.5 border shadow-2xs flex items-center gap-1.5 w-fit ${colorStyle} ${className}`}>
      {icon} <span>{category || 'General Amenity'}</span>
    </Badge>
  );
};
