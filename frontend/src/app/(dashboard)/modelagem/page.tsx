"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Calendar,
  User,
  MessageSquare,
  Paperclip,
  X,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Archive,
  Upload,
  ShoppingCart,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { modelingService } from '@/services/modeling.service';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ModelingStatus, ModelingPriority, ModelingType, ModelingPurpose, DetailLevel } from '@/lib/enums/modeling.enums';
import ModelingDetails from './components/ModelingDetails';

const STATUS_COLUMNS = [
  { id: ModelingStatus.BRIEFING, label: 'Briefing', icon: AlertCircle, color: 'bg-slate-100 text-slate-700' },
  { id: ModelingStatus.ANALYSIS, label: 'Análise', icon: Search, color: 'bg-indigo-100 text-indigo-700' },
  { id: ModelingStatus.MODELING, label: 'Modelando', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  { id: ModelingStatus.REVIEW, label: 'Revisão', icon: MessageSquare, color: 'bg-amber-100 text-amber-700' },
  { id: ModelingStatus.ADJUSTMENTS, label: 'Ajustes', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  { id: ModelingStatus.APPROVED, label: 'Aprovado', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  { id: ModelingStatus.ARCHIVED, label: 'Arquivado', icon: Archive, color: 'bg-gray-100 text-gray-500' },
  { id: ModelingStatus.CANCELLED, label: 'Cancelado', icon: X, color: 'bg-red-100 text-red-700' },
];

const PRIORITY_COLORS = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-amber-100 text-amber-600',
  HIGH: 'bg-rose-100 text-rose-600',
};

export default function ModelagemPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

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

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await modelingService.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
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

      // Upload files if any
      if (requestId && selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/modeling/${requestId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      await loadRequests();
      setShowModal(false);
      resetForm();
      toast.success(formData.id ? 'Pedido atualizado!' : 'Pedido criado com sucesso!');
    } catch (err) {
      console.error('Error saving request:', err);
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
      console.error('Error updating status:', err);
    }
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

  const resetForm = () => {
    setFormData({
      id: null,
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
    setSelectedFiles([]);
  };

  const openDetails = (request: any) => {
    setSelectedRequestId(request.id);
  };

  const handleFileUpload = async (requestId: string, file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/modeling/${requestId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadRequests();
      toast.success('Imagem enviada com sucesso!');
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleConvertToSale = async (requestId: string) => {
    if (!confirm('Converter esta modelagem em venda?')) return;
    try {
      const sale = await api.post(`/modeling/${requestId}/convert-to-sale`);
      toast.success('Venda criada com sucesso!');
      await loadRequests();
      router.push(`/caixa?saleId=${sale.data.id}`);
    } catch (err: any) {
      console.error('Error converting to sale:', err);
      toast.error(err.response?.data?.message || 'Erro ao converter em venda');
    }
  };

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRequestsByStatus = (status: string) => {
    return filteredRequests.filter(r => r.status === status);
  };

  const activeRequest = requests.find(r => r.id === selectedRequestId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modelagem 3D</h1>
            <p className="text-gray-500 mt-1">Gerencie pedidos de modelagem customizada</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            Novo Pedido
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnRequests = getRequestsByStatus(column.id);
          const Icon = column.icon;

          return (
            <div key={column.id} className="min-w-[280px]">
              {/* Column Header */}
              <div className="mb-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${column.color}`}>
                  <Icon size={16} />
                  <span className="font-semibold text-sm">{column.label}</span>
                  <span className="ml-auto text-xs font-bold">{columnRequests.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => openDetails(request)}
                  >
                    {/* Priority Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_COLORS[request.priority as keyof typeof PRIORITY_COLORS]}`}>
                        {request.priority}
                      </span>
                      {request.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar size={12} />
                          {new Date(request.deadline).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {request.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {request.description}
                    </p>

                    {/* Customer */}
                    {request.customer && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <User size={14} />
                        {request.customer.name}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {request.attachments?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip size={14} />
                            {request.attachments.length}
                          </div>
                        )}
                        {request.comments?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={14} />
                            {request.comments.length}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                    </div>

                    {/* Convert to Sale Button - Only for APPROVED */}
                    {request.status === 'APPROVED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToSale(request.id);
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
                      >
                        <ShoppingCart size={16} />
                        Converter em Venda
                      </button>
                    )}
                  </div>
                ))}

                {columnRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhum pedido
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {formData.id ? 'Editar Pedido' : 'Novo Pedido'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  placeholder="Ex: Chaveiro Logo Empresa"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
                  placeholder="Descreva os detalhes do pedido..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prazo</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    {Object.values(ModelingPriority).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                  <select
                    value={formData.modelingType}
                    onChange={(e) => setFormData({ ...formData, modelingType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                     {Object.values(ModelingType).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Finalidade</label>
                   <select
                    value={formData.modelingPurpose}
                    onChange={(e) => setFormData({ ...formData, modelingPurpose: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                     {Object.values(ModelingPurpose).map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nível Detalhe</label>
                   <select
                    value={formData.detailLevel}
                    onChange={(e) => setFormData({ ...formData, detailLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                     {Object.values(DetailLevel).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dimensões</label>
                  <input
                    type="text"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Ex: 10x10x20cm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Imagens de Referência</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        setSelectedFiles(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} arquivo(s) selecionado(s)` 
                        : 'Clique para selecionar arquivos'}
                    </span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {selectedFiles.map((f, i) => (
                        <div key={i}>{f.name}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !formData.title}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Drawer */}
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
