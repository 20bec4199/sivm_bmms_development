'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, DoorOpen, AlertCircle, Users, 
  Calendar, Wrench, CheckCircle2 
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- MOCK DATA SERVICE ---
const fetchDashboardStats = async () => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    kpis: {
      totalProperties: 12,
      totalUnits: 450,
      occupiedUnits: 412,
      openComplaints: 28,
      visitorsToday: 145,
      activeBookings: 18,
      activeWorkOrders: 34
    },
    trends: {
      complaints: [
        { name: 'Mon', new: 4, resolved: 3 },
        { name: 'Tue', new: 7, resolved: 5 },
        { name: 'Wed', new: 2, resolved: 6 },
        { name: 'Thu', new: 5, resolved: 4 },
        { name: 'Fri', new: 8, resolved: 7 },
        { name: 'Sat', new: 1, resolved: 2 },
        { name: 'Sun', new: 3, resolved: 3 },
      ],
      visitors: [
        { name: '8am', count: 12 },
        { name: '10am', count: 45 },
        { name: '12pm', count: 65 },
        { name: '2pm', count: 34 },
        { name: '4pm', count: 28 },
        { name: '6pm', count: 18 },
      ],
      occupancy: [
        { month: 'Jan', occupied: 380 },
        { month: 'Feb', occupied: 385 },
        { month: 'Mar', occupied: 390 },
        { month: 'Apr', occupied: 400 },
        { month: 'May', occupied: 408 },
        { month: 'Jun', occupied: 412 },
      ]
    }
  };
};

function KpiCard({ title, value, icon, colorClass, bgClass }: { title: string, value: string | number, icon: React.ReactNode, colorClass: string, bgClass: string }) {
  return (
    <Card className="flex items-center p-4">
      <div className={`flex items-center justify-center w-14 h-14 rounded-lg ${bgClass} ${colorClass} mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
        <p className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load dashboard data.</p>
      </div>
    );
  }

  const kpis = data?.kpis;
  const trends = data?.trends;

  return (
    <div>
      <PageHeader 
        title="Overview" 
        description="Monitor your properties and facility operations."
      />

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Properties" value={kpis?.totalProperties || 0} icon={<Building2 size={24} />} colorClass="text-blue-600 dark:text-blue-400" bgClass="bg-blue-100 dark:bg-blue-900/40" />
        <KpiCard title="Occupied Units" value={`${kpis?.occupiedUnits} / ${kpis?.totalUnits}`} icon={<DoorOpen size={24} />} colorClass="text-emerald-600 dark:text-emerald-400" bgClass="bg-emerald-100 dark:bg-emerald-900/40" />
        <KpiCard title="Open Complaints" value={kpis?.openComplaints || 0} icon={<AlertCircle size={24} />} colorClass="text-red-600 dark:text-red-400" bgClass="bg-red-100 dark:bg-red-900/40" />
        <KpiCard title="Visitors Today" value={kpis?.visitorsToday || 0} icon={<Users size={24} />} colorClass="text-amber-600 dark:text-amber-400" bgClass="bg-amber-100 dark:bg-amber-900/40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <KpiCard title="Active Bookings" value={kpis?.activeBookings || 0} icon={<Calendar size={24} />} colorClass="text-purple-600 dark:text-purple-400" bgClass="bg-purple-100 dark:bg-purple-900/40" />
        <KpiCard title="Active Work Orders" value={kpis?.activeWorkOrders || 0} icon={<Wrench size={24} />} colorClass="text-cyan-600 dark:text-cyan-400" bgClass="bg-cyan-100 dark:bg-cyan-900/40" />
        <KpiCard title="Occupancy Rate" value={`${Math.round(((kpis?.occupiedUnits || 0) / (kpis?.totalUnits || 1)) * 100)}%`} icon={<CheckCircle2 size={24} />} colorClass="text-green-600 dark:text-green-400" bgClass="bg-green-100 dark:bg-green-900/40" />
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Complaints Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Complaint Resolution Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <AreaChart data={trends?.complaints}>
                <defs>
                  <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                <Legend />
                <Area type="monotone" dataKey="new" name="New Complaints" stroke="#dc2626" fillOpacity={1} fill="url(#colorNew)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visitor Traffic Chart */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Visitor Traffic (Today)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={trends?.visitors}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip cursor={{fill: 'rgba(107, 114, 128, 0.1)'}} contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                <Bar dataKey="count" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Occupancy Growth Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Occupancy Growth (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <LineChart data={trends?.occupancy}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff'}} />
                <Line type="monotone" dataKey="occupied" name="Total Occupied Units" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
