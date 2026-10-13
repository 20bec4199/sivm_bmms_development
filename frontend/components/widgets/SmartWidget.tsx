'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SmartWidgetProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}

export const SmartWidget = ({ title, value, subtitle, icon }: SmartWidgetProps) => {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer"
    >
      <div className="flex justify-between items-start mb-3">
        {icon}
        <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{title}</div>
        <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>
      </div>
    </motion.div>
  );
};
