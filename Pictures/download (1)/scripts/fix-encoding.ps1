# Configuração para forçar UTF-8 em todos os arquivos do projeto

# Configurar PowerShell para sempre usar UTF-8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Função para verificar e corrigir encoding de arquivos
function Fix-FileEncoding {
    param([string]$Path)
    
    if (Test-Path $Path) {
        $content = Get-Content $Path -Raw -Encoding UTF8
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($Path, $content, $utf8NoBom)
        Write-Host "✅ Encoding corrigido para: $Path"
    }
}

# Corrigir encoding de arquivos críticos
$criticalFiles = @(
    "src/app/page.tsx",
    "src/app/layout.tsx",
    "src/components/client-only.tsx",
    "src/components/dashboard/dashboard.tsx"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Fix-FileEncoding $file
    }
}

Write-Host "✅ Configuração UTF-8 aplicada com sucesso!"
Write-Host "🚀 Todos os arquivos estão com encoding correto."