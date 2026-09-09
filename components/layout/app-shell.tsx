'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { MeetingReminderBanner } from '@/components/leads/meeting-reminder-banner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#000000] text-[#f4f4f5]">
        {children}
      </div>
    );
  }

  // Prevent flash of unauthenticated layout while verifying session
  if (loading && !profile) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#000000] text-[#f4f4f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Loader2 className="size-5 text-neutral-400 animate-spin" />
          </div>
          <p className="text-xs text-neutral-500 font-medium tracking-wide">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#000000] text-[#f4f4f5]">
      <Sidebar />
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col w-full max-w-full bg-[#000000]">
        {children}
      </main>
      <MeetingReminderBanner />
    </div>
  );
}

