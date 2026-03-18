import React, { useState, useRef, useEffect } from 'react';
import {
    X, Send, Paperclip, User, Calendar,
    CheckCircle2, MessageSquare,
    FileText, Download, Upload,
    Image as ImageIcon, AlertTriangle, Clock, ArrowRight,
    Layers, RefreshCw, Eye, BarChart3, Archive,
} from 'lucide-react';
import { modelingService } from '@/services/modeling.service';
import { ModelingStatus } from '@/lib/enums/modeling.enums';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface ModelingDetailsProps {
    request: any;
    onClose: () => void;
    onUpdate: () => void;
}

// ─── Status configs (shared with parent) ─────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    BRIEFING:    { label: 'Briefing',   color: 'text-slate-400',   icon: FileText },
    ANALYSIS:    { label: 'Análise',    color: 'text-indigo-400',  icon: BarChart3 },
    MODELING:    { label: 'Modelando',  color: 'text-blue-400',    icon: Layers },
    REVIEW:      { label: 'Revisão',    color: 'text-amber-400',   icon: Eye },
    ADJUSTMENTS: { label: 'Ajustes',   color: 'text-orange-400',  icon: RefreshCw },
    APPROVED:    { label: 'Aprovado',   color: 'text-emerald-400', icon: CheckCircle2 },
    ARCHIVED:    { label: 'Finalizado', color: 'text-slate-500',   icon: Archive },
    CANCELLED:   { label: 'Cancelado',  color: 'text-rose-400',    icon: X },
};

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
    HIGH:   { label: 'Alta',  color: 'text-rose-400',  bg: 'bg-rose-500/15 border-rose-500/30' },
    MEDIUM: { label: 'Média', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    LOW:    { label: 'Baixa', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
};

function isImage(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
}

export default function ModelingDetails({ request, onClose, onUpdate }: ModelingDetailsProps) {
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [request.comments]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;
        setSending(true);
        try {
            await modelingService.addComment(request.id, newMessage);
            setNewMessage('');
            onUpdate();
        } catch {
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
            const fd = new FormData();
            fd.append('file', file);
            await api.post(`/modeling/${request.id}/upload`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onUpdate();
            toast.success('Arquivo enviado!');
        } catch {
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
        } catch {
            toast.error('Erro ao atualizar status');
        }
    };

    const pCfg = PRIORITY_CFG[request.priority] ?? PRIORITY_CFG.MEDIUM;
    const sCfg = STATUS_CFG[request.status] ?? STATUS_CFG.BRIEFING;
    const SIcon = sCfg.icon;
    const isOverdue = request.deadline && new Date(request.deadline) < new Date();

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-[100] animate-in fade-in duration-200">
            {/* Image preview overlay */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <a
                        href={previewImage}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-sm transition-colors text-sm font-bold"
                    >
                        <Download size={16} />
                        Baixar
                    </a>
                </div>
            )}

            {/* Panel */}
            <div
                className="w-full max-w-4xl h-full flex flex-col border-l border-white/8 animate-in slide-in-from-right-8 duration-300"
                style={{ background: 'rgba(10,12,18,0.97)', backdropFilter: 'blur(20px)' }}
            >
                {/* ── Header ─────────────────────────────── */}
                <div className="px-7 py-5 border-b border-white/6 flex items-start justify-between gap-4 shrink-0">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-black text-white leading-tight truncate">
                            {request.title}
                        </h2>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-widest border rounded-md px-2 py-0.5 ${pCfg.bg} ${pCfg.color}`}>
                                {pCfg.label}
                            </span>
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${sCfg.color}`}>
                                <SIcon size={11} />
                                {sCfg.label}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">#{request.id.slice(0, 8)}</span>
                            {request.customer && (
                                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                    <User size={10} />
                                    {request.customer.name}
                                </span>
                            )}
                            {isOverdue && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-rose-400 uppercase">
                                    <AlertTriangle size={10} />
                                    Prazo vencido
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* ── Body ────────────────────────────────── */}
                <div className="flex-1 overflow-hidden flex min-h-0">

                    {/* ── Left Panel ── */}
                    <div className="w-[300px] shrink-0 border-r border-white/6 overflow-y-auto flex flex-col">

                        {/* Status selector */}
                        <div className="px-5 pt-5 pb-4 border-b border-white/5">
                            <label className="block text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Etapa do Pipeline</label>
                            <div className="space-y-1">
                                {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                                    const Icon = cfg.icon;
                                    const active = request.status === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleStatusChange(key)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all ${
                                                active
                                                    ? 'bg-white/10 border border-white/15 ' + cfg.color
                                                    : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                        >
                                            {active && <ArrowRight size={10} className="shrink-0" />}
                                            {!active && <div className="w-2.5" />}
                                            <Icon size={12} className="shrink-0" />
                                            {cfg.label}
                                            {active && (
                                                <span className="ml-auto text-[8px] font-black uppercase opacity-50">ATUAL</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="px-5 py-4 border-b border-white/5 space-y-4">
                            {request.description && (
                                <div>
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Descrição</p>
                                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{request.description}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Tipo', value: request.modelingType },
                                    { label: 'Finalidade', value: request.modelingPurpose },
                                    { label: 'Detalhe', value: request.detailLevel },
                                    { label: 'Prazo', value: request.deadline ? new Date(request.deadline).toLocaleDateString('pt-BR') : null },
                                    { label: 'Dimensões', value: request.dimensions },
                                ].filter((i) => i.value).map((item) => (
                                    <div key={item.label}>
                                        <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{item.label}</p>
                                        <p className={`text-xs font-bold mt-0.5 ${item.label === 'Prazo' && isOverdue ? 'text-rose-400' : 'text-slate-300'}`}>
                                            {item.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Files */}
                        <div className="px-5 py-4 flex-1">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <Paperclip size={11} />
                                    Arquivos ({request.attachments?.length || 0})
                                </p>
                            </div>
                            <div className="space-y-2">
                                {request.attachments?.map((att: any) => (
                                    <div
                                        key={att.id}
                                        className="group flex items-center gap-3 p-2.5 rounded-xl border border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12 transition-all cursor-pointer"
                                        onClick={() => isImage(att.filename) && setPreviewImage(att.url)}
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 flex items-center justify-center">
                                            {isImage(att.filename) ? (
                                                <img src={att.url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <FileText size={18} className="text-slate-500" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-bold text-slate-300 truncate" title={att.filename}>
                                                {att.filename}
                                            </p>
                                            <p className="text-[9px] text-slate-600">
                                                v{att.version || 1} · {(att.fileSize / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {isImage(att.filename) && (
                                                <button className="p-1 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors" title="Visualizar">
                                                    <ImageIcon size={13} />
                                                </button>
                                            )}
                                            <a
                                                href={att.url}
                                                download={att.filename}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-1 text-slate-500 hover:text-indigo-400 rounded-lg transition-colors"
                                                title="Baixar"
                                            >
                                                <Download size={13} />
                                            </a>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-slate-600 hover:text-slate-300 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Upload size={13} />
                                    {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel: Timeline / Chat ── */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0">

                        {/* Timeline header */}
                        <div className="px-6 py-3.5 border-b border-white/5 shrink-0">
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                <MessageSquare size={11} />
                                Linha do Tempo & Mensagens
                            </p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
                            {(!request.comments || request.comments.length === 0) && (
                                <div className="flex flex-col items-center justify-center h-32 text-slate-700">
                                    <MessageSquare size={28} className="mb-3 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma mensagem</p>
                                    <p className="text-[9px] text-slate-600 mt-1">Inicie a conversa ou registre uma atualização.</p>
                                </div>
                            )}

                            {request.comments?.map((comment: any, i: number) => (
                                <div key={comment.id} className="flex gap-3">
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                                        {comment.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-xs font-black text-slate-200">{comment.user?.name || 'Usuário'}</span>
                                            <span className="text-[9px] text-slate-600">{timeAgo(comment.createdAt)}</span>
                                        </div>
                                        <div className="bg-white/5 border border-white/8 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                            {comment.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-6 py-4 border-t border-white/5 shrink-0">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escreva uma mensagem ou atualização..."
                                    className="glass-input flex-1 text-sm py-2.5"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="btn-premium !py-2.5 !px-5 text-[11px] disabled:opacity-40"
                                >
                                    <Send size={14} />
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
