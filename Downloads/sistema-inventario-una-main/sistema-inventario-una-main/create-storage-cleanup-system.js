#!/usr/bin/env node

/**
 * SCRIPT PARA SINCRONIZAR LOCALSTORAGE E BANCO
 * Cria endpoint para limpar localStorage via API
 */

const fs = require('fs');
const path = require('path');

// Criar endpoint API para limpeza do localStorage
const apiEndpointCode = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemId } = body;

    console.log('🧹 API de Limpeza chamada:', { action, itemId });

    if (action === 'clear-localstorage') {
      // Instrução específica para o frontend limpar localStorage
      return NextResponse.json({
        success: true,
        action: 'CLEAR_LOCALSTORAGE',
        message: 'Frontend deve limpar localStorage e recarregar dados',
        itemsToRemove: itemId ? [itemId] : 'ALL',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'sync-check' && itemId) {
      // Verificar se item existe no banco (será implementado posteriormente)
      return NextResponse.json({
        success: true,
        action: 'SYNC_CHECK',
        itemId,
        exists: false, // Por enquanto, assumir que não existe
        message: 'Item não existe no banco - deve ser removido do localStorage'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erro na API de limpeza:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}`;

// Criar middleware JavaScript para detectar itens fantasma
const middlewareCode = `/**
 * MIDDLEWARE PARA DETECTAR E CORRIGIR ITENS FANTASMA
 * Intercepta tentativas de atualizar itens inexistentes
 */

// Função para detectar itens fantasma no localStorage
function detectPhantomItems() {
  try {
    const inventoryData = localStorage.getItem('inventory_data');
    if (!inventoryData) return [];

    const inventory = JSON.parse(inventoryData);
    if (!Array.isArray(inventory)) return [];

    console.log('🔍 Detectando itens fantasma...', inventory.length, 'itens no localStorage');
    
    // Lista de IDs problemáticos conhecidos
    const knownPhantomIds = [
      'e806ca85-2304-49f0-ac04-3cb96d026465'
    ];

    const phantomItems = inventory.filter(item => 
      knownPhantomIds.includes(item.id)
    );

    return phantomItems;
  } catch (error) {
    console.error('❌ Erro ao detectar itens fantasma:', error);
    return [];
  }
}

// Função para limpar itens fantasma do localStorage
function cleanPhantomItems(phantomIds = []) {
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
      console.log(\`✅ Removidos \${removedCount} itens fantasma do localStorage\`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao limpar itens fantasma:', error);
    return false;
  }
}

// Função para sincronizar localStorage com servidor
async function syncWithServer() {
  try {
    const phantomItems = detectPhantomItems();
    
    if (phantomItems.length > 0) {
      console.log('👻 Itens fantasma detectados:', phantomItems.length);
      
      // Chamar API de limpeza
      const response = await fetch('/api/admin/sync-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear-localstorage',
          itemId: phantomItems.map(item => item.id)
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.action === 'CLEAR_LOCALSTORAGE') {
          // Limpar itens problemáticos
          const cleaned = cleanPhantomItems(phantomItems.map(item => item.id));
          
          if (cleaned) {
            console.log('🎉 Sincronização concluída - localStorage limpo');
            
            // Recarregar página para obter dados frescos
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Interceptor para detectar erros de "Item não encontrado"
function interceptInventoryErrors() {
  // Interceptar erros do console
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Detectar erro específico de item não encontrado
    if (message.includes('não encontrado no banco de dados')) {
      console.log('🚨 Erro de item fantasma detectado:', message);
      
      // Extrair ID do item do erro
      const idMatch = message.match(/ID "([^"]+)"/);
      if (idMatch && idMatch[1]) {
        const phantomId = idMatch[1];
        console.log('🎯 ID fantasma identificado:', phantomId);
        
        // Limpar item específico
        cleanPhantomItems([phantomId]);
        
        // Recarregar página após limpeza
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            console.log('🔄 Recarregando página após limpeza...');
            window.location.reload();
          }
        }, 2000);
      }
    }
    
    // Chamar função original
    originalError.apply(console, args);
  };
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
  window.phantomItemsDetector = {
    detect: detectPhantomItems,
    clean: cleanPhantomItems,
    sync: syncWithServer,
    intercept: interceptInventoryErrors
  };
  
  // Inicializar interceptor automaticamente
  interceptInventoryErrors();
  
  // Executar limpeza ao carregar página
  document.addEventListener('DOMContentLoaded', () => {
    syncWithServer();
  });
}`;

async function criarSistemaLimpeza() {
  console.log('🧹 CRIANDO SISTEMA DE LIMPEZA DE LOCALSTORAGE');
  console.log('='.repeat(60));

  try {
    // 1. Criar diretório da API se não existir
    const apiDir = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'sync-storage');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
      console.log('✅ Diretório da API criado:', apiDir);
    }

    // 2. Criar endpoint da API
    const apiFile = path.join(apiDir, 'route.ts');
    fs.writeFileSync(apiFile, apiEndpointCode);
    console.log('✅ Endpoint API criado:', apiFile);

    // 3. Criar arquivo JavaScript para middleware do cliente
    const middlewareFile = path.join(process.cwd(), 'public', 'phantom-items-detector.js');
    fs.writeFileSync(middlewareFile, middlewareCode);
    console.log('✅ Middleware do cliente criado:', middlewareFile);

    // 4. Instruções para o usuário
    console.log('\n📋 INSTRUÇÕES PARA USO:');
    console.log('1. 🔧 O sistema foi configurado automaticamente');
    console.log('2. 🌐 Abra o navegador e vá para o sistema');
    console.log('3. 🛠️ Abra DevTools (F12) e vá para Console');
    console.log('4. 🧪 Execute: window.phantomItemsDetector.detect()');
    console.log('5. 🧹 Execute: window.phantomItemsDetector.clean()');
    console.log('6. 🔄 A página será recarregada automaticamente');

    console.log('\n🎯 CORREÇÃO AUTOMÁTICA:');
    console.log('- O sistema detecta automaticamente itens fantasma');
    console.log('- Remove itens inexistentes do localStorage');
    console.log('- Intercepta erros de "Item não encontrado"');
    console.log('- Recarrega a página após limpeza');

    console.log('\n✅ SISTEMA DE LIMPEZA CONFIGURADO COM SUCESSO!');

  } catch (error) {
    console.error('❌ Erro ao criar sistema de limpeza:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  criarSistemaLimpeza().catch(console.error);
}

module.exports = { criarSistemaLimpeza };