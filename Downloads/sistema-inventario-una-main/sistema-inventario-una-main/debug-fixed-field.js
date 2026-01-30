/**
 * 🔍 DIAGNÓSTICO DO CAMPO FIXO
 * Script para verificar IDs válidos vs fantasma
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DO CAMPO FIXO...');

// IDs fantasma conhecidos
const PHANTOM_IDS = [
  'e806ca85-2304-49f0-ac04-3cb96d026465',
  '801bbc61-fd05-4e86-bac9-d5f24335d340'
];

// Verificar dados do localStorage
const inventoryData = localStorage.getItem('inventory_data');
if (inventoryData) {
  try {
    const inventory = JSON.parse(inventoryData);
    console.log('📊 DADOS DO INVENTÁRIO:');
    console.log(`Total de itens: ${inventory.length}`);
    
    // Separar IDs válidos dos fantasma
    const validItems = [];
    const phantomItems = [];
    
    inventory.forEach(item => {
      if (PHANTOM_IDS.includes(item.id)) {
        phantomItems.push(item);
      } else {
        validItems.push(item);
      }
    });
    
    console.log(`✅ Itens válidos: ${validItems.length}`);
    console.log(`👻 Itens fantasma: ${phantomItems.length}`);
    
    if (phantomItems.length > 0) {
      console.log('🚨 ITENS FANTASMA ENCONTRADOS:');
      phantomItems.forEach(item => {
        console.log(`- ID: ${item.id}, Serial: ${item.serial || 'N/A'}, Campus: ${item.campus || 'N/A'}`);
      });
    }
    
    if (validItems.length > 0) {
      console.log('✅ PRIMEIROS 5 ITENS VÁLIDOS:');
      validItems.slice(0, 5).forEach(item => {
        console.log(`- ID: ${item.id}, Serial: ${item.serial || 'N/A'}, Fixo: ${item.isFixed ? 'Sim' : 'Não'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao analisar dados:', error);
  }
} else {
  console.log('⚠️ Nenhum dado encontrado no localStorage');
}

// Função para testar mudança de campo fixo com ID válido
window.testFixedChange = function(itemId, newValue) {
  console.log(`🧪 TESTE: Mudando campo fixo para ID ${itemId} -> ${newValue}`);
  
  if (PHANTOM_IDS.includes(itemId)) {
    console.log('🚨 Este é um ID fantasma - será bloqueado');
    return false;
  }
  
  console.log('✅ Este é um ID válido - deveria funcionar');
  
  // Simular a chamada
  try {
    const event = new CustomEvent('testFixedChange', {
      detail: { itemId, newValue }
    });
    window.dispatchEvent(event);
    console.log('📤 Evento de teste enviado');
    return true;
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return false;
  }
};

console.log('🔍 DIAGNÓSTICO CONCLUÍDO');
console.log('💡 Use: testFixedChange("ID_VALIDO", true) para testar');