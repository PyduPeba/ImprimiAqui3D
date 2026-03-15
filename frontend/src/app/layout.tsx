import React from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
            <ThemeProvider>
                {children}
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: 'rgba(15, 23, 42, 0.8)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: '#fff',
                            borderRadius: '16px',
                            fontSize: '13px',
                            fontWeight: '700',
                            padding: '16px 24px',
                            boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
                            fontFamily: 'inherit',
                            letterSpacing: '-0.01em',
                        },
                        success: {
                            iconTheme: {
                                primary: '#10b981',
                                secondary: '#0f172a',
                            },
                            style: {
                                borderLeft: '4px solid #10b981',
                            }
                        },
                        error: {
                            iconTheme: {
                                primary: '#fb7185',
                                secondary: '#0f172a',
                            },
                            style: {
                                borderLeft: '4px solid #fb7185',
                            }
                        }
                    }}
                />
            </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
