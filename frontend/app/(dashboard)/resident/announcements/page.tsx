'use client';

import Link from 'next/link';
import { Clock, Megaphone } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '@/services/notificationsApi';

interface ResidentAnnouncement {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export default function ResidentAnnouncementsPage() {
  const { data, isLoading, isError } = useGetNotificationsQuery({ take: 100 });
  const [markAsRead] = useMarkAsReadMutation();
  const announcements = ((data?.data ?? []) as ResidentAnnouncement[]).filter((notification) =>
    notification.type === 'IN_APP' && notification.title?.startsWith('[ANNOUNCEMENT]'),
  );

  return (
    <div className="w-full space-y-6">
      <PageHeader title="Announcements" description="Community notices sent to your resident account." />

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading announcements...</p>
      ) : isError ? (
        <p role="alert" className="py-12 text-center text-sm text-red-600">Announcements could not be loaded. Please try again.</p>
      ) : announcements.length === 0 ? (
        <div className="py-16 text-center">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="font-semibold text-slate-800 dark:text-white">No announcements yet</p>
          <p className="mt-1 text-sm text-slate-500">Community announcements will appear here when they are sent to you.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
          {announcements.map((notification) => (
            <li key={notification.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Megaphone size={17} className="shrink-0 text-blue-600" />
                  <p className="font-semibold text-slate-900 dark:text-white">{notification.title.replace(/^\[ANNOUNCEMENT\]\s*/, '')}</p>
                  {!notification.isRead && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800 dark:bg-blue-500/15 dark:text-blue-300">New</span>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{notification.message}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={13} />
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className="self-start rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-slate-500">
        For other account updates, visit <Link href="/resident/notifications" className="font-semibold text-blue-700 hover:underline dark:text-blue-400">Notifications</Link>.
      </p>
    </div>
  );
}