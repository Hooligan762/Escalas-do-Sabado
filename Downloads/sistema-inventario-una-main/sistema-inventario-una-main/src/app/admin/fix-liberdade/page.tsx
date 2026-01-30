/**
 * 🛠️ PÁGINA ADMINISTRATIVA PARA CORREÇÃO DO CAMPUS LIBERDADE
 * Baseada na estrutura do fix-username que funcionou para Aimores
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MapPin, Users, Package } from 'lucide-react';
import FixLiberdadeCampus from '@/components/dashboard/fix-liberdade-campus';

export default function FixLiberdadePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛠️ Correção Campus Liberdade
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ferramenta especializada para corrigir problemas específicos do Campus Liberdade, 
            baseada na solução que funcionou para o Campus Aimores.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campus Status</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Liberdade</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Problema Detectado
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problema Principal</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">ID Fantasma</div>
              <p className="text-xs text-muted-foreground mt-2">
                Campo "Fixo" gerando erro 500
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solução</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Testada</div>
              <p className="text-xs text-muted-foreground mt-2">
                Baseada no sucesso do Aimores
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Problema Detalhado */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Diagnóstico do Problema
            </CardTitle>
            <CardDescription className="text-orange-700">
              Análise baseada nos logs fornecidos e na experiência com Campus Aimores
            </CardDescription>
          </CardHeader>
          <CardContent className="text-orange-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🚨 Sintomas Observados:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Toast "Item Fantasma Detectado!" aparece</li>
                  <li>• Campo "Fixo" não responde ao clique</li>
                  <li>• ID fantasma: e806ca85-2304-49f0-ac04-3cb96d026465</li>
                  <li>• Erro 500 no updateInventoryItem</li>
                  <li>• 6 tentativas repetidas no servidor</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">✅ Solução Comprovada:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Remover IDs fantasma do banco</li>
                  <li>• Padronizar nome do campus</li>
                  <li>• Limpar dados corrompidos</li>
                  <li>• Corrigir referências órfãs</li>
                  <li>• Atualizar logs de auditoria</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Componente de Correção */}
        <FixLiberdadeCampus />

        {/* Informações Técnicas */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Informações Técnicas</CardTitle>
            <CardDescription>
              Detalhes sobre a correção que será aplicada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Operações SQL:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• UPDATE inventory_items SET campus = 'Liberdade'</li>
                  <li>• UPDATE users SET username = 'liberdade'</li>
                  <li>• DELETE FROM inventory_items WHERE id = 'fantasma'</li>
                  <li>• INSERT INTO campus ON CONFLICT UPDATE</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Verificações:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Padronização de nomes de campus</li>
                  <li>• Limpeza de IDs fantasma</li>
                  <li>• Correção de usuários</li>
                  <li>• Verificação final de integridade</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-gray-500">
          <p>
            🔧 Correção Campus Liberdade • Baseada na solução do Campus Aimores • 
            Sistema UNA Inventário 2025
          </p>
        </div>
      </div>
    </div>
  );
}