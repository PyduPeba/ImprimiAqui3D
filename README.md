# 🖨️ ImprimiAqui3D

> Sistema completo de gestão para negócios de impressão 3D — do orçamento à entrega, simples e do jeito brasileiro.

[![Node.js](https://img.shields.io/badge/Node.js-20.9.0-green.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10+-red.svg)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

![ImprimiAqui3D Interface](docs/Login%20e%20Tela%20Inicial.png)

## 📋 Sobre o Projeto

**ImprimiAqui3D** é um sistema PDV + Web para gestão completa de negócios de impressão 3D, desenvolvido especialmente para o mercado brasileiro. Ideal para:

- 🏪 Pequenas e médias gráficas 3D
- 🔧 Oficinas maker
- 💼 Empreendedores de impressão 3D
- 🏫 Uso institucional (escolas, IFs, prefeituras, fab labs)

## ✨ Funcionalidades Principais

### 🏪 PDV - ImprimiAqui3D Caixa
- ⚡ Venda rápida
- 📊 Orçamento por peça
- 🧮 Cálculo automático por tempo, material e peso
- 💳 Múltiplas formas de pagamento (PIX, Dinheiro, Cartão)
- 🧾 Emissão de recibo

### 🖨️ Produção - ImprimiAqui3D Print
- 📋 Fila de impressão em tempo real
- 🔄 Status: Aguardando, Imprimindo, Finalizado, Falha
- 🖨️ Controle por impressora
- ⏱️ Tempo estimado vs real

### 📦 Estoque - ImprimiAqui3D Material
- 📊 Controle de filamentos (PLA, ABS, PETG, etc.)
- ➕➖ Entrada/saída automática
- ⚠️ Alerta de estoque baixo
- 💰 Custo médio por material

### 👥 Clientes - ImprimiAqui3D Clientes
- 📝 Cadastro simples
- 📜 Histórico de impressões
- 📁 Arquivos STL vinculados
- 🎁 Programa de fidelização (futuro)

### 🛡️ Segurança & Perfis - ImprimiAqui3D Security
- 👥 Gerenciamento de usuários (RBAC: Admin, Manager, Operator)
- 🔒 Controle de acesso por cargo
- 👤 Minha Conta: Edição de perfil e troca de senha
- 🚦 Ativação/Desativação de contas em tempo real

### 📊 Gestão Web - ImprimiAqui3D Web
- 📈 Dashboard de produção em tempo real
- 💵 Faturamento diário/mensal
- 🏆 Peças mais impressas
- 🖨️ Impressoras mais usadas
- 📄 Relatórios exportáveis (PDF/Excel)

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14+** - Framework React com App Router
- **TailwindCSS** - Estilização moderna e responsiva
- **Socket.IO Client** - Atualizações em tempo real
- **Recharts** - Gráficos e visualizações

### Backend
- **NestJS** - Framework Node.js enterprise
- **TypeORM** - ORM type-safe com migrations
- **PostgreSQL 16** - Banco de dados relacional
- **Redis** - Cache e filas
- **Socket.IO** - WebSocket para real-time
- **Bull** - Processamento de jobs em background

### DevOps
- **Docker & Docker Compose** - Containerização
- **Nginx** - Reverse proxy
- **PowerShell** - Scripts de automação

## 🚀 Quick Start

### Pré-requisitos

- ✅ Docker Desktop instalado e rodando
- ✅ Node.js v20.9.0
- ✅ PowerShell 5.1+

### Instalação

1. **Clone o repositório** (ou navegue até a pasta do projeto)
   ```powershell
   cd C:\Users\CeearaU\Desktop\ImprimiAqui3D
   ```

2. **Inicie o sistema**
   ```powershell
   .\scripts\start.ps1 dev
   ```

3. **Acesse o sistema**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001/api
   - Swagger: http://localhost:3001/api/docs

4. **Login padrão**
   - Email: `admin@imprimiaqui3d.com.br`
   - Senha: `admin123` ⚠️ *Alterar após primeiro login!*

## 📚 Documentação

- 🚀 [Guia de Inicialização Rápida](docs/getting-started.md) - Como rodar o projeto localmente
- 📖 [Guia de Deploy](docs/deployment.md) - Instalação, configuração e troubleshooting
- 🏗️ [Arquitetura do Sistema](docs/architecture.md) - Estrutura técnica e decisões de design
- 📋 [Plano de Implementação](docs/implementation_plan.md) - Roadmap detalhado
- ✅ [Task List](docs/task.md) - Checklist de desenvolvimento

## 🏗️ Estrutura do Projeto

```
ImprimiAqui3D/
├── frontend/              # Next.js Application
├── backend/               # NestJS API
├── docs/                  # Documentação
│   ├── deployment.md
│   ├── architecture.md
│   ├── implementation_plan.md
│   └── task.md
├── docker/                # Configurações Docker
│   ├── nginx/
│   └── postgres/
├── scripts/               # Scripts de automação
│   ├── start.ps1
│   └── backup.ps1
├── docker-compose.yml     # Orquestração de containers
└── README.md
```

## 🔐 Segurança

- 🔒 Autenticação JWT + Refresh Token
- 👥 RBAC (Admin, Manager, Operator, Client)
- 🛡️ Validação rigorosa de dados
- 🚫 Rate limiting
- 📝 Logs de auditoria
- 💾 Backup automático

## 🎯 Roadmap

### ✅ Fase 1 - MVP (Concluído)
- [x] Arquitetura base
- [x] Documentação completa
- [x] Implementação dos módulos principais (Vendas, Catálogo, Produção)
- [x] Gerenciamento de Usuários e Segurança
- [ ] Testes automatizados (Iniciado)

### 🔄 Fase 2 - Melhorias
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoramento (Prometheus + Grafana)
- [ ] Logs centralizados (ELK Stack)
- [ ] Cobertura de testes >80%

### 🚀 Fase 3 - Escala
- [ ] Kubernetes
- [ ] Microservices
- [ ] Object storage (MinIO/S3)
- [ ] Multi-região

### 💡 Fase 4 - Features
- [ ] App mobile (React Native)
- [ ] Integração WhatsApp
- [ ] Marketplace de modelos 3D
- [ ] IA para estimativa de preço

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para dúvidas, problemas ou sugestões:

- 📧 Email: suporte@imprimiaqui3d.com.br
- 📖 Documentação: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/seu-usuario/imprimiaqui3d/issues)

## 🙏 Agradecimentos

Desenvolvido com ❤️ para a comunidade maker brasileira.

---

**Versão:** 1.1.0  
**Última atualização:** 2026-03-14
