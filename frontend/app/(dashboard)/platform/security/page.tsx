'use client';

import React, { useState } from 'react';
import { Lock, ShieldAlert, Key, Globe, UserX, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function PlatformSecurityPage() {
  const dispatch = useDispatch();
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30_MIN');
  const [ipWhitelist, setIpWhitelist] = useState(false);

  return (
    <div className="space-y-8 min-w-0">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              Zero-Trust Security & Governance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Platform Security & Audit Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Enforce mandatory authentication protocols, manage multi-tenant cryptographic isolation, and monitor forensic audit logs.
          </p>
        </div>
      </div>

      {/* Security Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl w-fit">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Multi-Factor Authentication (MFA)</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Require TOTP multi-factor verification for all organization administrators and platform super admins upon authentication.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className={`text-xs font-bold ${mfaEnforced ? 'text-emerald-600' : 'text-slate-400'}`}>
                {mfaEnforced ? '● Mandatory Enforced' : '○ Optional / Tenant Choice'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setMfaEnforced(!mfaEnforced);
                  dispatch(showWarning({ title: 'Security Policy Updated', message: `Global MFA enforcement is now ${!mfaEnforced ? 'ENABLED' : 'DISABLED'}.` }));
                }}
                className="text-xs h-8"
              >
                {mfaEnforced ? 'Disable Mandate' : 'Enforce Globally'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl w-fit">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Idle Session Timeout</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automatically terminate administrative portal tokens after prolonged inactivity to mitigate unattended terminal access.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <select 
                value={sessionTimeout}
                onChange={(e) => {
                  setSessionTimeout(e.target.value);
                  dispatch(showWarning({ title: 'Session Timeout Altered', message: `Session expiration policy set to ${e.target.value.replace('_', ' ')}.` }));
                }}
                className="h-8 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 text-xs font-bold px-2 text-slate-800 dark:text-slate-200"
              >
                <option value="15_MIN">15 Minutes Inactivity</option>
                <option value="30_MIN">30 Minutes (Standard)</option>
                <option value="60_MIN">60 Minutes</option>
              </select>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                Active JWT Rule
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-2">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-xl w-fit">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">IP Geofencing & Whitelisting</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Restrict administrative login requests to verified corporate network subnets and authorized VPN gateway IPs.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className={`text-xs font-bold ${ipWhitelist ? 'text-indigo-600' : 'text-slate-400'}`}>
                {ipWhitelist ? '● Active Subnet Filter' : '○ Standard Global Access'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIpWhitelist(!ipWhitelist);
                  dispatch(showWarning({ title: 'IP Firewall Policy Updated', message: `IP Whitelist Filtering is now ${!ipWhitelist ? 'ACTIVE' : 'DISABLED'}.` }));
                }}
                className="text-xs h-8"
              >
                {ipWhitelist ? 'Disable Filter' : 'Configure Rules'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Real-time Security Event Feed */}
      <div className="pt-2">
        <AuditLogViewer 
          mode="platform"
          title="Real-Time Security Event Telemetry"
          description="Live cryptographic record of user authentications, authorization failures, and administrative role mutations."
        />
      </div>
    </div>
  );
}
