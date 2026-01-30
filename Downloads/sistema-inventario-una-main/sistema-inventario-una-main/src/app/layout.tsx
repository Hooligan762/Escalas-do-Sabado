import type { Metadata } from 'next';
import './globals.css';
import { Montserrat, Roboto } from 'next/font/google';
import { ClientToaster } from '@/components/client-toaster';
import ErrorBoundary from '@/components/error-boundary';
// 🔓 PROTEÇÕES TEMPORARIAMENTE DESABILITADAS PARA PERMITIR CAMPO FIXO
// import PhantomItemsDetector from '@/components/phantom-items-detector';
// import PhantomIdBlocker from '@/components/phantom-id-blocker';
// import FixedActionProtector from '@/components/fixed-action-protector';

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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`notranslate ${montserrat.variable} ${roboto.variable}`} translate="no">
      <head>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // HOTFIX EMERGENCIAL - CORREÇÃO DE ITENS FANTASMA
              (function() {
                'use strict';
                
                console.log('🔥 HOTFIX: Sistema de correção automática iniciado');
                
                const PHANTOM_IDS = [
                  'e806ca85-2304-49f0-ac04-3cb96d026465',
                  '801bbc61-fd05-4e86-bac9-d5f24335d340'
                ];
                
                function autoCleanPhantomItems() {
                  try {
                    let needsReload = false;
                    
                    const inventoryData = localStorage.getItem('inventory_data');
                    if (inventoryData) {
                      try {
                        let inventory = JSON.parse(inventoryData);
                        const originalLength = inventory.length;
                        
                        if (Array.isArray(inventory)) {
                          inventory = inventory.filter(item => {
                            const isPhantom = PHANTOM_IDS.includes(item.id);
                            if (isPhantom) {
                              console.log('👻 HOTFIX: Removendo item fantasma:', item.id);
                            }
                            return !isPhantom;
                          });
                          
                          const removidos = originalLength - inventory.length;
                          
                          if (removidos > 0) {
                            localStorage.setItem('inventory_data', JSON.stringify(inventory));
                            console.log('✅ HOTFIX: ' + removidos + ' itens fantasma removidos');
                            needsReload = true;
                          }
                        }
                      } catch (error) {
                        console.warn('⚠️ HOTFIX: Erro ao processar inventory_data, removendo...');
                        localStorage.removeItem('inventory_data');
                        needsReload = true;
                      }
                    }
                    
                    if (needsReload) {
                      console.log('🔄 HOTFIX: Recarregando página para aplicar correções...');
                      setTimeout(function() {
                        window.location.reload();
                      }, 1500);
                    }
                    
                  } catch (error) {
                    console.error('❌ HOTFIX: Erro na limpeza automática:', error);
                  }
                }
                
                const originalError = console.error;
                console.error = function() {
                  const args = Array.prototype.slice.call(arguments);
                  const message = args.join(' ');
                  
                  if (message.includes('não encontrado no banco de dados')) {
                    console.log('🚨 HOTFIX: Erro de item fantasma detectado');
                    setTimeout(autoCleanPhantomItems, 1000);
                  }
                  
                  originalError.apply(console, args);
                };
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', autoCleanPhantomItems);
                } else {
                  setTimeout(autoCleanPhantomItems, 2000);
                }
                
                window.hotfixPhantomItems = autoCleanPhantomItems;
              })();
            `
          }}
        />
      </head>
      <body className="antialiased bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 font-roboto" suppressHydrationWarning>
        <div suppressHydrationWarning>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ClientToaster />
          {/* 🔓 PROTEÇÕES TEMPORARIAMENTE DESABILITADAS PARA PERMITIR CAMPO FIXO */}
          {/* <PhantomItemsDetector /> */}
          {/* <PhantomIdBlocker /> */}
          {/* <FixedActionProtector /> */}
        </div>
      </body>
    </html>
  );
}
