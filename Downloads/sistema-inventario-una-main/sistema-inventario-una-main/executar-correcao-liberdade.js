/**
 * 🛠️ EXECUÇÃO DA CORREÇÃO CAMPUS LIBERDADE
 * Aplicação direta da solução que funcionou no Aimores
 */

console.log('🛠️ EXECUTANDO CORREÇÃO ESPECÍFICA DO CAMPUS LIBERDADE...');

async function executarCorrecaoLiberdade() {
  try {
    console.log('🔍 1. Verificando status atual...');
    
    // Verificar status atual
    const statusResponse = await fetch('/api/fix-liberdade', {
      method: 'GET'
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Status atual:', statusData);
      
      if (statusData.phantomItems > 0) {
        console.log(`🚨 ${statusData.phantomItems} item(s) fantasma encontrado(s)!`);
      }
    }
    
    console.log('🛠️ 2. Aplicando correção...');
    
    // Executar correção
    const fixResponse = await fetch('/api/fix-liberdade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (fixResponse.ok) {
      const fixData = await fixResponse.json();
      console.log('✅ CORREÇÃO APLICADA COM SUCESSO!');
      console.log('📋 Resultados:', fixData);
      
      if (fixData.results) {
        fixData.results.forEach(result => {
          console.log(`  • ${result}`);
        });
      }
      
      if (fixData.finalState) {
        console.log('📊 Estado final:', fixData.finalState);
      }
      
      // Mostrar mensagem de sucesso
      alert('✅ CORREÇÃO APLICADA COM SUCESSO!\n\n' + 
            'O Campus Liberdade foi corrigido usando a mesma solução do Aimores.\n' +
            'A página será recarregada em 3 segundos.');
      
      // Recarregar página após 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } else {
      const errorData = await fixResponse.json();
      console.error('❌ Erro na correção:', errorData);
      alert('❌ Erro na correção: ' + errorData.message);
    }
    
  } catch (error) {
    console.error('❌ Erro na execução:', error);
    alert('❌ Erro na execução: ' + error.message);
  }
}

// Executar correção automaticamente
executarCorrecaoLiberdade();

// Disponibilizar função global para uso manual
window.executarCorrecaoLiberdade = executarCorrecaoLiberdade;

console.log('💡 Use executarCorrecaoLiberdade() para executar novamente se necessário');