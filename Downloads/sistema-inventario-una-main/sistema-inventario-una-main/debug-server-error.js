/**
 * 🔍 DIAGNÓSTICO DO NOVO ERRO DE SERVIDOR
 * Investigar erro de Server Components render
 */

console.log('🔍 INICIANDO DIAGNÓSTICO DO ERRO DE SERVIDOR...');

// Função para capturar erros detalhados
window.debugServerError = function() {
  console.log('📊 INFORMAÇÕES DO SISTEMA:');
  console.log('- URL atual:', window.location.href);
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Timestamp:', new Date().toISOString());
  
  // Verificar localStorage
  const inventoryData = localStorage.getItem('inventory_data');
  if (inventoryData) {
    try {
      const inventory = JSON.parse(inventoryData);
      console.log('📦 DADOS DO INVENTÁRIO:');
      console.log('- Total de itens:', inventory.length);
      console.log('- Primeiros 3 IDs:', inventory.slice(0, 3).map(i => i.id));
      
      // Verificar se ainda há IDs problemáticos
      const problematicIds = inventory.filter(item => 
        item.id === 'e806ca85-2304-49f0-ac04-3cb96d026465' ||
        item.id === '801bbc61-fd05-4e86-bac9-d5f24335d340'
      );
      
      console.log('👻 IDs PROBLEMÁTICOS ENCONTRADOS:', problematicIds.length);
      if (problematicIds.length > 0) {
        problematicIds.forEach(item => {
          console.log(`- ID: ${item.id}, Serial: ${item.serial}, Campus: ${item.campus}`);
        });
      }
      
    } catch (e) {
      console.error('❌ Erro ao analisar dados do inventário:', e);
    }
  }
  
  // Verificar se há erro de network
  console.log('🌐 TESTANDO CONECTIVIDADE COM API...');
  
  fetch('/api/phantom-blocker')
    .then(response => {
      console.log('✅ API phantom-blocker status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('📋 Resposta da API:', data);
    })
    .catch(error => {
      console.error('❌ Erro na API:', error);
    });
  
  // Interceptar erros do React
  const originalError = console.error;
  console.error = function(...args) {
    if (args.some(arg => typeof arg === 'string' && arg.includes('Server Components'))) {
      console.log('🚨 ERRO DE SERVER COMPONENTS DETECTADO:', args);
    }
    originalError.apply(console, args);
  };
  
  console.log('🔍 Diagnóstico em execução... Verifique os logs acima');
};

// Função para testar mudança de campo fixo com logs detalhados
window.testFixedChangeDetailed = function(forceId = null) {
  console.log('🧪 TESTE DETALHADO DE MUDANÇA DE CAMPO FIXO...');
  
  const inventoryData = localStorage.getItem('inventory_data');
  if (!inventoryData) {
    console.error('❌ Nenhum dado de inventário encontrado');
    return;
  }
  
  let inventory;
  try {
    inventory = JSON.parse(inventoryData);
  } catch (e) {
    console.error('❌ Erro ao parsear dados:', e);
    return;
  }
  
  const testId = forceId || inventory[0]?.id;
  if (!testId) {
    console.error('❌ Nenhum ID disponível para teste');
    return;
  }
  
  console.log(`🎯 TESTANDO COM ID: ${testId}`);
  console.log('📋 ITEM DETAILS:', inventory.find(i => i.id === testId));
  
  // Simular clique em botão fixo
  const buttons = document.querySelectorAll('button, input[type="checkbox"]');
  console.log(`🔘 TOTAL DE BOTÕES/INPUTS ENCONTRADOS: ${buttons.length}`);
  
  // Procurar por elementos que possam ser o botão fixo
  const possibleFixedButtons = Array.from(buttons).filter(btn => {
    const text = btn.textContent?.toLowerCase() || '';
    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
    const className = btn.className?.toLowerCase() || '';
    
    return text.includes('sim') || text.includes('não') || 
           text.includes('fixo') || ariaLabel.includes('fixo') ||
           className.includes('fixed');
  });
  
  console.log(`🎯 BOTÕES RELACIONADOS AO FIXO: ${possibleFixedButtons.length}`);
  possibleFixedButtons.forEach((btn, index) => {
    console.log(`- ${index + 1}: ${btn.tagName} - "${btn.textContent}" - ${btn.className}`);
  });
  
  if (possibleFixedButtons.length > 0) {
    const testButton = possibleFixedButtons[0];
    console.log('🧪 SIMULANDO CLIQUE NO PRIMEIRO BOTÃO...');
    
    try {
      testButton.click();
      console.log('✅ Clique simulado com sucesso');
    } catch (e) {
      console.error('❌ Erro ao simular clique:', e);
    }
  }
};

// Executar diagnóstico automaticamente
debugServerError();

console.log('💡 COMANDOS DISPONÍVEIS:');
console.log('- debugServerError(): Diagnóstico completo');
console.log('- testFixedChangeDetailed(): Teste detalhado do campo fixo');
console.log('- testFixedChangeDetailed("ID_ESPECÍFICO"): Teste com ID específico');