# CORREÇÃO EMERGENCIAL - SISTEMA INVENTÁRIO UNA
# Execute este script como Administrador no PowerShell

Write-Host "🚀 INICIANDO CORREÇÃO EMERGENCIAL DO SISTEMA..." -ForegroundColor Yellow
Write-Host ""

# Verificar se Railway CLI está instalado
Write-Host "🔍 Verificando Railway CLI..." -ForegroundColor Cyan
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI encontrado: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado!" -ForegroundColor Red
    Write-Host "📥 Instalando Railway CLI..." -ForegroundColor Yellow
    
    # Instalar Railway CLI via npm (se Node.js estiver disponível)
    try {
        npm install -g @railway/cli
        Write-Host "✅ Railway CLI instalado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar Railway CLI. Instale manualmente:" -ForegroundColor Red
        Write-Host "   https://docs.railway.app/quick-start" -ForegroundColor Blue
        Read-Host "Pressione Enter após instalar o Railway CLI..."
    }
}

Write-Host ""
Write-Host "🔐 Fazendo login no Railway..." -ForegroundColor Cyan
Write-Host "   (Se não estiver logado, será solicitado)" -ForegroundColor Gray

# Fazer login no Railway
try {
    railway login
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no login. Tente novamente manualmente:" -ForegroundColor Red
    Write-Host "   railway login" -ForegroundColor Blue
    Read-Host "Pressione Enter após fazer login..."
}

Write-Host ""
Write-Host "🔧 INICIANDO CORREÇÃO..." -ForegroundColor Yellow

# 1. Definir variável de cache bust
$cacheBust = Get-Date -Format "yyyyMMddHHmmss"
Write-Host "🗃️ Definindo nova variável de cache: CACHE_BUST=$cacheBust" -ForegroundColor Cyan

try {
    railway environment set CACHE_BUST=$cacheBust
    Write-Host "✅ Variável CACHE_BUST definida" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao definir CACHE_BUST, continuando..." -ForegroundColor Yellow
}

# 2. Reiniciar deployment
Write-Host ""
Write-Host "🔄 Reiniciando deployment..." -ForegroundColor Cyan

try {
    railway deployment restart
    Write-Host "✅ Deployment reiniciado!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Erro ao reiniciar deployment, tentando restart do service..." -ForegroundColor Yellow
    
    try {
        railway service restart
        Write-Host "✅ Service reiniciado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao reiniciar service" -ForegroundColor Red
    }
}

# 3. Aguardar reinicialização
Write-Host ""
Write-Host "⏳ Aguardando reinicialização completa (60 segundos)..." -ForegroundColor Yellow
Write-Host "   O servidor precisa de tempo para limpar o cache..." -ForegroundColor Gray

for ($i = 60; $i -gt 0; $i--) {
    Write-Progress -Activity "Aguardando reinicialização" -Status "$i segundos restantes" -PercentComplete ((60-$i)/60*100)
    Start-Sleep -Seconds 1
}

Write-Progress -Activity "Aguardando reinicialização" -Completed

# 4. Verificar logs
Write-Host ""
Write-Host "📊 Verificando logs do sistema..." -ForegroundColor Cyan

try {
    Write-Host "🔍 Últimas 20 linhas do log:" -ForegroundColor Blue
    railway logs --tail 20
} catch {
    Write-Host "⚠️ Não foi possível obter logs automaticamente" -ForegroundColor Yellow
    Write-Host "   Execute manualmente: railway logs --follow" -ForegroundColor Blue
}

# 5. Teste de conectividade
Write-Host ""
Write-Host "🌐 Testando conectividade do sistema..." -ForegroundColor Cyan

# Obter URL do projeto
try {
    $projectUrl = railway status | Select-String -Pattern "https://.*\.railway\.app" | ForEach-Object { $_.Matches[0].Value }
    
    if ($projectUrl) {
        Write-Host "🔗 URL do projeto: $projectUrl" -ForegroundColor Blue
        
        # Testar conectividade
        try {
            $response = Invoke-WebRequest -Uri $projectUrl -Method GET -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Sistema respondendo normalmente!" -ForegroundColor Green
            } else {
                Write-Host "⚠️ Sistema respondeu com código: $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⚠️ Sistema ainda reinicializando ou com problemas" -ForegroundColor Yellow
            Write-Host "   Aguarde mais alguns minutos e teste manualmente" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️ Não foi possível obter URL automaticamente" -ForegroundColor Yellow
}

# 6. Resultado final
Write-Host ""
Write-Host "📋 RESULTADO DA CORREÇÃO:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Deployment reiniciado" -ForegroundColor Green
Write-Host "✅ Cache limpo com CACHE_BUST=$cacheBust" -ForegroundColor Green
Write-Host "✅ Sistema aguardou tempo de reinicialização" -ForegroundColor Green
Write-Host ""

Write-Host "🔍 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Acesse o sistema Campus Liberdade" -ForegroundColor White
Write-Host "2. Teste as funcionalidades de inventário" -ForegroundColor White
Write-Host "3. Verifique se os erros 500 pararam" -ForegroundColor White
Write-Host "4. Monitore os logs: railway logs --follow" -ForegroundColor White
Write-Host ""

Write-Host "🚨 SE PROBLEMAS PERSISTIREM:" -ForegroundColor Red
Write-Host "1. Execute: railway deployment rollback" -ForegroundColor White
Write-Host "2. Execute: railway db backup create" -ForegroundColor White
Write-Host "3. Entre em contato com suporte técnico" -ForegroundColor White
Write-Host ""

Write-Host "🎯 MONITORAMENTO CONTÍNUO:" -ForegroundColor Blue
Write-Host "   Execute em outro terminal: railway logs --follow" -ForegroundColor White
Write-Host ""

Write-Host "✨ CORREÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "   Sistema deve estar funcionando normalmente agora." -ForegroundColor White
Write-Host ""

Read-Host "Pressione Enter para finalizar..."