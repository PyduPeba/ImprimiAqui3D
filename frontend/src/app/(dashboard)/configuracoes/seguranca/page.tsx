'use client';

import React, { useState, useEffect } from 'react';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { usersService, User } from '@/services/users.service';
import { toast } from 'react-hot-toast';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/user';

export default function SecurityPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === UserRole.ADMIN) {
            loadUsers();
        }
    }, [currentUser]);

    if (currentUser?.role !== UserRole.ADMIN) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-card border-rose-500/20">
                <ShieldCheck size={48} className="text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-slate-400 text-center">Apenas administradores podem gerenciar usuários e segurança.</p>
            </div>
        );
    }

    return (
        <SettingsShell
            title="Segurança & Perfis"
            description="Gerencie os usuários e permissões de acesso ao sistema."
            icon={ShieldCheck}
            loading={loading}
            onSave={() => {}} // No saving logic for the shell here, handled in components
            onDiscard={() => loadUsers()}
            hasChanges={false}
        >
            <SecuritySettings users={users} onRefresh={loadUsers} />
        </SettingsShell>
    );
}
