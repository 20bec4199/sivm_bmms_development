'use client';

import { motion } from 'framer-motion';
import { Home, Building2, Layers, Settings, Briefcase } from 'lucide-react';

const TYPES = [
  { label: 'Residential', icon: Home },
  { label: 'Commercial', icon: Building2 },
  { label: 'Mixed Development', icon: Layers },
  { label: 'Facility Operations', icon: Settings },
  { label: 'Property Management', icon: Briefcase },
];

export function TrustStrip() {
  return (
    <section className="relative py-10 border-y border-white/[0.05] bg-[#090D12]/60">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 mb-8">
          Built for modern property environments
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
          {TYPES.map((type, i) => (
            <motion.div
              key={type.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-center gap-2.5 text-slate-500 hover:text-slate-300 transition-colors group cursor-default"
            >
              <type.icon className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
              <span className="text-[13px] font-medium">{type.label}</span>
              {i < TYPES.length - 1 && (
                <span className="hidden md:block w-px h-4 bg-white/[0.06] ml-6" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
