'use client';

import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  isPositive: boolean;
  sparklineColor: string;
  progress: number;
  sparklineData: number[];
  isLoading?: boolean;
}

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  isPositive,
  sparklineColor,
  progress,
  sparklineData,
  isLoading
}: StatCardProps) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 h-[180px] animate-pulse">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded" />
      </div>
    );
  }

  const chartData = sparklineData.map((val, index) => ({ val, index }));

  return (
    <div className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.1)] hover:-translate-y-1">
      {/* Top Gradient Accent */}
      <div className="absolute top-0 inset-x-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: sparklineColor }}></div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${sparklineColor}15` }}>
            {icon}
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        </div>
        
        <div className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
        </div>
        <div className="flex items-end justify-between">
          <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {value}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%`, backgroundColor: sparklineColor }}
          />
        </div>
      </div>
      
      {/* Mini Sparkline Background */}
      <div className="absolute inset-x-0 bottom-0 h-16 opacity-30 translate-y-4 group-hover:translate-y-2 transition-transform duration-500 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="val" stroke={sparklineColor} strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={2000} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
