'use client';

import { useState } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useGetNotificationsQuery, useMarkAllAsReadMutation, useMarkAsReadMutation } from '@/services/notificationsApi';

type NotificationFilter = 'ALL' | 'UNREAD' | 'READ';
interface ResidentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function ResidentNotificationsPage() {
  const [filter, setFilter] = useState<NotificationFilter>('ALL');
  const { data, isLoading, isError } = useGetNotificationsQuery({ take: 100 });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();
  const notifications = (data?.data ?? []) as ResidentNotification[];
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const visibleNotifications = notifications.filter((notification) => {
    if (filter === 'UNREAD') return !notification.isRead;
    if (filter === 'READ') return notification.isRead;
    return true;
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Notifications" description="Updates about your home and community account." />
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAll}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <Check size={16} />
            {isMarkingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      <div className="flex gap-5 border-b border-slate-200 dark:border-white/10">
        {(['ALL', 'UNREAD', 'READ'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`border-b-2 px-1 py-3 text-sm font-semibold ${filter === value ? 'border-blue-600 text-blue-700 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            {value === 'ALL' ? 'All' : value === 'UNREAD' ? `Unread${unreadCount ? ` (${unreadCount})` : ''}` : 'Read'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading notifications...</p>
      ) : isError ? (
        <p role="alert" className="py-12 text-center text-sm text-red-600">Notifications could not be loaded. Please try again.</p>
      ) : visibleNotifications.length === 0 ? (
        <div className="py-16 text-center">
          <Bell className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-800 dark:text-white">{filter === 'UNREAD' ? 'You are all caught up' : 'No notifications yet'}</p>
          <p className="mt-1 text-sm text-slate-500">New updates will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
          {visibleNotifications.map((notification) => (
            <li key={notification.id} className={`flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between ${notification.isRead ? '' : 'bg-blue-50/50 dark:bg-blue-500/5'}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-white">{notification.title}</p>
                  {!notification.isRead && <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} />
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  aria-label={`Mark ${notification.title} as read`}
                  title="Mark as read"
                  className="self-start rounded-md p-2 text-slate-500 hover:bg-white hover:text-blue-700 dark:hover:bg-white/10 dark:hover:text-blue-400"
                >
                  <Check size={17} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}