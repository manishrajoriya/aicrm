'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users2,
  UserPlus,
  Database,
  CheckCircle2,
  AlertCircle,
  Building2,
  Menu,
  X,
  Sparkles,
  LogOut,
  Shield,
  User,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { crmService } from '@/services/crmService';
import { useAuth } from '@/contexts/AuthContext';

import { NotificationBell } from '@/components/layout/notification-bell';

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isSupabase, setIsSupabase] = useState(false);
  const { profile, logout, isOwner } = useAuth();

  useEffect(() => {
    setIsSupabase(crmService.isUsingSupabase());
  }, []);

  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: isOwner ? 'Leads Pipeline' : 'My Leads & Pipeline',
      href: '/leads',
      icon: Users2,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
    },
    {
      label: 'Team Members',
      href: '/team',
      icon: UserPlus,
    },
  ];

  return (
    <>
      {/* Mobile Top App Header */}
      <header className="lg:hidden sticky top-0 z-30 w-full h-14 bg-[#09090b]/95 backdrop-blur-md border-b border-white/8 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-full bg-[#161619] border border-white/10 text-white hover:bg-[#202024] active:scale-95 transition-all"
            aria-label="Open Navigation"
          >
            <Menu className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg overflow-hidden border border-white/10 shadow-sm shrink-0">
              <img src="/app-icon.jpg" alt="AI School CRM" className="size-full object-cover" />
            </div>
            <span className="font-semibold text-xs tracking-tight text-white">AI School CRM</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          {profile && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161619] border border-white/8 text-[11px] text-zinc-300">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="max-w-[100px] truncate font-medium">{profile.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#09090b] border-r border-white/8 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-white/6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl overflow-hidden border border-white/15 shadow-md shrink-0">
                <img src="/app-icon.jpg" alt="AI School CRM" className="size-full object-cover" />
              </div>
              <div>
                <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                  AI School CRM
                </h1>
                <p className="text-[11px] text-neutral-400">Admissions Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              aria-label="Close Navigation"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Nav Links */}
          <div className="py-6 px-4 space-y-2">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Navigation
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-[#161619]'
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Area: User Profile & Database Status */}
        <div className="p-4 border-t border-white/6 space-y-3">
          {/* Active User Pill Card */}
          {profile && (
            <div className="rounded-2xl border border-white/8 bg-[#121215] p-3 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="size-8 rounded-full bg-white text-black font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.name.charAt(0)}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                    {profile.name}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {profile.is_owner ? (
                      <span className="rounded-full bg-white/20 text-white text-[9px] font-semibold px-2 py-0.2">
                        Owner
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#1e1e24] text-neutral-300 text-[9px] px-2 py-0.2">
                        {profile.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <NotificationBell />
                <button
                  type="button"
                  onClick={logout}
                  className="size-7 rounded-full bg-[#18181c] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Database connection status */}
          <div className="rounded-2xl border border-white/5 bg-[#121215] p-2.5 flex items-center justify-between text-[10px]">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Database className="size-3" />
              Backend
            </span>
            {isSupabase ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="size-2.5" />
                Supabase
              </span>
            ) : (
              <span className="text-neutral-400 flex items-center gap-1">
                <AlertCircle className="size-2.5 text-amber-400" />
                Local Demo
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
