# ImprimiAqui3D - Guia de Desenvolvimento

Este documento contém informações para desenvolvedores que desejam contribuir ou entender o código do ImprimiAqui3D.

## 🛠️ Setup do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js v20.9.0
- Docker Desktop
- Git
- VSCode (recomendado)

### Extensões VSCode Recomendadas

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker",
    "firsttris.vscode-jest-runner"
  ]
}
```

### Instalação Local (sem Docker)

#### Backend

```powershell
cd backend
npm install
```

Criar arquivo `.env`:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=imprimiaqui
DB_PASSWORD=imprimiaqui_secure_2026
DB_DATABASE=imprimiaqui3d
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=dev_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d
```

Iniciar serviços necessários:
```powershell
# Apenas Postgres e Redis via Docker
docker-compose up -d postgres redis
```

Executar migrations:
```powershell
npm run migration:run
```

Executar seeds:
```powershell
npm run seed:run
```

Iniciar em modo desenvolvimento:
```powershell
npm run start:dev
```

#### Frontend

```powershell
cd frontend
npm install
```

Criar arquivo `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=ImprimiAqui3D
NEXT_PUBLIC_APP_VERSION=1.0.0-dev
```

Iniciar em modo desenvolvimento:
```powershell
npm run dev
```

---

## 📁 Estrutura de Código

### Backend (NestJS)

```
backend/src/
├── main.ts                 # Entry point
├── app.module.ts           # Módulo raiz
├── common/                 # Código compartilhado
│   ├── decorators/         # Decorators customizados
│   ├── filters/            # Exception filters
│   ├── guards/             # Guards de autenticação/autorização
│   ├── interceptors/       # Interceptors (logging, transform)
│   └── pipes/              # Validation pipes
├── config/                 # Configurações
│   └── database.config.ts
├── database/
│   ├── migrations/         # TypeORM migrations
│   └── seeds/              # Dados iniciais
└── [modules]/              # Módulos de negócio
    ├── [module].controller.ts
    ├── [module].service.ts
    ├── [module].module.ts
    ├── dto/                # Data Transfer Objects
    ├── entities/           # TypeORM entities
    └── interfaces/         # TypeScript interfaces
```

### Frontend (Next.js)

```
frontend/src/
├── app/                    # App Router (Next.js 14+)
│   ├── layout.tsx          # Layout raiz
│   ├── page.tsx            # Página inicial
│   ├── login/              # Rota /login
│   └── (dashboard)/        # Grupo de rotas protegidas
│       ├── layout.tsx      # Layout do dashboard
│       ├── caixa/
│       ├── producao/
│       ├── estoque/
│       ├── clientes/
│       ├── relatorios/
│       └── configuracoes/
├── components/
│   ├── ui/                 # Componentes base (Button, Input, etc.)
│   └── features/           # Componentes específicos
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useSocket.ts
│   └── useApi.ts
├── lib/                    # Utilitários
│   ├── api.ts              # Cliente API (axios)
│   ├── socket.ts           # Cliente Socket.IO
│   └── utils.ts            # Funções auxiliares
├── types/                  # TypeScript types
└── styles/                 # Estilos globais
```

---

## 🎨 Convenções de Código

### TypeScript

- **Sempre** usar TypeScript estrito
- **Sempre** tipar parâmetros e retornos de funções
- Evitar `any`, preferir `unknown` quando necessário
- Usar interfaces para objetos, types para unions/intersections

```typescript
// ✅ Bom
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Ruim
function getUser(id: any): any {
  // ...
}
```

### Nomenclatura

- **Classes/Interfaces**: PascalCase (`UserService`, `CreateSaleDto`)
- **Funções/Variáveis**: camelCase (`getUserById`, `totalPrice`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_VERSION`)
- **Arquivos**: kebab-case (`user.service.ts`, `create-sale.dto.ts`)

### Imports

Ordem de imports:
1. Bibliotecas externas
2. Módulos internos (aliases)
3. Imports relativos

```typescript
// 1. Externas
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 2. Internas (aliases)
import { User } from '@/auth/entities/user.entity';
import { CreateUserDto } from '@/auth/dto/create-user.dto';

// 3. Relativas
import { UserRole } from './enums/user-role.enum';
```

---

## 🧪 Testes

### Backend (Jest)

**Estrutura:**
```
src/
├── auth/
│   ├── auth.service.ts
│   ├── auth.service.spec.ts      # Testes unitários
│   ├── auth.controller.ts
│   └── auth.controller.spec.ts
```

**Executar testes:**
```powershell
# Todos os testes
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E
npm run test:e2e
```

**Exemplo de teste unitário:**
```typescript
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      // Arrange
      const loginDto = { email: 'test@test.com', password: 'password' };
      const user = { id: '1', email: 'test@test.com', password: 'hashed' };
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);
      
      // Act
      const result = await service.login(loginDto);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
    });
  });
});
```

### Frontend (Jest + React Testing Library)

**Executar testes:**
```powershell
npm run test
npm run test:watch
```

**Exemplo de teste de componente:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

---

## 🗄️ Banco de Dados

### Migrations

**Criar nova migration:**
```powershell
npm run migration:create -- src/database/migrations/CreateUsersTable
```

**Executar migrations:**
```powershell
npm run migration:run
```

**Reverter última migration:**
```powershell
npm run migration:revert
```

**Exemplo de migration:**
```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1706300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['ADMIN', 'MANAGER', 'OPERATOR', 'CLIENT'],
            default: "'OPERATOR'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

