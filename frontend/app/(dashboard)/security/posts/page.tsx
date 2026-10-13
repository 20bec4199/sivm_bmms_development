'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, ClipboardList, MapPin, ShieldCheck } from 'lucide-react';
import { getMyAssignedPosts, type MyPostAssignment } from '@/services/securityApi';

const WEEKDAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
  FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const formatDate = (value: string | null) => value
  ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  : null;

const locationLabel = (post: MyPostAssignment['post']) => {
  if (post.parkingArea) {
    return `Parking · ${post.parkingArea.name}${post.parkingArea.propertyNode ? ` · ${post.parkingArea.propertyNode.name}` : ''}`;
  }
  if (post.propertyNode) return `${post.propertyNode.nodeType} · ${post.propertyNode.name}`;
  return 'Organization-wide / mobile post';
};

export default function SecurityMyPostsPage() {
  const [assignments, setAssignments] = useState<MyPostAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyAssignedPosts()
      .then(setAssignments)
      .catch(() => setError('Could not load your assigned posts.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Posts</h1>
          <p className="text-sm text-slate-500">Duty posts and shifts assigned to you by your organization admin</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-slate-200 dark:border-white/10">
          <ShieldCheck className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="font-semibold text-slate-800 dark:text-white">No posts assigned yet</p>
          <p className="text-sm text-slate-500 mt-1">Your organization admin has not deployed you to a post.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">{assignment.post.name}</h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
                  {assignment.post.postType}
                </span>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={14} />{locationLabel(assignment.post)}
              </p>
              <p className="flex items-center gap-1.5 text-sm text-slate-500 mt-1.5">
                <CalendarClock size={14} />
                {assignment.shiftName}
                {(assignment.startsAt || assignment.endsAt) && (
                  <span>· {formatDate(assignment.startsAt) ?? 'No start'} to {formatDate(assignment.endsAt) ?? 'no end'}</span>
                )}
                {assignment.daysOfWeek.length > 0 && (
                  <span>· {assignment.daysOfWeek.map((day) => WEEKDAY_SHORT[day] ?? day).join(', ')}</span>
                )}
              </p>
              {assignment.post.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{assignment.post.description}</p>
              )}
              {assignment.post.duties.length > 0 && (
                <p className="flex items-start gap-1.5 text-xs text-slate-500 mt-2">
                  <ClipboardList size={13} className="mt-0.5 shrink-0" />
                  Duties: {assignment.post.duties.join(' · ')}
                </p>
              )}
              {assignment.notes && (
                <p className="text-xs text-slate-400 mt-2">Note: {assignment.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
