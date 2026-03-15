/**
 * global.d.ts
 * Tipos do window.electronAPI exposto pelo preload.js do Electron.
 * Quando rodando no navegador, window.electronAPI é undefined.
 */

export {};

declare global {
  interface Window {
    electronAPI?: {
      // Identidade
      isElectron: true;
      getVersion: () => Promise<string>;

      // Configurações locais
      getLocalConfig: () => Promise<{
        localStoragePath: string;
      }>;
      saveLocalConfig: (config: { localStoragePath: string }) => Promise<{
        success: boolean;
        path: string;
      }>;

      // Diálogos nativos
      openFolderDialog: (options?: { title?: string }) => Promise<string | null>;
      saveFileDialog: (options?: {
        title?: string;
        defaultPath?: string;
        filters?: { name: string; extensions: string[] }[];
      }) => Promise<string | null>;

      // Arquivos locais
      saveLocalFile: (
        subfolder: 'produtos' | 'stl' | 'gcode' | 'referencias',
        filename: string,
        dataBase64: string
      ) => Promise<{ success: boolean; path?: string; error?: string }>;

      readLocalFile: (filePath: string) => Promise<{
        success: boolean;
        dataBase64?: string;
        error?: string;
      }>;

      listLocalFiles: (subfolder: string) => Promise<{
        success: boolean;
        files: { name: string; path: string; size: number }[];
      }>;

      fileExists: (filePath: string) => Promise<boolean>;
      openInExplorer: (subfolder?: string) => Promise<void>;

      // Auto-Updater
      onUpdateStatus: (
        callback: (data: {
          status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date';
          version?: string;
          percent?: number;
        }) => void
      ) => () => void; // retorna função para remover listener

      installUpdate: () => Promise<void>;
    };
  }
}
