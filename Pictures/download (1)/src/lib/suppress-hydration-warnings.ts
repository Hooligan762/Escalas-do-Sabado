/**
 * Configuração global para suprimir avisos de hidratação causados por extensões do navegador
 */

// Função para suprimir avisos específicos
export function suppressHydrationWarnings() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  // Lista de padrões de mensagens para suprimir
  const suppressPatterns = [
    'bis_skin_checked',
    'Hydration failed',
    'server rendered HTML',
    'client properties',
    'browser extension',
    'A tree hydrated but some attributes',
    'This won\'t be patched up'
  ];

  // Função para verificar se deve suprimir
  const shouldSuppress = (message: string) => {
    return suppressPatterns.some(pattern => message.includes(pattern));
  };

  // Substituir console.error
  console.error = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalError.apply(console, args);
    }
  };

  // Substituir console.warn
  console.warn = (...args) => {
    const message = args.join(' ');
    if (!shouldSuppress(message)) {
      originalWarn.apply(console, args);
    }
  };

  // Restaurar funções originais após 10 segundos (para não interferir com outros erros)
  setTimeout(() => {
    console.error = originalError;
    console.warn = originalWarn;
  }, 10000);
}

// Auto-executar quando o arquivo for importado
if (typeof window !== 'undefined') {
  suppressHydrationWarnings();
}