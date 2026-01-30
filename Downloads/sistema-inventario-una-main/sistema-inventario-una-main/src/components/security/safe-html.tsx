'use client';

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

interface SafeHtmlProps {
  html: string;
  className?: string;
}

/**
 * Componente para renderizar HTML sanitizado e seguro
 */
export default function SafeHtml({ html, className }: SafeHtmlProps) {
  const [mounted, setMounted] = useState(false);
  
  // Só renderizar no lado do cliente
  useEffect(() => {
    setMounted(true);
    
    // Configuração adicional do DOMPurify
    if (typeof window !== 'undefined') {
      DOMPurify.addHook('afterSanitizeAttributes', function(node: Element) {
        // Adicionar target="_blank" e rel="noreferrer noopener" a todos os links externos
        if (node.nodeName === 'A' && node.hasAttribute('href')) {
          const href = node.getAttribute('href');
          if (href && !href.startsWith('/') && !href.startsWith('#')) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noreferrer noopener');
          }
        }
      });
    }
  }, []);
  
  // Sanitizar o HTML utilizando DOMPurify
  const sanitizedHtml = mounted ? DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
  }) : '';
  
  // Se não estiver montado, mostrar uma versão simples e segura
  if (!mounted) {
    return (
      <div className={className}>
        {html.replace(/<[^>]*>?/gm, ' ')}
      </div>
    );
  }
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}