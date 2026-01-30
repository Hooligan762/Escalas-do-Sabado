// Script para limpar localStorage antigo e forçar recarregamento limpo
console.log('🧹 Limpando localStorage antigo...');

// Chaves antigas que precisam ser removidas
const oldKeys = [
  'inventory',
  'auditLog', 
  'loans',
  'categories',
  'sectors'
];

// Simular limpeza (este script roda no servidor, não no browser)
console.log('Chaves antigas a serem removidas:');
oldKeys.forEach(key => {
  console.log(`  - ${key}`);
});

console.log('');
console.log('⚠️  INSTRUÇÕES PARA O USUÁRIO:');
console.log('1. Abra o DevTools do navegador (F12)');
console.log('2. Vá para a aba Console');
console.log('3. Digite e execute este comando:');
console.log('');
console.log('localStorage.removeItem("inventory");');
console.log('localStorage.removeItem("auditLog");');
console.log('localStorage.removeItem("loans");');
console.log('localStorage.removeItem("categories");');
console.log('localStorage.removeItem("sectors");');
console.log('localStorage.clear(); // ou este para limpar tudo');
console.log('');
console.log('4. Recarregue a página (Ctrl+F5)');
console.log('');
console.log('🔄 Após isso, o sistema usará apenas os dados específicos por campus!');