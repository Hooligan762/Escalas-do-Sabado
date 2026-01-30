#!/usr/bin/env node
// Simula exatamente o que acontece no sistema - testa getCategories e getSectors com campusId
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { getCategories, getSectors, getCampusList } = require('../src/lib/db/postgres-adapter.ts');

async function main() {
  try {
    console.log('🧪 Simulando chamadas do sistema...\n');
    
    // 1. Simular usuário admin (vê tudo)
    console.log('👑 ADMIN (sem filtro de campus):');
    const adminCategories = await getCategories();
    const adminSectors = await getSectors();
    console.log(`  📁 Categorias: ${adminCategories.length} - ${adminCategories.map(c => c.name).join(', ')}`);
    console.log(`  🏢 Setores: ${adminSectors.length} - ${adminSectors.map(s => s.name).join(', ')}`);
    
    // 2. Simular usuário de campus específico
    const campusList = await getCampusList();
    const aimoresCampus = campusList.find(c => c.name === 'Aimorés');
    const liberdadeCampus = campusList.find(c => c.name === 'Liberdade');
    
    if (aimoresCampus) {
      console.log(`\n👤 USUÁRIO CAMPUS AIMORÉS (campusId: ${aimoresCampus.id}):`);
      const aimoresCategories = await getCategories(aimoresCampus.id);
      const aimoresSectors = await getSectors(aimoresCampus.id);
      console.log(`  📁 Categorias: ${aimoresCategories.length} - ${aimoresCategories.map(c => c.name).join(', ')}`);
      console.log(`  🏢 Setores: ${aimoresSectors.length} - ${aimoresSectors.map(s => s.name).join(', ')}`);
    }
    
    if (liberdadeCampus) {
      console.log(`\n👤 USUÁRIO CAMPUS LIBERDADE (campusId: ${liberdadeCampus.id}):`);
      const liberdadeCategories = await getCategories(liberdadeCampus.id);
      const liberdadeSectors = await getSectors(liberdadeCampus.id);
      console.log(`  📁 Categorias: ${liberdadeCategories.length} - ${liberdadeCategories.map(c => c.name).join(', ')}`);
      console.log(`  🏢 Setores: ${liberdadeSectors.length} - ${liberdadeSectors.map(s => s.name).join(', ')}`);
    }
    
    // 3. Verificar se o isolamento está funcionando
    if (aimoresCampus && liberdadeCampus) {
      const aimoresSectors = await getSectors(aimoresCampus.id);
      const liberdadeSectors = await getSectors(liberdadeCampus.id);
      
      const aimoresHasPortaria = aimoresSectors.some(s => s.name === 'Portaria');
      const liberdadeHasPortaria = liberdadeSectors.some(s => s.name === 'Portaria');
      const aimoresHasStudio = aimoresSectors.some(s => s.name === 'Studio Áudio Visual');
      const liberdadeHasStudio = liberdadeSectors.some(s => s.name === 'Studio Áudio Visual');
      
      console.log('\n🎯 TESTE DE ISOLAMENTO:');
      console.log(`  Portaria (Aimorés) aparece para Aimorés: ${aimoresHasPortaria ? '✅' : '❌'}`);
      console.log(`  Portaria (Aimorés) aparece para Liberdade: ${liberdadeHasPortaria ? '❌ ERRO' : '✅'}`);
      console.log(`  Studio (Liberdade) aparece para Liberdade: ${liberdadeHasStudio ? '✅' : '❌'}`);
      console.log(`  Studio (Liberdade) aparece para Aimorés: ${aimoresHasStudio ? '❌ ERRO' : '✅'}`);
      
      if (!liberdadeHasPortaria && !aimoresHasStudio && aimoresHasPortaria && liberdadeHasStudio) {
        console.log('\n🎉 ISOLAMENTO FUNCIONANDO PERFEITAMENTE!');
      } else {
        console.log('\n⚠️ PROBLEMA DE ISOLAMENTO DETECTADO!');
      }
    }
    
  } catch (e) {
    console.error('Erro:', e.message);
  }
}

main().catch(e => { console.error(e); process.exit(1); });