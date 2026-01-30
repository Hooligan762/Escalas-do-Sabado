/**
 * 🛡️ PHANTOM ID PROTECTION API
 * Intercepta e bloqueia chamadas updateInventoryItem com IDs fantasma
 */

import { NextRequest, NextResponse } from 'next/server';
import { isPhantomId } from '@/lib/phantom-id-guard';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verificar se há ID fantasma na requisição
    if (body.id && isPhantomId(body.id)) {
      console.error('🚨 PHANTOM ID API BLOCKED:', {
        phantomId: body.id,
        timestamp: new Date().toISOString(),
        body,
        url: request.url
      });
      
      return NextResponse.json(
        {
          error: 'ID Fantasma Detectado',
          message: `Operação bloqueada - ID fantasma: ${body.id}`,
          blocked: true,
          phantomId: body.id,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    // Se chegou até aqui, não é ID fantasma - continuar normalmente
    // (Esta API é apenas um interceptador, não faz a operação real)
    return NextResponse.json(
      {
        message: 'ID validado - prosseguir com operação normal',
        validated: true
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro no phantom ID blocker API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'PHANTOM ID BLOCKER ATIVO',
    timestamp: new Date().toISOString(),
    blockedIds: [
      'e806ca85-2304-49f0-ac04-3cb96d026465',
      '801bbc61-fd05-4e86-bac9-d5f24335d340'
    ]
  });
}