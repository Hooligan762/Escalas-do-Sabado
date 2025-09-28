'use server';

import { Pool } from 'pg';

// Importar a função para obter o pool
import { getPool } from './postgres-adapter';

/**
 * Sanitiza identificadores SQL para prevenir SQL Injection em nomes de tabelas e colunas
 * Esta função garante que apenas caracteres alfanuméricos e underscore sejam aceitos
 * @param identifier Nome da tabela ou coluna para sanitizar
 * @returns O mesmo identificador se for válido, lança erro caso contrário
 */
function sanitizeSqlIdentifier(identifier: string): string {
  if (!identifier || typeof identifier !== 'string') {
    throw new Error('Identificador SQL inválido: não pode ser vazio');
  }
  
  // Verificar se o identificador contém apenas caracteres seguros
  if (!/^[a-zA-Z0-9_]+$/.test(identifier)) {
    throw new Error(`Identificador SQL inválido: "${identifier}"`);
  }
  
  return identifier;
}

/**
 * Utilitários para execução segura de consultas SQL
 */

/**
 * Executa uma consulta SQL de forma segura com parâmetros
 * @param query String SQL com placeholders ($1, $2, etc)
 * @param params Parâmetros para substituir os placeholders
 * @returns Resultado da consulta
 */
export async function executeSecureQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    // Verificar se a consulta contém injeção SQL óbvia
    const dangerousKeywords = [
      '--',
      ';--',
      ';',
      '/*',
      '*/',
      '@@',
      '@variable',
      'exec(',
      'execute(',
      'sp_',
      'xp_',
      'UTL_FILE',
      'INSERT INTO',
      'UPDATE',
      'DELETE FROM',
      'DROP',
      'TRUNCATE',
      'ALTER'
    ];

    // Verificar se a consulta é um SELECT (permitido) ou outro tipo de consulta (não permitido)
    // Esta função deve ser usada apenas para consultas de leitura (SELECT)
    const isSelectQuery = query.trim().toUpperCase().startsWith('SELECT');
    
    if (!isSelectQuery) {
      throw new Error('Apenas consultas SELECT são permitidas');
    }
    
    // Verificar se alguma palavra-chave perigosa aparece na consulta
    const hasDangerousKeyword = dangerousKeywords.some(keyword => 
      query.toUpperCase().includes(keyword.toUpperCase())
    );
    
    if (hasDangerousKeyword) {
      throw new Error('Consulta SQL contém palavras-chave proibidas');
    }

    // Obter o pool e executar a consulta com parâmetros
    const dbPool = await getPool();
    const result = await dbPool.query(query, params);
    return result.rows;
  } catch (error: any) {
    console.error('Erro ao executar consulta segura:', error);
    throw new Error(`Erro na consulta SQL: ${error.message}`);
  }
}

/**
 * Executa uma mutação SQL (INSERT, UPDATE, DELETE) de forma segura
 * @param query String SQL com placeholders ($1, $2, etc)
 * @param params Parâmetros para substituir os placeholders
 * @returns Número de linhas afetadas
 */
export async function executeSecureMutation(
  query: string,
  params: any[] = []
): Promise<number> {
  try {
    // Verificar se a consulta não é um SELECT (deve ser uma mutação)
    const isSelectQuery = query.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelectQuery) {
      throw new Error('Esta função deve ser usada apenas para mutações (INSERT, UPDATE, DELETE)');
    }
    
    // Verificar se a consulta contém injeção SQL óbvia
    if (query.includes(';') && !query.includes('$')) {
      throw new Error('Consulta SQL potencialmente perigosa detectada');
    }

    // Obter o pool e executar a consulta com parâmetros
    const dbPool = await getPool();
    const result = await dbPool.query(query, params);
    return result.rowCount || 0; // Garantir que retorne 0 se for null
  } catch (error: any) {
    console.error('Erro ao executar mutação segura:', error);
    throw new Error(`Erro na mutação SQL: ${error.message}`);
  }
}

/**
 * Constrói uma cláusula WHERE segura a partir de filtros
 * @param filters Objeto com filtros no formato { coluna: valor }
 * @returns { whereClause, params } Cláusula WHERE e parâmetros
 */
export async function buildSecureWhereClause(
  filters: Record<string, any>
): Promise<{ whereClause: string; params: any[] }> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Lista de operadores permitidos e sua tradução SQL
  const allowedOperators: Record<string, string> = {
    eq: '=',         // igual
    neq: '<>',       // diferente
    gt: '>',         // maior que
    lt: '<',         // menor que
    gte: '>=',       // maior ou igual
    lte: '<=',       // menor ou igual
    like: 'LIKE',    // contém
    ilike: 'ILIKE',  // contém (case insensitive)
    in: 'IN'         // em uma lista
  };

  // Para cada filtro, construir a condição
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    // Verificar se é uma operação com operador especial (ex: { nome__eq: 'valor' })
    const keyParts = key.split('__');
    const fieldName = keyParts[0];
    const operator = keyParts.length > 1 ? keyParts[1] : 'eq';

    // Verificar se o operador é permitido
    if (!allowedOperators[operator]) {
      throw new Error(`Operador não permitido: ${operator}`);
    }

    // Sanitizar o nome do campo usando nossa função utilitária
    const sanitizedField = sanitizeSqlIdentifier(fieldName);

    // Construir a condição
    if (operator === 'in' && Array.isArray(value)) {
      // Para operador IN, construir uma lista de parâmetros
      const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`${sanitizedField} IN (${placeholders})`);
      params.push(...value);
    } else {
      conditions.push(`${sanitizedField} ${allowedOperators[operator]} $${paramIndex++}`);
      params.push(value);
    }
  }

  // Retornar a cláusula WHERE
  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

