# ImprimiAqui3D - Guia de Deploy

Este documento contém todas as instruções necessárias para fazer o deploy do sistema ImprimiAqui3D.

## 📋 Requisitos do Sistema

### Hardware Mínimo
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disco**: 20GB livres (SSD recomendado)
- **Rede**: Conexão estável à internet

### Hardware Recomendado (Produção)
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Disco**: 50GB+ SSD
- **Rede**: 10Mbps+ upload/download

### Software Necessário
- **Windows 10/11** ou **Windows Server 2019+**
- **Docker Desktop** 4.0+ (já instalado)
- **Node.js** v20.9.0 (já instalado)
- **PowerShell** 5.1+ (nativo no Windows)
- **Git** (recomendado)

---

## ✅ Verificação de Pré-requisitos

### 1. Verificar Docker

```powershell
docker --version
docker-compose --version
```

**Saída esperada:**
```
Docker version 24.x.x
Docker Compose version v2.x.x
```

Se o Docker não estiver rodando:
1. Abra o Docker Desktop
2. Aguarde inicialização completa
3. Verifique o ícone na bandeja do sistema (deve estar verde)

### 2. Verificar Node.js

```powershell
node --version
npm --version
```

**Saída esperada:**
```
v20.9.0
10.x.x
```

### 3. Verificar PowerShell

```powershell
$PSVersionTable.PSVersion
```

**Saída esperada:** Versão 5.1 ou superior

---

## 🚀 Instalação e Configuração

### Passo 1: Clonar/Navegar para o Projeto

```powershell
cd C:\Users\CeearaU\Desktop\ImprimiAqui3D
```

### Passo 2: Configurar Variáveis de Ambiente

#### Backend (.env)

Crie o arquivo `backend/.env`:

```env
# Ambiente
NODE_ENV=development

# Servidor
PORT=3001
API_PREFIX=api

# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=imprimiaqui
DB_PASSWORD=imprimiaqui_secure_2026
DB_DATABASE=imprimiaqui3d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_2026

# JWT
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_2026
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=sua_chave_refresh_muito_segura_aqui_2026
JWT_REFRESH_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Frontend (.env.local)

Crie o arquivo `frontend/.env.local`:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001

# App
NEXT_PUBLIC_APP_NAME=ImprimiAqui3D
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Produção (.env.production)

Para produção, crie `backend/.env.production` e `frontend/.env.production` com valores seguros:

```env
# Backend (.env.production)
NODE_ENV=production
DB_PASSWORD=SENHA_FORTE_ALEATORIA
REDIS_PASSWORD=SENHA_FORTE_ALEATORIA
JWT_SECRET=CHAVE_ALEATORIA_64_CARACTERES
JWT_REFRESH_SECRET=CHAVE_ALEATORIA_64_CARACTERES
CORS_ORIGIN=https://seudominio.com.br
```

> [!CAUTION]
> **NUNCA** commite arquivos `.env` no Git! Eles devem estar no `.gitignore`.

### Passo 3: Estrutura de Pastas

A estrutura será criada automaticamente durante a implementação:

```
ImprimiAqui3D/
├── backend/
│   ├── src/
│   ├── uploads/          # Arquivos STL (criado automaticamente)
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   ├── .env.local
│   └── package.json
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   └── postgres/
│       └── init.sql
├── docs/
├── scripts/
│   ├── start.ps1
│   └── backup.ps1
├── docker-compose.yml
└── docker-compose.dev.yml
```

---

## 🏃 Inicialização do Sistema

### Modo Desenvolvimento (com hot-reload)

```powershell
# Navegar para a pasta do projeto
cd C:\Users\CeearaU\Desktop\ImprimiAqui3D

# Iniciar todos os serviços
.\scripts\start.ps1 dev
```

**O que acontece:**
1. Docker Compose inicia os containers (postgres, redis, backend, frontend)
2. Backend roda em modo watch (hot-reload)
3. Frontend roda com `next dev`
4. Migrations são executadas automaticamente
5. Seeds criam dados iniciais

**Acessar o sistema:**
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Swagger**: http://localhost:3001/api/docs

**Credenciais padrão:**
- Email: `admin@imprimiaqui3d.com.br`
- Senha: `admin123` (alterar após primeiro login!)

### Modo Produção

```powershell
.\scripts\start.ps1 prod
```

**Diferenças:**
- Build otimizado (frontend e backend)
- Sem hot-reload
- Logs em arquivo
- Nginx como reverse proxy
- Variáveis de ambiente de produção

**Acessar o sistema:**
- **Aplicação completa**: http://localhost (porta 80)

---

## 🛠️ Comandos Úteis

### Parar todos os serviços

```powershell
docker-compose down
```

### Parar e remover volumes (CUIDADO: apaga dados!)

```powershell
docker-compose down -v
```

### Ver logs em tempo real

```powershell
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Acessar shell de um container

