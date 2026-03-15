import React, { useState, useRef, useEffect } from 'react';
import { 
    X, Send, Paperclip, User, Calendar, Clock, 
    CheckCircle2, AlertCircle, MessageSquare, 
    FileText, Download, Trash2, History, Upload,
    Image as ImageIcon
} from 'lucide-react';
import { modelingService } from '@/services/modeling.service';
import { ModelingStatus, ModelingPriority } from '@/lib/enums/modeling.enums';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ModelingDetailsProps {
    request: any;
    onClose: () => void;
    onUpdate: () => void;
}

export default function ModelingDetails({ request, onClose, onUpdate }: ModelingDetailsProps) {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [request.comments]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await modelingService.addComment(request.id, newMessage);
            setNewMessage('');
            onUpdate();
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Erro ao enviar mensagem');
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            // Calculate next version
            const currentVersion = request.attachments?.length > 0 
                ? Math.max(...request.attachments.map((a: any) => a.version || 1)) + 1 
                : 1;
            
             await api.post(`/modeling/${request.id}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            onUpdate();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            await modelingService.updateStatus(request.id, newStatus);
            onUpdate();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Erro ao atualizar status');
        }
    };

    const isImage = (filename: string) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
             {/* Preview Modal */}
             {previewImage && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <X size={32} />
                    </button>
                    <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                     <a 
                        href={previewImage}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-sm transition-colors flex items-center gap-2"
                    >
                        <Download size={20} />
                        Baixar Original
                    </a>
                </div>
            )}

            <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{request.title}</h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                             <span className={`px-2 py-0.5 rounded text-xs font-semibold
                                ${request.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' : 
                                  request.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-slate-100 text-slate-700'}`}>
                                {request.priority}
                            </span>
                             <span>#{request.id.slice(0, 8)}</span>
                             {request.customer && (
                                <span className="flex items-center gap-1">
                                    <User size={12} /> {request.customer.name}
                                </span>
                             )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left Panel: Info & Files */}
                    <div className="w-1/3 border-r border-gray-200 overflow-y-auto p-6 bg-gray-50/50">
                        
                        {/* Status Control */}
                        <div className="mb-6">
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Status Atual</label>
                            <select 
                                value={request.status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                {Object.values(ModelingStatus).map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        {/* Details */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Descrição</h3>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.description}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</h3>
                                    <p className="text-sm font-medium">{request.modelingType || '-'}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Finalidade</h3>
                                    <p className="text-sm font-medium">{request.modelingPurpose || '-'}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Nível Detalhe</h3>
                                    <p className="text-sm font-medium">{request.detailLevel || '-'}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Prazo</h3>
                                    <p className="text-sm font-medium">
                                        {request.deadline ? new Date(request.deadline).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>

                             {request.dimensions && (
                                <div>
                                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Dimensões</h3>
                                    <p className="text-sm font-medium">{request.dimensions}</p>
                                </div>
                            )}
                        </div>

                        {/* Files */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Paperclip size={16} /> Arquivos ({request.attachments?.length || 0})
                                </h3>
                            </div>
                            
                            <div className="space-y-2">
                                {request.attachments?.map((att: any) => (
                                    <div key={att.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm group hover:border-indigo-300 transition-colors">
                                        <div className="flex justify-between items-start">
                                            <div 
                                                className="flex items-center gap-2 overflow-hidden cursor-pointer"
                                                onClick={() => isImage(att.filename) && setPreviewImage(att.url)}
                                            >
                                                <div className="bg-indigo-50 p-2 rounded group-hover:bg-indigo-100 transition-colors">
                                                    {isImage(att.filename) ? (
                                                        <div className="relative w-5 h-5">
                                                            <img 
                                                                src={att.url} 
                                                                alt="" 
                                                                className="w-full h-full object-cover rounded shadow-sm"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <FileText size={20} className="text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors" title={att.filename}>
                                                        {att.filename}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        v{att.version || 1} • {(att.fileSize / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isImage(att.filename) && (
                                                    <button 
                                                        onClick={() => setPreviewImage(att.url)}
                                                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                                        title="Visualizar"
                                                    >
                                                        <ImageIcon size={16} />
                                                    </button>
                                                )}
                                                <a 
                                                    href={att.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    download={att.filename}
                                                    title={`Baixar ${att.filename}`}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                 {/* Delete button hidden for now as functionality is not implemented */}
                                                <button
                                                    onClick={() => {/* handle delete? */}}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload size={16} />
                                    {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Chat & Timeline */}
                    <div className="flex-1 flex flex-col bg-white">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {request.comments?.length === 0 && (
                                <div className="text-center py-10 text-gray-400">
                                    <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                                    <p>Nenhuma mensagem ainda.</p>
                                    <p className="text-sm">Inicie a conversa ou registre uma atualização.</p>
                                </div>
                            )}

                            {request.comments?.map((comment: any) => (
                                <div key={comment.id} className={`flex gap-3 ${false ? 'flex-row-reverse' : ''}`}> 
                                    {/* TODO: Check if current user */}
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                                        {comment.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div className="max-w-[85%]">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="font-semibold text-sm text-gray-900">{comment.user?.name}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-800 whitespace-pre-wrap">
                                            {comment.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Digite uma mensagem..."
                                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button 
                                    type="submit" 
                                    disabled={sending || !newMessage.trim()}
                                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Send size={18} />
                                    Enviar
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
