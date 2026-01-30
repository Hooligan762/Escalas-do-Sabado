
/**
 * VERIFICAÇÃO DO SERVIDOR - ITENS FANTASMA
 * Detectar problemas no backend
 */

// Verificar se há Server Actions que referenciam IDs fantasma
console.log('🔍 VERIFICANDO SERVER ACTIONS...');

// IDs problemáticos conhecidos
const PHANTOM_IDS = [
  'e806ca85-2304-49f0-ac04-3cb96d026465',
  '801bbc61-fd05-4e86-bac9-d5f24335d340'
];

// Interceptar fetch para monitorar requisições
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Log de todas as requisições POST
  if (options?.method === 'POST') {
    console.log('📡 POST Request:', url);
    
    // Verificar se body contém IDs fantasma
    if (options.body) {
      const bodyStr = options.body.toString();
      PHANTOM_IDS.forEach(phantomId => {
        if (bodyStr.includes(phantomId)) {
          console.error('👻 PHANTOM ID DETECTADO NO REQUEST:', phantomId);
          console.error('📦 Body:', bodyStr);
          
          // Bloquear requisição com ID fantasma
          return Promise.reject(new Error('Requisição bloqueada - ID fantasma detectado'));
        }
      });
    }
  }
  
  return originalFetch.apply(this, args);
};

console.log('✅ Monitor de requisições ativado');
console.log('👻 IDs fantasma monitorados:', PHANTOM_IDS.length);
