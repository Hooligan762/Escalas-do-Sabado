'use server';

/**
 * Utilitário para proteção contra ataques XSS (Cross-Site Scripting)
 */

/**
 * Escapa caracteres especiais para prevenir XSS (versão síncrona)
 */
export function escapeHtmlSync(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitiza uma string para uso seguro em HTML (versão síncrona)
 */
export function sanitizeHtmlSync(input: string): string {
  if (!input) return '';
  return escapeHtmlSync(input);
}

/**
 * Escapa caracteres especiais para prevenir XSS
 */
export async function escapeHtml(unsafe: string): Promise<string> {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitiza uma string para uso seguro em HTML
 */
export async function sanitizeHtml(input: string): Promise<string> {
  if (!input) return '';
  return escapeHtml(input);
}

/**
 * Sanitiza uma string para uso seguro em atributos HTML
 */
export async function sanitizeAttribute(input: string): Promise<string> {
  if (!input) return '';
  return escapeHtml(input.replace(/\s+/g, ' ').trim());
}

/**
 * Sanitiza uma URL para evitar ataques baseados em JavaScript URIs
 */
export async function sanitizeUrl(url: string): Promise<string> {
  if (!url) return '#';
  
  // Verificar se a URL começa com um esquema permitido
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  
  try {
    const parsedUrl = new URL(url);
    
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return '#';  // URL inválida, retornar âncora vazia
    }
    
    return url;
  } catch (e) {
    // Se não conseguir analisar a URL, verificar se é um caminho relativo
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;  // Caminhos relativos são permitidos
    }
    
    return '#';  // URL inválida, retornar âncora vazia
  }
}

/**
 * HOC para sanitizar automaticamente objetos
 * Use com moderação, pois pode causar problemas com objetos complexos
 */
export async function sanitizeObject<T extends Record<string, any>>(obj: T): Promise<T> {
  const result = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // @ts-ignore
      result[key] = await sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // @ts-ignore
      result[key] = await sanitizeObject(value);
    } else {
      // @ts-ignore
      result[key] = value;
    }
  }
  
  return result;
}