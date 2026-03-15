"use client";

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  DollarSign, 
  Zap, 
  AlertCircle,
  TrendingUp,
  Clock,
  Calendar
} from 'lucide-react';
import { productionService } from '@/services/production.service';

export default function PrintersConfigPage() {
  const [printers, setPrinters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null as string | null,
    name: '',
    brand: '',
    model: '',
    acquisitionValue: 0,
    returnPeriodMonths: 12,
    workHoursPerDay: 12,
    workDaysPerMonth: 22,
    powerConsumptionKw: 0.35,
    usageLevel: 'MEDIO',
    failureRate: 0.05,
    profitMargin: 1.30,
    hourlyRate: 5.00,
  });

  useEffect(() => {
    loadPrinters();
  }, []);

  const loadPrinters = async () => {
    try {
      const data = await productionService.getPrinters();
      setPrinters(data);
    } catch (err) {
      console.error('Error loading printers:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.id) {
        await productionService.updatePrinter(formData.id, formData);
      } else {
        const { id, ...createData } = formData;
        await productionService.createPrinter(createData);
      }
      await loadPrinters();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving printer:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (printer?: any) => {
    if (printer) {
      setFormData({
        id: printer.id,
        name: printer.name,
        brand: printer.brand || '',
        model: printer.model || '',
        acquisitionValue: Number(printer.acquisitionValue),
        returnPeriodMonths: Number(printer.returnPeriodMonths),
        workHoursPerDay: Number(printer.workHoursPerDay),
        workDaysPerMonth: Number(printer.workDaysPerMonth),
        powerConsumptionKw: Number(printer.powerConsumptionKw),
        usageLevel: printer.usageLevel,
        failureRate: Number(printer.failureRate),
        profitMargin: Number(printer.profitMargin) || 1.30,
        hourlyRate: Number(printer.hourlyRate) || 5.00,
      });
    } else {
      setFormData({
        id: null,
        name: '',
        brand: '',
        model: '',
        acquisitionValue: 0,
        returnPeriodMonths: 12,
        workHoursPerDay: 12,
        workDaysPerMonth: 22,
        powerConsumptionKw: 0.35,
        usageLevel: 'MEDIO',
        failureRate: 0.05,
        profitMargin: 1.30,
        hourlyRate: 5.00,
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta impressora?')) return;
    try {
      await productionService.deletePrinter(id);
      await loadPrinters();
    } catch (err) {
      console.error('Error deleting printer:', err);
    }
  };

  const calculateHourCost = (printer: any) => {
    const monthlyInvestment = Number(printer.acquisitionValue) / Number(printer.returnPeriodMonths);
    const monthlyHours = Number(printer.workHoursPerDay) * Number(printer.workDaysPerMonth);
    return monthlyHours > 0 ? (monthlyInvestment / monthlyHours).toFixed(2) : "0.00";
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">Modelos de Impressoras</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] ml-1">Configuração de Parâmetros Técnicos e Financeiros</p>
        </div>
        <button onClick={() => openModal()} className="btn-premium !py-3 !px-6 shadow-emerald-500/10 scale-105 hover:scale-110">
          <Plus size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Nova Máquina</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {printers.map((printer) => (
          <div key={printer.id} className="glass-card !p-0 border-white/5 shadow-2xl overflow-hidden group/card hover:border-emerald-500/30 transition-all duration-700 relative">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none group-hover/card:bg-emerald-500/10 transition-colors duration-700" />
             
             {/* Card Top */}
             <div className="p-8 border-b border-white/5 relative z-10">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner group-hover/card:border-emerald-500/40 transition-all duration-500 transform group-hover/card:rotate-3">
                         <Printer size={28} />
                      </div>
                      <div>
                         <h3 className="text-xl font-black text-white tracking-tight leading-none mb-2">{printer.name}</h3>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded-md border border-white/5">{printer.brand}</span>
                            <span className="text-[9px] font-black text-emerald-500/80 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/10">{printer.model || 'Padrão V2.0'}</span>
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-2 opacity-30 group-hover/card:opacity-100 transition-all duration-500">
                      <button onClick={() => openModal(printer)} className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-transparent hover:border-emerald-500/20 transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(printer.id)} className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-transparent hover:border-rose-500/20 transition-all"><Trash2 size={18} /></button>
                   </div>
                </div>
             </div>

             {/* Metric DASHBOARD */}
             <div className="grid grid-cols-3 gap-0 border-b border-white/5 bg-white/2 relative z-10 transition-colors group-hover/card:bg-white/3">
                <div className="p-6 flex flex-col items-center border-r border-white/5 group/metric">
                   <DollarSign className="text-slate-500 mb-2 group-hover/metric:text-emerald-400 transition-colors" size={16} />
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Custo/Hora Maq.</p>
                   <p className="text-lg font-black text-white group-hover/metric:scale-110 transition-transform">R$ {calculateHourCost(printer)}</p>
                </div>
                <div className="p-6 flex flex-col items-center border-r border-white/5 group/metric">
                   <Zap className="text-slate-500 mb-2 group-hover/metric:text-yellow-400 transition-colors" size={16} />
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Potência nominal</p>
                   <p className="text-lg font-black text-white group-hover/metric:scale-110 transition-transform">{printer.powerConsumptionKw} Kw</p>
                </div>
                <div className="p-6 flex flex-col items-center group/metric">
                   <AlertCircle className="text-slate-500 mb-2 group-hover/metric:text-rose-400 transition-colors" size={16} />
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-60">Taxa de Falha</p>
                   <p className="text-lg font-black text-rose-500/80 group-hover/metric:scale-110 transition-transform">{(Number(printer.failureRate) * 100).toFixed(0)}%</p>
                </div>
             </div>

             {/* Bottom Details */}
             <div className="p-8 grid grid-cols-2 gap-10 relative z-10">
                <div className="space-y-4">
                   <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-emerald-400/50" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Uso Mensal</span>
                      </div>
                      <span className="text-[10px] font-black text-white group-hover/item:text-emerald-400 transition-colors">{printer.workDaysPerMonth} Dias</span>
                   </div>
                   <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-emerald-400/50" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Carga Diária</span>
                      </div>
                      <span className="text-[10px] font-black text-white group-hover/item:text-emerald-400 transition-colors">{printer.workHoursPerDay}h</span>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-2">
                        <TrendingUp size={12} className="text-blue-400/50" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ciclo de Uso</span>
                      </div>
                      <span className="bg-white/5 border border-white/10 text-slate-300 font-black px-2 py-0.5 rounded-md text-[8px] uppercase tracking-tighter group-hover/item:bg-emerald-500/10 group-hover/item:text-emerald-400 group-hover/item:border-emerald-500/20 transition-all">{printer.usageLevel}</span>
                   </div>
                   <div className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={12} className="text-purple-400/50" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ROI Previsto</span>
                      </div>
                      <span className="text-[10px] font-black text-white group-hover/item:text-emerald-400 transition-colors">{printer.returnPeriodMonths} Meses</span>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card !p-8 max-w-2xl w-full border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-500">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/5 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                   <Printer className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">{formData.id ? 'Ficha Técnica' : 'Cadastrar Máquina'}</h2>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">Parâmetros de Produção Industrial</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
               {/* Identificação */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> Identificação Técnica
                  </h4>
                  <div className="space-y-4">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome Comercial</label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="glass-input !bg-white/3 w-full font-black text-sm" placeholder="Ex: Ender 3 S1 Pro" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Marca</label>
                        <input type="text" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} className="glass-input !bg-white/3 w-full font-black text-xs" placeholder="Ex: Creality" />
                      </div>
                      <div className="group/input">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Ciclo de Uso</label>
                        <select value={formData.usageLevel} onChange={(e) => setFormData({...formData, usageLevel: e.target.value})} className="glass-input !bg-white/3 w-full font-black text-[10px] uppercase tracking-tighter">
                           <option value="PROFISSIONAL">Profissional</option>
                           <option value="MEDIO">Médio</option>
                           <option value="INTENSO">Intenso</option>
                        </select>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Financeiro */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> Parâmetros Financeiros
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Vlr. Aquisição</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-[10px]">R$</span>
                        <input type="number" value={formData.acquisitionValue} onChange={(e) => setFormData({...formData, acquisitionValue: Number(e.target.value)})} className="glass-input !bg-white/3 w-full font-black text-sm pl-8" />
                      </div>
                    </div>
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Payback (Meses)</label>
                      <input type="number" value={formData.returnPeriodMonths} onChange={(e) => setFormData({...formData, returnPeriodMonths: Number(e.target.value)})} className="glass-input !bg-white/3 w-full font-black text-sm" />
                    </div>
                  </div>
                  <div className="group/input">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Consumo (Kw/h Nominal)</label>
                    <div className="relative">
                      <Zap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                      <input type="number" step="0.01" value={formData.powerConsumptionKw} onChange={(e) => setFormData({...formData, powerConsumptionKw: Number(e.target.value)})} className="glass-input !bg-white/3 w-full font-black text-sm pl-9" />
                    </div>
                  </div>
               </div>

               {/* Operacional */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> Capacidade Operacional
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Carga Horária (Dia)</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input type="number" value={formData.workHoursPerDay} onChange={(e) => setFormData({...formData, workHoursPerDay: Number(e.target.value)})} className="glass-input !bg-white/3 w-full font-black text-sm pl-8" />
                      </div>
                    </div>
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Dias Lab. (Mês)</label>
                      <div className="relative">
                         <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input type="number" value={formData.workDaysPerMonth} onChange={(e) => setFormData({...formData, workDaysPerMonth: Number(e.target.value)})} className="glass-input !bg-white/3 w-full font-black text-sm pl-8" />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Precificação */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" /> Algoritmo de Preço
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Markup (Margem)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.profitMargin} 
                        onChange={(e) => setFormData({...formData, profitMargin: Number(e.target.value)})} 
                        className="glass-input !bg-blue-500/5 !border-blue-500/20 w-full font-black text-sm text-blue-400" 
                      />
                      <p className="text-[9px] text-slate-500 font-bold mt-2 ml-1 leading-relaxed uppercase tracking-tighter italic">
                        * Multiplicador de custo. Ex: <span className="text-blue-400">1.30</span> = 30% de margem.
                      </p>
                    </div>
                    <div className="group/input">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Custo/Hora Final</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-[10px]">R$</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={formData.hourlyRate} 
                          onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})} 
                          className="glass-input !bg-emerald-500/5 !border-emerald-500/20 w-full font-black text-sm text-emerald-400 pl-8" 
                        />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="col-span-full pt-10 mt-10 border-t border-white/5 flex gap-4">
                  <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">Descartar</button>
                  <button onClick={handleSave} disabled={loading || !formData.name} className="flex-[2] btn-premium !py-4 shadow-emerald-500/20">{loading ? 'PROCESSANDO...' : 'CONFIRMAR DOWNLOAD DADOS'}</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
