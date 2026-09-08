'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  Crown,
  LogIn,
} from 'lucide-react';

export default function LoginPage() {
  const { loginWithPassword, signUpWithPassword, profile, logout } = useAuth();
  const router = useRouter();

  // Mode: 'signin' | 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form Fields
  const [organizationName, setOrganizationName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const hasSupabase = isSupabaseConfigured();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your work email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await loginWithPassword(email, password);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName.trim()) {
      setErrorMsg('Please enter your School or Organization name.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your work email.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const res = await signUpWithPassword(email, password, name, organizationName);

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      if (res.requiresEmailConfirmation) {
        setSuccessMsg(
          res.message ||
          'Workspace created! Please check your email to verify your address, then sign in.'
        );
        setMode('signin');
      } else {
        setSuccessMsg('Workspace created successfully! Redirecting to your dashboard...');
        setTimeout(() => {
          router.push('/');
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create workspace.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#000000] flex flex-col items-center justify-center p-4 sm:p-6 text-white selection:bg-white selection:text-black">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6 max-w-md w-full">
        <div className="size-12 rounded-full bg-white text-black font-bold flex items-center justify-center mx-auto shadow-lg mb-2">
          <Building2 className="size-6" />
        </div>
        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/8 text-[11px] font-semibold uppercase tracking-widest text-neutral-300">
          <Sparkles className="size-3 text-indigo-400" />
          AI School Admissions CRM
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pt-1">
          {mode === 'signin' ? 'Sign in to your CRM' : 'Create an Owner Workspace'}
        </h1>
        <p className="text-xs text-neutral-400 max-w-xs mx-auto">
          {mode === 'signin'
            ? 'Sign in to access your school leads, follow-ups, and admissions deals.'
            : 'Register your independent school CRM workspace. Your data is 100% private.'}
        </p>
      </div>

      {/* Already Logged In Notice */}
      {profile && (
        <div className="w-full max-w-md mb-4 p-3.5 rounded-2xl border border-white/10 bg-[#121215] flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="size-7 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px] shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div className="truncate">
              <span className="text-neutral-400">Logged in as </span>
              <strong className="text-white font-medium">{profile.name}</strong>
              <span className="text-neutral-500 text-[11px]"> ({profile.organization || 'Workspace'})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="xs"
              onClick={() => router.push('/')}
              className="rounded-full bg-white text-black font-semibold hover:bg-neutral-200 text-[11px] h-7 px-3 cursor-pointer"
            >
              Dashboard
            </Button>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 rounded-full hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="w-full max-w-md rounded-3xl border border-white/8 bg-[#121215] p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Navigation Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#18181c] border border-white/6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${mode === 'signin'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-400 hover:text-white'
              }`}
          >
            <LogIn className="size-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${mode === 'signup'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-400 hover:text-white'
              }`}
          >
            <Crown className="size-3.5 text-amber-400" />
            Owner Sign Up
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sign In Form */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signin-email" className="text-neutral-300 text-xs font-medium">
                Work Email
              </Label>
              <div className="relative">
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="name@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                />
                <Mail className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signin-pass" className="text-neutral-300 text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="signin-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 pr-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                />
                <Lock className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white text-black font-semibold hover:bg-neutral-200 h-10 shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>

            {/* Switch to Owner Sign Up CTA */}
            <div className="pt-3 border-t border-white/5 text-center text-xs text-neutral-400">
              New school or organization?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-semibold text-white hover:underline underline-offset-2 ml-1 cursor-pointer inline-flex items-center gap-1"
              >
                Sign Up as Owner <ArrowRight className="size-3" />
              </button>
            </div>
          </form>
        ) : (
          /* Owner Workspace Sign Up Form */
          <form onSubmit={handleSignUp} className="space-y-3.5">
            {/* Multi-tenant Isolation Callout */}
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-start gap-2">
              <Crown className="size-3.5 text-indigo-400 shrink-0 mt-0.5" />

            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-org" className="text-neutral-300 text-xs font-medium">
                School / Organization Name
              </Label>
              <div className="relative">
                <Input
                  id="signup-org"
                  type="text"
                  placeholder="e.g. St. Xavier International School"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                />
                <Building2 className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-name" className="text-neutral-300 text-xs font-medium">
                Owner Full Name
              </Label>
              <div className="relative">
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                />
                <User className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-neutral-300 text-xs font-medium">
                Work Email (Workspace Admin)
              </Label>
              <div className="relative">
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="e.g. rajesh@stxaviers.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                />
                <Mail className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-pass" className="text-neutral-300 text-xs font-medium">
                Password (min. 6 characters)
              </Label>
              <div className="relative">
                <Input
                  id="signup-pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#18181c] border-white/8 rounded-xl pl-9 pr-9 text-xs h-10 text-white placeholder:text-neutral-500 w-full"
                  required
                  minLength={6}
                />
                <Lock className="absolute left-3 top-3 size-4 text-neutral-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-white"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white text-black font-semibold hover:bg-neutral-200 h-10 shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                'Creating Workspace...'
              ) : (
                <>
                  Create Workspace & Sign In <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>

            {/* Switch to Sign In CTA */}
            <div className="pt-3 border-t border-white/5 text-center text-xs text-neutral-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-semibold text-white hover:underline underline-offset-2 ml-1 cursor-pointer inline-flex items-center gap-1"
              >
                Sign In <ArrowRight className="size-3" />
              </button>
            </div>
          </form>
        )}

        {/* Backend Connectivity Status */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-400 border-t border-white/6">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-indigo-400" />
            Workspace Isolation
          </span>
          {hasSupabase ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Supabase Cloud
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400">
              <AlertCircle className="size-3" />
              Local Storage
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
