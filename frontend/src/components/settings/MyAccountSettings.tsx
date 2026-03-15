import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
    User as UserIcon, 
    Mail, 
    Shield, 
    Lock, 
    Loader2, 
    Save, 
    Key, 
    CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usersService } from '@/services/users.service';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(6, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function MyAccountSettings() {
    const { user, login } = useAuth();
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || '',
        },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onUpdateProfile = async (data: ProfileFormValues) => {
        setIsSavingProfile(true);
        try {
            const updatedUser = await usersService.updateProfile(data.name);
            // We need to update the user in the context/local storage
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const newUser = { ...savedUser, name: updatedUser.name };
            localStorage.setItem('user', JSON.stringify(newUser));
            // Trigger a re-render or context update if possible, 
            // for now a reload or the user can see it next time
            toast.success('Perfil atualizado com sucesso!');
            window.location.reload(); // Quickest way to sync state across layout
        } catch (error) {
            toast.error('Erro ao atualizar perfil');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const onUpdatePassword = async (data: PasswordFormValues) => {
        setIsSavingPassword(true);
        try {
            await usersService.changePassword(data.currentPassword, data.newPassword);
            toast.success('Senha alterada com sucesso!');
            passwordForm.reset();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao alterar senha');
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Perfil Summary Card */}
            <div className="glass-card overflow-hidden border-white/5 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 shadow-2xl relative">
                        <UserIcon className="text-slate-500" size={40} />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center border-4 border-slate-900 shadow-lg shadow-emerald-500/20">
                            <Shield size={14} className="text-white" />
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl font-black text-white tracking-tight">{user?.name || 'Sem Nome'}</h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <Mail size={12} className="text-emerald-500" />
                                {user?.email}
                             </div>
                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase text-emerald-400 tracking-widest">
                                <Shield size={12} />
                                {user?.role}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Personal Information Form */}
                <div className="glass-card border-white/5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <UserIcon size={18} />
                        </div>
                        <h3 className="font-black text-white text-sm uppercase tracking-widest">Informações Pessoais</h3>
                    </div>

                    <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-5 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome de Exibição</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    {...profileForm.register('name')}
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                    placeholder="Seu nome"
                                />
                            </div>
                            {profileForm.formState.errors.name && <p className="text-rose-500 text-[10px] ml-1">{profileForm.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5 opacity-50">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">E-mail (Não editável)</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-slate-500 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="pt-4 mt-auto">
                            <button
                                type="submit"
                                disabled={isSavingProfile}
                                className="w-full btn-premium !py-3 flex justify-center items-center gap-2 text-xs uppercase tracking-widest"
                            >
                                {isSavingProfile ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password Form */}
                <div className="glass-card border-white/5 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 border border-amber-500/20">
                            <Key size={18} />
                        </div>
                        <h3 className="font-black text-white text-sm uppercase tracking-widest">Segurança & Senha</h3>
                    </div>

                    <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-5 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha Atual</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
                                <input
                                    {...passwordForm.register('currentPassword')}
                                    type="password"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            {passwordForm.formState.errors.currentPassword && <p className="text-rose-500 text-[10px] ml-1">{passwordForm.formState.errors.currentPassword.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nova Senha</label>
                                <input
                                    {...passwordForm.register('newPassword')}
                                    type="password"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                {passwordForm.formState.errors.newPassword && <p className="text-rose-500 text-[10px] ml-1">{passwordForm.formState.errors.newPassword.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirmar</label>
                                <input
                                    {...passwordForm.register('confirmPassword')}
                                    type="password"
                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-amber-500/50 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                                {passwordForm.formState.errors.confirmPassword && <p className="text-rose-500 text-[10px] ml-1">{passwordForm.formState.errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="pt-4 mt-auto">
                            <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl shadow-lg shadow-amber-500/10 transition-all font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2"
                            >
                                {isSavingPassword ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Atualizar Senha
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
