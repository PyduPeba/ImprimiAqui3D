"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Printer, 
  Package, 
  Users, 
  BarChart3,
  Settings,
  Layers,
  LogOut,
  Palette,
  ShoppingBag,
  Receipt
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'PDV / Caixa', href: '/caixa' },
  { icon: Receipt, label: 'Vendas', href: '/vendas' },
  { icon: Palette, label: 'Modelagem', href: '/modelagem' },
  { icon: Printer, label: 'Produção', href: '/producao' },
  { icon: Package, label: 'Estoque', href: '/estoque' },
  { icon: Layers, label: 'Catálogo', href: '/catalogo' },
  { icon: ShoppingBag, label: 'Acessórios', href: '/acessorios' },
  { icon: Users, label: 'Clientes', href: '/clientes' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios' },
  { icon: Settings, label: 'Configurações', href: '/configuracoes' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const pathname = usePathname();
  const [branding, setBranding] = React.useState<{name?: string, logoUrl?: string}>({});

  React.useEffect(() => {
    async function loadBranding() {
      try {
        const settings = await import('@/services/settings.service').then(m => m.settingsService.getSettings());
        if (settings?.branding) {
          setBranding({
            name: settings.branding.storeName,
            logoUrl: settings.branding.logoUrl
          });
        }
      } catch (error) {
        console.warn('Failed to load branding', error);
      }
    }
    loadBranding();
  }, []);

  return (
    <aside className="w-64 glass-sidebar h-screen fixed left-0 top-0 flex flex-col z-50">
      <div className="p-8 flex items-center justify-center gap-3">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="max-h-14 max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
        ) : (
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              I
            </div>
            <h1 className="text-white font-black text-xl tracking-tighter">
                {branding.name ? (
                    <span className="text-white uppercase tracking-widest text-[10px] font-black">{branding.name}</span>
                ) : (
                    <>Imprimi<span className="text-emerald-500">Aqui</span>3D</>
                )}
            </h1>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={`transition-colors ${isActive ? 'text-emerald-500' : 'group-hover:text-emerald-400'}`} />
              <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all duration-300 group font-bold text-sm shadow-lg shadow-rose-500/5"
        >
          <LogOut size={18} />
          <span>Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
