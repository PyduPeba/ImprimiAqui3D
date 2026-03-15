'use client';

import React from 'react';
import { MyAccountSettings } from '@/components/settings/MyAccountSettings';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { User as UserIcon } from 'lucide-react';

export default function MyAccountPage() {
    return (
        <SettingsShell
            title="Minha Conta"
            description="Gerencie suas informações pessoais e segurança da conta."
            icon={UserIcon}
            onSave={() => {}} // Handle inside component
            onDiscard={() => {}}
            hasChanges={false}
        >
            <MyAccountSettings />
        </SettingsShell>
    );
}
