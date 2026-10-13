'use client';

import Link from 'next/link';
import { Layers } from 'lucide-react';

const FOOTER_LINKS = {
  Platform: ['Property Admin', 'Facility Mgmt', 'Work Orders', 'Asset Management', 'Parking', 'Security'],
  Solutions: ['Property Managers', 'Facility Teams', 'Security Teams', 'Residents'],
  Resources: ['Documentation', 'Support', 'FAQs', 'Status'],
  Company: ['About', 'Contact', 'Careers', 'Blog'],
};

export function LandingFooter() {
  return (
    <footer className="border-t border-white/[0.05] bg-[#090D12] pt-16 pb-10 relative">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 md:gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group w-fit">
              <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#0D1218] border border-white/[0.08]">
                <Layers className="w-4 h-4 text-blue-400" />
              </span>
              <span className="font-bold text-lg text-white tracking-tight">BMMS</span>
            </Link>
            <p className="text-slate-500 text-[13px] leading-relaxed max-w-[240px]">
              One Intelligent Platform to manage your entire property ecosystem — built for scale, security, and speed.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-[13px] mb-5 tracking-wide">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-slate-500 text-[13px] hover:text-slate-300 transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-slate-600">
          <p>© {new Date().getFullYear()} BMMS Enterprise. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
