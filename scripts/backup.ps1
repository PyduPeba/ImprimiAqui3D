# ImprimiAqui3D - Script de Backup Automático
# Este script faz backup do banco de dados e arquivos STL

$ErrorActionPreference = "Stop"

Write-Host "💾 ImprimiAqui3D - Backup Automático" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Configurações
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backups\$timestamp"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Criar diretório de backup
Write-Host "📁 Criando diretório de backup..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$projectRoot\$backupDir" | Out-Null
Write-Host "✅ Diretório criado: $backupDir" -ForegroundColor Green

# Backup do banco de dados
Write-Host ""
Write-Host "🗄️  Fazendo backup do banco de dados..." -ForegroundColor Cyan

try {
    # Verificar se o container postgres está rodando
    $postgresRunning = docker ps --filter "name=imprimiaqui3d-postgres" --format "{{.Names}}" 2>$null
    
    if (-not $postgresRunning) {
        Write-Host "⚠️  Container PostgreSQL não está rodando" -ForegroundColor Yellow
        Write-Host "   Tentando usar container de desenvolvimento..." -ForegroundColor Yellow
        $postgresRunning = docker ps --filter "name=imprimiaqui3d-postgres-dev" --format "{{.Names}}" 2>$null
    }
    
    if ($postgresRunning) {
        $containerName = $postgresRunning
        Write-Host "   Container encontrado: $containerName" -ForegroundColor Gray
        
        # Fazer dump do banco
        docker exec -t $containerName pg_dump -U imprimiaqui imprimiaqui3d > "$projectRoot\$backupDir\database.sql"
        
        $dbSize = (Get-Item "$projectRoot\$backupDir\database.sql").Length / 1KB
        Write-Host "✅ Backup do banco concluído ($([math]::Round($dbSize, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "❌ Container PostgreSQL não encontrado" -ForegroundColor Red
        Write-Host "   Pulando backup do banco de dados" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao fazer backup do banco: $_" -ForegroundColor Red
}

# Backup dos arquivos STL
Write-Host ""
Write-Host "📦 Fazendo backup dos arquivos STL..." -ForegroundColor Cyan

$uploadsPath = "$projectRoot\backend\uploads"

if (Test-Path $uploadsPath) {
    try {
        # Verificar se há arquivos
        $fileCount = (Get-ChildItem -Path $uploadsPath -Recurse -File).Count
        
        if ($fileCount -gt 0) {
            Compress-Archive -Path "$uploadsPath\*" -DestinationPath "$projectRoot\$backupDir\uploads.zip" -Force
            
            $zipSize = (Get-Item "$projectRoot\$backupDir\uploads.zip").Length / 1MB
            Write-Host "✅ Backup de $fileCount arquivo(s) concluído ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Nenhum arquivo encontrado em uploads/" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro ao fazer backup dos arquivos: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Pasta uploads/ não encontrada" -ForegroundColor Yellow
}

# Backup das configurações (.env files)
Write-Host ""
Write-Host "⚙️  Fazendo backup das configurações..." -ForegroundColor Cyan

try {
    $configFiles = @()
    
    # Procurar arquivos .env
    if (Test-Path "$projectRoot\backend\.env") {
        $configFiles += "$projectRoot\backend\.env"
    }
    if (Test-Path "$projectRoot\backend\.env.production") {
        $configFiles += "$projectRoot\backend\.env.production"
    }
    if (Test-Path "$projectRoot\frontend\.env.local") {
        $configFiles += "$projectRoot\frontend\.env.local"
    }
    if (Test-Path "$projectRoot\frontend\.env.production") {
        $configFiles += "$projectRoot\frontend\.env.production"
    }
    
    if ($configFiles.Count -gt 0) {
        # Criar pasta temporária para configs
        $tempConfigDir = "$projectRoot\$backupDir\configs"
        New-Item -ItemType Directory -Force -Path $tempConfigDir | Out-Null
        
        foreach ($file in $configFiles) {
            $fileName = Split-Path $file -Leaf
            $parentDir = Split-Path (Split-Path $file -Parent) -Leaf
            Copy-Item $file -Destination "$tempConfigDir\${parentDir}_$fileName"
        }
        
        Compress-Archive -Path "$tempConfigDir\*" -DestinationPath "$projectRoot\$backupDir\configs.zip" -Force
        Remove-Item -Path $tempConfigDir -Recurse -Force
        
        Write-Host "✅ Backup de $($configFiles.Count) arquivo(s) de configuração concluído" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Nenhum arquivo de configuração encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao fazer backup das configurações: $_" -ForegroundColor Red
}

# Resumo do backup
Write-Host ""
Write-Host "📊 Resumo do Backup:" -ForegroundColor Cyan
Write-Host "   Localização: $backupDir" -ForegroundColor White

$backupFiles = Get-ChildItem -Path "$projectRoot\$backupDir" -File
$totalSize = ($backupFiles | Measure-Object -Property Length -Sum).Sum / 1MB

Write-Host "   Arquivos: $($backupFiles.Count)" -ForegroundColor White
Write-Host "   Tamanho total: $([math]::Round($totalSize, 2)) MB" -ForegroundColor White

Write-Host ""
foreach ($file in $backupFiles) {
    $size = $file.Length / 1KB
    Write-Host "   - $($file.Name) ($([math]::Round($size, 2)) KB)" -ForegroundColor Gray
}

# Limpeza de backups antigos (manter últimos 30 dias)
Write-Host ""
Write-Host "🧹 Limpando backups antigos (>30 dias)..." -ForegroundColor Cyan

try {
    $oldBackups = Get-ChildItem -Path "$projectRoot\backups" -Directory | 
                  Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) }
    
    if ($oldBackups.Count -gt 0) {
        foreach ($backup in $oldBackups) {
            Remove-Item -Path $backup.FullName -Recurse -Force
            Write-Host "   🗑️  Removido: $($backup.Name)" -ForegroundColor Gray
        }
        Write-Host "✅ $($oldBackups.Count) backup(s) antigo(s) removido(s)" -ForegroundColor Green
    } else {
        Write-Host "✅ Nenhum backup antigo para remover" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Erro ao limpar backups antigos: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Para restaurar:" -ForegroundColor Cyan
Write-Host "   Banco:    Get-Content backups\$timestamp\database.sql | docker exec -i imprimiaqui3d-postgres psql -U imprimiaqui imprimiaqui3d" -ForegroundColor Gray
Write-Host "   Arquivos: Expand-Archive backups\$timestamp\uploads.zip -DestinationPath backend\uploads\" -ForegroundColor Gray
