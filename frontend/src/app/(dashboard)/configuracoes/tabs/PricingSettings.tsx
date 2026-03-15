import React from 'react';
import { StoreSettings } from '@/services/settings.service';
import { BadgeDollarSign, Scale, Clock, TrendingUp } from 'lucide-react';

interface Props {
    settings: StoreSettings;
    onUpdate: (updates: Partial<StoreSettings>) => void;
}

export function PricingSettings({ settings, onUpdate }: Props) {
    const handleChange = (field: string, value: number) => {
        onUpdate({
            pricing: {
                ...settings.pricing,
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="glass-card !p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5 relative z-10">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10">
                        <BadgeDollarSign className="text-amber-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Algoritmo de Precificação</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Parâmetros Base para Cálculos Industriais</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                    {/* Hourly Rate */}
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-amber-500/30 transition-all duration-500 group/metric relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                            <Clock size={40} className="text-amber-400" />
                        </div>
                        
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                                <Clock size={16} className="text-amber-400" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Custo Operacional / Hora</h3>
                        </div>

                        <div className="relative group/input">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-black text-sm">R$</span>
                            <input
                                type="number"
                                value={settings.pricing?.defaultHourlyRate || 0}
                                onChange={(e) => handleChange('defaultHourlyRate', Number(e.target.value))}
                                className="glass-input w-full !pl-12 !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-black text-xl text-white"
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-amber-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">Valor base por setup/máquina</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 animate-pulse" />
                        </div>
                    </div>

                    {/* Material Cost */}
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all duration-500 group/metric relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                            <Scale size={40} className="text-blue-400" />
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <Scale size={16} className="text-blue-400" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Custo de Insumo (Grama)</h3>
                        </div>

                        <div className="relative group/input">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500/50 font-black text-sm">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={settings.pricing?.defaultMaterialCost || 0}
                                onChange={(e) => handleChange('defaultMaterialCost', Number(e.target.value))}
                                className="glass-input w-full !pl-12 !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-black text-xl text-white"
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">Média ponderada por grama</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
                        </div>
                    </div>

                    {/* Default Margin */}
                    <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group/metric relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/metric:opacity-30 transition-opacity">
                            <TrendingUp size={40} className="text-emerald-400" />
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <TrendingUp size={16} className="text-emerald-400" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Markup / Margem de Lucro</h3>
                        </div>

                        <div className="relative group/input">
                            <input
                                type="number"
                                step="0.1"
                                value={settings.pricing?.defaultMargin || 1}
                                onChange={(e) => handleChange('defaultMargin', Number(e.target.value))}
                                className="glass-input w-full !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-black text-xl text-white"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500/50 font-black text-[10px] uppercase tracking-widest">Multiplicador</span>
                            <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider italic">Ex: 2.5 = 150% de ROI líquido</p>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
