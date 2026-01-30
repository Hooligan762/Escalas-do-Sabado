'use server';
import { Pool } from 'pg';
import crypto from 'crypto';
import type { InventoryItem, AuditLogEntry, Category, Sector, Loan, User, Campus, Request as SupportRequest } from '@/lib/types';
import { guardAgainstPhantomIds, isPhantomId } from '../phantom-id-guard';

// Criar o pool mas não exportá-lo diretamente
// Em vez disso, vamos usá-lo internamente no módulo
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});


// Função para obter o pool (para compatibilidade com o código existente)
export async function getPool(): Promise<Pool> {
  return pool;
}

// Função para inserir campus sem duplicidade
export async function insertCampusIfNotExists(id: string, name: string) {
  await pool.query(
    "INSERT INTO campus (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
    [id, name]
  );
}

// Função para listar todos os campus
export async function listAllCampus() {
  const result = await pool.query("SELECT id, name FROM campus ORDER BY name");
  return result.rows;
}

export async function getInventory(campusId?: string): Promise<InventoryItem[]> {
  try {
    let query: string;
    let params: any[];
    
    if (campusId) {
      // 🔒 Para usuários de campus específico: retorna APENAS itens desse campus
      query = `
        SELECT
          i.id,
          i.serial,
          i.patrimony,
          i.brand,
          i.sala,
          i.obs,
          COALESCE(i.is_fixed, false) as "isFixed",
          i.status,
          c.name as campus,
          cat.name as category,
          s.name as setor,
          u.name as responsible,
          i.created_at as created,
          i.updated_at as updated
        FROM inventory_items i
        LEFT JOIN campus c ON i.campus_id = c.id
        LEFT JOIN categories cat ON i.category_id = cat.id
        LEFT JOIN sectors s ON i.setor_id = s.id
        LEFT JOIN users u ON i.responsible_id = u.id
        WHERE i.campus_id = $1
        ORDER BY i.created_at DESC
      `;
      params = [campusId];
      console.log(`🔒 [getInventory] Buscando inventário para campus específico: ${campusId}`);
    } else {
      // 👑 Para admin: retorna TODOS os itens
      query = `
        SELECT
          i.id,
          i.serial,
          i.patrimony,
          i.brand,
          i.sala,
          i.obs,
          COALESCE(i.is_fixed, false) as "isFixed",
          i.status,
          c.name as campus,
          cat.name as category,
          s.name as setor,
          u.name as responsible,
          i.created_at as created,
          i.updated_at as updated
        FROM inventory_items i
        LEFT JOIN campus c ON i.campus_id = c.id
        LEFT JOIN categories cat ON i.category_id = cat.id
        LEFT JOIN sectors s ON i.setor_id = s.id
        LEFT JOIN users u ON i.responsible_id = u.id
        ORDER BY i.created_at DESC
      `;
      params = [];
      console.log('👑 [getInventory] Buscando TODOS os itens (admin)');
    }
    
    const res = await pool.query(query, params);
    console.log(`✅ [getInventory] Inventário carregado: ${res.rows.length} itens`);
    
    // Padroniza o retorno para incluir campus como objeto
    return res.rows.map(row => ({
      ...row,
      campus: row.campus_id ? { id: row.campus_id, name: row.campus_name } : undefined
    }));
  } catch (error) {
    console.error('❌ [getInventory] Erro ao buscar inventário:', error);
    return [];
  }
}

export async function getUsers() {
  try {
    const res = await pool.query(`
      SELECT
        u.id,
        u.username,
        u.name,
        u.role,
        u.campus_id,
        c.name as campus_name,
        u.password
      FROM
        users u
      LEFT JOIN campus c ON u.campus_id = c.id
      ORDER BY u.name ASC
    `);
    console.log('[getUsers] Usuários encontrados:', res.rows.length);
    console.log('[getUsers] Usuários admin:', res.rows.filter(u => u.role === 'admin').map(u => ({ username: u.username, campus_id: u.campus_id, campus_name: u.campus_name })));
    
    // Padroniza o retorno para incluir campus como objeto ou string
    return res.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      password: row.password,
      // Retorna campus como objeto { id, name } se existir campus_id
      campus: row.campus_id && row.campus_name 
        ? { id: row.campus_id, name: row.campus_name }
        : row.campus_name || undefined
    }));
  } catch (error) {
    console.error('Erro ao consultar usuários:', error);
    throw error;
  }
}

export async function getCampusList(): Promise<Campus[]> {
  try {
    const res = await pool.query('SELECT * FROM campus ORDER BY name ASC');
    console.log('[getCampusList] Campus encontrados:', res.rows.length, res.rows.map(c => c.name));
    return res.rows;
  } catch (error) {
    console.error('[getCampusList] Erro ao buscar campus:', error);
    return [];
  }
}

