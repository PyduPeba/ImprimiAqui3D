'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsService } from '@/services/settings.service';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>('dark');

    const toggleTheme = () => {
        const newMode = mode === 'dark' ? 'light' : 'dark';
        setMode(newMode);
        localStorage.setItem('theme', newMode);
        applyTheme(newMode);
    };

    const applyTheme = (currentMode: ThemeMode) => {
        const root = document.documentElement;
        if (currentMode === 'light') {
            root.classList.add('light');
        } else {
            root.classList.remove('light');
        }
    };

    useEffect(() => {
        // Load mode from localStorage
        const savedMode = localStorage.getItem('theme') as ThemeMode;
        if (savedMode) {
            setMode(savedMode);
            applyTheme(savedMode);
        } else {
            // Default to dark or check system preference
            const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
            if (prefersLight) {
                setMode('light');
                applyTheme('light');
            }
        }

        const loadBrandSettings = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const settings = await settingsService.getSettings();
                if (settings?.branding) {
                    const root = document.documentElement;
                    if (settings.branding.primaryColor) {
                        root.style.setProperty('--primary', settings.branding.primaryColor);
                    }
                    if (settings.branding.secondaryColor) {
                        root.style.setProperty('--secondary', settings.branding.secondaryColor);
                    }
                }
            } catch (error) {
                console.warn('Failed to load branding settings:', error);
            }
        };

        loadBrandSettings();
    }, []);

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
