"use client";

import React, { useState, useEffect, useCallback, useRef, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Calendar, User, MessageSquare, Paperclip,
  X, AlertCircle, Clock, CheckCircle2, Upload, ShoppingCart,
  Image as ImageIcon, Filter, ChevronRight, Zap, FileText,
  ArrowRight, Timer, AlertTriangle, Eye, GripVertical,
  Layers, BarChart3, Flag, RefreshCw, Archive,
} from 'lucide-react';
import { modelingService } from '@/services/modeling.service';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ModelingStatus, ModelingPriority, ModelingType,
  ModelingPurpose, DetailLevel,
} from '@/lib/enums/modeling.enums';
import ModelingDetails from './components/ModelingDetails';

// ─── Column Config ────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    id: ModelingStatus.BRIEFING,
    label: 'Briefing',
    icon: FileText,
    color: 'text-slate-400',
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/10',
    dot: 'bg-slate-400',
  },
  {
    id: ModelingStatus.ANALYSIS,
    label: 'Análise',
    icon: BarChart3,
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    dot: 'bg-indigo-400',
  },
  {
    id: ModelingStatus.MODELING,
    label: 'Modelando',
    icon: Layers,
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    dot: 'bg-blue-400 animate-pulse',
  },
  {
    id: ModelingStatus.REVIEW,
    label: 'Revisão',
    icon: Eye,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-400',
  },
  {
    id: ModelingStatus.ADJUSTMENTS,
    label: 'Ajustes',
    icon: RefreshCw,
    color: 'text-orange-400',
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    dot: 'bg-orange-400',
  },
  {
    id: ModelingStatus.APPROVED,
    label: 'Aprovado',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-400',
  },
  {
    id: ModelingStatus.ARCHIVED,
    label: 'Finalizado',
    icon: Archive,
    color: 'text-slate-500',
    border: 'border-slate-600/30',
    bg: 'bg-slate-600/10',
    dot: 'bg-slate-500',
  },
];

