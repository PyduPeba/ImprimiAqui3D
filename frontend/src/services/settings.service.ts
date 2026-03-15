import api from '@/lib/api';

export interface StoreSettings {
    branding: {
        storeName?: string;
        storeEmail?: string;
        storePhone?: string;
        logoUrl: string;
        faviconUrl: string;
        primaryColor: string;
        secondaryColor: string;
    };
    finance: {
        paymentMethods: {
            creditCard: {
                rate: number;
                interestType?: 'SIMPLE' | 'COMPOUND';
                installments: { count: number; rate: number }[]
            };
            debitCard: { rate: number };
            pix: { rate: number; discount: number };
        };
        marketplace: {
            [channel: string]: { commission: number; fixedFee: number };
        };
    };
    pricing: {
        defaultHourlyRate: number;
        defaultMaterialCost: number;
        defaultMargin: number;
        minOrderValue: number;
    };
    reports: {
        termsAndConditions: string;
        footerText: string;
        showMargins: boolean;
    };
}

export const settingsService = {
    getSettings: async () => {
        const response = await api.get('/system-config/store');
        return response.data;
    },

    getPublicSettings: async () => {
        const response = await api.get('/system-config/public/branding');
        return response.data;
    },

    updateSettings: async (settings: Partial<StoreSettings>) => {
        const response = await api.patch('/system-config/store', settings);
        return response.data;
    },

    uploadLogo: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/system-config/upload-logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data; // { url: '...' }
    },
};
