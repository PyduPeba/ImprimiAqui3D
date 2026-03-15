import React from 'react';
import { StoreSettings } from '@/services/settings.service';
import { FileText, AlignLeft, TrendingUp } from 'lucide-react';

interface Props {
    settings: StoreSettings;
    onUpdate: (updates: Partial<StoreSettings>) => void;
}

export function DocumentSettings({ settings, onUpdate }: Props) {
    const handleChange = (field: string, value: any) => {
        onUpdate({
            reports: {
                ...settings.reports,
                [field]: value,
            },
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="glass-card !p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5 relative z-10">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/10">
                        <FileText className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Regras de Emissão</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Personalização de Documentos e Relatórios</p>
                    </div>
                </div>

                <div className="space-y-10 relative z-10">
                    {/* Terms */}
                    <div className="group/field">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center gap-2">
                            <AlignLeft size={14} className="text-blue-400/50" />
                            Termos e Condições (Padrão Orçamento)
                        </label>
                        <div className="relative group/input">
                            <textarea
                                value={settings.reports?.termsAndConditions || ''}
                                onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                                rows={8}
                                className="glass-input w-full !bg-white/3 group-hover/input:!bg-white/5 transition-all duration-300 !text-sm leading-relaxed font-semibold placeholder:text-slate-600 resize-none border-white/5"
                                placeholder="Defina aqui as regras de validade, formas de pagamento e prazos padrão..."
                            />
                            <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                        </div>
                        <p className="text-[9px] text-slate-600 font-bold mt-3 leading-relaxed tracking-wider uppercase ml-1 italic">
                            * Inserido automaticamente no sumário de orçamentos emitidos.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Footer */}
                        <div>
                             <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Rodapé Tecnológico / Contato Fixo</label>
                             <div className="relative group/input">
                                <input
                                    type="text"
                                    value={settings.reports?.footerText || ''}
                                    onChange={(e) => handleChange('footerText', e.target.value)}
                                    className="glass-input w-full !bg-white/3 group-hover/input:!bg-white/5 transition-all duration-300 font-bold text-sm"
                                    placeholder="Ex: ImprimiAqui3D • Matriz Industrial • (11) 99999-9999"
                                />
                                <div className="absolute bottom-0 left-0 h-0.5 bg-blue-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                             </div>
                        </div>

                        {/* Options */}
                        <div className="flex items-end">
                            <label className="w-full flex items-center justify-between p-4 bg-white/3 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer group/toggle">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${settings.reports?.showMargins ?? true ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-white/5'}`}>
                                        <TrendingUp size={20} className={settings.reports?.showMargins ?? true ? 'text-emerald-400' : 'text-slate-500'} />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">Exibir Margens Brutas</span>
                                        <span className="block text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Visível apenas em relatórios administrativos internos</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.reports?.showMargins ?? true}
                                        onChange={(e) => handleChange('showMargins', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner" />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