```powershell
# Backend
docker-compose exec backend sh

# Postgres
docker-compose exec postgres psql -U imprimiaqui -d imprimiaqui3d
```

### Executar migrations manualmente

```powershell
docker-compose exec backend npm run migration:run
```

### Criar nova migration

```powershell
docker-compose exec backend npm run migration:create -- src/database/migrations/NomeDaMigration
```

### Executar seeds

```powershell
docker-compose exec backend npm run seed:run
```

---

## 💾 Backup e Restore

### Backup Automático

O script `scripts/backup.ps1` faz backup automático:

```powershell
.\scripts\backup.ps1
```

**O que é feito backup:**
1. Banco de dados PostgreSQL (dump SQL)
2. Arquivos STL (`backend/uploads/`)
3. Configurações (`.env` files)

**Localização dos backups:**
```
C:\Users\CeearaU\Desktop\ImprimiAqui3D\backups\
├── 2026-01-26_22-00-00\
│   ├── database.sql
│   ├── uploads.zip
│   └── configs.zip
```

### Backup Manual do Banco de Dados

```powershell
# Criar backup
docker-compose exec -T postgres pg_dump -U imprimiaqui imprimiaqui3d > backup_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").sql

# Restaurar backup
Get-Content backup_2026-01-26_22-00-00.sql | docker-compose exec -T postgres psql -U imprimiaqui imprimiaqui3d
```

### Backup Manual de Arquivos STL

```powershell
# Criar backup
Compress-Archive -Path .\backend\uploads\* -DestinationPath uploads_backup_$(Get-Date -Format "yyyy-MM-dd_HH-mm-ss").zip

# Restaurar backup
Expand-Archive -Path uploads_backup_2026-01-26_22-00-00.zip -DestinationPath .\backend\uploads\
```

### Agendar Backup Automático (Windows Task Scheduler)

1. Abrir "Agendador de Tarefas" (Task Scheduler)
2. Criar tarefa básica
3. Nome: "ImprimiAqui3D Backup Diário"
4. Gatilho: Diariamente às 02:00
5. Ação: Iniciar programa
   - Programa: `powershell.exe`
   - Argumentos: `-File "C:\Users\CeearaU\Desktop\ImprimiAqui3D\scripts\backup.ps1"`
6. Finalizar

---

## 🔧 Troubleshooting

### Problema: Docker não inicia

**Sintomas:**
```
Cannot connect to the Docker daemon
```

**Solução:**
1. Abrir Docker Desktop
2. Aguardar inicialização completa
3. Verificar se o WSL2 está habilitado (Settings > General)

### Problema: Porta 3000 ou 3001 já em uso

**Sintomas:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solução:**
```powershell
# Descobrir qual processo está usando a porta
netstat -ano | findstr :3000

# Matar o processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Problema: Erro de conexão com banco de dados

**Sintomas:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:**
1. Verificar se o container postgres está rodando:
   ```powershell
   docker-compose ps
   ```
2. Verificar logs do postgres:
   ```powershell
   docker-compose logs postgres
   ```
3. Reiniciar o container:
   ```powershell
   docker-compose restart postgres
   ```

### Problema: Migrations não executam

**Sintomas:**
```
No migrations pending
```

**Solução:**
```powershell
# Reverter última migration
docker-compose exec backend npm run migration:revert

