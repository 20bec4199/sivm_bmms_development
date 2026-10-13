'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Filter, ChevronRight } from 'lucide-react';
import {
  getIncidents,
  createIncident,
  type IncidentSeverity,
  type IncidentStatus,
  type SecurityIncident,
} from '@/services/securityApi';

const SEVERITY_OPTIONS: IncidentSeverity[] = ['MINOR', 'MAJOR', 'CRITICAL'];
const STATUS_OPTIONS: IncidentStatus[] = ['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  MAJOR: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  MINOR: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  REPORTED: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  INVESTIGATING: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
  RESOLVED: 'text-green-600 bg-green-50 dark:bg-green-500/10',
  CLOSED: 'text-slate-600 bg-slate-100 dark:bg-slate-500/10',
};

export default function SecurityIncidentsPage() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | ''>('');
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | ''>('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    description: string;
    severity: IncidentSeverity;
    incidentDate: string;
  }>({
    title: '',
    description: '',
    severity: 'MINOR',
    incidentDate: new Date().toISOString().split('T')[0],
  });

  const load = () => {
    setLoading(true);
    getIncidents({
      search: search || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
      take: 30,
    })
      .then((res) => {
        setIncidents(res.data ?? []);
        setTotal(res.total ?? 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, severityFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      await createIncident(form);
      setForm({ title: '', description: '', severity: 'MINOR', incidentDate: new Date().toISOString().split('T')[0] });
      setShowForm(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Incidents</h1>
            <p className="text-sm text-slate-500">{total} incident{total !== 1 ? 's' : ''} recorded</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Report Incident
        </button>
      </div>

      {/* Report Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-6">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-4">Report New Incident</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief incident title"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value as IncidentSeverity })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  >
                    {SEVERITY_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.incidentDate}
                    onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Description *</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what happened, who was involved, and any immediate actions taken..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? 'Reporting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IncidentStatus | '')}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-slate-700 dark:text-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as IncidentSeverity | '')}
          className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm text-slate-700 dark:text-white focus:outline-none"
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Incidents table */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Title</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Severity</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !incidents.length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">No incidents found</td>
                </tr>
              ) : (
                incidents.map((incident) => (
                  <tr
                    key={incident.id}
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/security/incidents/${incident.id}`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-white">{incident.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{incident.description}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${SEVERITY_COLORS[incident.severity] ?? ''}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[incident.status] ?? ''}`}>
                        {incident.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-slate-500 whitespace-nowrap">
                      {new Date(incident.incidentDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
