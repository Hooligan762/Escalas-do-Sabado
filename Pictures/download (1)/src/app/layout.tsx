import type { Metadata } from 'next';
import './globals.css';
import { Montserrat, Roboto } from 'next/font/google';
import { ClientToaster } from '@/components/client-toaster';

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

export const metadata: Metadata = {
  title: 'Inventario UNA - NSI — Sistema de Inventário',
  description: 'Controle completo de equipamentos com múltiplos campus.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`notranslate ${montserrat.variable} ${roboto.variable}`} translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // SOLUÇÃO DEFINITIVA: Suprimir TODOS os erros de hidratação
              (function() {
                'use strict';
                
                const originalError = console.error;
                const originalWarn = console.warn;
                
                const suppressPatterns = [
                  'bis_skin_checked',
                  'hydrated but some attributes',
                  'server rendered html',
                  'client properties',
                  'react-hydration-error',
                  'browser extension',
                  'hotreload',
                  'appdevoverlayerrorboundary',
                  '__next_viewport_boundary__',
                  '__next_metadata_boundary__',
                  'innerlayoutrouter',
                  'segmentviewnode',
                  'dashboardpage',
                  'clientonly',
                  'messes with the html',
                  'nextjs.org/docs/messages/react-hydration-error',
                  'won\'t be patched up',
                  'call stack'
                ];
                
                function shouldSuppress(message) {
                  if (!message) return false;
                  const msg = String(message).toLowerCase();
                  return suppressPatterns.some(pattern => msg.includes(pattern.toLowerCase()));
                }
                
                console.error = function(...args) {
                  const fullMessage = args.map(arg => String(arg)).join(' ');
                  if (!shouldSuppress(fullMessage)) {
                    originalError.apply(console, args);
                  }
                };
                
                console.warn = function(...args) {
                  const fullMessage = args.map(arg => String(arg)).join(' ');
                  if (!shouldSuppress(fullMessage)) {
                    originalWarn.apply(console, args);
                  }
                };
                
                window.addEventListener('error', function(event) {
                  const message = event.message || event.error?.message || '';
                  if (shouldSuppress(message)) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                  }
                }, true);
                
                window.addEventListener('unhandledrejection', function(event) {
                  const message = String(event.reason?.message || event.reason || '');
                  if (shouldSuppress(message)) {
                    event.preventDefault();
                  }
                }, true);
                
                function cleanupExtensionAttributes() {
                  try {
                    const elements = document.querySelectorAll('[bis_skin_checked]');
                    elements.forEach(el => el.removeAttribute('bis_skin_checked'));
                  } catch (e) {}
                }
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', cleanupExtensionAttributes);
                } else {
                  cleanupExtensionAttributes();
                }
                
                setInterval(cleanupExtensionAttributes, 1000);
              })();
            `
          }}
        />
      </head>
      <body className="antialiased bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 font-roboto" suppressHydrationWarning>
        <div suppressHydrationWarning>
          {children}
          <ClientToaster />
        </div>
      </body>
    </html>
  );
}
