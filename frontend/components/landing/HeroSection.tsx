'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowRight, Zap } from 'lucide-react';
import { Suspense } from 'react';

const DigitalBuilding = dynamic(() => import('../3d-landing/DigitalBuilding'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
    </div>
  ),
});

const METADATA_TAGS = ['Property', 'Facility', 'Maintenance', 'Parking', 'Security'];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
      {/* Background architecture */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(59,130,246,0.12),transparent)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[45%_55%] gap-12 lg:gap-0 items-center w-full">
        {/* LEFT — Copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          {/* Eyebrow */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 mb-8">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/8 text-blue-400 text-[11px] font-semibold uppercase tracking-widest">
              <Zap className="w-3 h-3" />
              Intelligent Property Operations
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-[3.25rem] sm:text-[3.75rem] lg:text-[4.25rem] font-extrabold tracking-tight text-white leading-[1.05] mb-6"
          >
            Everything Your<br />
            Property Needs.
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
              One Intelligent Platform.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-[1.05rem] text-slate-400 leading-relaxed mb-10 max-w-[520px]"
          >
            Manage property operations, facilities, maintenance, parking,
            security and resident services through one connected platform.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link href="/login">
              <button className="flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[14px] transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/25 group active:scale-[0.98]">
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </Link>
            <a href="#platform">
              <button className="flex items-center justify-center h-12 px-7 rounded-full border border-white/[0.1] bg-white/[0.03] text-white font-semibold text-[14px] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-200 active:scale-[0.98]">
                Explore Platform
              </button>
            </a>
          </motion.div>

          {/* Metadata tags */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-x-5 gap-y-2">
            {METADATA_TAGS.map((tag, i) => (
              <span key={tag} className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-slate-500">
                {i > 0 && <span className="w-px h-3 bg-slate-700" />}
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — 3D building */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full h-[500px] lg:h-[640px]"
        >
          <Suspense fallback={null}>
            <DigitalBuilding className="w-full h-full" />
          </Suspense>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-600">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent"
        />
      </motion.div>
    </section>
  );
}
