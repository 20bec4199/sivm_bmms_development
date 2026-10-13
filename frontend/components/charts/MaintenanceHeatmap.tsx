'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface HeatmapDataPoint {
  label: string;
  [key: string]: string | number; // For dynamic categories
}

interface MaintenanceHeatmapProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  data: HeatmapDataPoint[];
  categories: { key: string; name: string; color: string }[];
  onViewReport?: () => void;
}

const customTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
};

export const MaintenanceHeatmap = ({ title, subtitle, icon, data, categories, onViewReport }: MaintenanceHeatmapProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {title} {icon}
            </h3>
            <p className="text-sm text-slate-500">{subtitle}</p>
          </div>
          {onViewReport && (
            <button onClick={onViewReport} className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
              View Full Report &rarr;
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
            <Tooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
            {categories.map((cat, idx) => (
              <Bar 
                key={cat.key} 
                dataKey={cat.key} 
                name={cat.name} 
                stackId="a" 
                fill={cat.color} 
                radius={idx === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                animationDuration={1500} 
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
