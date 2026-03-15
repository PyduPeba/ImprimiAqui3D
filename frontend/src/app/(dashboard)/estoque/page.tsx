"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  AlertTriangle,
  Search,
  Plus,
  X,
  Edit2,
  History,
  TrendingDown,
  TrendingUp,
  Calendar,
  Box,
  Tag,
  Hash,
  Activity,
  ChevronRight,
  Loader2,
  Filter,
  ImagePlus,
  Link,
  Download,
  Camera
} from 'lucide-react';
import { inventoryService } from '@/services/inventory.service';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  
  // State for form
  const [formData, setFormData] = useState({
    id: null as string | null,
    name: '',
    brand: '',
    type: 'PLA',
    color: '',
    stockWeight: 0,
    minStockAlert: 1000,
    pricePerKg: 100,
    imageUrl: ''
  });

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageDownloading, setImageDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [adjustData, setAdjustData] = useState({
    amount: 0,
    reason: '',
    type: 'ADD' as 'ADD' | 'REMOVE'
  });

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await inventoryService.getMaterials();
      setMaterials(data);
    } catch (err) {
      console.error('Error loading materials:', err);
      toast.error('Erro ao carregar materiais');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadHistory = async (materialId?: string) => {
    try {
      const data = await inventoryService.getMovements(materialId);
      setMovements(data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Error loading history:', err);
      toast.error('Erro ao carregar histórico');
    }
  };

  const handleAdjust = async () => {
    if (!selectedMaterial) return;
    setLoading(true);
    try {
      if (adjustData.type === 'ADD') {
        await inventoryService.addStock(selectedMaterial.id, adjustData.amount, adjustData.reason);
      } else {
        await inventoryService.removeStock(selectedMaterial.id, adjustData.amount, adjustData.reason);
      }
      await loadMaterials();
      toast.success('Estoque ajustado com sucesso');
      setShowAdjustModal(false);
      setAdjustData({ amount: 0, reason: '', type: 'ADD' });
    } catch (err) {
      console.error('Error adjusting stock:', err);
      toast.error('Erro ao ajustar estoque');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: null,
      name: '',
      brand: '',
      type: 'PLA',
      color: '',
      stockWeight: 0,
      minStockAlert: 1000,
      pricePerKg: 100,
      imageUrl: ''
    });
    setImageUrlInput('');
    setShowAddModal(true);
  };

  const openEditModal = (material: any) => {
    setFormData({
      id: material.id,
      name: material.name,
      brand: material.brand || '',
      type: material.type,
      color: material.color,
      stockWeight: Number(material.stockWeight),
      minStockAlert: Number(material.minStockAlert),
      pricePerKg: Number(material.pricePerGram) * 1000,
      imageUrl: material.imageUrl || ''
    });
    setImageUrlInput(material.imageUrl && !material.imageUrl.startsWith('data:') ? material.imageUrl : '');
    setShowAddModal(true);
  };

  // ── Image helpers ────────────────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem válido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      toast.success('Imagem carregada!');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadImageFromUrl = async () => {
    const url = imageUrlInput.trim();
    if (!url) { toast.error('Cole uma URL de imagem válida.'); return; }
    setImageDownloading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Falha ao baixar a imagem');
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) throw new Error('O link não aponta para uma imagem');
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
      toast.success('Imagem baixada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível baixar a imagem. Verifique a URL.');
    } finally {
      setImageDownloading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('[Inventory] Starting save process...');
      const payload = {
        name: formData.name,
        brand: formData.brand,
        type: formData.type,
        color: formData.color,
        stockWeight: formData.stockWeight,
        minStockAlert: formData.minStockAlert,
        pricePerGram: Number(formData.pricePerKg) / 1000,
        imageUrl: formData.imageUrl || null
      };

      console.log('[Inventory] Payload being sent:', { 
        ...payload, 
        imageUrl: payload.imageUrl ? `Exists (Length: ${payload.imageUrl.length})` : 'None' 
      });

      if (formData.id) {
        console.log(`[Inventory] Calling updateMaterial for ID: ${formData.id}`);
        await inventoryService.updateMaterial(formData.id, payload);
        toast.success('Material atualizado');
      } else {
        console.log('[Inventory] Calling createMaterial');
        await inventoryService.createMaterial(payload);
        toast.success('Material criado');
      }

      console.log('[Inventory] Save successful, reloading...');
      await loadMaterials();
      setShowAddModal(false);
    } catch (err: any) {
      console.error('[Inventory] Error saving material:', err);
      const detail = err.response?.data?.message || err.message || 'Erro desconhecido';
      toast.error(`Erro ao salvar: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         m.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (m.brand && m.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchesBrand = brandFilter === 'ALL' || m.brand === brandFilter;
    return matchesSearch && matchesType && matchesBrand;
  });

  const materialTypes = ['ALL', ...Array.from(new Set(materials.map(m => m.type)))];
  const materialBrands = ['ALL', ...Array.from(new Set(materials.map(m => m.brand).filter(Boolean)))];

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-white">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando Estoque...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <Package className="text-indigo-400" size={18} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tighter">Estoque Central</h1>
          </div>
          <p className="text-slate-400 font-medium text-xs max-w-sm">Gerencie seu estoque com eficiência industrial.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative">
          <button 
            onClick={() => loadHistory()}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all group/btn"
          >
            <History size={16} className="text-slate-400 group-hover/btn:text-white transition-colors" />
            <span>Histórico</span>
          </button>
          
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
          >
            <Plus size={16} />
            <span>Novo Material</span>
          </button>
        </div>
      </div>

      {/* Filters & Summary */}
      <div className="space-y-3">
        {/* Search + Patrimônio row */}
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-all group-focus-within:text-indigo-400" size={16} />
            <input 
              type="text"
              placeholder="Pesquisar por nome, tipo ou marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all text-sm font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all active:scale-90"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-4 group overflow-hidden relative flex-shrink-0">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
            <div>
              <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Patrimônio</p>
              <p className="text-base font-black text-emerald-500">
                R$ {materials.reduce((sum, m) => sum + (Number(m.stockWeight) * Number(m.pricePerGram)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="text-emerald-500/50" size={20} />
          </div>
        </div>

        {/* Filter rows */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 flex-shrink-0">Tipo</span>
            {materialTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all flex-shrink-0 ${
                  typeFilter === type 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {type === 'ALL' ? 'Todos' : type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest px-2 flex-shrink-0">Marca</span>
            {materialBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setBrandFilter(brand)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all flex-shrink-0 ${
                  brandFilter === brand 
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                {brand === 'ALL' ? 'Todas' : brand}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
          <Package className="text-slate-600 mb-4" size={64} />
          <h3 className="text-xl font-bold text-white">Nenhum material encontrado</h3>
          <p className="text-slate-500 font-medium">Tente ajustar seus filtros ou adicione um novo material.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 group hover:border-indigo-500/50 transition-all relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98]">
              {/* Card Actions */}
              <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                <button 
                  onClick={() => { setSelectedMaterial(material); setShowAdjustModal(true); }}
                  className="p-1.5 bg-slate-900/80 backdrop-blur text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20"
                  title="Ajustar Estoque"
                >
                  <RefreshCcw size={14} />
                </button>
                <button 
                  onClick={() => openEditModal(material)}
                  className="p-1.5 bg-slate-900/80 backdrop-blur text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all border border-indigo-500/20"
                  title="Editar Ficha"
                >
                  <Edit2 size={14} />
                </button>
              </div>

              {/* Image Hero or Icon */}
              {material.imageUrl ? (
                <div className="relative h-28 w-full overflow-hidden rounded-t-2xl flex-shrink-0">
                  <img
                    src={material.imageUrl}
                    alt={material.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  {/* Status badge over image */}
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border backdrop-blur-sm ${
                      Number(material.stockWeight) < Number(material.minStockAlert) 
                        ? 'bg-rose-500/70 text-white border-rose-500/50' 
                        : 'bg-emerald-500/70 text-white border-emerald-500/50'
                    }`}>
                      {Number(material.stockWeight) < Number(material.minStockAlert) ? 'Reposição' : 'OK'}
                    </span>
                    <span className="text-[8px] font-black text-white/80 uppercase tracking-widest bg-slate-900/60 backdrop-blur rounded-full px-1.5 py-0.5">{material.type}</span>
                  </div>
                </div>
              ) : (
                <div className="px-4 pt-4">
                  {/* Status & Type — original layout when no image */}
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-xl border shadow-inner ${
                      Number(material.stockWeight) < Number(material.minStockAlert) 
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    }`}>
                      <Package size={18} />
                    </div>
                    <div className="text-right">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        Number(material.stockWeight) < Number(material.minStockAlert) 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : 'bg-emerald-500/20 text-white border-emerald-500/30'
                      }`}>
                        {Number(material.stockWeight) < Number(material.minStockAlert) ? 'Reposição' : 'OK'}
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <Tag className="text-slate-500" size={10} />
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{material.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Section */}
              <div className={`mb-4 ${material.imageUrl ? 'px-4 pt-2' : 'px-4'}`}>
                <h3 className="text-sm font-black text-white leading-tight mb-0.5 line-clamp-2">{material.name}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{material.brand || 'Original'}</span>
                  <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{material.color || 'Padrão'}</span>
                </div>
              </div>

              <div className="mt-auto space-y-3 px-4 pb-4">
                {/* Stock Level */}
                <div className="space-y-1">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Hash size={12} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Saldo</span>
                    </div>
                    <span className="text-sm font-black text-white tracking-tighter">
                      {Number(material.stockWeight).toFixed(0)}<span className="text-[10px] text-slate-500 ml-0.5">g</span>
                    </span>
                  </div>
                  
                  <div className="h-1.5 bg-white/5 rounded-full border border-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 relative ${
                        Number(material.stockWeight) < Number(material.minStockAlert) 
                          ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]' 
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      }`} 
                      style={{ width: `${Math.min((Number(material.stockWeight) / 2000) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 gap-2 p-2 bg-white/5 rounded-xl border border-white/5 items-center relative overflow-hidden">
                   <div className="absolute inset-y-0 left-1/2 w-px bg-white/10"></div>
                   <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        <ArrowUpRight size={8} /> Preço/g
                      </p>
                      <p className="text-[10px] font-black text-white">R$ {Number(material.pricePerGram).toFixed(2)}</p>
                   </div>
                   <div className="text-right pl-2">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5 flex items-center gap-1 justify-end">
                        <Activity size={8} /> Valor
                      </p>
                      <p className="text-[10px] font-black text-emerald-400">R$ {(Number(material.stockWeight) * Number(material.pricePerGram)).toFixed(2)}</p>
                   </div>
                </div>

                <button 
                  onClick={() => loadHistory(material.id)}
                  className="w-full group/move py-1.5 border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <History size={12} className="group-hover/move:rotate-[-45deg] transition-transform" />
                  Ver Histórico
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -mr-40 -mt-40"></div>
             
             <div className="flex justify-between items-center mb-8 relative">
                <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Movimentações</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">LOG DE AUDITORIA INDUSTRIAL</p>
                </div>
                <button 
                  onClick={() => setShowHistoryModal(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95"
                >
                  <X size={24} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto max-h-[60vh] space-y-4 pr-3 custom-scrollbar relative">
                {movements.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10">
                    <History className="text-slate-600 mb-4" size={48} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum registro encontrado</p>
                  </div>
                ) : (
                  movements.map((move) => (
                    <div key={move.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${
                          move.type === 'IN' 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}>
                          {move.type === 'IN' ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                        </div>
                        <div>
                          <p className="text-lg font-black text-white leading-tight">{move.material?.name || 'Material Excluído'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-1">
                              <Calendar size={12} className="text-indigo-400" /> 
                              {new Date(move.createdAt).toLocaleString('pt-BR')}
                            </p>
                            <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                            <span className="text-[10px] font-bold text-slate-400 italic">"{move.reason || 'Alteração de sistema'}"</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${move.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {move.type === 'IN' ? '+' : '-'}{Number(move.amount).toFixed(0)}<span className="text-xs ml-1 font-bold">g</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
             </div>
             
             <div className="mt-8">
               <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl"
               >
                 Fechar Janela
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mt-32"></div>
            
            <div className="flex justify-between items-center mb-8 relative text-white">
              <div>
                <h2 className="text-3xl font-black tracking-tighter text-white">Ajuste Manual</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedMaterial?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAdjustModal(false)} 
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 relative text-white">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setAdjustData({...adjustData, type: 'ADD'})}
                  className={`py-8 rounded-3xl font-black text-xs uppercase tracking-widest border transition-all flex flex-col items-center gap-3 ${
                    adjustData.type === 'ADD' 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  <ArrowUpRight size={24} />
                  Entrada (+)
                </button>
                <button 
                  onClick={() => setAdjustData({...adjustData, type: 'REMOVE'})}
                  className={`py-8 rounded-3xl font-black text-xs uppercase tracking-widest border transition-all flex flex-col items-center gap-3 ${
                    adjustData.type === 'REMOVE' 
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]' 
                      : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                  }`}
                >
                  <ArrowDownLeft size={24} />
                  Saída (-)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume em Gramas</label>
                <div className="relative group text-white">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="number" 
                    value={adjustData.amount || ''}
                    onChange={(e) => setAdjustData({...adjustData, amount: Number(e.target.value)})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                    placeholder="Ex: 500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black uppercase text-xs">G</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observação do Operador</label>
                <div className="relative group text-white">
                  <Edit2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input 
                    type="text" 
                    value={adjustData.reason}
                    onChange={(e) => setAdjustData({...adjustData, reason: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                    placeholder="Motivo do ajuste..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAdjust}
                  disabled={loading || adjustData.amount <= 0 || !adjustData.reason}
                  className="flex-[2] py-5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Salvando</span>
                    </div>
                  ) : (formData.id ? 'Salvar Alterações' : 'Registrar Material')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] max-w-6xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none"></div>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="px-10 pt-10 flex justify-between items-center mb-0 relative text-white flex-shrink-0">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">{formData.id ? 'Alterar Ficha' : 'Novo Material'}</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">ESPECIFICAÇÕES TÉCNICAS E CUSTOS</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 px-10 pb-10 pt-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 relative text-white items-start">
                
                {/* Identification & Technical Info (Span 2 for horizontal feel) */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identificação do Produto</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                        placeholder="Ex: PLA Sideral Gray"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fabricante</label>
                      <input 
                        type="text" 
                        value={formData.brand}
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                        placeholder="Voolt3D, 3DLab..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Polímero Base</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-white font-black uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="PLA">PLA</option>
                        <option value="PETG">PETG</option>
                        <option value="ABS">ABS</option>
                        <option value="TPU">TPU</option>
                        <option value="RESINA">RESINA</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pigmentação / Acabamento</label>
                      <div className="relative group text-white font-medium">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-500"></div>
                        <input 
                          type="text" 
                          value={formData.color}
                          onChange={(e) => setFormData({...formData, color: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                          placeholder="Cinza, Preto Fosco, etc..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1">Peso Atual (g)</label>
                      <input 
                        type="number" 
                        value={formData.stockWeight || ''}
                        onChange={(e) => setFormData({...formData, stockWeight: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-1">Gatilho Alerta (g)</label>
                      <input 
                        type="number" 
                        value={formData.minStockAlert || ''}
                        onChange={(e) => setFormData({...formData, minStockAlert: Number(e.target.value)})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço Custo (R$/kg)</label>
                      <div className="relative group text-white font-medium">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-xl">R$</span>
                        <input 
                          type="number" 
                          step="0.01"
                          value={formData.pricePerKg || ''}
                          onChange={(e) => setFormData({...formData, pricePerKg: Number(e.target.value)})}
                          className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl py-4 pl-16 pr-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Image Management */}
                <div className="space-y-6 flex flex-col h-full lg:border-l lg:border-white/5 lg:pl-10">
                  <div className="flex-1 space-y-4 p-6 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col">
                    <div className="flex items-center gap-2">
                      <Camera size={16} className="text-indigo-400" />
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto Representativa</label>
                    </div>

                    {/* Preview Area */}
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-white/10 bg-black/20 group/preview flex items-center justify-center">
                      {formData.imageUrl ? (
                        <>
                          <img
                            src={formData.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/preview:scale-110"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, imageUrl: '' })); }}
                              className="p-3 bg-rose-500 text-white rounded-full shadow-xl hover:scale-110 transition-all"
                              title="Remover Imagem"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-slate-600">
                          <ImagePlus size={48} strokeWidth={1} />
                          <p className="text-[10px] font-black uppercase tracking-widest text-center">Arraste ou clique para<br/>adicionar imagem</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                      >
                        <ImagePlus size={18} />
                        Upload do Computador
                      </button>

                      <div className="relative">
                        <div className="flex items-center gap-2 py-2">
                          <div className="h-px flex-1 bg-white/5"></div>
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Ou via Link Web</span>
                          <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                              type="text"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleDownloadImageFromUrl()}
                              placeholder="URL da imagem..."
                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-9 pr-3 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleDownloadImageFromUrl}
                            disabled={imageDownloading || !imageUrlInput.trim()}
                            className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center flex-shrink-0"
                          >
                            {imageDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 mt-auto">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 transition-all active:scale-95"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={loading || !formData.name}
                      className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:scale-100"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          <span>Salvando...</span>
                        </div>
                      ) : (formData.id ? 'Salvar Alterações' : 'Registrar Material')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
