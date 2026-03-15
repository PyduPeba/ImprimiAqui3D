"use client";

import React, { useState, useEffect } from 'react';
import { 
    Wrench, 
    History, 
    Settings, 
    CheckCircle2, 
    AlertTriangle,
    Plus,
    Calendar,
    User,
    DollarSign,
    Loader2
} from 'lucide-react';
import { productionService } from '@/services/production.service';
import { toast } from 'react-hot-toast';

export function MaintenanceTab() {
    const [printers, setPrinters] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedPrinter, setSelectedPrinter] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const [newLog, setNewLog] = useState({
        printerId: '',
        description: '',
        cost: 0,
        performedBy: '',
        date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [printersData, logsData] = await Promise.all([
                productionService.getPrinters(),
                productionService.getMaintenanceLogs()
            ]);
            setPrinters(printersData);
            setLogs(logsData);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados de manutenção');
        } finally {
            setLoading(false);
        }
    };

    const handleLogMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await productionService.createMaintenanceLog(newLog);
            toast.success('Manutenção registrada com sucesso!');
            setShowModal(false);
            loadData();
            setNewLog({
                printerId: '',
                description: '',
                cost: 0,
                performedBy: '',
                date: new Date().toISOString().split('T')[0]
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao registrar manutenção');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-slate-500 font-bold animate-pulse">Carregando telemetria das máquinas...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Health View */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {printers.map((printer) => {
                    const usage = printer.lastMaintenanceTimeMinutes || 0;
                    const interval = printer.maintenanceIntervalMinutes || 30000;
                    const percent = Math.min(100, (usage / interval) * 100);
                    const isUrgent = percent >= 90;
                    const isWarning = percent >= 75 && percent < 90;

                    return (
                        <div key={printer.id} className={`card ${isUrgent ? 'border-rose-200 bg-rose-50/30' : 'bg-white'}`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${isUrgent ? 'bg-rose-100 text-rose-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        <Wrench size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">{printer.name}</h3>
                                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1 group">
                                             Total: {(printer.totalPrintTimeMinutes / 60).toFixed(1)}h acumuladas
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setNewLog(prev => ({ ...prev, printerId: printer.id }));
                                        setShowModal(true);
                                    }}
                                    className="p-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2"
                                >
                                    <Plus size={14} /> Logar Manutenção
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className={isUrgent ? 'text-rose-600' : 'text-slate-500'}>
                                        {isUrgent ? '⚠️ Manutenção Urgente!' : isWarning ? 'Atencão necessária' : 'Status: Operacional'}
                                    </span>
                                    <span>{(usage / 60).toFixed(0)}h / {(interval/60).toFixed(0)}h</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full border border-slate-200 overflow-hidden p-0.5">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* History Table */}
            <div className="card bg-white overflow-hidden p-0 border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest text-sm">
                        <History size={18} className="text-slate-400" />
                        Histórico de Manutenções
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Impressora</th>
                                <th className="px-6 py-4">Descrição</th>
                                <th className="px-6 py-4">Responsável</th>
                                <th className="px-6 py-4 text-right">Custo (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                            <Calendar size={14} className="text-slate-300" />
                                            {new Date(log.date).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-black text-slate-900 uppercase">{log.printer?.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-slate-500 font-medium max-w-xs">{log.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <User size={14} className="text-slate-300" />
                                            {log.performedBy || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-black text-slate-900">R$ {Number(log.cost).toFixed(2)}</span>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <History size={40} className="mb-2 opacity-20" />
                                            <p className="text-sm font-bold">Nenhum registro de manutenção encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <form onSubmit={handleLogMaintenance} className="p-8">
                            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                <Wrench className="text-emerald-500" />
                                Registrar Manutenção
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impressora</label>
                                    <select 
                                        required
                                        value={newLog.printerId}
                                        onChange={e => setNewLog(prev => ({ ...prev, printerId: e.target.value }))}
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="">Selecione a máquina</option>
                                        {printers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição do Serviço</label>
                                    <textarea 
                                        required
                                        value={newLog.description}
                                        onChange={e => setNewLog(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Ex: Troca do bico 0.4 hardened steel, limpeza dos eixos."
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo (R$)</label>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                type="number"
                                                step="0.01"
                                                value={newLog.cost}
                                                onChange={e => setNewLog(prev => ({ ...prev, cost: Number(e.target.value) }))}
                                                className="w-full bg-slate-50 border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</label>
                                        <input 
                                            type="date"
                                            required
                                            value={newLog.date}
                                            onChange={e => setNewLog(prev => ({ ...prev, date: e.target.value }))}
                                            className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsável / Técnico</label>
                                    <input 
                                        type="text"
                                        value={newLog.performedBy}
                                        onChange={e => setNewLog(prev => ({ ...prev, performedBy: e.target.value }))}
                                        placeholder="Nome do técnico"
                                        className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-500 rounded-2xl py-3 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-emerald-500 text-white rounded-2xl py-3 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Finalizar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
