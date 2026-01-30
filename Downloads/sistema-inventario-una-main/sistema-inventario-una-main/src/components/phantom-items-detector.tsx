"use client"

import { useEffect } from 'react';

/**
 * Componente para detectar e corrigir itens fantasma no localStorage
 * Deve ser incluído no layout principal da aplicação
 */
export default function PhantomItemsDetector() {
  useEffect(() => {
    // Função para detectar itens fantasma no localStorage
    const detectPhantomItems = () => {
      try {
        const inventoryData = localStorage.getItem('inventory_data');
        if (!inventoryData) return [];

        const inventory = JSON.parse(inventoryData);
        if (!Array.isArray(inventory)) return [];

        console.log('🔍 [PhantomDetector] Verificando', inventory.length, 'itens no localStorage');
        
        // Lista de IDs problemáticos conhecidos (expandida para todos os campus)
        const knownPhantomIds = [
          'e806ca85-2304-49f0-ac04-3cb96d026465', // Campus Liberdade  
          '801bbc61-fd05-4e86-bac9-d5f24335d340', // Segundo ID fantasma detectado
        ];

        // Detectar IDs inválidos automaticamente
        const invalidIds = inventory.filter(item => {
          // Verificar se ID tem formato UUID válido
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return !item.id || !uuidRegex.test(item.id) || item.id.length !== 36;
        });

        // Detectar itens com dados incompletos
        const incompleteItems = inventory.filter(item => {
          return !item.campus || !item.category || !item.setor || 
                 item.campus === 'undefined' || item.category === 'undefined';
        });

        // Combinar todos os tipos de problemas
        const allPhantomItems = [
          ...inventory.filter(item => knownPhantomIds.includes(item.id)),
          ...invalidIds,
          ...incompleteItems
        ];

        // Remover duplicatas baseado no ID
        const uniquePhantomItems = allPhantomItems.filter((item, index, arr) => 
          arr.findIndex(i => i.id === item.id) === index
        );

        if (uniquePhantomItems.length > 0) {
          console.log('👻 [PhantomDetector] Itens problemáticos encontrados:', uniquePhantomItems.length);
          uniquePhantomItems.forEach(item => {
            const problema = knownPhantomIds.includes(item.id) ? 'ID_CONHECIDO' : 
                           !item.id || !item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? 'ID_INVÁLIDO' :
                           (!item.campus || !item.category) ? 'DADOS_INCOMPLETOS' : 'OUTRO';
            console.log(`  - ${item.id || 'NULL'}: ${problema} (${item.category || 'N/A'} - ${item.campus || 'N/A'})`);
          });
        }

        return uniquePhantomItems;
      } catch (error) {
        console.error('❌ [PhantomDetector] Erro ao detectar itens fantasma:', error);
        return [];
      }
    };

    // Função para limpar itens fantasma do localStorage
    const cleanPhantomItems = (phantomIds: string[] = []) => {
      try {
        const inventoryData = localStorage.getItem('inventory_data');
        if (!inventoryData) return false;

        let inventory = JSON.parse(inventoryData);
        if (!Array.isArray(inventory)) return false;

        const originalLength = inventory.length;
        
        // Remover itens fantasma
        inventory = inventory.filter(item => 
          !phantomIds.includes(item.id)
        );

        const removedCount = originalLength - inventory.length;
        
        if (removedCount > 0) {
          localStorage.setItem('inventory_data', JSON.stringify(inventory));
          console.log(`✅ [PhantomDetector] Removidos ${removedCount} itens fantasma do localStorage`);
          return true;
        }

        return false;
      } catch (error) {
        console.error('❌ [PhantomDetector] Erro ao limpar itens fantasma:', error);
        return false;
      }
    };

    // Interceptor para detectar erros de "Item não encontrado"
    const interceptInventoryErrors = () => {
      const originalError = console.error;
      console.error = function(...args: any[]) {
        const message = args.join(' ');
        
        // Detectar erro específico de item não encontrado
        if (message.includes('não encontrado no banco de dados')) {
          console.log('🚨 [PhantomDetector] Erro de item fantasma detectado');
          
          // Extrair ID do item do erro
          const idMatch = message.match(/ID "([^"]+)"/);
          if (idMatch && idMatch[1]) {
            const phantomId = idMatch[1];
            console.log('🎯 [PhantomDetector] ID fantasma identificado:', phantomId);
            
            // Limpar item específico
            const cleaned = cleanPhantomItems([phantomId]);
            
            if (cleaned) {
              // Recarregar página após limpeza
              setTimeout(() => {
                console.log('🔄 [PhantomDetector] Recarregando página após limpeza...');
                window.location.reload();
              }, 2000);
            }
          }
        }
        
        // Chamar função original
        originalError.apply(console, args);
      };
    };

    // Função para sincronizar localStorage com servidor
    const syncWithServer = async () => {
      try {
        const phantomItems = detectPhantomItems();
        
        if (phantomItems.length > 0) {
          console.log('👻 [PhantomDetector] Iniciando limpeza para', phantomItems.length, 'itens problemáticos');
          
          // Mostrar resumo dos problemas
          const knownIds = ['e806ca85-2304-49f0-ac04-3cb96d026465'];
          const problemas = {
            ids_conhecidos: phantomItems.filter(item => knownIds.includes(item.id)).length,
            ids_invalidos: phantomItems.filter(item => !item.id || !item.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)).length,
            dados_incompletos: phantomItems.filter(item => !item.campus || !item.category).length
          };
          
          console.log('📊 [PhantomDetector] Tipos de problemas:', problemas);
          
          // Limpar TODOS os dados para garantir sincronia
          console.log('🧹 [PhantomDetector] Executando limpeza completa...');
          localStorage.removeItem('inventory_data');
          localStorage.removeItem('user_data'); 
          localStorage.removeItem('campus_data');
          localStorage.removeItem('categories_data');
          localStorage.removeItem('sectors_data');
          
          // Limpar sessionStorage também
          sessionStorage.clear();
          
          console.log('🎉 [PhantomDetector] Limpeza completa realizada');
          
          // Mostrar notificação para o usuário
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Sistema de Inventário - Correção Automática', {
              body: `Corrigidos ${phantomItems.length} problemas. Recarregando página...`,
              icon: '/favicon.svg'
            });
          }
          
          // Recarregar página para obter dados frescos
          setTimeout(() => {
            console.log('🔄 [PhantomDetector] Recarregando página...');
            window.location.reload();
          }, 2000);
          
        } else {
          console.log('✅ [PhantomDetector] Todos os dados estão sincronizados');
        }
      } catch (error) {
        console.error('❌ [PhantomDetector] Erro na sincronização:', error);
        
        // Em caso de erro, fazer limpeza de emergência
        console.log('🚨 [PhantomDetector] Executando limpeza de emergência...');
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => window.location.reload(), 1000);
      }
    };

    // Inicializar sistema
    console.log('🔧 [PhantomDetector] Inicializando sistema de detecção...');
    
    // Interceptar erros
    interceptInventoryErrors();
    
    // Executar verificação inicial após um breve delay
    const initialCheck = setTimeout(() => {
      syncWithServer();
    }, 3000);

    // Verificar periodicamente (a cada 30 segundos)
    const periodicCheck = setInterval(() => {
      const phantomItems = detectPhantomItems();
      if (phantomItems.length > 0) {
        console.log('⏰ [PhantomDetector] Verificação periódica - encontrados itens fantasma');
        syncWithServer();
      }
    }, 30000);

    // Disponibilizar funções globalmente para debug
    (window as any).phantomItemsDetector = {
      detect: detectPhantomItems,
      clean: cleanPhantomItems,
      sync: syncWithServer
    };

    // Cleanup
    return () => {
      clearTimeout(initialCheck);
      clearInterval(periodicCheck);
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
}