// ─── Priority Config ──────────────────────────────────────────────────────────
const PRIORITY_CFG = {
  HIGH:   { label: 'Alta',  color: 'text-rose-400',   bg: 'bg-rose-500/15 border-rose-500/30',   icon: '🔴' },
  MEDIUM: { label: 'Média', color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30', icon: '🟡' },
  LOW:    { label: 'Baixa', color: 'text-slate-400',  bg: 'bg-slate-500/15 border-slate-500/30', icon: '🟢' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOverdue(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function daysUntil(deadline?: string): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

function timeInStage(updatedAt?: string): string {
  if (!updatedAt) return '';
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days > 0) return `${days}d na etapa`;
  return `${hours}h na etapa`;
}

// ─── Step Form Steps ──────────────────────────────────────────────────────────
const FORM_STEPS = ['Básico', 'Detalhes', 'Referências'];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ModelagemPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [formStep, setFormStep] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Drag
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    id: null as string | null,
    title: '',
    description: '',
    customerId: '',
    deadline: '',
    priority: 'MEDIUM',
    modelingType: 'PRODUCT',
    modelingPurpose: 'PRINT_3D',
    detailLevel: 'MEDIUM',
    dimensions: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const data = await modelingService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let requestId = formData.id;
      if (requestId) {
        await modelingService.updateRequest(requestId, formData);
      } else {
        const { id, ...createData } = formData;
        const newRequest = await modelingService.createRequest(createData);
        requestId = newRequest.id;
      }
      if (requestId && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const fd = new FormData();
          fd.append('file', file);
          await api.post(`/modeling/${requestId}/upload`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
      await loadRequests();
      setShowModal(false);
      resetForm();
      toast.success(formData.id ? 'Pedido atualizado!' : 'Pedido criado!');
    } catch (err) {
      toast.error('Erro ao salvar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await modelingService.updateStatus(requestId, newStatus);
      await loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConvertToSale = async (requestId: string) => {
    if (!confirm('Converter em venda?')) return;
    try {
      const sale = await api.post(`/modeling/${requestId}/convert-to-sale`);
      toast.success('Venda criada!');
      await loadRequests();
      router.push(`/caixa?saleId=${sale.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao converter');
    }
  };

  const resetForm = () => {
    setFormData({ id: null, title: '', description: '', customerId: '', deadline: '', priority: 'MEDIUM', modelingType: 'PRODUCT', modelingPurpose: 'PRINT_3D', detailLevel: 'MEDIUM', dimensions: '' });
    setSelectedFiles([]);
    setFilePreviews([]);
    setFormStep(0);
  };

  const openModal = (request?: any) => {
    if (request) {
      setFormData({
        id: request.id,
        title: request.title,
        description: request.description,
        customerId: request.customer?.id || '',
        deadline: request.deadline ? new Date(request.deadline).toISOString().split('T')[0] : '',
        priority: request.priority,
        modelingType: request.modelingType || 'PRODUCT',
        modelingPurpose: request.modelingPurpose || 'PRINT_3D',
        detailLevel: request.detailLevel || 'MEDIUM',
        dimensions: request.dimensions || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    setSelectedFiles(arr);
    const previews = arr.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : ''));
    setFilePreviews(previews);
  };

  // Drag and Drop
  const handleDragStart = (e: DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDrop = async (e: DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (draggingId && draggingId !== colId) {
      await handleStatusChange(draggingId, colId);
    }
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  // Filters
  const filtered = requests.filter((r) => {
    if (searchTerm && !r.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterPriority && r.priority !== filterPriority) return false;
    if (filterOverdue && !isOverdue(r.deadline)) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const getColumnItems = (status: string) => filtered.filter((r) => r.status === status);
  const overdueCount = requests.filter((r) => isOverdue(r.deadline) && r.status !== ModelingStatus.APPROVED && r.status !== ModelingStatus.ARCHIVED).length;
  const activeRequest = requests.find((r) => r.id === selectedRequestId);

  return (
    <div className="flex flex-col h-full gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-indigo-400" />
            Pipeline de Modelagem
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Fluxo de trabalho para pedidos de modelagem 3D
          </p>
        </div>
        <div className="flex items-center gap-3">
          {overdueCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-black uppercase tracking-widest">
              <AlertTriangle size={12} />
              {overdueCount} atrasado{overdueCount > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => openModal()}
            className="btn-premium !py-2 !px-5 text-[11px]"
          >
            <Plus size={15} />
            Novo Pedido
          </button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-8 py-2 text-sm"
          />
        </div>

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="glass-input py-2 text-xs text-slate-300"
        >
          <option value="">Todas as prioridades</option>
          <option value="HIGH">🔴 Alta</option>
          <option value="MEDIUM">🟡 Média</option>
          <option value="LOW">🟢 Baixa</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-input py-2 text-xs text-slate-300"
        >
          <option value="">Todas as etapas</option>
          {COLUMNS.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Overdue toggle */}
        <button
          onClick={() => setFilterOverdue(!filterOverdue)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
            filterOverdue
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : 'bg-white/3 border-white/8 text-slate-500 hover:text-slate-300'
          }`}
        >
          <AlertCircle size={12} />
          Atrasados
        </button>

        <div className="ml-auto text-[10px] text-slate-600 font-medium">
          {filtered.length} pedido{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Kanban Board ───────────────────────────────────────── */}
      <div className="flex gap-3 overflow-x-auto pb-2 flex-1 min-h-0">
        {COLUMNS.map((col) => {
          const items = getColumnItems(col.id);
          const ColIcon = col.icon;
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[280px] flex flex-col"
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border mb-3 ${col.bg} ${col.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
                <ColIcon size={13} className={col.color} />
                <span className={`text-[11px] font-black uppercase tracking-widest ${col.color}`}>{col.label}</span>
                <span className="ml-auto text-[10px] font-black text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-md">
                  {items.length}
                </span>
              </div>

              {/* Drop zone */}
              <div className={`flex-1 space-y-2.5 min-h-[120px] rounded-xl transition-all duration-200 p-1 ${isOver ? 'bg-white/5 border border-dashed border-white/20' : ''}`}>
                {items.map((req) => (
                  <KanbanCard
                    key={req.id}
                    request={req}
                    onOpen={() => setSelectedRequestId(req.id)}
                    onConvert={handleConvertToSale}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingId === req.id}
                  />
                ))}

                {items.length === 0 && !isOver && (
                  <div className="flex items-center justify-center h-20 border border-dashed border-white/5 rounded-xl">
                    <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">Vazio</p>
                  </div>
                )}

                {isOver && (
                  <div className="h-14 border-2 border-dashed border-indigo-500/40 rounded-xl flex items-center justify-center">
                    <ArrowRight size={14} className="text-indigo-400" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="glass-card !p-0 max-w-xl w-full border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/5">
              <div>
                <h2 className="text-lg font-black text-white">
                  {formData.id ? 'Editar Pedido' : 'Novo Pedido de Modelagem'}
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 uppercase font-bold tracking-widest">
                  Etapa {formStep + 1} de {FORM_STEPS.length} — {FORM_STEPS[formStep]}
                </p>
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-0 px-7 pt-5">
              {FORM_STEPS.map((step, i) => (
                <React.Fragment key={step}>
                  <button
                    onClick={() => i < formStep || formData.title ? setFormStep(i) : null}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      i === formStep
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : i < formStep
                        ? 'text-emerald-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {i < formStep ? <CheckCircle2 size={11} /> : <span className="w-4 h-4 rounded-full bg-white/5 text-center leading-4">{i + 1}</span>}
                    {step}
                  </button>
                  {i < FORM_STEPS.length - 1 && <ChevronRight size={12} className="text-slate-700 mx-0.5" />}
                </React.Fragment>
              ))}
            </div>

            {/* Step Content */}
            <div className="overflow-y-auto flex-1 px-7 py-5 space-y-5">
              {/* Step 0: Básico */}
              {formStep === 0 && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título do Pedido *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="glass-input w-full font-bold text-sm"
                      placeholder="Ex: Chaveiro Logo Empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição / Briefing</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="glass-input w-full text-sm min-h-[100px] resize-none"
                      placeholder="Descreva detalhadamente o que deseja..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prazo</label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="glass-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prioridade</label>
                      <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="glass-input w-full text-sm">
                        <option value="LOW">🟢 Baixa</option>
                        <option value="MEDIUM">🟡 Média</option>
                        <option value="HIGH">🔴 Alta</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Step 1: Detalhes */}
              {formStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                      <select value={formData.modelingType} onChange={(e) => setFormData({ ...formData, modelingType: e.target.value })} className="glass-input w-full text-sm">
                        {Object.values(ModelingType).map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Finalidade</label>
                      <select value={formData.modelingPurpose} onChange={(e) => setFormData({ ...formData, modelingPurpose: e.target.value })} className="glass-input w-full text-sm">
                        {Object.values(ModelingPurpose).map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nível de Detalhe</label>
                      <select value={formData.detailLevel} onChange={(e) => setFormData({ ...formData, detailLevel: e.target.value })} className="glass-input w-full text-sm">
                        {Object.values(DetailLevel).map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dimensões</label>
                      <input
                        type="text"
                        value={formData.dimensions}
                        onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                        className="glass-input w-full text-sm"
                        placeholder="Ex: 10x10x20cm"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Referências */}
              {formStep === 2 && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Imagens de Referência</label>

                  {/* Drop Zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-xl p-8 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center">
                      <Upload size={22} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-300">Arraste ou clique para enviar</p>
                      <p className="text-[10px] text-slate-600 mt-1">PNG, JPG, WEBP — máx 10MB cada</p>
                    </div>
                    <input ref={fileInputRef} type="file" multiple accept="image/*,.stl,.obj" className="hidden" onChange={(e) => handleFileSelect(e.target.files)} />
                  </div>

                  {/* Preview Grid */}
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {selectedFiles.map((file, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 bg-white/3 aspect-square flex items-center justify-center">
                          {filePreviews[i] ? (
                            <img src={filePreviews[i]} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <FileText size={20} className="text-slate-500" />
                              <span className="text-[8px] text-slate-600 truncate px-1 w-full text-center">{file.name}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setSelectedFiles((f) => f.filter((_, j) => j !== i));
                              setFilePreviews((f) => f.filter((_, j) => j !== i));
                            }}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-black/70 rounded-lg transition-opacity"
                          >
                            <X size={10} className="text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-7 py-5 border-t border-white/5">
              <button
                onClick={() => formStep > 0 ? setFormStep(formStep - 1) : (setShowModal(false), resetForm())}
                className="px-5 py-2.5 bg-white/5 text-slate-400 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/8"
              >
                {formStep === 0 ? 'Cancelar' : 'Voltar'}
              </button>

              {formStep < FORM_STEPS.length - 1 ? (
                <button
                  onClick={() => setFormStep(formStep + 1)}
                  disabled={!formData.title}
                  className="btn-premium !py-2.5 !px-6 text-[11px] disabled:opacity-40"
                >
                  Próximo <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading || !formData.title}
                  className="btn-premium !py-2.5 !px-6 text-[11px] disabled:opacity-40"
                >
                  {loading ? 'Salvando...' : formData.id ? 'Atualizar' : 'Criar Pedido'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Details Drawer ─────────────────────────────────────── */}
      {activeRequest && (
        <ModelingDetails
          request={activeRequest}
          onClose={() => setSelectedRequestId(null)}
          onUpdate={loadRequests}
        />
      )}
    </div>
  );
}

// ─── Kanban Card Component ────────────────────────────────────────────────────
function KanbanCard({
  request,
  onOpen,
  onConvert,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  request: any;
  onOpen: () => void;
  onConvert: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const pCfg = PRIORITY_CFG[request.priority as keyof typeof PRIORITY_CFG] ?? PRIORITY_CFG.MEDIUM;
  const overdue = isOverdue(request.deadline);
  const days = daysUntil(request.deadline);
  const stageTime = timeInStage(request.updatedAt);
  const isStuck = request.updatedAt && (Date.now() - new Date(request.updatedAt).getTime()) > 3 * 86400000;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, request.id)}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
        isDragging
          ? 'opacity-40 border-indigo-500/30 bg-indigo-500/5'
          : overdue
          ? 'border-rose-500/25 bg-rose-500/5 hover:border-rose-500/40'
          : 'border-white/8 bg-white/3 hover:border-white/16 hover:bg-white/5'
      }`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Drag handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-30 transition-opacity">
        <GripVertical size={14} className="text-slate-500" />
      </div>

      {/* Overdue / Stuck indicator */}
      {(overdue || isStuck) && (
        <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest mb-2 ${overdue ? 'text-rose-400' : 'text-amber-500'}`}>
          <AlertTriangle size={9} />
          {overdue ? 'Prazo vencido' : 'Parado há 3+ dias'}
        </div>
      )}

      {/* Priority + Deadline row */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[8px] font-black uppercase tracking-widest border rounded px-1.5 py-0.5 ${pCfg.bg} ${pCfg.color}`}>
          {pCfg.icon} {pCfg.label}
        </span>
        {request.deadline && (
          <span className={`text-[9px] font-bold flex items-center gap-1 ${overdue ? 'text-rose-400' : days !== null && days <= 2 ? 'text-amber-400' : 'text-slate-500'}`}>
            <Calendar size={9} />
            {days !== null ? (days < 0 ? `${Math.abs(days)}d atrás` : days === 0 ? 'hoje' : `${days}d`) : ''}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1">
        {request.title}
      </h3>

      {/* Description excerpt */}
      {request.description && (
        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mb-3 leading-relaxed">
          {request.description}
        </p>
      )}

      {/* Customer */}
      {request.customer && (
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-3">
          <User size={10} />
          {request.customer.name}
        </div>
      )}

      {/* Progress Bar (if in MODELING or ADJUSTMENTS) */}
      {(request.status === 'MODELING' || request.status === 'ADJUSTMENTS') && (
        <div className="mb-3">
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (request.attachments?.filter((a: any) => a.type === 'FINAL').length || 0) * 33)}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: files, messages, time */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-3 text-[9px] text-slate-600">
          {(request.attachments?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip size={10} />
              {request.attachments.length}
            </span>
          )}
          {(request.comments?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare size={10} />
              {request.comments.length}
            </span>
          )}
          {stageTime && (
            <span className="flex items-center gap-1 text-slate-700">
              <Timer size={10} />
              {stageTime}
            </span>
          )}
        </div>
        <ChevronRight size={13} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
      </div>

      {/* Convert to Sale */}
      {request.status === 'APPROVED' && (
        <button
          onClick={(e) => { e.stopPropagation(); onConvert(request.id); }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ShoppingCart size={12} />
          Converter em Venda
        </button>
      )}
    </div>
  );
}
