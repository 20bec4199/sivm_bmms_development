'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { HIERARCHY_LEVELS } from '../../data/landing';
import { Building2, Layers, Package, Key, Users } from 'lucide-react';

const ICONS: React.FC<React.SVGProps<SVGSVGElement>>[] = [Building2, Layers, Package, Key, Users];

export function PropertyHierarchy() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.7], ['0%', '100%']);

  return (
    <section id="hierarchy" className="py-28 md:py-36 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Property Structure</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            From Property to Unit.
            <br />
            <span className="text-slate-400">One Connected Hierarchy.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            BMMS models your actual property structure — so every piece of data
            has a precise location in the hierarchy.
          </p>
        </motion.div>

        <div ref={ref} className="relative max-w-lg mx-auto">
          {/* Animated vertical progress line */}
          <div className="absolute left-[calc(50%-1px)] top-8 bottom-8 w-px bg-white/[0.05]">
            <motion.div
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-0">
            {HIERARCHY_LEVELS.map((level, i) => {
              const Icon = ICONS[i];
              const isLeft = i % 2 === 0;

              return (
                <motion.div
                  key={level.level}
                  className="relative flex items-center"
                  initial={{ opacity: 0, x: isLeft ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  {/* Left side */}
                  <div className={`flex-1 pr-8 ${isLeft ? 'text-right' : 'opacity-0 pointer-events-none'}`}>
                    {isLeft && (
                      <>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: level.color }}>
                          Level {i + 1}
                        </div>
                        <div className="text-[22px] font-bold text-white mb-1">{level.level}</div>
                        <div className="text-slate-500 text-[13px]">{level.desc}</div>
                      </>
                    )}
                  </div>

                  {/* Center node */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-lg"
                      style={{
                        borderColor: level.color + '50',
                        background: level.color + '15',
                        boxShadow: `0 0 20px ${level.color}20`,
                      }}
                      whileInView={{ scale: [0.5, 1.1, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.12 }}
                    >
                      <Icon className="w-6 h-6" style={{ color: level.color }} />
                    </motion.div>
                  </div>

                  {/* Right side */}
                  <div className={`flex-1 pl-8 ${!isLeft ? '' : 'opacity-0 pointer-events-none'}`}>
                    {!isLeft && (
                      <>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: level.color }}>
                          Level {i + 1}
                        </div>
                        <div className="text-[22px] font-bold text-white mb-1">{level.level}</div>
                        <div className="text-slate-500 text-[13px]">{level.desc}</div>
                      </>
                    )}
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
