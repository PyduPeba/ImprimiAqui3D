import React, { useState } from 'react';
import { 
    Users, 
    UserPlus, 
    Shield, 
    Search, 
    MoreVertical, 
    Edit2, 
    Trash2, 
    CheckCircle2, 
    XCircle,
    Activity,
    Mail
} from 'lucide-react';
import { User, usersService } from '@/services/users.service';
import { UserRole } from '@/types/user';
import { UserFormModal } from './UserFormModal';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface SecuritySettingsProps {
    users: User[];
    onRefresh: () => void;
}

export function SecuritySettings({ users, onRefresh }: SecuritySettingsProps) {
    const { user: currentUser } = useAuth();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (id === currentUser?.id) {
            toast.error('Você não pode excluir sua própria conta');
            return;
        }
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
        
        try {
            await usersService.remove(id);
            toast.success('Usuário excluído!');
            onRefresh();
        } catch (error) {
            toast.error('Erro ao excluir usuário');
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ADMIN: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case UserRole.MANAGER: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case UserRole.OPERATOR: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none"
                    />
                </div>
                <button 
                    onClick={handleAdd}
                    className="btn-premium !py-3 !px-6 flex items-center gap-2 text-xs uppercase tracking-widest w-full md:w-auto"
                >
                    <UserPlus size={18} />
                    Novo Usuário
                </button>
            </div>

            <div className="glass-card !p-0 overflow-hidden border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Usuário</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Perfil</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center border border-white/10 text-slate-300 font-bold group-hover:scale-105 transition-transform duration-300">
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                                                    {user.name || 'Sem nome'}
                                                </span>
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Mail size={12} /> {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${getRoleBadgeColor(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.isActive ? (
                                            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                Ativo
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                                Inativo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-500 font-medium italic">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserFormModal 
                    user={selectedUser} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={onRefresh} 
                />
            )}
        </div>
    );
}
