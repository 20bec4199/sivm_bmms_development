'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { WORKFLOW_STEPS } from '../../data/landing';
import { Smartphone, UserCheck, FileText, Wrench, CheckCircle2, Shield } from 'lucide-react';

const STEP_ICONS: React.FC<React.SVGProps<SVGSVGElement>>[] = [Smartphone, UserCheck, FileText, Wrench, CheckCircle2, Shield];

export function MaintenanceWorkflow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [activeStep, setActiveStep] = useState(-1);

  useEffect(() => {
    if (!inView) return;
    WORKFLOW_STEPS.forEach((_, i) => {
      setTimeout(() => setActiveStep(i), 400 + i * 350);
    });
  }, [inView]);

  return (
    <section id="workflow" className="py-28 md:py-36 bg-[#090D12]/40 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Connected Workflows</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            From Request{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              to Resolution.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every maintenance request flows through a structured, automated workflow — keeping
            all stakeholders informed at every step.
          </p>
        </motion.div>

        {/* Workflow steps */}
        <div ref={ref} className="relative">
          {/* Desktop horizontal layout */}
          <div className="hidden md:block">
            {/* Connecting line */}
            <div className="relative flex items-center mb-12 px-8">
              <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-px bg-white/[0.05]" />
              <motion.div
                className="absolute left-8 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: '0%' }}
                animate={activeStep >= 0 ? { width: `${(activeStep / (WORKFLOW_STEPS.length - 1)) * (100 - 0)}%` } : {}}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            <div className="grid grid-cols-6 gap-4">
              {WORKFLOW_STEPS.map((step, i) => {
                const Icon = STEP_ICONS[i];
                const isActive = i <= activeStep;
                return (
                  <motion.div
                    key={step.id}
                    className="flex flex-col items-center text-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 relative z-10"
                      style={{
                        borderColor: isActive ? step.color + '60' : 'rgba(255,255,255,0.06)',
                        background: isActive ? step.color + '15' : '#0D1218',
                        boxShadow: isActive ? `0 0 20px ${step.color}30` : 'none',
                      }}
                      animate={isActive ? { scale: [0.8, 1.05, 1] } : {}}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Icon className="w-6 h-6 transition-colors" style={{ color: isActive ? step.color : '#475569' }} />
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          initial={{ opacity: 0.5, scale: 1 }}
                          animate={{ opacity: 0, scale: 1.5 }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{ border: `1px solid ${step.color}` }}
                        />
                      )}
                    </motion.div>

                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: isActive ? step.color : '#475569' }}>
                        Step {i + 1}
                      </div>
                      <div className={`font-semibold text-[13px] mb-1 transition-colors ${isActive ? 'text-white' : 'text-slate-600'}`}>
                        {step.title}
                      </div>
                      <div className={`text-[11px] leading-snug transition-colors ${isActive ? 'text-slate-400' : 'text-slate-700'}`}>
                        {step.desc}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile vertical layout */}
          <div className="md:hidden space-y-4">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[i];
              const isActive = i <= activeStep;
              return (
                <motion.div
                  key={step.id}
                  className="flex items-start gap-4"
                  animate={isActive ? { opacity: 1 } : { opacity: 0.3 }}
                >
                  <div
                    className="w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center border"
                    style={{
                      borderColor: isActive ? step.color + '50' : 'rgba(255,255,255,0.06)',
                      background: isActive ? step.color + '15' : 'transparent',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: isActive ? step.color : '#475569' }} />
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-white">{step.title}</div>
                    <div className="text-[12px] text-slate-500 mt-0.5">{step.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
