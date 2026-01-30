/**
 * LIMPEZA UNIVERSAL PARA TODOS OS CAMPUS
 * Script JavaScript puro para executar no Console do navegador
 */

console.log('🌍 LIMPEZA UNIVERSAL - TODOS OS CAMPUS INICIADA');
console.log('='.repeat(60));

// Lista de IDs problemáticos conhecidos (expandir conforme necessário)
const PHANTOM_IDS = [
  'e806ca85-2304-49f0-ac04-3cb96d026465', // Campus Liberdade
  // Adicionar outros IDs problemáticos aqui
];

// Função para detectar itens problemáticos
function detectarProblemas() {
  console.log('🔍 Detectando problemas no localStorage...');
  
  const problemas = {
    phantomIds: [],
    invalidIds: [],
    incompleteData: [],
    total: 0
  };
  
  try {
    // Verificar inventory_data
    const inventoryData = localStorage.getItem('inventory_data');
    if (inventoryData) {
      const inventory = JSON.parse(inventoryData);
      if (Array.isArray(inventory)) {
        
        inventory.forEach(item => {
          // IDs fantasma conhecidos
          if (PHANTOM_IDS.includes(item.id)) {
            problemas.phantomIds.push(item.id);
          }
          
          // IDs inválidos (não UUID)
          if (!item.id || !item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            problemas.invalidIds.push(item.id || 'NULL');
          }
          
          // Dados incompletos
          if (!item.campus || !item.category || !item.setor || 
              item.campus === 'undefined' || item.category === 'undefined') {
            problemas.incompleteData.push(item.id || 'NULL');
          }
        });
        
        problemas.total = problemas.phantomIds.length + problemas.invalidIds.length + problemas.incompleteData.length;
      }
    }
    
    console.log('📊 Problemas detectados:');
    console.log(`  👻 IDs fantasma: ${problemas.phantomIds.length}`);
    console.log(`  ❌ IDs inválidos: ${problemas.invalidIds.length}`);
    console.log(`  📝 Dados incompletos: ${problemas.incompleteData.length}`);
    console.log(`  🎯 Total: ${problemas.total}`);
    
    if (problemas.total > 0) {
      console.log('⚠️  PROBLEMAS ENCONTRADOS - Limpeza necessária');
    } else {
      console.log('✅ NENHUM PROBLEMA ENCONTRADO - Sistema limpo');
    }
    
    return problemas;
    
  } catch (error) {
    console.error('❌ Erro ao detectar problemas:', error);
    return { ...problemas, error: true };
  }
}

// Função para executar limpeza completa
function limpezaCompleta() {
  console.log('🧹 Iniciando limpeza completa...');
  
  const keysParaLimpar = [
    'inventory_data',
    'user_data',
    'campus_data', 
    'categories_data',
    'sectors_data',
    'auth_data',
    'dashboard_data',
    'statistics_data'
  ];
  
  let removidas = 0;
  
  // Limpar localStorage
  keysParaLimpar.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`  🗑️ Removido: ${key}`);
      removidas++;
    }
  });
  
  // Limpar sessionStorage
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
  });
  
  if (sessionKeys.length > 0) {
    console.log(`  🗑️ SessionStorage limpo: ${sessionKeys.length} itens`);
  }
  
  // Tentar limpar IndexedDB
  if ('indexedDB' in window) {
    indexedDB.databases?.().then(databases => {
      databases.forEach(db => {
        if (db.name && (db.name.includes('inventory') || db.name.includes('sistema'))) {
          indexedDB.deleteDatabase(db.name);
          console.log(`  🗑️ IndexedDB removido: ${db.name}`);
        }
      });
    }).catch(() => {
      // Ignorar erros de IndexedDB
    });
  }
  
  console.log(`✅ Limpeza concluída: ${removidas} chaves removidas`);
  return removidas;
}

// Função principal
function corrigirTodosCampus() {
  console.log('🎯 CORREÇÃO UNIVERSAL PARA TODOS OS CAMPUS');
  console.log('');
  
  // 1. Detectar problemas
  const problemas = detectarProblemas();
  
  // 2. Executar limpeza se necessário
  if (problemas.total > 0 || problemas.error) {
    console.log('');
    console.log('🔧 Executando correção...');
    
    const removidas = limpezaCompleta();
    
    if (removidas > 0) {
      console.log('');
      console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('📋 Resumo:');
      console.log(`  • Problemas detectados: ${problemas.total}`);
      console.log(`  • Chaves removidas: ${removidas}`);
      console.log('  • Status: CORRIGIDO');
      
      // Notificar usuário
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sistema de Inventário', {
          body: `Corrigidos ${problemas.total} problemas. Recarregando página...`,
          icon: '/favicon.svg'
        });
      }
      
      // Recarregar página
      console.log('');
      console.log('🔄 Recarregando página em 3 segundos...');
      console.log('⏰ 3...');
      setTimeout(() => console.log('⏰ 2...'), 1000);
      setTimeout(() => console.log('⏰ 1...'), 2000);
      setTimeout(() => {
        console.log('🔄 RECARREGANDO...');
        window.location.reload();
      }, 3000);
      
    } else {
      console.log('⚠️  Nenhuma chave foi removida - pode não haver problemas');
    }
    
  } else {
    console.log('');
    console.log('🎊 SISTEMA JÁ ESTÁ LIMPO!');
    console.log('✅ Nenhuma correção necessária');
    console.log('✅ Todos os campus funcionando normalmente');
  }
}

// Executar correção automaticamente
corrigirTodosCampus();

// Disponibilizar funções para uso manual
window.sistemaLimpeza = {
  detectar: detectarProblemas,
  limpar: limpezaCompleta,
  corrigir: corrigirTodosCampus
};

console.log('');
console.log('💡 COMANDOS DISPONÍVEIS:');
console.log('  • window.sistemaLimpeza.detectar() - Detectar problemas');
console.log('  • window.sistemaLimpeza.limpar() - Limpar localStorage');  
console.log('  • window.sistemaLimpeza.corrigir() - Correção completa');
console.log('');