export async function getCategories(campusId?: string): Promise<Category[]> {
  try {
    let query: string;
    let params: any[];
    
    if (campusId) {
      // Para usuários de campus específico, retorna APENAS categorias desse campus específico, incluindo nome do campus
      query = `SELECT cat.*, c.name as campus_name FROM categories cat LEFT JOIN campus c ON cat.campus_id = c.id WHERE cat.campus_id = $1 ORDER BY cat.name ASC`;
      params = [campusId];
    } else {
      // Para admin, retorna todas as categorias, incluindo nome do campus
      query = `SELECT cat.*, c.name as campus_name FROM categories cat LEFT JOIN campus c ON cat.campus_id = c.id ORDER BY cat.name ASC`;
      params = [];
    }
    
    console.log(`[getCategories] Campus: ${campusId || 'ADMIN'}, Query: ${query}`);
    const res = await pool.query(query, params);
    console.log(`[getCategories] Encontradas ${res.rows.length} categorias para campus ${campusId || 'ADMIN'}`);
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function getSectors(campusId?: string): Promise<Sector[]> {
  try {
    let query: string;
    let params: any[];
    
    if (campusId) {
      // Para usuários de campus específico, retorna APENAS setores desse campus específico, incluindo nome do campus
      query = `SELECT s.*, c.name as campus_name FROM sectors s LEFT JOIN campus c ON s.campus_id = c.id WHERE s.campus_id = $1 ORDER BY s.name ASC`;
      params = [campusId];
    } else {
      // Para admin, retorna todos os setores, incluindo nome do campus
      query = `SELECT s.*, c.name as campus_name FROM sectors s LEFT JOIN campus c ON s.campus_id = c.id ORDER BY s.name ASC`;
      params = [];
    }
    
    console.log(`[getSectors] Campus: ${campusId || 'ADMIN'}, Query: ${query}`);
    const res = await pool.query(query, params);
    console.log(`[getSectors] Encontrados ${res.rows.length} setores para campus ${campusId || 'ADMIN'}`);
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar setores:', error);
    return [];
  }
}

export async function insertCampus(campus: Omit<Campus, 'id'>): Promise<Campus> {
  console.log('🏫 insertCampus - Iniciando inserção de campus:', campus);

  try {
    const newId = crypto.randomUUID();
    const newCampus: Campus = { ...campus, id: newId };

    console.log('🏫 insertCampus - Campus a ser inserido:', newCampus);

  const query = 'INSERT INTO campus (id, name) VALUES ($1, $2)';
    const values = [newCampus.id, newCampus.name];

    console.log('🏫 insertCampus - Executando query:', query, 'com valores:', values);

    const result = await pool.query(query, values);

    console.log('🏫 insertCampus - Resultado da inserção:', result.command, result.rowCount);

    // Verificar se o campus foi realmente inserido
  const verifyResult = await pool.query('SELECT * FROM campus WHERE id = $1', [newId]);
    console.log('🏫 insertCampus - Verificação da inserção:', verifyResult.rows[0]);

    console.log('✅ insertCampus - Campus inserido com sucesso:', newCampus);
    return newCampus;
  } catch (error) {
    console.error('❌ insertCampus - Erro ao inserir campus:', error);
    throw error;
  }
}

export async function deleteCampus(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Primeiro verificar se existem itens no inventário associados a este campus
    const inventoryResult = await pool.query('SELECT COUNT(*) FROM inventory_items WHERE campus_id = $1', [id]);
    const inventoryCount = parseInt(inventoryResult.rows[0].count, 10);

    if (inventoryCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir o campus pois existem ${inventoryCount} item(s) de inventário associados a ele. Você precisa primeiro mover ou excluir estes itens.`
      };
    }

    // Verificar outras dependências, como empréstimos e solicitações
    const loansResult = await pool.query(`
      SELECT COUNT(*) FROM loans l
      JOIN inventory i ON l.inventory_id = i.id
      WHERE i.campus_id = $1
    `, [id]);
    const loansCount = parseInt(loansResult.rows[0].count, 10);

    if (loansCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir o campus pois existem ${loansCount} empréstimo(s) associados a itens deste campus.`
      };
    }

    const requestsResult = await pool.query('SELECT COUNT(*) FROM requests WHERE campus_id = $1', [id]);
    const requestsCount = parseInt(requestsResult.rows[0].count, 10);

    if (requestsCount > 0) {
      return {
        success: false,
        error: `Não é possível excluir o campus pois existem ${requestsCount} solicitação(ões) associadas a ele.`
      };
    }

    // Se não houver dependências, prossegue com a exclusão
    await pool.query('DELETE FROM campus WHERE id = $1', [id]);
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao tentar excluir campus:', error);
    return {
      success: false,
      error: `Erro ao excluir campus: ${error.message || 'Erro desconhecido'}`
    };
  }
}

export async function updateCampus(id: string, name: string): Promise<void> {
  await pool.query('UPDATE campus SET name = $1 WHERE id = $2', [name, id]);
}

