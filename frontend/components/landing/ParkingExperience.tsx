'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PARKING_BAY_TYPES } from '../../data/landing';
import { Car, MapPin, Timer, LogOut, ScanLine } from 'lucide-react';

const PARKING_FLOW = [
  { step: 'Vehicle Arrives', icon: Car, color: '#3b82f6' },
  { step: 'Identification', icon: ScanLine, color: '#22d3ee' },
  { step: 'Session Starts', icon: Timer, color: '#10b981' },
  { step: 'Bay Assigned', icon: MapPin, color: '#f59e0b' },
  { step: 'Checkout', icon: LogOut, color: '#8b5cf6' },
];

// Simplified 2D parking grid (SVG/CSS)
function ParkingGrid({ selectedType }: { selectedType: string | null }) {
  const cols = 8;
  const rows = 5;

  const getBayColor = (i: number): { fill: string; label: string } => {
    // Distribute bay types across grid
    if (i < 4) return { fill: '#8b5cf6', label: 'Accessible' };
    if (i < 12) return { fill: '#22d3ee', label: 'EV Charging' };
    if (i < 18) return { fill: '#f59e0b', label: 'Visitor' };
    if (i < 30) return { fill: '#3b82f6', label: 'Reserved' };
    if (i < 38) return { fill: '#ef4444', label: 'Occupied' };
    return { fill: '#10b981', label: 'Available' };
  };

  return (
    <div className="w-full rounded-2xl bg-[#090D12] border border-white/[0.06] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-1">DEMO DATA</div>
          <div className="text-white font-bold text-lg">Parking Level B1</div>
        </div>
        <div className="text-[12px] text-slate-500">40 bays · Zone A</div>
      </div>

      {/* Bay grid */}
      <div
        className="grid gap-1.5 mb-6"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {Array.from({ length: cols * rows }, (_, i) => {
          const { fill, label } = getBayColor(i);
          const isHighlighted = selectedType === null || label === selectedType;
          return (
            <motion.div
              key={i}
              className="rounded-lg relative group cursor-default"
              style={{
                aspectRatio: '1.4 / 1',
                background: isHighlighted ? fill + '25' : '#0D1218',
                border: `1px solid ${isHighlighted ? fill + '50' : 'rgba(255,255,255,0.04)'}`,
                boxShadow: isHighlighted ? `0 0 8px ${fill}30` : 'none',
              }}
              animate={{ opacity: isHighlighted ? 1 : 0.2 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: isHighlighted ? fill : '#334155' }} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {PARKING_BAY_TYPES.map((bay) => (
          <div key={bay.type} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: bay.color }} />
            {bay.type} ({bay.count})
          </div>
        ))}
      </div>
    </div>
  );
}

export function ParkingExperience() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [activeFlowStep, setActiveFlowStep] = useState<number | null>(null);

  return (
    <section id="parking" className="py-28 md:py-36">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">SmartiPark Module</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Parking, Connected{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              to the Property.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Full parking lifecycle management — from bay allocation and active sessions
            to permits, reservations and violations. All integrated with your property data.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* LEFT — parking grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <ParkingGrid selectedType={selectedType} />

            {/* Bay type filter pills */}
            <div className="flex flex-wrap gap-2 mt-4">
              {PARKING_BAY_TYPES.map((bay) => (
                <button
                  key={bay.type}
                  onClick={() => setSelectedType(selectedType === bay.type ? null : bay.type)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200"
                  style={{
                    borderColor: selectedType === bay.type ? bay.color + '60' : 'rgba(255,255,255,0.07)',
                    background: selectedType === bay.type ? bay.color + '15' : 'transparent',
                    color: selectedType === bay.type ? bay.color : '#64748b',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: bay.color }} />
                  {bay.type}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RIGHT — operational flow */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Parking Session Flow</h3>
              <p className="text-slate-500 text-[14px]">
                From vehicle arrival to checkout — every step of a parking session
                is tracked, logged and attributed to the correct unit and resident.
              </p>
            </div>

            <div className="space-y-3">
              {PARKING_FLOW.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    className="flex items-center gap-4 p-4 rounded-2xl border cursor-default"
                    style={{
                      borderColor: activeFlowStep === i ? item.color + '40' : 'rgba(255,255,255,0.05)',
                      background: activeFlowStep === i ? item.color + '08' : 'transparent',
                    }}
                    onHoverStart={() => setActiveFlowStep(i)}
                    onHoverEnd={() => setActiveFlowStep(null)}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <div
                      className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border"
                      style={{
                        borderColor: item.color + '40',
                        background: item.color + '15',
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-white">{item.step}</div>
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Step {i + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature tags */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Includes</div>
              <div className="flex flex-wrap gap-2">
                {['Parking Areas', 'Parking Zones', 'Bay Management', 'Allocations', 'Sessions', 'Permits', 'Reservations', 'Violations'].map(f => (
                  <span key={f} className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-white/[0.07] text-slate-400">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
