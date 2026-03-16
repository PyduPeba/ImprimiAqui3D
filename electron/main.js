const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const https = require('https');
const MoonrakerClient = require('./moonraker-client');


// ─── Configuração ─────────────────────────────────────────────────────────────
const APP_URL = 'http://192.168.18.240:3000'; // Apontando para o servidor local
const DEV_URL = 'http://localhost:3000';
const isDev = process.env.NODE_ENV === 'development';

// Arquivo de configuração local do usuário
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

// ─── Funções de configuração ───────────────────────────────────────────────────
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Erro ao carregar config:', e);
  }
  return {
    localStoragePath: path.join(app.getPath('documents'), 'ImprimiAqui3D'),
    windowBounds: { width: 1280, height: 800 },
  };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Erro ao salvar config:', e);
  }
}

// ─── Janela principal ──────────────────────────────────────────────────────────
let mainWindow = null;
let config = loadConfig();

function createWindow() {
  const { width, height } = config.windowBounds || { width: 1280, height: 800 };

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 960,
    minHeight: 600,
    title: 'ImprimiAqui3D',
    icon: path.join(__dirname, 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,       // Segurança: isola o contexto Node do contexto web
      nodeIntegration: false,       // Segurança: desabilita Node no renderer
      sandbox: false,               // Necessário para o preload funcionar
      spellcheck: false,
    },
    show: false, // Escondido até carregar (evita flash branco)
    backgroundColor: '#0f172a',
  });

  // Carrega a URL do app (servidor ou dev local)
  const appUrl = isDev ? DEV_URL : APP_URL;
  mainWindow.loadURL(appUrl);

  // Mostra a janela só quando estiver pronta (evita flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  // Salva tamanho e posição ao fechar
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    config.windowBounds = bounds;
    saveConfig(config);
  });

  // Abre links externos no navegador do sistema (não dentro do Electron)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(appUrl) && !url.startsWith(isDev ? DEV_URL : APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Remove o menu padrão (só mantém em dev para acessar DevTools)
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────

// Retorna a versão do app
ipcMain.handle('get-app-version', () => app.getVersion());

// Retorna configurações locais do usuário
ipcMain.handle('get-local-config', () => {
  return {
    localStoragePath: config.localStoragePath,
  };
});

// Salva configurações locais do usuário
ipcMain.handle('save-local-config', (event, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);

  // Cria as subpastas se não existirem
  const folders = ['produtos', 'stl', 'gcode', 'referencias'];
  const basePath = newConfig.localStoragePath;
  folders.forEach(folder => {
    const folderPath = path.join(basePath, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  });

  return { success: true, path: basePath };
});

// Abre diálogo nativo para escolher pasta
ipcMain.handle('open-folder-dialog', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Escolher Pasta',
    defaultPath: config.localStoragePath,
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// Abre diálogo para salvar arquivo
ipcMain.handle('save-file-dialog', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Salvar Arquivo',
    defaultPath: options.defaultPath || app.getPath('documents'),
    filters: options.filters || [],
  });
  if (result.canceled) return null;
  return result.filePath;
});

// Salva um arquivo na pasta local do usuário
// data: string base64 ou buffer
ipcMain.handle('save-local-file', async (event, { subfolder, filename, dataBase64 }) => {
  try {
    const basePath = path.join(config.localStoragePath, subfolder);
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    const filePath = path.join(basePath, filename);
    const buffer = Buffer.from(dataBase64, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Lê um arquivo local e retorna como base64
ipcMain.handle('read-local-file', async (event, filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Arquivo não encontrado' };
    }
    const buffer = fs.readFileSync(filePath);
    return { success: true, dataBase64: buffer.toString('base64') };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Lista arquivos em uma subpasta
ipcMain.handle('list-local-files', async (event, subfolder) => {
  try {
    const folderPath = path.join(config.localStoragePath, subfolder);
    if (!fs.existsSync(folderPath)) return { success: true, files: [] };
    const files = fs.readdirSync(folderPath).map(name => ({
      name,
      path: path.join(folderPath, name),
      size: fs.statSync(path.join(folderPath, name)).size,
    }));
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Verifica se um arquivo local existe
ipcMain.handle('file-exists', async (event, filePath) => {
  return fs.existsSync(filePath);
});

// Abre o explorador de arquivos na pasta local
ipcMain.handle('open-folder-in-explorer', async (event, subfolder) => {
  const folderPath = subfolder
    ? path.join(config.localStoragePath, subfolder)
    : config.localStoragePath;
  shell.openPath(folderPath);
});

// ─── Moonraker Integration ───────────────────────────────────────────────────

// Busca o status atual da impressora (CC2 ou Moonraker) via LAN
ipcMain.handle('request_printer_status', async (event, { host, port }) => {
  try {
    const client = new PrinterClient(host, port || 8080);
    const status = await client.getPrinterStatus();
    return status;
  } catch (err) {
    console.error(`Erro ao buscar status da impressora (${host}):`, err);
    return null;
  }
});


// ─── Auto-Updater ──────────────────────────────────────────────────────────────
function setupAutoUpdater() {
  if (isDev) return; // Não atualiza em modo dev

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', {
      status: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', { status: 'up-to-date' });
  });

  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-status', {
      status: 'downloading',
      percent: Math.round(progress.percent),
    });
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-status', { status: 'downloaded' });
  });

  autoUpdater.on('error', (err) => {
    console.error('Erro no auto-updater:', err);
  });

  // Verifica atualizações ao iniciar e a cada 4 horas
  autoUpdater.checkForUpdates().catch(console.error);
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(console.error);
  }, 4 * 60 * 60 * 1000);
}

// IPC para instalar atualização manualmente
ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

// ─── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Garante que a pasta padrão existe
  if (!fs.existsSync(config.localStoragePath)) {
    fs.mkdirSync(config.localStoragePath, { recursive: true });
    ['produtos', 'stl', 'gcode', 'referencias'].forEach(folder => {
      fs.mkdirSync(path.join(config.localStoragePath, folder), { recursive: true });
    });
  }

  createWindow();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
