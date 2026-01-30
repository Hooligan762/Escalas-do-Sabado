import { NextResponse } from 'next/server';
import { getFullCurrentUser } from '@/lib/session';
import { updateUser, getUsers } from '@/lib/db';
// Não precisa importar hashPassword aqui, pois updateUser já faz isso internamente

export async function POST(request: Request) {
  try {
    // 1. Verificar se o usuário atual é o super administrador
    const currentUser = await getFullCurrentUser();
    
    // Apenas o super usuário 'full' pode alterar a senha do admin padrão
    if (currentUser.username !== 'full') {
      return NextResponse.json(
        { success: false, message: 'Permissão negada. Apenas o super administrador pode realizar esta operação.' }, 
        { status: 403 }
      );
    }
    
    // 2. Obter a nova senha do corpo da requisição
    const { password } = await request.json();
    
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Senha inválida.' }, 
        { status: 400 }
      );
    }
    
    // 3. Buscar o usuário admin padrão
    const users = await getUsers();
    const adminUser = users.find(u => u.username === 'admin' && u.role === 'admin');
    
    if (!adminUser) {
      return NextResponse.json(
        { success: false, message: 'Usuário administrador padrão não encontrado.' }, 
        { status: 404 }
      );
    }
    
    // 4. Atualizar a senha do usuário admin
    await updateUser(adminUser.id.toString(), { password });
    
    // 5. Log da operação (pode ser adicionado ao audit_log se necessário)
    console.log(`Senha do administrador padrão alterada pelo super usuário ${currentUser.username}`);
    
    return NextResponse.json({ success: true, message: 'Senha do administrador alterada com sucesso.' });
    
  } catch (error: any) {
    console.error('Erro ao alterar senha do administrador:', error);
    return NextResponse.json(
      { success: false, message: `Erro ao processar requisição: ${error.message}` }, 
      { status: 500 }
    );
  }
}