# MONITORAMENTO PÓS-CORREÇÃO - SISTEMA INVENTÁRIO UNA
# Execute após aplicar a correção emergencial

param(
    [string]$Duration = "60",  # Duração em minutos
    [string]$Interval = "30"   # Intervalo entre verificações em segundos
)

Write-Host "📊 INICIANDO MONITORAMENTO DO SISTEMA..." -ForegroundColor Yellow
Write-Host "⏱️  Duração: $Duration minutos" -ForegroundColor Gray
Write-Host "🔄 Intervalo: $Interval segundos" -ForegroundColor Gray
Write-Host ""

$startTime = Get-Date
$endTime = $startTime.AddMinutes([int]$Duration)
$checks = 0
$successCount = 0
$errorCount = 0

# Obter URL do projeto
try {
    $projectUrl = railway status | Select-String -Pattern "https://.*\.railway\.app" | ForEach-Object { $_.Matches[0].Value }
    Write-Host "🔗 Monitorando: $projectUrl" -ForegroundColor Blue
} catch {
    Write-Host "⚠️ Não foi possível obter URL automaticamente" -ForegroundColor Yellow
    $projectUrl = Read-Host "Digite a URL do projeto Railway"
}

Write-Host ""
Write-Host "🟢 = Sistema OK | 🟡 = Lento | 🔴 = Erro | 📊 = Informações" -ForegroundColor Gray
Write-Host "----------------------------------------" -ForegroundColor Gray

while ((Get-Date) -lt $endTime) {
    $checks++
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    try {
        # Testar página principal
        $mainResponse = Invoke-WebRequest -Uri $projectUrl -Method GET -TimeoutSec 10
        $mainTime = (Measure-Command { 
            Invoke-WebRequest -Uri $projectUrl -Method GET -TimeoutSec 10 
        }).TotalMilliseconds
        
        # Testar API de health (se existir)
        $apiHealthUrl = "$projectUrl/api/health"
        try {
            $apiResponse = Invoke-WebRequest -Uri $apiHealthUrl -Method GET -TimeoutSec 5
            $apiStatus = "✅ API OK"
        } catch {
            $apiStatus = "⚠️ API N/A"
        }
        
        # Testar página de login
        $loginUrl = "$projectUrl/login"
        try {
            $loginResponse = Invoke-WebRequest -Uri $loginUrl -Method GET -TimeoutSec 5
            $loginStatus = "✅ Login OK"
        } catch {
            $loginStatus = "⚠️ Login Erro"
        }
        
        # Determinar status geral
        if ($mainResponse.StatusCode -eq 200) {
            $successCount++
            
            if ($mainTime -lt 2000) {
                $speedIcon = "🟢"
                $speedText = "Rápido"
            } elseif ($mainTime -lt 5000) {
                $speedIcon = "🟡"
                $speedText = "Normal"
            } else {
                $speedIcon = "🟠"
                $speedText = "Lento"
            }
            
            Write-Host "[$timestamp] $speedIcon Sistema funcionando ($speedText - ${mainTime}ms) | $apiStatus | $loginStatus" -ForegroundColor Green
        } else {
            $errorCount++
            Write-Host "[$timestamp] 🔴 Erro HTTP: $($mainResponse.StatusCode)" -ForegroundColor Red
        }
        
    } catch {
        $errorCount++
        $errorMsg = $_.Exception.Message
        
        if ($errorMsg -match "timeout|timed out") {
            Write-Host "[$timestamp] 🔴 Timeout - Sistema muito lento ou inativo" -ForegroundColor Red
        } elseif ($errorMsg -match "500|Internal Server Error") {
            Write-Host "[$timestamp] 🔴 ERRO 500 - PROBLEMA CRÍTICO DETECTADO!" -ForegroundColor Red
            Write-Host "   🚨 Possível retorno do problema dos IDs fantasma" -ForegroundColor Yellow
        } elseif ($errorMsg -match "404|Not Found") {
            Write-Host "[$timestamp] 🔴 Erro 404 - Página não encontrada" -ForegroundColor Red
        } else {
            Write-Host "[$timestamp] 🔴 Erro de conexão: $($errorMsg.Substring(0, [Math]::Min(50, $errorMsg.Length)))" -ForegroundColor Red
        }
    }
    
    # Mostrar estatísticas a cada 10 verificações
    if ($checks % 10 -eq 0) {
        $successRate = [math]::Round(($successCount / $checks) * 100, 1)
        $uptime = $endTime.Subtract((Get-Date)).TotalMinutes
        
        Write-Host ""
        Write-Host "📊 [$timestamp] Estatísticas:" -ForegroundColor Cyan
        Write-Host "   Verificações: $checks | Sucessos: $successCount | Erros: $errorCount" -ForegroundColor White
        Write-Host "   Taxa de sucesso: $successRate% | Tempo restante: $([math]::Round($uptime, 1)) min" -ForegroundColor White
        Write-Host ""
    }
    
    Start-Sleep -Seconds ([int]$Interval)
}

# Relatório final
Write-Host ""
Write-Host "📋 RELATÓRIO FINAL DO MONITORAMENTO:" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$totalTime = $endTime.Subtract($startTime).TotalMinutes
$finalSuccessRate = [math]::Round(($successCount / $checks) * 100, 1)

Write-Host "⏱️  Duração total: $([math]::Round($totalTime, 1)) minutos" -ForegroundColor White
Write-Host "🔢 Total de verificações: $checks" -ForegroundColor White
Write-Host "✅ Sucessos: $successCount" -ForegroundColor Green
Write-Host "❌ Erros: $errorCount" -ForegroundColor Red
Write-Host "📊 Taxa de sucesso: $finalSuccessRate%" -ForegroundColor Cyan

Write-Host ""
if ($finalSuccessRate -ge 95) {
    Write-Host "🎉 SISTEMA ESTÁVEL! Taxa de sucesso excelente." -ForegroundColor Green
    Write-Host "✅ Correção foi bem-sucedida." -ForegroundColor Green
} elseif ($finalSuccessRate -ge 80) {
    Write-Host "⚠️ Sistema relativamente estável, mas com alguns problemas." -ForegroundColor Yellow
    Write-Host "🔍 Recomenda-se investigação adicional." -ForegroundColor Yellow
} else {
    Write-Host "🚨 SISTEMA INSTÁVEL! Taxa de sucesso baixa." -ForegroundColor Red
    Write-Host "❌ Correção pode não ter sido efetiva." -ForegroundColor Red
    Write-Host "🔧 Ações recomendadas:" -ForegroundColor Yellow
    Write-Host "   1. railway deployment rollback" -ForegroundColor White
    Write-Host "   2. railway logs --follow" -ForegroundColor White
    Write-Host "   3. Contactar suporte técnico" -ForegroundColor White
}

Write-Host ""
Write-Host "📝 Para continuar monitoramento:" -ForegroundColor Blue
Write-Host "   .\monitor-system.ps1 -Duration 120 -Interval 60" -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para finalizar..."