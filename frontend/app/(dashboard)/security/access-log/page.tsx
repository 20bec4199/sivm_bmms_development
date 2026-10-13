'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, Calendar, ArrowUpDown, LogIn, LogOut } from 'lucide-react';
import { getAccessLog } from '@/services/securityApi';

export default function AccessLogPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(0);
  const take = 30;

  const load = useCallback(() => {
    setLoading(true);
    getAccessLog({ search: search || undefined, date, skip: page * take, take })
      .then((res) => {
        setData(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, date, page]);

  useEffect(() => { setPage(0); }, [search, date]);
  useEffect(() => { load(); }, [load]);

  const formatTime = (ts?: string) => (ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
  const duration = (checkIn?: string, checkOut?: string) => {
    if (!checkIn || !checkOut) return null;
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const mins = Math.round(ms / 60000);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/[0.07] border border-slate-200 dark:border-white/10 flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Log</h1>
          <p className="text-sm text-slate-500">{total} record{total !== 1 ? 's' : ''} · visitor entry / exit history</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <div className="relative">
          <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Visitor</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Destination</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-1"><LogIn className="w-3 h-3" /> Check In</div>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <div className="flex items-center gap-1"><LogOut className="w-3 h-3" /> Check Out</div>
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !data.length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-400">
                    No access events for {new Date(date).toLocaleDateString()}
                  </td>
                </tr>
              ) : (
                data.map((log) => {
                  const visitor = log.registration?.visitor;
                  const node = log.registration?.propertyNode;
                  const isActive = log.checkInTime && !log.checkOutTime;
                  const dur = duration(log.checkInTime, log.checkOutTime);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-white">
                          {visitor?.firstName} {visitor?.lastName}
                        </div>
                        {visitor?.phone && (
                          <div className="text-[11px] text-slate-400">{visitor.phone}</div>
                        )}
                        {visitor?.idNumber && (
                          <div className="text-[11px] text-slate-400">ID: {visitor.idNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {node?.name ?? '—'}
                      </td>
                      <td className="px-4 py-4">
                        {log.checkInTime ? (
                          <span className="text-[12px] text-green-700 dark:text-green-400 font-semibold">{formatTime(log.checkInTime)}</span>
                        ) : (
                          <span className="text-slate-400 text-[12px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {log.checkOutTime ? (
                          <span className="text-[12px] text-slate-600 dark:text-slate-400">{formatTime(log.checkOutTime)}</span>
                        ) : (
                          <span className="text-slate-400 text-[12px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-[12px] text-slate-500">{dur ?? '—'}</td>
                      <td className="px-4 py-4">
                        {isActive ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-green-700 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Inside
                          </span>
                        ) : log.checkOutTime ? (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Left</span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Not arrived</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > take && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-white/10">
            <div className="text-[12px] text-slate-400">
              Showing {page * take + 1}–{Math.min((page + 1) * take, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * take >= total}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
