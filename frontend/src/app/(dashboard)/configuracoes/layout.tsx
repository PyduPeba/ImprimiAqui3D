"use client";

import React from 'react';
import { 
  User, 
  Store, 
  ShieldCheck, 
  Bell, 
  Printer as PrinterIcon,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { icon: Store, label: 'Geral & Loja', href: '/configuracoes', active: pathname === '/configuracoes' },
    { icon: CreditCard, label: 'Preços & Valores', href: '/configuracoes/precos', active: pathname === '/configuracoes/precos' },
    { icon: PrinterIcon, label: 'Impressoras', href: '/configuracoes/impressoras', active: pathname === '/configuracoes/impressoras' },
    { icon: ShieldCheck, label: 'Segurança & Perfis', href: '/configuracoes/seguranca', active: pathname === '/configuracoes/seguranca' },
    { icon: Bell, label: 'Notificações', href: '#', active: false },
    { icon: User, label: 'Minha Conta', href: '/configuracoes/minha-conta', active: pathname === '/configuracoes/minha-conta' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-3">
           <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-2 shadow-2xl overflow-hidden">
             {tabs.map((tab, i) => (
               <Link key={i} href={tab.href} className="block">
                  <button className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-black transition-all duration-300 group relative ${
                    tab.active 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}>
                      <tab.icon size={18} className={`transition-colors duration-300 ${tab.active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-emerald-400'}`} />
                      <span className="tracking-tight">{tab.label}</span>
                      {tab.active && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      )}
                  </button>
               </Link>
             ))}
           </div>
           
           <div className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl p-4 mt-6">
              <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] mb-2 text-center">Configuração Segura</p>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed text-center italic">
                Alterações impactam o comportamento global do sistema.
              </p>
           </div>
        </div>
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