/**
 * Realiza um SELECT seguro com filtros
 * @param table Nome da tabela
 * @param columns Array de colunas ou string '*'
 * @param filters Objeto com filtros
 * @returns Resultado da consulta
 */
export async function secureSelect<T = any>(
  table: string,
  columns: string[] | '*' = '*',
  filters: Record<string, any> = {}
): Promise<T[]> {
  // Sanitizar nome da tabela
  const sanitizedTable = sanitizeSqlIdentifier(table);

  // Preparar colunas
  const columnsStr = columns === '*' ? '*' : columns.map(col => {
    // Sanitizar nomes das colunas
    if (col !== '*') {
      return sanitizeSqlIdentifier(col);
    }
    return col;
  }).join(', ');

  // Construir cláusula WHERE
  const { whereClause, params } = await buildSecureWhereClause(filters);

  // Construir e executar a consulta
  const query = `SELECT ${columnsStr} FROM ${sanitizedTable} ${whereClause}`;
  return await executeSecureQuery<T>(query, params);
}

/**
 * Realiza um INSERT seguro na tabela
 * @param table Nome da tabela
 * @param data Objeto com os dados a serem inseridos no formato { coluna: valor }
 * @returns ID do registro inserido, se disponível
 */
export async function secureInsert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T | null> {
  // Sanitizar nome da tabela
  const sanitizedTable = sanitizeSqlIdentifier(table);
  
  // Extrair colunas e valores
  const columns: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(data)) {
    // Ignorar valores undefined/null
    if (value === undefined) continue;
    
    // Sanitizar nome da coluna
    const sanitizedColumn = sanitizeSqlIdentifier(key);
    columns.push(sanitizedColumn);
    values.push(value);
    placeholders.push(`$${paramIndex++}`);
  }
  
  if (columns.length === 0) {
    throw new Error('Nenhum dado válido fornecido para inserção');
  }
  
  // Construir e executar a consulta
  const query = `
    INSERT INTO ${sanitizedTable} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *
  `;
  
  const result = await executeSecureQuery<T>(query, values);
  return result.length > 0 ? result[0] : null;
}

/**
 * Realiza um UPDATE seguro na tabela
 * @param table Nome da tabela
 * @param data Objeto com os dados a serem atualizados no formato { coluna: valor }
 * @param whereFilters Objeto com filtros para a cláusula WHERE
 * @returns Número de linhas afetadas
 */
export async function secureUpdate(
  table: string,
  data: Record<string, any>,
  whereFilters: Record<string, any>
): Promise<number> {
  // Sanitizar nome da tabela
  const sanitizedTable = sanitizeSqlIdentifier(table);
  
  // Extrair colunas e valores para atualização
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(data)) {
    // Ignorar valores undefined
    if (value === undefined) continue;
    
    // Sanitizar nome da coluna
    const sanitizedColumn = sanitizeSqlIdentifier(key);
    updates.push(`${sanitizedColumn} = $${paramIndex++}`);
    values.push(value);
  }
  
  if (updates.length === 0) {
    throw new Error('Nenhum dado válido fornecido para atualização');
  }
  
  // Construir cláusula WHERE
  const { whereClause, params } = await buildSecureWhereClause(whereFilters);
  
  if (!whereClause) {
    throw new Error('Critérios de filtro WHERE são obrigatórios para atualizações');
  }
  
  // Adicionar parâmetros do WHERE aos valores
  values.push(...params);
  
  // Construir e executar a consulta
  const query = `
    UPDATE ${sanitizedTable}
    SET ${updates.join(', ')}
    ${whereClause}
    RETURNING *
  `;
  
  const result = await executeSecureQuery(query, values);
  return result.length;
}

/**
 * Realiza um DELETE seguro na tabela
 * @param table Nome da tabela
 * @param whereFilters Objeto com filtros para a cláusula WHERE
 * @returns Número de linhas afetadas
 */
export async function secureDelete(
  table: string,
  whereFilters: Record<string, any>
): Promise<number> {
  // Sanitizar nome da tabela
  const sanitizedTable = sanitizeSqlIdentifier(table);
  
  // Construir cláusula WHERE
  const { whereClause, params } = await buildSecureWhereClause(whereFilters);
  
  if (!whereClause) {
    throw new Error('Critérios de filtro WHERE são obrigatórios para exclusões');
  }
  
  // Construir e executar a consulta
  const query = `DELETE FROM ${sanitizedTable} ${whereClause}`;
  
  return await executeSecureMutation(query, params);
}