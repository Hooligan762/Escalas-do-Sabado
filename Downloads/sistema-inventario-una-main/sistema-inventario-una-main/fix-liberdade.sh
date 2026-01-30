#!/bin/bash

# 🛠️ CORREÇÃO DIRETA CAMPUS LIBERDADE - SOLUÇÃO AIMORES
# Executa a mesma correção que funcionou no Campus Aimores

echo "🛠️ INICIANDO CORREÇÃO ESPECÍFICA DO CAMPUS LIBERDADE..."
echo "📋 Baseada na solução que funcionou no Campus Aimores"

# URL da API de correção
API_URL="https://sistema-inventario-una-production.up.railway.app/api/fix-liberdade"

echo ""
echo "🔍 1. Verificando status atual..."
curl -X GET "$API_URL" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "🛠️ 2. Executando correção (igual ao Aimores)..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -w "\n\nStatus: %{http_code}\n"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "🔗 Acesse: https://sistema-inventario-una-production.up.railway.app"
echo "🧪 Teste o campo 'Fixo' no Campus Liberdade"