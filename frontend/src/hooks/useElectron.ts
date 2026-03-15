'use client';

/**
 * useIsElectron — Detecta se o app está rodando dentro do Electron.
 *
 * Uso:
 *   const isElectron = useIsElectron();
 *   if (isElectron) { ... } // comportamento desktop
 */
export function useIsElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.electronAPI?.isElectron);
}

/**
 * useElectronAPI — Retorna window.electronAPI ou null se estiver no navegador.
 * Use para acessar as funções nativas com segurança.
 *
 * Uso:
 *   const electron = useElectronAPI();
 *   const path = await electron?.openFolderDialog();
 */
export function useElectronAPI() {
  if (typeof window === 'undefined') return null;
  return window.electronAPI ?? null;
}
