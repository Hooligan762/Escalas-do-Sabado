/**
 * 🛠️ CORREÇÃO EMERGENCIAL: Limpar Estado Local do Campus Liberdade
 * Remove itens fantasma do localStorage e força recarregamento dos dados
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, RefreshCw, CheckCircle } from 'lucide-react';

export default function LiberdadeEmergencyFix() {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<'idle' | 'cleaning' | 'success' | 'error'>('idle');
  const [details, setDetails] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const clearPhantomData = () => {
    setStatus('cleaning');
    setDetails([]);
    
    try {
      const keysToCheck = [
        'inventory-campus-4',
        'liberdade-inventory', 
        'campus-liberdade-data',
        'inventory-data',
        'cached-inventory',
        'local-inventory'
      ];
      
      let itemsRemoved = 0;
      const actions: string[] = [];
      
      // 1. Limpar localStorage
      keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              const originalLength = parsed.length;
              const filtered = parsed.filter((item: any) => 
                item.id !== 'e806ca85-2304-49f0-ac04-3cb96d026465'
              );
              
              if (filtered.length < originalLength) {
                localStorage.setItem(key, JSON.stringify(filtered));
                const removed = originalLength - filtered.length;
                itemsRemoved += removed;
                actions.push(`✅ Removido ${removed} item(s) fantasma de ${key}`);
              }
            }
          } catch (e) {
            // Não é JSON válido, remover completamente
            localStorage.removeItem(key);
            actions.push(`🗑️ Removida chave inválida: ${key}`);
          }
        }
      });
      
      // 2. Limpar todas as chaves relacionadas ao Campus Liberdade
      Object.keys(localStorage).forEach(key => {
        if (key.includes('liberdade') || key.includes('campus-4') || key.includes('inventory')) {
          localStorage.removeItem(key);
          actions.push(`🧹 Limpa cache: ${key}`);
        }
      });
      
      // 3. Limpar sessionStorage também
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('liberdade') || key.includes('campus-4') || key.includes('inventory')) {
          sessionStorage.removeItem(key);
          actions.push(`🧹 Limpa sessão: ${key}`);
        }
      });
      
      actions.push(`\n🎯 RESULTADO: ${itemsRemoved} itens fantasma removidos`);
      actions.push('✅ Cache local completamente limpo');
      actions.push('🔄 Dados serão recarregados do banco na próxima visita');
      
      setDetails(actions);
      setStatus('success');
      
      // Auto-refresh em 3 segundos
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      setStatus('error');
      setDetails([`❌ Erro durante limpeza: ${(error as Error).message}`]);
    }
  };

  if (!isClient) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              🚨 Correção Emergencial - Campus Liberdade
            </CardTitle>
            <CardDescription>
              Item fantasma detectado: <code>e806ca85-2304-49f0-ac04-3cb96d026465</code>
              <br />
              Este item existe no frontend mas não no banco de dados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {status === 'idle' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">🔍 Problema Detectado:</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Item existe no estado local mas não no banco</li>
                    <li>• Ao clicar em "Fixo" gera erro de Server Components</li>
                    <li>• Erro: "Item não encontrado no banco de dados"</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={clearPhantomData}
                  className="w-full bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  🛠️ Limpar Estado Local e Remover Item Fantasma
                </Button>
              </div>
            )}
            
            {status === 'cleaning' && (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
                <p className="text-lg font-medium">Limpando dados locais...</p>
                <p className="text-sm text-gray-600">Removendo itens fantasma e cache</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-700">✅ Correção Concluída!</h3>
                  <p className="text-sm text-gray-600 mt-2">Página será recarregada automaticamente...</p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-green-800 mb-2">🔍 Ações Executadas:</h4>
                  <div className="text-sm text-green-700 font-mono whitespace-pre-line">
                    {details.join('\n')}
                  </div>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">❌ Erro na Correção:</h4>
                <div className="text-sm text-red-700 font-mono">
                  {details.join('\n')}
                </div>
                <Button 
                  onClick={() => setStatus('idle')}
                  variant="outline"
                  className="mt-4"
                >
                  🔄 Tentar Novamente
                </Button>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}