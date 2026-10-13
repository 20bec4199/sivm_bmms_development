'use client';

import React from 'react';
import MUIBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from 'next/link';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname();
  
  if (!pathname || pathname === '/dashboard') return null;

  const pathnames = pathname.split('/').filter((x) => x);

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
        {pathnames[pathnames.length - 1]?.replace(/-/g, ' ')}
      </Typography>
      <MUIBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#64748B' }}>
          Dashboard
        </Link>
        {pathnames.map((value, index) => {
          if (index === 0) return null;

          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return last ? (
            <Typography color="text.primary" key={to} sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
              {value.replace(/-/g, ' ')}
            </Typography>
          ) : (
            <Link href={to} key={to} style={{ textDecoration: 'none', color: '#64748B', textTransform: 'capitalize' }}>
              {value.replace(/-/g, ' ')}
            </Link>
          );
        })}
      </MUIBreadcrumbs>
    </Box>
  );
}
