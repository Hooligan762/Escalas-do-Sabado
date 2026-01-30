const { Client } = require('pg');

async function verificarTecnicos() {
  const client = new Client({
    connectionString: 'postgresql://inventory:Rdd030695@@@@7621@localhost:5432/nsi_inventario_db'
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco\n');

    const result = await client.query(`
      SELECT u.username, c.name as campus, u.role, u.password
      FROM users u
      LEFT JOIN campus c ON u.campus_id = c.id
      WHERE u.role = 'tecnico' 
      ORDER BY c.name
    `);

    console.log('📋 TÉCNICOS NO BANCO:\n');
    console.log('─'.repeat(70));
    
    if (result.rows.length === 0) {
      console.log('⚠️  NENHUM TÉCNICO ENCONTRADO NO BANCO!');
    } else {
      result.rows.forEach((u, i) => {
        const senhaType = u.password && u.password.startsWith('$2b$') ? 'hash' : 'plaintext';
        console.log(`${i+1}. ${u.username.padEnd(25)} | Campus: ${u.campus.padEnd(30)} | Senha: ${senhaType}`);
      });
      console.log(`\nTotal: ${result.rows.length} técnicos`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarTecnicos();