export async function insertUser(user: Omit<User, 'id'>): Promise<User> {
  console.log('👥 insertUser - Iniciando inserção de usuário:', user);

  try {
    let campusId = null;

    if (user.campus) {
      // Obter o nome do campus (pode ser string ou objeto)
      const campusName = typeof user.campus === 'object' ? user.campus.name : user.campus;
      console.log('👥 insertUser - Buscando campus por nome:', campusName);
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [campusName]);
      if (campusResult.rows.length > 0) {
        campusId = campusResult.rows[0].id;
        console.log('👥 insertUser - Campus ID encontrado:', campusId);
      } else {
        console.log('⚠️ insertUser - Campus não encontrado:', campusName);
      }
    }

    const newId = crypto.randomUUID();
    let hashedPassword: string;

    // Hash da senha apenas para administradores
    if (user.role === 'admin' && user.password) {
      console.log('👥 insertUser - Usuário é admin, fazendo hash da senha');
      const bcrypt = (await import('bcrypt')).default;
      hashedPassword = await bcrypt.hash(user.password, 10);
    } else {
      console.log('👥 insertUser - Usuário é técnico, mantendo senha em texto plano');
      hashedPassword = user.password || 'password';
    } const newUser: User = {
      ...user,
      id: newId,
      password: hashedPassword
    };

    console.log('👥 insertUser - Usuário a ser inserido (senha oculta):', {
      ...newUser,
      password: '[HIDDEN]'
    });

    const query = `
      INSERT INTO users (id, username, name, role, password, campus_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [newUser.id, newUser.username, newUser.name, newUser.role, hashedPassword, campusId];

    console.log('👥 insertUser - Executando query:', query, 'com valores (senha oculta):', [
      newUser.id, newUser.username, newUser.name, newUser.role, '[HIDDEN]', campusId
    ]);

    const result = await pool.query(query, values);

    console.log('👥 insertUser - Resultado da inserção:', result.command, result.rowCount);

    // Verificar se o usuário foi realmente inserido
    const verifyResult = await pool.query('SELECT id, username, name, role, campus_id FROM users WHERE id = $1', [newId]);
    console.log('👥 insertUser - Verificação da inserção:', verifyResult.rows[0]);

    console.log('✅ insertUser - Usuário inserido com sucesso');
    return { ...newUser, campus: user.campus };
  } catch (error) {
    console.error('❌ insertUser - Erro ao inserir usuário:', error);
    throw error;
  }
}

export async function updateUser(id: string, data: Partial<User>): Promise<void> {
  // Crie uma cópia dos dados para não modificar o objeto original
  const dataCopy = { ...data };

  // Para usuários técnicos, não aplicamos hash - mantemos senha em texto simples
  // Apenas admins têm senhas hashadas para segurança de login
  const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
  const userRole = userResult.rows[0]?.role;

  // Se a senha está sendo atualizada E é um usuário admin, aplique hash
  if (dataCopy.password !== undefined && dataCopy.password !== '' && userRole === 'admin') {
    // Importar a função hashPassword de auth.ts
    const { hashPassword } = await import('../auth');
    dataCopy.password = await hashPassword(dataCopy.password);
  }

  const { name, role, campus, username, password } = dataCopy;
  let campusId = null;
  if (campus) {
    // Obter o nome do campus (pode ser string ou objeto)
    const campusName = typeof campus === 'object' ? campus.name : campus;
    const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [campusName]);
    campusId = campusResult.rows[0]?.id;
  }

  const updates = [];
  const values = [];
  let paramCounter = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCounter++}`);
    values.push(name);
  }

  if (role !== undefined) {
    updates.push(`role = $${paramCounter++}`);
    values.push(role);
  }

  if (campusId !== null) {
    updates.push(`campus_id = $${paramCounter++}`);
    values.push(campusId);
  }

  if (username !== undefined) {
    updates.push(`username = $${paramCounter++}`);
    values.push(username);
  }

  if (password !== undefined) {
    updates.push(`password = $${paramCounter++}`);
    values.push(password);
  }

  if (updates.length === 0) return;

  values.push(id);
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCounter}`;
  await pool.query(query, values);
} export async function deleteUser(id: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

export async function insertInventoryItem(item: Omit<InventoryItem, 'id' | 'created' | 'updated'>): Promise<InventoryItem> {
  try {
    const now = new Date().toISOString();
    const newId = crypto.randomUUID();

    // Primeiro precisamos obter os IDs para os nomes fornecidos
    const [campusResult, categoryResult, sectorResult, responsibleResult] = await Promise.all([
      pool.query('SELECT id FROM campus WHERE name = $1', [item.campus]),
      pool.query('SELECT id FROM categories WHERE name = $1', [item.category]),
      pool.query('SELECT id FROM sectors WHERE name = $1', [item.setor]),
      item.responsible ? pool.query('SELECT id FROM users WHERE name = $1', [item.responsible]) : Promise.resolve({ rows: [] })
    ]);

    const campusId = campusResult.rows[0]?.id;
    const categoryId = categoryResult.rows[0]?.id;
    const sectorId = sectorResult.rows[0]?.id;
    const responsibleId = responsibleResult.rows[0]?.id;

    // Se não encontramos um usuário correspondente, vamos armazenar o nome diretamente
    const responsible_name = responsibleId ? null : item.responsible;

    const result = await pool.query(
      `INSERT INTO inventory_items (
        id, serial, patrimony, brand, sala, obs, is_fixed, status,
        campus_id, category_id, setor_id, responsible_id, responsible_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        newId, item.serial, item.patrimony || '', item.brand || '', item.sala || '', item.obs || '',
        item.isFixed || false, item.status, campusId, categoryId, sectorId, responsibleId, responsible_name, now, now
      ]
    );

    // Agora precisamos buscar os nomes para os IDs para retornar o objeto no formato esperado
    const insertedItem = result.rows[0];

    const [campusName, categoryName, sectorName, responsibleName] = await Promise.all([
      pool.query('SELECT name FROM campus WHERE id = $1', [insertedItem.campus_id]),
      pool.query('SELECT name FROM categories WHERE id = $1', [insertedItem.category_id]),
      pool.query('SELECT name FROM sectors WHERE id = $1', [insertedItem.setor_id]),
      insertedItem.responsible_id
        ? pool.query('SELECT name FROM users WHERE id = $1', [insertedItem.responsible_id])
        : Promise.resolve({ rows: [{ name: null }] })
    ]);

    // Retornar o item com os valores completos no formato esperado pelo front-end
    return {
      id: insertedItem.id,
      campus: campusName.rows[0]?.name || '',
      setor: sectorName.rows[0]?.name || '',
      sala: insertedItem.sala || '',
      category: categoryName.rows[0]?.name || '',
      brand: insertedItem.brand || '',
      serial: insertedItem.serial,
      patrimony: insertedItem.patrimony || '',
      status: insertedItem.status,
      responsible: responsibleName.rows[0]?.name || '',
      responsible_name: insertedItem.responsible_name || '',
      obs: insertedItem.obs || '',
      isFixed: insertedItem.is_fixed || false,
      created: insertedItem.created_at,
      updated: insertedItem.updated_at
    };
  } catch (error) {
    console.error('Erro ao inserir item no inventário:', error);
    throw error;
  }
}

