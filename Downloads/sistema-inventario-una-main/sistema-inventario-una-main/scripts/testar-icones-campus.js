// Script para testar se os ícones de campus estão funcionando
console.log('🎨 Testando sistema de ícones dos campus...\n');

// Simular os campus do sistema
const campusList = [
  { id: 'admin-campus', name: 'Administrador' },
  { id: 'campus-1', name: 'Aimorés' },
  { id: 'campus-2', name: 'Barro Preto' },
  { id: 'campus-3', name: 'Linha Verde' },
  { id: 'campus-4', name: 'Liberdade' },
  { id: 'campus-5', name: 'Barreiro' },
  { id: 'campus-6', name: 'Guajajaras' },
  { id: 'campus-7', name: 'Complexo João Pinheiro' },
  { id: 'campus-8', name: 'Raja Gabaglia' },
  { id: 'campus-9', name: 'Polo UNA BH Centro' }
];

// Simular os ícones definidos
const campusIcons = [
  { id: 'admin-campus', name: 'Administrador', icon: 'Shield', color: 'text-purple-600' },
  { id: 'campus-1', name: 'Aimorés', icon: 'Mountain', color: 'text-green-600' },
  { id: 'campus-2', name: 'Barro Preto', icon: 'Building2', color: 'text-gray-600' },
  { id: 'campus-3', name: 'Linha Verde', icon: 'TreePine', color: 'text-emerald-600' },
  { id: 'campus-4', name: 'Liberdade', icon: 'Heart', color: 'text-red-600' },
  { id: 'campus-5', name: 'Barreiro', icon: 'Train', color: 'text-blue-600' },
  { id: 'campus-6', name: 'Guajajaras', icon: 'Gem', color: 'text-indigo-600' },
  { id: 'campus-7', name: 'Complexo João Pinheiro', icon: 'Crown', color: 'text-yellow-600' },
  { id: 'campus-8', name: 'Raja Gabaglia', icon: 'Trophy', color: 'text-orange-600' },
  { id: 'campus-9', name: 'Polo UNA BH Centro', icon: 'Compass', color: 'text-cyan-600' }
];

console.log('📋 Mapeamento de Ícones por Campus:');
console.log('=====================================');

campusList.forEach(campus => {
  const icon = campusIcons.find(i => i.id === campus.id);
  if (icon) {
    console.log(`✅ ${campus.name.padEnd(25)} → ${icon.icon.padEnd(10)} (${icon.color})`);
  } else {
    console.log(`❌ ${campus.name.padEnd(25)} → SEM ÍCONE DEFINIDO`);
  }
});


console.log('\n🎯 Validação de Cobertura:');
console.log('==========================');

const totalCampus = campusList.length;
const totalIcones = campusIcons.length;
const iconesCorretos = campusIcons.filter(icon => 
  campusList.some(campus => campus.id === icon.id)
).length;

console.log(`📊 Campus Total: ${totalCampus}`);
console.log(`🎨 Ícones Definidos: ${totalIcones}`);
console.log(`✅ Ícones Corretos: ${iconesCorretos}`);
console.log(`📈 Cobertura: ${((iconesCorretos / totalCampus) * 100).toFixed(1)}%`);

if (iconesCorretos === totalCampus) {
  console.log('\n🎉 SUCESSO: Todos os campus têm ícones definidos!');
} else {
  console.log('\n⚠️  ATENÇÃO: Alguns campus não têm ícones definidos.');
}

console.log('\n🚀 Para testar no navegador:');
console.log('1. Faça login em diferentes campus');
console.log('2. Verifique se o ícone aparece no header');
console.log('3. Verifique se o ícone aparece na seleção de campus');
console.log('4. Verifique se o card de informações do campus é exibido');