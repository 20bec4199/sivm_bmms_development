'use client';

import { createTheme, ThemeProvider as MUIThemeProvider, alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode, useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDarkMode, mounted]);

  const theme = useMemo(() => {
    const mode = mounted && isDarkMode ? 'dark' : 'light';
    
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#4f46e5', // Indigo-600
          light: '#818cf8', // Indigo-400
          dark: '#3730a3', // Indigo-800
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#64748b', // Slate-500
          light: '#94a3b8',
          dark: '#475569',
        },
        error: { main: '#e11d48' }, // Rose-600
        warning: { main: '#d97706' }, // Amber-600
        success: { main: '#10b981' }, // Emerald-500
        info: { main: '#3b82f6' }, // Blue-500
        background: {
          default: mode === 'dark' ? '#0a0f1c' : '#f8fafc',
          paper: mode === 'dark' ? '#111827' : '#ffffff',
        },
        text: {
          primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
          secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
        },
        divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      },
      typography: {
        fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 900, letterSpacing: '-0.025em' },
        h2: { fontWeight: 800, letterSpacing: '-0.025em' },
        h3: { fontWeight: 700, letterSpacing: '-0.01em' },
        h4: { fontWeight: 700, letterSpacing: '-0.01em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        subtitle1: { fontWeight: 500 },
        subtitle2: { fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
        button: { textTransform: 'none', fontWeight: 700 },
      },
      shape: {
        borderRadius: 12,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: '10px',
              padding: '8px 16px',
              boxShadow: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.08)',
                transform: 'translateY(-1px)',
              },
            },
            contained: {
              background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
              color: '#ffffff',
              '&:hover': {
                background: 'linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)',
              },
            },
            outlined: {
              borderWidth: '1.5px',
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
            }
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: '16px',
              backgroundImage: 'none',
              boxShadow: mode === 'dark' 
                ? '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.24)' 
                : '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'}`,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
            elevation1: {
              boxShadow: mode === 'dark' 
                ? '0 1px 3px rgba(0,0,0,0.4)' 
                : '0 1px 3px rgba(0,0,0,0.05)',
            },
            elevation2: {
              boxShadow: mode === 'dark' 
                ? '0 4px 6px -1px rgba(0,0,0,0.5)' 
                : '0 4px 6px -1px rgba(0,0,0,0.05)',
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: '10px',
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
              transition: 'all 0.2s',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
              '&.Mui-focused': {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                boxShadow: mode === 'dark' ? '0 0 0 3px rgba(79, 70, 229, 0.2)' : '0 0 0 3px rgba(79, 70, 229, 0.15)',
              }
            },
            notchedOutline: {
              borderColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)',
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
              padding: '16px',
            },
            head: {
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.75rem',
              color: mode === 'dark' ? '#94a3b8' : '#64748b',
              backgroundColor: mode === 'dark' ? '#1e293b' : '#f8fafc',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#0a0f1c' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
            }
          }
        },
      },
    });
  }, [isDarkMode, mounted]);

  if (!mounted) return null;

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
