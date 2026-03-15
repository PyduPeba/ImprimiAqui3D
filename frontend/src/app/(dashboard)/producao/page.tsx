"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Filter,
  MoreVertical,
  Printer as PrinterIcon,
  ArrowRight,
  Settings as SettingsIcon,
  Wrench
} from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { MaintenanceTab } from './tabs/MaintenanceTab';

const statusColors = {
  WAITING: 'bg-slate-100 text-slate-500 border-slate-200',
  PRINTING: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  COMPLETED: 'bg-blue-100 text-blue-600 border-blue-200',
  FAILED: 'bg-rose-100 text-rose-600 border-rose-200',
  PAUSED: 'bg-amber-100 text-amber-600 border-amber-200',
};

enum ProducingTab {
  QUEUE = 'QUEUE',
  MAINTENANCE = 'MAINTENANCE',
}

export default function ProductionPage() {
  const { socket, connected } = useSocket();
  const [activeTab, setActiveTab] = useState<ProducingTab>(ProducingTab.QUEUE);
  const [jobs, setJobs] = useState<any[]>([
    { id: '1', name: 'Capacet_IronMan_V2.stl', status: 'PRINTING', printer: 'Bambu Lab X1-C', progress: 65, timeRemaining: '2h 15m' },
    { id: '2', name: 'Suporte_Headset.stl', status: 'WAITING', printer: 'Ender 3 S1', progress: 0, timeRemaining: '45m' },
    { id: '3', name: 'Vaso_Geométrico.stl', status: 'PAUSED', printer: 'Bambu Lab X1-C', progress: 12, timeRemaining: '8h 30m' },
  ]);

  useEffect(() => {
    if (socket) {
      socket.on('job:status-changed', (updatedJob: any) => {
        setJobs(prevJobs => prevJobs.map(job => 
          job.id === updatedJob.id ? { ...job, ...updatedJob } : job
        ));
      });
      
      socket.on('job:created', (newJob: any) => {
        setJobs(prevJobs => [newJob, ...prevJobs]);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('job:status-changed');
        socket.off('job:created');
      }
    };
  }, [socket]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Produção & Máquinas</h1>
          <p className="text-slate-500 font-medium">Controle total da sua frota e fila de impressão.</p>
        </div>
        <div className="flex gap-3">
           <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              {connected ? 'Real-time On' : 'Offline'}
           </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab(ProducingTab.QUEUE)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === ProducingTab.QUEUE ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={16} /> Fila de Trabalho
        </button>
        <button 
          onClick={() => setActiveTab(ProducingTab.MAINTENANCE)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === ProducingTab.MAINTENANCE ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Wrench size={16} /> Manutenção & Frota
        </button>
      </div>

      {activeTab === ProducingTab.QUEUE ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div key={job.id} className="card group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                      <PrinterIcon className="text-slate-400 group-hover:text-emerald-500" size={28} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                        {job.name}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[job.status as keyof typeof statusColors]}`}>
                          {job.status}
                        </span>
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                          <PrinterIcon size={12} /> {job.printer}
                        </p>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1">
                          <Clock size={12} /> {job.timeRemaining} restantes
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-md min-w-[200px] flex flex-col gap-2">
                     <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest">
                        <span>Progresso</span>
                        <span className="text-emerald-500">{job.progress}%</span>
                     </div>
                     <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div 
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${job.progress}%` }}
                        ></div>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     {job.status === 'PRINTING' ? (
                       <button className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors shadow-sm">
                         <Pause size={20} fill="currentColor" />
                       </button>
                     ) : (
                       <button className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shadow-sm">
                         <Play size={20} fill="currentColor" />
                       </button>
                     )}
                     <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-colors border border-slate-100 shadow-sm">
                        <MoreVertical size={20} />
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="card">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                 <AlertCircle className="text-rose-500" size={24} />
                 Alertas Recentes
               </h3>
               <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start">
                     <AlertCircle className="text-rose-500 mt-1" size={18} />
                     <div>
                        <h4 className="font-bold text-rose-900 text-sm">Falta de Filamento</h4>
                        <p className="text-xs text-rose-700 font-medium mt-1">A impressora Bambu Lab X1-C parou por falta de PLA Gray.</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="card">
               <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                 <CheckCircle2 className="text-blue-500" size={24} />
                 Concluídos Hoje
               </h3>
               <div className="space-y-4">
                  {[1].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group cursor-pointer hover:bg-white transition-all">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                            <CheckCircle2 className="text-blue-500" size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Case_iPhone_15.stl</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Finalizado há 20min</p>
                          </div>
                       </div>
                       <button className="p-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                          <ArrowRight size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </>
      ) : (
        <MaintenanceTab />
      )}
    </div>
  );
}
