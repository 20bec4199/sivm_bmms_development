'use client';

import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Eye, EyeOff, CheckCircle, AlertCircle, Save } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { axiosInstance } from '@/services/axios';
import { PageHeader } from '@/components/layout/PageHeader';

interface ProfileData {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  roles: { name: string }[];
}

interface Toast { type: 'success' | 'error'; message: string; }

export default function ResidentProfilePage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [toast, setToast] = useState<Toast | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    axiosInstance.get('/users/profile')
      .then((r) => {
        const data = r.data;
        setProfile(data);
        setProfileForm({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          phone: data.phone ?? '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const calcStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const handlePasswordChange = (val: string) => {
    setPwForm((prev) => ({ ...prev, newPassword: val }));
    setPwStrength(calcStrength(val));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await axiosInstance.patch(`/users/${user.id}`, {
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim() || undefined,
        phone: profileForm.phone.trim() || undefined,
      });
      showToast('success', 'Profile updated successfully');
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('error', 'New passwords do not match');
      return;
    }
    if (pwStrength < 2) {
      showToast('error', 'Password is too weak — use 8+ chars with numbers and uppercase');
      return;
    }
    setSavingPw(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      showToast('success', 'Password changed. You have been logged out of other sessions.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwStrength(0);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message ?? 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'][pwStrength - 1] ?? 'bg-slate-200 dark:bg-slate-700';
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwStrength];

  const TABS = [
    { key: 'profile', label: 'Personal Info', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
  ] as const;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and account security"
      />

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Avatar + summary */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
            <div className="h-4 w-56 rounded bg-slate-100 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      ) : profile && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/20 flex-shrink-0">
            {profile.firstName?.[0]?.toUpperCase()}{profile.lastName?.[0]?.toUpperCase() ?? ''}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {profile.firstName} {profile.lastName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-500">{profile.email}</span>
              {profile.isEmailVerified && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sm text-slate-500">{profile.phone}</span>
              </div>
            )}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {profile.roles?.map((r) => (
                <span key={r.name} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
                  {r.name.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === key ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-5">Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">First Name</label>
                <input
                  required
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email Address</label>
              <input
                type="email"
                value={profile?.email ?? ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.02] text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed. Contact your administrator.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1 234 567 890"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
          <h2 className="font-semibold text-slate-800 dark:text-white mb-1">Change Password</h2>
          <p className="text-sm text-slate-400 mb-5">After changing, all other sessions will be logged out.</p>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Current Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw.current ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">New Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= pwStrength ? strengthColor : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </div>
                  {strengthLabel && <div className="text-[11px] text-slate-400">{strengthLabel}</div>}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
              <div className="relative">
                <input
                  required
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-white/[0.04] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? 'border-red-300 dark:border-red-500/40' : 'border-slate-200 dark:border-white/10'}`}
                />
                <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingPw}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPw ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account info */}
      {profile && (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Account Info</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Member Since</div>
              <div className="text-slate-700 dark:text-slate-300">{new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email Status</div>
              <div className={`font-semibold ${profile.isEmailVerified ? 'text-green-600' : 'text-orange-500'}`}>
                {profile.isEmailVerified ? 'Verified' : 'Not Verified'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
