# Walkthrough - Módulo de Configurações (Fase 1)

## Escopo
Implementação da Fase 1 do módulo de configurações, focando na fundação do sistema e personalização da identidade visual e regras financeiras básicas.

## Alterações Realizadas

### Backend
- **Entidade Store**: Atualizada para suportar JSON Schema robusto (`settings` column) contendo:
  - `branding`: Logo, cores.
  - `finance`: Taxas de cartão, pix, marketplace.
  - `pricing`: Custos padrão.
  - `reports`: Textos customizáveis.
- **Controller**: Novos endpoints:
  - `GET /system-config/store`: Recupera configurações.
  - `PATCH /system-config/store`: Atualiza configurações parcial ou total.
  - `POST /system-config/upload-logo`: Upload de imagens para `./uploads/config`.

### Troubleshooting
> [!IMPORTANT]
> Se você receber erro 404 ao salvar configurações, é provável que o usuário Admin não esteja vinculado a uma Loja.
> Execute o script `backend/init_store.sql` para criar a loja padrão e vincular o admin.
> **Necessário fazer Logout/Login após essa correção.**

### Frontend
- **Página de Configurações**: Nova rota `/configuracoes` com navegação lateral.
- **Abas Implementadas**:
  - `Geral`: Upload de Logo e seleção de cores do tema.
  - `Financeiro`: Configuração de taxas de cartão (por parcela) e PIX.
  - `Precificação`: Definição de custos hora/material e margem padrão.
  - `Documentos`: Edição de termos e rodapé para relatórios PDF.

## Como Testar
1. Acesse `/configuracoes` no painel.
2. Faça upload de uma logo na aba **Geral**.
3. Configure as taxas de cartão na aba **Financeiro**.
4. Defina os termos de garantia na aba **Documentos**.
5. Clique em **Salvar Alterações** e verifique o toast de sucesso.

## Fase 1.5 - Integração e Ajustes (Concluído)

### Alterações Realizadas
- **Correção 404**: Script `init_store.sql` para vincular admin à loja.
- **Frontend Polish**:
  - `FinancialSettings`: Inputs agora aceitam decimais (ex: 8,89).
  - `ThemeProvider`: As cores configuradas na aba "Geral" agora são aplicadas em todo o sistema.
- **Integração Backend**:
  - **Precificação Dinâmica**: O sistema agora usa o custo do material e da impressora cadastrados. Se não houver, usa os valores padrão configurados na loja.
  - **PDF Real**: Implementação do gerador de PDF (Puppeteer) que usa a Logo, Cores e Termos configurados na loja.
  - **Sidebar/Header**: A logo da loja configurada agora aparece no menu lateral.
  - **Login Dinâmico**: A tela de login agora exibe o Nome e Logo da loja configurados.
  - **Configurações**: Adicionados campos para Nome da Loja e botão para remover a logo.
  - **Workers**: Correção na fila de geração de PDF.

## Como Testar
1. **Tema**: Mude as cores em Configurações > Geral e recarregue a página.
2. **Financeiro**: Teste valores decimais nas taxas.
3. **PDF**: Gere um novo orçamento e verifique se a logo e os termos aparecem.
4. **Precificação**: Crie um orçamento e verifique se o cálculo respeita os custos cadastrados (ou os padrões da loja).
## Fase 2 - Segurança e Gestão de Usuários (Concluído)

### Alterações Realizadas
- **Gerenciamento de Usuários**: Aba "Segurança & Perfis" permite CRUD completo de colaboradores.
- **RBAC**: Implementação de perfis `ADMIN`, `MANAGER` e `OPERATOR`.
- **Minha Conta**: Tela pessoal para alteração de nome e senha.
- **Correção de Bugs**: Sincronização de dados do usuário no header e sidebar em tempo real.

## Como Testar
1. Acesse **Configurações > Segurança & Perfis**.
2. Cadastre um novo usuário com perfil `OPERATOR`.
3. Tente acessar a mesma aba com o novo usuário (deve dar Acesso Negado).
4. Em **Minha Conta**, altere o nome do usuário e verifique se o topo do sistema atualiza imediatamente.
