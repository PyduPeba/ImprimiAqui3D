"use client";

import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';
import api from '@/lib/api';

type ReportType = 'sales' | 'inventory' | 'production';

export default function RelatoriosPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'sales' as ReportType, label: 'Vendas', icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'inventory' as ReportType, label: 'Estoque', icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { id: 'production' as ReportType, label: 'Produção', icon: Printer, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/reports/${reportType}?${params.toString()}`);
      setReportData(response.data);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    if (!reportData) return;

    let csvContent = '';
    let filename = '';

    if (reportType === 'sales' && reportData.sales) {
      csvContent = 'ID,Código,Data,Cliente,Status,Total,V. Líquido,Itens\n';
      reportData.sales.forEach((sale: any) => {
        csvContent += `"${sale.id}","${sale.code}","${new Date(sale.date).toLocaleDateString('pt-BR')}","${sale.customer}","${sale.status}","${sale.total}","${sale.netValue || ''}","${sale.itemsCount}"\n`;
      });
      filename = `relatorio-vendas-${Date.now()}.csv`;
    } else if (reportType === 'inventory' && reportData.materials) {
      csvContent = 'ID,Nome,Tipo,Cor,Marca,Estoque (g),Mínimo (g),Preço/g,Status\n';
      reportData.materials.forEach((material: any) => {
        csvContent += `"${material.id}","${material.name}","${material.type || ''}","${material.color || ''}","${material.brand || ''}","${material.stockWeight}","${material.minStockAlert}","${material.pricePerGram}","${material.status}"\n`;
      });
      filename = `relatorio-estoque-${Date.now()}.csv`;
    } else if (reportType === 'production' && reportData.jobs) {
      csvContent = 'ID,Data,Impressora,Status,Tempo Estimado\n';
      reportData.jobs.forEach((job: any) => {
        csvContent += `"${job.id}","${new Date(job.date).toLocaleDateString('pt-BR')}","${job.printer}","${job.status}","${job.estimatedTime || ''}"\n`;
      });
      filename = `relatorio-producao-${Date.now()}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const selectedType = reportTypes.find(t => t.id === reportType)!;

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-3 uppercase">
             <FileText size={14} />
             Inteligência Comercial
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Relatórios</h1>
          <p className="text-slate-500 mt-2 font-bold">Extração e análise de dados operacionais e financeiros.</p>
        </div>
        
        <div className="flex gap-3">
          {reportData && (
            <button
              onClick={exportToCsv}
              className="btn-premium from-indigo-500 to-indigo-700 shadow-indigo-500/20"
            >
              <Download size={18} />
              EXPORTAR CSV
            </button>
          )}
        </div>
      </div>

      {/* Grid Layout for Filters and Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Selection Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <Filter size={12} /> Filtros de Categoria
          </div>
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setReportType(type.id);
                setReportData(null);
              }}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left group ${
                reportType === type.id
                  ? `${type.border} ${type.bg} scale-[1.02] shadow-xl`
                  : 'border-white/5 bg-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${reportType === type.id ? 'bg-white/10' : 'bg-white/5'}`}>
                    <type.icon className={reportType === type.id ? type.color : 'text-slate-500'} size={24} />
                  </div>
                  <div>
                    <div className={`font-black tracking-tight ${reportType === type.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
                      {type.label}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Analytics</div>
                  </div>
                </div>
                {reportType === type.id && <ChevronRight className="text-white/20" size={18} />}
              </div>
            </button>
          ))}
        </div>

        {/* Date Filter & Generator */}
        <div className="lg:col-span-3">
           <div className="glass-card bg-gradient-to-br from-slate-800/40 to-slate-900/40">
              <div className="flex items-center gap-2 mb-8">
                <Calendar size={20} className="text-emerald-500" />
                <h2 className="text-lg font-black text-white tracking-tight">Defina o Período</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data Inicial</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data Final</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all duration-300"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={generateReport}
                    disabled={loading}
                    className="btn-premium w-full h-[50px] uppercase tracking-widest text-xs"
                  >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FileText size={18} />
                        GERAR RELATÓRIO
                      </>
                    )}
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Summary KPIs */}
          {reportData.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(reportData.summary).map(([key, value]: [string, any]) => {
                if (typeof value === 'object') return null;
                const isCurrency = ['revenue', 'value', 'cost', 'profit', 'ticket'].some(k => key.toLowerCase().includes(k));
                const isProfit = key.toLowerCase().includes('profit');
                
                return (
                  <div key={key} className="stat-card">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                       {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <h3 className={`text-2xl font-black ${isProfit ? 'text-emerald-400' : 'text-white'}`}>
                      {isCurrency && typeof value === 'number'
                        ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : key.toLowerCase().includes('margin') ? `${value}%` : value}
                    </h3>
                  </div>
                );
              })}
            </div>
          )}

          {/* Data Table */}
          <div className="glass-card p-0 overflow-hidden border-white/5">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
               <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${selectedType.color.replace('text-', 'bg-')}`} />
                  Extração Detalhada - {selectedType.label}
               </h2>
               <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {reportData[reportType]?.length || 0} REGISTROS ENCONTRADOS
               </div>
            </div>

            <div className="overflow-x-auto">
              {reportType === 'sales' && reportData.sales && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Líquido</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.sales.map((sale: any) => (
                      <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-4 text-sm font-black text-white">{sale.code}</td>
                        <td className="px-8 py-4 text-sm text-slate-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-8 py-4 text-sm text-slate-300 font-bold">{sale.customer}</td>
                        <td className="px-8 py-4">
                           <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">
                              {sale.status}
                           </span>
                        </td>
                        <td className="px-8 py-4 text-sm font-black text-emerald-400 text-right">R$ {sale.netValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-8 py-4 text-sm font-black text-white text-right">R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'inventory' && reportData.materials && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Cor</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Estoque</th>
                      <th className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.materials.map((material: any) => (
                      <tr key={material.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-sm font-black text-white">{material.name}</td>
                        <td className="px-8 py-4 text-sm text-slate-400">{material.type || '-'}</td>
                        <td className="px-8 py-4 text-sm text-slate-400">{material.color || '-'}</td>
                        <td className="px-8 py-4 text-sm text-white font-black text-right">{material.stockWeight.toLocaleString('pt-BR')}g</td>
                        <td className="px-8 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                            material.status === 'LOW' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {material.status === 'LOW' ? 'Crítico' : 'Saudável'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'production' && reportData.jobs && (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-900/50">
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Impressora</th>
                      <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Tempo Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportData.jobs.map((job: any) => (
                      <tr key={job.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-sm text-slate-400">{new Date(job.date).toLocaleDateString('pt-BR')}</td>
                        <td className="px-8 py-4 text-sm font-black text-white">{job.printer}</td>
                        <td className="px-8 py-4">
                           <span className="text-[10px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-widest">
                              {job.status}
                           </span>
                        </td>
                        <td className="px-8 py-4 text-sm text-white font-black text-right">{job.estimatedTime || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="glass-card p-24 text-center bg-gradient-to-b from-slate-800/20 to-transparent border-dashed">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
             <FileText className="text-slate-600" size={40} />
          </div>
          <h3 className="text-xl font-black text-white mb-2">Aguardando Parâmetros</h3>
          <p className="text-slate-500 max-w-sm mx-auto font-medium">Selecione o tipo de relatório e o período desejado para processar os dados.</p>
        </div>
      )}
    </div>
  );
}
