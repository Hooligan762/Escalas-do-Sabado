'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Propriedades do componente
interface CsrfTokenProps {
  userId?: string;
}

/**
 * Componente que adiciona um campo hidden com o token CSRF em formulários
 */
export function CsrfToken({ userId }: CsrfTokenProps) {
  const [token, setToken] = useState<string>('');
  const pathname = usePathname();
  
  useEffect(() => {
    async function fetchToken() {
      try {
        // Buscar token do servidor
        const response = await fetch('/api/csrf');
        const data = await response.json();
        
        if (data.token) {
          setToken(data.token);
          
          // Armazenar o token como um cookie para requisições XHR
          document.cookie = `csrfToken=${data.token}; path=/; SameSite=Strict; secure`;
        }
      } catch (error) {
        console.error('Erro ao obter token CSRF:', error);
      }
    }
    
    fetchToken();
  }, [pathname, userId]); // Atualizar quando a URL ou o usuário mudar
  
  // Renderizar campo hidden com o token CSRF
  return token ? <input type="hidden" name="csrfToken" value={token} /> : null;
}

/**
 * HOC (Higher Order Component) para adicionar proteção CSRF a um formulário
 */
export function withCsrfProtection<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { userId?: string }> {
  return function ProtectedComponent({ userId, ...props }: P & { userId?: string }) {
    return (
      <>
        <Component {...props as P} />
        <CsrfToken userId={userId} />
      </>
    );
  };
}