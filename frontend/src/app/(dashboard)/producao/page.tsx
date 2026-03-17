"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  StopCircle,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  MoreVertical,
  Printer as PrinterIcon,
  Wrench,
  XCircle,
  Cpu,
  Activity,
  Layers,
  Zap,
  RefreshCw,
  ChevronRight,
  Flame,
  Timer
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { MaintenanceTab } from './tabs/MaintenanceTab';
import { productionService } from '@/services/production.service';

// ─── Types ────────────────────────────────────────────────────────────────────
type PrinterStatus = 'printing' | 'idle' | 'paused' | 'offline' | 'error';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface LivePrinter {
  id: string;
  name: string;
  status: PrinterStatus;
  file: string;
  progress: number;
  eta: string;
}

interface PrintJob {
  id: string;
  name: string;
  status: 'PRINTING' | 'WAITING' | 'PAUSED' | 'COMPLETED' | 'FAILED';
  printer: string;
  progress: number;
  timeRemaining: string;
}

interface PrintAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  printer?: string;
  time: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const PRINTER_CFG: Record<string, { label: string; dotClass: string; cardClass: string; badgeClass: string; barClass: string; iconClass: string }> = {
  printing: {
    label: 'Imprimindo',
    dotClass: 'bg-emerald-400 animate-pulse',
    cardClass: 'border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.08)]',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    iconClass: 'text-emerald-400',
  },
  idle: {
    label: 'Em Espera',
    dotClass: 'bg-slate-500',
    cardClass: 'border-white/8 bg-white/3',
    badgeClass: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
    barClass: 'bg-slate-600',
    iconClass: 'text-slate-500',
  },
  paused: {
    label: 'Pausado',
    dotClass: 'bg-amber-400 animate-pulse',
    cardClass: 'border-amber-500/25 bg-amber-500/4',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    barClass: 'bg-amber-500',
    iconClass: 'text-amber-400',
  },
  error: {
    label: 'Erro',
    dotClass: 'bg-rose-500 animate-ping',
    cardClass: 'border-rose-500/30 bg-rose-500/5',
    badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    barClass: 'bg-rose-500',
    iconClass: 'text-rose-400',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-slate-600',
    cardClass: 'border-slate-700/40 bg-slate-900/30 opacity-60',
    badgeClass: 'bg-slate-800/80 text-slate-500 border-slate-700/40',
    barClass: 'bg-slate-700',
    iconClass: 'text-slate-600',
  },
};

