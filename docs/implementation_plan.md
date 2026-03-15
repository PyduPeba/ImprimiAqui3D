# ImprimiAqui3D - Plano de Implementação

Sistema completo de gestão para negócios de impressão 3D, incluindo PDV, controle de produção, estoque de filamentos, gestão de clientes e dashboard web em tempo real.

## User Review Required

> [!IMPORTANT]
> **Stack Tecnológica Confirmada**
> - **Frontend**: Next.js 14+ (App Router) + TailwindCSS
> - **Backend**: NestJS + TypeORM + PostgreSQL
> - **Cache/Queue**: Redis + Bull
> - **Real-time**: Socket.IO
> - **Containerização**: Docker + Docker Compose
> - **Proxy**: Nginx
> 
> Esta stack foi escolhida para escalabilidade, suporte a multi-loja e dashboards em tempo real.

> [!WARNING]
> **Decisões de Design Importantes**
> 1. **Autenticação**: JWT + Refresh Token com RBAC (Admin, Gerente, Operador, Cliente)
> 2. **Multi-loja**: Arquitetura preparada para múltiplas lojas desde o início
> 3. **Arquivos STL**: Armazenamento local com backup automático (futuramente S3/MinIO)
> 4. **Cálculo de Preço**: Configurável por loja (preço/grama + preço/hora + margem)
> 5. **Fila de Impressão**: Status em tempo real via WebSocket
> 6. **Relatórios**: Exportação em PDF e Excel

> [!CAUTION]
> **Segurança e Backup**
> - Backup diário automático do PostgreSQL
> - Backup de arquivos STL
> - Logs estruturados para auditoria
> - Rate limiting na API
> - Validação rigorosa de uploads (apenas STL, limite de tamanho)

## Proposed Changes

### 📁 Estrutura de Diretórios

