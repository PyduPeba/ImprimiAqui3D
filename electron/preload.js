/**
 * preload.js — Ponte segura entre o processo Electron (Node.js) e o frontend (web)
 *
 * Expõe apenas as funções permitidas via window.electronAPI.
 * O contextIsolation garante que o código web não tem acesso direto ao Node.js.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ─── Identidade ─────────────────────────────────────────────────────────────
  isElectron: true,
  getVersion: () => ipcRenderer.invoke('get-app-version'),

  // ─── Configurações locais ────────────────────────────────────────────────────
  getLocalConfig: () => ipcRenderer.invoke('get-local-config'),
  saveLocalConfig: (config) => ipcRenderer.invoke('save-local-config', config),

  // ─── Diálogos nativos ────────────────────────────────────────────────────────
  openFolderDialog: (options) => ipcRenderer.invoke('open-folder-dialog', options),
  saveFileDialog: (options) => ipcRenderer.invoke('save-file-dialog', options),

  // ─── Arquivos locais ─────────────────────────────────────────────────────────
  /**
   * Salva um arquivo na pasta local do usuário.
   * @param {string} subfolder - 'produtos' | 'stl' | 'gcode' | 'referencias'
   * @param {string} filename - Nome do arquivo (ex: 'minha-peca.stl')
   * @param {string} dataBase64 - Conteúdo do arquivo em base64
   */
  saveLocalFile: (subfolder, filename, dataBase64) =>
    ipcRenderer.invoke('save-local-file', { subfolder, filename, dataBase64 }),

  /**
   * Lê um arquivo local e retorna como base64.
   * @param {string} filePath - Caminho absoluto do arquivo
   */
  readLocalFile: (filePath) => ipcRenderer.invoke('read-local-file', filePath),

  /**
   * Lista arquivos em uma subpasta.
   * @param {string} subfolder - 'produtos' | 'stl' | 'gcode' | 'referencias'
   */
  listLocalFiles: (subfolder) => ipcRenderer.invoke('list-local-files', subfolder),

  /**
   * Verifica se um arquivo existe localmente.
   * @param {string} filePath - Caminho absoluto
   */
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),

  /**
   * Abre o Explorador de Arquivos na pasta local do usuário.
   * @param {string} [subfolder] - Subpasta opcional ('stl', 'gcode', etc.)
   */
  openInExplorer: (subfolder) => ipcRenderer.invoke('open-folder-in-explorer', subfolder),

  // ─── Auto-Updater ────────────────────────────────────────────────────────────
  /**
   * Escuta eventos de atualização enviados pelo main process.
   * @param {function} callback - Recebe { status, version?, percent? }
   */
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
    // Retorna função para remover o listener
    return () => ipcRenderer.removeAllListeners('update-status');
  },

  /**
   * Instala a atualização baixada e reinicia o app.
   */
  installUpdate: () => ipcRenderer.invoke('install-update'),
});
