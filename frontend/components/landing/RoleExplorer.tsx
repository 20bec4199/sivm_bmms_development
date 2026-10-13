'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PERSONAS } from '../../data/landing';
import { LayoutDashboard, Wrench, ShieldCheck, Smartphone } from 'lucide-react';

const PERSONA_ICONS: React.FC<React.SVGProps<SVGSVGElement>>[] = [LayoutDashboard, Wrench, ShieldCheck, Smartphone];

const PERSONA_PREVIEWS: Record<string, React.ReactNode> = {
  'Property Manager': (
    <div className="space-y-3 w-full">
      <div className="flex gap-3">
        {['Buildings', 'Occupancy', 'Revenue', 'Work Orders'].map((s) => (
          <div key={s} className="flex-1 rounded-xl bg-[#0D1218] border border-white/[0.06] p-3 text-center">
            <div className="text-[9px] text-slate-500 mb-1">{s}</div>
            <div className="text-blue-400 font-bold text-[15px]">—</div>
          </div>
        ))}
      </div>
      <div className="h-16 rounded-xl bg-[#0D1218] border border-white/[0.06] flex items-center px-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
        </div>
        <div>
          <div className="text-white text-[12px] font-semibold">Portfolio Command Center</div>
          <div className="text-slate-500 text-[10px]">Full operational view</div>
        </div>
      </div>
    </div>
  ),
  'Technician': (
    <div className="w-48 mx-auto space-y-2">
      <div className="rounded-2xl bg-[#0D1218] border border-white/[0.06] p-4">
        <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">New Work Order</div>
        <div className="text-white text-[13px] font-semibold mb-1">Plumbing — Unit 12B</div>
        <div className="text-slate-500 text-[11px]">Floor 3 · Tower A</div>
        <div className="mt-3 flex gap-2">
          <div className="flex-1 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-[10px] font-semibold">
            Accept
          </div>
        </div>
      </div>
    </div>
  ),
  'Security': (
    <div className="space-y-2 w-full">
      <div className="rounded-xl bg-[#0D1218] border border-white/[0.06] p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-[10px] font-bold">QR</div>
        <div><div className="text-white text-[12px] font-semibold">Visitor Check-In</div><div className="text-slate-500 text-[10px]">Gate A · Just now</div></div>
        <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </div>
      <div className="rounded-xl bg-[#0D1218] border border-white/[0.06] p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
          <div className="w-2 h-2 bg-rose-400 rounded-full" />
        </div>
        <div><div className="text-white text-[12px] font-semibold">Incident Alert</div><div className="text-slate-500 text-[10px]">Zone B · 5m ago</div></div>
      </div>
    </div>
  ),
  'Resident': (
    <div className="w-40 mx-auto space-y-2">
      {['Book Facility', 'Submit Request', 'My Parking', 'Pay Bill'].map((action) => (
        <div key={action} className="rounded-xl bg-[#0D1218] border border-white/[0.06] p-2.5 flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-green-500/20 border border-green-500/30 flex-shrink-0" />
          <span className="text-white text-[11px] font-medium">{action}</span>
        </div>
      ))}
    </div>
  ),
};

export function RoleExplorer() {
  const [activePersona, setActivePersona] = useState(0);
  const persona = PERSONAS[activePersona];
  const Icon = PERSONA_ICONS[activePersona];

  return (
    <section id="solutions" className="py-28 md:py-36 bg-[#090D12]/40 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Built for Everyone</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            One Platform.{' '}
            <span className="text-slate-400">Every Role.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Dedicated interfaces designed specifically for every person in your property ecosystem.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Role selector */}
          <div className="space-y-2">
            {PERSONAS.map((p, i) => {
              const Ic = PERSONA_ICONS[i];
              const isActive = i === activePersona;
              return (
                <motion.button
                  key={p.role}
                  onClick={() => setActivePersona(i)}
                  className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? 'border-white/[0.1] bg-[#0D1218]'
                      : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'
                  }`}
                >
                  <div
                    className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border"
                    style={{
                      borderColor: isActive ? p.color + '50' : 'rgba(255,255,255,0.06)',
                      background: isActive ? p.color + '15' : 'transparent',
                    }}
                  >
                    <Ic className="w-5 h-5 transition-colors" style={{ color: isActive ? p.color : '#475569' }} />
                  </div>
                  <div>
                    <div className={`font-semibold text-[14px] transition-colors ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {p.role}
                    </div>
                    {isActive && (
                      <div className="text-[11px] text-slate-500 mt-0.5">Selected</div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Preview panel */}
          <div className="rounded-2xl bg-[#0D1218] border border-white/[0.07] p-8 min-h-[340px] flex flex-col">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePersona}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col gap-6 flex-1"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{ borderColor: persona.color + '50', background: persona.color + '15' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: persona.color }} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-lg">{persona.role}</div>
                    <div className="text-slate-500 text-[12px]">Dedicated Interface</div>
                  </div>
                </div>

                <p className="text-slate-400 text-[15px] leading-relaxed max-w-xl">
                  {persona.description}
                </p>

                <div className="flex-1 flex items-center justify-center pt-4">
                  {PERSONA_PREVIEWS[persona.role]}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
