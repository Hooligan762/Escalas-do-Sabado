import { NextResponse } from 'next/server';
import { getSessionUsername } from '@/lib/session';
import { generateCsrfToken } from '@/lib/csrf';

/**
 * Endpoint para gerar tokens CSRF
 */
export async function GET() {
  try {
    // Obter o nome de usuário da sessão atual
    const username = await getSessionUsername();
    
    if (!username) {
      return NextResponse.json(
        { success: false, message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Gerar token CSRF para o usuário
    const token = await generateCsrfToken(username);
    
    // Retornar o token
    return NextResponse.json({ token });
    
  } catch (error: any) {
    console.error('Erro ao gerar token CSRF:', error);
    return NextResponse.json(
      { success: false, message: `Erro: ${error.message}` },
      { status: 500 }
    );
  }
}