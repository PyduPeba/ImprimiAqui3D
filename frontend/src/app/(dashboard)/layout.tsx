"use client";

import { Sidebar } from '@/components/layout/Sidebar';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UpdateNotifier } from '@/components/electron/UpdateNotifier';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userName = user?.name || 'Sem Nome';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  return (
    <div className="min-h-screen flex bg-[#0f172a] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64 transition-all duration-300">
        <header className="h-20 bg-[#0f172a]/40 backdrop-blur-xl border-b border-white/5 px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Sistema <span className="text-emerald-500 font-extrabold px-2 py-0.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs tracking-widest uppercase">V2.0</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">ImprimiAqui3D • Gestão Inteligente</p>
          </div>
          <div className="flex items-center gap-8">
            <NotificationCenter />
            
            <div className="flex items-center gap-4 pl-8 border-l border-white/5">
              <div className="flex flex-col text-right">
                <span className="text-sm font-black text-white">{userName}</span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-black flex items-center gap-1 justify-end">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                  {user?.role || 'User'}
                </span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer ring-4 ring-white/5">
                <span className="text-white font-black text-lg group-hover:text-emerald-400 transition-colors">{initials}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 relative overflow-x-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05)_0%,transparent_50%)] pointer-events-none" />
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </div>
      <UpdateNotifier />
    </div>
  );
}
