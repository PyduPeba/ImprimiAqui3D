# ImprimiAqui3D - Script de Inicializacao
# Este script inicia todo o sistema com um unico comando

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'prod')]
    [string]$Environment = 'dev'
)

$ErrorActionPreference = "Stop"

Write-Host "??  ImprimiAqui3D - Sistema de Gestao de Impressao 3D" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""

# Verificar se Docker esta rodando
Write-Host "?? Verificando Docker..." -ForegroundColor Cyan
try {
    docker info | Out-Null
    Write-Host "? Docker esta rodando" -ForegroundColor Green
} catch {
    Write-Host "? Docker nao esta rodando!" -ForegroundColor Red
    Write-Host "   Por favor, inicie o Docker Desktop e tente novamente." -ForegroundColor Yellow
    exit 1
}

# Verificar arquivos .env
Write-Host ""
Write-Host "?? Verificando arquivos de configuracao..." -ForegroundColor Cyan

if ($Environment -eq 'dev') {
    $backendEnv = "backend\.env"
    $frontendEnv = "frontend\.env.local"
    $composeFile = "docker-compose.dev.yml"
} else {
    $backendEnv = "backend\.env.production"
    $frontendEnv = "frontend\.env.production"
    $composeFile = "docker-compose.yml"
}

$missingFiles = @()

if (-not (Test-Path $backendEnv)) {
    $missingFiles += $backendEnv
}

if (-not (Test-Path $frontendEnv)) {
    $missingFiles += $frontendEnv
}

if ($missingFiles.Count -gt 0) {
    Write-Host "??  Arquivos de configuracao faltando:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "? Consulte docs/deployment.md para criar os arquivos necessarios." -ForegroundColor Cyan
    
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne 's' -and $continue -ne 'S') {
        exit 1
    }
}

Write-Host "? Verificacao concluida" -ForegroundColor Green

# Parar containers existentes
Write-Host ""
Write-Host "? Parando containers existentes..." -ForegroundColor Cyan
$oldEAP = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker-compose -f $composeFile down 2>$null
$ErrorActionPreference = $oldEAP

# Iniciar servicos
Write-Host ""
Write-Host "? Iniciando servicos ($Environment)..." -ForegroundColor Cyan
Write-Host ""

if ($Environment -eq 'dev') {
    Write-Host "? Modo Desenvolvimento:" -ForegroundColor Yellow
    Write-Host "   - Hot-reload habilitado" -ForegroundColor Gray
    Write-Host "   - Debug port: 9229" -ForegroundColor Gray
    Write-Host "   - Volumes montados para live coding" -ForegroundColor Gray
    Write-Host ""
    
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker-compose -f $composeFile up -d
    $ErrorActionPreference = $oldEAP
} else {
    Write-Host "? Modo Producao:" -ForegroundColor Yellow
    Write-Host "   - Build otimizado" -ForegroundColor Gray
    Write-Host "   - Nginx reverse proxy" -ForegroundColor Gray
    Write-Host "   - Logs em arquivo" -ForegroundColor Gray
    Write-Host ""
    
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    docker-compose -f $composeFile up -d --build
    $ErrorActionPreference = $oldEAP
}

# Aguardar servicos ficarem prontos
Write-Host ""
Write-Host "? Aguardando servicos ficarem prontos..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# Verificar status dos containers
Write-Host ""
Write-Host "? Status dos servicos:" -ForegroundColor Cyan
docker-compose -f $composeFile ps

# Exibir logs iniciais
Write-Host ""
Write-Host "? Logs iniciais:" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
docker-compose -f $composeFile logs --tail=10

# Informacoes de acesso
Write-Host ""
Write-Host "? Sistema iniciado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "? Acesse o sistema:" -ForegroundColor Cyan

if ($Environment -eq 'dev') {
    Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "   API:       http://localhost:3001/api" -ForegroundColor White
    Write-Host "   Swagger:   http://localhost:3001/api/docs" -ForegroundColor White
    Write-Host "   Debug:     localhost:9229" -ForegroundColor White
} else {
    Write-Host "   Sistema:   http://localhost" -ForegroundColor White
    Write-Host "   API:       http://localhost/api" -ForegroundColor White
}

Write-Host ""
Write-Host "? Credenciais padrao:" -ForegroundColor Cyan
Write-Host "   Email:     admin@imprimiaqui3d.com.br" -ForegroundColor White
Write-Host "   Senha:     admin123" -ForegroundColor White
Write-Host "   ?  Altere apos primeiro login!" -ForegroundColor Yellow

Write-Host ""
Write-Host "? Comandos uteis:" -ForegroundColor Cyan
Write-Host "   Ver logs:        docker-compose -f $composeFile logs -f" -ForegroundColor Gray
Write-Host "   Parar sistema:   docker-compose -f $composeFile down" -ForegroundColor Gray
Write-Host "   Reiniciar:       docker-compose -f $composeFile restart" -ForegroundColor Gray

Write-Host ""
Write-Host "=================================================" -ForegroundColor Green
Write-Host "? Bom trabalho!" -ForegroundColor Green
