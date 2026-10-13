'use client';

import React from 'react';
import { Menu, Bell, User, Moon, Sun } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { toggleDarkMode } from '@/store/slices/uiSlice';
import { NotificationDropdown } from './NotificationDropdown';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isDarkMode = useSelector((state: RootState) => state.ui.isDarkMode);

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
        onClick={onMenuClick}
      >
        <span className="sr-only">Toggle sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          {/* Breadcrumb or Search could go here */}
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
            onClick={() => dispatch(toggleDarkMode())}
          >
            <span className="sr-only">Toggle theme</span>
            {isDarkMode ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <NotificationDropdown />

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-white/10" aria-hidden="true" />

          <div className="flex items-center gap-x-4 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shadow-inner">
              {user?.firstName?.charAt(0) || <User size={16} />}
            </div>
            <span className="hidden lg:flex lg:items-center text-sm font-semibold text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
