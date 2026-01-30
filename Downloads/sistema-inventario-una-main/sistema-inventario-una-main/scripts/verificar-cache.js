#!/usr/bin/env node

/**
 * Script para verificar se o Railway está com a versão correta do código
 * e diagnosticar problemas de cache
 */

const https = require('https');

const SITE_URL = 'https://inventarionsiuna.com.br';
const CHECK_INTERVAL = 5000; // 5 segundos
const MAX_ATTEMPTS = 12; // 1 minuto total

console.log('🔍 Verificador de Cache - Sistema Inventário UNA\n');
console.log(`📍 URL de Produção: ${SITE_URL}`);
console.log(`⏱️  Verificando versão do código...\n`);
console.log('════════════════════════════════════════════════════════════\n');

async function fetchPage() {
  return new Promise((resolve, reject) => {
    https.get(SITE_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function checkVersion() {
  try {
    const html = await fetchPage();
    
    // Procurar pelo arquivo JavaScript principal
    const jsFileMatch = html.match(/\/_next\/static\/chunks\/pages\/page-([a-f0-9]+)\.js/);
    
    if (jsFileMatch) {
      const currentHash = jsFileMatch[1];
      console.log(`📦 Arquivo JS atual: page-${currentHash}.js`);
      
      // Verificar se contém o código corrigido
      const jsUrl = `https://inventarionsiuna.com.br/_next/static/chunks/pages/page-${currentHash}.js`;
      
      console.log(`🔍 Baixando arquivo JavaScript...`);
      
      https.get(jsUrl, (res) => {
        let jsContent = '';
        res.on('data', chunk => jsContent += chunk);
        res.on('end', () => {
          // Verificar se tem o log da versão corrigida
          const hasCorrectVersion = jsContent.includes('retornando todos setores (já filtrados no backend)');
          const hasOldVersion = jsContent.includes('Filtrando setores para técnico');
          
          console.log('\n📊 Análise do Código:\n');
          
          if (hasCorrectVersion) {
            console.log('✅ VERSÃO CORRETA DETECTADA!');
            console.log('   - Contém: "retornando todos setores (já filtrados no backend)"');
            console.log('   - Commit: e00d619 (fix: remove filtro duplicado)');
            console.log('\n🎉 Railway está com o código CORRETO!\n');
            console.log('⚠️  SE AINDA NÃO FUNCIONA NO NAVEGADOR:\n');
            console.log('   1. O problema é CACHE DO NAVEGADOR');
            console.log('   2. Solução: Abrir aba anônima (CTRL + SHIFT + N)');
            console.log('   3. Ou limpar cache: CTRL + SHIFT + DELETE');
            console.log('\n💡 TESTE DEFINITIVO:');
            console.log('   - Abra aba anônima');
            console.log('   - Acesse: https://inventarionsiuna.com.br');
            console.log('   - Login: aimores / aimores');
            console.log('   - Console (F12): deve ver "✅ retornando todos setores"');
            console.log('   - Criar setor: DEVE APARECER imediatamente!');
            console.log('\n   Se funcionar em aba anônima → É CACHE! 100%\n');
          } else if (hasOldVersion) {
            console.log('❌ VERSÃO ANTIGA DETECTADA!');
            console.log('   - Contém: "Filtrando setores para técnico"');
            console.log('   - Commit: c134f30 (versão bugada)');
            console.log('\n⚠️  Railway ainda não atualizou ou deploy falhou!');
            console.log('   1. Verificar logs do Railway');
            console.log('   2. Forçar redeploy se necessário');
          } else {
            console.log('⚠️  NÃO FOI POSSÍVEL DETERMINAR A VERSÃO');
            console.log('   - Arquivo JS muito minificado ou estrutura diferente');
            console.log('   - Teste manualmente no navegador');
          }
          
          // Verificar hash específico do commit c134f30 (versão bugada)
          if (currentHash === '2bf171e322df3830') {
            console.log('\n🚨 ATENÇÃO: Hash do arquivo é o ANTIGO!');
            console.log('   Este é o hash do commit c134f30 (bugado)');
            console.log('   Railway precisa fazer rebuild');
          }
        });
      }).on('error', (err) => {
        console.error('❌ Erro ao baixar JavaScript:', err.message);
      });
      
    } else {
      console.log('⚠️  Não foi possível detectar o arquivo JavaScript');
      console.log('   HTML retornado pode estar incompleto ou estrutura mudou');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar:', error.message);
  }
}

// Executar verificação
checkVersion();
