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
  BarChart3,
  Calendar,
  Filter,
  Printer,
  RefreshCw,
  ArrowUpRight,
  Tag
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

  // Filtros do Relatório
  const [reportFilters, setReportFilters] = useState({
    resellerName: '',
    product: '',
    startDate: '',
    endDate: '',
    status: '', // 'with_sales' | 'no_sales' | ''
    category: '',
  });
  const [allResellersForFilter, setAllResellersForFilter] = useState<any[]>([]);
  
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

  // Always load resellers for filter dropdown
  useEffect(() => {
    resellersService.getAll().then(setAllResellersForFilter).catch(() => {});
  }, []);

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

  const resetReportFilters = () => {
    setReportFilters({ resellerName: '', product: '', startDate: '', endDate: '', status: '', category: '' });
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

  const [settlementModal, setSettlementModal] = useState<{
    itemId: string;
    productName: string;
    inPossession: number;
    currentSold: number;
    currentReturned: number;
    unitPrice: number;
    commissionPercent: number;
  } | null>(null);
  const [settlementForm, setSettlementForm] = useState({ sold: 0, returned: 0 });

  // ESC key to close modals/drawers
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settlementModal) setSettlementModal(null);
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
      
      // Atualiza catálogo no frontend para refletir estoque
      const prods = await catalogService.getProducts();
      setProducts(prods);

    } catch (err: any) {
      toast.error('Erro ao enviar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettlement = (item: any) => {
    setSettlementModal({
      itemId: item.id,
      productName: item.product.name,
      inPossession: item.inPossession,
      currentSold: item.quantitySold,
      currentReturned: item.quantityReturned,
      unitPrice: Number(item.unitPrice),
      commissionPercent: Number(item.effectiveCommissionPercent)
    });
    setSettlementForm({ sold: 0, returned: 0 });
  };

  const handleConfirmSettlement = async () => {
    if (!settlementModal) return;
    const totalSelected = settlementForm.sold + settlementForm.returned;
    if (totalSelected <= 0 || totalSelected > settlementModal.inPossession) {
      return toast.error('A soma de vendidos e devolvidos não pode exceder o total em posse.');
    }

    setLoading(true);
    try {
      await resellersService.updateInventoryItem(selectedReseller.id, settlementModal.itemId, {
        quantitySold: settlementModal.currentSold + settlementForm.sold,
        quantityReturned: settlementModal.currentReturned + settlementForm.returned
      });
      toast.success('Acerto registrado com sucesso!');
      await loadResellerInventory(selectedReseller.id);
      setSettlementModal(null);
    } catch (err) {
      toast.error('Erro ao registrar acerto');
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
    // Client-side filters
    const filteredRows = (report?.rows || []).filter((r: any) => {
      // Nome do Revendedor
      if (reportFilters.resellerName && !r.resellerName?.toLowerCase().includes(reportFilters.resellerName.toLowerCase())) return false;
      // Nome do Produto
      if (reportFilters.product && !r.productName?.toLowerCase().includes(reportFilters.product.toLowerCase())) return false;
      // Categoria
      if (reportFilters.category && r.categoryName !== reportFilters.category) return false;
      // Status de Vendas
      if (reportFilters.status === 'with_sales' && r.quantitySold <= 0) return false;
      if (reportFilters.status === 'no_sales' && r.quantitySold > 0) return false;
      // Data de Início
      if (reportFilters.startDate) {
        const itemDate = new Date(r.sentAt).getTime();
        const startDate = new Date(`${reportFilters.startDate}T00:00:00`).getTime();
        if (itemDate < startDate) return false;
      }
      // Data de Fim
      if (reportFilters.endDate) {
        const itemDate = new Date(r.sentAt).getTime();
        const endDate = new Date(`${reportFilters.endDate}T23:59:59`).getTime();
        if (itemDate > endDate) return false;
      }
      return true;
    });

    const filteredCommission = filteredRows.reduce((s: number, r: any) => s + Number(r.commissionValue), 0);
    const filteredSales = filteredRows.reduce((s: number, r: any) => s + Number(r.salesValue), 0);
    const filteredSold = filteredRows.reduce((s: number, r: any) => s + Number(r.quantitySold), 0);
    const filteredInPossession = filteredRows.reduce((s: number, r: any) => s + Number(r.quantityInPossession), 0);

    const uniqueCategories = [...new Set((report?.rows || []).map((r: any) => r.categoryName).filter(Boolean))] as string[];

    const exportCSV = () => {
      const headers = ['Data Envio','Revendedor','Produto','SKU','Categoria','Enviados','Vendidos','Devolvidos','Em Posse','Preço Unit.','Comissão %','Vlr. Comissão','Vlr. Venda'];
      const rows = filteredRows.map((r: any) => [
        new Date(r.sentAt).toLocaleDateString('pt-BR'), r.resellerName, r.productName,
        r.productSku||'', r.categoryName||'', r.quantitySent, r.quantitySold,
        r.quantityReturned, r.quantityInPossession, Number(r.unitPrice).toFixed(2),
        r.commissionPercent, Number(r.commissionValue).toFixed(2), Number(r.salesValue).toFixed(2)
      ]);
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map((e: any[]) => e.join(';'))].join('\n');
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `comissoes_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const exportPDF = () => {
      const dateLabel = reportFilters.startDate && reportFilters.endDate
        ? `${new Date(`${reportFilters.startDate}T00:00:00`).toLocaleDateString('pt-BR')} até ${new Date(`${reportFilters.endDate}T00:00:00`).toLocaleDateString('pt-BR')}`
        : 'Todos os períodos';
      const resellerLabel = reportFilters.resellerName
        ? `Buscando: ${reportFilters.resellerName}`
        : 'Todos os revendedores';

      const rowsHtml = filteredRows.map((r: any) => `
        <tr>
          <td>${new Date(r.sentAt).toLocaleDateString('pt-BR')}</td>
          <td><strong>${r.resellerName}</strong></td>
          <td>${r.productName}${r.productSku ? `<br><small>${r.productSku}</small>` : ''}</td>
          <td>${r.categoryName||'—'}</td>
          <td style="text-align:center">${r.quantitySent}</td>
          <td style="text-align:center;color:#10b981"><strong>${r.quantitySold}</strong></td>
          <td style="text-align:center">${r.quantityReturned}</td>
          <td style="text-align:center">${r.quantityInPossession}</td>
          <td style="text-align:right">R$ ${Number(r.unitPrice).toFixed(2)}</td>
          <td style="text-align:center">${r.commissionPercent}%</td>
          <td style="text-align:right;color:#f59e0b"><strong>R$ ${Number(r.commissionValue).toFixed(2)}</strong></td>
        </tr>`).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório de Comissões</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:11px;color:#1e293b;margin:0;padding:20px}
        h1{font-size:20px;margin:0 0 4px}
        .meta{color:#64748b;font-size:11px;margin-bottom:20px}
        .kpis{display:flex;gap:12px;margin-bottom:20px}
        .kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;flex:1}
        .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;font-weight:700}
        .kpi-val{font-size:18px;font-weight:900;margin-top:2px}
        .kpi-val.green{color:#10b981}.kpi-val.amber{color:#f59e0b}.kpi-val.blue{color:#3b82f6}
        table{width:100%;border-collapse:collapse}
        th{background:#0f172a;color:#fff;padding:8px 10px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
        td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
        tr:nth-child(even){background:#f8fafc}
        small{color:#94a3b8}
        .footer{margin-top:20px;font-size:9px;color:#94a3b8;text-align:right}
      </style></head><body>
      <h1>Relatório de Comissões — ImprimiAqui3D</h1>
      <div class="meta">Período: ${dateLabel} &nbsp;|&nbsp; Revendedor: ${resellerLabel} &nbsp;|&nbsp; Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
      <div class="kpis">
        <div class="kpi"><div class="kpi-label">Total Vendas</div><div class="kpi-val green">R$ ${filteredSales.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Total Comissões</div><div class="kpi-val amber">R$ ${filteredCommission.toFixed(2)}</div></div>
        <div class="kpi"><div class="kpi-label">Unidades Vendidas</div><div class="kpi-val blue">${filteredSold}</div></div>
        <div class="kpi"><div class="kpi-label">Em Posse</div><div class="kpi-val">${filteredInPossession}</div></div>
      </div>
      <table><thead><tr>
        <th>Data</th><th>Revendedor</th><th>Produto</th><th>Categoria</th>
        <th>Env.</th><th>Vend.</th><th>Dev.</th><th>Posse</th>
        <th>Preço</th><th>Comis.</th><th>Vlr. Comis.</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="footer">ImprimiAqui3D • Relatório gerado automaticamente</div>
      </body></html>`;

      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); win.print(); }
    };

    return (
      <div className="space-y-6">
        {/* Filter Panel */}
        <div className="glass-card p-5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros do Relatório (Tempo Real)</span>
            </div>
            <button onClick={resetReportFilters} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors">
              <RefreshCw size={12} /><span>Limpar Filtros</span>
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Revendedor */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Revendedor</label>
              <input type="text" placeholder="Buscar por nome..." value={reportFilters.resellerName} onChange={e => setReportFilters(p => ({...p, resellerName: e.target.value}))} className="glass-input w-full text-xs py-2" />
            </div>
            {/* Produto */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Produto</label>
              <input type="text" placeholder="Buscar produto..." value={reportFilters.product} onChange={e => setReportFilters(p => ({...p, product: e.target.value}))} className="glass-input w-full text-xs py-2" />
            </div>
            {/* Categoria */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Categoria</label>
              <select value={reportFilters.category} onChange={e => setReportFilters(p => ({...p, category: e.target.value}))} className="glass-input w-full text-xs py-2">
                <option value="">Todas</option>
                {uniqueCategories.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Status */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</label>
              <select value={reportFilters.status} onChange={e => setReportFilters(p => ({...p, status: e.target.value}))} className="glass-input w-full text-xs py-2">
                <option value="">Todos</option>
                <option value="with_sales">Com Vendas</option>
                <option value="no_sales">Sem Vendas</option>
              </select>
            </div>
            {/* Data início */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Início</label>
              <input type="date" value={reportFilters.startDate} onChange={e => setReportFilters(p => ({...p, startDate: e.target.value}))} className="glass-input w-full text-xs py-2" />
            </div>
            {/* Data Fim */}
            <div className="lg:col-span-1">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Data Fim</label>
              <input type="date" value={reportFilters.endDate} onChange={e => setReportFilters(p => ({...p, endDate: e.target.value}))} className="glass-input w-full text-xs py-2" />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card p-5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Total Vendas</span>
            <span className="text-2xl font-black text-emerald-400">R$ {filteredSales.toFixed(2)}</span>
            <div className="text-[9px] text-slate-600 font-bold mt-1">{filteredRows.length} registros</div>
          </div>
          <div className="stat-card p-5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Total Comissões</span>
            <span className="text-2xl font-black text-amber-400">R$ {filteredCommission.toFixed(2)}</span>
            <div className="text-[9px] text-slate-600 font-bold mt-1">a pagar aos revendedores</div>
          </div>
          <div className="stat-card p-5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Unidades Vendidas</span>
            <span className="text-2xl font-black text-blue-400">{filteredSold}</span>
            <div className="text-[9px] text-slate-600 font-bold mt-1">no período selecionado</div>
          </div>
          <div className="stat-card p-5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Em Posse dos Revend.</span>
            <span className="text-2xl font-black text-slate-300">{filteredInPossession}</span>
            <div className="text-[9px] text-slate-600 font-bold mt-1">unidades em campo</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors border border-white/10">
            <Download size={14} /><span>Exportar CSV</span>
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors border border-rose-500/20">
            <Printer size={14} /><span>Exportar PDF / Imprimir</span>
          </button>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-slate-900/50">
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Data</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Revendedor</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Produto</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center">Env.</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center">Vend.</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center">Posse</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Vlr. Venda</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Comis.</th>
                <th className="p-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Vlr. Comis.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRows.map((r: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-slate-400 text-xs">{new Date(r.sentAt).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-bold text-white">{r.resellerName}</td>
                  <td className="p-4 text-slate-300">
                    <div className="font-bold">{r.productName}</div>
                    <div className="flex gap-2 mt-0.5">
                      {r.productSku && <span className="text-[9px] text-slate-600">SKU: {r.productSku}</span>}
                      {r.categoryName && <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{r.categoryName}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center text-slate-400">{r.quantitySent}</td>
                  <td className="p-4 text-center font-black text-emerald-400">{r.quantitySold}</td>
                  <td className="p-4 text-center text-blue-400">{r.quantityInPossession}</td>
                  <td className="p-4 text-right text-slate-300">R$ {Number(r.salesValue).toFixed(2)}</td>
                  <td className="p-4 text-right text-slate-400">{r.commissionPercent}%</td>
                  <td className="p-4 text-right font-black text-amber-400">R$ {Number(r.commissionValue).toFixed(2)}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-slate-500">Nenhum registro encontrado para os filtros selecionados.</td></tr>
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
                      <div>
                        <button onClick={() => handleOpenSettlement(item)} disabled={item.inPossession <= 0} className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:shadow-none">
                          Acerto de Estoque
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

      {/* Modal de Ação (Venda/Devolução -> Acerto) */}
      {mounted && settlementModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[220] p-4 animate-in zoom-in-95 duration-200" onClick={() => setSettlementModal(null)}>
          <div className="glass-card max-w-md w-full p-8 border-amber-500/20 shadow-[0_0_80px_rgba(245,158,11,0.1)]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
              <h3 className="text-2xl font-black text-white">Acerto de Estoque</h3>
              <button onClick={() => setSettlementModal(null)} className="text-slate-400 hover:text-white transition-colors bg-white/5 w-8 h-8 flex items-center justify-center rounded-lg"><X size={20}/></button>
            </div>
            
            <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-white/5">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Produto</div>
              <div className="text-lg font-black text-white">{settlementModal.productName}</div>
              <div className="mt-2 flex justify-between">
                <div>
                  <div className="text-[9px] font-black text-slate-500 uppercase">Em Posse</div>
                  <div className="text-amber-400 font-black">{settlementModal.inPossession} un.</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black text-slate-500 uppercase">Comissão</div>
                  <div className="text-emerald-400 font-black">{settlementModal.commissionPercent}%</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 text-center">Devolvidos</label>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setSettlementForm(prev => ({...prev, returned: Math.max(0, prev.returned - 1)}))} className="w-8 h-8 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold">-</button>
                  <input type="number" min="0" value={settlementForm.returned} onChange={e => setSettlementForm(prev => ({...prev, returned: Number(e.target.value)}))} className="bg-transparent border-none text-white font-black text-2xl w-12 text-center outline-none" />
                  <button onClick={() => setSettlementForm(prev => ({...prev, returned: prev.returned + 1}))} className="w-8 h-8 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold">+</button>
                </div>
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                <label className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2 text-center">Vendidos</label>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setSettlementForm(prev => ({...prev, sold: Math.max(0, prev.sold - 1)}))} className="w-8 h-8 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold">-</button>
                  <input type="number" min="0" value={settlementForm.sold} onChange={e => setSettlementForm(prev => ({...prev, sold: Number(e.target.value)}))} className="bg-transparent border-none text-white font-black text-2xl w-12 text-center outline-none" />
                  <button onClick={() => setSettlementForm(prev => ({...prev, sold: prev.sold + 1}))} className="w-8 h-8 rounded bg-white/5 text-white hover:bg-white/10 flex items-center justify-center font-bold">+</button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-black/20 rounded-xl border border-white/5 text-center mb-8">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Comissão Gerada Neste Acerto</div>
              <div className="text-3xl font-black text-amber-400">
                R$ {(settlementForm.sold * settlementModal.unitPrice * (settlementModal.commissionPercent / 100)).toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-600 font-bold mt-2">
                Restante após acerto: {settlementModal.inPossession - (settlementForm.sold + settlementForm.returned)} un.
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSettlementModal(null)} className="w-1/3 px-4 py-4 rounded-xl bg-white/5 font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleConfirmSettlement} disabled={loading || (settlementForm.sold + settlementForm.returned <= 0) || (settlementForm.sold + settlementForm.returned > settlementModal.inPossession)} className="w-2/3 bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
