"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Layers, 
  Clock, 
  Weight, 
  Trash2, 
  Edit2,
  X,
  PlusCircle,
  FileDown,
  Tag,
  Filter,
  Image as ImageIcon,
  Upload,
  ChevronRight,
  Monitor,
  HardDrive,
  Link,
  Download,
  Loader2
} from 'lucide-react';
import { catalogService } from '@/services/catalog.service';
import { inventoryService } from '@/services/inventory.service';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageDownloading, setImageDownloading] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null as string | null,
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    weightGrams: 0,
    printTimeMinutes: 0,
    defaultMaterialId: '',
    fixedPrice: 0,
    profitMargin: 0,
    productionCost: 0,
    productionCostManualOverride: false,
    salePrice: 0,
    commissionPercent: 0,
    stockQuantity: 0,
    minStockAlert: 0,
    imageUrl: '',
  });

  const [categoryForm, setCategoryForm] = useState({
    id: null as string | null,
    name: '',
    description: '',
    icon: '',
    color: '#10b981',
    profitMargin: 0,
  });

  useEffect(() => {
    console.log('CatalogPage: API BaseURL:', api.defaults.baseURL);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodData, catData, matData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCategories(),
        inventoryService.getMaterials()
      ]);
      setProducts(prodData);
      setCategories(catData);
      setMaterials(matData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      console.log('Attempting upload to:', `/upload/image?type=product`);
      const response = await api.post('/upload/image?type=product', formDataUpload);
      console.log('Upload response:', response.data);
      setFormData(prev => ({ ...prev, imageUrl: response.data.url }));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      toast.error(`Erro no upload da imagem: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
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
      if (formData.id) {
        await catalogService.updateProduct(formData.id, formData);
      } else {
        const { id, ...createData } = formData;
        await catalogService.createProduct(createData);
      }
      await loadData();
      setShowModal(false);
      toast.success('Produto salvo com sucesso!');
    } catch (err: any) {
      console.error('Error saving product:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Erro desconhecido';
      toast.error(`Erro ao salvar produto: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    setLoading(true);
    try {
      if (categoryForm.id) {
        await catalogService.updateCategory(categoryForm.id, categoryForm);
      } else {
        const { id, ...createData } = categoryForm;
        await catalogService.createCategory(createData);
      }
      await loadData();
      setShowCategoryModal(false);
      setCategoryForm({ id: null, name: '', description: '', icon: '', color: '#10b981', profitMargin: 0 });
    } catch (err) {
      console.error('Error saving category:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: any) => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        categoryId: product.category?.id || '',
        weightGrams: Number(product.weightGrams),
        printTimeMinutes: Number(product.printTimeMinutes),
        defaultMaterialId: product.defaultMaterial?.id || '',
        fixedPrice: Number(product.fixedPrice) || 0,
        profitMargin: Number(product.profitMargin) || 0,
        productionCost: Number(product.productionCost) || 0,
        productionCostManualOverride: product.productionCostManualOverride || false,
        salePrice: Number(product.salePrice) || 0,
        commissionPercent: Number(product.commissionPercent) || 0,
        stockQuantity: Number(product.stockQuantity) || 0,
        minStockAlert: Number(product.minStockAlert) || 0,
        imageUrl: product.imageUrl || '',
      });
    } else {
      setFormData({
        id: null,
        name: '',
        sku: '',
        description: '',
        categoryId: categories[0]?.id || '',
        weightGrams: 0,
        printTimeMinutes: 0,
        defaultMaterialId: materials[0]?.id || '',
        fixedPrice: 0,
        profitMargin: 0,
        productionCost: 0,
        productionCostManualOverride: false,
        salePrice: 0,
        commissionPercent: 0,
        stockQuantity: 0,
        minStockAlert: 0,
        imageUrl: '',
      });
    }
    setShowModal(true);
  };

  const openCategoryModal = (category?: any) => {
    if (category) {
      setCategoryForm(category);
    } else {
      setCategoryForm({ id: null, name: '', description: '', icon: '', color: '#10b981', profitMargin: 0 });
    }
    setShowCategoryModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este produto?')) return;
    try {
      await catalogService.deleteProduct(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      await catalogService.deleteCategory(id);
      await loadData();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category?.id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Helper to construct image URL
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${path}`.replace('/api/uploads', '/uploads');
  };

  return (
    <div className="p-10 space-y-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-3 uppercase">
             <Layers size={14} />
             Gestão de Ativos
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Catálogo de Produtos</h1>
          <p className="text-slate-500 mt-2 font-bold">Gerencie seus modelos prontos para produção e venda rápida.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => openCategoryModal()} 
             className="h-[50px] px-6 rounded-xl border border-white/5 bg-white/5 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
           >
             <Tag size={16} className="text-emerald-500" />
             Categorias
           </button>
           <button onClick={() => openModal()} className="btn-premium h-[50px] shadow-emerald-500/20">
             <PlusCircle size={18} />
             <span>Novo Produto</span>
           </button>
        </div>
      </div>

      {/* Filters (Bento Style) */}
      <div className="glass-card bg-gradient-to-br from-slate-800/40 to-slate-900/40 border-white/5 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Pesquisar no catálogo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600 font-bold text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900/50 border border-white/5 rounded-xl pl-12 pr-10 py-3 text-white focus:border-emerald-500/50 outline-none transition-all appearance-none font-bold text-sm min-w-[200px]"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 ml:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="stat-card p-0 group product-card hover:-translate-y-2 transition-all duration-500 border-white/5 cursor-pointer">
             <div 
               className="product-image-container m-3 cursor-pointer"
               onClick={() => setPreviewImage(product)}
             >
                {product.imageUrl ? (
                  <img 
                      src={getImageUrl(product.imageUrl) || ''} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                ) : (
                  <div className="flex flex-col items-center gap-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Layers size={48} strokeWidth={1} className="text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Sem Imagem</span>
                  </div>
                )}
                
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-4 flex items-end justify-between">
                   <div className="flex gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); openModal(product); }}
                         className="p-2.5 bg-emerald-500 text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                         className="p-2.5 bg-rose-500 text-white rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                   </div>
                </div>

                {product.category && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-slate-900/80 backdrop-blur rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10" style={{ color: product.category.color || '#10b981' }}>
                    {product.category.name}
                  </div>
                )}
             </div>

             <div className="p-5 pt-2">
                <h3 className="font-black text-white text-lg tracking-tight mb-1 group-hover:text-emerald-400 transition-colors uppercase leading-tight truncate">{product.name}</h3>
                {product.sku && <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">SKU: {product.sku}</p>}
                <p className="text-[11px] text-slate-500 font-bold line-clamp-2 mb-3 h-8 leading-relaxed">{product.description || 'Nenhuma descrição disponível.'}</p>

                {/* Preço e Estoque */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.salePrice > 0 && (
                      <span className="text-emerald-400 font-black text-lg">R$ {Number(product.salePrice).toFixed(2)}</span>
                    )}
                    {product.productionCost > 0 && (
                      <span className="text-[10px] text-slate-600 font-bold block">Custo: R$ {Number(product.productionCost).toFixed(2)}</span>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    product.stockQuantity === 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                    (product.minStockAlert && product.stockQuantity <= product.minStockAlert) ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {product.stockQuantity === 0 ? '⚠ Sem estoque' : `Estoque: ${product.stockQuantity}`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Weight size={10} /> Peso
                      </span>
                      <span className="text-sm font-black text-slate-300">{product.weightGrams}g</span>
                   </div>
                   <div className="flex flex-col text-right">
                      <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1 justify-end flex items-center gap-1">
                        <Clock size={10} /> Tempo
                      </span>
                      <span className="text-sm font-black text-slate-300">{product.printTimeMinutes}m</span>
                   </div>
                </div>
             </div>
          </div>
        ))}

        {/* Empty State / Add Card */}
        <div 
          onClick={() => openModal()}
          className="stat-card border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center p-8 min-h-[350px] group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer"
        >
           <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 group-hover:scale-110 transition-all mb-4">
              <Plus size={32} />
           </div>
           <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-400">Novo Produto</span>
        </div>
      </div>

      {/* Product Modal (Premium Glass) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0 border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="sticky top-0 bg-[#0f172a]/90 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {formData.id ? 'Refinar Produto' : 'Arquitetar Novo Produto'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column: Media & Visuals */}
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Identidade Visual</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="relative product-image-container w-full h-[300px] border-dashed border-white/20 hover:border-emerald-500/50 cursor-pointer group"
                    >
                       {formData.imageUrl ? (
                         <>
                           <img src={getImageUrl(formData.imageUrl) || ''} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Upload className="text-white" size={32} />
                           </div>
                         </>
                       ) : (
                         <div className="flex flex-col items-center gap-3 text-slate-500 group-hover:text-emerald-500 transition-colors">
                            {uploading ? (
                               <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                            ) : (
                               <>
                                 <ImageIcon size={48} strokeWidth={1} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Clique para Upload</span>
                               </>
                            )}
                         </div>
                       )}
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleFileUpload} 
                         className="hidden" 
                         accept="image/*" 
                       />
                    </div>

                    {/* URL Download Section */}
                    <div className="relative mt-2">
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadImageFromUrl}
                          disabled={imageDownloading || !imageUrlInput.trim()}
                          className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center flex-shrink-0"
                        >
                          {imageDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        </button>
                      </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Preview de Peso</span>
                       <div className="text-xl font-black text-white">{formData.weightGrams}g</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Tempo Est.</span>
                       <div className="text-xl font-black text-white">{formData.printTimeMinutes}m</div>
                    </div>
                 </div>
              </div>

              {/* Right Column: Parameters */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="glass-input w-full font-bold text-sm" 
                    placeholder="Ex: Letra Caixa Pro" 
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Descrição Técnica</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({...formData, description: e.target.value})} 
                    className="glass-input w-full min-h-[100px] font-medium text-sm py-4" 
                    placeholder="Descreva as especificações..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
                    <select 
                      value={formData.categoryId} 
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})} 
                      className="glass-input w-full font-bold text-sm appearance-none"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cor/Template</label>
                    <div className="w-full h-[46px] rounded-xl border border-white/10 bg-white/5 flex items-center justify-center gap-2">
                       <div className="w-4 h-4 rounded-full" style={{ backgroundColor: categories.find(c => c.id === formData.categoryId)?.color || '#1e293b' }}></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizado</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Peso Líquido (g)</label>
                    <input type="number" value={formData.weightGrams} onChange={(e) => setFormData({...formData, weightGrams: Number(e.target.value)})} className="glass-input w-full font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tempo de Impressão (min)</label>
                    <input type="number" value={formData.printTimeMinutes} onChange={(e) => setFormData({...formData, printTimeMinutes: Number(e.target.value)})} className="glass-input w-full font-bold" />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Markup de Lucro</label>
                   <div className="relative">
                      <input 
                        type="number" 
                        step="0.01" 
                        value={formData.profitMargin || ''} 
                        onChange={(e) => setFormData({...formData, profitMargin: Number(e.target.value)})} 
                        className="glass-input w-full font-black text-emerald-400" 
                        placeholder="Ex: 2.5" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">X</span>
                   </div>
                </div>

                {/* Novos campos financeiros */}
                <div className="border-t border-white/5 pt-5 space-y-4">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Precificação & Estoque</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Custo de Produção (R$)</label>
                      <input type="number" step="0.01" value={formData.productionCost || ''}
                        onChange={(e) => setFormData({...formData, productionCost: Number(e.target.value), productionCostManualOverride: true})}
                        className="glass-input w-full font-bold text-amber-400" placeholder="Auto-calculado" />
                      {!formData.productionCostManualOverride && <p className="text-[9px] text-slate-600 mt-1">Calculado automaticamente</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Preço de Venda (R$)</label>
                      <input type="number" step="0.01" value={formData.salePrice || ''}
                        onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                        className="glass-input w-full font-black text-emerald-400" placeholder="0,00" />
                    </div>
                  </div>

                  {formData.salePrice > 0 && formData.productionCost > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Margem Bruta (Venda)</span>
                        <span className="text-emerald-400 font-black text-sm">
                          {(((formData.salePrice - formData.productionCost) / formData.salePrice) * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      {formData.commissionPercent > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Margem Líquida (c/ Comissão)</span>
                          <span className="text-indigo-400 font-black text-sm">
                            {(((formData.salePrice - formData.productionCost - (formData.salePrice * formData.commissionPercent / 100)) / formData.salePrice) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Markup (sobre o Custo)</span>
                        <span className="text-amber-400 font-black text-sm">
                          {(((formData.salePrice - formData.productionCost) / formData.productionCost) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estoque (unid.)</label>
                      <input type="number" value={formData.stockQuantity}
                        onChange={(e) => setFormData({...formData, stockQuantity: Number(e.target.value)})}
                        className="glass-input w-full font-bold" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alerta Mínimo</label>
                      <input type="number" value={formData.minStockAlert || ''}
                        onChange={(e) => setFormData({...formData, minStockAlert: Number(e.target.value)})}
                        className="glass-input w-full font-bold" placeholder="Ex: 5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">SKU / Código</label>
                      <input type="text" value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        className="glass-input w-full font-bold" placeholder="Ex: PROD-001" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Comissão Revendedor (%)</label>
                      <div className="relative">
                        <input type="number" step="0.01" value={formData.commissionPercent || ''}
                          onChange={(e) => setFormData({...formData, commissionPercent: Number(e.target.value)})}
                          className="glass-input w-full font-black text-indigo-400" placeholder="Ex: 10" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 h-[50px] bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave} 
                    disabled={loading || !formData.name} 
                    className="flex-1 btn-premium h-[50px] shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? 'Processando...' : formData.id ? 'Atualizar Ativo' : 'Criar Ativo'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Managed Space) */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[110] p-4 animate-in zoom-in duration-300">
          <div className="glass-card max-w-5xl w-full p-0 overflow-hidden border-white/10 shadow-[0_0_100px_rgba(99,102,241,0.1)]">
            <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
               <div>
                  <h2 className="text-3xl font-black text-white tracking-tighter">Gestão de Categorias</h2>
                  <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Estrutura organizacional do catálogo</p>
               </div>
               <button onClick={() => setShowCategoryModal(false)} className="w-12 h-12 flex items-center justify-center hover:bg-white/5 rounded-2xl transition-all text-slate-400">
                  <X size={32} />
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-white/5">
               {/* Left: Category Form */}
               <div className="p-10 space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Plus size={20} />
                     </div>
                     <h3 className="text-sm font-black text-white uppercase tracking-widest">
                        {categoryForm.id ? 'Editar Metadados' : 'Definir Nova Categoria'}
                     </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Rótulo</label>
                      <input type="text" value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} className="glass-input w-full font-bold" placeholder="Ex: Decoração de Interiores" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Destaque Visual (Cor)</label>
                      <div className="flex gap-4 items-center">
                         <input type="color" value={categoryForm.color} onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})} className="w-20 h-14 rounded-xl border-none bg-white/5 cursor-pointer p-1" />
                         <div className="flex-1 text-[10px] font-bold text-slate-500 leading-tight">Esta cor será usada para o badge de identificação dos produtos.</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Profit Markup Padrão</label>
                      <div className="relative">
                         <input type="number" step="0.01" value={categoryForm.profitMargin || ''} onChange={(e) => setCategoryForm({...categoryForm, profitMargin: Number(e.target.value)})} className="glass-input w-full font-black text-indigo-400" />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">X</span>
                      </div>
                    </div>
                    <button onClick={handleSaveCategory} className="w-full btn-premium h-[55px] from-indigo-500 to-indigo-700 shadow-indigo-500/20 mt-4">
                       {loading ? 'Sincronizando...' : categoryForm.id ? 'Atualizar Registro' : 'Lançar Categoria'}
                    </button>
                  </div>
               </div>

               {/* Right: Existing Categories list */}
               <div className="p-10 bg-white/[0.02]">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                     <Monitor size={14} /> Registros Atuais
                  </h3>
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                     {categories.map(cat => (
                       <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${cat.color}20`, border: `1px solid ${cat.color}40` }}>
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            </div>
                            <div>
                               <h4 className="text-white font-black text-sm tracking-tight">{cat.name}</h4>
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{cat.profitMargin || 0}x mark</span>
                            </div>
                         </div>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openCategoryModal(cat)} className="w-9 h-9 flex items-center justify-center bg-white/5 text-slate-400 hover:text-indigo-400 rounded-lg transition-colors">
                               <Edit2 size={14} />
                            </button>
                            <button onClick={() => catalogService.deleteCategory(cat.id).then(loadData)} className="w-9 h-9 flex items-center justify-center bg-white/5 text-slate-400 hover:text-rose-400 rounded-lg transition-colors">
                               <X size={14} />
                            </button>
                         </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-10 right-10 flex gap-4">
             <button 
               onClick={(e) => { e.stopPropagation(); openModal(previewImage); setPreviewImage(null); }}
               className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 text-white flex items-center justify-center transition-all border border-white/10"
               title="Editar Produto"
             >
               <Edit2 size={20} />
             </button>
             <button 
               onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
               className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/10"
               title="Fechar"
             >
               <X size={24} />
             </button>
          </div>

          <div 
            className="relative max-w-5xl w-full max-h-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="glass-card p-2 border-white/10 shadow-2xl relative group overflow-hidden">
                <img 
                  src={getImageUrl(previewImage.imageUrl) || ''} 
                  alt={previewImage.name} 
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
                
                {/* Info Overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="flex justify-between items-end">
                      <div>
                         <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{previewImage.name}</h2>
                         <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{previewImage.category?.name || 'Sem Categoria'}</p>
                      </div>
                      <div className="text-right">
                         <span className="block text-[10px] font-black text-slate-500 uppercase mb-1">Especificações</span>
                         <span className="text-emerald-400 font-black text-sm">{previewImage.weightGrams}g • {previewImage.printTimeMinutes}m</span>
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
