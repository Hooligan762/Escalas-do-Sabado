'use server';

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from 'limiter';

// Armazenamento em memória para limitadores de taxa
// Em produção, considere usar Redis ou outro armazenamento distribuído
const limiters = new Map<string, RateLimiter>();

// Tempo padrão de bloqueio (em milissegundos) - 15 minutos
const DEFAULT_BLOCK_DURATION = 15 * 60 * 1000;

// Configurações padrão
const DEFAULT_TOKENS = 5;       // 5 tentativas
const DEFAULT_INTERVAL = 60000; // em um intervalo de 60 segundos

interface RateLimitConfig {
  tokensPerInterval: number;   // Número de solicitações permitidas
  interval: number;            // Intervalo em milissegundos
  blockDuration?: number;      // Duração do bloqueio em milissegundos
}

interface RateLimitResult {
  success: boolean;            // Se a solicitação foi permitida
  remainingTokens: number;     // Tokens restantes
  resetTime: number;           // Timestamp para reset dos tokens
  blockedUntil?: number;       // Timestamp até quando estará bloqueado
}

/**
 * Cria um limitador de taxa para uma chave específica (IP, usuário, etc)
 */
function getLimiter(key: string, config: RateLimitConfig): RateLimiter {
  if (!limiters.has(key)) {
    limiters.set(key, new RateLimiter({
      tokensPerInterval: config.tokensPerInterval,
      interval: config.interval,
    }));
  }
  return limiters.get(key)!;
}

/**
 * Verifica se uma chave está na lista de bloqueio
 */
const blockedKeys = new Map<string, number>();

function isBlocked(key: string): boolean {
  const blockedUntil = blockedKeys.get(key);
  if (blockedUntil && Date.now() < blockedUntil) {
    return true;
  }
  if (blockedUntil) {
    blockedKeys.delete(key);
  }
  return false;
}

/**
 * Bloqueia uma chave por um período específico
 */
function blockKey(key: string, duration: number): void {
  blockedKeys.set(key, Date.now() + duration);
}

/**
 * Verifica e aplica o limite de taxa para uma chave
 */
export async function rateLimit(
  key: string,
  config: RateLimitConfig = { 
    tokensPerInterval: DEFAULT_TOKENS, 
    interval: DEFAULT_INTERVAL 
  }
): Promise<RateLimitResult> {
  // Verificar se a chave está bloqueada
  if (isBlocked(key)) {
    return {
      success: false,
      remainingTokens: 0,
      resetTime: blockedKeys.get(key)!,
      blockedUntil: blockedKeys.get(key)!
    };
  }

  // Obter o limitador para a chave
  const limiter = getLimiter(key, config);
  
  // Verificar se há tokens disponíveis
  const hasRemainingTokens = await limiter.tryRemoveTokens(1);
  
  // Se não houver tokens, bloquear a chave
  if (!hasRemainingTokens) {
    const blockDuration = config.blockDuration || DEFAULT_BLOCK_DURATION;
    blockKey(key, blockDuration);
    
    return {
      success: false,
      remainingTokens: 0,
      resetTime: Date.now() + config.interval,
      blockedUntil: Date.now() + blockDuration
    };
  }
  
  return {
    success: true,
    remainingTokens: limiter.getTokensRemaining(),
    resetTime: Date.now() + config.interval
  };
}

/**
 * Middleware de limitação de taxa para Next.js
 */
export function rateLimitMiddleware(
  config: RateLimitConfig = { 
    tokensPerInterval: DEFAULT_TOKENS, 
    interval: DEFAULT_INTERVAL 
  }
) {
  return async function(req: NextRequest) {
    // Usar o IP como chave
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Aplicar limitação de taxa
    const result = await rateLimit(ip, config);
    
    if (!result.success) {
      // 429 Too Many Requests
      return NextResponse.json(
        { 
          error: 'Muitas requisições, tente novamente mais tarde', 
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
    
    // Permitir a requisição, mas adicionar cabeçalhos de rate limit
    const response = NextResponse.next();
    
    response.headers.set('X-RateLimit-Limit', config.tokensPerInterval.toString());
    response.headers.set('X-RateLimit-Remaining', result.remainingTokens.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
    
    return response;
  };
}

// Limpeza periódica de limitadores e bloqueios antigos
function cleanupExpiredData() {
  const now = Date.now();
  
  // Limpar chaves de bloqueio expiradas
  for (const [key, expiry] of blockedKeys.entries()) {
    if (now > expiry) {
      blockedKeys.delete(key);
    }
  }
  
  // Limpar limitadores inativos (aqui poderíamos implementar uma lógica mais sofisticada)
}

// Executar limpeza a cada hora
setInterval(cleanupExpiredData, 60 * 60 * 1000);