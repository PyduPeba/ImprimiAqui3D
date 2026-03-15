import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Mail, Lock, User as UserIcon, Shield, Loader2, Check } from 'lucide-react';
import { User, CreateUserPayload, UpdateUserPayload, usersService } from '@/services/users.service';
import { UserRole } from '@/types/user';
import { toast } from 'react-hot-toast';

const userSchema = z.object({
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional().or(z.literal('')),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    role: z.nativeEnum(UserRole),
    isActive: z.boolean(),
}).refine((data) => {
    if (!data.password && !data.confirmPassword) return true;
    return data.password === data.confirmPassword;
}, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormModalProps {
    user: User | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function UserFormModal({ user, onClose, onSuccess }: UserFormModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: user?.name || '',
            email: user?.email || '',
            role: user?.role || UserRole.OPERATOR,
            isActive: user?.isActive ?? true,
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: UserFormValues) => {
        setIsLoading(true);
        try {
            if (user) {
                const payload: UpdateUserPayload = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    isActive: data.isActive,
                };
                if (data.password) payload.password = data.password;
                
                await usersService.update(user.id, payload);
                toast.success('Usuário atualizado!');
            } else {
                if (!data.password) {
                    toast.error('Senha é obrigatória para novos usuários');
                    setIsLoading(false);
                    return;
                }
                const payload: CreateUserPayload = {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                    isActive: data.isActive,
                };
                await usersService.create(payload);
                toast.success('Usuário criado!');
            }
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white tracking-tight">
                                {user ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {user ? 'Atualize as permissões e dados' : 'Cadastre um novo operador'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-3 text-slate-500" size={16} />
                                <input
                                    {...register('name')}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                    placeholder="Nome do colaborador"
                                />
                            </div>
                            {errors.name && <p className="text-rose-500 text-[10px] ml-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3 text-slate-500" size={16} />
                                <input
                                    {...register('email')}
                                    type="email"
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                    placeholder="email@empresa.com"
                                />
                            </div>
                            {errors.email && <p className="text-rose-500 text-[10px] ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3 text-slate-500" size={16} />
                                    <input
                                        {...register('password')}
                                        type="password"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                        placeholder={user ? "••••••••" : "Mín. 6 chars"}
                                    />
                                </div>
                                {errors.password && <p className="text-rose-500 text-[10px] ml-1">{errors.password.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3 text-slate-500" size={16} />
                                    <input
                                        {...register('confirmPassword')}
                                        type="password"
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                        placeholder="Repita a senha"
                                    />
                                </div>
                                {errors.confirmPassword && <p className="text-rose-500 text-[10px] ml-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Perfil / Cargo</label>
                                <select
                                    {...register('role')}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value={UserRole.ADMIN}>Administrador</option>
                                    <option value={UserRole.MANAGER}>Gerente</option>
                                    <option value={UserRole.OPERATOR}>Operador</option>
                                    <option value={UserRole.CLIENT}>Cliente</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                <div className="flex items-center gap-4 py-2">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                        <span className="ml-3 text-sm font-bold text-slate-400 peer-checked:text-emerald-400">
                                            {register('isActive') ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] btn-premium !py-3 flex justify-center items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                            {user ? 'Salvar Alterações' : 'Criar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
