'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, Sparkles } from 'lucide-react';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '@/services/notificationsApi';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData, isLoading } = useGetNotificationsQuery({ take: 10 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(id).unwrap();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative -m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-gray-100 dark:border-gray-800 focus:outline-none z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100/50 dark:border-gray-800/50 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Notifications
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline font-medium transition-all"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-8 text-center flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">All caught up!</p>
                  <p className="text-xs text-gray-500 mt-1">No new notifications right now</p>
                </motion.div>
              ) : (
                <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {notifications.map((notification: any, i: number) => (
                    <motion.li
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer flex gap-4 ${!notification.isRead ? 'bg-blue-50/40 dark:bg-blue-900/20' : ''}`}
                      onClick={(e) => {
                        if (!notification.isRead) handleMarkAsRead(notification.id, e);
                      }}
                    >
                      <div className="relative mt-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${!notification.isRead ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {notification.title}
                        </p>
                        <p className={`text-sm mt-1 line-clamp-2 ${!notification.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 font-medium">
                          <Clock size={12} />
                          <span>{new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 border-t border-gray-100/50 dark:border-gray-800/50 text-center bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Link href="/account/notifications" onClick={() => setIsOpen(false)} className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1">
                View all notifications →
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
