import React, { useState } from 'react';
import { StoreSettings } from '@/services/settings.service';
import { CreditCard, Wallet, Percent, Plus, Trash2, Edit2, X, Info } from 'lucide-react';

interface Props {
    settings: StoreSettings;
    onUpdate: (updates: Partial<StoreSettings>) => void;
}

const MARKETPLACE_TEMPLATES = [
    { name: 'Shopee 2026', commission: 20, fixedFee: 4 },
    { name: 'Mercado Livre Clássico', commission: 12.5, fixedFee: 6 },
    { name: 'Mercado Livre Premium', commission: 17.5, fixedFee: 6 },
    { name: 'Amazon Vendedor', commission: 15, fixedFee: 0 },
];

export function FinancialSettings({ settings, onUpdate }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingChannel, setEditingChannel] = useState<string | null>(null);
    const [modalData, setModalData] = useState({ name: '', commission: 0, fixedFee: 0 });

    const handleCreditCardRateChange = (installments: number, rate: number) => {
        const currentMethods = settings.finance?.paymentMethods || { 
            creditCard: { rate: 0, installments: [] }, 
            debitCard: { rate: 0 }, 
            pix: { rate: 0, discount: 0 } 
        };

        const updatedInstallments = [...(currentMethods.creditCard.installments || [])];
        const existingIndex = updatedInstallments.findIndex(i => i.count === installments);

        if (existingIndex >= 0) {
            updatedInstallments[existingIndex] = { count: installments, rate };
        } else {
            updatedInstallments.push({ count: installments, rate });
        }
        updatedInstallments.sort((a, b) => a.count - b.count);

        onUpdate({
            finance: {
                ...settings.finance,
                paymentMethods: {
                    ...currentMethods,
                    creditCard: {
                        ...currentMethods.creditCard,
                        installments: updatedInstallments
                    }
                }
            }
        });
    };

    const handleInterestTypeChange = (type: 'SIMPLE' | 'COMPOUND') => {
        const currentMethods = settings.finance?.paymentMethods || { 
            creditCard: { rate: 0, installments: [] }, 
            debitCard: { rate: 0 }, 
            pix: { rate: 0, discount: 0 } 
        };

        onUpdate({
            finance: {
                ...settings.finance,
                paymentMethods: {
                    ...currentMethods,
                    creditCard: {
                        ...currentMethods.creditCard,
                        interestType: type
                    }
                }
            }
        });
    };

    const handleMarketplaceChange = (channel: string, field: 'commission' | 'fixedFee', value: number) => {
        const currentMarketplace = settings.finance?.marketplace || {};
        onUpdate({
            finance: {
                ...settings.finance,
                marketplace: {
                    ...currentMarketplace,
                    [channel]: {
                        ...currentMarketplace[channel],
                        [field]: value
                    }
                }
            }
        });
    };

    const openAddModal = () => {
        setEditingChannel(null);
        setModalData({ name: '', commission: 0, fixedFee: 0 });
        setIsModalOpen(true);
    };

    const openEditModal = (name: string, data: any) => {
        setEditingChannel(name);
        setModalData({ name, commission: data.commission, fixedFee: data.fixedFee });
        setIsModalOpen(true);
    };

    const handleSaveChannel = () => {
        if (!modalData.name) return;
        
        const currentMarketplace = { ...(settings.finance?.marketplace || {}) };
        
        // If renaming, remove the old key
        if (editingChannel && editingChannel !== modalData.name) {
            delete currentMarketplace[editingChannel];
        }

        onUpdate({
            finance: {
                ...settings.finance,
                marketplace: {
                    ...currentMarketplace,
                    [modalData.name.trim()]: { 
                        commission: modalData.commission, 
                        fixedFee: modalData.fixedFee 
                    }
                }
            }
        });
        setIsModalOpen(false);
    };

    const applyTemplate = (template: typeof MARKETPLACE_TEMPLATES[0]) => {
        setModalData({
            name: template.name.split(' ')[0], // Use first word as name or keep template name
            commission: template.commission,
            fixedFee: template.fixedFee
        });
    };

    const removeMarketplaceChannel = (name: string) => {
        if (!confirm(`Deseja remover o canal "${name}"?`)) return;
        const currentMarketplace = { ...settings.finance?.marketplace };
        delete currentMarketplace[name];
        onUpdate({
            finance: {
                ...settings.finance,
                marketplace: currentMarketplace
            }
        });
    };

    const handleRateChange = (method: 'debitCard' | 'pix', field: string, value: number) => {
         const currentMethods = settings.finance?.paymentMethods || { 
            creditCard: { rate: 0, installments: [] }, 
            debitCard: { rate: 0 }, 
            pix: { rate: 0, discount: 0 } 
        };

        onUpdate({
            finance: {
                ...settings.finance,
                paymentMethods: {
                    ...currentMethods,
                    [method]: {
                        ...currentMethods[method],
                        [field]: value
                    }
                }
            }
        });
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Payment Methods Section */}
            <div className="glass-card !p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5 relative z-10">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                        <CreditCard className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Taxas de Recebimento</h2>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Configuração de Gateway e Adquirência</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 relative z-10">
                    {/* Indirect Methods (Debit & PIX) */}
                    <div className="space-y-12">
                        {/* Debit Card */}
                        <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-500 group/field">
                            <div className="flex items-center justify-between mb-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard size={14} className="text-emerald-400/50" />
                                    Cartão de Débito
                                </label>
                                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter opacity-50 px-2 py-1 bg-white/5 rounded-md">Liquidação D+1</span>
                            </div>
                            <div className="relative group/input">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settings.finance?.paymentMethods?.debitCard?.rate || 0}
                                    onChange={(e) => handleRateChange('debitCard', 'rate', Number(e.target.value))}
                                    className="glass-input w-full !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-black text-xl text-white pr-12"
                                    placeholder="0.00"
                                />
                                <Percent size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover/input:text-emerald-400 transition-colors" />
                                <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/50 w-0 group-hover/input:w-full transition-all duration-500 rounded-full" />
                            </div>
                            <p className="text-[9px] text-slate-600 font-bold mt-3 leading-relaxed tracking-wider uppercase italic">Taxa administrativa fixa p/ transação física ou digital.</p>
                        </div>

                        {/* PIX */}
                        <div className="p-6 bg-white/3 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all duration-500 group/field">
                            <div className="flex items-center justify-between mb-6">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Wallet size={14} className="text-indigo-400/50" />
                                    Configuração PIX
                                </label>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-indigo-500 animate-ping" />
                                    <span className="text-[9px] text-indigo-400 font-black uppercase tracking-tighter">Instantâneo</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 block ml-1 opacity-70">Custo Operacional</span>
                                    <div className="relative group/input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.finance?.paymentMethods?.pix?.rate || 0}
                                            onChange={(e) => handleRateChange('pix', 'rate', Number(e.target.value))}
                                            className="glass-input w-full !bg-white/5 group-hover/input:!bg-white/10 transition-all duration-300 font-black text-lg text-white pr-10"
                                        />
                                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-hover/input:text-indigo-400 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-blue-400/80 font-black uppercase tracking-widest mb-2 block ml-1">Desconto Sugerido</span>
                                    <div className="relative group/input">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={settings.finance?.paymentMethods?.pix?.discount || 0}
                                            onChange={(e) => handleRateChange('pix', 'discount', Number(e.target.value))}
                                            className="glass-input w-full !bg-blue-500/5 group-hover/input:!bg-blue-500/10 transition-all duration-300 font-black text-lg text-blue-400 pr-10 border-blue-500/20"
                                        />
                                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400/50" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Credit Card Table */}
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Crédito & Parcelamento</h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Escalonamento de Juros Padrão</p>
                            </div>
                            
                            <div className="p-1 bg-white/5 rounded-xl border border-white/10 flex gap-1">
                                {['SIMPLE', 'COMPOUND'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleInterestTypeChange(type as any)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-500 ${
                                            (settings.finance?.paymentMethods?.creditCard?.interestType || 'SIMPLE') === type
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {type === 'SIMPLE' ? 'Simples' : 'Composto'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden shadow-inner">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Parcela</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Taxa Operacional</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/2">
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((i) => {
                                        const installment = settings.finance?.paymentMethods?.creditCard?.installments?.find((ins: any) => ins.count === i);
                                        return (
                                            <tr key={i} className="group/row hover:bg-white/2 transition-colors duration-300">
                                                <td className="px-6 py-4 font-black text-slate-400 group-hover/row:text-white transition-colors">
                                                    <span className="text-sm">{i}</span>
                                                    <span className="text-[10px] ml-1 opacity-50 uppercase tracking-tighter">Vezes</span>
                                                </td>
                                                <td className="px-6 py-2">
                                                    <div className="flex justify-end">
                                                        <div className="relative group/input w-28">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={installment?.rate || 0}
                                                                onChange={(e) => handleCreditCardRateChange(i, Number(e.target.value))}
                                                                className="w-full bg-white/3 group-hover/input:bg-white/5 border border-white/5 group-hover/input:border-emerald-500/30 rounded-lg px-3 py-1.5 outline-none text-right font-black text-slate-300 group-hover/row:text-white transition-all text-sm"
                                                            />
                                                            <Percent size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-600 group-hover/input:text-emerald-500 transition-colors" />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

             {/* Marketplace System Section */}
            <div className="glass-card !p-8 border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full -ml-48 -mt-48 pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
                            <Wallet className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Canais de Escoamento</h2>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Configuração de Marketplaces Externos</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={openAddModal}
                        className="btn-premium !py-3 !px-6 text-[10px] uppercase tracking-widest whitespace-nowrap shadow-purple-500/20"
                    >
                        <Plus size={16} />
                        Adicionar Canal
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {/* Normalized data rendering: sort by name and handle Shopee typo */}
                    {Object.entries(settings.finance?.marketplace || {}).sort(([a], [b]) => a.localeCompare(b)).map(([name, data]: [string, any]) => {
                        const displayName = name.toUpperCase() === 'SHOOPE' ? 'SHOPEE' : name;
                        return (
                        <div key={name} className="p-6 bg-white/2 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-700 group/market relative overflow-hidden scale-100 hover:scale-[1.02]">
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/market:opacity-100 transition-all translate-x-4 group-hover/market:translate-x-0 flex gap-2">
                                <button 
                                    onClick={() => openEditModal(name, data)}
                                    className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/10"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                    onClick={() => removeMarketplaceChannel(name)}
                                    className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
                                <h3 className="font-black text-white uppercase tracking-[0.1em] truncate text-sm">{displayName}</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="group/metric">
                                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 opacity-60">Comissão Ad-Valorem</label>
                                    <div className="flex items-end gap-1">
                                        <span className="text-xl font-black text-white group-hover/market:text-purple-400 transition-colors">{(data.commission || 0).toFixed(1)}</span>
                                        <span className="text-[10px] font-black text-slate-600 mb-1">%</span>
                                    </div>
                                </div>
                                <div className="group/metric">
                                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1 opacity-60">Fee Fixo por Item</label>
                                    <div className="flex items-end gap-1">
                                        <span className="text-[10px] font-black text-slate-600 mb-1">R$</span>
                                        <span className="text-xl font-black text-white group-hover/market:text-emerald-400 transition-colors">{(data.fixedFee || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})}
                    
                    {Object.keys(settings.finance?.marketplace || {}).length === 0 && (
                        <div className="col-span-full py-16 text-center bg-white/2 border-2 border-dashed border-white/5 rounded-3xl group hover:border-purple-500/20 transition-colors">
                            <Wallet className="mx-auto text-slate-700 group-hover:text-purple-500/50 transition-colors mb-4" size={48} />
                            <p className="text-slate-500 text-xs font-black uppercase tracking-widest italic leading-relaxed">
                                Nenhum canal de venda configurado.<br />
                                <span className="text-slate-600">O sistema usará apenas taxas de balcão.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Marketplace Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="glass-card !p-8 max-w-xl w-full border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                        
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                                    <Wallet className="text-purple-400" size={20} />
                                </div>
                                <h2 className="text-xl font-black text-white tracking-tight">
                                    {editingChannel ? 'Editar Canal' : 'Novo Canal de Venda'}
                                </h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-lg border border-white/10"><X size={18} /></button>
                        </div>

                        <div className="space-y-8">
                            {/* Templates */}
                            {!editingChannel && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Info size={12} className="text-purple-400" />
                                        Templates Sugeridos 2026
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {MARKETPLACE_TEMPLATES.map((t) => (
                                            <button
                                                key={t.name}
                                                onClick={() => applyTemplate(t)}
                                                className="p-3 bg-white/3 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-xl text-left transition-all group/template"
                                            >
                                                <p className="text-[10px] font-black text-white group-hover/template:text-purple-400 transition-colors uppercase tracking-tight">{t.name}</p>
                                                <p className="text-[9px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                                                    {t.commission}% + R$ {t.fixedFee.toFixed(2)}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-6">
                                <div className="group/input">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Marketplace</label>
                                    <input 
                                        type="text" 
                                        value={modalData.name} 
                                        onChange={(e) => setModalData({...modalData, name: e.target.value})} 
                                        className="glass-input !bg-white/3 w-full font-black text-sm" 
                                        placeholder="Ex: Shopee, Magalu..." 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Comissão (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={modalData.commission} 
                                                onChange={(e) => setModalData({...modalData, commission: Number(e.target.value)})} 
                                                className="glass-input !bg-white/3 w-full font-black text-sm pr-10" 
                                            />
                                            <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                        </div>
                                    </div>
                                    <div className="group/input">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fee Fixo (R$)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-xs">R$</span>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                value={modalData.fixedFee} 
                                                onChange={(e) => setModalData({...modalData, fixedFee: Number(e.target.value)})} 
                                                className="glass-input !bg-white/3 w-full font-black text-sm pl-8" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 mt-8 border-t border-white/5">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">Cancelar</button>
                                <button 
                                    onClick={handleSaveChannel}
                                    disabled={!modalData.name}
                                    className="flex-[2] btn-premium !py-4 shadow-purple-500/20"
                                >
                                    {editingChannel ? 'ATUALIZAR CANAL' : 'CONFIRMAR CANAL'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
