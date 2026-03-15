'use client';

import React, { useEffect, useState } from 'react';
import { useIsElectron, useElectronAPI } from '@/hooks/useElectron';
import { Download, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

/**
 * UpdateNotifier — Exibe notificação de atualização do app Electron.
 * Invisível quando rodando no navegador.
 */
export function UpdateNotifier() {
  const isElectron = useIsElectron();
  const electron = useElectronAPI();
  const [updateInfo, setUpdateInfo] = useState<{
    status: string;
    version?: string;
    percent?: number;
  } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron || !electron) return;
    const removeListener = electron.onUpdateStatus((data) => {
      setUpdateInfo(data);
      setDismissed(false);
    });
    return removeListener;
  }, [isElectron, electron]);

  if (!isElectron || !updateInfo || dismissed) return null;
  if (updateInfo.status === 'checking' || updateInfo.status === 'up-to-date') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-300">
      {updateInfo.status === 'available' && (
        <>
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Atualização disponível</p>
              {updateInfo.version && (
                <p className="text-xs text-slate-400">Versão {updateInfo.version} sendo baixada...</p>
              )}
            </div>
          </div>
        </>
      )}

      {updateInfo.status === 'downloading' && (
        <>
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Baixando atualização...</p>
              <div className="mt-1.5 w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${updateInfo.percent ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">{updateInfo.percent ?? 0}%</p>
            </div>
          </div>
        </>
      )}

      {updateInfo.status === 'downloaded' && (
        <>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white">Atualização pronta!</p>
              <p className="text-xs text-slate-400">Reinicie o app para aplicar.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => electron?.installUpdate()}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reiniciar e atualizar
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            >
              Depois
            </button>
          </div>
        </>
      )}
    </div>
  );
}
