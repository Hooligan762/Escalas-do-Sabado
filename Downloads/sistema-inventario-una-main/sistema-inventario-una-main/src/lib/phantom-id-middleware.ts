/**
 * 🛡️ PHANTOM ID BLOCKER - Middleware Global de Proteção
 * Intercepta e bloqueia requisições com IDs fantasma ANTES de chegarem aos handlers
 */

import { NextRequest, NextResponse } from 'next/server';

// 👻 IDs fantasma identificados nos logs de produção
const PHANTOM_IDS = [
  'e806ca85-2304-49f0-ac04-3cb96d026465',
  '801bbc61-fd05-4e86-bac9-d5f24335d340'
];

/**
 * 🔍 Verifica se há IDs fantasma na requisição
 */
function hasPhantomIds(request: NextRequest): { found: boolean; phantomIds: string[] } {
  const phantomIds: string[] = [];
  
  // Verificar URL params
  const url = new URL(request.url);
  url.searchParams.forEach((value, key) => {
    if (PHANTOM_IDS.includes(value)) {
      phantomIds.push(value);
    }
  });
  
  // Verificar pathname
  const pathname = url.pathname;
  PHANTOM_IDS.forEach(phantomId => {
    if (pathname.includes(phantomId)) {
      phantomIds.push(phantomId);
    }
  });
  
  return {
    found: phantomIds.length > 0,
    phantomIds: [...new Set(phantomIds)]
  };
}

/**
 * 🛡️ Middleware para bloquear requisições com IDs fantasma
 */
export async function phantomIdBlockerMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { found, phantomIds } = hasPhantomIds(request);
  
  if (found) {
    console.error('🚨 PHANTOM ID REQUEST BLOCKED:', {
      url: request.url,
      method: request.method,
      phantomIds,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    });
    
    return new NextResponse(
      JSON.stringify({
        error: 'ID Fantasma Detectado',
        message: `Requisição bloqueada - IDs fantasma detectados: ${phantomIds.join(', ')}`,
        blocked: true,
        phantomIds,
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Phantom-Block': 'true'
        }
      }
    );
  }
  
  return null; // Continuar com a requisição
}

/**
 * 🧹 Middleware para sanitizar body de requisições POST/PUT
 */
export async function sanitizeRequestBody(request: NextRequest): Promise<NextRequest> {
  if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return request;
  }
  
  try {
    const body = await request.json();
    let sanitized = false;
    
    // Função recursiva para limpar objeto
    function cleanObject(obj: any): any {
      if (typeof obj === 'string') {
        if (PHANTOM_IDS.includes(obj)) {
          sanitized = true;
          return null;
        }
        return obj;
      }
      
      if (Array.isArray(obj)) {
        const cleaned = obj.map(cleanObject).filter(item => item !== null);
        if (cleaned.length !== obj.length) sanitized = true;
        return cleaned;
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'id' && typeof value === 'string' && PHANTOM_IDS.includes(value)) {
            sanitized = true;
            continue;
          }
          cleaned[key] = cleanObject(value);
        }
        return cleaned;
      }
      
      return obj;
    }
    
    if (sanitized) {
      console.warn('🧹 REQUEST BODY SANITIZED:', {
        url: request.url,
        originalBody: body,
        timestamp: new Date().toISOString()
      });
    }
    
    const cleanedBody = cleanObject(body);
    
    // Criar nova request com body limpo
    return new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(cleanedBody),
    });
    
  } catch (error) {
    // Se não conseguir parsear o JSON, continuar com request original
    return request;
  }
}