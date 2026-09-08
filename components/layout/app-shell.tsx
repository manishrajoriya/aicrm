'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-[#000000] text-[#f4f4f5]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full bg-[#000000] text-[#f4f4f5]">
      <Sidebar />
      <main className="flex-1 lg:pl-64 min-h-screen flex flex-col w-full max-w-full bg-[#000000]">
        {children}
      </main>
    </div>
  );
}
