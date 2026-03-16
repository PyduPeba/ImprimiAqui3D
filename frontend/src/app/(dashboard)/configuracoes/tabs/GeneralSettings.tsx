import React, { useState } from 'react';
import { StoreSettings, settingsService } from '@/services/settings.service';
import { Upload, Save, Building, Loader2, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    settings: StoreSettings;
    onUpdate: (updates: Partial<StoreSettings>) => void;
}

export function GeneralSettings({ settings, onUpdate }: Props) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { url } = await settingsService.uploadLogo(file);
            onUpdate({
                branding: {
                    ...settings.branding,
                    logoUrl: url,
                },
            });
            toast.success('Logo atualizada com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao fazer upload da logo');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        onUpdate({
            branding: {
                ...settings.branding,
                [field]: value,
            },
        });
    };

    const getImageUrl = (path: string | undefined) => {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return `${baseUrl}${path}`.replace('/api/uploads', '/uploads');
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Store Information Section */}
            <div className="glass-card !p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                        <Building className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Identidade da Loja</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Configuração de Branding e Metadados</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    <div className="space-y-8">
                        {/* Store Name */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Nome Comercial / Título do Sistema</label>
                            <div className="relative group/input">
                                <input
                                    type="text"
                                    value={settings.branding?.storeName || ''}
                                    onChange={(e) => handleChange('storeName', e.target.value)}
                                    placeholder="Ex: ImprimiAqui3D"
                                    className="glass-input w-full !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-bold"
                                />
                                <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                            </div>
                        </div>

                        {/* Contacts Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">E-mail Corporativo</label>
                                <input
                                    type="email"
                                    value={settings.branding?.storeEmail || ''}
                                    onChange={(e) => handleChange('storeEmail', e.target.value)}
                                    placeholder="loja@exemplo.com"
                                    className="glass-input w-full !bg-white/5 !text-sm font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">WhatsApp de Suporte</label>
                                <input
                                    type="text"
                                    value={settings.branding?.storePhone || ''}
                                    onChange={(e) => handleChange('storePhone', e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="glass-input w-full !bg-white/5 !text-sm font-semibold"
                                />
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="pt-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Representação Visual (Logo)</label>
                            <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-500">
                                <div className="relative group/logo">
                                    <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center bg-black/20 overflow-hidden group-hover/logo:border-emerald-500/50 transition-all duration-500 shadow-inner">
                                        {settings.branding?.logoUrl ? (
                                            <img src={getImageUrl(settings.branding.logoUrl)} alt="Logo Preview" className="w-full h-full object-contain p-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover/logo:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 opacity-30 group-hover/logo:opacity-100 transition-opacity duration-500">
                                                <Upload className="text-white" size={32} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Upload</span>
                                            </div>
                                        )}
                                        {uploading && (
                                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                                                <Loader2 className="animate-spin text-emerald-400" size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                    <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md shadow-lg shadow-emerald-500/20 uppercase tracking-widest opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300">
                                        Clique para Alterar
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Formatos: PNG, JPG ou WebP</p>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed italic">* Recomendação: 512x512px com fundo transparente.</p>
                                    </div>
                                    {settings.branding?.logoUrl && (
                                        <button 
                                            onClick={() => handleChange('logoUrl', '')}
                                            className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 hover:text-rose-400 flex items-center gap-2 transition-colors duration-300"
                                        >
                                            <div className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center">
                                                <span className="leading-none select-none">×</span>
                                            </div>
                                            Remover Identidade Visual
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Aesthetic Section (Colors) */}
                    <div className="lg:border-l lg:border-white/5 lg:pl-12 space-y-10">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Palette className="text-indigo-400" size={20} />
                                </div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Paleta de Cores do Sistema</h3>
                            </div>

                            <div className="space-y-8">
                                {/* Primary Color */}
                                <div className="p-6 bg-white/3 rounded-2xl border border-white/5 group/color">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Cor Primária (Interface)</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative pointer-events-none">
                                            <input
                                                type="color"
                                                value={settings.branding?.primaryColor || '#10b981'}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                readOnly
                                            />
                                            <div 
                                                className="w-16 h-16 rounded-2xl border-4 border-white/10 shadow-2xl transition-all duration-500 group-hover/color:scale-110"
                                                style={{ backgroundColor: settings.branding?.primaryColor || '#10b981', boxShadow: `0 0 30px ${settings.branding?.primaryColor || '#10b981'}33` }}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="color"
                                                value={settings.branding?.primaryColor || '#10b981'}
                                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                                className="w-full h-8 bg-transparent cursor-pointer rounded-lg border border-white/10 overflow-hidden"
                                            />
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={settings.branding?.primaryColor || '#10b981'}
                                                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                                                    className="w-full bg-transparent border-none text-xs font-black uppercase tracking-widest text-white/80 focus:ring-0 p-0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold mt-4 leading-relaxed tracking-wider uppercase">Botões de ação, headers e elementos de destaque.</p>
                                </div>

                                {/* Secondary Color */}
                                <div className="p-6 bg-white/3 rounded-2xl border border-white/5 group/color-sec">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Cor Secundária (Auxiliar)</label>
                                    <div className="flex items-center gap-6">
                                        <div className="relative pointer-events-none">
                                            <div 
                                                className="w-16 h-16 rounded-2xl border-4 border-white/10 shadow-2xl transition-all duration-500 group-hover/color-sec:scale-110"
                                                style={{ backgroundColor: settings.branding?.secondaryColor || '#6366f1', boxShadow: `0 0 30px ${settings.branding?.secondaryColor || '#6366f1'}33` }}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                type="color"
                                                value={settings.branding?.secondaryColor || '#6366f1'}
                                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                                className="w-full h-8 bg-transparent cursor-pointer rounded-lg border border-white/10 overflow-hidden"
                                            />
                                            <input
                                                type="text"
                                                value={settings.branding?.secondaryColor || '#6366f1'}
                                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                                className="w-full bg-transparent border-none text-xs font-black uppercase tracking-widest text-white/80 focus:ring-0 p-0"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold mt-4 leading-relaxed tracking-wider uppercase">Ícones, tags e elementos de organização.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