### Seeds

**Executar seeds:**
```powershell
npm run seed:run
```

**Exemplo de seed:**
```typescript
import { DataSource } from 'typeorm';
import { User } from '@/auth/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = userRepository.create({
    email: 'admin@imprimiaqui3d.com.br',
    password: adminPassword,
    role: 'ADMIN',
    isActive: true,
  });

  await userRepository.save(admin);
  console.log('✅ Admin user created');
}
```

---

## 🔌 API Design

### DTOs (Data Transfer Objects)

**Sempre** usar DTOs para validação de entrada:

```typescript
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
```

### Responses Padronizadas

**Sucesso:**
```typescript
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-26T22:00:00Z",
    "requestId": "uuid"
  }
}
```

**Erro:**
```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [...]
  },
  "meta": {
    "timestamp": "2026-01-26T22:00:00Z",
    "requestId": "uuid"
  }
}
```

### Paginação

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🎨 Frontend - Componentes

### Componentes UI Base

Criar componentes reutilizáveis em `components/ui/`:

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'rounded-lg font-medium transition-colors',
          {
            'bg-green-600 hover:bg-green-700 text-white': variant === 'primary',
            'bg-gray-200 hover:bg-gray-300 text-gray-900': variant === 'secondary',
            'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

### Hooks Customizados

```typescript
// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
}
```

---

## 🔄 Git Workflow

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-da-feature` - Novas features
- `fix/nome-do-bug` - Correções
- `hotfix/nome-do-hotfix` - Correções urgentes em produção

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona módulo de relatórios
fix: corrige cálculo de preço por peso
docs: atualiza README com instruções de deploy
style: formata código com prettier
refactor: reorganiza estrutura de pastas
test: adiciona testes para AuthService
chore: atualiza dependências
```

### Pull Requests

1. Criar branch a partir de `develop`
2. Fazer commits atômicos e descritivos
3. Atualizar testes
4. Atualizar documentação se necessário
5. Criar PR para `develop`
6. Aguardar code review
7. Merge após aprovação

---

## 🐛 Debug

### Backend

**VSCode launch.json:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to NestJS",
      "port": 9229,
      "restart": true,
      "stopOnEntry": false,
      "protocol": "inspector"
    }
  ]
}
```

**Iniciar com debug:**
```powershell
npm run start:debug
```

### Frontend

**Next.js DevTools:**
- React DevTools (extensão Chrome/Firefox)
- Next.js DevTools (built-in)

**Console logs:**
```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.table(arrayData);
```

---

## 📊 Performance

### Backend

- Usar índices no banco de dados
- Implementar cache com Redis
- Paginação em listagens
- Eager loading apenas quando necessário
- Connection pooling

### Frontend

- Code splitting automático (Next.js)
- Image optimization (`next/image`)
- Lazy loading de componentes
- Memoização (`useMemo`, `useCallback`)
- Prefetching de rotas

---

## 🔐 Segurança

### Checklist

- [ ] Validação de entrada (DTOs)
- [ ] Sanitização de dados
- [ ] Rate limiting
- [ ] CORS configurado
- [ ] Headers de segurança (Helmet)
- [ ] Senhas hasheadas (bcrypt)
- [ ] JWT com expiração curta
- [ ] Refresh tokens
- [ ] HTTPS em produção
- [ ] Variáveis de ambiente seguras

---

## 📚 Recursos Úteis

### Documentação Oficial

- [NestJS](https://docs.nestjs.com/)
- [Next.js](https://nextjs.org/docs)
- [TypeORM](https://typeorm.io/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Socket.IO](https://socket.io/docs/)

### Ferramentas

- [Postman](https://www.postman.com/) - Testar API
- [TablePlus](https://tableplus.com/) - Cliente PostgreSQL
- [Redis Commander](https://github.com/joeferner/redis-commander) - Cliente Redis

---

**Versão:** 1.0.0  
**Última atualização:** 2026-01-26
