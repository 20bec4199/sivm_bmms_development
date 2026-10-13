'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } from '@/services/notificationsApi';
import { Bell, Check, Clock, Info, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const { data: notificationsData, isLoading } = useGetNotificationsQuery({ take: 50 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');

  const notifications = notificationsData?.data || [];
  
  const filteredNotifications = notifications.filter((n: any) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'READ') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Notifications" />
        <div className="p-8 text-center text-gray-500">Loading your notifications...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader 
          title="Notifications" 
          description="Stay updated with all activities, work orders, and account alerts."
        />
        {unreadCount > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Button 
              onClick={handleMarkAllAsRead} 
              disabled={isMarkingAll}
              className="shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 shadow-sm border border-blue-200 dark:border-blue-800/50"
              variant="outline"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </motion.div>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === 'ALL'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
          }`}
        >
          All Messages
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            filter === 'UNREAD'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 py-0.5 px-2 rounded-full text-xs">
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('READ')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            filter === 'READ'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
          }`}
        >
          Read
        </button>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800/60 shadow-xl shadow-gray-200/50 dark:shadow-none bg-white/70 dark:bg-gray-900/60 backdrop-blur-2xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {filteredNotifications.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-20 text-center flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mx-auto mb-5 shadow-inner">
                  <Bell className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {filter === 'UNREAD' ? 'No unread messages!' : filter === 'READ' ? 'No read messages.' : "You're all caught up!"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  {filter === 'UNREAD' ? 'You have read all your notifications.' : 'There are no new notifications to show right now. Check back later.'}
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="divide-y divide-gray-100 dark:divide-gray-800/60"
              >
                {filteredNotifications.map((notification: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={notification.id} 
                    className={`p-6 transition-all duration-300 group flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative overflow-hidden ${
                      !notification.isRead 
                        ? 'bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50/80 dark:hover:bg-blue-900/20' 
                        : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    {/* Unread Accent Line */}
                    {!notification.isRead && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600"></div>
                    )}
                    
                    <div className="flex gap-5 relative z-10 w-full">
                      <div className="shrink-0 mt-1">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          !notification.isRead 
                            ? 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30' 
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          {notification.type === 'IN_APP' ? <Sparkles size={20} /> : <Info size={20} />}
                        </div>
                      </div>
                      <div className="space-y-1.5 flex-1 pr-4">
                        <h4 className={`text-base font-bold flex items-center gap-2 ${
                          !notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                          {!notification.isRead && (
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                          )}
                        </h4>
                        <p className={`text-sm leading-relaxed ${
                          !notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400 dark:text-gray-500 font-semibold tracking-wide">
                          <Clock size={14} />
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString(undefined, { 
                              weekday: 'short', month: 'short', day: 'numeric' 
                            })} at {new Date(notification.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {!notification.isRead && (
                      <div className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pl-17 sm:pl-0 shrink-0 relative z-10 self-center">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur shadow-sm border border-gray-200 dark:border-gray-700 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          <Check size={16} className="mr-1.5" />
                          Mark as read
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
