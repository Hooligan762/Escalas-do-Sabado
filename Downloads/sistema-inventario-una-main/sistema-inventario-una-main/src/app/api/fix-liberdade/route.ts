/**
 * 🛠️ API PARA CORREÇÃO DO CAMPUS LIBERDADE
 * Baseada na solução que funcionou para Campus Aimores
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 INICIANDO CORREÇÃO DO CAMPUS LIBERDADE...');
    const results = [];
    
    // 1. Padronizar nome do campus (similar ao Aimores)
    console.log('🔄 Padronizando nome do campus...');
    const campusUpdate = await pool.query(`
      UPDATE inventory_items 
      SET campus = 'Liberdade' 
      WHERE campus IN ('liberdade', 'Liberdad', 'LIBERDADE', 'LiberdAde', 'liberdad')
    `);
    results.push(`✅ ${campusUpdate.rowCount} itens de inventário padronizados`);
    
    // 2. Corrigir usuário se necessário  
    const userUpdate = await pool.query(`
      UPDATE users 
      SET username = 'liberdade', campus = 'Liberdade', name = 'Técnico Liberdade'
      WHERE username IN ('liberda', 'liberdad', 'liberdade') 
      OR campus ILIKE '%liberdad%'
      OR name ILIKE '%liberdad%'
    `);
    results.push(`👤 ${userUpdate.rowCount} usuários corrigidos`);
    
    // 3. Garantir que o campus existe
    const campusInsert = await pool.query(`
      INSERT INTO campus (id, name) 
      VALUES ('liberdade', 'Liberdade')
      ON CONFLICT (id) DO UPDATE SET name = 'Liberdade'
    `);
    results.push('🏢 Campus garantido na tabela');
    
    // 4. REMOÇÃO CRÍTICA: Limpar ID fantasma específico do Liberdade
    const phantomCleanup = await pool.query(`
      DELETE FROM inventory_items 
      WHERE id = 'e806ca85-2304-49f0-ac04-3cb96d026465'
    `);
    results.push(`🧹 ${phantomCleanup.rowCount} itens fantasma removidos`);
    
    // 5. Limpar logs de auditoria corrompidos
    const auditCleanup = await pool.query(`
      DELETE FROM audit_log 
      WHERE item_id = 'e806ca85-2304-49f0-ac04-3cb96d026465'
      OR details LIKE '%e806ca85-2304-49f0-ac04-3cb96d026465%'
    `);
    results.push(`📝 ${auditCleanup.rowCount} logs de auditoria limpos`);
    
    // 6. Verificação final
    const finalCheck = await pool.query(`
      SELECT campus, COUNT(*) as count 
      FROM inventory_items 
      WHERE campus = 'Liberdade'
      GROUP BY campus
    `);
    
    const userFinalCheck = await pool.query(`
      SELECT username, name, campus 
      FROM users 
      WHERE campus = 'Liberdade'
    `);
    
    console.log('✅ CORREÇÃO CONCLUÍDA:', {
      inventory: finalCheck.rows,
      users: userFinalCheck.rows
    });
    
    return NextResponse.json({
      success: true,
      message: 'Campus Liberdade corrigido com sucesso!',
      results,
      finalState: {
        inventoryItems: finalCheck.rows[0]?.count || 0,
        users: userFinalCheck.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Erro na correção do Campus Liberdade:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verificar status atual do Campus Liberdade
    const campusStatus = await pool.query(`
      SELECT campus, COUNT(*) as count 
      FROM inventory_items 
      WHERE campus ILIKE '%liberdade%'
      GROUP BY campus
    `);
    
    const userStatus = await pool.query(`
      SELECT username, name, campus 
      FROM users 
      WHERE campus ILIKE '%liberdade%'
    `);
    
    const phantomCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM inventory_items 
      WHERE id = 'e806ca85-2304-49f0-ac04-3cb96d026465'
    `);
    
    return NextResponse.json({
      status: 'Campus Liberdade - Status Atual',
      campus: campusStatus.rows,
      users: userStatus.rows,
      phantomItems: parseInt(phantomCheck.rows[0].count),
      needsFix: phantomCheck.rows[0].count > 0 || campusStatus.rows.some(c => c.campus !== 'Liberdade')
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao verificar status',
      message: (error as Error).message
    }, { status: 500 });
  }
}