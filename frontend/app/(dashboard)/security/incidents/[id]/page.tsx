'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Clock, User, Edit2, Save, X } from 'lucide-react';
import {
  getIncident,
  updateIncident,
  type IncidentSeverity,
  type IncidentStatus,
  type SecurityIncident,
} from '@/services/securityApi';
import Link from 'next/link';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
  HIGH: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',

  MINOR: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
};

const STATUS_FLOW: IncidentStatus[] = ['REPORTED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'];
const STATUS_LABELS: Record<string, string> = {
  REPORTED: 'Reported',
  INVESTIGATING: 'Investigating',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};
const STATUS_COLORS: Record<string, string> = {
  REPORTED: 'bg-red-500',
  INVESTIGATING: 'bg-orange-500',
  RESOLVED: 'bg-green-500',
  CLOSED: 'bg-slate-400',
};

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<SecurityIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
  }>({ title: '', description: '', severity: 'MINOR', status: 'REPORTED' });

  const load = () => {
    setLoading(true);
    getIncident(id)
      .then((data) => {
        setIncident(data);
        setEditForm({
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateIncident(id, editForm);
      setEditing(false);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: IncidentStatus) => {
    try {
      await updateIncident(id, { status: newStatus });
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="p-6">
        <div className="text-center text-slate-400 py-12">Incident not found</div>
      </div>
    );
  }

  const currentStatusIdx = STATUS_FLOW.indexOf(incident.status);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Back */}
      <Link
        href="/security/incidents"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Incidents
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            {editing ? (
              <input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none w-full"
              />
            ) : (
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{incident.title}</h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${SEVERITY_COLORS[incident.severity] ?? ''}`}>
                {incident.severity}
              </span>
              <span className="text-[12px] text-slate-400">
                <Clock className="inline w-3 h-3 mr-1" />
                {new Date(incident.incidentDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Status timeline */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Status Progress</div>
        <div className="flex items-center gap-0">
          {STATUS_FLOW.map((status, idx) => {
            const isPast = idx <= currentStatusIdx;
            const isCurrent = idx === currentStatusIdx;
            return (
              <div key={status} className="flex items-center flex-1">
                <button
                  onClick={() => !isCurrent && handleStatusChange(status)}
                  className="flex flex-col items-center gap-1.5 flex-1 group"
                  disabled={isCurrent}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold transition-all ${isPast ? STATUS_COLORS[status] : 'bg-slate-200 dark:bg-white/10'} ${!isCurrent ? 'cursor-pointer hover:scale-110' : ''}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide text-center leading-tight ${isCurrent ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </button>
                {idx < STATUS_FLOW.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 ${idx < currentStatusIdx ? 'bg-green-400' : 'bg-slate-200 dark:bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Description</div>
        {editing ? (
          <textarea
            rows={5}
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
          />
        ) : (
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
        )}
      </div>

      {/* Edit severity */}
      {editing && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Severity</div>
          <div className="flex gap-2">
            {['MINOR', 'MAJOR', 'CRITICAL'].map((s) => (
              <button
                key={s}
                onClick={() => setEditForm({ ...editForm, severity: s as IncidentSeverity })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${editForm.severity === s ? SEVERITY_COLORS[s] : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-slate-300'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Reported On</div>
          <div className="text-sm text-slate-700 dark:text-slate-300">{new Date(incident.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Incident Date</div>
          <div className="text-sm text-slate-700 dark:text-slate-300">{new Date(incident.incidentDate).toLocaleDateString()}</div>
        </div>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Last Updated</div>
          <div className="text-sm text-slate-700 dark:text-slate-300">{new Date(incident.updatedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