```
ImprimiAqui3D/
├── frontend/                 # Next.js Application
├── backend/                  # NestJS API
├── docs/                     # Documentação
│   ├── deployment.md
│   ├── architecture.md
│   └── development.md
├── docker/                   # Docker configs
│   ├── nginx/
│   └── postgres/
├── scripts/                  # Automation scripts
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

### 🐳 Infraestrutura - Docker & Scripts

#### [NEW] [docker-compose.yml](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docker-compose.yml)

Orquestração completa dos serviços:
- **postgres**: Banco de dados principal (PostgreSQL 16)
- **redis**: Cache e filas (Redis 7)
- **backend**: API NestJS (porta 3001)
- **frontend**: Next.js (porta 3000)
- **nginx**: Reverse proxy (porta 80)

Volumes para persistência:
- Dados do Postgres
- Arquivos STL uploadados
- Cache do Redis

#### [NEW] [docker-compose.dev.yml](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docker-compose.dev.yml)

Ambiente de desenvolvimento com hot-reload e debug habilitado.

#### [NEW] [scripts/start.ps1](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/scripts/start.ps1)

Script PowerShell para iniciar todo o sistema com um único comando:
```powershell
.\scripts\start.ps1 dev  # Ambiente de desenvolvimento
.\scripts\start.ps1 prod # Ambiente de produção
```

#### [NEW] [scripts/backup.ps1](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/scripts/backup.ps1)

Backup automático de banco de dados e arquivos STL.

#### [NEW] [docker/nginx/nginx.conf](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docker/nginx/nginx.conf)

Configuração do Nginx como reverse proxy:
- `/api/*` → Backend (porta 3001)
- `/socket.io/*` → WebSocket (porta 3001)
- `/*` → Frontend (porta 3000)

---

### 🔧 Backend - NestJS API

#### [NEW] [backend/package.json](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/package.json)

Dependências principais:
- `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`
- `@nestjs/typeorm`, `typeorm`, `pg`
- `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- `@nestjs/websockets`, `@nestjs/platform-socket.io`
- `@nestjs/bull`, `bull`
- `redis`, `ioredis`
- `class-validator`, `class-transformer`
- `bcrypt`, `uuid`

#### [NEW] [backend/src/main.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/main.ts)

Configuração principal da aplicação:
- CORS habilitado
- Validação global de DTOs
- Swagger/OpenAPI
- Socket.IO adapter
- Rate limiting
- Helmet para segurança

#### [NEW] [backend/src/app.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/app.module.ts)

Módulo raiz importando:
- TypeOrmModule (Postgres)
- BullModule (Redis queues)
- ConfigModule (variáveis de ambiente)
- Todos os módulos de negócio

#### Módulo: Auth & Usuários

**[NEW] [backend/src/auth/auth.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/auth/auth.module.ts)**

Autenticação completa:
- Login com email/senha
- JWT + Refresh Token
- Guards para proteção de rotas
- RBAC (Role-Based Access Control)

**[NEW] [backend/src/auth/entities/user.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/auth/entities/user.entity.ts)**

Entidade de usuário:
- `id`, `email`, `password` (hash bcrypt)
- `role`: ADMIN | MANAGER | OPERATOR | CLIENT
- `storeId`: Suporte multi-loja
- `isActive`, `createdAt`, `updatedAt`

**[NEW] [backend/src/auth/dto/login.dto.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/auth/dto/login.dto.ts)**

DTOs com validação:
- LoginDto
- RegisterDto
- RefreshTokenDto

---

#### Módulo: PDV/Vendas

**[NEW] [backend/src/sales/sales.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/sales/sales.module.ts)**

Gestão completa de vendas:
- Criação de orçamentos
- Conversão para venda
- Múltiplas formas de pagamento (PIX, Dinheiro, Cartão)
- Emissão de recibos
- Controle de caixa

**[NEW] [backend/src/sales/entities/sale.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/sales/entities/sale.entity.ts)**

Entidades:
- `Sale`: Venda principal
- `SaleItem`: Itens da venda (peças)
- `Payment`: Pagamentos (múltiplos por venda)
- `CashRegister`: Controle de caixa

**[NEW] [backend/src/sales/services/pricing.service.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/sales/services/pricing.service.ts)**

Cálculo automático de preço:
```typescript
preço = (peso_g × preço_por_grama) + (tempo_h × preço_por_hora) + margem
```

Configurável por loja e material.

---

#### Módulo: Produção/Fila de Impressão

**[NEW] [backend/src/production/production.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/production/production.module.ts)**

Gerenciamento da fila de impressão:
- Status: WAITING | PRINTING | COMPLETED | FAILED
- Atribuição a impressoras
- Tempo estimado vs real
- Notificações em tempo real (WebSocket)

**[NEW] [backend/src/production/entities/print-job.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/production/entities/print-job.entity.ts)**

Entidades:
- `PrintJob`: Job de impressão
- `Printer`: Impressora 3D
- `PrintHistory`: Histórico de impressões

**[NEW] [backend/src/production/gateways/production.gateway.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/production/gateways/production.gateway.ts)**

WebSocket Gateway:
- Evento: `job:status-changed`
- Evento: `job:started`
- Evento: `job:completed`
- Evento: `job:failed`

---

#### Módulo: Estoque/Filamentos

**[NEW] [backend/src/inventory/inventory.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/inventory/inventory.module.ts)**

Controle de estoque:
- Entrada/saída automática
- Custo médio ponderado
- Alertas de estoque baixo
- Histórico de movimentações

**[NEW] [backend/src/inventory/entities/material.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/inventory/entities/material.entity.ts)**

Entidades:
- `Material`: Filamento (PLA, ABS, PETG, etc.)
- `MaterialMovement`: Movimentação de estoque
- `MaterialAlert`: Alertas configuráveis

---

#### Módulo: Clientes

**[NEW] [backend/src/customers/customers.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/customers/customers.module.ts)**

Gestão de clientes:
- Cadastro simples
- Histórico de impressões
- Arquivos STL vinculados
- Programa de fidelização (futuro)

**[NEW] [backend/src/customers/entities/customer.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/customers/entities/customer.entity.ts)**

Entidades:
- `Customer`: Cliente
- `CustomerFile`: Arquivos STL do cliente

---

#### Módulo: Relatórios

**[NEW] [backend/src/reports/reports.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/reports/reports.module.ts)**

Geração de relatórios:
- Dashboard: métricas em tempo real
- Faturamento diário/mensal
- Peças mais impressas
- Impressoras mais usadas
- Exportação em PDF/Excel

**[NEW] [backend/src/reports/services/dashboard.service.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/reports/services/dashboard.service.ts)**

Métricas calculadas:
- Total de vendas (dia/mês)
- Ticket médio
- Peças em produção
- Taxa de falha de impressão
- Margem de lucro

---

#### Módulo: Configurações

**[NEW] [backend/src/config/config.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/config/config.module.ts)**

Configurações do sistema:
- Preços por material (grama/hora)
- Perfis de impressora
- Configurações de loja
- Parâmetros de cálculo

**[NEW] [backend/src/config/entities/system-config.entity.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/config/entities/system-config.entity.ts)**

Entidades:
- `SystemConfig`: Configurações gerais
- `MaterialPricing`: Preços por material
- `PrinterProfile`: Perfis de impressora

---

#### Worker/Background Jobs

**[NEW] [backend/src/workers/workers.module.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/workers/workers.module.ts)**

Processamento assíncrono:
- Geração de PDF (orçamentos/recibos)
- Processamento de arquivos STL (preview/thumbnail)
- Envio de e-mails (futuro)
- Envio de WhatsApp (futuro)

**[NEW] [backend/src/workers/processors/pdf.processor.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/workers/processors/pdf.processor.ts)**

Processadores Bull:
- `pdf:generate-quote`
- `pdf:generate-receipt`
- `stl:process-file`

---

### 🎨 Frontend - Next.js

#### [NEW] [frontend/package.json](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/package.json)

Dependências principais:
- `next` (14+), `react`, `react-dom`
- `tailwindcss`, `autoprefixer`, `postcss`
- `socket.io-client`
- `axios`
- `react-hook-form`, `zod`
- `recharts` (gráficos)
- `@headlessui/react` (componentes)
- `lucide-react` (ícones)

#### [NEW] [frontend/src/app/layout.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/layout.tsx)

Layout raiz com:
- Providers (Auth, Socket, Theme)
- Fontes customizadas
- Metadata SEO

#### [NEW] [frontend/tailwind.config.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/tailwind.config.ts)

Configuração do TailwindCSS:
- Cores do tema ImprimiAqui3D (verde, laranja, azul)
- Tipografia customizada
- Plugins úteis

---

#### Páginas e Rotas

**[NEW] [frontend/src/app/login/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/login/page.tsx)**

Tela de login conforme mockup:
- Email e senha
- "Esqueci minha senha"
- Design clean com gradiente de fundo

**[NEW] [frontend/src/app/(dashboard)/layout.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/layout.tsx)**

Layout do dashboard:
- Sidebar com navegação (Caixa, Produção, Estoque, Clientes, Relatórios, Configurações)
- Header com busca e perfil do usuário
- Proteção de rota (autenticação)

**[NEW] [frontend/src/app/(dashboard)/caixa/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/caixa/page.tsx)**

PDV/Caixa conforme mockup:
- Cards de impressões aguardando/andamento/finalizadas
- Venda rápida: busca cliente, busca STL
- Seleção de material e peso
- Cálculo automático de preço
- Formas de pagamento (PIX, Dinheiro, Cartão)
- Fila de impressão
- Resumo da venda

**[NEW] [frontend/src/app/(dashboard)/producao/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/producao/page.tsx)**

Fila de produção:
- Lista de jobs com status em tempo real
- Filtros por status e impressora
- Atribuição de impressora
- Controle de tempo (estimado vs real)

**[NEW] [frontend/src/app/(dashboard)/estoque/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/estoque/page.tsx)**

Controle de estoque:
- Lista de materiais com quantidade atual
- Alertas de estoque baixo
- Entrada/saída manual
- Histórico de movimentações

**[NEW] [frontend/src/app/(dashboard)/clientes/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/clientes/page.tsx)**

Gestão de clientes:
- Lista de clientes
- Cadastro/edição
- Histórico de impressões
- Arquivos STL vinculados

**[NEW] [frontend/src/app/(dashboard)/relatorios/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/relatorios/page.tsx)**

Dashboard e relatórios:
- Gráficos de faturamento
- Peças mais impressas
- Impressoras mais usadas
- Exportação em PDF/Excel

**[NEW] [frontend/src/app/(dashboard)/configuracoes/page.tsx](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/app/(dashboard)/configuracoes/page.tsx)**

Configurações do sistema:
- Preços por material
- Perfis de impressora
- Configurações de loja
- Usuários e permissões

---

#### Componentes Reutilizáveis

**[NEW] [frontend/src/components/ui/](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/components/ui/)**

Biblioteca de componentes:
- `Button`, `Input`, `Select`, `Checkbox`
- `Modal`, `Toast`, `Alert`
- `Table`, `Pagination`
- `Card`, `Badge`, `Avatar`
- `Sidebar`, `Header`

**[NEW] [frontend/src/components/features/](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/components/features/)**

Componentes específicos:
- `SaleForm`: Formulário de venda
- `PrintQueue`: Fila de impressão
- `MaterialSelector`: Seletor de material
- `PriceCalculator`: Calculadora de preço
- `FileUpload`: Upload de STL

---

#### Hooks e Utilitários

**[NEW] [frontend/src/hooks/useSocket.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/hooks/useSocket.ts)**

Hook para WebSocket:
```typescript
const { socket, connected } = useSocket();
socket.on('job:status-changed', handleUpdate);
```

**[NEW] [frontend/src/hooks/useAuth.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/hooks/useAuth.ts)**

Hook de autenticação:
```typescript
const { user, login, logout, isAuthenticated } = useAuth();
```

**[NEW] [frontend/src/lib/api.ts](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/frontend/src/lib/api.ts)**

Cliente API com axios:
- Interceptors para JWT
- Refresh token automático
- Tratamento de erros

---

### 🗄️ Banco de Dados

#### [NEW] [backend/src/database/migrations/](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/database/migrations/)

Migrations TypeORM:
1. `CreateUsersTable` - Usuários e autenticação
2. `CreateStoresTable` - Multi-loja
3. `CreateCustomersTable` - Clientes
4. `CreateMaterialsTable` - Materiais/filamentos
5. `CreatePrintersTable` - Impressoras
6. `CreateSalesTable` - Vendas e itens
7. `CreatePrintJobsTable` - Fila de impressão
8. `CreateSystemConfigTable` - Configurações

#### [NEW] [backend/src/database/seeds/](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/backend/src/database/seeds/)

Seeds iniciais:
- Usuário admin padrão
- Materiais comuns (PLA, ABS, PETG)
- Configurações padrão de preço

---

### 📚 Documentação

#### [NEW] [docs/deployment.md](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docs/deployment.md)

Guia completo de deploy:
- Requisitos do sistema
- Instalação do Docker
- Configuração de variáveis de ambiente
- Comandos de inicialização
- Backup e restore
- Troubleshooting

#### [NEW] [docs/architecture.md](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docs/architecture.md)

Documentação da arquitetura:
- Diagrama de componentes
- Fluxo de dados
- Decisões técnicas
- Padrões de código

#### [NEW] [docs/development.md](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/docs/development.md)

Guia para desenvolvedores:
- Setup do ambiente
- Estrutura de código
- Convenções
- Como contribuir

#### [NEW] [README.md](file:///c:/Users/CeearaU/Desktop/ImprimiAqui3D/README.md)

README principal:
- Descrição do projeto
- Screenshots
- Quick start
- Links para documentação

---

## Verification Plan

### Automated Tests

**Backend (NestJS)**
```bash
# Testes unitários
npm run test

# Testes E2E
npm run test:e2e

# Coverage
npm run test:cov
```

Cobertura mínima: 70%

**Frontend (Next.js)**
```bash
# Testes de componentes (Jest + React Testing Library)
npm run test

# Testes E2E (Playwright)
npm run test:e2e
```

### Manual Verification

**Fluxo 1: Login e Autenticação**
1. Acessar `http://localhost`
2. Login com credenciais padrão
3. Verificar redirecionamento para dashboard
4. Testar logout

**Fluxo 2: Criar Venda (PDV)**
1. Acessar módulo Caixa
2. Buscar/criar cliente
3. Upload de arquivo STL
4. Selecionar material e peso
5. Verificar cálculo automático de preço
6. Finalizar venda com PIX
7. Verificar emissão de recibo

**Fluxo 3: Fila de Produção**
1. Verificar job criado na fila
2. Atribuir a uma impressora
3. Iniciar impressão
4. Verificar atualização em tempo real (WebSocket)
5. Finalizar impressão
6. Verificar baixa automática de estoque

**Fluxo 4: Controle de Estoque**
1. Acessar módulo Estoque
2. Verificar quantidade atual de PLA
3. Registrar entrada de material
4. Verificar atualização de quantidade
5. Testar alerta de estoque baixo

**Fluxo 5: Relatórios**
1. Acessar módulo Relatórios
2. Visualizar dashboard com métricas
3. Exportar relatório em PDF
4. Exportar relatório em Excel
5. Verificar dados corretos

### Performance Tests

- Tempo de resposta da API < 200ms (95th percentile)
- Carregamento de páginas < 2s
- WebSocket: latência < 100ms
- Upload de STL até 50MB

### Security Checks

- [ ] Validação de JWT em todas as rotas protegidas
- [ ] Rate limiting funcionando
- [ ] CORS configurado corretamente
- [ ] Uploads validados (apenas STL, tamanho máximo)
- [ ] SQL injection prevention (TypeORM)
- [ ] XSS prevention (sanitização)

### Browser Compatibility

- [ ] Chrome/Edge (últimas 2 versões)
- [ ] Firefox (últimas 2 versões)
- [ ] Safari (últimas 2 versões)

### Deployment Verification

**Ambiente de Desenvolvimento**
```powershell
.\scripts\start.ps1 dev
```
- [ ] Todos os containers iniciaram
- [ ] Frontend acessível em http://localhost:3000
- [ ] API acessível em http://localhost:3001
- [ ] Swagger em http://localhost:3001/api
- [ ] Hot-reload funcionando

**Ambiente de Produção**
```powershell
.\scripts\start.ps1 prod
```
- [ ] Build otimizado
- [ ] Nginx funcionando como proxy
- [ ] Logs estruturados
- [ ] Backup automático configurado

---

## Próximos Passos

Após aprovação deste plano, a implementação seguirá esta ordem:

1. **Fase 1 - Infraestrutura** (1-2 dias)
   - Criar estrutura de pastas
   - Configurar Docker Compose
   - Scripts de inicialização

2. **Fase 2 - Backend Core** (3-5 dias)
   - Setup NestJS
   - Auth + RBAC
   - Database migrations
   - Módulos básicos

3. **Fase 3 - Frontend Base** (2-3 dias)
   - Setup Next.js
   - Layout e componentes UI
   - Integração com API
   - Tela de login

4. **Fase 4 - Módulos de Negócio** (5-7 dias)
   - PDV/Vendas
   - Produção/Fila
   - Estoque
   - Clientes

5. **Fase 5 - Real-time & Workers** (2-3 dias)
   - WebSocket
   - Background jobs
   - Notificações

6. **Fase 6 - Relatórios & Dashboard** (2-3 dias)
   - Métricas
   - Gráficos
   - Exportação

7. **Fase 7 - Testes & Deploy** (2-3 dias)
   - Testes automatizados
   - Documentação
   - Deploy final

**Tempo estimado total: 17-26 dias**
