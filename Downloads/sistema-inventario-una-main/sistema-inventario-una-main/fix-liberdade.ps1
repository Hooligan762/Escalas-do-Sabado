# 🛠️ CORREÇÃO DIRETA CAMPUS LIBERDADE - SOLUÇÃO AIMORES
# Executa a mesma correção que funcionou no Campus Aimores

Write-Host "🛠️ INICIANDO CORREÇÃO ESPECÍFICA DO CAMPUS LIBERDADE..." -ForegroundColor Green
Write-Host "📋 Baseada na solução que funcionou no Campus Aimores" -ForegroundColor Yellow

# URL da API de correção
$apiUrl = "https://sistema-inventario-una-production.up.railway.app/api/fix-liberdade"

Write-Host ""
Write-Host "🔍 1. Verificando status atual..." -ForegroundColor Cyan

try {
    $statusResponse = Invoke-RestMethod -Uri $apiUrl -Method GET -ContentType "application/json"
    Write-Host "📊 Status atual:" -ForegroundColor Green
    $statusResponse | ConvertTo-Json -Depth 3 | Write-Host
    
    if ($statusResponse.phantomItems -gt 0) {
        Write-Host "🚨 $($statusResponse.phantomItems) item(s) fantasma encontrado(s)!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erro ao verificar status: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🛠️ 2. Executando correção (igual ao Aimores)..." -ForegroundColor Cyan

try {
    $fixResponse = Invoke-RestMethod -Uri $apiUrl -Method POST -ContentType "application/json"
    Write-Host "✅ CORREÇÃO APLICADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "📋 Resultados:" -ForegroundColor Yellow
    
    if ($fixResponse.results) {
        foreach ($result in $fixResponse.results) {
            Write-Host "  • $result" -ForegroundColor White
        }
    }
    
    if ($fixResponse.finalState) {
        Write-Host "📊 Estado final: $($fixResponse.finalState.inventoryItems) itens, $($fixResponse.finalState.users) usuários" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erro na correção: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tentando acessar diretamente a página de correção..." -ForegroundColor Yellow
    
    # Abrir página de correção no navegador
    Start-Process "https://sistema-inventario-una-production.up.railway.app/admin/fix-liberdade"
}

Write-Host ""
Write-Host "✅ PROCESSO CONCLUÍDO!" -ForegroundColor Green
Write-Host "🔗 Sistema: https://sistema-inventario-una-production.up.railway.app" -ForegroundColor Cyan
Write-Host "🧪 Teste o campo 'Fixo' no Campus Liberdade" -ForegroundColor Yellow

# Perguntar se quer abrir o sistema no navegador
$openBrowser = Read-Host "Deseja abrir o sistema no navegador? (s/n)"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Start-Process "https://sistema-inventario-una-production.up.railway.app"
}