/**
 * 🛠️ SCRIPT DE CORREÇÃO PARA CONSOLE DO NAVEGADOR
 * Execute este código no console do navegador (F12) para remover o item fantasma
 */

console.log('🔧 INICIANDO CORREÇÃO EMERGENCIAL DO CAMPUS LIBERDADE');
console.log('🎯 Removendo item fantasma: e806ca85-2304-49f0-ac04-3cb96d026465');

// ID do item fantasma
const PHANTOM_ID = 'e806ca85-2304-49f0-ac04-3cb96d026465';

// 1. Limpar localStorage
let localStorageCleared = 0;
Object.keys(localStorage).forEach(key => {
  if (key.includes('inventory') || key.includes('campus') || key.includes('liberdade')) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(item => item.id !== PHANTOM_ID);
          if (filtered.length < parsed.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            console.log(`✅ Removido item fantasma de localStorage: ${key}`);
            localStorageCleared++;
          }
        }
      }
    } catch (e) {
      // Se não conseguir parsear, remove a chave completamente
      localStorage.removeItem(key);
      console.log(`🗑️ Removida chave inválida: ${key}`);
      localStorageCleared++;
    }
  }
});

// 2. Limpar sessionStorage
let sessionStorageCleared = 0;
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('inventory') || key.includes('campus') || key.includes('liberdade')) {
    sessionStorage.removeItem(key);
    console.log(`🧹 Limpo sessionStorage: ${key}`);
    sessionStorageCleared++;
  }
});

// 3. Tentar limpar estado React se possível
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('🔄 Tentando forçar re-render dos componentes React...');
  // Força um re-render global
  window.dispatchEvent(new Event('storage'));
}

console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
console.log(`📊 localStorage limpo: ${localStorageCleared} chaves`);
console.log(`📊 sessionStorage limpo: ${sessionStorageCleared} chaves`);
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Recarregar a página (F5 ou Ctrl+R)');
console.log('2. Tentar clicar no campo "Fixo" novamente');
console.log('3. Se persistir, limpar todo o cache do navegador');

// Auto-reload em 3 segundos
console.log('\n🔄 Recarregando página em 3 segundos...');
setTimeout(() => {
  window.location.reload();
}, 3000);