const bcrypt = require('bcryptjs');

// Hash do admin do SQL
const adminHash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXzgVQDqG5Ee';

// Todas as senhas possíveis encontradas no código
const todasSenhas = [
  'admin123',
  'admin',
  'password',
  'una2024',
  'Full030695@7621',
  'Rdd030695@@@@7621',
  '123456',
  'Admin123',
  'PASSWORD',
  'admin2024',
  'senha',
  'senha123',
  'admin@123',
  'nsi2024',
  'inventario',
  'Admin030695@7621',
  // Baseado no padrão do Full, talvez seja:
  'Admin030695@7621',
  'admin030695@7621'
];

console.log('🔍 TESTANDO TODAS AS SENHAS POSSÍVEIS PARA ADMIN...\n');

let encontrada = false;
for (const senha of todasSenhas) {
  try {
    const valida = bcrypt.compareSync(senha, adminHash);
    if (valida) {
      console.log(`✅ ENCONTRADA! Senha do admin: "${senha}"`);
      encontrada = true;
      break;
    }
  } catch (e) {
    // Ignorar erros
  }
}

if (!encontrada) {
  console.log('❌ Nenhuma senha encontrada. O hash pode estar corrompido ou usar uma senha não testada.');
  console.log('\n💡 DICA: Use a senha do super admin "full" para acessar como administrador:');
  console.log('   Login: full');
  console.log('   Senha: Full030695@7621');
}