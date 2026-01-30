const { Pool } = require('pg');

async function diagnoseCampusAdmin() {
  console.log('🔍 Diagnóstico do Campus Administrador no Railway...\n');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL não encontrada');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // 1. Verificar se tabela campus existe
    console.log('1️⃣ Verificando tabela campus...');
    const tablesResult = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'campus'
    `);
    console.log(`   Tabela campus existe: ${tablesResult.rows.length > 0 ? '✅' : '❌'}`);

    if (tablesResult.rows.length === 0) {
      console.log('❌ Tabela campus não existe! Execute setup-database.js');
      return;
    }

    // 2. Listar todos os campus
    console.log('\n2️⃣ Listando todos os campus...');
    const campusResult = await pool.query('SELECT id, name FROM campus ORDER BY name');
    console.log(`   Total de campus: ${campusResult.rows.length}`);
    campusResult.rows.forEach(campus => {
      console.log(`   - ${campus.id}: "${campus.name}"`);
    });

    // 3. Verificar especificamente campus Administrador
    console.log('\n3️⃣ Verificando campus Administrador...');
    const adminCampusResult = await pool.query(`
      SELECT id, name FROM campus WHERE name = 'Administrador'
    `);
    
    if (adminCampusResult.rows.length > 0) {
      console.log('   ✅ Campus Administrador encontrado:');
      adminCampusResult.rows.forEach(campus => {
        console.log(`      ID: ${campus.id}, Nome: "${campus.name}"`);
      });
    } else {
      console.log('   ❌ Campus Administrador NÃO encontrado!');
      
      // Tentar criar
      console.log('   🔧 Tentando criar campus Administrador...');
      await pool.query(`
        INSERT INTO campus (id, name) VALUES ('admin-campus', 'Administrador')
        ON CONFLICT (id) DO NOTHING
      `);
      console.log('   ✅ Campus Administrador criado!');
    }

    // 4. Verificar usuários admin
    console.log('\n4️⃣ Verificando usuários admin...');
    const adminUsersResult = await pool.query(`
      SELECT u.id, u.username, u.name, u.role, u.campus_id, c.name as campus_name
      FROM users u 
      LEFT JOIN campus c ON u.campus_id = c.id 
      WHERE u.role = 'admin'
      ORDER BY u.username
    `);
    
    console.log(`   Total de usuários admin: ${adminUsersResult.rows.length}`);
    adminUsersResult.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.name})`);
      console.log(`     Campus ID: ${user.campus_id || 'NULL'}`);
      console.log(`     Campus Nome: ${user.campus_name || 'NULL'}`);
      console.log('');
    });

    // 5. Corrigir usuários admin sem campus correto
    console.log('5️⃣ Corrigindo usuários admin...');
    const updateResult = await pool.query(`
      UPDATE users 
      SET campus_id = 'admin-campus' 
      WHERE role = 'admin' AND (campus_id IS NULL OR campus_id != 'admin-campus')
      RETURNING username, name
    `);
    
    if (updateResult.rows.length > 0) {
      console.log('   ✅ Usuários corrigidos:');
      updateResult.rows.forEach(user => {
        console.log(`      - ${user.username} (${user.name})`);
      });
    } else {
      console.log('   ✅ Todos os usuários admin já estão corretos');
    }

    // 6. Verificação final
    console.log('\n6️⃣ Verificação final...');
    const finalCheck = await pool.query(`
      SELECT u.username, u.name, c.name as campus_name
      FROM users u 
      JOIN campus c ON u.campus_id = c.id 
      WHERE u.role = 'admin' AND c.name = 'Administrador'
    `);
    
    console.log(`   ✅ Usuários admin com campus Administrador: ${finalCheck.rows.length}`);
    finalCheck.rows.forEach(user => {
      console.log(`      - ${user.username}: ${user.name} → ${user.campus_name}`);
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await pool.end();
  }
}

// Executar diagnóstico
diagnoseCampusAdmin().then(() => {
  console.log('\n🎯 Diagnóstico concluído!');
}).catch(console.error);