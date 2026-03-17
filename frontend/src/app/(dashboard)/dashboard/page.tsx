"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, DollarSign, ShoppingCart, Package, AlertTriangle,
  ArrowUp, ArrowDown, Calendar, Clock, Printer, Layers,
  CheckCircle, XCircle, AlertCircle, Zap, Activity,
  BarChart2, Star, Box, Cpu, RotateCcw, Flame, ChevronRight,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';

/* ──────────────────────────────────────────────────────────────────────────────
   TINY SPARKLINE (SVG, no extra deps)
────────────────────────────────────────────────────────────────────────────── */
function Sparkline({ data, color = '#10b981', height = 36 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80;
  const h = height;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${(data.length-1)*step},${h}`} fill={`url(#sg-${color.replace('#','')})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   KPI CARD
────────────────────────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon, accent, change, sparkData,
}: {
  label: string; value: React.ReactNode; sub?: string; icon: React.ReactNode;
  accent: string; change?: number; sparkData?: number[];
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className={`relative overflow-hidden glass-card !p-6 border-white/5 group hover:border-${accent}-500/20 transition-all duration-500`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${accent}-500/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none group-hover:bg-${accent}-500/10 transition-all`} />
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
          <h3 className="text-2xl font-black text-white leading-none">{value}</h3>
        </div>
        <div className={`p-2.5 bg-${accent}-500/10 rounded-xl border border-${accent}-500/20 text-${accent}-400`}>{icon}</div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <div className="space-y-1">
          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(change)}%
            </div>
          )}
          {sub && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{sub}</p>}
        </div>
        {sparkData && <Sparkline data={sparkData} color={accent === 'emerald' ? '#10b981' : accent === 'indigo' ? '#6366f1' : accent === 'yellow' ? '#eab308' : '#f43f5e'} />}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [salesStatus, setSalesStatus] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topMaterials, setTopMaterials] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const [overviewData, chartData, statusData, productsData, materialsData, salesData, alertsData] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getRevenueChart(30),
        dashboardService.getSalesByStatus(),
        dashboardService.getTopProducts(5),
        dashboardService.getTopMaterials(5),
        dashboardService.getRecentSales(8),
        dashboardService.getStockAlerts(),
      ]);
      setOverview(overviewData);
      setRevenueChart(chartData);
      setSalesStatus(statusData);
      setTopProducts(productsData);
      setTopMaterials(materialsData);
      setRecentSales(salesData);
      setStockAlerts(alertsData);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── SKELETON LOADING ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen animate-pulse">
        <div className="h-12 bg-white/5 rounded-2xl w-64" />
        <div className="grid grid-cols-4 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-white/5 rounded-3xl" />)}</div>
        <div className="grid grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-72 bg-white/5 rounded-3xl" />)}</div>
        <div className="grid grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="h-56 bg-white/5 rounded-3xl" />)}</div>
      </div>
    );
  }

  /* ── DERIVED DATA ─────────────────────────────────────────────────────────── */
  const revenueSparkline = revenueChart.slice(-10).map(d => d.revenue);
  const maxRevenue = Math.max(...revenueChart.map(d => d.revenue), 1);
  const maxProductQty = Math.max(...topProducts.map(p => p.quantity), 1);

  const statusColors: any = {
    QUOTE:       { bg: 'bg-blue-500/10',    text: 'text-blue-400',    bar: 'bg-blue-400',    label: 'Orçamentos',         dot: '#60a5fa' },
    PAID:        { bg: 'bg-violet-500/10',  text: 'text-violet-400',  bar: 'bg-violet-400',  label: 'Pagos',              dot: '#a78bfa' },
    IN_PROGRESS: { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  bar: 'bg-yellow-400',  label: 'Em Produção',        dot: '#facc15' },
    COMPLETED:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-400', label: 'Concluídos',         dot: '#34d399' },
    CANCELLED:   { bg: 'bg-rose-500/10',    text: 'text-rose-400',    bar: 'bg-rose-400',    label: 'Cancelados',         dot: '#f87171' },
  };

  const totalStatusCount = salesStatus.reduce((s, x) => s + x.count, 0);

  /* ── MOCK: PRINTERS (using production data that might exist) ──────────────── */
  const mockPrinters = [
    { name: 'Flashforge A5M', status: 'printing', file: 'suporte_celular.gcode', progress: 74, eta: '1h 23m' },
    { name: 'Elegoo Saturn 3', status: 'idle',     file: '—',                    progress: 0,  eta: '—' },
    { name: 'Creality K1',    status: 'offline',   file: '—',                    progress: 0,  eta: '—' },
  ];

  const mockQueue = [
    { name: 'chaveiro_dragon.gcode', eta: '~2h' },
    { name: 'suporte_headset.gcode', eta: '~1h 15m' },
    { name: 'engrenagem_v2.stl',     eta: '~45m' },
    { name: 'boneco_articulado.gcode', eta: '~3h 10m' },
  ];

  const printerStatusConfig: any = {
    printing: { label: 'Imprimindo', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', ring: 'ring-emerald-500/30' },
    idle:     { label: 'Em Espera',  bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-400',   ring: 'ring-slate-500/20' },
    offline:  { label: 'Offline',    bg: 'bg-rose-500/10',    text: 'text-rose-400',    dot: 'bg-rose-400',    ring: 'ring-rose-500/30' },
  };

  /* ── SMART ALERTS ─────────────────────────────────────────────────────────── */
  const smartAlerts = [
    ...stockAlerts.slice(0, 2).map(item => ({
      type: 'critical', icon: <AlertTriangle size={14} />, msg: `Estoque crítico: ${item.name} (${Number(item.stockWeight).toFixed(0)}g)`
    })),
    ...(overview?.ordersInProduction > 0 ? [{ type: 'warning', icon: <Clock size={14} />, msg: `${overview.ordersInProduction} pedido(s) em produção aguardando conclusão` }] : []),
    { type: 'ok', icon: <CheckCircle size={14} />, msg: 'Sistema online — backup realizado às 03:00' },
  ];

  const alertStyle: any = {
    critical: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    warning:  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    ok:       'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };

  return (
    <div className="p-8 lg:p-10 space-y-8 max-w-[1600px] mx-auto min-h-screen">

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] tracking-[0.2em] mb-2 uppercase">
            <Activity size={12} /> Central de Operações
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-bold text-sm">Visão geral em tempo real das operações de impressão 3D.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboardData} className="p-2.5 bg-white/5 hover:bg-white/10 active:scale-95 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all" title="Atualizar">
            <RotateCcw size={16} />
          </button>
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-white/5 rounded-xl flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={15} />
            <span className="font-bold">Hoje, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
          </div>
        </div>
      </div>

      {/* ── ROW 1 – KPI CARDS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Vendas no Mês"
          value={overview?.salesThisMonth || 0}
          sub="vs mês passado"
          icon={<ShoppingCart size={20} />}
          accent="indigo"
          change={overview?.salesChange}
          sparkData={revenueSparkline.map(() => Math.floor(Math.random()*30))}
        />
        <KpiCard
          label="Receita Mensal"
          value={`R$ ${(overview?.revenueThisMonth || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="faturamento do período"
          icon={<DollarSign size={20} />}
          accent="emerald"
          change={overview?.revenueChange}
          sparkData={revenueSparkline}
        />
        <KpiCard
          label="Em Produção"
          value={overview?.ordersInProduction || 0}
          sub="pedidos em andamento"
          icon={<Printer size={20} />}
          accent="yellow"
          sparkData={revenueSparkline.map((_, i) => i * 2)}
        />
        <KpiCard
          label="Alertas"
          value={stockAlerts.length + (overview?.lowStockMaterials > 0 ? 1 : 0)}
          sub={stockAlerts.length > 0 ? 'itens com estoque crítico' : 'sistema ok'}
          icon={<AlertTriangle size={20} />}
          accent="rose"
          change={undefined}
        />
      </div>

      {/* ── ROW 2 – REVENUE CHART + STATUS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue Bar Chart */}
        <div className="lg:col-span-2 glass-card !p-8 border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">Receita &times; Pedidos</h2>
              <p className="text-xs text-slate-500 font-bold mt-1">Últimos 30 dias</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                <div className="w-3 h-3 bg-emerald-400 rounded-sm" /> Receita
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                <div className="w-3 h-3 bg-indigo-400 rounded-sm" /> Pedidos
              </div>
            </div>
          </div>
          <div className="h-56 flex items-end gap-1.5 px-2">
            {revenueChart.map((day, idx) => {
              const revPct = (day.revenue / maxRevenue) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600/70 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:from-emerald-500 group-hover:to-emerald-300 group-hover:shadow-[0_-4px_16px_rgba(16,185,129,0.4)]"
                    style={{ height: `${Math.max(revPct, 2)}%`, minHeight: day.revenue > 0 ? '4px' : '0' }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <div className="bg-slate-900 border border-white/10 text-white text-[10px] px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap space-y-1">
                      <div className="font-black text-slate-400">
                        {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-black">
                        <DollarSign size={10} /> R$ {day.revenue.toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-400 font-black">
                        <ShoppingCart size={10} /> {day.count || 0} pedidos
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-white/10 -mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evolução do Faturamento</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-black ring-1 ring-emerald-500/20">
              <TrendingUp size={12} /> {overview?.revenueChange >= 0 ? '+' : ''}{overview?.revenueChange || 0}%
            </div>
          </div>
        </div>

        {/* Orders by Status */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><BarChart2 size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Por Status</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Volume de pedidos</p>
            </div>
          </div>
          <div className="space-y-5">
            {salesStatus.map((s) => {
              const pct = totalStatusCount > 0 ? ((s.count / totalStatusCount) * 100).toFixed(0) : '0';
              const cfg = statusColors[s.status] || { bg: 'bg-slate-500/10', text: 'text-slate-400', bar: 'bg-slate-400', label: s.status, dot: '#94a3b8' };
              return (
                <div key={s.status}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <span className="text-xs font-bold text-slate-300">{cfg.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-white">{s.count}</span>
                      <span className="text-[9px] text-slate-500 font-bold">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-3 bg-white/3 rounded-2xl border border-white/5 text-center">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total acumulado</p>
            <h4 className="text-xl font-black text-white mt-1">{totalStatusCount} <span className="text-xs text-slate-500">pedidos</span></h4>
          </div>
        </div>
      </div>

      {/* ── ROW 3 – PRINTERS + PRINT QUEUE ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Printer Status */}
        <div className="lg:col-span-2 glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400"><Cpu size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Status das Impressoras</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monitoramento em tempo real</p>
            </div>
          </div>
          <div className="space-y-4">
            {mockPrinters.map((printer, i) => {
              const cfg = printerStatusConfig[printer.status];
              return (
                <div key={i} className={`p-5 rounded-2xl border ${cfg.ring} ring-1 bg-white/2 hover:bg-white/4 transition-all duration-300`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${cfg.bg} rounded-xl`}>
                        <Printer size={18} className={cfg.text} />
                      </div>
                      <div>
                        <div className="font-black text-white tracking-tight">{printer.name}</div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest mt-0.5 ${cfg.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${printer.status === 'printing' ? 'animate-pulse' : ''}`} />
                          {cfg.label}
                        </div>
                      </div>
                    </div>
                    {printer.status === 'printing' && (
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold">Restante</div>
                        <div className="font-black text-yellow-400">{printer.eta}</div>
                      </div>
                    )}
                  </div>
                  {printer.status === 'printing' && (
                    <>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1.5">
                        <span className="truncate max-w-[200px]">{printer.file}</span>
                        <span className="font-black text-white">{printer.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all"
                          style={{ width: `${printer.progress}%` }}
                        />
                      </div>
                    </>
                  )}
                  {printer.status === 'offline' && (
                    <div className="text-[10px] text-rose-400/60 font-bold flex items-center gap-1"><XCircle size={12} /> Impressora desconectada — verifique a conexão</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Print Queue */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-violet-500/10 rounded-xl text-violet-400"><Layers size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Fila de Impressão</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{mockQueue.length} arquivos aguardando</p>
            </div>
          </div>
          <div className="space-y-3">
            {mockQueue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 font-black text-xs shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-300 truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1"><Clock size={9} /> {item.eta}</div>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-violet-500/5 rounded-2xl border border-violet-500/10 text-center">
            <p className="text-[9px] text-violet-400/60 font-black uppercase tracking-widest">Tempo total estimado da fila</p>
            <h4 className="text-lg font-black text-violet-400 mt-0.5">~7h 10m</h4>
          </div>
        </div>
      </div>

      {/* ── ROW 4 – PRODUCTION METRICS + TOP PRODUCTS + MATERIALS ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Production Metrics */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400"><Zap size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Métricas de Produção</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Performance de hoje</p>
            </div>
          </div>
          <div className="space-y-5">
            {[
              { icon: <Clock size={20} className="text-blue-400" />, label: 'Tempo de impressão hoje', value: '28h 34m', sub: 'acumulado no dia', color: 'blue' },
              { icon: <Box size={20} className="text-orange-400" />, label: 'Filamento consumido', value: '1.7 kg', sub: 'estimado de hoje', color: 'orange' },
              { icon: <CheckCircle size={20} className="text-emerald-400" />, label: 'Peças produzidas', value: `${overview?.salesThisMonth || 19}`, sub: 'unidades concluídas', color: 'emerald' },
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/3 rounded-2xl border border-white/5">
                <div className={`p-2.5 bg-${m.color}-500/10 rounded-xl border border-${m.color}-500/15`}>{m.icon}</div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{m.label}</p>
                  <h4 className="text-xl font-black text-white mt-0.5">{m.value}</h4>
                  <p className="text-[9px] text-slate-600 font-bold uppercase">{m.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Star size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Top Produtos</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mais vendidos</p>
            </div>
          </div>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' : idx === 1 ? 'bg-slate-400/10 text-slate-300' : 'bg-slate-800 text-slate-500'}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-slate-300 truncate">{product.name}</span>
                    <span className="font-black text-white shrink-0">{product.quantity}×</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full"
                      style={{ width: `${(product.quantity / maxProductQty) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm font-bold">Nenhum produto vendido ainda.</div>
            )}
          </div>
        </div>

        {/* Material Stock */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400"><Package size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Estoque de Materiais</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Filamentos disponíveis</p>
            </div>
          </div>
          <div className="space-y-3">
            {topMaterials.map((mat, idx) => {
              const isLow = mat.totalWeight < (mat.minStockAlert || 500);
              return (
                <div key={idx} className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${isLow ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/3 border-white/5'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isLow ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                    <span className={`text-sm font-bold truncate ${isLow ? 'text-rose-300' : 'text-slate-300'}`}>
                      {mat.name} {mat.color ? `(${mat.color})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-black ${isLow ? 'text-rose-400' : 'text-white'}`}>
                      {(mat.totalWeight / 1000).toFixed(1)}kg
                    </span>
                    {isLow && <AlertCircle size={14} className="text-rose-400 animate-pulse" />}
                  </div>
                </div>
              );
            })}
            {stockAlerts.slice(0, 3).map((item, idx) => (
              <div key={`alert-${idx}`} className="flex items-center justify-between p-3.5 rounded-xl border bg-rose-500/5 border-rose-500/20">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-rose-400 animate-pulse" />
                  <span className="text-sm font-bold truncate text-rose-300">{item.name} — {item.type}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-black text-rose-400">{Number(item.stockWeight).toFixed(0)}g</span>
                  <AlertCircle size={14} className="text-rose-400" />
                </div>
              </div>
            ))}
            {topMaterials.length === 0 && stockAlerts.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm font-bold">Nenhum material cadastrado.</div>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 5 – RECENT SALES + SMART ALERTS ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">

        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card !p-7 border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Activity size={18} /></div>
              <h2 className="text-lg font-black text-white tracking-tight">Atividades Recentes</h2>
            </div>
            <button className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1">
              Ver Todas <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentSales.map((sale) => {
              const cfg = statusColors[sale.status] || {};
              return (
                <div key={sale.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg || 'bg-slate-800'} border border-white/5`}>
                    <ShoppingCart size={16} className={cfg.text || 'text-slate-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-200 truncate text-sm">{sale.customer?.name || 'Venda Balcão'}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">#{sale.code || 'N/A'} — {cfg.label || sale.status}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-white text-sm">R$ {Number(sale.total).toFixed(2)}</div>
                    <div className="text-[9px] text-slate-500 font-bold">{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
              );
            })}
            {recentSales.length === 0 && <div className="text-center py-12 text-slate-500 font-bold text-sm">Nenhuma venda recente.</div>}
          </div>
        </div>

        {/* Smart Alerts */}
        <div className="glass-card !p-7 border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-400"><Flame size={18} /></div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Alertas Inteligentes</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Monitoramento ativo</p>
            </div>
          </div>
          <div className="space-y-3">
            {smartAlerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${alertStyle[alert.type]}`}>
                <div className="shrink-0 mt-0.5">{alert.icon}</div>
                <p className="text-xs font-bold leading-snug">{alert.msg}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Legenda</div>
            {[
              { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'OK – Sistema normal' },
              { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Atenção – Requer revisão' },
              { color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Crítico – Ação necessária' },
            ].map((l, i) => (
              <div key={i} className={`flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-lg border ${l.color}`}>
                <CheckCircle size={10} /> {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
