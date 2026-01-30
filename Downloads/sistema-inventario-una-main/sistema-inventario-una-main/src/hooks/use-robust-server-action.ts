'use client';

import { useState, useCallback } from 'react';

interface UseRobustServerActionOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, attemptNumber: number) => void;
  onSuccess?: () => void;
}

export function useRobustServerAction<T extends any[], R>(
  serverAction: (...args: T) => Promise<R>,
  options: UseRobustServerActionOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onError,
    onSuccess
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const executeWithRetry = useCallback(async (...args: T): Promise<R> => {
    setIsLoading(true);
    setError(null);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentativa ${attempt}/${maxRetries} de executar server action`);

        const result = await serverAction(...args);

        console.log(`✅ Server action executada com sucesso na tentativa ${attempt}`);
        setIsLoading(false);
        onSuccess?.();
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.warn(`⚠️ Tentativa ${attempt} falhou:`, lastError.message);

        // Verificar se é um erro de extensão do browser
        const isExtensionError = lastError.message.includes('Failed to fetch') ||
          lastError.message.includes('chrome-extension') ||
          lastError.message.includes('extension') ||
          lastError.stack?.includes('chrome-extension');

        if (isExtensionError) {
          console.log(`🛡️ Erro causado por extensão do browser detectado na tentativa ${attempt}`);
        }

        onError?.(lastError, attempt);

        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          console.log(`⏳ Aguardando ${retryDelay}ms antes da próxima tentativa...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    // Se chegou até aqui, todas as tentativas falharam
    console.error(`❌ Todas as ${maxRetries} tentativas falharam. Último erro:`, lastError);
    setError(lastError);
    setIsLoading(false);
    throw lastError;

  }, [serverAction, maxRetries, retryDelay, onError, onSuccess]);

  return {
    execute: executeWithRetry,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}
