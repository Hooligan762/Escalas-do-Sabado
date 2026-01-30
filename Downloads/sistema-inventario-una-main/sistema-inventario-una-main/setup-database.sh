#!/bin/bash

# Script de inicialização automática do banco de dados Railway
echo "🚀 Iniciando configuração do banco de dados Railway..."

# Aguardar PostgreSQL estar disponível
echo "⏳ Aguardando PostgreSQL estar disponível..."
until pg_isready -h postgres.railway.internal -p 5432 -U postgres; do
  echo "Aguardando PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL está disponível!"

# Verificar se as tabelas já existem
echo "🔍 Verificando se o banco já foi configurado..."
TABLES_EXIST=$(psql $DATABASE_URL -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'campus';" 2>/dev/null || echo "0")

if [ "$TABLES_EXIST" -gt "0" ]; then
  echo "✅ Banco já configurado! Tabelas existem."
else
  echo "🔧 Configurando banco de dados pela primeira vez..."
  
  # Executar script de setup
  psql $DATABASE_URL -f railway-database-setup.sql
  
  if [ $? -eq 0 ]; then
    echo "✅ Banco de dados configurado com sucesso!"
    echo "📊 Verificando dados inseridos..."
    psql $DATABASE_URL -c "SELECT COUNT(*) as total_campus FROM campus;"
    psql $DATABASE_URL -c "SELECT COUNT(*) as total_users FROM users;"
  else
    echo "❌ Erro ao configurar banco de dados!"
    exit 1
  fi
fi

echo "🎯 Configuração do banco concluída!"