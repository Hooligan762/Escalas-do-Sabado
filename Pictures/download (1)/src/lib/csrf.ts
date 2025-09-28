'use server';

import { NextRequest } from 'next/server';
import * as crypto from 'crypto';

// Implementação simplificada de tokens CSRF sem dependências externas
const SECRET_KEY = process.env.CSRF_SECRET || 'secretcryptographickey12345678';

// Função para criar um token CSRF
function createToken(secret: string): string {
  const timestamp = Date.now().toString();
  const hash = crypto.createHmac('sha256', secret)
    .update(timestamp)
    .digest('hex');
  return `${timestamp}.${hash}`;
}

// Função para verificar um token CSRF
function verifyToken(secret: string, token: string): boolean {
  try {
    const [timestamp, hash] = token.split('.');
    
    // Verificar se o token tem o formato correto
    if (!timestamp || !hash) {
      return false;
    }
    
    // Recalcular o hash para verificar
    const expectedHash = crypto.createHmac('sha256', secret)
      .update(timestamp)
      .digest('hex');
    
    return hash === expectedHash;
  } catch (err) {
    return false;
  }
}

// Armazenamento de tokens para validação
const tokenCache = new Map<string, { token: string, expires: number }>();

/**
 * Gera um token CSRF para um usuário específico
 */
export async function generateCsrfToken(userId: string): Promise<string> {
  // Gerar um token com validade de 2 horas
  const token = createToken(SECRET_KEY);
  const expires = Date.now() + 2 * 60 * 60 * 1000; // 2 horas
  
  // Armazenar o token com data de expiração
  tokenCache.set(userId, { token, expires });
  
  return token;
}

/**
 * Verifica se um token CSRF é válido
 */
export async function verifyCsrfToken(userId: string, token: string): Promise<boolean> {
  const storedData = tokenCache.get(userId);
  
  // Verificar se o token existe e não expirou
  if (!storedData || Date.now() > storedData.expires) {
    return false;
  }
  
  // Verificar se o token é válido
  return verifyToken(SECRET_KEY, token);
}

/**
 * Middleware para verificar token CSRF em requisições
 */
export async function csrfProtection(handler: Function) {
  return async (req: NextRequest, ...args: any[]) => {
    // Obter o token do cabeçalho ou do cookie
    const token = req.headers.get('X-CSRF-Token') || 
                 req.cookies.get('csrfToken')?.value;
    
    // Obter o ID do usuário da sessão
    const userId = req.cookies.get('inventory_session')?.value;
    
    if (!userId) {
      return { error: 'Usuário não autenticado' };
    }
    
    if (!token || !await verifyCsrfToken(userId, token)) {
      return { error: 'Token CSRF inválido ou expirado' };
    }
    
    // Se o token for válido, continuar com o handler
    return handler(req, ...args);
  };
}

// Função para limpar tokens expirados periodicamente
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [userId, data] of tokenCache.entries()) {
    if (now > data.expires) {
      tokenCache.delete(userId);
    }
  }
}

// Executar limpeza a cada hora
setInterval(cleanupExpiredTokens, 60 * 60 * 1000);