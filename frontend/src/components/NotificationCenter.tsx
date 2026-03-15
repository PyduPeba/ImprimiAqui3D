"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Trash2, Clock } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Polling interval (30 seconds)
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error loading notifications:', err.message || err);
      // If it's a network error, we don't want to spam the user with toasts
      // as it might be a temporary dropout in local dev
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic UI update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    setLoading(true);

    try {
      await notificationService.markAllAsRead();
      // No need to reload specifically if we're confident, but let's do it to sync
      loadNotifications();
    } catch (err) {
      console.error('Error marking all as read:', err);
      // Rollback on error
      setNotifications(previousNotifications);
      setUnreadCount(previousCount);
      toast.error('Erro ao marcar notificações como lidas');
    } finally {
      setLoading(false);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'SALE': return 'text-emerald-500 bg-emerald-50';
      case 'MODELING': return 'text-indigo-500 bg-indigo-50';
      case 'STOCK': return 'text-rose-500 bg-rose-50';
      case 'PRODUCTION': return 'text-amber-500 bg-amber-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all duration-200 group"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:scale-110 group-active:scale-95 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce-short">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              Notificações
              {unreadCount > 0 && <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-0.5 rounded-full">{unreadCount} novas</span>}
            </h3>
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading || unreadCount === 0}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {loading ? 'Marcando...' : (
                <>
                  <Check className="w-3 h-3" />
                  Marcar tudo como lido
                </>
              )}
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200">
            {notifications.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer relative group ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                    onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                  >
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${getIconColor(notif.type)}`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={`text-sm font-bold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.read ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-slate-800 font-bold mb-1">Nada por aqui</h4>
                <p className="text-slate-500 text-xs">Você não tem nenhuma notificação recente.</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Fechar painel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
