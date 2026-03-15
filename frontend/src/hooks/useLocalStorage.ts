'use client';

import { useState, useEffect, useCallback } from 'react';
import { useElectronAPI } from './useElectron';

export interface LocalConfig {
  localStoragePath: string;
}

/**
 * useLocalStorage — Gerencia a configuração de pasta local do usuário no Electron.
 *
 * Retorna a configuração atual, função para abrir diálogo de pasta,
 * função para salvar e estado de loading/saving.
 */
export function useLocalStorage() {
  const electron = useElectronAPI();
  const [config, setConfig] = useState<LocalConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carrega configuração ao montar
  useEffect(() => {
    if (!electron) return;
    setLoading(true);
    electron.getLocalConfig()
      .then(setConfig)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [electron]);

  // Abre diálogo nativo para escolher pasta
  const chooseFolderPath = useCallback(async (): Promise<string | null> => {
    if (!electron) return null;
    return electron.openFolderDialog({ title: 'Escolher pasta de armazenamento' });
  }, [electron]);

  // Salva configuração no Electron
  const saveConfig = useCallback(async (newConfig: LocalConfig) => {
    if (!electron) return;
    setSaving(true);
    try {
      const result = await electron.saveLocalConfig(newConfig);
      if (result.success) {
        setConfig(newConfig);
      }
      return result;
    } catch (err) {
      console.error('Erro ao salvar config local:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [electron]);

  return { config, loading, saving, chooseFolderPath, saveConfig };
}
