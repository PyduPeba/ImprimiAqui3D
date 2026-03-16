"use client";

import React, { useState, useEffect, Suspense } from 'react';
import {
  Plus,
  Search,
  Upload,
  Package,
  X,
  Printer,
  ShoppingBag,
  FileText,
  Trash2,
  Edit2,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Check,
  Filter,
  ChevronRight,
  Layers,
  CloudDownload,
  Wrench,
  Image as ImageIcon
} from 'lucide-react';
import { catalogService } from '@/services/catalog.service';
import { inventoryService } from '@/services/inventory.service';
import { productionService } from '@/services/production.service';
import { accessoriesService } from '@/services/accessories.service';
import { customersService } from '@/services/customers.service';
import { salesService } from '@/services/sales.service';
import { useSearchParams, useRouter } from 'next/navigation';
import { FileUpload } from '@/components/features/FileUpload';
import api from '@/lib/api';
import toast from 'react-hot-toast';

enum PaymentMethod {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    PIX = 'PIX',
    BANK_TRANSFER = 'BANK_TRANSFER',
    SHOPEE = 'SHOPEE',
}

function CaixaContent() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [printers, setPrinters] = useState<any[]>([]);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showAccessoriesModal, setShowAccessoriesModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItemForAccessories, setSelectedItemForAccessories] = useState<any>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [installments, setInstallments] = useState(1);
  const [selectedChannel, setSelectedChannel] = useState<string>('LOJA_FISICA');
  const [searchTerm, setSearchTerm] = useState('');
  const [accessorySearch, setAccessorySearch] = useState('');
  const [topAccessories, setTopAccessories] = useState<any[]>([]);
  const [accessoryQuantities, setAccessoryQuantities] = useState<{[key: string]: number}>({});
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingAccessory, setEditingAccessory] = useState<{ itemId: number, accessoryId: string } | null>(null);
  const [editAccessoryQty, setEditAccessoryQty] = useState(1);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAccessories = accessories.filter(acc => 
    acc.inStock && acc.name.toLowerCase().includes(accessorySearch.toLowerCase())
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  const quoteId = searchParams.get('quoteId');

  useEffect(() => {
    loadData();
    if (quoteId) {
      loadQuote(quoteId);
    }
  }, [quoteId]);

  const loadQuote = async (id: string) => {
      setLoading(true);
      try {
          const quote = await salesService.getSale(id);
          if (quote) {
              setItems(quote.items.map((item: any) => ({
                  ...item,
                  name: item.customName || item.fileName || item.name || 'Item Personalizado',
                  materialId: item.material?.id,
                  printerId: item.printer?.id || (printers[0]?.id),
                  unitPrice: Number(item.unitPrice), // Ensure number
                  accessories: (item.accessories || []).map((acc: any) => ({
                      ...acc,
                      accessoryId: acc.accessory?.id || acc.accessoryId,
                      name: acc.name || acc.accessory?.name,
                      unitPrice: Number(acc.unitPrice)
                  }))
              })));
              if (quote.customer) {
                  setSelectedCustomer(quote.customer);
              }
              if (quote.discount) {
                  setDiscount(Number(quote.discount));
              }
          }
      } catch (err) {
          console.error('Error loading quote:', err);
          toast.error('Erro ao carregar orçamento');
      } finally {
          setLoading(false);
      }
  };

  const loadData = async () => {
    try {
      const [prodsData, catsData, matsData, printersData, accsData, custsData, settingsData, topAccsData] = await Promise.all([
        catalogService.getProducts(),
        catalogService.getCategories(),
        inventoryService.getMaterials(),
        productionService.getPrinters(),
        accessoriesService.getAccessories(),
        customersService.getCustomers(),
        import('@/services/settings.service').then(m => m.settingsService.getSettings()),
        accessoriesService.getTopUsed(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      setMaterials(matsData);
      setPrinters(printersData);
      setAccessories(accsData);
      setCustomers(custsData);
      setTopAccessories(topAccsData || []);
      if (settingsData) {
          (window as any).storeSettings = settingsData; // Temporary hack, better to use state
          setStoreSettings(settingsData);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const generatePdf = async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    try {
      // Prepare data for PDF
      const pdfData = {
        id: null,
        customer: selectedCustomer,
        items: items.map(item => {
          const material = materials.find(m => m.id === item.materialId);
          const printer = printers.find(p => p.id === item.printerId);
          return {
            ...item,
            materialName: material?.name || '-',
            printerName: printer?.name || '-',
          };
        }),
        subtotal,
        discount,
        total,
      };

      // Call API to get HTML
      const response = await api.post('/sales/quote/pdf', pdfData);

      // Open HTML in invisible iframe to trigger print dialog (works in standard browsers and Electron)
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(response.data);
        doc.close();
      }

      // Wait for content to load then trigger print dialog
      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          
          // Clean up after print dialog closes
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }, 250);
      };
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuote = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const quoteData = {
        customerId: selectedCustomer?.id || null,
        items: items.map(item => ({
          ...item,
          pricingFactors: {
            pricePerGram: materials.find(m => m.id === item.materialId)?.pricePerGram || 0.1,
            pricePerHour: printers.find(p => p.id === item.printerId)?.hourlyRate || 5,
            profitMargin: printers.find(p => p.id === item.printerId)?.profitMargin || 1.3
          }
        })),
        discount,
        isDirectSale: false // Explicitly a quote
      };
      await api.post('/sales/quotation', quoteData);
      toast.success('Orçamento salvo com sucesso!');
      setItems([]);
      setDiscount(0);
      setSelectedCustomer(undefined);
    } catch (err) {
      console.error('Error saving quote:', err);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizeSaleClick = () => {
    if (items.length === 0) return;
    setShowPaymentModal(true);
  };

  const confirmSale = async () => {
    setLoading(true);
    try {
      const paymentData = {
          method: paymentMethod,
          installments: paymentMethod === PaymentMethod.CREDIT_CARD ? installments : 1
      };

      if (quoteId) {
        // Confirm existing quote
        await salesService.confirmSale(quoteId, {
            ...paymentData,
            salesChannel: selectedChannel,
        });
    } else {
        // Create new sale
        const saleData = {
          customerId: selectedCustomer?.id || null,
          salesChannel: selectedChannel,
          items: items.map(item => ({
            ...item,
            pricingFactors: {
              pricePerGram: materials.find(m => m.id === item.materialId)?.pricePerGram || 0.1,
              pricePerHour: printers.find(p => p.id === item.printerId)?.hourlyRate || 5,
              profitMargin: printers.find(p => p.id === item.printerId)?.profitMargin || 1.3
            }
          })),
            discount,
            isDirectSale: true,
            payment: paymentData
          };
          await api.post('/sales', saleData);
      }
      
      toast.success('Venda finalizada com sucesso!');
      setItems([]);
      setDiscount(0);
      setSelectedCustomer(undefined);
    setShowPaymentModal(false);
    setPaymentMethod(PaymentMethod.CASH);
    setInstallments(1);
    setSelectedChannel('LOJA_FISICA');
      
      if (quoteId) {
          router.push('/vendas');
      }
    } catch (err) {
      console.error('Error finalizing sale:', err);
      toast.error('Erro ao finalizar venda');
    } finally {
      setLoading(false);
    }
  };

  const addManualItem = () => {
    const defaultMaterial = materials[0] || { id: '', name: 'Material Padrão', pricePerGram: 0.1 };
    const defaultPrinter = printers[0] || { id: '', name: 'Impressora Padrão', profitMargin: 1.3, hourlyRate: 5 };
    
    const newItem = {
      id: Date.now(),
      type: 'MANUAL',
      name: `Item Avulso #${items.length + 1}`,
      materialId: defaultMaterial.id || '',
      printerId: defaultPrinter.id || '',
      weight: 50,
      printTime: 60,
      quantity: 1,
      unitPrice: 0,
      accessories: [],
    };

    newItem.unitPrice = calculatePrice(newItem, defaultMaterial, defaultPrinter);
    setItems([...items, newItem]);
  };

  const addFromCatalog = (product: any) => {
    const material = materials.find(m => m.id === product.defaultMaterial?.id) || materials[0];
    const defaultPrinter = printers[0] || { id: '', profitMargin: 1.3, hourlyRate: 5 };
    
    const newItem = {
      id: Date.now(),
      type: 'CATALOG',
      productId: product.id,
      name: product.name,
      materialId: material?.id || '',
      printerId: defaultPrinter.id || '',
      weight: Number(product.weightGrams),
      printTime: Number(product.printTimeMinutes),
      quantity: 1,
      unitPrice: 0,
      accessories: [],
    };

    newItem.unitPrice = calculatePrice(newItem, material, defaultPrinter);
    setItems([...items, newItem]);
    setShowCatalogModal(false);
  };

  const handleFileUpload = (fileData: any) => {
    const defaultMaterial = materials[0] || { id: '', pricePerGram: 0.1 };
    const defaultPrinter = printers[0] || { id: '', profitMargin: 1.3, hourlyRate: 5 };
    
    const newItem = {
      id: Date.now() + Math.random(), // Ensure uniqueness during rapid uploads
      type: 'FILE',
      name: fileData.originalname,
      materialId: defaultMaterial.id || '',
      printerId: defaultPrinter.id || '',
      weight: fileData.metadata?.filamentWeightGrams || 50,
      printTime: fileData.metadata?.printTimeSeconds ? Math.round(fileData.metadata.printTimeSeconds / 60) : 120,
      quantity: 1,
      unitPrice: 0,
      fileId: fileData.filename,
      accessories: [],
    };

    newItem.unitPrice = calculatePrice(newItem, defaultMaterial, defaultPrinter);
    setItems(prev => [...prev, newItem]);
  };

  const calculatePrice = (item: any, material: any, printer: any) => {
    const materialCost = item.weight * (material?.pricePerGram || 0.1);
    const timeCost = (item.printTime / 60) * (printer?.hourlyRate || 5);
    const baseCost = materialCost + timeCost;
    return baseCost * (printer?.profitMargin || 1.3);
  };

  const updateItem = (itemId: number, updates: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...updates };
        const material = materials.find(m => m.id === updatedItem.materialId);
        const printer = printers.find(p => p.id === updatedItem.printerId);
        updatedItem.unitPrice = calculatePrice(updatedItem, material, printer);
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addAccessoryToItem = (itemId: number, accessory: any, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const existingAcc = item.accessories.find((a: any) => a.id === accessory.id);
        if (existingAcc) {
          return {
            ...item,
            accessories: item.accessories.map((a: any) =>
              a.id === accessory.id ? { ...a, quantity: a.quantity + quantity } : a
            ),
          };
        } else {
          return {
            ...item,
            accessories: [...item.accessories, { ...accessory, quantity }],
          };
        }
      }
      return item;
    }));
  };

  const removeAccessoryFromItem = (itemId: number, accessoryId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          accessories: item.accessories.filter((a: any) => a.id !== accessoryId),
        };
      }
      return item;
    }));
  };

  const updateAccessoryQuantity = (itemId: number, accessoryId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          accessories: item.accessories.map((a: any) =>
            a.id === accessoryId ? { ...a, quantity: newQuantity } : a
          ),
        };
      }
      return item;
    }));
    setEditingAccessory(null);
  };

  const calculateItemTotal = (item: any) => {
    const itemTotal = item.unitPrice * item.quantity;
    const accessoriesTotal = (item.accessories || []).reduce((sum: number, acc: any) => 
      sum + (acc.unitPrice * acc.quantity), 0
    );
    return itemTotal + accessoriesTotal;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const total = Math.max(0, subtotal - discount);

  const getPaymentIcon = (method: PaymentMethod) => {
      switch (method) {
          case PaymentMethod.CREDIT_CARD: return <CreditCard size={24} />;
          case PaymentMethod.DEBIT_CARD: return <CreditCard size={24} />;
          case PaymentMethod.PIX: return <QrCode size={24} />;
          case PaymentMethod.CASH: return <Banknote size={24} />;
          case PaymentMethod.SHOPEE: return <ShoppingBag size={24} />;
          default: return <Banknote size={24} />;
      }
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return `${baseUrl}${path}`.replace('/api/uploads', '/uploads');
  };

  const filteredCatalogProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category?.id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Header (Industrial Loft Style) */}
      <div className="mb-10 px-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
            Nova Venda <span className="text-emerald-500">/</span> Orçamento
        </h1>
        <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-emerald-500 rounded-full"></div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Workflow de Gestão Profissional</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection (Industrial Card) */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-100 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Identificação do Cliente <span className="text-slate-200">(Opcional)</span></label>
            <div className="relative">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <Search size={20} className="text-slate-400" />
                    <input
                        type="text"
                        placeholder="Pesquisar registro de cliente..."
                        className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300"
                        value={selectedCustomer ? selectedCustomer.name : searchTerm}
                        onChange={(e) => {
                            if (selectedCustomer) setSelectedCustomer(null);
                            setSearchTerm(e.target.value);
                        }}
                    />
                     {(selectedCustomer || searchTerm) && (
                        <button 
                            onClick={() => {
                                setSelectedCustomer(null);
                                setSearchTerm('');
                            }} 
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                
                {/* Search Results Dropdown */}
                {!selectedCustomer && searchTerm && (
                    <div className="mt-3 max-h-60 overflow-y-auto border border-slate-100 rounded-2xl bg-white shadow-2xl absolute w-full z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                        {filteredCustomers.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => {
                                    setSelectedCustomer(c);
                                    setSearchTerm('');
                                }}
                                className="px-5 py-3 hover:bg-slate-50 cursor-pointer text-sm font-bold text-slate-700 rounded-xl transition-colors mb-1 last:mb-0"
                            >
                                {c.name}
                            </div>
                        ))}
                         {filteredCustomers.length === 0 && (
                             <div className="px-5 py-5 text-xs text-slate-400 font-bold text-center uppercase tracking-widest">Nenhum registro encontrado</div>
                         )}
                    </div>
                )}
            </div>
          </div>

          {/* Add Item Selection (Refined industrial style) */}
          <div className="grid grid-cols-3 gap-8 items-stretch">
            <button
              onClick={() => setShowCatalogModal(true)}
              className="h-full bg-white hover:bg-slate-50 border border-slate-100 rounded-[32px] p-6 transition-all group flex flex-col items-center text-center gap-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-95 border-b-4 border-b-indigo-500/20"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all duration-500 group-hover:rotate-3 shadow-inner">
                <Printer size={24} strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <span className="block font-black text-slate-900 text-[11px] uppercase tracking-tight leading-none">Ativos de Catálogo</span>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed max-w-[140px] uppercase">Busque peças e materiais pré-configurados.</p>
              </div>
            </button>
 
            <div className="relative h-full">
              <FileUpload
                onUploadSuccess={handleFileUpload}
                accept=".stl,.gcode,.obj,.3mf"
                maxSize={50}
              >
                <div className="h-full bg-white hover:bg-slate-50 border border-slate-100 rounded-[32px] p-6 transition-all group flex flex-col items-center text-center gap-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:shadow-purple-500/10 active:scale-95 cursor-pointer border-b-4 border-b-purple-500/20">
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition-all duration-500 group-hover:-rotate-3 shadow-inner">
                    <CloudDownload size={24} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5">
                    <span className="block font-black text-slate-900 text-[11px] uppercase tracking-tight leading-none">Importar do Disco</span>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed max-w-[140px] uppercase">Faça upload de seus arquivos STL ou CAD.</p>
                  </div>
                </div>
              </FileUpload>
            </div>
 
            <button
              onClick={addManualItem}
              className="h-full bg-white hover:bg-slate-50 border border-slate-100 rounded-[32px] p-6 transition-all group flex flex-col items-center text-center gap-4 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-95 border-b-4 border-b-emerald-500/20"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-all duration-500 group-hover:rotate-3 shadow-inner">
                <Wrench size={24} strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <span className="block font-black text-slate-900 text-[11px] uppercase tracking-tight leading-none">Entrada Manual</span>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed max-w-[140px] uppercase">Insira especificações e solicitações customizadas.</p>
              </div>
            </button>
          </div>

          {/* Items List (Industrial Cards) */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-3xl p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight">{item.name}</h3>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-indigo-300 transition-colors" title="Ajuste de peso de carga">
                        <input
                            type="number"
                            min="0"
                            value={item.weight}
                            onChange={(e) => updateItem(item.id, { weight: Number(e.target.value) })}
                            className="w-10 bg-transparent outline-none text-xs text-right font-black text-slate-800 p-0 border-none focus:ring-0"
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase">g</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 hover:border-indigo-300 transition-colors" title="Tempo estimado de produção">
                        <input
                            type="number"
                            min="0"
                            value={item.printTime}
                            onChange={(e) => updateItem(item.id, { printTime: Number(e.target.value) })}
                            className="w-10 bg-transparent outline-none text-xs text-right font-black text-slate-800 p-0 border-none focus:ring-0"
                        />
                        <span className="text-[10px] font-black text-slate-400 uppercase">min</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Material Base</label>
                    <div className="relative group">
                        <select
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, { materialId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hardware Alocado</label>
                    <div className="relative group">
                        <select
                          value={item.printerId}
                          onChange={(e) => updateItem(item.id, { printerId: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none"
                        >
                          {printers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                  <div className="w-full md:w-32 space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Volume</label>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl px-1 py-1 flex items-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: Number(e.target.value) })}
                          className="w-full bg-transparent px-4 py-2 text-sm font-black text-slate-800 focus:ring-0 outline-none text-center"
                        />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Investimento Unitário</label>
                    <div className="px-5 py-3 text-sm bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600 flex items-center justify-between">
                      <span className="text-[10px] opacity-70">VALOR PADRÃO</span>
                      R$ {Number(item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Accessories (Industrial Subcard) */}
                {item.accessories.length > 0 && (
                  <div className="mb-6 p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Plus size={10} className="text-emerald-500" /> Componentes Adicionais
                    </div>
                    <div className="space-y-2">
                      {item.accessories.map((acc: any) => (
                        <div key={acc.id} className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200">
                          {editingAccessory?.itemId === item.id && editingAccessory?.accessoryId === acc.id ? (
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-xs font-bold text-slate-700 truncate">{acc.name || acc.accessory?.name}</span>
                                <div className="flex items-center gap-2 ml-auto">
                                    <input 
                                        type="number" 
                                        min="1"
                                        className="w-14 px-2 py-1 bg-slate-50 border border-indigo-200 rounded-lg text-center outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-black"
                                        value={editAccessoryQty}
                                        onChange={(e) => setEditAccessoryQty(Number(e.target.value))}
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => updateAccessoryQuantity(item.id, acc.id, editAccessoryQty)}
                                        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
                                    >
                                        <Check size={14} />
                                    </button>
                                    <button
                                        onClick={() => setEditingAccessory(null)}
                                        className="p-1.5 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-lg transition-all"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                          ) : (
                            <>
                                <span className="text-xs font-bold text-slate-700">{acc.name || acc.accessory?.name} <span className="text-indigo-500 text-[10px] ml-2">({acc.quantity}x)</span></span>
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-slate-900 text-xs">
                                    R$ {(acc.unitPrice * acc.quantity).toFixed(2)}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingAccessory({ itemId: item.id, accessoryId: acc.id });
                                                setEditAccessoryQty(acc.quantity);
                                            }}
                                            className="p-1.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                        onClick={() => removeAccessoryFromItem(item.id, acc.id)}
                                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-all"
                                        >
                                        <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
                  <button
                    onClick={() => {
                      setSelectedItemForAccessories(item);
                      setShowAccessoriesModal(true);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                  >
                    <Plus size={14} className="text-emerald-400" />
                    Acrescentar Componente
                  </button>
                  <div className="text-right w-full sm:w-auto px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Subtotal Alocado</div>
                    <div className="text-xl font-black text-slate-900 tracking-tight">
                      R$ {calculateItemTotal(item).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

            {items.length === 0 && (
              <div className="bg-slate-50 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200/50">
                    <ShoppingBag className="text-slate-200" size={48} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">Checkout Vazio</h3>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Selecione ativos do catálogo ou importe arquivos</p>
              </div>
            )}
          </div>

        {/* Right Column - Summary (Bento Style) */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-100 sticky top-10 flex flex-col gap-6">
            <div>
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    Resumo do Pedido
                </h2>
                
                <div className="space-y-4 pb-6 border-b border-slate-100">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Subtotal Bruto</span>
                        <span className="font-bold text-slate-900">R$ {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Desconto Estratégico</label>
                        <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                            <input
                                type="number"
                                min="0"
                                value={discount}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-full px-4 py-2 bg-transparent text-slate-900 font-bold outline-none text-sm placeholder:text-slate-300"
                                placeholder="0.00"
                            />
                            <div className="px-4 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 text-[10px] font-black uppercase">
                                R$
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Investimento Total</span>
              <div className="text-right">
                <span className="text-3xl font-black text-indigo-600 tracking-tighter">R$ {total.toFixed(2)}</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cálculo de Margem Preciso</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={generatePdf}
                disabled={items.length === 0 || loading}
                className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 shadow-sm active:scale-95"
              >
                <FileText size={16} className="text-indigo-500" />
                {loading ? 'Gerando Documento...' : 'Gerar Proposta PDF'}
              </button>

              <button
                onClick={handleSaveQuote}
                disabled={items.length === 0 || loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all disabled:opacity-40 disabled:grayscale shadow-lg shadow-indigo-600/10 active:scale-95"
              >
                {loading ? 'Processando...' : 'Salvar como Orçamento'}
              </button>

              <button
                onClick={handleFinalizeSaleClick}
                disabled={items.length === 0 || loading}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:grayscale shadow-lg shadow-emerald-600/10 active:scale-105 active:rotate-1"
              >
                {loading ? 'Finalizando...' : 'Concluir Venda Direta'}
              </button>
            </div>

            {/* Micro-incentive */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    Toda venda registra um <span className="text-emerald-500">snapshot financeiro</span> permanente no banco de dados.
                </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Modal (Premium Glass) */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
          <div className="glass-card max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Seleção de Ativos</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Busque itens prontos no seu catálogo</p>
              </div>
              <button 
                onClick={() => {
                  setShowCatalogModal(false);
                  setCatalogSearch('');
                  setSelectedCategory('all');
                }} 
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Filters */}
            <div className="p-6 bg-slate-900/30 border-b border-white/5 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Pesquisar produto..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600 font-bold text-sm"
                />
              </div>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-950/50 border border-white/5 rounded-xl pl-12 pr-10 py-3 text-white focus:border-emerald-500/50 outline-none transition-all appearance-none font-bold text-sm min-w-[200px]"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalogProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      addFromCatalog(product);
                      setCatalogSearch('');
                      setSelectedCategory('all');
                    }}
                    className="stat-card p-0 group overflow-hidden border-white/5 hover:border-emerald-500/30 cursor-pointer transition-all duration-300"
                  >
                    <div className="relative h-40 bg-slate-950/50 flex items-center justify-center overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={getImageUrl(product.imageUrl) || ''} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 opacity-20">
                          <Layers size={32} className="text-white" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white">Sem Imagem</span>
                        </div>
                      )}
                      
                      {product.category && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/80 backdrop-blur rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10" style={{ color: product.category.color || '#10b981' }}>
                          {product.category.name}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase text-sm truncate mb-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-black">
                          <Plus size={10} className="text-emerald-500" /> {product.weightGrams}g
                        </div>
                        <div className="text-[10px] text-slate-500 font-black">
                          {product.printTimeMinutes}m
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredCatalogProducts.length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                    <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
                    <p className="font-bold">Nenhum produto encontrado nesta combinação.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal (Premium V2.0) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-in fade-in duration-300">
          <div className="glass-card max-w-xl w-full border-white/10 shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden flex flex-col p-0">
            {/* Modal Header */}
            <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/5 px-8 py-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Finalizar Operação</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-0.5 w-6 bg-emerald-500 rounded-full"></div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Snapshot Financeiro e Checkout</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                {/* Sales Channel Selection */}
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Canal de Escoamento</label>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedChannel('LOJA_FISICA')}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border ${
                                selectedChannel === 'LOJA_FISICA'
                                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                                    : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                        >
                            LOJA FÍSICA
                        </button>
                        {Object.keys(storeSettings?.finance?.marketplace || {}).map(channel => (
                            <button
                                key={channel}
                                onClick={() => setSelectedChannel(channel)}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all border ${
                                    selectedChannel === channel
                                        ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                                        : 'bg-slate-900/50 text-slate-400 border-white/5 hover:border-white/10'
                                }`}
                            >
                                {channel.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Forma de Liquidação</label>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.values(PaymentMethod).map((method) => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className={`flex items-center gap-3 p-4 border rounded-2xl transition-all group ${
                                    paymentMethod === method
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                        : 'border-white/5 bg-slate-900/30 text-slate-400 hover:border-white/10 hover:bg-slate-900/50'
                                }`}
                            >
                                <div className={`p-2 rounded-lg transition-colors ${
                                    paymentMethod === method ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'
                                }`}>
                                    {getPaymentIcon(method)}
                                </div>
                                <span className="text-xs font-black uppercase tracking-tight">
                                    {method === PaymentMethod.CREDIT_CARD && 'Cartão Crédito'}
                                    {method === PaymentMethod.DEBIT_CARD && 'Cartão Débito'}
                                    {method === PaymentMethod.PIX && 'PIX instantâneo'}
                                    {method === PaymentMethod.CASH && 'Dinheiro Vivo'}
                                    {method === PaymentMethod.BANK_TRANSFER && 'Transferência'}
                                    {method === PaymentMethod.SHOPEE && 'Wallet Shopee'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Financial Snapshot Logic & UI */}
                {(() => {
                    const settingsFinance = storeSettings?.finance || {};
                    let adjustmentText = '';
                    let finalAmount = total;

                    if (paymentMethod === PaymentMethod.PIX && settingsFinance.paymentMethods?.pix?.discount) {
                        const discountRate = settingsFinance.paymentMethods.pix.discount;
                        finalAmount = total * (1 - discountRate / 100);
                        adjustmentText = `Incentivo PIX (${discountRate}%)`;
                    } else if (paymentMethod === PaymentMethod.CREDIT_CARD) {
                         const plans = settingsFinance.paymentMethods?.creditCard?.installments || [];
                         const selectedPlan = plans.find((p: any) => p.count === installments);
                         if (selectedPlan && selectedPlan.rate > 0) {
                             finalAmount = total * (1 + selectedPlan.rate / 100);
                             adjustmentText = `Taxa Adm. (${selectedPlan.rate}%)`;
                         }
                    }

                    const mkt = storeSettings?.finance?.marketplace?.[selectedChannel] || { commission: 0, fixedFee: 0 };
                    const mktTotal = (finalAmount * (mkt.commission / 100)) + mkt.fixedFee;
                    const netValue = finalAmount - mktTotal;

                    return (
                        <div className="space-y-6">
                            {paymentMethod === PaymentMethod.CREDIT_CARD && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Plano de Parcelamento</label>
                                    <div className="relative group">
                                        <select
                                            value={installments}
                                            onChange={(e) => setInstallments(Number(e.target.value))}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none"
                                        >
                                            <option value={1} className="bg-slate-900">1x de R$ {total.toFixed(2)} (Sem juros)</option>
                                            {(settingsFinance.paymentMethods?.creditCard?.installments || []).map((plan: any) => {
                                                 const amountWithRate = total * (1 + plan.rate / 100);
                                                 return (
                                                    <option key={plan.count} value={plan.count} className="bg-slate-900 font-bold">
                                                        {plan.count}x de R$ {(amountWithRate / plan.count).toFixed(2)} {plan.rate > 0 ? `(${plan.rate}% juros)` : ''}
                                                    </option>
                                                 );
                                            })}
                                        </select>
                                        <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 rotate-90" />
                                    </div>
                                </div>
                            )}

                            {/* Verification Snapshot Card */}
                            <div className="bg-slate-950/60 border border-white/5 rounded-[32px] p-8 space-y-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <CreditCard size={120} strokeWidth={1} className="text-white" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-1">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Investimento Cliente</span>
                                        <div className="flex flex-col">
                                            <span className="text-3xl font-black text-white tracking-tighter">
                                                R$ {finalAmount.toFixed(2)}
                                            </span>
                                            {adjustmentText && (
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-1">
                                                    {adjustmentText}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1 border-l border-white/5 pl-8">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Lucro Líquido Real</span>
                                        <div className="flex flex-col text-right sm:text-left">
                                            <span className="text-3xl font-black text-emerald-500 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                R$ {netValue.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                                Snapshot Gerado
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Breakdown */}
                                {(mktTotal > 0 || adjustmentText) && (
                                    <div className="pt-6 border-t border-white/5 grid grid-cols-1 gap-3 relative z-10">
                                        {mktTotal > 0 && (
                                            <div className="flex justify-between items-center bg-white/2 px-4 py-2.5 rounded-xl border border-white/5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Taxas do Canal ({selectedChannel})</span>
                                                    <span className="text-[8px] text-slate-600 font-bold uppercase mt-1 italic tracking-tight">
                                                        {mkt.commission}% comissão + R$ {mkt.fixedFee.toFixed(2)} fixa
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black text-rose-400">- R$ {mktTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

            </div>

            {/* Modal Footer (Action) */}
            <div className="p-8 bg-slate-900/50 border-t border-white/5">
                <button
                    onClick={confirmSale}
                    className="w-full py-5 bg-emerald-600 text-slate-950 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3 group"
                >
                    <Check size={20} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
                    Confirmar e Gerar Snapshot
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessories Modal */}
      {showAccessoriesModal && selectedItemForAccessories && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="p-8 pt-10 border-b border-slate-50 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Adicionar Acessórios</h2>
                <div className="flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-indigo-500 rounded-full"></div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Personalização e Upgrade de Ativos</p>
                </div>
              </div>
              <button 
                onClick={() => {
                    setShowAccessoriesModal(false);
                    setAccessorySearch('');
                }} 
                className="w-10 h-10 border border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Search size={20} />
                  </div>
                  <input
                      type="text"
                      placeholder="Pesquisar acessórios em estoque..."
                      value={accessorySearch}
                      onChange={(e) => setAccessorySearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-100 rounded-[24px] font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 transition-all outline-none shadow-inner"
                      autoFocus
                  />
              </div>

              {!accessorySearch && topAccessories.length > 0 && (
                  <div>
                      <div className="flex items-center gap-3 mb-4">
                          <span className="flex px-2 py-0.5 items-center justify-center rounded-md bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest">Top</span>
                          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Mais Utilizados</h3>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                          {topAccessories.map((acc: any, index: number) => (
                              <button
                                  key={`top-${acc.id || index}`}
                                  onClick={() => {
                                      addAccessoryToItem(selectedItemForAccessories.id, acc, 1);
                                      setAccessorySearch('');
                                  }}
                                  className="flex-shrink-0 flex flex-col items-start p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-500 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all group min-w-[160px] active:scale-95"
                              >
                                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                                      <Plus size={16} />
                                  </div>
                                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight line-clamp-1 mb-1">{acc.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-auto">R$ {Number(acc.unitPrice).toFixed(2)}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              )}

              <div>
                  <div className="flex items-center gap-3 mb-4">
                      <span className="flex px-2 py-0.5 items-center justify-center rounded-md bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">Alt</span>
                      <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Todos no Estoque</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredAccessories.map((accessory) => (
                      <div
                        key={accessory.id}
                        className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                            <Layers size={18} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{accessory.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Unitário: R$ {Number(accessory.unitPrice).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <input
                                type="number"
                                min="1"
                                className="w-20 pl-3 pr-8 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-black text-slate-900 transition-all"
                                placeholder="0"
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    const qty = Number(e.target.value);
                                    setAccessoryQuantities(prev => ({...prev, [accessory.id]: qty}));
                                }}
                                value={accessoryQuantities[accessory.id] || 1}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Un</span>
                          </div>
                          <button
                              onClick={() => {
                                  addAccessoryToItem(selectedItemForAccessories.id, accessory, accessoryQuantities[accessory.id] || 1);
                                  setAccessorySearch('');
                                  setAccessoryQuantities({});
                              }}
                              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
                          >
                              Adicionar
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {filteredAccessories.length === 0 && (
                        <div className="text-center py-16 px-4 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mx-auto mb-4">
                                <Search size={24} />
                            </div>
                            <div className="text-[11px] font-black text-slate-900 uppercase tracking-[0.22em] mb-1">Nenhum Registro</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verifique os termos de busca ou o nível de estoque.</div>
                        </div>
                    )}
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaixaPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Iniciando Checkout...</p>
            </div>
        </div>
    }>
      <CaixaContent />
    </Suspense>
  );
}
