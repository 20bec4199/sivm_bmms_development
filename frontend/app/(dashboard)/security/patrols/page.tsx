'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, ChevronRight, CheckCircle2, Clock, Power } from 'lucide-react';
import {
  getPatrolRoutes, createPatrolRoute, getPatrolRoute,
  logPatrolCheckpoint, togglePatrolRoute, getPatrolLogs,
  type PatrolLog,
  type PatrolRoute,
} from '@/services/securityApi';

interface Checkpoint { name: string; location: string; orderIndex: number; latitude?: number; longitude?: number; }

export default function SecurityPatrolsPage() {
  const [routes, setRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PatrolRoute | null>(null);
  const [logs, setLogs] = useState<PatrolLog[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activePatrol, setActivePatrol] = useState<string | null>(null);
  const [logNotes, setLogNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [newRoute, setNewRoute] = useState({ name: '', description: '' });
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([
    { name: '', location: '', orderIndex: 1 },
  ]);

  const load = () => {
    setLoading(true);
    getPatrolRoutes()
      .then(setRoutes)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadRoute = (id: string) => {
    Promise.all([getPatrolRoute(id), getPatrolLogs({ routeId: id })])
      .then(([route, logsData]) => {
        setSelected(route);
        setLogs(Array.isArray(logsData) ? logsData : []);
      })
      .catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoute.name.trim()) return;
    const validCps = checkpoints.filter((cp) => cp.name.trim());
    if (!validCps.length) return alert('Add at least one checkpoint');
    setSubmitting(true);
    try {
      await createPatrolRoute({
        name: newRoute.name,
        description: newRoute.description || undefined,
        checkpoints: validCps,
      });
      setNewRoute({ name: '', description: '' });
      setCheckpoints([{ name: '', location: '', orderIndex: 1 }]);
      setShowCreateForm(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to create route');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogCheckpoint = async (checkpointId: string) => {
    setSubmitting(true);
    try {
      await logPatrolCheckpoint({ checkpointId, notes: logNotes || undefined });
      setLogNotes('');
      if (selected) loadRoute(selected.id);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to log checkpoint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await togglePatrolRoute(id);
      load();
      if (selected?.id === id) loadRoute(id);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to toggle route');
    }
  };

  const addCheckpoint = () =>
    setCheckpoints((prev) => [...prev, { name: '', location: '', orderIndex: prev.length + 1 }]);

  const removeCheckpoint = (i: number) =>
    setCheckpoints((prev) => prev.filter((_, idx) => idx !== i).map((cp, idx) => ({ ...cp, orderIndex: idx + 1 })));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Patrol Routes</h1>
            <p className="text-sm text-slate-500">{routes.length} route{routes.length !== 1 ? 's' : ''} configured</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Route
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-6">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Create Patrol Route</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Route Name *</label>
                <input
                  required
                  value={newRoute.name}
                  onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                  placeholder="e.g., North Perimeter"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description</label>
                <input
                  value={newRoute.description}
                  onChange={(e) => setNewRoute({ ...newRoute, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Checkpoints</div>
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-6 h-6 flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <input
                    required
                    value={cp.name}
                    onChange={(e) => {
                      const updated = [...checkpoints];
                      updated[i] = { ...updated[i], name: e.target.value };
                      setCheckpoints(updated);
                    }}
                    placeholder="Checkpoint name *"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none"
                  />
                  <input
                    value={cp.location}
                    onChange={(e) => {
                      const updated = [...checkpoints];
                      updated[i] = { ...updated[i], location: e.target.value };
                      setCheckpoints(updated);
                    }}
                    placeholder="Location (optional)"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none"
                  />
                  {checkpoints.length > 1 && (
                    <button type="button" onClick={() => removeCheckpoint(i)} className="text-slate-400 hover:text-red-500 text-sm">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addCheckpoint} className="text-[12px] text-emerald-600 hover:underline font-semibold">
                + Add checkpoint
              </button>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Route'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Route list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
            ))
          ) : !routes.length ? (
            <div className="text-center py-12 text-slate-400 text-sm rounded-2xl border border-slate-200 dark:border-white/10">
              No patrol routes yet
            </div>
          ) : (
            routes.map((route) => (
              <div
                key={route.id}
                onClick={() => loadRoute(route.id)}
                className={`rounded-2xl border p-4 cursor-pointer transition-all ${selected?.id === route.id ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-semibold text-slate-800 dark:text-white text-sm">{route.name}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${route.isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggle(route.id); }}
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 transition-colors"
                      title={route.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {route.description && <div className="text-[12px] text-slate-400 mb-1">{route.description}</div>}
                <div className="text-[11px] text-slate-400">{route._count?.checkpoints ?? route.checkpoints?.length ?? 0} checkpoints</div>
              </div>
            ))
          )}
        </div>

        {/* Selected route detail */}
        {selected ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-white">{selected.name}</div>
                  <div className="text-[12px] text-slate-400">{selected.checkpoints?.length ?? 0} checkpoints</div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${selected.isActive ? 'text-green-700 bg-green-100 dark:bg-green-500/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-500/10'}`}>
                  {selected.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>

              {/* Checkpoint list with log actions */}
              <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {(selected.checkpoints ?? []).map((cp: any, i: number) => {
                  const lastLog = cp.logs?.[0];
                  const minutesAgo = lastLog
                    ? Math.floor((Date.now() - new Date(lastLog.scannedAt).getTime()) / 60000)
                    : null;

                  return (
                    <div key={cp.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[12px] font-bold flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-white text-sm">{cp.name}</div>
                        {cp.location && <div className="text-[11px] text-slate-400">{cp.location}</div>}
                        {lastLog && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Last logged: {minutesAgo != null && minutesAgo < 60 ? `${minutesAgo}m ago` : new Date(lastLog.scannedAt).toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleLogCheckpoint(cp.id)}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Log
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent patrol logs for this route */}
            {logs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 dark:border-white/10">
                  <span className="font-semibold text-slate-700 dark:text-white text-sm">Recent Patrol Activity</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-48 overflow-y-auto">
                  {logs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">{log.checkpoint?.name}</div>
                        {log.notes && <div className="text-[11px] text-slate-400">{log.notes}</div>}
                      </div>
                      <div className="text-[11px] text-slate-400">{new Date(log.scannedAt).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] h-48">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <div className="text-sm text-slate-400">Select a patrol route to view details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