export async function updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
  try {
    console.log('🔧 PostgreSQL - updateInventoryItem chamada:');
    console.log('   - ID:', id);
    console.log('   - Dados para atualizar:', item);
    
    // 🛡️ PROTEÇÃO CONTRA IDs FANTASMA - CRÍTICO!
    guardAgainstPhantomIds(id, 'updateInventoryItem');
    
    // Validar se o ID não é vazio ou null
    if (!id || id.trim() === '') {
      throw new Error('ID do item não pode ser vazio');
    }
    
    // Verificar se o item existe antes de tentar atualizar
    const existsCheck = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [id]);
    if (existsCheck.rows.length === 0) {
      console.log('❌ Item não encontrado no banco com ID:', id);
      throw new Error(`Item com ID "${id}" não encontrado no banco de dados`);
    }
    console.log('✅ Item encontrado no banco, prosseguindo com atualização');
    
    // Verificar se a coluna is_fixed existe na tabela
    const columnCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' 
      AND column_name LIKE '%fixed%'
    `);
    console.log('🔍 Colunas relacionadas a "fixed":', columnCheck.rows);
    
    const now = new Date().toISOString();
    const updates = [];
    const values = [];
    let paramCounter = 1;

    // 🔍 VERIFICAR SE CAMPO is_fixed EXISTE ANTES DE USAR
    console.log('🔍 Verificando se campo is_fixed existe...');
    const isFixedColumnExists = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_fixed'
    `);
    let hasIsFixedColumn = isFixedColumnExists.rows.length > 0;
    console.log(`🔍 Campo is_fixed existe: ${hasIsFixedColumn ? '✅ Sim' : '❌ Não'}`);

    // 🛠️ TENTAR CRIAR O CAMPO SE NÃO EXISTIR
    if (!hasIsFixedColumn && 'isFixed' in item) {
      console.log('🛠️ Tentando criar campo is_fixed...');
      try {
        await pool.query(`ALTER TABLE inventory_items ADD COLUMN is_fixed BOOLEAN DEFAULT false`);
        console.log('✅ Campo is_fixed criado com sucesso!');
        hasIsFixedColumn = true; // Atualizar flag
      } catch (createError) {
        console.log('⚠️ Não foi possível criar campo is_fixed:', (createError as Error)?.message || 'Erro desconhecido');
        console.log('💡 Continuando sem o campo...');
      }
    }

    // Mapear campos para colunas no banco de dados
    const fieldMappings: Record<string, string> = {
      serial: 'serial',
      patrimony: 'patrimony',
      brand: 'brand',
      sala: 'sala',
      obs: 'obs',
      status: 'status'
    };

    // 🎯 ADICIONAR is_fixed APENAS SE O CAMPO EXISTIR
    if (hasIsFixedColumn) {
      fieldMappings.isFixed = 'is_fixed';
      console.log('✅ Campo is_fixed será incluído no update');
    } else {
      console.log('⚠️ Campo is_fixed será ignorado (não existe na tabela)');
    }

    // Adicionar campos diretos
    for (const [field, column] of Object.entries(fieldMappings)) {
      if (field in item) {
        updates.push(`${column} = $${paramCounter++}`);
        values.push((item as any)[field]);
        console.log(`   - Adicionando campo: ${field} -> ${column} = ${(item as any)[field]}`);
      }
    }

    // Tratar campos que precisam de busca no banco
    if (item.campus) {
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [item.campus]);
      if (campusResult.rows.length > 0) {
        updates.push(`campus_id = $${paramCounter++}`);
        values.push(campusResult.rows[0].id);
      }
    }

    if (item.category) {
      const categoryResult = await pool.query('SELECT id FROM categories WHERE name = $1', [item.category]);
      if (categoryResult.rows.length > 0) {
        updates.push(`category_id = $${paramCounter++}`);
        values.push(categoryResult.rows[0].id);
      }
    }

    if (item.setor) {
      const sectorResult = await pool.query('SELECT id FROM sectors WHERE name = $1', [item.setor]);
      if (sectorResult.rows.length > 0) {
        updates.push(`setor_id = $${paramCounter++}`);
        values.push(sectorResult.rows[0].id);
      }
    }

    if (item.responsible) {
      const responsibleResult = await pool.query('SELECT id FROM users WHERE name = $1', [item.responsible]);
      if (responsibleResult.rows.length > 0) {
        updates.push(`responsible_id = $${paramCounter++}`);
        values.push(responsibleResult.rows[0].id);
      }
    }

    // Sempre atualizar o campo updated_at
    updates.push(`updated_at = $${paramCounter++}`);
    values.push(now);

    // Adicionar o ID ao final
    values.push(id);

    if (updates.length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }

    const query = `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    console.log('📝 Query SQL:', query);
    console.log('📝 Valores:', values);
    
    const result = await pool.query(query, values);
    console.log('✅ Query executada, linhas afetadas:', result.rowCount);

    if (result.rows.length === 0) {
      throw new Error('Item não encontrado para atualização');
    }

    // Buscar o item atualizado com todas as informações associadas
    const isFixedSelect = hasIsFixedColumn 
      ? 'COALESCE(i.is_fixed, false) as "isFixed",' 
      : 'false as "isFixed",';

    const fetchRes = await pool.query(`
      SELECT
        i.id, i.serial, i.patrimony, i.brand, i.sala, i.obs, 
        ${isFixedSelect}
        i.status,
        c.name as campus,
        cat.name as category,
        s.name as setor,
        u.name as responsible,
        i.created_at as created,
        i.updated_at as updated
      FROM inventory_items i
      LEFT JOIN campus c ON i.campus_id = c.id
      LEFT JOIN categories cat ON i.category_id = cat.id
      LEFT JOIN sectors s ON i.setor_id = s.id
      LEFT JOIN users u ON i.responsible_id = u.id
      WHERE i.id = $1
    `, [id]);

    const finalItem = fetchRes.rows[0];
    console.log('📊 Item final retornado:');
    console.log('   - Item completo:', finalItem);
    console.log('   - isFixed final:', finalItem?.isFixed);
    console.log('   - is_fixed bruto:', finalItem?.is_fixed);
    
    return finalItem;
  } catch (error) {
    console.error('Erro ao atualizar item no inventário:', error);
    throw error;
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    // 🛡️ PROTEÇÃO CONTRA IDs FANTASMA
    guardAgainstPhantomIds(id, 'deleteInventoryItem');
    
    await pool.query('DELETE FROM inventory_items WHERE id = $1', [id]);
  } catch (error) {
    console.error('Erro ao deletar item do inventário:', error);
    throw error;
  }
}

export async function updateInventoryStatus(id: string, status: string): Promise<void> {
  try {
    // 🛡️ PROTEÇÃO CONTRA IDs FANTASMA
    guardAgainstPhantomIds(id, 'updateInventoryStatus');
    
    await pool.query(
      'UPDATE inventory_items SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  } catch (error) {
    console.error('Erro ao atualizar status do item:', error);
    throw error;
  }
}

export async function updateInventoryForCampusRename(oldName: string, newName: string): Promise<void> {
  try {
    // Como estamos usando chaves estrangeiras, não precisamos atualizar o campus_id, apenas o nome do campus
    const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [oldName]);
    if (campusResult.rows.length > 0) {
      await pool.query('UPDATE campus SET name = $1 WHERE id = $2', [newName, campusResult.rows[0].id]);
    }
  } catch (error) {
    console.error('Erro ao atualizar inventário após renomear campus:', error);
    throw error;
  }
}

export async function updateRequestStatus(id: string, status: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );
  } catch (error) {
    console.error('Erro ao atualizar status da solicitação:', error);
    throw error;
  }
}

export async function getAuditLog(campusId?: string): Promise<AuditLogEntry[]> {
  try {
    let query: string;
    let params: any[];
    
    if (campusId) {
      // 🔒 Para usuários de campus específico: retorna APENAS logs desse campus
      query = `
        SELECT
          al.id,
          al.action,
          u.name as user,
          c.name as campus,
          al.timestamp,
          al.inventory_id,
          al.details
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN campus c ON al.campus_id = c.id
        WHERE al.campus_id = $1
        ORDER BY al.timestamp DESC
      `;
      params = [campusId];
      console.log(`� [getAuditLog] Buscando logs para campus específico: ${campusId}`);
    } else {
      // 👑 Para admin: retorna TODOS os logs
      query = `
        SELECT
          al.id,
          al.action,
          u.name as user,
          c.name as campus,
          al.timestamp,
          al.inventory_id,
          al.details
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN campus c ON al.campus_id = c.id
        ORDER BY al.timestamp DESC
      `;
      params = [];
      console.log('👑 [getAuditLog] Buscando TODOS os logs (admin)');
    }
    
    const res = await pool.query(query, params);
    console.log(`📊 [getAuditLog] Encontrados ${res.rows.length} logs de auditoria`);
    
    if (res.rows.length > 0) {
      console.log('📝 [getAuditLog] Primeiros 3 logs:', res.rows.slice(0, 3).map(row => ({
        id: row.id,
        action: row.action,
        user: row.user,
        campus: row.campus,
        timestamp: row.timestamp
      })));
    }
    
    const mappedResults = res.rows.map(entry => ({
      ...entry,
      item: entry.inventory_id ? { id: entry.inventory_id } : null
    }));
    
    console.log(`✅ [getAuditLog] Retornando ${mappedResults.length} logs mapeados`);
    return mappedResults;
  } catch (error) {
    console.error('❌ [getAuditLog] Erro ao buscar log de auditoria:', error);
    return [];
  }
}

export async function insertAuditLogEntry(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    console.log('📝 [insertAuditLogEntry] Inserindo novo log:', {
      action: log.action,
      user: log.user,
      campus: log.campus,
      details: log.details
    });
    
    const newId = crypto.randomUUID();

    // Buscar IDs relacionados
    let userId = null;
    let campusId = null;
    let inventoryId = null;

    if (log.user) {
      const userResult = await pool.query('SELECT id FROM users WHERE name = $1', [log.user]);
      userId = userResult.rows[0]?.id;
      console.log(`🔍 [insertAuditLogEntry] User "${log.user}" -> ID: ${userId}`);
    }

    if (log.campus) {
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [log.campus]);
      campusId = campusResult.rows[0]?.id;
      console.log(`🔍 [insertAuditLogEntry] Campus "${log.campus}" -> ID: ${campusId}`);
    }

    if (log.item && typeof log.item === 'object' && 'id' in log.item) {
      inventoryId = log.item.id;
      console.log(`🔍 [insertAuditLogEntry] Item ID: ${inventoryId}`);
      
      // Verificar se o item realmente existe na tabela inventory_items
      const itemExists = await pool.query('SELECT id FROM inventory_items WHERE id = $1', [inventoryId]);
      if (itemExists.rows.length === 0) {
        console.warn(`⚠️ [insertAuditLogEntry] Item ${inventoryId} não existe na tabela inventory_items, definindo como NULL`);
        inventoryId = null;
      } else {
        console.log(`✅ [insertAuditLogEntry] Item ${inventoryId} encontrado na tabela inventory_items`);
      }
    }

    await pool.query(
      `INSERT INTO audit_log (
        id, action, user_id, campus_id, inventory_id, details, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [newId, log.action, userId, campusId, inventoryId, log.details]
    );
    
    console.log('✅ [insertAuditLogEntry] Log inserido com sucesso no banco');
  } catch (error) {
    console.error('❌ [insertAuditLogEntry] Erro ao inserir entrada no log de auditoria:', error);
    throw error;
  }
}

