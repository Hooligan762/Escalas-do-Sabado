#!/usr/bin/env node
/**
 * Script de Verificação de Deploy - Sistema Inventário UNA
 * 
 * Este script verifica se o deploy no Railway foi concluído com sucesso
 * checando a versão dos arquivos JavaScript em produção.
 */

const https = require('https');

const PRODUCTION_URL = 'https://inventarionsiuna.com.br';
const CHECK_INTERVAL = 5000; // 5 segundos
const MAX_ATTEMPTS = 60; // 5 minutos total

let attempt = 0;

console.log('🔍 Verificador de Deploy - Sistema Inventário UNA\n');
console.log('📍 URL de Produção:', PRODUCTION_URL);
console.log('⏱️  Verificando a cada 5 segundos...\n');
console.log('═'.repeat(60));

function checkDeploy() {
  attempt++;
  
  const timeElapsed = Math.floor((attempt * CHECK_INTERVAL) / 1000);
  console.log(`\n🔄 Tentativa ${attempt}/${MAX_ATTEMPTS} (${timeElapsed}s decorridos)`);

  https.get(PRODUCTION_URL, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      // Procura pelo hash dos arquivos JavaScript
      const pageMatch = data.match(/page-([a-f0-9]+)\.js/);
      const chunkMatch = data.match(/4bd1b696-([a-f0-9]+)\.js/);
      
      if (pageMatch) {
        const currentHash = pageMatch[1];
        console.log(`📦 Hash do page.js: ${currentHash}`);
        
        // Se o hash mudou de bb5fd5c046e1d2ec, o deploy foi concluído
        if (currentHash !== 'bb5fd5c046e1d2ec') {
          console.log('\n✅ DEPLOY CONCLUÍDO!');
          console.log('═'.repeat(60));
          console.log('\n🎉 Nova versão detectada!');
          console.log(`📊 Hash anterior: bb5fd5c046e1d2ec`);
          console.log(`📊 Hash atual: ${currentHash}`);
          console.log('\n🧪 Próximos passos:');
          console.log('   1. Limpe o cache do navegador (CTRL + SHIFT + R)');
          console.log('   2. Faça login no sistema');
          console.log('   3. Teste a aba "Gerenciamento"');
          console.log('   4. Verifique o console (F12) - não deve ter erro React #31');
          console.log('\n═'.repeat(60));
          process.exit(0);
        } else {
          console.log('⏳ Ainda é a versão antiga. Deploy em progresso...');
          
          if (attempt < MAX_ATTEMPTS) {
            setTimeout(checkDeploy, CHECK_INTERVAL);
          } else {
            console.log('\n❌ TIMEOUT: Deploy demorou mais de 5 minutos');
            console.log('\n📋 Ações recomendadas:');
            console.log('   1. Verifique o dashboard do Railway manualmente');
            console.log('   2. Procure por erros nos logs de build');
            console.log('   3. Tente fazer um redeploy manual se necessário');
            process.exit(1);
          }
        }
      } else {
        console.log('⚠️  Não foi possível detectar o hash do arquivo');
        if (attempt < MAX_ATTEMPTS) {
          setTimeout(checkDeploy, CHECK_INTERVAL);
        }
      }
    });
  }).on('error', (err) => {
    console.error('❌ Erro ao verificar:', err.message);
    if (attempt < MAX_ATTEMPTS) {
      setTimeout(checkDeploy, CHECK_INTERVAL);
    } else {
      process.exit(1);
    }
  });
}

// Inicia a verificação
checkDeploy();
