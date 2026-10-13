'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';

export interface RevenueDataPoint {
  label: string;
  actual: number;
  projected?: number;
}

interface RevenueChartProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: RevenueDataPoint[];
}

const customTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
};

export const RevenueChart = ({ title, subtitle, icon, data }: RevenueChartProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {title} {icon}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            <Area type="monotone" dataKey="actual" name="Actual Revenue" fill="url(#colorActual)" stroke="#3b82f6" strokeWidth={3} animationDuration={2000} />
            {data.some(d => d.projected !== undefined) && (
              <Line type="monotone" dataKey="projected" name="AI Projected" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={2000} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
