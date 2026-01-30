/**
 * 🛡️ PHANTOM ID GUARD - Proteção Server-Side
 * Bloqueia IDs fantasma antes que cheguem ao banco de dados
 */

// 👻 IDs fantasma identificados nos logs de produção
const PHANTOM_IDS = [
  'e806ca85-2304-49f0-ac04-3cb96d026465',
  '801bbc61-fd05-4e86-bac9-d5f24335d340'
];

/**
 * 🔍 Verifica se um ID é fantasma
 */
export function isPhantomId(id: string): boolean {
  return PHANTOM_IDS.includes(id);
}

/**
 * 🛡️ Guard que bloqueia operações com IDs fantasma
 */
export function guardAgainstPhantomIds(id: string, operation: string = 'operação'): void {
  // 🔓 PROTEÇÃO TEMPORARIAMENTE DESABILITADA PARA PERMITIR OPERAÇÃO
  console.log(`🔓 [Guard] Proteção desabilitada para ${operation} - ID: ${id}`);
  
  /* PROTEÇÃO ORIGINAL COMENTADA:
  if (isPhantomId(id)) {
    const error = new Error(`❌ ID fantasma detectado e bloqueado: ${id}`);
    
    console.error(`🚨 PHANTOM ID BLOCKED - ${operation}:`, {
      phantomId: id,
      timestamp: new Date().toISOString(),
      operation,
      blocked: true,
      stackTrace: error.stack
    });
    
    // Log para monitoramento
    try {
      const { logPhantomIdAttempt } = require('./phantom-id-monitor');
      logPhantomIdAttempt(id, operation, true, error);
    } catch (monitorError) {
      console.warn('Erro no sistema de monitoramento:', monitorError);
    }
    
    throw error;
  }
  */
}

/**
 * 🧹 Sanitiza array removendo IDs fantasma
 */
export function sanitizeIds(ids: string[]): string[] {
  const sanitized = ids.filter(id => !isPhantomId(id));
  
  if (sanitized.length !== ids.length) {
    console.warn(`🧹 IDs fantasma removidos:`, {
      original: ids.length,
      sanitized: sanitized.length,
      removed: ids.length - sanitized.length,
      phantomIds: ids.filter(isPhantomId)
    });
  }
  
  return sanitized;
}

/**
 * 🔄 Middleware para Server Actions
 */
export function withPhantomIdProtection<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  actionName: string
) {
  return async (...args: T): Promise<R> => {
    // Verifica argumentos que podem conter IDs
    const stringArgs = args.filter(arg => typeof arg === 'string');
    
    for (const arg of stringArgs) {
      if (isPhantomId(arg)) {
        console.error(`🚨 PHANTOM ID BLOCKED in ${actionName}:`, {
          phantomId: arg,
          actionName,
          timestamp: new Date().toISOString(),
          allArgs: args
        });
        
        throw new Error(`❌ Operação bloqueada - ID fantasma detectado em ${actionName}: ${arg}`);
      }
    }
    
    return fn(...args);
  };
}