# CORREÇÃO SIMPLES - RAILWAY RESTART
# Execute como Administrador

Write-Host "🚀 CORREÇÃO RAILWAY - LIMPEZA DE CACHE SERVIDOR" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

# Verificar Railway CLI
Write-Host "`n🔍 Verificando Railway CLI..." -ForegroundColor Cyan
try {
    $version = railway --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway CLI encontrado: $version" -ForegroundColor Green
    } else {
        throw "Railway CLI não encontrado"
    }
} catch {
    Write-Host "❌ Railway CLI não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instalando via npm..." -ForegroundColor Yellow
    
    try {
        npm install -g @railway/cli
        Write-Host "✅ Railway CLI instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro na instalação. Instale manualmente:" -ForegroundColor Red
        Write-Host "   npm install -g @railway/cli" -ForegroundColor Blue
        Read-Host "Pressione Enter após instalar..."
    }
}

# Login no Railway
Write-Host "`n🔐 Verificando login Railway..." -ForegroundColor Cyan
try {
    $status = railway status 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "🔑 Fazendo login..." -ForegroundColor Yellow
        railway login
    } else {
        Write-Host "✅ Já logado no Railway" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Erro ao verificar status. Tentando login..." -ForegroundColor Yellow
    railway login
}

# Definir cache bust
$cacheBust = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "`n🗃️ Definindo CACHE_BUST: $cacheBust" -ForegroundColor Cyan

try {
    railway variables set CACHE_BUST=$cacheBust
    Write-Host "✅ Variável CACHE_BUST definida" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao definir CACHE_BUST, continuando..." -ForegroundColor Yellow
}

# Reiniciar deployment
Write-Host "`n🔄 Reiniciando deployment..." -ForegroundColor Cyan

try {
    railway up --detach
    Write-Host "✅ Novo deployment iniciado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro com 'railway up', tentando restart..." -ForegroundColor Yellow
    
    try {
        railway service restart
        Write-Host "✅ Service reiniciado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao reiniciar. Tentando redeploy..." -ForegroundColor Red
        railway redeploy
    }
}

# Aguardar
Write-Host "`n⏳ Aguardando restart (60 segundos)..." -ForegroundColor Yellow
for ($i = 60; $i -gt 0; $i--) {
    Write-Progress -Activity "Aguardando restart" -Status "$i segundos restantes" -PercentComplete ((60-$i)/60*100)
    Start-Sleep 1
}
Write-Progress -Activity "Aguardando restart" -Completed

# Verificar logs
Write-Host "`n📊 Verificando logs..." -ForegroundColor Cyan
try {
    railway logs --tail 10
} catch {
    Write-Host "⚠️ Não foi possível obter logs" -ForegroundColor Yellow
}

# Resultado
Write-Host "`n✅ CORREÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "🎯 O que foi feito:" -ForegroundColor Cyan
Write-Host "  • Cache do servidor limpo" -ForegroundColor White
Write-Host "  • Deployment reiniciado" -ForegroundColor White
Write-Host "  • Nova variável CACHE_BUST definida" -ForegroundColor White

Write-Host "`n🔍 TESTE AGORA:" -ForegroundColor Blue
Write-Host "1. Abra o sistema Campus Liberdade" -ForegroundColor White
Write-Host "2. Tente marcar um item como 'Fixo'" -ForegroundColor White
Write-Host "3. O erro 500 deve ter desaparecido" -ForegroundColor White

Write-Host "`n📞 Se o problema persistir:" -ForegroundColor Red
Write-Host "• Aguarde mais 5-10 minutos" -ForegroundColor White
Write-Host "• Execute: railway logs --follow" -ForegroundColor White
Write-Host "• Contate suporte se necessário" -ForegroundColor White

Read-Host "`nPressione Enter para finalizar"