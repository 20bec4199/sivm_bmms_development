'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Network, Layers, CheckCircle } from 'lucide-react';

const PROBLEM_NODES = [
  { label: 'Residents', x: 15, y: 20, delay: 0 },
  { label: 'Maintenance', x: 78, y: 15, delay: 0.1 },
  { label: 'Security', x: 10, y: 72, delay: 0.2 },
  { label: 'Parking', x: 80, y: 75, delay: 0.3 },
  { label: 'Facilities', x: 45, y: 8, delay: 0.4 },
  { label: 'Assets', x: 50, y: 88, delay: 0.5 },
];

const SOLUTION_NODES = [
  { label: 'Residents', x: 15, y: 20, delay: 0 },
  { label: 'Maintenance', x: 78, y: 15, delay: 0.1 },
  { label: 'Security', x: 10, y: 72, delay: 0.2 },
  { label: 'Parking', x: 80, y: 75, delay: 0.3 },
  { label: 'Facilities', x: 45, y: 8, delay: 0.4 },
  { label: 'Assets', x: 50, y: 88, delay: 0.5 },
];

function NodeDot({ label, x, y, delay, connected, color }: {
  label: string; x: number; y: number; delay: number; connected: boolean; color?: string;
}) {
  return (
    <motion.div
      className="absolute flex flex-col items-center gap-1"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4, type: 'spring' }}
    >
      <div
        className="w-3 h-3 rounded-full border-2 transition-colors duration-500"
        style={{
          borderColor: connected ? (color || '#3b82f6') : '#475569',
          background: connected ? (color || '#3b82f6') + '30' : '#1e293b',
          boxShadow: connected ? `0 0 10px ${color || '#3b82f6'}60` : 'none',
        }}
      />
      <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

function ProblemVisualization() {
  // Chaotic, disconnected nodes — random lines going nowhere
  return (
    <div className="relative w-full h-48 rounded-2xl bg-[#090D12] border border-white/[0.05] overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 192" preserveAspectRatio="none">
        {/* Broken, incomplete connection lines */}
        <line x1="45" y1="38" x2="120" y2="100" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.3" />
        <line x1="234" y1="29" x2="120" y2="100" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.25" />
        <line x1="30" y1="138" x2="120" y2="100" stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 5" opacity="0.2" />
        {/* X marks for broken connections */}
        <text x="75" y="70" fill="#ef4444" fontSize="8" opacity="0.4">✕</text>
        <text x="170" y="55" fill="#ef4444" fontSize="8" opacity="0.4">✕</text>
      </svg>
      {PROBLEM_NODES.map((n) => (
        <NodeDot key={n.label} {...n} connected={false} />
      ))}
      <div className="absolute bottom-3 left-3 text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
        Fragmented Systems
      </div>
    </div>
  );
}

function SolutionVisualization() {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) setTimeout(() => setActive(true), 400);
  }, [inView]);

  const cx = 50; const cy = 50; // center percent

  return (
    <div ref={ref} className="relative w-full h-48 rounded-2xl bg-[#090D12] border border-blue-500/15 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 192" preserveAspectRatio="none">
        {/* Central BMMS core */}
        <circle cx="150" cy="96" r="22" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity={active ? 0.5 : 0} className="transition-all duration-700" />
        <circle cx="150" cy="96" r="14" fill="#1e3a8a" opacity={active ? 0.6 : 0} className="transition-all duration-700" />

        {/* Connection lines to center */}
        {[
          { x1: 45, y1: 38 }, { x1: 234, y1: 29 }, { x1: 30, y1: 138 },
          { x1: 240, y1: 144 }, { x1: 135, y1: 15 }, { x1: 150, y1: 169 },
        ].map((line, i) => (
          <motion.line
            key={i}
            x1={line.x1} y1={line.y1} x2="150" y2="96"
            stroke="#3b82f6"
            strokeWidth="0.8"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={active ? { pathLength: 1, opacity: 0.45 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          />
        ))}
      </svg>

      {SOLUTION_NODES.map((n) => (
        <NodeDot key={n.label} {...n} connected={active} color="#3b82f6" />
      ))}

      {/* Central BMMS label */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        animate={active ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="text-[10px] font-bold text-blue-400 tracking-wider">BMMS</div>
      </motion.div>

      <div className="absolute bottom-3 left-3 text-[9px] font-semibold text-blue-500 uppercase tracking-wider">
        One Connected Platform
      </div>
    </div>
  );
}

export function ProblemSolution() {
  return (
    <section id="platform" className="py-28 md:py-36 relative">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">The Problem</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight leading-tight">
            Property operations are{' '}
            <span className="text-slate-400">connected.</span>
            <br />
            Your systems should be too.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Managing properties across disconnected tools creates gaps — in communication,
            in data, and in operational efficiency.
          </p>
        </motion.div>

        {/* Visual comparison */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Network className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Fragmented Operations</h3>
            </div>
            <ProblemVisualization />
            <ul className="space-y-3">
              {[
                'Multiple disconnected systems',
                'Manual, slow processes',
                'Lost maintenance requests',
                'Communication gaps between teams',
              ].map((point) => (
                <li key={point} className="flex items-center gap-3 text-slate-400 text-[14px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500/60 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white">BMMS — One Ecosystem</h3>
            </div>
            <SolutionVisualization />
            <ul className="space-y-3">
              {[
                'One unified operational ecosystem',
                'Automated end-to-end workflows',
                'Real-time visibility across all operations',
                'Seamless team collaboration',
              ].map((point) => (
                <li key={point} className="flex items-center gap-3 text-slate-300 text-[14px]">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
