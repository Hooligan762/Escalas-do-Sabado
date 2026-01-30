import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getFullCurrentUser } from '@/lib/session';

/**
 * Middleware para proteção contra força bruta na API de login
 */
export async function middleware(request: NextRequest) {
  // Obter o IP do cliente
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Configuração mais restritiva para endpoints sensíveis
  const config = {
    tokensPerInterval: 5,    // 5 tentativas
    interval: 60 * 1000,     // em 1 minuto
    blockDuration: 15 * 60 * 1000  // bloqueio de 15 minutos após exceder
  };
  
  // Verificar rate limit para o IP
  const result = await rateLimit(`login:${ip}`, config);
  
  if (!result.success) {
    // Muitas tentativas, retornar 429 Too Many Requests
    return NextResponse.json(
      { 
        error: 'Muitas tentativas de login. Por favor, tente novamente mais tarde.',
        retryAfter: Math.ceil((result.blockedUntil! - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((result.blockedUntil! - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': config.tokensPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
        }
      }
    );
  }
  
  // Permitir a requisição, mas adicionar cabeçalhos informativos
  const response = NextResponse.next();
  
  response.headers.set('X-RateLimit-Limit', config.tokensPerInterval.toString());
  response.headers.set('X-RateLimit-Remaining', result.remainingTokens.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
  
  return response;
}

// Aplicar middleware apenas à rota POST de login
export const config = {
  matcher: '/api/login'
};