'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  CreditCard, Wrench, Users, Calendar,
  Megaphone, FileText, PhoneCall, Vote, Activity, Plus,
  Flame, ChevronRight, X
} from 'lucide-react';
import { StatCard } from '@/components/widgets/StatCard';
import { SmartWidget } from '@/components/widgets/SmartWidget';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useGetComplaintsQuery } from '@/services/complaintsApi';
import { useGetFacilityBookingsQuery } from '@/services/facilitiesApi';
import { useGetVisitorRegistrationsQuery } from '@/services/visitorsApi';
import { useGetAlertsQuery } from '@/services/alertsApi';
import { Modal } from '@/components/ui/Modal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

// --- ANIMATION VARIANTS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function ResidentDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [selectedAlertModal, setSelectedAlertModal] = useState<any | null>(null);

  // Real Data Fetching
  const { data: complaintsData, isLoading: isLoadingComplaints } = useGetComplaintsQuery({});
  const { data: bookingsData } = useGetFacilityBookingsQuery({});
  const { data: visitorsData } = useGetVisitorRegistrationsQuery({});
  const { data: alertsResponse } = useGetAlertsQuery({ take: 5 });

  const allComplaints = complaintsData?.data || [];
  const allBookings = bookingsData?.data || [];
  const allVisitors = visitorsData?.data || [];
  const allAlerts = Array.isArray(alertsResponse) ? alertsResponse : (alertsResponse?.data || []);
  const activeAlert = allAlerts[0] || null;

  const resolvedCount = allComplaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED' || c.status === 'COMPLETED').length;
  const unresolvedCount = allComplaints.length - resolvedCount;

  const upcomingBookings = allBookings.filter((b: any) => new Date(b.startTime) > new Date()).length || 0;
  const expectedVisitors = allVisitors.filter((v: any) => v.status === 'EXPECTED' || (new Date(v.expectedArrival) > new Date() && v.status !== 'CHECKED_IN')).length || 0;

  // Chart Data Processing
  const activityData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = days.map(day => ({ name: day, Complaints: 0, Bookings: 0, Visitors: 0 }));

    allComplaints.forEach((c: any) => {
      if (c.createdAt) data[new Date(c.createdAt).getDay()].Complaints++;
    });
    allBookings.forEach((b: any) => {
      if (b.createdAt) data[new Date(b.createdAt).getDay()].Bookings++;
    });
    allVisitors.forEach((v: any) => {
      if (v.createdAt) data[new Date(v.createdAt).getDay()].Visitors++;
    });

    // If perfectly 0, add a tiny bit of mock data to keep the chart beautiful
    if (allComplaints.length === 0 && allBookings.length === 0 && allVisitors.length === 0) {
      data[2].Visitors = 1; data[4].Bookings = 1; data[5].Complaints = 1; data[6].Visitors = 2;
    }

    return data;
  }, [allComplaints, allBookings, allVisitors]);
  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-8">

      {/* Active Broadcast Alert Banner */}
      {activeAlert && !isAlertDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative overflow-hidden rounded-3xl p-5 border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${activeAlert.type === 'EMERGENCY'
              ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-transparent border-rose-500/30 text-rose-900 dark:text-rose-100'
              : activeAlert.type === 'MAINTENANCE'
                ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/30 text-amber-900 dark:text-amber-100'
                : 'bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent border-indigo-500/30 text-indigo-900 dark:text-indigo-100'
            }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${activeAlert.type === 'EMERGENCY' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 animate-pulse' :
                activeAlert.type === 'MAINTENANCE' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' :
                  'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              }`}>
              {activeAlert.type === 'EMERGENCY' ? <Flame className="w-6 h-6" /> :
                activeAlert.type === 'MAINTENANCE' ? <Wrench className="w-6 h-6" /> :
                  <Megaphone className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/40 dark:bg-black/40">
                  {activeAlert.type} • {activeAlert.priority}
                </span>
                <span className="text-xs opacity-75">
                  {new Date(activeAlert.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="font-bold text-base mt-0.5">{activeAlert.title}</h4>
              <p className="text-xs opacity-90 line-clamp-1 max-w-2xl mt-0.5">{activeAlert.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              onClick={() => setSelectedAlertModal(activeAlert)}
              className="rounded-xl text-xs font-bold px-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm hover:scale-105 transition-transform"
            >
              View Notice
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
            <button
              onClick={() => setIsAlertDismissed(true)}
              className="p-2 rounded-xl opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Alert Details Modal */}
      {selectedAlertModal && (
        <Modal
          isOpen={!!selectedAlertModal}
          onClose={() => setSelectedAlertModal(null)}
          title="Community Advisory Details"
        >
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {selectedAlertModal.type} • {selectedAlertModal.priority} PRIORITY
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {selectedAlertModal.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dispatched on {new Date(selectedAlertModal.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedAlertModal.message}
            </div>

            <div className="flex justify-end pt-3">
              <Button
                onClick={() => setSelectedAlertModal(null)}
                className="rounded-xl px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <PageHeader
            title="Resident Dashboard"
            description={`Welcome back, ${user?.firstName || 'Resident'}. Your community at a glance.`}
          />
        </div>

        <div className="flex items-center gap-3 pb-6">
          <Link href="/resident/visitors" passHref>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-colors"
            >
              <Plus className="w-4 h-4" /> Pre-Register Visitor
            </motion.button>
          </Link>
        </div>
      </div>

      {/* --- HERO STATS (Reusable StatCards) --- */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Pending Bills"
          value="$0.00"
          icon={<CreditCard className="w-6 h-6 text-emerald-500" />}
          trend="All clear!"
          isPositive={true}
          sparklineColor="#10b981"
          progress={100}
          sparklineData={[0, 0, 0, 0, 0, 0, 0]}
        />
        <Link href="/resident/complaints" passHref className="block">
          <StatCard
            title="Unresolved Complaints"
            value={isLoadingComplaints ? '...' : unresolvedCount.toString()}
            icon={<Wrench className="w-6 h-6 text-amber-500" />}
            trend={`${resolvedCount} resolved`}
            isPositive={unresolvedCount === 0}
            sparklineColor={unresolvedCount === 0 ? "#10b981" : "#f59e0b"}
            progress={unresolvedCount > 0 ? 50 : 100}
            sparklineData={[unresolvedCount, unresolvedCount + 1, unresolvedCount, unresolvedCount]}
          />
        </Link>
        <Link href="/resident/facilities" passHref className="block">
          <StatCard
            title="Facility Bookings"
            value={upcomingBookings.toString()}
            icon={<Calendar className="w-6 h-6 text-blue-500" />}
            trend="Upcoming"
            isPositive={true}
            sparklineColor="#3b82f6"
            progress={100}
            sparklineData={[0, 0, 1, upcomingBookings, upcomingBookings]}
          />
        </Link>
        <Link href="/resident/visitors" passHref className="block">
          <StatCard
            title="Expected Visitors"
            value={expectedVisitors.toString()}
            icon={<Users className="w-6 h-6 text-indigo-500" />}
            trend="Today"
            isPositive={true}
            sparklineColor="#6366f1"
            progress={100}
            sparklineData={[0, 1, 0, expectedVisitors, expectedVisitors]}
          />
        </Link>
      </motion.div>

      {/* --- INTERACTIVE ACTIVITY CHART --- */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Weekly Activity</h3>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.1)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Visitors" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                  <Area type="monotone" dataKey="Bookings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBookings)" />
                  <Area type="monotone" dataKey="Complaints" stroke="#f59e0b" strokeWidth={3} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* --- QUICK ACTIONS & INFO STRIP (Reusable SmartWidgets) --- */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <SmartWidget title="Announcements" value="3" subtitle="Unread messages" icon={<Megaphone className="w-5 h-5 text-blue-400" />} />
        <SmartWidget title="Community Events" value="1" subtitle="Friday, 6 PM" icon={<Calendar className="w-5 h-5 text-purple-400" />} />
        <SmartWidget title="Active Polls" value="2" subtitle="Vote required" icon={<Vote className="w-5 h-5 text-orange-400" />} />
        <SmartWidget title="Documents" value="12" subtitle="Lease & Rules" icon={<FileText className="w-5 h-5 text-emerald-400" />} />
        <SmartWidget title="Emergency" value="24/7" subtitle="View Contacts" icon={<PhoneCall className="w-5 h-5 text-rose-400" />} />
      </motion.div>

      {/* --- DETAILED WIDGETS --- */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Recent Announcements <Megaphone className="w-4 h-4 text-blue-500" />
              </h3>
              <Link href="#" className="text-sm font-medium text-blue-500 hover:text-blue-400">View All &rarr;</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Pool Maintenance', date: 'Today, 10:00 AM', desc: 'The main swimming pool will be closed for routine maintenance.' },
              { title: 'Fire Drill Schedule', date: 'Yesterday', desc: 'Mandatory fire drill will be conducted next Tuesday at 2 PM.' },
              { title: 'Community BBQ', date: 'Oct 12', desc: 'Join us for the annual community BBQ in the central courtyard.' },
            ].map((ann, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0 group-hover:scale-150 transition-transform" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{ann.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{ann.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{ann.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* My Information */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              My Profile <Activity className="w-4 h-4 text-emerald-500" />
            </h3>
          </CardHeader>
          <CardContent>
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-2xl font-bold border border-blue-500/30">
                  {user?.firstName?.charAt(0) || 'R'}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.firstName} {user?.lastName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Active Resident
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-300">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-300">{(user as any)?.phone || '+1 (555) 000-0000'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Unit Assignment</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-300">Tower A - Unit 402</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Move-in Date</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-300">Jan 12, 2024</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full rounded-xl border-slate-200 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                Update Profile
              </Button>
              <Button variant="outline" className="w-full rounded-xl border-slate-200 dark:border-white/10 dark:text-white dark:hover:bg-white/5">
                Payment Methods
              </Button>
            </div>
          </CardContent>
        </Card>

      </motion.div>



    </motion.div>
  );
}
