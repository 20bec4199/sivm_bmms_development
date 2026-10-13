'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { NAV_LINKS } from '../../data/landing';
import { useState, useEffect } from 'react';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(5,7,10,0.80)] backdrop-blur-xl border-b border-white/[0.06] py-4'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#0D1218] border border-white/[0.08] group-hover:border-blue-500/40 transition-colors">
            <Layers className="w-4 h-4 text-blue-400" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-bold text-[17px] text-white tracking-tight">BMMS</span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">Smart Property Platform</span>
          </span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[13px] font-medium text-slate-400 hover:text-white transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-blue-500 to-cyan-400 group-hover:w-full transition-all duration-300 rounded-full" />
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden sm:block text-[13px] font-medium text-slate-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link href="/login">
            <button className="h-9 px-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
