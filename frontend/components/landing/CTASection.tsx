'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="py-28 md:py-36 relative overflow-hidden">
      {/* Background depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(59,130,246,0.08),transparent)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
        {/* Corner glow points */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-cyan-500/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-10">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-500/60" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">
              Get Started Today
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-500/60" />
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.05] mb-6">
            Your Property.
            <br />
            <span className="text-slate-400">One Connected</span>
            <br />
            Operating System.
          </h2>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Bring property management, facilities, security, maintenance and resident
            services together with BMMS — one intelligent platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login">
              <button className="flex items-center justify-center gap-2.5 h-14 px-9 rounded-full bg-white text-[#05070A] font-bold text-[15px] hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:scale-[1.02] transition-all duration-300 group active:scale-[0.98]">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <button className="flex items-center justify-center h-14 px-9 rounded-full border border-white/[0.12] text-white font-semibold text-[15px] hover:bg-white/[0.06] hover:border-white/[0.2] transition-all duration-300 active:scale-[0.98]">
              Talk to Us
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
