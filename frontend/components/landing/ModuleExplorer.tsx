'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MODULES } from '../../data/landing';
import {
  Building2, LayoutDashboard, Wrench, HardDrive, Car,
  ShieldCheck, UserPlus, Users,
} from 'lucide-react';

// Lazy-load the 3D network
const ModuleNetwork = dynamic(() => import('../3d-landing/ModuleNetwork'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#090D12] rounded-2xl animate-pulse" />,
});

const MODULE_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  property: Building2,
  facilities: LayoutDashboard,
  work_orders: Wrench,
  assets: HardDrive,
  parking: Car,
  security: ShieldCheck,
  visitors: UserPlus,
  residents: Users,
};

export function ModuleExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeModule = MODULES[activeIndex];
  const Icon = MODULE_ICONS[activeModule.id] ?? Building2;

  return (
    <section id="modules" className="py-28 md:py-36 bg-[#090D12]/40 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Platform Modules</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            One Platform.{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Multiple Operations.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Explore the interconnected modules that power modern property management.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* LEFT — module list */}
          <div className="space-y-2">
            {MODULES.map((mod, i) => {
              const Ic = MODULE_ICONS[mod.id] ?? Building2;
              const isActive = i === activeIndex;
              return (
                <motion.button
                  key={mod.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'border-white/[0.12] bg-[#0D1218]'
                      : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'
                  }`}
                  layout
                >
                  <div
                    className="mt-0.5 w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center border transition-colors duration-300"
                    style={{
                      borderColor: isActive ? mod.color + '40' : 'rgba(255,255,255,0.06)',
                      background: isActive ? mod.color + '15' : 'transparent',
                    }}
                  >
                    <Ic
                      className="w-4 h-4 transition-colors duration-300"
                      style={{ color: isActive ? mod.color : '#64748b' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[14px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {mod.label}
                      </span>
                      {isActive && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{ color: mod.color, borderColor: mod.color + '40', background: mod.color + '12' }}
                        >
                          Active
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35 }}
                        >
                          <p className="text-slate-500 text-[13px] leading-relaxed mb-3">{mod.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {mod.features.map((feat) => (
                              <span
                                key={feat}
                                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/[0.07] text-slate-400"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* RIGHT — 3D network visualization */}
          <div className="sticky top-28 w-full">
            <div className="h-[420px] rounded-2xl bg-[#090D12] border border-white/[0.06] overflow-hidden relative">
              <ModuleNetwork activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

              {/* Active module overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#090D12] to-transparent">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: activeModule.color + '20', border: `1px solid ${activeModule.color}40` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: activeModule.color }} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-[14px]">{activeModule.label}</div>
                    <div className="text-slate-500 text-[11px]">Click a node to explore</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
