'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { mode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all group relative overflow-hidden"
            title={mode === 'dark' ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
        >
            <div className={`transition-all duration-500 transform ${mode === 'dark' ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <Moon size={18} />
            </div>
            <div className={`absolute transition-all duration-500 transform ${mode === 'light' ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
                <Sun size={18} className="text-amber-400" />
            </div>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
    );
}
