'use client';

import React, { useState, useEffect } from 'react';
import { FinancialSettings } from '../tabs/FinancialSettings';
import { PricingSettings } from '../tabs/PricingSettings';
import { settingsService, StoreSettings } from '@/services/settings.service';
import { toast } from 'react-hot-toast';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { CreditCard, TrendingUp } from 'lucide-react';

enum Tab {
    FINANCIAL = 'FINANCIAL',
    PRICING = 'PRICING',
}

const defaultSettings: StoreSettings = {
    branding: { logoUrl: '', faviconUrl: '', primaryColor: '#4F46E5', secondaryColor: '#10B981' },
    finance: {
        paymentMethods: {
            creditCard: { rate: 0, installments: [] },
            debitCard: { rate: 0 },
            pix: { rate: 0, discount: 0 }
        },
        marketplace: {}
    },
    pricing: { defaultHourlyRate: 0, defaultMaterialCost: 0, defaultMargin: 1, minOrderValue: 0 },
    reports: { termsAndConditions: '', footerText: '', showMargins: true }
};

export default function PrecosSettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>(Tab.FINANCIAL);
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const data = await settingsService.getSettings();
            setSettings(prev => ({ ...defaultSettings, ...data }));
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = (updates: Partial<StoreSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsService.updateSettings(settings);
            toast.success('Configurações salvas com sucesso!');
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: Tab.FINANCIAL, label: 'Financeiro', icon: CreditCard },
        { id: Tab.PRICING, label: 'Precificação', icon: TrendingUp },
    ];

    return (
        <SettingsShell
            title="Preços & Valores"
            description="Configure taxas de pagamento, marketplaces e regras de precificação."
            icon={TrendingUp}
            loading={loading}
            saving={saving}
            hasChanges={hasChanges}
            onSave={handleSave}
            onDiscard={loadSettings}
            sidebar={
                tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full text-left px-4 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                            activeTab === tab.id
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))
            }
        >
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === Tab.FINANCIAL && (
                    <FinancialSettings settings={settings} onUpdate={handleUpdate} />
                )}
                {activeTab === Tab.PRICING && (
                    <PricingSettings settings={settings} onUpdate={handleUpdate} />
                )}
            </div>
        </SettingsShell>
    );
}
