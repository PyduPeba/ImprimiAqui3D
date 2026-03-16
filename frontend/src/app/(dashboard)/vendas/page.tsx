"use client";

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Eye,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  RotateCcw,
  Calendar,
  User,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { salesService } from '@/services/sales.service';
import { customersService } from '@/services/customers.service';
import api from '@/lib/api';

export default function VendasPage() {
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    customerId: '',
    startDate: '',
    endDate: '',
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    loadSales();
  }, [filters]);

  const loadCustomers = async () => {
    try {
      const data = await customersService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await salesService.getSales(filters);
      setSales(response.data || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 10,
        totalPages: response.totalPages || 0,
      });
    } catch (err) {
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
      customerId: '',
      startDate: '',
      endDate: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const viewDetails = async (saleId: string) => {
    try {
      const sale = await salesService.getSale(saleId);
      setSelectedSale(sale);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading sale details:', err);
    }
  };

  const generatePdf = async (sale: any) => {
    try {
      const pdfData = {
        id: sale.id,
        customer: sale.customer ? {
          name: sale.customer.name,
          email: sale.customer.email,
          phone: sale.customer.phone,
          document: sale.customer.document,
          address: sale.customer.address,
        } : null,
        items: (sale.items || []).map((item: any) => ({
          name: item.name || item.customName || item.fileName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          weight: item.weight,
          printTime: item.printTime,
          materialName: item.material?.name,
          printerName: item.printer?.name,
          accessories: (item.accessories || []).map((acc: any) => ({
             name: acc.name || acc.accessory?.name,
             quantity: acc.quantity,
             unitPrice: acc.unitPrice
          }))
        })),
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount || 0),
        total: Number(sale.total),
      };

      const response = await api.post('/sales/quote/pdf', pdfData);
      setPdfContent(response.data);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  const handlePrintPdf = () => {
    if (!pdfContent) return;
    const iframe = document.getElementById('pdf-print-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleCancelSale = async (sale: any) => {
    if (!confirm('Tem certeza que deseja cancelar esta venda?')) return;
    try {
      await salesService.cancelSale(sale.id);
      loadSales();
    } catch (err) {
      console.error('Error cancelling sale:', err);
    }
  };

  const statusColors: any = {
    QUOTE: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Orçamento', border: 'border-blue-500/20' },
    PAID: { bg: 'bg-green-500/10', text: 'text-green-400', label: 'Pago', border: 'border-green-500/20' },
    IN_PROGRESS: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'Produção', border: 'border-yellow-500/20' },
    COMPLETED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Concluído', border: 'border-emerald-500/20' },
    CANCELLED: { bg: 'bg-rose-500/10', text: 'text-rose-400', label: 'Cancelado', border: 'border-rose-500/20' },
  };

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-3 uppercase">
             <Clock size={14} />
             Gestão de Operações
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Histórico de Vendas</h1>
          <p className="text-slate-500 mt-2 font-bold">Rastreamento completo de orçamentos e pedidos confirmados.</p>
        </div>
      </div>

      {/* Filters (Bento Style) */}
      <div className="glass-card bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-white/5">
        <div className="flex items-center gap-2 mb-8">
          <Filter size={20} className="text-emerald-500" />
          <h2 className="text-lg font-black text-white tracking-tight">Filtros Avançados</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
               <Calendar size={12} /> Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
               <Calendar size={12} /> Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none transition-all appearance-none"
            >
              <option value="">Todos os Status</option>
              <option value="QUOTE">Orçamento</option>
              <option value="PAID">Pago</option>
              <option value="IN_PROGRESS">Em Produção</option>
              <option value="COMPLETED">Concluído</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
               <User size={12} /> Cliente
            </label>
            <select
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500/50 outline-none transition-all appearance-none"
            >
              <option value="">Todos os Clientes</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>{customer.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full h-[45px] bg-white/5 hover:bg-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5 transition-all"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table (Premium Glass) */}
      <div className="glass-card p-0 overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Código</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</th>
                <th className="px-8 py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando Dados...</span>
                     </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="text-slate-500 font-bold">Nenhuma venda encontrada nos registros.</div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                      {new Date(sale.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-white">{sale.code}</td>
                    <td className="px-8 py-5 text-sm text-slate-300 font-bold">
                      {sale.customer?.name || 'Venda Balcão'}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[sale.status]?.bg} ${statusColors[sale.status]?.text} ${statusColors[sale.status]?.border}`}>
                        {statusColors[sale.status]?.label || sale.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-white text-right">
                      R$ {Number(sale.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-1">
                        {sale.status === 'QUOTE' && (
                          <button
                            onClick={() => router.push(`/caixa?quoteId=${sale.id}`)}
                            className="p-2.5 text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-all"
                            title="Finalizar Venda"
                          >
                            <ShoppingBag size={18} />
                          </button>
                        )}
                        
                        {(sale.status === 'QUOTE' || sale.status === 'CONFIRMED' || sale.status === 'COMPLETED') && (
                          <button
                            onClick={() => handleCancelSale(sale)}
                            className="p-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Cancelar Venda"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}

                        <button
                          onClick={() => viewDetails(sale.id)}
                          className="p-2.5 text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all"
                          title="Ver detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => generatePdf(sale)}
                          className="p-2.5 text-slate-400 hover:bg-white/5 rounded-xl transition-all"
                          title="Gerar PDF"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Premium) */}
        {pagination.totalPages > 1 && (
          <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Páge {pagination.page} de {pagination.totalPages} <span className="mx-2 opacity-20">|</span> {pagination.total} REGISTROS
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal (Glassmorphic) */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Detalhamento Financeiro</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">{selectedSale.code}</div>
                   <div className="w-1 h-1 rounded-full bg-slate-700" />
                   <div className="text-xs text-emerald-400 font-black tracking-widest uppercase">{selectedSale.status}</div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Customer Info */}
              {selectedSale.customer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/5 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                         <User className="text-indigo-400" size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Comprador</p>
                         <h4 className="text-lg font-black text-white tracking-tight">{selectedSale.customer.name}</h4>
                      </div>
                   </div>
                   <div className="flex flex-col justify-center">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificação</p>
                      <h4 className="text-sm font-bold text-slate-300">{selectedSale.customer.email || 'Sem email cadastrado'}</h4>
                   </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <ShoppingBag size={14} /> Itens da Transação
                </h3>
                <div className="space-y-3">
                  {selectedSale.items?.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="font-black text-white text-lg group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                             {item.customName || item.fileName || 'Item Personalizado'}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                             <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">QTD: {item.quantity}</span>
                             <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">PESO: {item.weight}g</span>
                             <span className="text-[9px] font-black bg-white/5 text-slate-400 px-2 py-0.5 rounded border border-white/5">TIME: {item.printTime}m</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-white">R$ {Number(item.unitPrice * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">R$ {Number(item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} unit.</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary (Premium) */}
              <div className="bg-slate-900/50 rounded-2xl p-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <TrendingUp size={120} />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center text-slate-400 font-bold">
                    <span className="text-sm">Subtotal:</span>
                    <span className="text-white">R$ {Number(selectedSale.subtotal || selectedSale.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between items-center text-rose-400 font-black">
                      <span className="text-sm uppercase tracking-widest">Desconto Aplicado:</span>
                      <span>- R$ {Number(selectedSale.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="pt-6 mt-6 border-t border-white/10 flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Montante Final</p>
                        <h4 className="text-4xl font-black text-white tracking-tighter">
                           R$ {Number(selectedSale.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                    </div>
                    <div className="flex gap-3">
                       <button
                         onClick={() => generatePdf(selectedSale)}
                         className="btn-premium h-[45px] text-xs"
                       >
                         <FileText size={16} />
                         PDF
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfContent && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">Visualizador de Documento</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Pré-visualização do Orçamento / Pedido</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrintPdf}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all rounded-xl text-white font-black text-sm shadow-lg shadow-emerald-500/20"
                >
                  <FileText size={18} />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setPdfContent(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 transition-all rounded-xl text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Modal Body (Iframe) */}
            <div className="flex-1 bg-slate-800 p-4">
              <iframe
                id="pdf-print-iframe"
                srcDoc={pdfContent}
                className="w-full h-full bg-white rounded-xl shadow-lg border-none"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
