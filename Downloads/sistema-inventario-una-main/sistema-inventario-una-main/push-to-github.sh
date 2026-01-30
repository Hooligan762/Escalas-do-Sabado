#!/bin/bash

echo "🚀 Conectando ao GitHub..."
echo "Certifique-se de que você criou o repositório 'sistema-inventario-una' no GitHub"
echo ""

# Solicitar username do GitHub
echo "Digite seu username do GitHub (ou pressione Enter se for 'Hooligan762'):"
read github_username

# Usar valor padrão se não fornecido
if [ -z "$github_username" ]; then
    github_username="Hooligan762"
fi

echo "Usando username: $github_username"
echo ""

# Adicionar repositório remoto
echo "🔗 Adicionando repositório remoto..."
git remote add origin "https://github.com/$github_username/sistema-inventario-una.git"

# Configurar branch principal
echo "🌟 Configurando branch principal..."
git branch -M main

# Fazer push
echo "⬆️  Fazendo upload para GitHub..."
git push -u origin main

echo ""
echo "✅ Sistema enviado para GitHub com sucesso!"
echo "🌐 Repositório: https://github.com/$github_username/sistema-inventario-una"
echo ""
echo "🚀 Próximo passo: Acesse https://railway.app para fazer o deploy!"
