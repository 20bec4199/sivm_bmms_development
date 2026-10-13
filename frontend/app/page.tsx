'use client';

/**
 * BMMS Landing Page — Premium 3D Redesign
 *
 * Architecture:
 *   - Components: components/landing/  (section components)
 *   - 3D Scenes:  components/3d-landing/ (React Three Fiber, lazy-loaded)
 *   - Data:       data/landing.ts (all content, terminology)
 *
 * Design System:
 *   Background:   #05070A
 *   Surface:      #090D12 / #0D1218
 *   Border:       rgba(255,255,255,0.05–0.12)
 *   Primary text: #F5F7FA
 *   Secondary:    #94A3B8
 *   Accent:       Electric Blue #3b82f6, Cyan #22d3ee
 */

import { LandingNavbar }        from '../components/landing/LandingNavbar';
import { HeroSection }          from '../components/landing/HeroSection';
import { TrustStrip }           from '../components/landing/TrustStrip';
import { ProblemSolution }      from '../components/landing/ProblemSolution';
import { ModuleExplorer }       from '../components/landing/ModuleExplorer';
import { PropertyHierarchy }    from '../components/landing/PropertyHierarchy';
import { ParkingExperience }    from '../components/landing/ParkingExperience';
import { MaintenanceWorkflow }  from '../components/landing/MaintenanceWorkflow';
import { RoleExplorer }         from '../components/landing/RoleExplorer';
import { SecurityArchitecture } from '../components/landing/SecurityArchitecture';
import { BusinessImpact }       from '../components/landing/BusinessImpact';
import { CTASection }           from '../components/landing/CTASection';
import { LandingFooter }        from '../components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background: '#05070A',
        color: '#F5F7FA',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* ── Navigation ─────────────────────────────────── */}
      <LandingNavbar />

      {/* ── SCENE 01: The Property ─────────────────────── */}
      <HeroSection />

      {/* ── Trust strip ────────────────────────────────── */}
      <TrustStrip />

      {/* ── SCENE 02: The Problem ─────────────────────── */}
      <ProblemSolution />

      {/* ── SCENE 03: The Platform ────────────────────── */}
      <ModuleExplorer />

      {/* ── SCENE 05: The Structure ───────────────────── */}
      <PropertyHierarchy />

      {/* ── SmartiPark / Parking ──────────────────────── */}
      <ParkingExperience />

      {/* ── SCENE 06: The Workflow ────────────────────── */}
      <MaintenanceWorkflow />

      {/* ── SCENE 07: The People ──────────────────────── */}
      <RoleExplorer />

      {/* ── SCENE 08: The Infrastructure ──────────────── */}
      <SecurityArchitecture />

      {/* ── SCENE 09: The Outcome ─────────────────────── */}
      <BusinessImpact />

      {/* ── SCENE 10: The CTA ─────────────────────────── */}
      <CTASection />

      {/* ── Footer ────────────────────────────────────── */}
      <LandingFooter />
    </div>
  );
}
