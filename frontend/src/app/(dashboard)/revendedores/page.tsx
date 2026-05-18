"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Store, 
  Users, 
  Package, 
  DollarSign, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Download,
  ChevronRight,
  TrendingUp,
  Box,
  FileText,
  BarChart3
} from 'lucide-react';
import { resellersService } from '@/services/resellers.service';
import { catalogService } from '@/services/catalog.service';
import toast from 'react-hot-toast';

export default function ResellersPage() {
  const [activeTab, setActiveTab] = useState<'painel' | 'revendedores' | 'relatorio'>('painel');
  const [loading, setLoading] = useState(false);

  // Dados
  const [summaries, setSummaries] = useState<any[]>([]);
  const [resellers, setResellers] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  
  // Modais e Drawers
  const [showResellerModal, setShowResellerModal] = useState(false);
  const [showInventoryDrawer, setShowInventoryDrawer] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  
  // Seleções
  const [selectedReseller, setSelectedReseller] = useState<any>(null);
  const [resellerInventory, setResellerInventory] = useState<any>(null); // from getSummary(id)
  
  // Formulário Revendedor
  const [resellerForm, setResellerForm] = useState({
    id: null as string | null,
    name: '',
    email: '',
    phone: '',
    document: '',
    address: '',
    defaultCommissionPercent: 0,
    bankInfo: '',
    notes: ''
  });

  // Load Data
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'painel') {
        const data = await resellersService.getAllSummary();
        setSummaries(data);
      } else if (activeTab === 'revendedores') {
        const data = await resellersService.getAll();
        setResellers(data);
      } else if (activeTab === 'relatorio') {
        const data = await resellersService.getCommissionReport();
        setReport(data);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── AÇÕES DE REVENDEDOR ──────────────────────────────────
  const openResellerModal = (reseller?: any) => {
    if (reseller) {
      setResellerForm({
        id: reseller.id,
        name: reseller.name,
        email: reseller.email || '',
        phone: reseller.phone || '',
        document: reseller.document || '',
        address: reseller.address || '',
        defaultCommissionPercent: Number(reseller.defaultCommissionPercent) || 0,
        bankInfo: reseller.bankInfo || '',
        notes: reseller.notes || ''
      });
    } else {
      setResellerForm({
        id: null, name: '', email: '', phone: '', document: '', address: '', defaultCommissionPercent: 0, bankInfo: '', notes: ''
      });
    }
    setShowResellerModal(true);
  };

  const handleSaveReseller = async () => {
    setLoading(true);
    try {
      if (resellerForm.id) {
        await resellersService.update(resellerForm.id, resellerForm);
        toast.success('Revendedor atualizado com sucesso!');
      } else {
        await resellersService.create(resellerForm);
        toast.success('Revendedor cadastrado com sucesso!');
      }
      setShowResellerModal(false);
      loadData();
    } catch (err: any) {
      toast.error('Erro ao salvar revendedor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReseller = async (id: string) => {
    if (!confirm('Deseja realmente inativar este revendedor?')) return;
    try {
      await resellersService.deactivate(id);
      toast.success('Revendedor inativado');
      loadData();
    } catch (err: any) {
      toast.error('Erro ao inativar revendedor');
    }
  };

  // ─── AÇÕES DE INVENTÁRIO (DRAWER) ─────────────────────────
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryForm, setInventoryForm] = useState({
    productId: '', quantitySent: 1, unitPrice: 0, commissionPercent: '', notes: ''
  });
  const [showSendProductModal, setShowSendProductModal] = useState(false);
  const [sendProductFilter, setSendProductFilter] = useState({ category: '', search: '' });

  const [actionModal, setActionModal] = useState<{ type: 'sale' | 'return'; itemId: string; max: number; current: number } | null>(null);
  const [actionQty, setActionQty] = useState(1);

  // ESC key to close modals/drawers
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (actionModal) setActionModal(null);
        else if (showSendProductModal) setShowSendProductModal(false);
        else if (showResellerModal) setShowResellerModal(false);
        else if (showInventoryDrawer) setShowInventoryDrawer(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showSendProductModal, showResellerModal, showInventoryDrawer]);

  const openInventoryDrawer = async (reseller: any) => {
    setSelectedReseller(reseller);
    setShowInventoryDrawer(true);
    await loadResellerInventory(reseller.id);
  };

  const loadResellerInventory = async (id: string) => {
    try {
      const data = await resellersService.getSummary(id);
      setResellerInventory(data);
    } catch (err) {
      toast.error('Erro ao carregar inventário do revendedor');
    }
  };

  const handleOpenSendProduct = async () => {
    try {
      const prods = await catalogService.getProducts();
      setProducts(prods);
      setInventoryForm({ productId: '', quantitySent: 1, unitPrice: 0, commissionPercent: '', notes: '' });
      setSendProductFilter({ category: '', search: '' });
      setShowSendProductModal(true);
    } catch (err) {
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleProductSelect = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setInventoryForm(prev => ({
        ...prev,
        productId,
        unitPrice: Number(prod.salePrice) || Number(prod.fixedPrice) || 0,
        commissionPercent: prod.commissionPercent || selectedReseller.defaultCommissionPercent || ''
      }));
    }
  };

  const handleSendProduct = async () => {
    if (!inventoryForm.productId) return toast.error('Selecione um produto');
    setLoading(true);
    try {
      await resellersService.sendProduct(selectedReseller.id, {
        ...inventoryForm,
        commissionPercent: inventoryForm.commissionPercent === '' ? null : Number(inventoryForm.commissionPercent)
      });
      toast.success('Produto enviado ao revendedor!');
      setShowSendProductModal(false);
      await loadResellerInventory(selectedReseller.id);
    } catch (err: any) {
      toast.error('Erro ao enviar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSale = (itemId: string, currentSold: number, inPossession: number) => {
    setActionModal({ type: 'sale', itemId, max: inPossession, current: currentSold });
    setActionQty(1);
  };

  const handleRegisterReturn = (itemId: string, currentReturned: number, inPossession: number) => {
    setActionModal({ type: 'return', itemId, max: inPossession, current: currentReturned });
    setActionQty(1);
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    if (actionQty <= 0 || actionQty > actionModal.max) return toast.error('Quantidade inválida');

    setLoading(true);
    try {
      if (actionModal.type === 'sale') {
        await resellersService.updateInventoryItem(selectedReseller.id, actionModal.itemId, {
          quantitySold: actionModal.current + actionQty
        });
        toast.success('Venda registrada!');
      } else {
        await resellersService.updateInventoryItem(selectedReseller.id, actionModal.itemId, {
          quantityReturned: actionModal.current + actionQty
        });
        toast.success('Devolução registrada!');
      }
      await loadResellerInventory(selectedReseller.id);
      setActionModal(null);
    } catch (err) {
      toast.error('Erro ao registrar ' + (actionModal.type === 'sale' ? 'venda' : 'devolução'));
    } finally {
      setLoading(false);
    }
  };

  // ─── TABS RENDER ──────────────────────────────────────────
  
  const renderPainel = () => {
    const totalInField = summaries.reduce((acc, curr) => acc + curr.totalInPossession, 0);
    const totalCommissions = summaries.reduce((acc, curr) => acc + curr.totalCommission, 0);
    const totalSold = summaries.reduce((acc, curr) => acc + curr.totalSold, 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold text-sm">Revendedores Ativos</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Users size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">{summaries.filter(s => s.isActive).length}</h3>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold text-sm">Produtos em Campo</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Package size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">{totalInField}</h3>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold text-sm">Comissões Projetadas</span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <DollarSign size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">R$ {totalCommissions.toFixed(2)}</h3>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 font-bold text-sm">Unidades Vendidas</span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <TrendingUp size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white">{totalSold}</h3>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-black text-white mb-6">Resumo por Revendedor</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="pb-3 font-black">Revendedor</th>
                  <th className="pb-3 font-black text-center">SKUs c/ Ele</th>
                  <th className="pb-3 font-black text-center">Qtd. em Campo</th>
                  <th className="pb-3 font-black text-center">Qtd. Vendida</th>
                  <th className="pb-3 font-black text-right">Comissão Projetada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {summaries.map(s => (
                  <tr key={s.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => openInventoryDrawer(s)}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500 font-bold">
                          {s.name.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{s.name}</div>
                          <div className="text-slate-500 text-[10px]">{s.email || s.phone || 'Sem contato'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center text-slate-300 font-bold text-sm">{s.productCount}</td>
                    <td className="py-4 text-center text-slate-300 font-bold text-sm">{s.totalInPossession}</td>
                    <td className="py-4 text-center text-emerald-400 font-bold text-sm">{s.totalSold}</td>
                    <td className="py-4 text-right text-amber-400 font-black text-sm">R$ {Number(s.totalCommission).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRevendedores = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar revendedor..." 
              className="glass-input w-full pl-10 py-2 text-sm"
            />
          </div>
          <button onClick={() => openResellerModal()} className="btn-premium py-2 px-4 shadow-emerald-500/20 text-sm h-10">
            <Plus size={16} />
            <span>Novo Revendedor</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resellers.map(r => (
            <div key={r.id} className={`stat-card p-5 group hover:border-emerald-500/30 transition-all cursor-pointer ${!r.isActive ? 'opacity-50' : ''}`} onClick={() => openInventoryDrawer(r)}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-emerald-500 font-black text-lg shadow-lg">
                  {r.name.substring(0,2).toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); openResellerModal(r); }} className="w-8 h-8 flex items-center justify-center bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors">
                    <Edit2 size={14} />
                  </button>
                  {r.isActive && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteReseller(r.id); }} className="w-8 h-8 flex items-center justify-center bg-white/5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <h3 className="text-white font-black text-lg tracking-tight mb-1 truncate">{r.name}</h3>
              <p className="text-slate-400 text-xs font-bold mb-4">{r.phone || r.email || 'Nenhum contato'}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Comissão Padrão</span>
                  <span className="text-emerald-400 font-black text-sm">{r.defaultCommissionPercent}%</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRelatorio = () => {
    if (!report) return <div className="text-slate-500 text-center py-10">Carregando relatório...</div>;
    
    const exportCSV = () => {
      const headers = ['Revendedor', 'Produto', 'SKU', 'Qtd Vendida', 'Preço Unitário', 'Comissão %', 'Valor Comissão', 'Valor Venda', 'Data Envio'];
      const rows = report.rows.map((r: any) => [
        r.resellerName, r.productName, r.productSku || '', r.quantitySold, r.unitPrice, r.commissionPercent, r.commissionValue, r.salesValue, new Date(r.sentAt).toLocaleDateString()
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "comissoes_revendedores.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <div className="stat-card p-4 flex gap-4 min-w-[200px]">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Comissões</span>
                <span className="text-xl font-black text-amber-400">R$ {Number(report.totalCommission).toFixed(2)}</span>
              </div>
            </div>
            <div className="stat-card p-4 flex gap-4 min-w-[200px]">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Vendas Acumuladas</span>
                <span className="text-xl font-black text-emerald-400">R$ {Number(report.totalSales).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button onClick={exportCSV} className="btn-premium py-2 px-4 shadow-emerald-500/20 text-sm h-10">
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/50">
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Data Envio</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Revendedor</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Produto</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center">Vendido</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Comissão</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Vlr. Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {report.rows.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-slate-300">{new Date(r.sentAt).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-white">{r.resellerName}</td>
                  <td className="p-4 text-slate-300">
                    <div>{r.productName}</div>
                    {r.productSku && <div className="text-[10px] text-slate-500">SKU: {r.productSku}</div>}
                  </td>
                  <td className="p-4 text-center font-black text-emerald-400">{r.quantitySold}</td>
                  <td className="p-4 text-right text-slate-400">{r.commissionPercent}%</td>
                  <td className="p-4 text-right font-black text-amber-400">R$ {Number(r.commissionValue).toFixed(2)}</td>
                </tr>
              ))}
              {report.rows.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)] space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-3 uppercase">
             <Store size={14} />
             Parcerias Comerciais
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Gestão de Revendedores</h1>
          <p className="text-slate-500 mt-2 font-bold">Controle de produtos consignados e comissões.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-px">
        {[
          { id: 'painel', label: 'Painel Geral', icon: BarChart3 },
          { id: 'revendedores', label: 'Revendedores', icon: Users },
          { id: 'relatorio', label: 'Relatório de Comissões', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black text-sm uppercase tracking-widest transition-colors ${
              activeTab === tab.id 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-in fade-in duration-500">
        {activeTab === 'painel' && renderPainel()}
        {activeTab === 'revendedores' && renderRevendedores()}
        {activeTab === 'relatorio' && renderRelatorio()}
      </div>

      {/* Modal Novo/Editar Revendedor */}
      {mounted && showResellerModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setShowResellerModal(false)}>
          <div className="glass-card max-w-2xl w-full p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
              <h2 className="text-2xl font-black text-white">{resellerForm.id ? 'Editar Revendedor' : 'Novo Revendedor'}</h2>
              <button onClick={() => setShowResellerModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome / Razão Social</label>
                  <input type="text" value={resellerForm.name} onChange={e => setResellerForm({...resellerForm, name: e.target.value})} className="glass-input w-full font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Telefone</label>
                  <input type="text" value={resellerForm.phone} onChange={e => setResellerForm({...resellerForm, phone: e.target.value})} className="glass-input w-full font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">E-mail</label>
                  <input type="email" value={resellerForm.email} onChange={e => setResellerForm({...resellerForm, email: e.target.value})} className="glass-input w-full font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF / CNPJ</label>
                  <input type="text" value={resellerForm.document} onChange={e => setResellerForm({...resellerForm, document: e.target.value})} className="glass-input w-full font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Comissão Padrão (%)</label>
                  <input type="number" step="0.01" value={resellerForm.defaultCommissionPercent || ''} onChange={e => setResellerForm({...resellerForm, defaultCommissionPercent: Number(e.target.value)})} className="glass-input w-full font-bold text-emerald-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endereço Completo</label>
                  <input type="text" value={resellerForm.address} onChange={e => setResellerForm({...resellerForm, address: e.target.value})} className="glass-input w-full font-bold" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Dados Bancários / PIX</label>
                  <textarea value={resellerForm.bankInfo} onChange={e => setResellerForm({...resellerForm, bankInfo: e.target.value})} className="glass-input w-full font-bold min-h-[80px]" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                <button onClick={() => setShowResellerModal(false)} className="px-6 py-3 rounded-xl bg-white/5 font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-colors">Cancelar</button>
                <button onClick={handleSaveReseller} disabled={loading || !resellerForm.name} className="btn-premium px-8 py-3 shadow-emerald-500/20 disabled:opacity-50">Salvar Revendedor</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Drawer Inventário do Revendedor */}
      {mounted && showInventoryDrawer && resellerInventory && createPortal(
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex justify-end"
          onClick={() => setShowInventoryDrawer(false)}
        >
          <div 
            className="w-full max-w-4xl bg-slate-900 border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Store className="text-emerald-500" />
                  {resellerInventory.reseller.name}
                </h2>
                <p className="text-slate-500 font-bold text-sm mt-1">Gestão de Inventário e Repasses</p>
              </div>
              <button onClick={() => setShowInventoryDrawer(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-lg font-black text-white">Produtos em Campo</h3>
                <button onClick={handleOpenSendProduct} className="btn-premium py-2 px-4 shadow-emerald-500/20 text-sm h-10">
                  <Box size={16} />
                  <span>Enviar Produto</span>
                </button>
              </div>

              <div className="space-y-4">
                {resellerInventory.items.map((item: any) => (
                  <div key={item.id} className="bg-slate-800/50 border border-white/5 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg">{item.product.name}</h4>
                        <div className="text-xs text-slate-500 mt-1">Enviado em: {new Date(item.sentAt).toLocaleDateString()} • {item.effectiveCommissionPercent}% Comissão</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Preço Venda</div>
                        <div className="text-emerald-400 font-black">R$ {Number(item.unitPrice).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="bg-slate-900/50 rounded-xl p-3 border border-white/5 text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase mb-1">Enviados</div>
                        <div className="text-white font-black text-xl">{item.quantitySent}</div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-center">
                        <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">Vendidos</div>
                        <div className="text-emerald-400 font-black text-xl">{item.quantitySold}</div>
                      </div>
                      <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20 text-center">
                        <div className="text-[10px] font-black text-blue-500 uppercase mb-1">Com Eles</div>
                        <div className="text-blue-400 font-black text-xl">{item.inPossession}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                      <div className="text-amber-400 font-black text-sm">
                        Comissão a pagar: R$ {Number(item.commissionValue).toFixed(2)}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRegisterReturn(item.id, item.quantityReturned, item.inPossession)} disabled={item.inPossession <= 0} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors disabled:opacity-50">
                          Devolução
                        </button>
                        <button onClick={() => handleRegisterSale(item.id, item.quantitySold, item.inPossession)} disabled={item.inPossession <= 0} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                          Registrar Venda
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {resellerInventory.items.length === 0 && (
                  <div className="text-center py-10 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    Nenhum produto enviado para este revendedor ainda.
                  </div>
                )}
              </div>
            </div>

            {/* Totalizador Footer */}
            <div className="p-8 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total a Pagar (Comissões Projetadas)</div>
                  <div className="text-3xl font-black text-amber-400">R$ {Number(resellerInventory.totals.totalCommission).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Enviar Produto */}
      {mounted && showSendProductModal && createPortal(
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[210] p-4"
          onClick={() => setShowSendProductModal(false)}
        >
          <div className="glass-card max-w-lg w-full p-0" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Enviar Produto</h2>
              <button onClick={() => setShowSendProductModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Produto do Catálogo</label>
                {/* Category filter */}
                <div className="flex gap-2 mb-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSendProductFilter({ ...sendProductFilter, category: '' })}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      !sendProductFilter.category ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  {[...new Set(products.map(p => p.category?.name).filter(Boolean))].map(catName => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setSendProductFilter({ ...sendProductFilter, category: catName })}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        sendProductFilter.category === catName ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    value={sendProductFilter.search}
                    onChange={(e) => setSendProductFilter({ ...sendProductFilter, search: e.target.value })}
                    placeholder="Buscar produto..."
                    className="w-full bg-slate-900/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/50 outline-none transition-all font-bold"
                  />
                </div>
                <select value={inventoryForm.productId} onChange={e => handleProductSelect(e.target.value)} className="glass-input w-full font-bold">
                  <option value="">Selecione...</option>
                  {products
                    .filter(p => !sendProductFilter.category || p.category?.name === sendProductFilter.category)
                    .filter(p => !sendProductFilter.search || p.name.toLowerCase().includes(sendProductFilter.search.toLowerCase()))
                    .map(p => (
                    <option key={p.id} value={p.id}>{p.name} - (Estoque: {p.stockQuantity})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Quantidade a Enviar</label>
                  <input type="number" min="1" value={inventoryForm.quantitySent} onChange={e => setInventoryForm({...inventoryForm, quantitySent: Number(e.target.value)})} className="glass-input w-full font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Preço de Venda (R$)</label>
                  <input type="number" step="0.01" value={inventoryForm.unitPrice} onChange={e => setInventoryForm({...inventoryForm, unitPrice: Number(e.target.value)})} className="glass-input w-full font-bold text-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Comissão (%) - Vazio usa o padrão</label>
                <input type="number" step="0.01" value={inventoryForm.commissionPercent} onChange={e => setInventoryForm({...inventoryForm, commissionPercent: e.target.value})} className="glass-input w-full font-bold text-indigo-400" placeholder="Padrão do Revendedor/Produto" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowSendProductModal(false)} className="px-4 py-2 rounded-lg bg-white/5 font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
                <button onClick={handleSendProduct} disabled={loading || !inventoryForm.productId} className="btn-premium px-6 py-2 shadow-emerald-500/20 disabled:opacity-50">Confirmar Envio</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Ação (Venda/Devolução) */}
      {mounted && actionModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[220] p-4 animate-in zoom-in-95 duration-200" onClick={() => setActionModal(null)}>
          <div className="glass-card max-w-sm w-full p-6 border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white">
                {actionModal.type === 'sale' ? 'Registrar Venda' : 'Registrar Devolução'}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Quantidade (Máx: {actionModal.max})</label>
                <input 
                  type="number" 
                  min="1" 
                  max={actionModal.max}
                  value={actionQty}
                  onChange={e => setActionQty(Number(e.target.value))}
                  className="glass-input w-full text-2xl font-black text-center" 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-3 rounded-xl bg-white/5 font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleConfirmAction} disabled={loading || actionQty < 1 || actionQty > actionModal.max} className="flex-1 btn-premium px-4 py-3 shadow-emerald-500/20 disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