const ALERT_CFG: Record<AlertSeverity, { icon: React.ElementType; border: string; bg: string; title: string; badge: string }> = {
  critical: { icon: AlertCircle, border: 'border-rose-500/30', bg: 'bg-rose-500/8', title: 'text-rose-300', badge: 'bg-rose-500/20 text-rose-400' },
  warning:  { icon: AlertTriangle, border: 'border-amber-500/30', bg: 'bg-amber-500/8', title: 'text-amber-300', badge: 'bg-amber-500/20 text-amber-400' },
  info:     { icon: Activity, border: 'border-blue-500/30', bg: 'bg-blue-500/8', title: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-400' },
};

enum Tab { CONTROL = 'CONTROL', MAINTENANCE = 'MAINTENANCE' }

// ─── Mock data (will be replaced by live data when the printer is active) ─────
const MOCK_ALERTS: PrintAlert[] = [
  { id: '1', severity: 'warning', title: 'Falta de Filamento', message: 'Bambu Lab X1-C parou por falta de PLA Gray — verifique o carretel.', printer: 'Bambu Lab X1-C', time: '5min atrás' },
  { id: '2', severity: 'info', title: 'Impressão concluída', message: 'Case_iPhone_15.stl finalizada com sucesso na Ender 3 S1.', printer: 'Ender 3 S1', time: '22min atrás' },
];

const MOCK_QUEUE: PrintJob[] = [
  { id: '1', name: 'Capacete_IronMan_V2.stl', status: 'PRINTING', printer: 'Bambu Lab X1-C', progress: 65, timeRemaining: '2h 15m' },
  { id: '2', name: 'Suporte_Headset.stl', status: 'WAITING', printer: 'Ender 3 S1', progress: 0, timeRemaining: '45m' },
  { id: '3', name: 'Vaso_Geométrico.stl', status: 'PAUSED', printer: 'Bambu Lab X1-C', progress: 12, timeRemaining: '8h 30m' },
];

// ────────────────────────────────────────────────────────────────────────────────
// Printer Card
// ────────────────────────────────────────────────────────────────────────────────
function PrinterCard({ printer }: { printer: LivePrinter }) {
  const cfg = PRINTER_CFG[printer.status] ?? PRINTER_CFG.idle;
  const isPrinting = printer.status === 'printing';
  const isPaused = printer.status === 'paused';

  return (
    <div
      className={`group relative rounded-2xl border p-5 cursor-default transition-all duration-300 hover:scale-[1.015] hover:shadow-lg ${cfg.cardClass}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Glow ring on active print */}
      {isPrinting && (
        <div className="absolute inset-0 rounded-2xl ring-1 ring-emerald-400/20 pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-white/5 border border-white/8`}>
            <PrinterIcon size={20} className={cfg.iconClass} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm leading-tight truncate max-w-[130px]">{printer.name}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest border rounded-sm px-1.5 py-0.5 ${cfg.badgeClass}`}>
                {cfg.label}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isPrinting && (
            <button className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors" title="Pausar">
              <Pause size={13} />
            </button>
          )}
          {isPaused && (
            <button className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors" title="Retomar">
              <Play size={13} />
            </button>
          )}
          {(isPrinting || isPaused) && (
            <button className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors" title="Cancelar">
              <StopCircle size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      {isPrinting || isPaused ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{printer.file !== '—' ? printer.file : 'Arquivo desconhecido'}</p>
            <span className={`text-sm font-black ${isPrinting ? 'text-emerald-400' : 'text-amber-400'}`}>{printer.progress}%</span>
          </div>

          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${cfg.barClass} ${isPrinting ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}`}
              style={{ width: `${printer.progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1"><Timer size={9} /> {printer.eta !== '—' ? `${printer.eta} restantes` : 'Calculando...'}</span>
          </div>
        </div>
      ) : (
        <div className="h-12 flex items-center justify-center border border-dashed border-white/8 rounded-xl">
          <span className="text-[10px] text-slate-600 font-medium">Aguardando trabalho</span>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────────
export default function ProductionPage() {
  const { socket, connected } = useSocket();
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CONTROL);
  const [printers, setPrinters] = useState<LivePrinter[]>([]);
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [alerts] = useState<PrintAlert[]>(MOCK_ALERTS);
  const [lastSync, setLastSync] = useState<string>('—');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [telemetry, queue] = await Promise.all([
        productionService.getPrintersTelemetry(),
        productionService.getQueue()
      ]);
      
      // Map backend printers/jobs if needed or just use as is
      setPrinters(telemetry);
      setJobs(queue);
      setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // silent fail — keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    const handleSync = () => loadData();
    socket.on('job:status-changed', handleSync);
    socket.on('job:created', handleSync);
    return () => { 
      socket.off('job:status-changed', handleSync); 
      socket.off('job:created', handleSync);
    };
  }, [socket, loadData]);

  // KPIs
  const activePrinters = printers.filter(p => p.status === 'printing').length;
  const pausedPrinters = printers.filter(p => p.status === 'paused').length;
  const offlinePrinters = printers.filter(p => p.status === 'offline').length;
  const alertCount = alerts.filter(a => a.severity === 'critical').length;

  const kpis = [
    { label: 'Ativas', value: activePrinters, icon: Flame, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Em Espera', value: printers.filter(p => p.status === 'idle').length, icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-600/20' },
    { label: 'Na Fila', value: jobs.filter(j => j.status === 'WAITING').length, icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Alertas', value: alertCount, icon: AlertTriangle, color: alertCount > 0 ? 'text-rose-400' : 'text-slate-500', bg: alertCount > 0 ? 'bg-rose-500/10' : 'bg-slate-700/20', border: alertCount > 0 ? 'border-rose-500/20' : 'border-slate-700/20' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Top Bar ─────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Cpu size={22} className="text-emerald-400" />
            Control Center
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Monitoramento em tempo real da frota de impressão</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPrinters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
          >
            <RefreshCw size={11} /> Sincronizar
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${connected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            {connected ? 'Real-time' : 'Offline'}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ───────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-800/60 border border-white/6 rounded-2xl w-fit">
        {[
          { id: Tab.CONTROL, label: 'Controle & Fila', icon: Zap },
          { id: Tab.MAINTENANCE, label: 'Manutenção & Frota', icon: Wrench },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
              activeTab === id
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {activeTab === Tab.CONTROL ? (
        <div className="space-y-6">

          {/* ── KPIs ────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map(({ label, value, icon: Icon, color, bg, border }) => (
              <div key={label} className={`flex items-center gap-4 p-4 rounded-2xl border ${border} ${bg}`} style={{ backdropFilter: 'blur(8px)' }}>
                <div className={`p-2.5 rounded-xl bg-white/5`}>
                  <Icon size={18} className={color} />
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{label}</p>
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Printer Grid ─────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PrinterIcon size={15} className="text-slate-500" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Frota de Impressoras</h2>
                <span className="text-[9px] bg-slate-700/50 text-slate-500 border border-slate-600/30 rounded-sm px-1.5 py-0.5 font-black uppercase">
                  {printers.length} máquinas
                </span>
              </div>
              <p className="text-[9px] text-slate-600 font-medium">Última sync: {lastSync}</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-36 rounded-2xl border border-white/5 bg-white/3 animate-pulse" />
                ))}
              </div>
            ) : printers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 border border-dashed border-white/8 rounded-2xl">
                <Cpu className="text-slate-700 mb-2" size={28} />
                <p className="text-xs text-slate-600 font-bold">Nenhuma impressora detectada no Home Assistant</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {printers.map((printer, i) => (
                  <PrinterCard key={printer.id || i} printer={printer} />
                ))}
              </div>
            )}
          </div>

          {/* ── Queue + Alerts ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* Print Queue */}
            <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-white/3 overflow-hidden" style={{ backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-slate-500" />
                  <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">Fila de Impressão</h2>
                </div>
                <span className="text-[9px] text-slate-500 font-bold">{jobs.length} trabalhos</span>
              </div>

              <div className="divide-y divide-white/4">
                {jobs.map((job, i) => {
                  const statusMap = {
                    PRINTING: { label: 'Imprimindo', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    WAITING:  { label: 'Aguardando', color: 'text-slate-400', bg: 'bg-slate-700/40 border-slate-600/20' },
                    PAUSED:   { label: 'Pausado', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
                    COMPLETED:{ label: 'Concluído', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
                    FAILED:   { label: 'Falhou', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
                  };
                  const s = statusMap[job.status] ?? statusMap.WAITING;

                  return (
                    <div key={job.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/8 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-200 truncate">{job.name}</p>
                          <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm border ${s.bg} ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1"><PrinterIcon size={9} />{job.printer}</span>
                          <span className="flex items-center gap-1"><Clock size={9} />{job.timeRemaining}</span>
                        </div>
                        {job.progress > 0 && (
                          <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden w-36">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${job.status === 'PRINTING' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {job.status === 'PRINTING' && (
                          <button className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors" title="Pausar">
                            <Pause size={12} />
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors" title="Retomar">
                            <Play size={12} />
                          </button>
                        )}
                        <button className="p-1.5 bg-red-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors" title="Cancelar">
                          <XCircle size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-6 py-3 border-t border-white/5 flex justify-between items-center">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                  Tempo total estimado
                </p>
                <p className="text-xs font-black text-slate-400">~11h 30m</p>
              </div>
            </div>

            {/* Alerts */}
            <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/3 overflow-hidden" style={{ backdropFilter: 'blur(8px)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-slate-500" />
                  <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">Alertas</h2>
                </div>
                {alertCount > 0 && (
                  <span className="text-[8px] font-black bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </div>

              <div className="divide-y divide-white/4">
                {alerts.map((alert) => {
                  const acfg = ALERT_CFG[alert.severity];
                  const Icon = acfg.icon;
                  return (
                    <div key={alert.id} className={`px-5 py-4 border-l-2 ${acfg.border} ${acfg.bg} hover:bg-white/3 transition-colors`}>
                      <div className="flex items-start gap-3">
                        <Icon size={14} className={`mt-0.5 shrink-0 ${acfg.title}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-bold ${acfg.title} truncate`}>{alert.title}</p>
                            <span className="text-[8px] text-slate-600 font-medium shrink-0">{alert.time}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">{alert.message}</p>
                          {alert.printer && (
                            <div className="flex items-center gap-1 mt-2">
                              <PrinterIcon size={9} className="text-slate-600" />
                              <span className="text-[9px] text-slate-600 font-medium">{alert.printer}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 border-t border-white/5">
                <button className="w-full flex items-center justify-center gap-1 text-[9px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">
                  Ver todos os alertas <ChevronRight size={10} />
                </button>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <MaintenanceTab />
      )}
    </div>
  );
}
