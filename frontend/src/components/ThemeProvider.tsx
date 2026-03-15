'use client';

import { useEffect } from 'react';
import { settingsService } from '@/services/settings.service';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const loadTheme = async () => {
            // Check for token to avoid 401 loop on login page
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
                // Silently fail to avoid console noise during auth transitions
                console.warn('Failed to load theme settings', error);
            }
        };

        loadTheme();
    }, []);

    return <>{children}</>;
}
