"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function FixUsername() {
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    user?: { username: string; name: string; campus_name: string };
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFixUsername = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/fix-username', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Erro ao fazer a requisição: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-background">
      <h2 className="text-lg font-semibold mb-4">Corrigir Nome de Usuário para Campus Aimorés</h2>
      
      <p className="mb-4 text-sm text-muted-foreground">
        Este botão irá corrigir o nome de usuário do técnico do campus Aimorés, mudando de "aimors" para "aimores".
      </p>
      
      <Button 
        onClick={handleFixUsername} 
        disabled={loading}
        className="mb-4"
      >
        {loading ? "Corrigindo..." : "Corrigir Nome de Usuário"}
      </Button>
      
      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? 
            <CheckCircle className="h-4 w-4" /> :
            <AlertCircle className="h-4 w-4" />
          }
          <AlertTitle>{result.success ? "Sucesso!" : "Erro"}</AlertTitle>
          <AlertDescription className="text-sm">
            {result.message}
            {result.user && (
              <div className="mt-2 p-2 bg-muted rounded-md text-xs">
                <p><strong>Campus:</strong> {result.user.campus_name}</p>
                <p><strong>Login:</strong> {result.user.username}</p>
                <p><strong>Nome:</strong> {result.user.name}</p>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}