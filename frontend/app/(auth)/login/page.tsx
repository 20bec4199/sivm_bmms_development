'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from '../../../services/authApi';
import { setCredentials } from '../../../store/slices/authSlice';
import { RootState } from '../../../store/store';
import { Building2, Key, ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [error, setError] = React.useState<string | null>(null);
  
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const roles = user.roles || [];
      if (roles.includes('PLATFORM_SUPER_ADMIN')) {
        router.push('/platform/dashboard');
      } else if (roles.includes('ORGANIZATION_ADMIN')) {
        router.push('/organization/dashboard');
      } else if (roles.includes('TENANT') || roles.includes('UNIT_OWNER') || roles.includes('RESIDENT')) {
        router.push('/resident/dashboard');
      } else if (roles.includes('TECHNICIAN')) {
        router.push('/technician/dashboard');
      } else if (roles.includes('SECURITY_GUARD')) {
        router.push('/security/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const res = await login(data).unwrap();
      dispatch(setCredentials({ user: res.user, accessToken: res.accessToken }));
      
      const roles = res.user.roles || [];
      if (roles.includes('PLATFORM_SUPER_ADMIN')) {
        router.push('/platform/dashboard');
      } else if (roles.includes('ORGANIZATION_ADMIN')) {
        router.push('/organization/dashboard');
      } else if (roles.includes('TENANT') || roles.includes('UNIT_OWNER') || roles.includes('RESIDENT')) {
        router.push('/resident/dashboard');
      } else if (roles.includes('TECHNICIAN')) {
        router.push('/technician/dashboard');
      } else if (roles.includes('SECURITY_GUARD')) {
        router.push('/security/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      const errorData = typeof error === 'object' && error !== null && 'data' in error ? error.data : undefined;
      const message = typeof errorData === 'object' && errorData !== null && 'message' in errorData && typeof errorData.message === 'string'
        ? errorData.message
        : 'Invalid email or password';
      if (message.includes('locked')) {
        router.push('/account-locked');
      } else {
        setError(message);
      }
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#0a0f1c] text-slate-200 flex items-center justify-center overflow-y-auto font-sans selection:bg-blue-500/30">
      
      {/* Animated Background Gradients & Shapes */}
      <div className="fixed top-1/4 -left-64 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none animate-pulse"></div>
      <div className="fixed bottom-1/4 -right-64 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>
      
      {/* Floating Icons Background */}
      <div className="fixed inset-0 pointer-events-none hidden lg:block">
        <Building2 className="absolute top-[20%] left-[15%] w-16 h-16 text-blue-500/10 rotate-12 drop-shadow-[0_0_15px_rgba(59,130,246,0.2)]" />
        <ShieldCheck className="absolute top-[60%] left-[25%] w-24 h-24 text-emerald-500/10 -rotate-12 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
        <Key className="absolute top-[30%] right-[20%] w-20 h-20 text-indigo-500/10 rotate-45 drop-shadow-[0_0_15px_rgba(99,102,241,0.2)]" />
      </div>

      <div className="w-full max-w-md px-4 relative z-10 py-12">
        {/* Glassmorphic Login Card */}
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl rounded-3xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
          
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to manage your properties</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 border border-red-500/20 backdrop-blur-sm flex items-center gap-3">
              <div className="w-1.5 h-full rounded-full bg-red-500"></div>
              <p className="text-sm font-medium text-red-400">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1" htmlFor="email">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className={`block w-full pl-11 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${errors.email ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                    placeholder="admin@bmms.com"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="mt-2 ml-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 ml-1" htmlFor="password">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    className={`block w-full pl-11 pr-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all ${errors.password ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}`}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                </div>
                {errors.password && <p className="mt-2 ml-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0" />
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-[1.02] focus:outline-none disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Do not have an account?{' '}
            <Link href="/register" className="text-white font-medium hover:text-blue-400 transition-colors">
              Register Organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
