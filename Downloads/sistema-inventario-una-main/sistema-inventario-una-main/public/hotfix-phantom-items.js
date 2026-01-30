
/**
 * HOTFIX AUTOMÁTICO - CORREÇÃO DE ITENS FANTASMA
 * Carregado automaticamente para corrigir problemas
 */

(function() {
  'use strict';
  
  console.log('🔥 HOTFIX: Correção automática de itens fantasma iniciada');
  
  const PHANTOM_IDS = [
    'e806ca85-2304-49f0-ac04-3cb96d026465',
    '801bbc61-fd05-4e86-bac9-d5f24335d340'
  ];
  
  // Função de limpeza automática
  function autoCleanPhantomItems() {
    try {
      let needsReload = false;
      
      // Verificar inventory_data
      const inventoryData = localStorage.getItem('inventory_data');
      if (inventoryData) {
        try {
          let inventory = JSON.parse(inventoryData);
          const originalLength = inventory.length;
          
          if (Array.isArray(inventory)) {
            // Remover itens fantasma
            inventory = inventory.filter(item => {
              const isPhantom = PHANTOM_IDS.includes(item.id);
              if (isPhantom) {
                console.log('👻 Removendo item fantasma:', item.id);
              }
              return !isPhantom;
            });
            
            const removidos = originalLength - inventory.length;
            
            if (removidos > 0) {
              localStorage.setItem('inventory_data', JSON.stringify(inventory));
              console.log(`✅ HOTFIX: ${removidos} itens fantasma removidos`);
              needsReload = true;
            }
          }
        } catch (error) {
          console.warn('⚠️ HOTFIX: Erro ao processar inventory_data, removendo...');
          localStorage.removeItem('inventory_data');
          needsReload = true;
        }
      }
      
      // Se removeu itens, recarregar página
      if (needsReload) {
        console.log('🔄 HOTFIX: Recarregando página para aplicar correções...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        console.log('✅ HOTFIX: Nenhum item fantasma encontrado');
      }
      
    } catch (error) {
      console.error('❌ HOTFIX: Erro na limpeza automática:', error);
    }
  }
  
  // Interceptar erros de "Item não encontrado"
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('não encontrado no banco de dados')) {
      console.log('🚨 HOTFIX: Erro de item fantasma detectado');
      
      // Executar limpeza imediata
      setTimeout(autoCleanPhantomItems, 1000);
    }
    
    originalError.apply(console, args);
  };
  
  // Executar limpeza na inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoCleanPhantomItems);
  } else {
    setTimeout(autoCleanPhantomItems, 2000);
  }
  
  // Disponibilizar globalmente
  window.hotfixPhantomItems = autoCleanPhantomItems;
  
  console.log('🔥 HOTFIX: Sistema de correção automática ativado');
})();
