# ImprimiAqui3D - Windows Deployment Setup Script
# Versão: 1.0.0 (Premium V2.0)

$ErrorActionPreference = "Stop"

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "   ImprimiAqui3D - Setup de Produção (Windows)   " -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

# 1. Verificar Pré-requisitos
Write-Host "[1/5] Verificando pré-requisitos..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
    Write-Host "  [OK] Docker & Docker Compose encontrados." -ForegroundColor Green
} catch {
    Write-Error "Docker ou Docker Compose não estão instalados. Por favor, instale o Docker Desktop antes de continuar."
    exit
}

# 2. Criar Estrutura de Pastas para Volumes
Write-Host "`n[2/5] Criando estrutura de volumes persistentes..." -ForegroundColor Yellow
$directories = @(
    "backend/uploads",
    "backend/logs",
    "docker/nginx/logs",
    "docker/postgres/data"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  [+] Criado: $dir" -ForegroundColor Gray
    } else {
        Write-Host "  [ ] Já existe: $dir" -ForegroundColor Gray
    }
}

# 3. Gerar Arquivos de Ambiente (.env) se não existirem
Write-Host "`n[3/5] Configurando variáveis de ambiente..." -ForegroundColor Yellow

function Generate-EnvFile {
    param($Path, $Template)
    if (-not (Test-Path $Path)) {
        $Template | Out-File -FilePath $Path -Encoding utf8
        Write-Host "  [+] Gerado: $Path" -ForegroundColor Green
    } else {
        Write-Host "  [!] Aviso: $Path já existe. Pulando geração automática." -ForegroundColor Magenta
    }
}

# Backend Production Env
$backendTemplate = @"
NODE_ENV=production
PORT=3001
API_PREFIX=api

DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=imprimiaqui
DB_PASSWORD=$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_}) )
DB_DATABASE=imprimiaqui3d
DB_SYNCHRONIZE=false
DB_LOGGING=false

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_}) )

JWT_SECRET=$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}) )
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=$( -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}) )
JWT_REFRESH_EXPIRES_IN=7d

MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads
CORS_ORIGIN=http://localhost
THROTTLE_TTL=60
THROTTLE_LIMIT=100
"@

# Frontend Production Env
$frontendTemplate = @"
NEXT_PUBLIC_API_URL=http://localhost/api
NEXT_PUBLIC_WS_URL=http://localhost
NEXT_PUBLIC_APP_NAME=ImprimiAqui3D
NEXT_PUBLIC_APP_VERSION=1.0.0
"@

Generate-EnvFile -Path "backend/.env.production" -Template $backendTemplate
Generate-EnvFile -Path "frontend/.env.production" -Template $frontendTemplate

# 4. Sincronizar Senhas no Docker-Compose
Write-Host "`n[4/5] Sincronização de segurança finalizada." -ForegroundColor Yellow
Write-Host "  Nota: As senhas foram geradas aleatoriamente para sua segurança." -ForegroundColor Gray

# 6. Configurar Inicialização Automática (Opcional)
Write-Host "`n[6/6] Configurar inicialização automática?" -ForegroundColor Yellow
$opt = Read-Host "Deseja que o sistema inicie junto com o Windows? (s/N)"
if ($opt -eq 's' -or $opt -eq 'S') {
    $startupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
    $vbsPath = "$startupPath\ImprimiAqui3D.vbs"
    $scriptRoot = Get-Location
    $startScript = Join-Path $scriptRoot "scripts\start.ps1"
    
    $vbsContent = @"
Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -File ""$startScript"" -Environment prod", 0, False
"@
    $vbsContent | Out-File -FilePath $vbsPath -Encoding ascii
    Write-Host "  [OK] Script de inicialização criado em: $vbsPath" -ForegroundColor Green
    Write-Host "  Nota: O sistema iniciará em segundo plano no próximo login." -ForegroundColor Gray
} else {
    Write-Host "  [ ] Inicialização automática ignorada." -ForegroundColor Gray
}

# 7. Finalização
Write-Host "`n[✓] Setup concluído com sucesso!" -ForegroundColor Green
Write-Host "`nPróximos passos:" -ForegroundColor Cyan
Write-Host "  1. Revise os arquivos .env.production criados."
Write-Host "  2. Execute: .\scripts\start.ps1 -Environment prod" -ForegroundColor Green
Write-Host "  3. Acesse http://localhost no seu navegador." -ForegroundColor White

Write-Host "`n===============================================" -ForegroundColor Cyan
