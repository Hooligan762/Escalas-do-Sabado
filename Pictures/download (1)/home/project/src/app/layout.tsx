import type { Metadata } from 'next';
import { ClientToaster } from '@/components/client-toaster';
import './globals.css';

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
    <html lang="pt-BR" suppressHydrationWarning className="notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-screen h-full" suppressHydrationWarning>
        <div className="min-h-screen h-full bg-muted/40">
          {children}
        </div>
        <ClientToaster />
      </body>
    </html>
  );
}
