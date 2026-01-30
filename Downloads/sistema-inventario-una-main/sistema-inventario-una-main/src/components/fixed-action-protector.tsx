"use client"

import { useEffect } from 'react';

/**
 * PROTEÇÃO ESPECÍFICA PARA AÇÃO "MARCAR COMO FIXO"
 * Intercepta e bloqueia tentativas de marcar IDs fantasma como consertado/fixo
 */
export default function FixedActionProtector() {
  useEffect(() => {
    console.log('🛡️ [FixedProtector] Proteção de ação "Marcar como Fixo" ativada');
    
    // IDs problemáticos conhecidos
    const PHANTOM_IDS = [
      'e806ca85-2304-49f0-ac04-3cb96d026465',
      '801bbc61-fd05-4e86-bac9-d5f24335d340'
    ];
    
    // 1. INTERCEPTAR ESPECIFICAMENTE AS REQUISIÇÕES DE UPDATE ITEM
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
      
      if (init?.method === 'POST' && init?.body) {
        const bodyStr = String(init.body);
        const url = String(input);
        
        // Verificar se é uma requisição de update de item com isFixed
        if (bodyStr.includes('"isFixed"') || bodyStr.includes('isFixed')) {
          console.log('🔍 [FixedProtector] Interceptando requisição de update com isFixed');
          console.log('📍 [FixedProtector] URL:', url);
          console.log('📦 [FixedProtector] Body:', bodyStr);
          
          // Verificar se contém ID fantasma
          for (const phantomId of PHANTOM_IDS) {
            if (bodyStr.includes(phantomId)) {
              console.error('🚨 [FixedProtector] BLOQUEADO! Tentativa de marcar ID fantasma como fixo:', phantomId);
              
              // Mostrar erro personalizado ao usuário
              setTimeout(() => {
                const errorMsg = `❌ AÇÃO BLOQUEADA!\n\nO item com ID ${phantomId.substring(0, 8)}... tem um problema conhecido.\n\n🔧 SOLUÇÕES:\n1. Recarregue a página (F5)\n2. Limpe os dados: localStorage.clear()\n3. Use uma janela privada\n\nSe o problema persistir, contate o suporte.`;
                alert(errorMsg);
              }, 100);
              
              // Retornar erro específico
              return Promise.reject(new Error(`Item fantasma detectado: ${phantomId} - Esta ação foi bloqueada para proteger o sistema`));
            }
          }
        }
      }
      
      return originalFetch.call(this, input, init);
    };
    
    // 2. INTERCEPTAR CLIQUES ESPECIFICAMENTE EM BOTÕES "FIXO"
    const handleFixedButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Encontrar o botão clicado
      const button = target.closest('button') || (target.tagName === 'BUTTON' ? target : null);
      if (!button) return;
      
      // Verificar se é um botão relacionado ao campo "Fixo"
      const buttonText = button.textContent?.toLowerCase() || '';
      const buttonTitle = button.title?.toLowerCase() || '';
      const buttonClass = button.className?.toLowerCase() || '';
      
      const isFixedButton = 
        buttonText.includes('fixo') ||
        buttonTitle.includes('fixo') ||
        buttonTitle.includes('marcar como') ||
        buttonClass.includes('fixed') ||
        button.getAttribute('data-action') === 'toggle-fixed';
      
      if (isFixedButton) {
        console.log('🎯 [FixedProtector] Click em botão "Fixo" detectado');
        
        // Procurar o ID do item no contexto
        const itemContainer = button.closest('[data-item-id]');
        let itemId = itemContainer?.getAttribute('data-item-id');
        
        // Se não encontrou data-item-id, procurar em outros lugares
        if (!itemId) {
          // Procurar em elementos irmãos ou pais
          const parentRow = button.closest('tr, .item-card, .inventory-item');
          if (parentRow) {
            itemId = parentRow.getAttribute('data-id') || 
                     parentRow.getAttribute('data-item-id') ||
                     parentRow.querySelector('[data-id]')?.getAttribute('data-id');
          }
        }
        
        // Verificar conteúdo da página por IDs fantasma próximos
        if (!itemId) {
          const pageContent = document.body.innerHTML;
          for (const phantomId of PHANTOM_IDS) {
            if (pageContent.includes(phantomId)) {
              console.warn('🔍 [FixedProtector] ID fantasma encontrado na página:', phantomId);
              // Assumir que pode ser este ID se não conseguiu identificar outro
              const buttonRect = button.getBoundingClientRect();
              const elementsNearButton = document.elementsFromPoint(buttonRect.x, buttonRect.y);
              
              for (const element of elementsNearButton) {
                if (element.textContent?.includes(phantomId.substring(0, 8))) {
                  itemId = phantomId;
                  break;
                }
              }
            }
          }
        }
        
        console.log('🆔 [FixedProtector] ID identificado:', itemId);
        
        // Se o ID for fantasma, bloquear
        if (itemId && PHANTOM_IDS.includes(itemId)) {
          console.error('🚨 [FixedProtector] AÇÃO BLOQUEADA! Tentativa de alterar campo "Fixo" do ID fantasma:', itemId);
          
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          
          // Mostrar alerta específico
          const shortId = itemId.substring(0, 8);
          const alertMsg = `🚫 AÇÃO BLOQUEADA!\n\n` +
                          `O item ${shortId}... é um "item fantasma" com problemas conhecidos.\n\n` +
                          `❌ NÃO é possível alterar o campo "Fixo" deste item.\n\n` +
                          `🔧 SOLUÇÕES:\n` +
                          `• Recarregue a página (F5)\n` +
                          `• Abra uma nova janela privada\n` +
                          `• Execute: localStorage.clear()\n\n` +
                          `⚠️ Este bloqueio protege o sistema de erros 500.`;
          
          alert(alertMsg);
          
          return false;
        }
      }
    };
    
    // Adicionar listener para capturar cliques (useCapture=true para interceptar antes)
    document.addEventListener('click', handleFixedButtonClick, true);
    
    // 3. MONITORAR CONSOLE.ERROR PARA ERROS DE "MARCAR COMO FIXO"
    const originalConsoleError = console.error;
    console.error = function(...args: any[]) {
      const message = args.join(' ');
      
      if (message.includes('campo fixo') || message.includes('isFixed')) {
        console.warn('🔍 [FixedProtector] Erro relacionado ao campo "Fixo" detectado');
        
        // Verificar se é erro de ID fantasma
        for (const phantomId of PHANTOM_IDS) {
          if (message.includes(phantomId)) {
            console.warn('👻 [FixedProtector] Confirmado: erro causado por ID fantasma', phantomId);
            
            // Limpar dados automaticamente
            setTimeout(() => {
              console.log('🧹 [FixedProtector] Iniciando limpeza automática...');
              
              const inventoryData = localStorage.getItem('inventory_data');
              if (inventoryData) {
                try {
                  let inventory = JSON.parse(inventoryData);
                  if (Array.isArray(inventory)) {
                    const cleanInventory = inventory.filter(item => !PHANTOM_IDS.includes(item.id));
                    
                    if (cleanInventory.length !== inventory.length) {
                      localStorage.setItem('inventory_data', JSON.stringify(cleanInventory));
                      console.log('✅ [FixedProtector] Dados limpos, recarregando...');
                      
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ [FixedProtector] Erro na limpeza, removendo dados...');
                  localStorage.removeItem('inventory_data');
                  setTimeout(() => window.location.reload(), 1000);
                }
              }
            }, 500);
            
            break;
          }
        }
      }
      
      // Chamar função original
      originalConsoleError.apply(console, args);
    };
    
    // 4. DISPONIBILIZAR FUNÇÃO DE DIAGNÓSTICO
    (window as any).fixedProtector = {
      phantomIds: PHANTOM_IDS,
      checkForPhantoms: () => {
        console.log('🔍 [FixedProtector] Verificando IDs fantasma...');
        
        const inventoryData = localStorage.getItem('inventory_data');
        if (inventoryData) {
          try {
            const inventory = JSON.parse(inventoryData);
            const foundPhantoms = inventory.filter((item: any) => PHANTOM_IDS.includes(item.id));
            
            if (foundPhantoms.length > 0) {
              console.warn('👻 [FixedProtector] IDs fantasma encontrados:', foundPhantoms.map((item: any) => item.id));
              return foundPhantoms;
            } else {
              console.log('✅ [FixedProtector] Nenhum ID fantasma encontrado');
              return [];
            }
          } catch (e) {
            console.error('❌ [FixedProtector] Erro ao verificar dados:', e);
            return [];
          }
        }
        
        console.log('ℹ️ [FixedProtector] Nenhum dado de inventário encontrado');
        return [];
      },
      forceClean: () => {
        console.log('🧹 [FixedProtector] Forçando limpeza completa...');
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };
    
    console.log('✅ [FixedProtector] Proteção específica para campo "Fixo" ativa');
    console.log('🆔 [FixedProtector] Monitorando IDs:', PHANTOM_IDS.map(id => id.substring(0, 8) + '...'));
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleFixedButtonClick, true);
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
}