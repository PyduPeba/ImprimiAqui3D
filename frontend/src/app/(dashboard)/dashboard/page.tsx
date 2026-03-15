"use client";

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
} from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';

export default function DashboardPage() {
  const [overview, setOverview] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [salesStatus, setSalesStatus] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [topMaterials, setTopMaterials] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        overviewData,
        chartData,
        statusData,
        productsData,
        materialsData,
        salesData,
        alertsData,
      ] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getRevenueChart(30),
        dashboardService.getSalesByStatus(),
        dashboardService.getTopProducts(5),
        dashboardService.getTopMaterials(5),
        dashboardService.getRecentSales(5),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <div className="text-emerald-500 font-bold tracking-widest text-sm animate-pulse">CARREGANDO DASHBOARD</div>
        </div>
      </div>
    );
  }

  const statusColors: any = {
    QUOTE: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Orçamentos', glow: 'shadow-blue-500/20' },
    PAID: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Pagos', glow: 'shadow-green-500/20' },
    IN_PROGRESS: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Em Produção', glow: 'shadow-yellow-500/20' },
    COMPLETED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Concluídos', glow: 'shadow-emerald-500/20' },
    CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelados', glow: 'shadow-red-500/20' },
  };

  const maxRevenue = Math.max(...revenueChart.map(d => d.revenue), 1);
  const maxProductQty = Math.max(...topProducts.map(p => p.quantity), 1);
  const maxMaterialWeight = Math.max(...topMaterials.map(m => m.totalWeight), 1);

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs tracking-[0.2em] mb-2">
            <TrendingUp size={14} />
            OVERVIEW DO SISTEMA
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-2 font-medium">Bem-vindo de volta, aqui estão as métricas de hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex items-center gap-2 text-sm text-slate-300">
            <Calendar size={16} />
            <span>Hoje, {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales Card */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">VENDAS NO MÊS</p>
              <h3 className="text-3xl font-black text-white">{overview?.salesThisMonth || 0}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <ShoppingCart className="text-indigo-400" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
              (overview?.salesChange || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {(overview?.salesChange || 0) >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(overview?.salesChange || 0)}%
            </div>
            <span className="text-xs text-slate-500 font-medium">vs. mês passado</span>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="stat-card border-l-4 border-l-emerald-500/50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">RECEITA MENSAL</p>
              <h3 className="text-3xl font-black text-white">
                R$ {overview?.revenueThisMonth?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <DollarSign className="text-emerald-400" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
              (overview?.revenueChange || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {(overview?.revenueChange || 0) >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(overview?.revenueChange || 0)}%
            </div>
            <span className="text-xs text-slate-500 font-medium">em faturamento</span>
          </div>
        </div>

        {/* Production Card */}
        <div className="stat-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">EM PRODUÇÃO</p>
              <h3 className="text-3xl font-black text-white">{overview?.ordersInProduction || 0}</h3>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
              <Package className="text-yellow-400" size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
             <div className="w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-500 h-full w-[65%]" />
             </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-wider">Capacidade Utilizada: 65%</p>
        </div>

        {/* Stock Alert Card */}
        <div className="stat-card group cursor-pointer hover:bg-rose-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-400 mb-1">ALERTAS ESTOQUE</p>
              <h3 className={`text-3xl font-black ${overview?.lowStockMaterials > 0 ? 'text-rose-400' : 'text-white'}`}>
                {overview?.lowStockMaterials || 0}
              </h3>
            </div>
            <div className={`p-3 rounded-2xl border transition-colors ${
              overview?.lowStockMaterials > 0 ? 'bg-rose-500/20 border-rose-500/40' : 'bg-slate-500/10 border-slate-500/20'
            }`}>
              <AlertTriangle className={overview?.lowStockMaterials > 0 ? 'text-rose-400' : 'text-slate-400'} size={24} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-500 font-medium group-hover:text-rose-400 transition-colors">
              {overview?.lowStockMaterials > 0 ? 'Existem itens com estoque crítico' : 'Todos os itens em dia'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">Receita por Dia</h2>
              <p className="text-sm text-slate-400">Desempenho dos últimos 30 dias</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold ring-1 ring-emerald-500/20">
               <TrendingUp size={14} />
               +12.5%
            </div>
          </div>
          
          <div className="h-72 flex items-end gap-2 px-2">
            {revenueChart.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                <div
                  className="w-full bg-gradient-to-t from-emerald-600/60 to-emerald-400 rounded-t-lg transition-all duration-300 group-hover:from-emerald-500 group-hover:to-emerald-300 group-hover:scale-x-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  style={{
                    height: `${(day.revenue / maxRevenue) * 100}%`,
                    minHeight: day.revenue > 0 ? '4px' : '0',
                  }}
                />
                <div className="absolute bottom-full mb-3 hidden group-hover:block z-20">
                  <div className="bg-slate-900 border border-slate-700 text-white text-[10px] p-2 rounded-xl shadow-2xl backdrop-blur-md">
                    <div className="font-bold border-b border-slate-700 pb-1 mb-1 opacity-60">
                      {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    <div className="text-emerald-400 font-black text-sm">
                       R$ {day.revenue.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-700/50">
             <div className="text-xs text-slate-500 font-bold tracking-widest uppercase">Evolução do Faturamento</div>
             <div className="flex gap-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" /> Vendas Pix/Cartão
                </div>
             </div>
          </div>
        </div>

        {/* Sales by Status - Detailed Glass Card */}
        <div className="glass-card p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
          <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
             <Clock className="text-indigo-400" size={20} />
             Volume por Status
          </h2>
          <div className="space-y-6">
            {salesStatus.map((status) => {
              const total = salesStatus.reduce((sum, s) => sum + s.count, 0);
              const percentage = ((status.count / total) * 100).toFixed(0);
              const config = statusColors[status.status] || { bg: 'bg-slate-500/20', text: 'text-slate-400', label: status.status, glow: '' };

              return (
                <div key={status.status} className="relative group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}`} />
                      <span className="text-sm font-bold text-slate-300 uppercase tracking-tight">{config.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                       <span className="text-lg font-black text-white">{status.count}</span>
                       <span className="text-[10px] text-slate-500 font-bold">{percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${config.text.replace('text-', 'bg-')}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-auto pt-8">
             <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-center">
                <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-[0.2em] mb-1">Total acumulado</p>
                <h4 className="text-2xl font-black text-emerald-400">
                   {salesStatus.reduce((sum, s) => sum + s.count, 0)} <span className="text-sm font-medium opacity-50">Pedidos</span>
                </h4>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Recent Activity */}
        <div className="glass-card">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-white">Atividades Recentes</h2>
             <button className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400">Ver Todas</button>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                   statusColors[sale.status]?.bg || 'bg-slate-800 border-slate-700'
                }`}>
                   <ShoppingCart size={18} className={statusColors[sale.status]?.text || 'text-slate-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-200 truncate">{sale.customer?.name || 'Venda Balcão'}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">#{sale.code || 'ID-EXT'}</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white">R$ {Number(sale.total).toFixed(2)}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase">{new Date(sale.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products Heatmap-like List */}
        <div className="glass-card">
           <h2 className="text-lg font-bold text-white mb-6">Produtos em Alta</h2>
           <div className="space-y-5">
              {topProducts.map((product, idx) => (
                <div key={idx} className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center font-black text-emerald-500 text-xs">
                      #{idx + 1}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                         <span className="font-bold text-slate-300">{product.name}</span>
                         <span className="font-black text-white">{product.quantity}x</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                         <div 
                            className="bg-emerald-500 h-full rounded-full" 
                            style={{ width: `${(product.quantity / maxProductQty) * 100}%` }} 
                         />
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Inventory Criticality List */}
        <div className="glass-card bg-rose-500/5">
           <h2 className="text-lg font-bold text-rose-400 mb-6">Crítico: Estoque Baixo</h2>
           <div className="space-y-4">
              {stockAlerts.slice(0, 5).map((item) => (
                 <div key={item.id} className="flex items-center justify-between p-3 border border-rose-500/10 rounded-2xl bg-slate-900/50">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-rose-500/20 rounded-lg">
                          <AlertTriangle size={16} className="text-rose-400" />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-slate-200">{item.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase">{item.type} | {item.color}</div>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-sm font-black text-rose-400">{Number(item.stockWeight).toFixed(0)}g</div>
                       <div className="text-[9px] text-slate-500 font-bold">MÍN: {item.minStockAlert}g</div>
                    </div>
                 </div>
              ))}
              {stockAlerts.length === 0 && (
                 <div className="text-center py-12">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Package className="text-emerald-500 shadow-glow shadow-emerald-500" size={24} />
                    </div>
                    <p className="text-sm font-bold text-emerald-500/60 uppercase tracking-widest">Estoque Saudável</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
