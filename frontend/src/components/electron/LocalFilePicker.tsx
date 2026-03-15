'use client';

import React, { useCallback, useState } from 'react';
import { useIsElectron, useElectronAPI } from '@/hooks/useElectron';

interface LocalFilePickerProps {
  /** Subpasta onde salvar: 'produtos' | 'stl' | 'gcode' | 'referencias' */
  subfolder: 'produtos' | 'stl' | 'gcode' | 'referencias';
  /** Extensões aceitas, ex: ['.stl', '.3mf'] */
  accept?: string;
  /** Label do botão */
  label?: string;
  /** Chamado quando arquivo é salvo localmente; recebe o caminho absoluto */
  onSaved?: (localPath: string, filename: string) => void;
  /** Renderiza fallback para web (input normal) */
  webFallback?: React.ReactNode;
  className?: string;
}

/**
 * LocalFilePicker — Componente de seleção de arquivos.
 *
 * No Electron: abre diálogo nativo → salva localmente → retorna caminho.
 * No navegador: renderiza o webFallback (input normal de upload).
 */
export function LocalFilePicker({
  subfolder,
  accept = '*',
  label = 'Selecionar Arquivo',
  onSaved,
  webFallback,
  className = '',
}: LocalFilePickerProps) {
  const isElectron = useIsElectron();
  const electron = useElectronAPI();
  const [loading, setLoading] = useState(false);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const handleFileSelect = useCallback(async () => {
    if (!electron) return;

    // Cria um input temporário para capturar o arquivo do sistema de arquivos
    const input = document.createElement('input');
    input.type = 'file';
    if (accept) input.accept = accept;

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setLoading(true);

      try {
        // Lê o arquivo como ArrayBuffer e converte para base64
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Salva via IPC no Electron
        const result = await electron.saveLocalFile(subfolder, file.name, base64);
        if (result.success && result.path) {
          setSavedPath(result.path);
          onSaved?.(result.path, file.name);
        }
      } catch (err) {
        console.error('Erro ao salvar arquivo local:', err);
      } finally {
        setLoading(false);
      }
    };

    input.click();
  }, [electron, subfolder, accept, onSaved]);

  // Modo navegador: renderiza o fallback ou nada
  if (!isElectron) {
    return <>{webFallback ?? null}</>;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleFileSelect}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </span>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {label}
          </>
        )}
      </button>

      {savedPath && (
        <p className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
          <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="truncate">{savedPath}</span>
        </p>
      )}
    </div>
  );
}
