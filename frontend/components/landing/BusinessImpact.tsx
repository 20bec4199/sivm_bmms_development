'use client';
import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import { BUSINESS_IMPACTS } from '../../data/landing';
import { TrendingDown, Zap, Eye, Users, Scale, Star } from 'lucide-react';

const IMPACT_ICONS: React.FC<React.SVGProps<SVGSVGElement>>[] = [TrendingDown, Zap, Eye, Users, Scale, Star];

export function BusinessImpact() {
  return (
    <section className="py-28 md:py-36 bg-[#090D12]/40 border-y border-white/[0.04]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-4">Business Impact</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
            Measurable{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Operational Impact.
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            The benefits of running your property on a modern connected operating system.
          </p>
        </motion.div>

        {/* Impact grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BUSINESS_IMPACTS.map((impact, i) => {
            const Icon = IMPACT_ICONS[i];
            return (
              <motion.div
                key={impact.title}
                className="group rounded-2xl border border-white/[0.06] p-6 flex gap-4 hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-[14px] mb-1.5">{impact.title}</h3>
                  <p className="text-slate-500 text-[13px] leading-relaxed">{impact.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
