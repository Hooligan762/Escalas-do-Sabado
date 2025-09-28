'use server';

import { Pool } from 'pg';
import crypto from 'crypto';
import type { InventoryItem, AuditLogEntry, Category, Sector, Loan, User, Campus, Request as SupportRequest } from '@/lib/types';

// Criar o pool mas não exportá-lo diretamente
// Em vez disso, vamos usá-lo internamente no módulo
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

// Função para obter o pool (para compatibilidade com o código existente)
export async function getPool(): Promise<Pool> {
  return pool;
}

export async function getInventory(): Promise<InventoryItem[]> {
  try {
    const res = await pool.query(`
      SELECT 
        i.id,
        i.serial,
        i.patrimony,
        i.brand,
        i.sala,
        i.obs,
        i.is_fixed as isFixed,
        i.status,
        i.campus_id,
        c.name as campus,
        i.category_id,
        cat.name as category,
        i.setor_id,
        s.name as setor,
        i.responsible_id,
        u.name as responsible,
        i.responsible_name,
        i.created_at as created,
        i.updated_at as updated
      FROM inventory i
      LEFT JOIN users u ON i.responsible_id = u.id
      LEFT JOIN campus c ON i.campus_id = c.id
      LEFT JOIN categories cat ON i.category_id = cat.id
      LEFT JOIN sectors s ON i.setor_id = s.id
      ORDER BY i.created_at DESC
    `);
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar inventário:', error);
    return [];
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const res = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.name, 
        u.role, 
        u.password,
        u.campus_id, 
        c.name as campus
      FROM 
        users u
      LEFT JOIN 
        campus c ON u.campus_id = c.id
      ORDER BY u.name ASC
    `);
    return res.rows.map(u => ({ ...u, campus: u.campus || null }));
  } catch (error) {
    console.error('Erro ao consultar usuários:', error);
    throw error;
  }
}

export async function getCampusList(): Promise<Campus[]> {
  const res = await pool.query('SELECT * FROM campus ORDER BY name ASC');
  return res.rows;
}

export async function getCategories(): Promise<Category[]> {
  try {
    const res = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
}

export async function getSectors(): Promise<Sector[]> {
  try {
    const res = await pool.query('SELECT * FROM sectors ORDER BY name ASC');
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
    const inventoryResult = await pool.query('SELECT COUNT(*) FROM inventory WHERE campus_id = $1', [id]);
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
      console.log('👥 insertUser - Buscando campus por nome:', user.campus);
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [user.campus]);
      if (campusResult.rows.length > 0) {
        campusId = campusResult.rows[0].id;
        console.log('👥 insertUser - Campus ID encontrado:', campusId);
      } else {
        console.log('⚠️ insertUser - Campus não encontrado:', user.campus);
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
  }    const newUser: User = {
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
    const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [campus]);
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
}export async function deleteUser(id: string): Promise<void> {
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
      `INSERT INTO inventory (
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
    const now = new Date().toISOString();
    const updates = [];
    const values = [];
    let paramCounter = 1;
    
    // Mapear campos para colunas no banco de dados
    const fieldMappings: Record<string, string> = {
      serial: 'serial',
      patrimony: 'patrimony',
      brand: 'brand',
      sala: 'sala',
      obs: 'obs',
      isFixed: 'is_fixed',
      status: 'status'
    };
    
    // Adicionar campos diretos
    for (const [field, column] of Object.entries(fieldMappings)) {
      if (field in item) {
        updates.push(`${column} = $${paramCounter++}`);
        values.push((item as any)[field]);
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
    
    const query = `UPDATE inventory SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Item não encontrado para atualização');
    }
    
    // Buscar o item atualizado com todas as informações associadas
    const fetchRes = await pool.query(`
      SELECT 
        i.id, i.serial, i.patrimony, i.brand, i.sala, i.obs, i.is_fixed as isFixed, i.status,
        i.campus_id, c.name as campus,
        i.category_id, cat.name as category,
        i.setor_id, s.name as setor,
        i.responsible_id, u.name as responsible,
        i.created_at as created, i.updated_at as updated
      FROM inventory i
      LEFT JOIN users u ON i.responsible_id = u.id
      LEFT JOIN campus c ON i.campus_id = c.id
      LEFT JOIN categories cat ON i.category_id = cat.id
      LEFT JOIN sectors s ON i.setor_id = s.id
      WHERE i.id = $1
    `, [id]);
    
    return fetchRes.rows[0];
  } catch (error) {
    console.error('Erro ao atualizar item no inventário:', error);
    throw error;
  }
}

export async function deleteInventoryItem(id: string): Promise<void> {
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
  } catch (error) {
    console.error('Erro ao deletar item do inventário:', error);
    throw error;
  }
}

export async function updateInventoryStatus(id: string, status: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE inventory SET status = $1, updated_at = NOW() WHERE id = $2',
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

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  try {
    const res = await pool.query(`
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
    `);
    return res.rows.map(entry => ({
      ...entry,
      item: entry.inventory_id ? { id: entry.inventory_id } : null
    }));
  } catch (error) {
    console.error('Erro ao buscar log de auditoria:', error);
    return [];
  }
}

export async function insertAuditLogEntry(log: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  try {
    const newId = crypto.randomUUID();
    
    // Buscar IDs relacionados
    let userId = null;
    let campusId = null;
    let inventoryId = null;
    
    if (log.user) {
      const userResult = await pool.query('SELECT id FROM users WHERE name = $1', [log.user]);
      userId = userResult.rows[0]?.id;
    }
    
    if (log.campus) {
      const campusResult = await pool.query('SELECT id FROM campus WHERE name = $1', [log.campus]);
      campusId = campusResult.rows[0]?.id;
    }
    
    if (log.item && typeof log.item === 'object' && 'id' in log.item) {
      inventoryId = log.item.id;
    }
    
    await pool.query(
      `INSERT INTO audit_log (
        id, action, user_id, campus_id, inventory_id, details, timestamp
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [newId, log.action, userId, campusId, inventoryId, log.details]
    );
  } catch (error) {
    console.error('Erro ao inserir entrada no log de auditoria:', error);
    throw error;
  }
}

export async function getLoans(): Promise<Loan[]> {
  try {
    const res = await pool.query(`
      SELECT 
        l.id,
        l.inventory_id AS "itemId",
        i.serial AS "itemSerial",
        cat.name AS "itemCategory",
        l.borrower_name AS "borrowerName",
        l.borrower_contact AS "borrowerContact",
        to_char(l.loan_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "loanDate",
        to_char(l.expected_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expectedReturnDate",
        CASE WHEN l.actual_return_date IS NOT NULL 
             THEN to_char(l.actual_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') 
             ELSE NULL 
        END AS "actualReturnDate",
        l.status,
        l.notes,
        c.name AS campus,
        u.name AS loaner
      FROM loans l
      JOIN inventory i ON i.id = l.inventory_id
      JOIN categories cat ON cat.id = i.category_id
      JOIN campus c ON c.id = i.campus_id
      JOIN users u ON u.id = l.loaner_id
      ORDER BY l.loan_date DESC
    `);
    
    return res.rows;
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error);
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
    const res = await pool.query(
      `SELECT 
        l.id,
        l.inventory_id AS "itemId",
        i.serial AS "itemSerial",
        cat.name AS "itemCategory",
        l.borrower_name AS "borrowerName",
        l.borrower_contact AS "borrowerContact",
        to_char(l.loan_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "loanDate",
        to_char(l.expected_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expectedReturnDate",
        CASE WHEN l.actual_return_date IS NOT NULL 
             THEN to_char(l.actual_return_date AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') 
             ELSE NULL 
        END AS "actualReturnDate",
        l.status,
        l.notes,
        c.name AS campus,
        u.name AS loaner
      FROM loans l
      JOIN inventory i ON i.id = l.inventory_id
      JOIN categories cat ON cat.id = i.category_id
      JOIN campus c ON c.id = i.campus_id
      JOIN users u ON u.id = l.loaner_id
      WHERE l.id = $1
      `,
      [newId]
    );
    
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

export async function insertCategory(category: Omit<Category, 'id'>): Promise<Category> {
  try {
    const newId = crypto.randomUUID();
    const newCategory: Category = { ...category, id: newId };
    console.log('Inserindo categoria com UUID:', newId);
    await pool.query('INSERT INTO categories (id, name) VALUES ($1, $2)', [newCategory.id, newCategory.name]);
    return newCategory;
  } catch (error) {
    console.error('Erro ao inserir categoria:', error);
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
export async function insertSector(sector: Omit<Sector, 'id'> | string): Promise<Sector> {
  try {
    const newId = crypto.randomUUID();
    let newSector: Sector;
    
    // Suporta tanto o formato do objeto quanto uma string direta
    if (typeof sector === 'string') {
      newSector = { id: newId, name: sector };
    } else {
      newSector = { ...sector, id: newId };
    }
    
    console.log('Inserindo setor com UUID:', newId);
    await pool.query('INSERT INTO sectors (id, name) VALUES ($1, $2)', [newSector.id, newSector.name]);
    return newSector;
  } catch (error) {
    console.error('Erro ao inserir setor:', error);
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
