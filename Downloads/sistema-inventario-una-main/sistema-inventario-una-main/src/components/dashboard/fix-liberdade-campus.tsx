/**
 * 🛠️ COMPONENTE PARA CORREÇÃO DO CAMPUS LIBERDADE
 * Interface amigável baseada na solução do Aimores
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface FixResult {
  success: boolean;
  message: string;
  results?: string[];
  finalState?: {
    inventoryItems: number;
    users: number;
  };
}

export default function FixLiberdadeCampus() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'fixing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<FixResult | null>(null);

  const checkLiberdadeStatus = async () => {
    setIsLoading(true);
    setStatus('checking');
    
    try {
      const response = await fetch('/api/fix-liberdade', {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Status Verificado',
          description: `Campus: ${data.campus?.length || 0} variações, Itens fantasma: ${data.phantomItems}`,
        });
        
        console.log('📊 Status do Campus Liberdade:', data);
        setStatus('idle');
      } else {
        throw new Error(data.message || 'Erro ao verificar status');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error);
      toast({
        title: 'Erro na Verificação',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fixLiberdade = async () => {
    setIsLoading(true);
    setStatus('fixing');
    
    try {
      const response = await fetch('/api/fix-liberdade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data: FixResult = await response.json();
      
      if (data.success) {
        setResult(data);
        setStatus('success');
        
        toast({
          title: '✅ Campus Liberdade Corrigido!',
          description: `${data.results?.length || 0} operações realizadas com sucesso`,
          duration: 5000,
        });
        
        console.log('🎉 Correção concluída:', data);
        
        // Recarregar a página após 3 segundos
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        
      } else {
        throw new Error(data.message || 'Erro na correção');
      }
    } catch (error) {
      console.error('❌ Erro na correção:', error);
      setStatus('error');
      
      toast({
        title: 'Erro na Correção',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-500" />
          <div>
            <CardTitle className="text-xl">Correção Campus Liberdade</CardTitle>
            <CardDescription>
              Ferramenta específica para corrigir problemas no Campus Liberdade
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {status === 'idle' && <Badge variant="secondary">Pronto</Badge>}
          {status === 'checking' && <Badge variant="default">Verificando...</Badge>}
          {status === 'fixing' && <Badge variant="default">Corrigindo...</Badge>}
          {status === 'success' && <Badge variant="default" className="bg-green-500">Concluído</Badge>}
          {status === 'error' && <Badge variant="destructive">Erro</Badge>}
        </div>

        {/* Descrição do Problema */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Problemas Identificados:</h4>
              <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                <li>• ID fantasma causando erro 500 no campo "Fixo"</li>
                <li>• Possível inconsistência no nome do campus</li>
                <li>• Dados corrompidos no localStorage</li>
                <li>• Referências órfãs no banco de dados</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ações Disponíveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={checkLiberdadeStatus}
            disabled={isLoading}
          >
            {status === 'checking' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar Status
          </Button>
          
          <Button
            onClick={fixLiberdade}
            disabled={isLoading}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            {status === 'fixing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            🛠️ Corrigir Agora
          </Button>
        </div>

        {/* Resultado da Correção */}
        {result && status === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Correção Concluída!</h4>
                <p className="text-sm text-green-700 mt-1">{result.message}</p>
                
                {result.results && result.results.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-green-800">Operações realizadas:</p>
                    <ul className="mt-1 text-xs text-green-700 space-y-1">
                      {result.results.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {result.finalState && (
                  <div className="mt-3 text-sm text-green-700">
                    <strong>Estado Final:</strong> {result.finalState.inventoryItems} itens de inventário, {result.finalState.users} usuários
                  </div>
                )}
                
                <div className="mt-3 text-xs text-green-600">
                  A página será recarregada automaticamente em alguns segundos...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aviso */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
          <strong>Nota:</strong> Esta correção é baseada na solução que funcionou para o Campus Aimores. 
          Ela irá padronizar nomes, remover IDs fantasma e limpar dados corrompidos.
        </div>
      </CardContent>
    </Card>
  );
}