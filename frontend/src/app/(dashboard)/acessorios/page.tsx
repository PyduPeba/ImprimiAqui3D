"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Package,
  DollarSign,
  Tag,
  Layers,
  Box,
  LayoutGrid,
  Activity,
  ChevronRight,
  Loader2,
  Filter,
  AlertCircle
} from 'lucide-react';
import { accessoriesService } from '@/services/accessories.service';
import { toast } from 'react-hot-toast';

const CATEGORIES = [
  { value: 'PACKAGING', label: 'Embalagens', icon: '📦' },
  { value: 'HARDWARE', label: 'Hardware', icon: '🔩' },
  { value: 'FINISHING', label: 'Acabamento', icon: '✨' },
  { value: 'OTHER', label: 'Outros', icon: '📌' },
];

export default function AcessoriosPage() {
  const [accessories, setAccessories] = useState<any[]>([]);
  const [filteredAccessories, setFilteredAccessories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [formData, setFormData] = useState({
    id: null as string | null,
    name: '',
    description: '',
    category: 'OTHER',
    unitPrice: 0,
    stockQuantity: 0,
    inStock: true,
  });

  useEffect(() => {
    loadAccessories();
  }, []);

  useEffect(() => {
    filterAccessories();
  }, [accessories, searchTerm, selectedCategory]);

  const loadAccessories = async () => {
    try {
      const data = await accessoriesService.getAccessories();
      setAccessories(data);
    } catch (err) {
      console.error('Error loading accessories:', err);
      toast.error('Erro ao carregar acessórios');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const filterAccessories = () => {
    let filtered = accessories;

    if (searchTerm) {
      filtered = filtered.filter(acc =>
        acc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(acc => acc.category === selectedCategory);
    }

    setFilteredAccessories(filtered);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.id) {
        await accessoriesService.updateAccessory(formData.id, formData);
        toast.success('Acessório atualizado');
      } else {
        const { id, ...createData } = formData;
        await accessoriesService.createAccessory(createData);
        toast.success('Novo acessório criado');
      }
      await loadAccessories();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving accessory:', err);
      toast.error('Erro ao salvar acessório');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este acessório?')) return;
    try {
      await accessoriesService.deleteAccessory(id);
      toast.success('Acessório removido');
      await loadAccessories();
    } catch (err) {
      console.error('Error deleting accessory:', err);
      toast.error('Erro ao excluir acessório');
    }
  };

  const openModal = (accessory?: any) => {
    if (accessory) {
      setFormData({
        id: accessory.id,
        name: accessory.name,
        description: accessory.description || '',
        category: accessory.category,
        unitPrice: Number(accessory.unitPrice),
        stockQuantity: accessory.stockQuantity,
        inStock: accessory.inStock,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      description: '',
      category: 'OTHER',
      unitPrice: 0,
      stockQuantity: 0,
      inStock: true,
    });
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[3];
  };

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Sincronizando Acessórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                <Box className="text-indigo-400" size={28} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Acessórios & Insumos</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-lg">Controle unitário e financeiro de argolas, adesivos, embalagens e componentes de montagem.</p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/25 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            Novo Registro
          </button>
        </div>

        {/* Filters Bar */}
        <div className="mt-8 flex flex-col md:flex-row gap-4 relative">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Localizar insumo por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium"
            />
          </div>

          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === '' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${
                  selectedCategory === cat.value 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map(cat => {
          const count = accessories.filter(a => a.category === cat.value).length;
          const totalValue = accessories.filter(a => a.category === cat.value).reduce((sum, a) => sum + (Number(a.unitPrice) * a.stockQuantity), 0);
          return (
            <div key={cat.value} className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{cat.label}</p>
                  <p className="text-3xl font-black text-white">{count}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 text-2xl group-hover:scale-125 transition-transform">
                  {cat.icon}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Valor em Estoque</p>
                <p className="text-sm font-black text-emerald-500">R$ {totalValue.toFixed(2)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAccessories.map((accessory) => {
          const catInfo = getCategoryInfo(accessory.category);
          return (
            <div key={accessory.id} className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-white/10 group hover:border-indigo-500/50 transition-all relative overflow-hidden flex flex-col h-full shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98]">
              {/* Card Actions */}
              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button
                  onClick={() => openModal(accessory)}
                  className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition-all border border-indigo-500/20"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(accessory.id)}
                  className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-[1.25rem] bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner group-hover:rotate-[10deg] transition-transform">
                  {catInfo.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight leading-tight">{accessory.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{catInfo.label}</span>
                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${accessory.stockQuantity <= 5 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                      {accessory.stockQuantity <= 5 ? 'Estoque Baixo' : 'Em Estoque'}
                    </span>
                  </div>
                </div>
              </div>

              {accessory.description && (
                <p className="text-sm text-slate-400 mb-6 line-clamp-2 font-medium flex-grow italic">"{accessory.description}"</p>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 items-center relative overflow-hidden mt-auto">
                 <div className="absolute inset-y-0 left-1/2 w-px bg-white/10"></div>
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Preço Unitário</p>
                    <p className="text-base font-black text-white">R$ {Number(accessory.unitPrice).toFixed(2)}</p>
                 </div>
                 <div className="text-right pl-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Disp.</p>
                    <p className="text-lg font-black text-white flex items-center justify-end gap-1">
                      {accessory.stockQuantity} <span className="text-xs text-slate-500 font-bold uppercase tracking-tighter">un</span>
                    </p>
                 </div>
              </div>

              {!accessory.inStock && (
                <div className="mt-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2">
                  <AlertCircle size={12} />
                  Indisponível no Momento
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAccessories.length === 0 && (
        <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-24 text-center border-2 border-dashed border-white/10 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <LayoutGrid className="text-slate-600" size={40} />
          </div>
          <p className="text-white font-black text-xl mb-1">Catálogo Vazio</p>
          <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
            {searchTerm || selectedCategory ? 'Nenhum item atende aos critérios de pesquisa atuais.' : 'Você ainda não cadastrou nenhum acessório ou insumo.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>

            <div className="flex justify-between items-center mb-10 relative">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">
                  {formData.id ? 'Alterar Ficha' : 'Novo Insumo'}
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">SISTEMA INTEGRADO DE COMPONENTES</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 relative">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Comercial</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700"
                  placeholder="Ex: Argola de Aço 10mm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações / Detalhes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700 min-h-[100px] no-scrollbar"
                  placeholder="Notas internas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 text-white font-medium">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Segmento</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-white font-black uppercase tracking-widest text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 text-white font-medium">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Custo Unitário</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unitPrice || ''}
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-white font-medium">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Saldo em Estoque (Unidades)</label>
                <div className="relative group">
                  <Package className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={24} />
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      stockQuantity: Number(e.target.value),
                      inStock: Number(e.target.value) > 0
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black text-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 transition-all active:scale-95"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !formData.name}
                  className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Salvando</span>
                    </div>
                  ) : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
