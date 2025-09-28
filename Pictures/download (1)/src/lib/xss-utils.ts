/**
 * Utilitários síncronos para proteção contra XSS
 * Não usa 'use server' para permitir funções síncronas
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
 * Sanitiza uma string para uso seguro em atributos HTML (versão síncrona)
 */
export function sanitizeAttributeSync(input: string): string {
  if (!input) return '';
  return escapeHtmlSync(input.replace(/\s+/g, ' ').trim());
}

/**
 * Sanitiza uma URL para evitar ataques baseados em JavaScript URIs (versão síncrona)
 */
export function sanitizeUrlSync(url: string): string {
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