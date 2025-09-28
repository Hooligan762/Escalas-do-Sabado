Write-Host "🚀 Conectando ao GitHub..." -ForegroundColor Cyan
Write-Host "Certifique-se de que você criou o repositório 'sistema-inventario-una' no GitHub" -ForegroundColor Yellow
Write-Host ""

# Solicitar username do GitHub
$github_username = Read-Host "Digite seu username do GitHub (ou pressione Enter se for 'Hooligan762')"

# Usar valor padrão se não fornecido
if ([string]::IsNullOrEmpty($github_username)) {
    $github_username = "Hooligan762"
}

Write-Host "Usando username: $github_username" -ForegroundColor Green
Write-Host ""

try {
    # Adicionar repositório remoto
    Write-Host "🔗 Adicionando repositório remoto..." -ForegroundColor Cyan
    git remote add origin "https://github.com/$github_username/sistema-inventario-una.git"

    # Configurar branch principal
    Write-Host "🌟 Configurando branch principal..." -ForegroundColor Cyan
    git branch -M main

    # Fazer push
    Write-Host "⬆️  Fazendo upload para GitHub..." -ForegroundColor Cyan
    git push -u origin main

    Write-Host ""
    Write-Host "✅ Sistema enviado para GitHub com sucesso!" -ForegroundColor Green
    Write-Host "🌐 Repositório: https://github.com/$github_username/sistema-inventario-una" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🚀 Próximo passo: Acesse https://railway.app para fazer o deploy!" -ForegroundColor Magenta

} catch {
    Write-Host "❌ Erro durante o upload:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Certifique-se de que:" -ForegroundColor Yellow
    Write-Host "1. O repositório foi criado no GitHub" -ForegroundColor White
    Write-Host "2. Você tem permissão para fazer push" -ForegroundColor White
    Write-Host "3. Sua autenticação GitHub está configurada" -ForegroundColor White
}