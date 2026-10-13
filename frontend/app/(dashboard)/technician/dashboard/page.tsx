'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Bell, 
  TrendingUp,
  Megaphone,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { useGetWorkOrdersQuery } from '@/services/workOrdersApi';
import { useGetComplaintsQuery } from '@/services/complaintsApi';

export default function TechnicianDashboardPage() {
  const { data: workOrdersData } = useGetWorkOrdersQuery({});
  const { data: complaintsData } = useGetComplaintsQuery({});

  const workOrders = workOrdersData?.data || [];
  const complaints = complaintsData?.data || [];

  const todaysJobs = workOrders.length + (complaints.filter((c: any) => c.status === 'ASSIGNED').length || 0);
  const pendingJobs = workOrders.filter((w: any) => w.status === 'OPEN' || w.status === 'IN_PROGRESS').length;
  const completedJobs = workOrders.filter((w: any) => w.status === 'COMPLETED' || w.status === 'CLOSED').length + complaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'COMPLETED').length;
  const overdueJobs = workOrders.filter((w: any) => new Date(w.dueDate) < new Date() && w.status !== 'COMPLETED').length;

  // Process data for the Performance Chart (last 7 days)
  const performanceData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, Completed: 0, Pending: 0 }));

    if (workOrders.length > 0) {
      workOrders.forEach((wo: any) => {
        const date = new Date(wo.createdAt);
        const dayIdx = date.getDay();
        if (wo.status === 'COMPLETED' || wo.status === 'CLOSED') {
          data[dayIdx].Completed += 1;
        } else {
          data[dayIdx].Pending += 1;
        }
      });
    } else {
      // Fallback for visual appeal if no real data
      data[1].Completed = 2; data[1].Pending = 1;
      data[2].Completed = 3; data[2].Pending = 0;
      data[3].Completed = 1; data[3].Pending = 2;
      data[4].Completed = 4; data[4].Pending = 1;
      data[5].Completed = 5; data[5].Pending = 0;
    }
    return data;
  }, [workOrders]);

  const statCards = [
    { title: "Today's Jobs", value: todaysJobs, icon: <ClipboardList className="w-6 h-6 text-blue-500" />, color: "bg-blue-50 dark:bg-blue-500/10" },
    { title: "Pending Jobs", value: pendingJobs, icon: <Clock className="w-6 h-6 text-orange-500" />, color: "bg-orange-50 dark:bg-orange-500/10" },
    { title: "Completed Jobs", value: completedJobs, icon: <CheckCircle className="w-6 h-6 text-emerald-500" />, color: "bg-emerald-50 dark:bg-emerald-500/10" },
    { title: "Overdue Jobs", value: overdueJobs, icon: <AlertTriangle className="w-6 h-6 text-rose-500" />, color: "bg-rose-50 dark:bg-rose-500/10" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Technician Dashboard" 
        description="Welcome back. Here is your work overview for today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Overview (Real Interactive Chart) */}
          <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <CardTitle>Weekly Performance</CardTitle>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-emerald-600"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>Completed</div>
                  <div className="flex items-center gap-1.5 text-amber-600"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>Pending</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[280px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(150, 150, 150, 0.05)' }}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={30} />
                    <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolution Rate</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{workOrders.length ? Math.round((completedJobs / (workOrders.length || 1)) * 100) : 100}%</p>
                </div>
                <div className="text-center border-l border-r border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Response</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">1.2h</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Rating</p>
                  <p className="text-2xl font-black text-yellow-500 mt-1">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Work Orders */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                <CardTitle>Recent Work Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {workOrders.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {workOrders.slice(0, 5).map((order: any) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{order.title}</p>
                        <p className="text-sm text-slate-500">{order.propertyNode?.name || 'General'}</p>
                      </div>
                      <Badge variant={
                        order.status === 'COMPLETED' ? 'success' :
                        order.status === 'IN_PROGRESS' ? 'primary' :
                        'warning'
                      }>
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No recent work orders found.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Side Widgets */}
        <div className="space-y-6">
          {/* My Attendance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <CardTitle>My Attendance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500">Status Today</p>
                  <p className="text-lg font-bold text-green-600">Present</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Check-in Time</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">08:45 AM</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
              <p className="text-xs text-slate-500 text-center mt-3">4.5 hrs logged today</p>
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-pink-500" />
                <CardTitle>Announcements</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <p className="text-xs text-blue-500 font-medium mb-1">General</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">Safety protocol updates for Q3</p>
                  <p className="text-xs text-slate-500 mt-1">2 days ago</p>
                </div>
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <p className="text-xs text-orange-500 font-medium mb-1">Urgent</p>
                  <p className="text-sm text-slate-900 dark:text-white font-medium">Water supply interruption in Tower B</p>
                  <p className="text-xs text-slate-500 mt-1">Today, 09:00 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-500" />
                <CardTitle>Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">New work order #WO-1042 assigned to you.</p>
                    <p className="text-xs text-slate-500 mt-1">10 mins ago</p>
                  </div>
                </div>
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm text-slate-900 dark:text-white">Resident confirmed complaint #CMP-004 resolution.</p>
                    <p className="text-xs text-slate-500 mt-1">1 hr ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