export async function getLoans(campusId?: string): Promise<Loan[]> {
  try {
    let query: string;
    let params: any[];
    
    if (campusId) {
      // 🔒 Para usuários de campus específico: retorna APENAS empréstimos de itens desse campus
      query = `
        SELECT
          l.id,
          l.inventory_id AS "itemId",
          i.serial AS "itemSerial",
          cat.name AS "itemCategory",
          l.borrower_name AS "borrowerName",
          l.borrower_contact AS "borrowerContact",
          to_char(l.loan_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "loanDate",
          to_char(l.expected_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "expectedReturnDate",
          CASE WHEN l.actual_return_date IS NOT NULL
               THEN to_char(l.actual_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
               ELSE NULL
          END AS "actualReturnDate",
          l.status,
          l.notes,
          c.name AS campus,
          u.name AS loaner
        FROM loans l
        JOIN inventory_items i ON i.id = l.inventory_id
        JOIN categories cat ON cat.id = i.category_id
        JOIN campus c ON c.id = i.campus_id
        JOIN users u ON u.id = l.loaner_id
        WHERE i.campus_id = $1
        ORDER BY l.loan_date DESC
      `;
      params = [campusId];
      console.log(`🔒 [getLoans] Buscando empréstimos para campus específico: ${campusId}`);
    } else {
      // 👑 Para admin: retorna TODOS os empréstimos
      query = `
        SELECT
          l.id,
          l.inventory_id AS "itemId",
          i.serial AS "itemSerial",
          cat.name AS "itemCategory",
          l.borrower_name AS "borrowerName",
          l.borrower_contact AS "borrowerContact",
          to_char(l.loan_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "loanDate",
          to_char(l.expected_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "expectedReturnDate",
          CASE WHEN l.actual_return_date IS NOT NULL
               THEN to_char(l.actual_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
               ELSE NULL
          END AS "actualReturnDate",
          l.status,
          l.notes,
          c.name AS campus,
          u.name AS loaner
        FROM loans l
        JOIN inventory_items i ON i.id = l.inventory_id
        JOIN categories cat ON cat.id = i.category_id
        JOIN campus c ON c.id = i.campus_id
        JOIN users u ON u.id = l.loaner_id
        ORDER BY l.loan_date DESC
      `;
      params = [];
      console.log('👑 [getLoans] Buscando TODOS os empréstimos (admin)');
    }
    
    const res = await pool.query(query, params);
    console.log(`✅ [getLoans] Encontrados ${res.rows.length} empréstimos`);
    return res.rows;
  } catch (error) {
    console.error('❌ [getLoans] Erro ao buscar empréstimos:', error);
    return [];
  }
}

