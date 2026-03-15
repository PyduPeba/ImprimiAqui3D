'use client';

import React, { useState } from 'react';
import { useIsElectron } from '@/hooks/useElectron';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'react-hot-toast';
import { FolderOpen, HardDrive, FolderCheck, ExternalLink, Info, Folder } from 'lucide-react';

/**
 * LocalStorageSettings — Aba de configurações de armazenamento local.
 * Exibida apenas no app Electron.
 */
export function LocalStorageSettings() {
  const isElectron = useIsElectron();
  const { config, loading, saving, chooseFolderPath, saveConfig } = useLocalStorage();
  const [pendingPath, setPendingPath] = useState<string>('');

  // Sincroniza campo com config carregada
  React.useEffect(() => {
    if (config?.localStoragePath) {
      setPendingPath(config.localStoragePath);
    }
  }, [config]);

  if (!isElectron) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
          <HardDrive className="w-8 h-8 text-slate-600" />
        </div>
        <div>
          <p className="text-base font-bold text-slate-400">Disponível apenas no App Desktop</p>
          <p className="text-sm text-slate-600 mt-1 max-w-xs">
            Baixe o instalador do ImprimiAqui3D para habilitar o armazenamento local de arquivos STL, GCode e imagens.
          </p>
        </div>
      </div>
    );
  }

  const handleChooseFolder = async () => {
    const chosen = await chooseFolderPath();
    if (chosen) setPendingPath(chosen);
  };

  const handleSave = async () => {
    if (!pendingPath.trim()) {
      toast.error('Escolha uma pasta válida.');
      return;
    }
    try {
      await saveConfig({ localStoragePath: pendingPath });
      toast.success('Configuração salva! Subpastas criadas automaticamente.');
    } catch {
      toast.error('Erro ao salvar configuração local.');
    }
  };

  const handleOpenExplorer = async () => {
    window.electronAPI?.openInExplorer();
  };

  const folders = [
    { name: 'produtos/', desc: 'Imagens de capa' },
    { name: 'stl/', desc: 'Malhas brutas exportadas' },
    { name: 'gcode/', desc: 'Arquivos de fatiamento' },
    { name: 'referencias/', desc: 'Fotos de referência' },
  ];

  return (
    <div className="space-y-6">
      {/* Info da arquitetura de pastas */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-400">Arquitetura de Pastas</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Sua pasta raiz será organizada automaticamente com a estrutura abaixo:
            </p>
          </div>
        </div>
        <div className="bg-slate-900/80 rounded-lg p-4 font-mono text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400">
            <Folder className="w-3.5 h-3.5" />
            <span className="text-slate-300">[PASTA RAIZ ESCOLHIDA]</span>
          </div>
          {folders.map(f => (
            <div key={f.name} className="flex items-center gap-2 pl-5">
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-emerald-400">{f.name}</span>
              <span className="text-slate-600">— {f.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seletor de pasta */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-400" />
            Caminho Local de Armazenamento
          </span>
          <p className="text-xs text-slate-500 mt-1">
            <strong className="text-slate-400">Obrigatório.</strong> Escolha onde STL, GCode e imagens serão salvos neste computador.
          </p>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={loading ? 'Carregando...' : pendingPath}
            readOnly
            placeholder="Ex: C:\ImprimiAqui3D"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-300 font-mono placeholder:text-slate-600 focus:outline-none cursor-default"
          />
          <button
            type="button"
            onClick={handleChooseFolder}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600"
          >
            <FolderOpen className="w-4 h-4" />
            Procurar...
          </button>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading || !pendingPath}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderCheck className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Atualizar Configuração'}
        </button>

        {config?.localStoragePath && (
          <button
            type="button"
            onClick={handleOpenExplorer}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition-colors hover:bg-slate-800"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir pasta
          </button>
        )}
      </div>

      {/* Info sobre privacidade */}
      <p className="text-xs text-slate-600 leading-relaxed">
        💡 Ao mudar de pasta no futuro, os arquivos antigos <strong className="text-slate-400">não são perdidos</strong> — o sistema lembra exatamente onde cada arquivo foi salvo.
      </p>
    </div>
  );
}
