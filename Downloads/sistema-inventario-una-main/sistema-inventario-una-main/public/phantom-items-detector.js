/**
 * MIDDLEWARE PARA DETECTAR E CORRIGIR ITENS FANTASMA
 * Intercepta tentativas de atualizar itens inexistentes
 */

// Função para detectar itens fantasma no localStorage
function detectPhantomItems() {
  try {
    const inventoryData = localStorage.getItem('inventory_data');
    if (!inventoryData) return [];

    const inventory = JSON.parse(inventoryData);
    if (!Array.isArray(inventory)) return [];

    console.log('🔍 Detectando itens fantasma...', inventory.length, 'itens no localStorage');
    
    // Lista de IDs problemáticos conhecidos
    const knownPhantomIds = [
      'e806ca85-2304-49f0-ac04-3cb96d026465'
    ];

    const phantomItems = inventory.filter(item => 
      knownPhantomIds.includes(item.id)
    );

    return phantomItems;
  } catch (error) {
    console.error('❌ Erro ao detectar itens fantasma:', error);
    return [];
  }
}

// Função para limpar itens fantasma do localStorage
function cleanPhantomItems(phantomIds = []) {
  try {
    const inventoryData = localStorage.getItem('inventory_data');
    if (!inventoryData) return false;

    let inventory = JSON.parse(inventoryData);
    if (!Array.isArray(inventory)) return false;

    const originalLength = inventory.length;
    
    // Remover itens fantasma
    inventory = inventory.filter(item => 
      !phantomIds.includes(item.id)
    );

    const removedCount = originalLength - inventory.length;
    
    if (removedCount > 0) {
      localStorage.setItem('inventory_data', JSON.stringify(inventory));
      console.log(`✅ Removidos ${removedCount} itens fantasma do localStorage`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao limpar itens fantasma:', error);
    return false;
  }
}

// Função para sincronizar localStorage com servidor
async function syncWithServer() {
  try {
    const phantomItems = detectPhantomItems();
    
    if (phantomItems.length > 0) {
      console.log('👻 Itens fantasma detectados:', phantomItems.length);
      
      // Chamar API de limpeza
      const response = await fetch('/api/admin/sync-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear-localstorage',
          itemId: phantomItems.map(item => item.id)
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.action === 'CLEAR_LOCALSTORAGE') {
          // Limpar itens problemáticos
          const cleaned = cleanPhantomItems(phantomItems.map(item => item.id));
          
          if (cleaned) {
            console.log('🎉 Sincronização concluída - localStorage limpo');
            
            // Recarregar página para obter dados frescos
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Interceptor para detectar erros de "Item não encontrado"
function interceptInventoryErrors() {
  // Interceptar erros do console
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Detectar erro específico de item não encontrado
    if (message.includes('não encontrado no banco de dados')) {
      console.log('🚨 Erro de item fantasma detectado:', message);
      
      // Extrair ID do item do erro
      const idMatch = message.match(/ID "([^"]+)"/);
      if (idMatch && idMatch[1]) {
        const phantomId = idMatch[1];
        console.log('🎯 ID fantasma identificado:', phantomId);
        
        // Limpar item específico
        cleanPhantomItems([phantomId]);
        
        // Recarregar página após limpeza
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            console.log('🔄 Recarregando página após limpeza...');
            window.location.reload();
          }
        }, 2000);
      }
    }
    
    // Chamar função original
    originalError.apply(console, args);
  };
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.phantomItemsDetector = {
    detect: detectPhantomItems,
    clean: cleanPhantomItems,
    sync: syncWithServer,
    intercept: interceptInventoryErrors
  };
  
  // Inicializar interceptor automaticamente
  interceptInventoryErrors();
  
  // Executar limpeza ao carregar página
  document.addEventListener('DOMContentLoaded', () => {
    syncWithServer();
  });
}