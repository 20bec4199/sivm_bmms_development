import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BMMS — Intelligent Property & Facility Management Platform',
  description:
    'BMMS connects property management, facilities, maintenance, parking, security and resident operations in one intelligent platform.',
  openGraph: {
    title: 'BMMS — One Intelligent Property Operating System',
    description:
      'Manage buildings, towers, floors, units, residents, parking, work orders and security through one connected platform.',
    type: 'website',
  },
};

export default function LandingMetadata() {
  // This file only exports metadata — actual page is in page.tsx (client component)
  return null;
}
