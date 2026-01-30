"use client"

import { useEffect } from 'react';

/**
 * BLOQUEADOR AGRESSIVO DE IDS FANTASMA
 * Intercepta e bloqueia TODAS as tentativas de usar IDs problemáticos
 */
export default function PhantomIdBlocker() {
  useEffect(() => {
    console.log('🛡️ [PhantomBlocker] Sistema de bloqueio agressivo ativado');
    
    // IDs que devem ser COMPLETAMENTE bloqueados
    const BLOCKED_IDS = [
      'e806ca85-2304-49f0-ac04-3cb96d026465',
      '801bbc61-fd05-4e86-bac9-d5f24335d340'
    ];
    
    // 1. INTERCEPTAR TODAS AS REQUISIÇÕES FETCH
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      
      if (init?.method === 'POST' && init?.body) {
        const bodyStr = String(init.body);
        
        // Verificar se contém ID bloqueado
        for (const blockedId of BLOCKED_IDS) {
          if (bodyStr.includes(blockedId)) {
            console.error('🚨 [PhantomBlocker] REQUISIÇÃO BLOQUEADA - ID fantasma detectado:', blockedId);
            console.error('📦 [PhantomBlocker] Body da requisição:', bodyStr);
            
            // Retornar erro imediatamente em vez de enviar para servidor
            return Promise.reject(new Error('Requisição bloqueada - ID fantasma detectado: ' + blockedId));
          }
        }
      }
      
      return originalFetch.call(this, input, init);
    };
    
    // 2. INTERCEPTAR CLICKS EM BOTÕES
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Verificar se é um botão relacionado a itens
      if (target?.tagName === 'BUTTON' || target?.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        const buttonText = button?.textContent?.toLowerCase() || '';
        
        // Botões perigosos que podem tentar atualizar itens
        const dangerousButtons = [
          'marcar como consertado',
          'consertado',
          'salvar',
          'atualizar',
          'editar',
          'update'
        ];
        
        if (dangerousButtons.some(dangerous => buttonText.includes(dangerous))) {
          // Verificar se estamos em contexto de item problemático
          const itemContainer = button?.closest('[data-item-id]');
          const itemId = itemContainer?.getAttribute('data-item-id');
          
          if (itemId && BLOCKED_IDS.includes(itemId)) {
            console.error('🚨 [PhantomBlocker] AÇÃO BLOQUEADA - Tentativa de interagir com ID fantasma:', itemId);
            
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            
            // Mostrar alerta ao usuário
            alert('❌ AÇÃO BLOQUEADA!\n\nEste item tem um problema conhecido e não pode ser atualizado.\n\nPor favor:\n1. Recarregue a página\n2. Use uma nova janela privada\n3. Entre em contato com o suporte se o problema persistir');
            
            return false;
          }
        }
      }
    };
    
    // Adicionar listener para capturar clicks
    document.addEventListener('click', handleClick, true);
    
    // 3. MONITORAR E LIMPAR DADOS CORROMPIDOS CONTINUAMENTE
    const cleanupIntervalId = setInterval(() => {
      try {
        const inventoryData = localStorage.getItem('inventory_data');
        if (inventoryData) {
          const inventory = JSON.parse(inventoryData);
          if (Array.isArray(inventory)) {
            
            const originalLength = inventory.length;
            const cleanInventory = inventory.filter(item => !BLOCKED_IDS.includes(item.id));
            
            if (cleanInventory.length !== originalLength) {
              localStorage.setItem('inventory_data', JSON.stringify(cleanInventory));
              console.log(`🧹 [PhantomBlocker] Limpeza automática: ${originalLength - cleanInventory.length} itens fantasma removidos`);
              
              // Recarregar página após limpeza
              setTimeout(() => {
                console.log('🔄 [PhantomBlocker] Recarregando página após limpeza...');
                window.location.reload();
              }, 2000);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ [PhantomBlocker] Erro na limpeza automática:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    // 4. INTERCEPTAR CONSOLE.ERROR PARA DETECTAR NOVOS PROBLEMAS
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      const message = args.join(' ');
      
      // Detectar novos IDs fantasma nos erros
      if (message.includes('não encontrado no banco de dados')) {
        const idMatch = message.match(/ID[:\s]+"?([a-f0-9-]{36})"?/i);
        if (idMatch && idMatch[1] && !BLOCKED_IDS.includes(idMatch[1])) {
          console.warn('👻 [PhantomBlocker] NOVO ID FANTASMA DETECTADO:', idMatch[1]);
          // Adicionar à lista de bloqueados
          BLOCKED_IDS.push(idMatch[1]);
        }
      }
      
      // Chamar função original
      originalConsoleError.apply(console, args);
    };
    
    // 5. DISPONIBILIZAR FUNÇÕES GLOBALMENTE PARA DEBUG
    (window as any).phantomBlocker = {
      blockedIds: BLOCKED_IDS,
      addBlockedId: (id: string) => {
        if (!BLOCKED_IDS.includes(id)) {
          BLOCKED_IDS.push(id);
          console.log('🚫 [PhantomBlocker] ID adicionado à lista de bloqueio:', id);
        }
      },
      removeBlockedId: (id: string) => {
        const index = BLOCKED_IDS.indexOf(id);
        if (index > -1) {
          BLOCKED_IDS.splice(index, 1);
          console.log('✅ [PhantomBlocker] ID removido da lista de bloqueio:', id);
        }
      },
      forceCleanup: () => {
        console.log('🧹 [PhantomBlocker] Forçando limpeza completa...');
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };
    
    console.log('🛡️ [PhantomBlocker] Sistema totalmente ativo:');
    console.log('  • Fetch interceptado ✅');
    console.log('  • Clicks bloqueados ✅');  
    console.log('  • Limpeza automática ✅');
    console.log('  • Detecção de novos IDs ✅');
    console.log('  • IDs bloqueados:', BLOCKED_IDS.length);
    
    // Cleanup
    return () => {
      clearInterval(cleanupIntervalId);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
}