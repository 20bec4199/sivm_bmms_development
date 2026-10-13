'use client';

import { motion } from 'framer-motion';
import { SECURITY_PILLARS } from '../../data/landing';
import { Server, Lock, FileText, Fingerprint } from 'lucide-react';

const PILLAR_ICONS: React.FC<React.SVGProps<SVGSVGElement>>[] = [Server, Lock, FileText, Fingerprint];

const ARCHITECTURE_LAYERS = [
  { label: 'Organization', color: '#3b82f6', width: '80%' },
  { label: 'Data Isolation', color: '#22d3ee', width: '65%' },
  { label: 'RBAC', color: '#8b5cf6', width: '55%' },
  { label: 'Authentication', color: '#10b981', width: '45%' },
  { label: 'Audit Layer', color: '#94a3b8', width: '35%' },
];

export function SecurityArchitecture() {
  return (
    <section id="security" className="py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Architecture</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Built for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Multi-Tenant Operations.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Enterprise-grade security built into the foundation — not bolted on afterwards.
            Total data isolation, granular role-based access, and complete auditability.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT — Architecture visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="text-[12px] font-semibold text-slate-500 mb-6 uppercase tracking-widest">
              Security Architecture
            </div>
            {ARCHITECTURE_LAYERS.map((layer, i) => (
              <motion.div
                key={layer.label}
                className="flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="w-28 text-[12px] font-medium text-slate-400 text-right flex-shrink-0">
                  {layer.label}
                </div>
                <div className="flex-1 h-10 rounded-xl bg-[#090D12] border border-white/[0.05] overflow-hidden relative">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-xl"
                    style={{
                      background: `linear-gradient(90deg, ${layer.color}30, ${layer.color}10)`,
                      borderRight: `2px solid ${layer.color}60`,
                    }}
                    initial={{ width: '0%' }}
                    whileInView={{ width: layer.width }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.08, ease: 'easeOut' }}
                  />
                  <div className="relative z-10 h-full flex items-center px-4">
                    <span className="text-[11px] font-semibold" style={{ color: layer.color }}>
                      {layer.label}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* RIGHT — Security pillars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {SECURITY_PILLARS.map((pillar, i) => {
              const Icon = PILLAR_ICONS[i];
              return (
                <motion.div
                  key={pillar.title}
                  className="rounded-2xl border border-white/[0.07] bg-[#0D1218] p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.12)' }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center border mb-4"
                    style={{
                      borderColor: pillar.color + '40',
                      background: pillar.color + '12',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: pillar.color }} />
                  </div>
                  <h3 className="text-white font-bold text-[14px] mb-2">{pillar.title}</h3>
                  <p className="text-slate-500 text-[12px] leading-relaxed">{pillar.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
