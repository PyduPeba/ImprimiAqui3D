#!/bin/bash
# ImprimiAqui3D - Linux Deployment Setup Script
# Versão: 1.0.0 (Premium V2.0)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "\n${CYAN}===============================================${NC}"
echo -e "${CYAN}   ImprimiAqui3D - Setup de Produção (Linux)   ${NC}"
echo -e "${CYAN}===============================================\n${NC}"

# 1. Verificar Pré-requisitos
echo -e "${YELLOW}[1/5] Verificando pré-requisitos...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ERRO] Docker não encontrado. Por favor, instale o Docker primeiro.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}[ERRO] Docker Compose não encontrado. Instale o plugin com: sudo apt install docker-compose-v2${NC}"
    exit 1
fi
echo -e "  ${GREEN}[OK] Docker & Docker Compose encontrados.${NC}"

# 2. Criar Estrutura de Pastas para Volumes
echo -e "\n${YELLOW}[2/5] Criando estrutura de volumes persistentes...${NC}"
directories=(
    "backend/uploads"
    "backend/logs"
    "docker/nginx/logs"
    "docker/postgres/data"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        echo -e "  ${NC}[+] Criado: $dir${NC}"
    else
        echo -e "  ${NC}[ ] Já existe: $dir${NC}"
    fi
done

# Garantir permissões
chmod -R 775 backend/uploads backend/logs docker/nginx/logs

# 3. Gerar Arquivos de Ambiente (.env) se não existirem
echo -e "\n${YELLOW}[3/5] Configurando variáveis de ambiente...${NC}"

generate_password() {
    < /dev/urandom tr -dc 'A-Za-z0-9' | head -c "$1"
}

# Gerar senhas
DB_PASS=$(generate_password 24)
REDIS_PASS=$(generate_password 24)
JWT_SEC=$(generate_password 64)
JWT_REFRESH=$(generate_password 64)

if [ ! -f "backend/.env.production" ]; then
    cat <<EOF > backend/.env.production
NODE_ENV=production
PORT=3001
API_PREFIX=api

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=imprimiaqui
DB_PASSWORD=$DB_PASS
DB_DATABASE=imprimiaqui3d
DB_SYNCHRONIZE=false
DB_LOGGING=false

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASS

JWT_SECRET=$JWT_SEC
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_REFRESH_EXPIRES_IN=7d

MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
CORS_ORIGIN=http://localhost
THROTTLE_TTL=60
THROTTLE_LIMIT=100
EOF
    echo -e "  ${GREEN}[+] Gerado: backend/.env.production${NC}"
else
    echo -e "  ${NC}[!] Aviso: backend/.env.production já existe. Pulando.${NC}"
fi

if [ ! -f "frontend/.env.production" ]; then
    cat <<EOF > frontend/.env.production
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=http://localhost
NEXT_PUBLIC_APP_NAME=ImprimiAqui3D
NEXT_PUBLIC_APP_VERSION=1.0.0
EOF
    echo -e "  ${GREEN}[+] Gerado: frontend/.env.production${NC}"
else
    echo -e "  ${NC}[!] Aviso: frontend/.env.production já existe. Pulando.${NC}"
fi

# 5. Configurar Inicialização Automática (Opcional)
echo -e "\n${YELLOW}[5/6] Configurar inicialização automática?${NC}"
read -p "Deseja que o sistema inicie junto com o Linux? (s/N): " opt
if [[ "$opt" =~ ^[Ss]$ ]]; then
    AUTOSTART_DIR="$HOME/.config/autostart"
    mkdir -p "$AUTOSTART_DIR"
    
    cat <<EOF > "$AUTOSTART_DIR/imprimiaqui3d.desktop"
[Desktop Entry]
Type=Application
Name=ImprimiAqui3D
Comment=Sistema de Gestão de Impressão 3D
Exec=$(pwd)/scripts/start.sh
Terminal=false
X-GNOME-Autostart-enabled=true
EOF
    chmod +x "$AUTOSTART_DIR/imprimiaqui3d.desktop"
    
    # Criar um atalho start.sh simples se não existir
    if [ ! -f "scripts/start.sh" ]; then
        cat <<EOF > scripts/start.sh
#!/bin/bash
cd $(pwd)
docker-compose up -d
EOF
        chmod +x scripts/start.sh
    fi
    
    echo -e "  ${GREEN}[OK] Entrada de autostart criada em: $AUTOSTART_DIR/imprimiaqui3d.desktop${NC}"
else
    echo -e "  ${NC}[ ] Inicialização automática ignorada.${NC}"
fi

# 6. Finalização
echo -e "\n${YELLOW}[6/6] Setup concluído com sucesso!${NC}"
echo -e "\n${CYAN}Próximos passos:${NC}"
echo -e "  1. Revise os arquivos .env.production criados."
echo -e "  2. Execute: ${GREEN}docker-compose up -d --build${NC}"
echo -e "  3. Acesse http://localhost no seu navegador."
echo -e "\n${CYAN}===============================================${NC}"
