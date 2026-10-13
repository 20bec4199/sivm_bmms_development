'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { toggleSidebar } from '@/store/slices/uiSlice';

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1c] flex transition-colors duration-300 font-sans selection:bg-blue-500/30">
      <Sidebar />
      
      <div className={`flex flex-col min-h-screen transition-all duration-300 flex-1 ${sidebarOpen ? 'md:pl-64' : 'md:pl-0'}`}>
        <Header onMenuClick={() => dispatch(toggleSidebar())} />
        
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
