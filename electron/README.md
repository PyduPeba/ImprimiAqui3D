# ImprimiAqui3D — App Desktop (Electron)

Pasta do app desktop Electron. Funciona como um "navegador dedicado" do sistema ImprimiAqui3D com acesso ao sistema de arquivos local para armazenar STL, GCode e imagens.

## Estrutura

```
electron/
├── main.js          ← Processo principal (janela, IPC, auto-update)
├── preload.js       ← Bridge segura para o frontend (contextBridge)
├── package.json     ← Dependências e config do electron-builder
└── assets/
    ├── icon.ico     ← Ícone para Windows (coloque aqui)
    ├── icon.png     ← Ícone para Linux (coloque aqui)
    └── icon.icns    ← Ícone para macOS (coloque aqui)
```

## Configuração antes do build

### 1. Defina a URL do servidor

Em `main.js`, linha 7:
```js
const APP_URL = 'https://SEU_DOMINIO.com'; // ← substitua aqui
```

### 2. Configure o repositório de releases (auto-update)

Em `package.json`, na seção `build.publish`:
```json
{
  "provider": "github",
  "owner": "SEU_USUARIO_GITHUB",
  "repo": "imprimiaqui3d-releases"
}
```

Alternativa: use um servidor próprio com `generic` provider:
```json
{
  "provider": "generic",
  "url": "https://seudominio.com/releases/"
}
```

### 3. Adicione os ícones

Coloque os ícones em `electron/assets/`:
- `icon.ico` (Windows) — mínimo 256x256
- `icon.png` (Linux) — 512x512
- *(Opcional)* `icon.icns` (macOS)

Você pode gerar `icon.ico` a partir de um PNG em: https://convertico.com/

## Instalação de dependências

```powershell
cd electron
npm install
```

## Desenvolvimento (testa apontando para localhost)

```powershell
# Com o frontend rodando em http://localhost:3000
cd electron
npm run dev
```

## Build do instalador

### Windows (.exe com NSIS installer)
```powershell
cd electron
npm run build:win
```
O arquivo `ImprimiAqui3D-Setup-1.0.0.exe` será gerado em `electron/dist/`.

### Linux (.AppImage)
```bash
cd electron
npm run build:linux
```

## Auto-Atualização

O app verifica atualizações automaticamente ao iniciar e a cada 4 horas.

Para um novo release:
1. Incremente a versão em `electron/package.json`
2. Execute `npm run build:win`
3. Publique o `.exe` + `latest.yml` no GitHub Releases (o electron-builder faz isso automaticamente se configurado com token)

### GitHub Actions (automático)

Adicione `GH_TOKEN` como secret no repositório e o build e publish serão automáticos ao criar um tag.

## Como testar o auto-update em desenvolvimento?

O auto-updater não funciona em modo `dev`. Para testar:
1. Gere a versão 1.0.0
2. Instale no PC
3. Incremente para 1.0.1 e gere novamente
4. Publique o 1.0.1 no seu servidor de releases
5. O app 1.0.0 instalado vai detectar e baixar automaticamente
