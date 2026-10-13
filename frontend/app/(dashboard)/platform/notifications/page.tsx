'use client';

import React, { useState } from 'react';
import { Bell, Send, CheckCircle2, ShieldAlert, Users, Building2, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useDispatch } from 'react-redux';
import { showWarning } from '@/store/slices/uiSlice';

export default function PlatformNotificationsPage() {
  const dispatch = useDispatch();
  const [target, setTarget] = useState('ALL_ORGS');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('NORMAL');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      dispatch(showWarning({ title: 'Validation Error', message: 'Please enter a broadcast title and message body.' }));
      return;
    }
    dispatch(showWarning({ title: 'Broadcast Dispatched', message: `Notification "${title}" has been successfully transmitted to targeted tenants.` }));
    setTitle('');
    setMessage('');
  };

  const sampleHistory = [
    { id: '1', title: 'Scheduled Platform Maintenance Window', date: 'Yesterday, 14:00 UTC', target: 'All Organizations', priority: 'High', status: 'Delivered (12 orgs)' },
    { id: '2', title: 'New Audit Log & Security Modules Live', date: 'Jul 26, 09:30 UTC', target: 'Organization Admins', priority: 'Normal', status: 'Delivered (24 admins)' },
    { id: '3', title: 'Q3 Billing & Subscription Policy Update', date: 'Jul 20, 11:00 UTC', target: 'Enterprise Plan Tenants', priority: 'Normal', status: 'Delivered (8 orgs)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Global Dispatch & Communications
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Platform Notifications & Alerts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Broadcast system announcements, security notices, and maintenance alerts to organization administrators and portal users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Broadcast */}
        <Card className="lg:col-span-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Dispatch New Broadcast</CardTitle>
            <CardDescription className="text-xs text-slate-500">Send an real-time alert across targeted tenant portals</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Target Audience Scope</label>
                <select 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL_ORGS">🌐 All Tenant Organizations & Users</option>
                  <option value="ADMINS_ONLY">👔 Organization Administrators Only</option>
                  <option value="ENTERPRISE">⭐ Enterprise Plan Tenants Only</option>
                  <option value="STAFF">🔧 Technicians & Building Managers</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Alert Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 font-semibold text-slate-800 dark:text-slate-200"
                >
                  <option value="NORMAL">ℹ️ Standard Advisory</option>
                  <option value="HIGH">⚠️ Urgent Maintenance / Outage Notice</option>
                  <option value="CRITICAL">🚨 Critical Security Mandate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Notification Headline</label>
                <Input 
                  placeholder="e.g., Scheduled Maintenance Window Tomorrow" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-bold">Message Content</label>
                <textarea 
                  rows={4}
                  placeholder="Detail the scope, duration, and expected operational impact..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <Button type="submit" className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20">
                <Send className="h-4 w-4 mr-2" />
                Transmit Global Broadcast
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transmission History & Status */}
        <Card className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Broadcast Transmission Archives</CardTitle>
            <CardDescription className="text-xs text-slate-500">History of system announcements sent across multi-tenant networks</CardDescription>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800 flex-1">
            {sampleHistory.map((item) => (
              <div key={item.id} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">{item.title}</span>
                    <Badge variant={item.priority === 'High' ? 'warning' : 'default'} className="text-[10px] uppercase">
                      {item.priority}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-3">
                    <span>Sent: {item.date}</span>
                    <span>•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">Target: {item.target}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
