# 🚀 Guia de Implantação e Configuração (Windows & Linux)

Este guia descreve como realizar a instalação "limpa" do sistema **ImprimiAqui3D (V2.0)** em ambiente de produção utilizando Docker.

---

## 🛠️ Pré-requisitos Fundamentais

Antes de começar, certifique-se de ter instalado:
1. **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux).
2. **Docker Compose** (V2+).
3. **Git** (para clonar/gerenciar o repositório).

---

## 🏁 Instalação Rápida (Recomendado)

Desenvolvemos scripts de automação que preparam o ambiente, criam volumes persistentes e geram chaves de segurança aleatórias.

### No Windows (PowerShell Administrador)
1. Abra o terminal na pasta raiz do projeto.
2. Execute o script de setup:
   ```powershell
   .\scripts\setup.ps1
   ```
3. Inicie o sistema:
   ```powershell
   docker-compose up -d --build
   ```

### No Linux (Terminal Bash)
1. Abra o terminal na pasta raiz do projeto.
2. Dê permissão de execução e execute o script:
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```
3. O script perguntará se deseja configurar a **Inicialização Automática**. Responda `s` para criar o atalho de sistema.
4. Inicie o sistema:
   ```bash
   docker-compose up -d --build
   ```

---

## ⚡ Inicialização Automática (Autostart)

O sistema pode ser configurado para iniciar automaticamente ao ligar o computador (ideal para totens ou servidores dedicados).

### Windows
Ao executar o `.\scripts\setup.ps1`, escolha `S` na opção de inicialização automática. Isso criará um script invisível (`.vbs`) na sua pasta de Inicialização do Windows que executa o `start.ps1` em modo produção.

### Linux
No setup, ao escolher `s`, um arquivo `.desktop` será criado em `~/.config/autostart/`, garantindo que o Docker e a interface subam no login do usuário.

---

## ⚙️ Configuração Manual (Passo-a-Passo)

Caso prefira configurar manualmente sem usar os scripts automatizados:

### 1. Estrutura de Diretórios
Crie manualmente as pastas necessárias para persistência de dados e logs:
```bash
mkdir -p backend/uploads backend/logs docker/nginx/logs docker/postgres/data
```

### 2. Variáveis de Ambiente (.env)
Você deve criar dois arquivos cruciais. Utilize o template abaixo como referência.

#### `backend/.env.production`
Configure as credenciais do banco e chaves JWT.
> [!IMPORTANT]
> Nunca use `CHANGE_THIS_TO_RANDOM` em produção. Utilize uma string de 64 caracteres aleatórios.

#### `frontend/.env.production`
Define os URLs de comunicação com a API.
```env
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=http://localhost
```

---

## 🩺 Verificação do Sistema

Após rodar o comando `docker-compose up -d`, verifique se todos os containers estão saudáveis:

```bash
docker ps
```

**Status Esperados:**
- `imprimiaqui3d-frontend`: healthy (Porta 3000)
- `imprimiaqui3d-backend`: healthy (Porta 3001)
- `imprimiaqui3d-nginx`: active (Portas 80/443)
- `imprimiaqui3d-postgres`: healthy
- `imprimiaqui3d-redis`: healthy

---

## 🛠️ Solução de Problemas (Troubleshooting)

### No Windows
- **Erro de Execução de Scripts**: Se o PowerShell bloquear o `setup.ps1`, execute:
  `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`
- **Porta 80 em uso**: Certifique-se de que o IIS ou Apache não estão rodando.

### No Linux
- **Erros de Permissão**: Certifique-se de que o seu usuário pertence ao grupo `docker`:
  `sudo usermod -aG docker $USER` (requer logout/login).
- **Firewall (UFW)**: Verifique se as portas 80/443 estão abertas:
  `sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`

---

## 🔒 Considerações de Segurança
- O sistema utiliza **Redis** com senha para proteção de cache.
- O **Postgres** utiliza volumes nomeados para evitar perda de dados.
- O **Nginx** já provê headers de segurança (HSTS, CSP basic).

---

---

## 👥 Usuários Padrão
Após a instalação limpa, utilize o usuário administrador padrão:
- **Email**: `admin@imprimiaqui3d.com.br`
- **Senha**: `admin123`

> [!CAUTION]
> Altere a senha imediatamente após o primeiro acesso em **Configurações > Minha Conta**.

---

## 🐧 Instalação no Ubuntu Server 24.04 (SSH / Bare-metal)

Este passo a passo é focado na instalação direta no sistema utilizando **PM2** para gerenciar as aplicações e **Docker** para os serviços de infraestrutura (Banco de Dados e Cache).

### 1. Atualização e Ferramentas Básicas
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git wget build-essential

# Liberar Portas no Firewall (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw reload
```

### 2. Instalação do Docker
Utilizaremos o Docker para rodar o Postgres e o Redis, garantindo isolamento e facilidade de backup.
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# (Opcional: Deslogue e logue novamente via SSH para as permissões de grupo funcionarem)
```

### 3. Instalação do Node.js (via NVM) e PM2
```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc # Recarregar bash

# Instalar Node v20 (LTS)
nvm install 20.9.0
nvm use 20.9.0

# Instalar PM2 Globalmente
npm install -g pm2
```

### 4. Setup do Projeto
```bash
# Clonar o repositório (substitua pela sua URL se necessário)
git clone https://github.com/PyduPeba/ImprimiAqui3D.git
cd ImprimiAqui3D

# Rodar o setup para gerar os .env
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 5. Inicialização dos Serviços

#### A. Banco de Dados e Redis (Docker)
Iniciaremos apenas os serviços de base:
```bash
docker compose up -d postgres redis
```

#### B. Backend e Frontend (PM2)
O arquivo `ecosystem.config.js` na raiz do projeto gerencia ambos os processos:
```bash
# Instalar e Buildar Backend
cd backend && npm install && npm run build && cd ..

# Instalar e Buildar Frontend (O Next.js requer build para rodar 'start')
cd frontend && npm install && npm run build && cd ..

# Iniciar via PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup # Siga as instruções na tela para habilitar no boot
```

### 6. Monitoramento
- Ver o sistema online: `pm2 status`
- Ver os logs em tempo real: `pm2 logs`
- Painel visual básico: `pm2 monit`

---
