/**
 * 🛠️ SOLUÇÃO DIRETA CAMPUS LIBERDADE
 * Remove o item fantasma diretamente do banco (igual ao Aimores)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function POST() {
  try {
    console.log('🛠️ APLICANDO SOLUÇÃO DIRETA CAMPUS LIBERDADE...');
    
    // SOLUÇÃO SIMPLES: Remover o item fantasma específico (igual ao Aimores)
    const deleteResult = await pool.query(`
      DELETE FROM inventory_items 
      WHERE id = 'e806ca85-2304-49f0-ac04-3cb96d026465'
    `);
    
    console.log(`✅ ${deleteResult.rowCount} item(s) fantasma removido(s)`);
    
    // Limpar logs relacionados
    const auditCleanup = await pool.query(`
      DELETE FROM audit_log 
      WHERE item_id = 'e806ca85-2304-49f0-ac04-3cb96d026465'
    `);
    
    console.log(`📝 ${auditCleanup.rowCount} logs limpos`);
    
    return NextResponse.json({
      success: true,
      message: 'Item fantasma removido com sucesso!',
      itemsRemoved: deleteResult.rowCount,
      logsRemoved: auditCleanup.rowCount
    });

  } catch (error) {
    console.error('❌ Erro na correção simples:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno',
      message: (error as Error).message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'API Simple Fix ativa',
    target: 'Remover ID fantasma e806ca85-2304-49f0-ac04-3cb96d026465'
  });
}