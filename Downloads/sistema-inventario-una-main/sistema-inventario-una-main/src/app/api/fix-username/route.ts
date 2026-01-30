// Route handlers don't need 'use server' directive
import { Pool } from 'pg';
import { NextRequest } from 'next/server';

// Esta função é uma rota de API que pode ser chamada para corrigir o nome de usuário
export async function POST(request: NextRequest) {
  // Verificação de segurança - apenas administradores
  // Na produção, isso deve verificar a sessão atual

  try {
    const pool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DATABASE,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    });

    // Corrige o usuário do campus Aimorés
    await pool.query(`
      UPDATE users 
      SET username = 'aimores' 
      WHERE campus_id = (SELECT id FROM campus WHERE name = 'Aimorés')
      AND role = 'tecnico'
    `);

    // Verifica se a atualização foi bem sucedida
    const result = await pool.query(`
      SELECT u.username, u.name, c.name as campus_name
      FROM users u
      JOIN campus c ON u.campus_id = c.id
      WHERE c.name = 'Aimorés' AND u.role = 'tecnico'
    `);

    await pool.end();

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Usuário não encontrado após a atualização'
      }), { status: 404 });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Nome de usuário atualizado com sucesso para: ${result.rows[0].username}`,
      user: result.rows[0]
    }), { status: 200 });

  } catch (error: any) {
    console.error('Erro ao atualizar nome de usuário:', error);
    return new Response(JSON.stringify({
      success: false,
      message: `Erro ao atualizar nome de usuário: ${error.message || 'Erro desconhecido'}`
    }), { status: 500 });
  }
}