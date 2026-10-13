'use client';

import React, { useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Building2, Users, Activity, CheckCircle2, TrendingUp,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Download, ShieldCheck, Layers, PieChart as PieChartIcon
} from 'lucide-react';
import { useGetOrganizationsQuery, useGetPlatformUsersQuery } from '@/services/platformApi';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';

const customTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
  padding: '12px'
};

export default function PlatformDashboard() {
  const { data: orgsData, isLoading: isLoadingOrgs } = useGetOrganizationsQuery({});
  const { data: usersData, isLoading: isLoadingUsers } = useGetPlatformUsersQuery({});

  const organizations = useMemo(() => orgsData?.data || [], [orgsData]);
  const allUsers = useMemo(() => usersData?.data || [], [usersData]);

  // --- REAL DATA CALCULATIONS ---
  const totalOrganizations = organizations.length;
  const activeOrganizations = organizations.filter((org: any) => org.status === 'ACTIVE' || org.isActive !== false).length;
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u: any) => u.isActive !== false).length;
  const verifiedUsers = allUsers.filter((u: any) => u.emailVerified === true).length;

  // 1. Group Organizations by Month for Growth Chart
  const orgGrowthData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const counts = Array(12).fill(0);
    
    organizations.forEach((org: any) => {
      if (org.createdAt) {
        const date = new Date(org.createdAt);
        if (date.getFullYear() === currentYear) {
          counts[date.getMonth()] += 1;
        }
      }
    });

    let cumulative = 0;
    return months.map((month, index) => {
      cumulative += counts[index];
      return {
        name: month,
        new: counts[index],
        total: cumulative
      };
    }).filter((_, i) => i <= new Date().getMonth());
  }, [organizations]);

  // 2. User Status Data
  const userStatusData = useMemo(() => {
    return [
      { name: 'Active', count: activeUsers, fill: '#10b981' },
      { name: 'Inactive', count: totalUsers - activeUsers, fill: '#f43f5e' }
    ];
  }, [totalUsers, activeUsers]);

  // 3. Subscription Plan Data (Donut)
  const planData = useMemo(() => {
    const plans: Record<string, number> = {};
    organizations.forEach((org: any) => {
      const plan = org.packages?.[0]?.package?.name || 'Custom Package';
      plans[plan] = (plans[plan] || 0) + 1;
    });
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];
    return Object.keys(plans).map((key, i) => ({
      name: key,
      value: plans[key],
      fill: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  }, [organizations]);

  // 4. Organization Types Data
  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    organizations.forEach((org: any) => {
      const type = org.type || 'Property Management';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.keys(types).map(key => ({
      name: key.length > 15 ? key.substring(0, 15) + '...' : key,
      count: types[key],
      fill: '#3b82f6'
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [organizations]);


  const stats = [
    { 
      title: 'Total Organizations', 
      value: isLoadingOrgs ? '...' : totalOrganizations.toLocaleString(), 
      icon: <Building2 className="h-6 w-6 text-blue-500" />,
      trend: '+Active Tracking',
      isPositive: true,
      sparklineColor: '#3b82f6',
      progress: totalOrganizations > 0 ? (activeOrganizations / totalOrganizations) * 100 : 0,
    },
    { 
      title: 'Active Organizations', 
      value: isLoadingOrgs ? '...' : activeOrganizations.toLocaleString(), 
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      trend: 'Operational',
      isPositive: true,
      sparklineColor: '#10b981',
      progress: totalOrganizations > 0 ? (activeOrganizations / totalOrganizations) * 100 : 0,
    },
    { 
      title: 'Total Platform Users', 
      value: isLoadingUsers ? '...' : totalUsers.toLocaleString(), 
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      trend: 'Registered',
      isPositive: true,
      sparklineColor: '#6366f1',
      progress: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0,
    },
    { 
      title: 'Active Users', 
      value: isLoadingUsers ? '...' : activeUsers.toLocaleString(), 
      icon: <Activity className="h-6 w-6 text-sky-500" />,
      trend: 'Currently Active',
      isPositive: true,
      sparklineColor: '#0ea5e9',
      progress: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Platform Command Center
          </h1>
          <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
            Real-time telemetry and architectural overview of the BMMS ecosystem.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>
      </div>
      
      {/* --- PREMIUM STATS WIDGETS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.1)] hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: stat.sparklineColor }}></div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl flex items-center justify-center shadow-inner`} style={{ backgroundColor: `${stat.sparklineColor}15` }}>
                  {stat.icon}
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${stat.isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <div className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {stat.title}
              </div>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
              </div>
              <div className="mt-6 w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${stat.progress}%`, backgroundColor: stat.sparklineColor }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- CHARTS SECTION 1 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Organization Growth Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 p-6 flex flex-col transition-all">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Organization Growth <TrendingUp className="w-5 h-5 text-blue-500" />
              </h3>
              <p className="text-sm text-slate-500 mt-1">Total organizations registered over time.</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            {orgGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orgGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Area type="monotone" dataKey="total" name="Total Organizations" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">Not enough data to display</div>
            )}
          </div>
        </div>

        {/* Subscription Plan Donut Chart */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 p-6 flex flex-col transition-all">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Subscription Plans <PieChartIcon className="w-5 h-5 text-indigo-500" />
            </h3>
            <p className="text-sm text-slate-500 mt-1">Tier distribution across organizations.</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            {planData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="rgba(255,255,255,0.05)" />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={customTooltipStyle} itemStyle={{ color: '#fff' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">Not enough data to display</div>
            )}
          </div>
        </div>
      </div>

      {/* --- CHARTS SECTION 2 --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* User Distribution Chart */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 p-6 flex flex-col transition-all">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              User Status <Users className="w-5 h-5 text-indigo-500" />
            </h3>
            <p className="text-sm text-slate-500 mt-1">Active vs Inactive Platform Users.</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            {totalUsers > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" name="Users" radius={[6, 6, 0, 0]} animationDuration={1500}>
                    {
                      userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">Not enough data to display</div>
            )}
          </div>
        </div>

        {/* Organization Type Distribution */}
        <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-white/10 p-6 flex flex-col transition-all">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Industry Focus <Layers className="w-5 h-5 text-indigo-500" />
            </h3>
            <p className="text-sm text-slate-500 mt-1">Top organization types across the platform.</p>
          </div>
          <div className="flex-1 min-h-[300px]">
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={120} />
                  <RechartsTooltip contentStyle={customTooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                  <Bar dataKey="count" name="Organizations" radius={[0, 6, 6, 0]} animationDuration={1500}>
                    {
                      typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">Not enough data to display</div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
