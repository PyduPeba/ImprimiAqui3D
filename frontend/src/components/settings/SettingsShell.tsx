"use client";

import React from 'react';
import { Settings, Save, Loader2, RefreshCw } from 'lucide-react';

interface SettingsShellProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  loading?: boolean;
  saving?: boolean;
  hasChanges?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function SettingsShell({
  title,
  description,
  icon: Icon = Settings,
  loading,
  saving,
  hasChanges,
  onSave,
  onDiscard,
  children,
  sidebar
}: SettingsShellProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-slate-300" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl group-hover:scale-110 transition-transform duration-500 ring-4 ring-white/5">
              <Icon className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                {title}
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {hasChanges && (
              <button
                onClick={onDiscard}
                disabled={saving}
                className="flex-1 md:flex-none px-5 py-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest border border-white/5 hover:border-white/10"
              >
                <RefreshCw size={16} />
                Descartar
              </button>
            )}
            <button
              onClick={onSave}
              disabled={!hasChanges || saving}
              className="flex-1 md:flex-none btn-premium !py-3 !px-8 text-xs uppercase tracking-[0.2em]"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {sidebar && (
          <div className="w-full lg:w-72 flex-shrink-0 animate-in slide-in-from-left-4 duration-700">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-2 shadow-2xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-2xl" />
              <div className="relative z-10 space-y-1">
                {sidebar}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