# Executar novamente
docker-compose exec backend npm run migration:run
```

### Problema: Frontend não conecta com backend

**Sintomas:**
- Erro 404 ou CORS no console do navegador

**Solução:**
1. Verificar variável `NEXT_PUBLIC_API_URL` em `frontend/.env.local`
2. Verificar se backend está rodando:
   ```powershell
   curl http://localhost:3001/api/health
   ```
3. Verificar CORS no backend (`backend/.env` → `CORS_ORIGIN`)

### Problema: Upload de STL falha

**Sintomas:**
```
Error: File too large
```

**Solução:**
1. Aumentar `MAX_FILE_SIZE` em `backend/.env`
2. Verificar permissões da pasta `backend/uploads/`
3. Reiniciar backend:
   ```powershell
   docker-compose restart backend
   ```

### Problema: WebSocket não conecta

**Sintomas:**
- Fila de impressão não atualiza em tempo real

**Solução:**
1. Verificar `NEXT_PUBLIC_WS_URL` em `frontend/.env.local`
2. Verificar logs do backend:
   ```powershell
   docker-compose logs -f backend | Select-String "socket"
   ```
3. Testar conexão manualmente no console do navegador:
   ```javascript
   const socket = io('http://localhost:3001');
   socket.on('connect', () => console.log('Connected!'));
   ```

---

## 🌐 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Alterar todas as senhas padrão
- [ ] Gerar chaves JWT aleatórias (64+ caracteres)
- [ ] Configurar domínio e DNS
- [ ] Configurar SSL/HTTPS (Let's Encrypt)
- [ ] Configurar firewall (portas 80, 443)
- [ ] Configurar backup automático
- [ ] Testar restore de backup
- [ ] Configurar monitoramento (logs, métricas)
- [ ] Criar usuário admin real (remover padrão)

### Configurar HTTPS com Let's Encrypt

1. Instalar Certbot
2. Obter certificado:
   ```bash
   certbot certonly --standalone -d seudominio.com.br
   ```
3. Atualizar `docker/nginx/nginx.conf` com SSL
4. Reiniciar Nginx

### Variáveis de Ambiente de Produção

Criar `backend/.env.production`:

```env
NODE_ENV=production
PORT=3001

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=imprimiaqui_prod
DB_PASSWORD=SENHA_FORTE_ALEATORIA_64_CHARS
DB_DATABASE=imprimiaqui3d_prod

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=SENHA_FORTE_ALEATORIA_64_CHARS

JWT_SECRET=CHAVE_ALEATORIA_64_CARACTERES_MINIMO
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=CHAVE_ALEATORIA_64_CARACTERES_MINIMO
JWT_REFRESH_EXPIRES_IN=7d

MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

CORS_ORIGIN=https://seudominio.com.br

THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

Criar `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://seudominio.com.br/api
NEXT_PUBLIC_WS_URL=https://seudominio.com.br
NEXT_PUBLIC_APP_NAME=ImprimiAqui3D
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Iniciar em Produção

```powershell
.\scripts\start.ps1 prod
```

---

## 📊 Monitoramento

### Logs

**Localização:**
- Backend: `backend/logs/`
- Nginx: `docker/nginx/logs/`
- Postgres: `docker logs imprimiaqui3d-postgres`

**Visualizar logs:**
```powershell
# Últimas 100 linhas
Get-Content .\backend\logs\app.log -Tail 100

# Seguir em tempo real
Get-Content .\backend\logs\app.log -Wait
```

### Métricas

Acessar dashboard interno:
- http://localhost:3000/relatorios

Métricas disponíveis:
- Vendas diárias/mensais
- Peças em produção
- Taxa de falha de impressão
- Uso de materiais
- Tempo médio de impressão

### Alertas

Configurar alertas no sistema:
1. Estoque baixo de filamento
2. Falha de impressão
3. Erro crítico na API
4. Disco cheio (>90%)

---

## 🔐 Segurança

### Recomendações

1. **Senhas Fortes**
   - Mínimo 16 caracteres
   - Letras, números e símbolos
   - Trocar a cada 90 dias

2. **Firewall**
   - Abrir apenas portas 80 e 443
   - Bloquear acesso direto ao Postgres (porta 5432)
   - Bloquear acesso direto ao Redis (porta 6379)

3. **Atualizações**
   - Manter Docker atualizado
   - Manter Node.js atualizado
   - Atualizar dependências mensalmente:
     ```powershell
     cd backend && npm update
     cd frontend && npm update
     ```

4. **Backup**
   - Backup diário automático
   - Testar restore mensalmente
   - Manter backups por 30 dias

5. **Auditoria**
   - Revisar logs semanalmente
   - Monitorar tentativas de login falhadas
   - Verificar uploads suspeitos

---

## 📞 Suporte

### Logs de Erro

Ao reportar problemas, incluir:
1. Versão do sistema (`package.json`)
2. Ambiente (dev/prod)
3. Logs relevantes
4. Passos para reproduzir

### Comandos de Diagnóstico

```powershell
# Informações do sistema
docker-compose ps
docker-compose logs --tail=50

# Status dos serviços
curl http://localhost:3001/api/health

# Espaço em disco
Get-PSDrive C

# Uso de memória
docker stats --no-stream
```

---

## 🎯 Próximos Passos

Após o deploy bem-sucedido:

1. [ ] Fazer login com credenciais padrão
2. [ ] Criar usuário admin real
3. [ ] Remover usuário admin padrão
4. [ ] Cadastrar primeira loja
5. [ ] Cadastrar materiais (PLA, ABS, PETG)
6. [ ] Cadastrar impressoras
7. [ ] Configurar preços
8. [ ] Fazer primeira venda de teste
9. [ ] Verificar fila de impressão
10. [ ] Testar relatórios
11. [ ] Configurar backup automático
12. [ ] Treinar equipe

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-26
