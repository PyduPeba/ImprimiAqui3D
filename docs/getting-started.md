# 🚀 Guia de Inicialização Rápida

Este documento explica como rodar o sistema **ImprimiAqui3D** localmente para testes e desenvolvimento.

## 📋 Pré-requisitos

1. **Docker Desktop**: Deve estar instalado e **rodando**.
2. **Node.js**: v20.9.0 ou superior.

---

## ⚡ Como Iniciar (Recomendado)

O projeto possui um script de automação que sobe todos os serviços (Banco de Dados, Redis, Backend e Frontend) com um único comando.

1. Abra o terminal na raiz do projeto.
2. Execute o comando:
   ```powershell
   .\scripts\start.ps1 dev
   ```


*Este script irá verificar se o Docker está rodando, conferir as configurações e iniciar os containers em modo de desenvolvimento.*

Para parar o serviço
3. docker-compose -f docker-compose.dev.yml down
---

## 🛠️ Como Iniciar Manualmente (Logs Individuais)

Se você desejar rodar os serviços separadamente para acompanhar os logs de cada um:

### 1. Iniciar Infraestrutura (DB e Redis)
```powershell
docker-compose -f docker-compose.dev.yml up -d postgres redis
```

### 2. Iniciar o Backend
```powershell
cd backend
npm install
npm run start:dev
```
*O backend estará acessível em: `http://localhost:3001/api`*

### 3. Iniciar o Frontend
```powershell
cd frontend
npm install
npm run dev
```
*O frontend estará acessível em: `http://localhost:3000`*

---

## 🔑 Acesso ao Sistema

Após iniciar, utilize as seguintes informações:

- **E-mail:** `admin@imprimiaqui3d.com.br`
- **Senha:** `admin123`

### Atalhos Úteis:
- **Painel Principal:** [http://localhost:3000](http://localhost:3000)
- **Documentação da API:** [http://localhost:3001/api/docs](http://localhost:3001/api/docs)

---

## 🔧 Comandos Úteis

- **Ver Logs:** `docker-compose -f docker-compose.dev.yml logs -f`
- **Parar Sistema:** `docker-compose -f docker-compose.dev.yml down`
- **Reiniciar Tudo:** `docker-compose -f docker-compose.dev.yml restart`
- **Limpar tudo (apagar dados):** `docker-compose -f docker-compose.dev.yml down -v`

---

## 📁 Estrutura de Documentação Complementar
- [Guia de Deploy Completo](./deployment.md)
- [Arquitetura do Sistema](./architecture.md)
- [Guia de Desenvolvimento](./development.md)
