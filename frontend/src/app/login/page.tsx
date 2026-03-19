"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
        rememberMe: true
    }
  });

  const { login } = useAuth();
  
  const [branding, setBranding] = useState<{name?: string, logoUrl?: string}>({});
  
  const getImageUrl = (path: string | undefined) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return `${baseUrl}${path}`.replace('/api/uploads', '/uploads');
  };

  React.useEffect(() => {
    async function loadBranding() {
      try {
        const settings = await import('@/services/settings.service').then(m => m.settingsService.getPublicSettings());
        if (settings) {
            setBranding({
                name: settings.name,
                logoUrl: settings.branding?.logoUrl
            });
        }
      } catch (error) {
        console.warn('Failed to load branding', error);
      }
    }
    loadBranding();

    // Load saved email if rememberMe was previously active
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        setValue('email', savedEmail);
        setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    // Handle "Remember Me" locally
    if (data.rememberMe) {
        localStorage.setItem('rememberedEmail', data.email);
    } else {
        localStorage.removeItem('rememberedEmail');
    }

    try {
      setLoginError(null);
      await login({
        email: data.email,
        password: data.password,
      });
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 404) {
          setLoginError('Usuário ou senha pode estar errado. Tente novamente.');
      } else {
          setLoginError('Ocorreu um erro ao tentar fazer login. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--bg-main)] transition-colors duration-500">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse opacity-50 dark:opacity-100" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse opacity-50 dark:opacity-100" />

      <div className="w-full max-w-md p-8 relative z-10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          {branding.logoUrl ? (
             <img src={getImageUrl(branding.logoUrl)} alt="Logo" className="h-24 object-contain mb-6 drop-shadow-2xl" />
          ) : (
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg mb-4 shadow-emerald-500/20">
                I
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight text-center">
            {branding.name || (
                <>Imprimi<span className="text-emerald-500">Aqui</span>3D</>
            )}
          </h1>
          <p className="text-[var(--text-muted)] mt-2 text-sm font-medium">Gestão inteligente para sua produção 3D</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--glass-border)] p-8 rounded-3xl shadow-[var(--glass-shadow)] transition-all duration-300">
          <h2 className="text-xl font-bold text-[var(--text-main)] mb-6">Bem-vindo de volta!</h2>
          
          {loginError && (
              <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <p className="text-sm font-semibold">{loginError}</p>
              </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-main)] opacity-80 ml-1">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="exemplo@gmail.com"
                  className={cn(
                    "w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl py-3 pl-12 pr-4 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none",
                    errors.email && "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
              </div>
              {errors.email && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-[var(--text-main)] opacity-80">Senha</label>
                <button type="button" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">Esqueceu a senha?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    "w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl py-3 pl-12 pr-12 text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none",
                    errors.password && "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                  )}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="peer appearance-none w-5 h-5 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-md checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all outline-none"
                />
                <CheckCircle2 size={12} className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <label htmlFor="rememberMe" className="text-sm text-[var(--text-muted)] cursor-pointer select-none font-medium">Lembrar minha conta</label>
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[var(--text-muted)] opacity-60 text-xs mt-8 font-medium">
          &copy; 2026 ImprimiAqui3D. Desenvolvido para Advanced Agentic Coding.
        </p>
      </div>
    </div>
  );
}
