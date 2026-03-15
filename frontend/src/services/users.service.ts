import api from '@/lib/api';
import { UserRole } from '@/types/user';

export interface User {
    id: string;
    name?: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserPayload {
    name?: string;
    email: string;
    password: string;
    role?: UserRole;
    isActive?: boolean;
}

export interface UpdateUserPayload {
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    isActive?: boolean;
}

export const usersService = {
    getAll: async (): Promise<User[]> => {
        const res = await api.get('/users');
        return res.data;
    },

    getOne: async (id: string): Promise<User> => {
        const res = await api.get(`/users/${id}`);
        return res.data;
    },

    create: async (payload: CreateUserPayload): Promise<User> => {
        const res = await api.post('/users', payload);
        return res.data;
    },

    update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
        const res = await api.patch(`/users/${id}`, payload);
        return res.data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`/users/${id}`);
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        await api.patch('/users/me/password', { currentPassword, newPassword });
    },

    updateProfile: async (name: string): Promise<User> => {
        const res = await api.patch('/users/me/profile', { name });
        return res.data;
    },
};
