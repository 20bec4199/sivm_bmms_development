'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { logout } from '../../store/slices/authSlice';
import { authService } from '../../services/auth.service';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Moon, Sun } from 'lucide-react';
import { toggleDarkMode } from '@/store/slices/uiSlice';

export function Header() {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(logout());
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            SIVM
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => dispatch(toggleDarkMode())}
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-full transition-colors"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          
          {isAuthenticated ? (
            <>
              <Link href="/dashboard">
                <Button variant="primary">Dashboard</Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="text-red-600 dark:text-red-400">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