export async function insertLoan(loan: Omit<Loan, 'id'>): Promise<Loan> {
  try {
    const newId = crypto.randomUUID();

    // Buscar o ID do usuario emprestador
    const userResult = await pool.query('SELECT id FROM users WHERE name = $1', [loan.loaner]);
    if (userResult.rows.length === 0) {
      throw new Error(`Usuário emprestador não encontrado: ${loan.loaner}`);
    }
    const loanerId = userResult.rows[0].id;

    // Inserir o empréstimo
    await pool.query(
      `INSERT INTO loans (
        id, inventory_id, borrower_name, borrower_contact, loan_date,
        expected_return_date, status, notes, loaner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        newId,
        loan.itemId,
        loan.borrowerName,
        loan.borrowerContact,
        loan.loanDate,
        loan.expectedReturnDate,
        loan.status || 'active',
        loan.notes,
        loanerId
      ]
    );

    // Buscar o empréstimo completo com todos os relacionamentos
    const res = await pool.query(`
      SELECT
        l.id,
        l.inventory_id AS "itemId",
        i.serial AS "itemSerial",
        cat.name AS "itemCategory",
        l.borrower_name AS "borrowerName",
        l.borrower_contact AS "borrowerContact",
        to_char(l.loan_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "loanDate",
        to_char(l.expected_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS "expectedReturnDate",
        CASE WHEN l.actual_return_date IS NOT NULL
             THEN to_char(l.actual_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
             ELSE NULL
        END AS "actualReturnDate",
        l.status,
        l.notes,
        c.name AS campus,
        u.name AS loaner
      FROM loans l
      JOIN inventory_items i ON i.id = l.inventory_id
      JOIN categories cat ON cat.id = i.category_id
      JOIN campus c ON c.id = i.campus_id
      JOIN users u ON u.id = l.loaner_id
      WHERE l.id = $1
    `, [newId]);

    return res.rows[0];
  } catch (error) {
    console.error('Erro ao inserir empréstimo:', error);
    throw error;
  }
}

export async function returnLoan(loanId: string, returnDate: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE loans SET actual_return_date = $1, status = $2 WHERE id = $3',
      [returnDate, 'returned', loanId]
    );
  } catch (error) {
    console.error('Erro ao registrar devolução de empréstimo:', error);
    throw error;
  }
}

export async function getRequests(): Promise<SupportRequest[]> {
  try {
    const res = await pool.query(`
      SELECT
        id,
        requester_email as "requesterEmail",
        campus,
        setor,
        sala,
        details,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM requests
      ORDER BY created_at DESC
    `);
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar solicitações:', error);
    return [];
  }
}

export async function insertCategory(category: Omit<Category, 'id'> & { campusId: string }): Promise<Category> {
  try {
    console.log('🔧 insertCategory - Iniciando inserção:', {
      name: category.name,
      campusId: category.campusId,
      campusIdType: typeof category.campusId,
      campusIdLength: category.campusId?.length
    });
    
    if (!category.campusId) {
      throw new Error('campusId é obrigatório para criar uma categoria');
    }
    
    // Verificar se o campus_id existe
    const campusCheck = await pool.query('SELECT id, name FROM campus WHERE id = $1', [category.campusId]);
    console.log('🏢 Verificação de campus:', {
      campusId: category.campusId,
      found: campusCheck.rows.length > 0,
      campus: campusCheck.rows[0] || null
    });
    
    if (campusCheck.rows.length === 0) {
      throw new Error(`Campus com ID "${category.campusId}" não encontrado`);
    }
    
    const newId = crypto.randomUUID();
    const newCategory: Category = { ...category, id: newId };
    
    console.log('📝 Executando INSERT:', {
      query: 'INSERT INTO categories (id, name, campus_id) VALUES ($1, $2, $3)',
      params: [newCategory.id, newCategory.name, category.campusId]
    });
    
    const result = await pool.query('INSERT INTO categories (id, name, campus_id) VALUES ($1, $2, $3)', 
      [newCategory.id, newCategory.name, category.campusId]);
    
    // Buscar a categoria criada com os dados do campus
    const createdCategory = await pool.query(`
      SELECT c.id, c.name, ca.id as campus_id, ca.name as campus_name
      FROM categories c
      JOIN campus ca ON c.campus_id = ca.id
      WHERE c.id = $1
    `, [newCategory.id]);
    
    const categoryWithCampus = {
      id: createdCategory.rows[0].id,
      name: createdCategory.rows[0].name,
      campus: {
        id: createdCategory.rows[0].campus_id,
        name: createdCategory.rows[0].campus_name
      }
    };
    
    console.log('✅ Categoria inserida com sucesso:', {
      id: categoryWithCampus.id,
      name: categoryWithCampus.name,
      campusId: category.campusId,
      campusName: categoryWithCampus.campus.name,
      result: result.command
    });
    
    return categoryWithCampus;
  } catch (error: any) {
    console.error('❌ Erro ao inserir categoria:', {
      error: error?.message || error,
      code: error?.code,
      detail: error?.detail,
      campusId: category?.campusId,
      categoryName: category?.name
    });
    throw error;
  }
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  try {
    await pool.query('UPDATE categories SET name = $1 WHERE id = $2', [category.name, id]);
    const res = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return res.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    throw error;
  }
}

// Funções de setor
export async function insertSector(sector: Omit<Sector, 'id'> & { campusId: string }): Promise<Sector> {
  try {
    console.log('🔧 insertSector - Iniciando inserção:', {
      name: sector.name,
      campusId: sector.campusId,
      campusIdType: typeof sector.campusId,
      campusIdLength: sector.campusId?.length
    });
    
    if (!sector.campusId) {
      throw new Error('campusId é obrigatório para criar um setor');
    }
    
    // Verificar se o campus_id existe
    const campusCheck = await pool.query('SELECT id, name FROM campus WHERE id = $1', [sector.campusId]);
    console.log('🏢 Verificação de campus:', {
      campusId: sector.campusId,
      found: campusCheck.rows.length > 0,
      campus: campusCheck.rows[0] || null
    });
    
    if (campusCheck.rows.length === 0) {
      throw new Error(`Campus com ID "${sector.campusId}" não encontrado`);
    }
    
    // Verificar se já existe setor com o mesmo nome NO MESMO CAMPUS
    const duplicateCheck = await pool.query(
      'SELECT id, name FROM sectors WHERE name = $1 AND campus_id = $2', 
      [sector.name, sector.campusId]
    );
    
    console.log('🔍 Verificação de duplicata:', {
      sectorName: sector.name,
      campusId: sector.campusId,
      found: duplicateCheck.rows.length > 0,
      existing: duplicateCheck.rows[0] || null
    });
    
    if (duplicateCheck.rows.length > 0) {
      throw new Error(`Já existe um setor chamado "${sector.name}" neste campus`);
    }
    
    const newId = crypto.randomUUID();
    const newSector: Sector = { ...sector, id: newId };
    
    console.log('📝 Executando INSERT:', {
      query: 'INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)',
      params: [newSector.id, newSector.name, sector.campusId]
    });
    
    const result = await pool.query('INSERT INTO sectors (id, name, campus_id) VALUES ($1, $2, $3)', 
      [newSector.id, newSector.name, sector.campusId]);
    
    // Buscar o setor criado com os dados do campus
    const createdSector = await pool.query(`
      SELECT s.id, s.name, c.id as campus_id, c.name as campus_name
      FROM sectors s
      JOIN campus c ON s.campus_id = c.id
      WHERE s.id = $1
    `, [newSector.id]);
    
    const sectorWithCampus = {
      id: createdSector.rows[0].id,
      name: createdSector.rows[0].name,
      campus: {
        id: createdSector.rows[0].campus_id,
        name: createdSector.rows[0].campus_name
      }
    };
    
    console.log('✅ Setor inserido com sucesso:', {
      id: sectorWithCampus.id,
      name: sectorWithCampus.name,
      campusId: sector.campusId,
      campusName: sectorWithCampus.campus.name,
      result: result.command
    });
    
    return sectorWithCampus;
  } catch (error: any) {
    console.error('❌ Erro ao inserir setor:', {
      error: error?.message || error,
      code: error?.code,
      detail: error?.detail,
      campusId: sector?.campusId,
      sectorName: sector?.name
    });
    throw error;
  }
}

export async function updateSector(id: string, sector: Partial<Sector>): Promise<Sector> {
  try {
    await pool.query('UPDATE sectors SET name = $1 WHERE id = $2', [sector.name, id]);
    const res = await pool.query('SELECT * FROM sectors WHERE id = $1', [id]);
    return res.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar setor:', error);
    throw error;
  }
}

export async function deleteSector(id: string): Promise<void> {
  try {
    await pool.query('DELETE FROM sectors WHERE id = $1', [id]);
  } catch (error) {
    console.error('Erro ao excluir setor:', error);
    throw error;
  }
}

