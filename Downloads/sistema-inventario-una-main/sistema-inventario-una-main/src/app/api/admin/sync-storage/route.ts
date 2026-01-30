import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, itemId } = body;

    console.log('🧹 API de Limpeza chamada:', { action, itemId });

    if (action === 'clear-localstorage') {
      // Instrução específica para o frontend limpar localStorage
      return NextResponse.json({
        success: true,
        action: 'CLEAR_LOCALSTORAGE',
        message: 'Frontend deve limpar localStorage e recarregar dados',
        itemsToRemove: itemId ? [itemId] : 'ALL',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'sync-check' && itemId) {
      // Verificar se item existe no banco (será implementado posteriormente)
      return NextResponse.json({
        success: true,
        action: 'SYNC_CHECK',
        itemId,
        exists: false, // Por enquanto, assumir que não existe
        message: 'Item não existe no banco - deve ser removido do localStorage'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Ação não reconhecida'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Erro na API de limpeza:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}