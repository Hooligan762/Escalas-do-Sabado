"use client";

import { useEffect, useState, ReactNode } from "react";

interface HydrationBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function HydrationBoundary({ children, fallback = null }: HydrationBoundaryProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);

    // Suprimir erros de hidratação específicos do componente
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('bis_skin_checked') ||
        message.includes('Hydration failed') ||
        message.includes('server rendered HTML')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return (
    <div suppressHydrationWarning>
      {isHydrated ? children : fallback}
    </div>
  );
}

// Hook para suprimir avisos de hidratação em componentes específicos
export function useHydrationWarningSupression() {
  useEffect(() => {
    const originalError = console.error;

    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('bis_skin_checked') ||
        message.includes('Hydration failed') ||
        message.includes('server rendered HTML')
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);
}
