"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../services/auth.service';

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedUser = authService.getUser();
        if (savedUser) {
            setUser(savedUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials: any) => {
        const data = await authService.login(credentials);
        setUser(data.user);
        router.push('/dashboard');
        return data;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        router.push('/login');
    };

    const updateUser = (userData: any) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    return React.createElement(AuthContext.Provider, { value: { user, login, logout, updateUser, loading } }, children);
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
