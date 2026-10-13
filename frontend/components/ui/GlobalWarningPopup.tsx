'use client';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { hideWarning } from '@/store/slices/uiSlice';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export function GlobalWarningPopup() {
  const dispatch = useDispatch();
  const warning = useSelector((state: RootState) => state.ui.warning);

  if (!warning.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-orange-100 dark:border-orange-900/30 bg-orange-50/50 dark:bg-orange-900/10">
          <div className="flex items-center text-orange-600 dark:text-orange-500">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <h2 className="text-lg font-semibold">{warning.title}</h2>
          </div>
          <button 
            onClick={() => dispatch(hideWarning())}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed mb-6">
            {warning.message}
          </p>
          
          <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-4">
            <Button 
              className="px-6 bg-orange-600 hover:bg-orange-700 text-white shadow-sm w-full sm:w-auto"
              onClick={() => dispatch(hideWarning())}
            >
              Acknowledge
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
