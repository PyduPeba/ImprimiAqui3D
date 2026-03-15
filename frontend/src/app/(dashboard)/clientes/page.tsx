"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  FileText, 
  ChevronRight,
  UserPlus,
  Trash2,
  Edit2,
  X,
  CreditCard,
  History,
  Activity,
  UserCheck,
  Calendar,
  Loader2,
  IdCard,
  Briefcase
} from 'lucide-react';
import { customersService } from '@/services/customers.service';
import { toast } from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: null as string | null,
    name: '',
    email: '',
    phone: '',
    document: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customersService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
      toast.error('Erro ao carregar banco de clientes');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.id) {
        await customersService.updateCustomer(formData.id, formData);
        toast.success('Ficha do cliente atualizada');
      } else {
        const { id, ...createData } = formData;
        await customersService.createCustomer(createData);
        toast.success('Novo cliente registrado');
      }
      await loadCustomers();
      setShowModal(false);
    } catch (err) {
      console.error('Error saving customer:', err);
      toast.error('Erro ao salvar registro');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (customer?: any) => {
    if (customer) {
      setFormData({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
      });
    } else {
      setFormData({
        id: null,
        name: '',
        email: '',
        phone: '',
        document: '',
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Esta ação removerá permanentemente o cliente. Confirmar?')) return;
    try {
      await customersService.deleteCustomer(id);
      toast.success('Cliente removido');
      await loadCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast.error('Erro ao excluir registro');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.document?.includes(searchTerm)
  );

  const thisMonthCount = customers.filter(c => {
    const createdDate = new Date(c.createdAt);
    const now = new Date();
    return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
  }).length;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Acessando Banco de Dados de Clientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header Section */}
      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48 transition-transform duration-1000 group-hover:scale-110"></div>
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                <Users className="text-indigo-400" size={28} />
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter">Base de Clientes</h1>
            </div>
            <p className="text-slate-400 font-medium max-w-lg">Inteligência de CRM industrial. Gerencie perfis, documentos e conexões de atendimento.</p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/25 active:scale-95 whitespace-nowrap"
          >
            <UserPlus size={20} />
            Cadastrar Cliente
          </button>
        </div>

        {/* Search Bar */}
        <div className="mt-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={22} />
          <input 
            type="text" 
            placeholder="Pesquisar por nome, documento, email ou telefone..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white/10 transition-all font-medium text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
                <UserCheck className="text-emerald-400" size={24} />
              </div>
              <Activity className="text-slate-700 group-hover:text-emerald-500 transition-colors" size={20} />
            </div>
            <h4 className="text-4xl font-black text-white tracking-tighter">{customers.length}</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Total de Clientes Ativos</p>
         </div>

         <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20">
                <Calendar className="text-indigo-400" size={24} />
              </div>
              <ChevronRight className="text-slate-700 group-hover:text-indigo-500 transition-colors" size={20} />
            </div>
            <h4 className="text-4xl font-black text-white tracking-tighter">+{thisMonthCount}</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Registros neste Mês</p>
         </div>

         <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden group hover:border-violet-500/30 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-violet-500/20 rounded-2xl border border-violet-500/20">
                <FileText className="text-violet-400" size={24} />
              </div>
              <History className="text-slate-700 group-hover:text-violet-500 transition-colors" size={20} />
            </div>
            <h4 className="text-4xl font-black text-white tracking-tighter">0</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Acervo STL Vinculado</p>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Identidade do Cliente</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Canais de Contato</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações Gerenciais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-32 px-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <Users className="text-slate-800 mb-4" size={64} />
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum perfil encontrado no banco de dados</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => openModal(customer)}>
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-5">
                         <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl group-hover:scale-110 group-hover:rotate-2 transition-transform duration-500 border border-white/10">
                           {customer.name.substring(0, 1).toUpperCase()}
                         </div>
                         <div>
                           <p className="text-xl font-black text-white leading-tight mb-1">{customer.name}</p>
                           <div className="flex items-center gap-2">
                             <IdCard className="text-indigo-500" size={12} />
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{customer.document || 'ID não informado'}</p>
                           </div>
                         </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                       <div className="space-y-2">
                          <p className="text-sm font-bold text-slate-300 flex items-center gap-3">
                            <span className="p-1 bg-white/5 rounded-lg border border-white/10"><Mail size={14} className="text-indigo-400" /></span>
                            {customer.email || <span className="text-slate-600 italic">E-mail não cadastrado</span>}
                          </p>
                          <p className="text-sm font-bold text-slate-300 flex items-center gap-3">
                            <span className="p-1 bg-white/5 rounded-lg border border-white/10"><Phone size={14} className="text-emerald-400" /></span>
                            {customer.phone || <span className="text-slate-600 italic">Telefone não cadastrado</span>}
                          </p>
                       </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(customer); }} 
                          className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-[1.25rem] transition-all border border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(customer.id); }} 
                          className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-[1.25rem] transition-all border border-rose-500/20 shadow-lg shadow-rose-500/5"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-48 -mt-48"></div>

            <div className="flex justify-between items-center mb-10 relative">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tighter">
                  {formData.id ? 'Alterar Cadastro' : 'Novo Cliente'}
                </h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">FICHA DE ATENDIMENTO E LOGÍSTICA</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white transition-all active:scale-95"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6 relative text-white">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo do Cliente</label>
                <div className="relative group">
                  <UserPlus className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                    placeholder="João da Silva Santos" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Principal</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                      placeholder="joao@dominio.com" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={20} />
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-slate-700" 
                      placeholder="(11) 98765-4321" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CPF / CNPJ ou Registro Fiscal</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={24} />
                  <input 
                    type="text" 
                    value={formData.document} 
                    onChange={(e) => setFormData({...formData, document: e.target.value})} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-700" 
                    placeholder="000.000.000-00" 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 transition-all active:scale-95 border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={loading || !formData.name} 
                  className="flex-[2] py-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-30 disabled:scale-100"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>Processando</span>
                    </div>
                  ) : (formData.id ? 'Salvar Alterações' : 'Finalizar Registro')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
