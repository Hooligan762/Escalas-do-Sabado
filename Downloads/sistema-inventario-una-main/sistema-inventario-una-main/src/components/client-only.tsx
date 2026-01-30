'use client';

import { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    // Remover atributos de extensões após montagem
    const cleanup = () => {
      try {
        const elements = document.querySelectorAll('[bis_skin_checked]');
        elements.forEach(el => {
          el.removeAttribute('bis_skin_checked');
        });
      } catch (e) {
        // Ignorar erros de cleanup
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 500);

    return () => clearInterval(interval);
  }, []);

  if (!hasMounted) {
    return <div suppressHydrationWarning>{fallback}</div>;
  }

  return <div suppressHydrationWarning>{children}</div>;
}
