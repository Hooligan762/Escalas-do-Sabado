"use server";
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsers } from './db';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'inventory_session';

export async function createSession(username: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, username, { expires, httpOnly: true, secure: process.env.NODE_ENV === 'production' });
}

export async function getSessionUsername(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const users = await getUsers();
    
    // Verifica exatamente pelo nome de usuário primeiro (para admin)
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    // Se não encontrar, tenta buscar pelo usuário técnico que corresponde ao campus exato
    if (!user) {
      user = users.find(u => 
        u.role === 'tecnico' && 
        u.campus && 
        (u.campus === username || u.campus.toLowerCase() === username.toLowerCase())
      );
    }
    
    return user || null;
}

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  // Importar os módulos de validação
  const { validateFormData, getLoginSchema } = await import('./validation');
  
  // Verificação básica de CSRF - em produção seria mais robusta
  const csrfToken = formData.get('csrfToken') as string | null;
  if (process.env.NODE_ENV === 'production' && !csrfToken) {
    console.log('Erro: Token CSRF ausente');
    return { error: 'Erro de segurança: token de proteção ausente.' };
  }
  
  // Obter o esquema de login
  const loginSchema = await getLoginSchema();
  
  // Validação dos dados de login com Zod
  const validationResult = await validateFormData(loginSchema, formData);
  
  if (!validationResult.success) {
    console.log('Erro na validação do login:', validationResult.errors?.errors);
    return { error: 'Dados de login inválidos. Verifique os campos e tente novamente.' };
  }
  
  // Dados validados e sanitizados
  const { username, password, campus: selectedCampusName } = validationResult.data!;
  
  console.log(`Tentativa de login - Campus: ${selectedCampusName || 'não selecionado'}, Login: ${username}`);

  let user;
  
  // Lógica especial para usuários administrativos (admin, full, etc)
  const specialAdminUsers = ['admin', 'full'];
  if (specialAdminUsers.includes(username.toLowerCase())) {
    // Para usuários especiais, busca diretamente pelo username
    const users = await getUsers();
    user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      return { error: 'Credenciais de administrador inválidas.' };
    }
  }
  // Lógica de login para administrador com campus selecionado
  else if (selectedCampusName === 'Administrador') {
    // Para administrador, aceita apenas 'admin'
    if (username !== 'admin') {
      return { error: 'Credenciais de administrador inválidas.' };
    }
    
    // Buscar o usuário admin
    const users = await getUsers();
    user = users.find(u => u.role === 'admin' && u.username === 'admin');
    
    if (!user) {
      return { error: 'Credenciais de administrador inválidas.' };
    }
  } 
  // Lógica para usuários de campus (precisa de campus selecionado)
  else if (selectedCampusName && selectedCampusName !== '') {
    // Busca todos os usuários
    const users = await getUsers();
    
    // MODO ULTRAFLEXÍVEL: simplesmente encontra qualquer técnico para este campus,
    // independentemente do nome de usuário inserido. Isso facilita o login quando há
    // discrepâncias entre o nome de usuário armazenado e o digitado pelo usuário.
    user = users.find(u => 
      u.role === 'tecnico' && 
      u.campus && 
      u.campus.toLowerCase() === selectedCampusName.toLowerCase()
    );
    
    console.log(`Buscando técnico para campus ${selectedCampusName}:`, user ? `Encontrado: ${user.username}` : 'Não encontrado');
    
    if (!user) {
      return { error: `Não foi encontrado um técnico para o campus ${selectedCampusName}.` };
    }
  }
  // Se chegou aqui sem usuário, é porque não foi possível identificar
  else {
    return { error: 'Por favor, selecione um campus ou use credenciais de administrador.' };
  }

  if (!user || !user.password) {
    console.log('Erro: usuário não encontrado ou sem senha');
    return { error: 'Usuário ou senha inválidos.' };
  }

  console.log(`Verificação de senha - Usuário encontrado: ${user.username}, Verificando senha com hash...`);
  
  // Importar a função verifyPassword
  const { verifyPassword } = await import('./auth');
  
  // Usar a função verifyPassword que suporta tanto senhas com hash quanto legadas
  const passwordValid = await verifyPassword(password, user.password);
  
  if (!passwordValid) {
    console.log('Erro: senha incorreta');
    return { error: 'Usuário ou senha inválidos.' };
  }

  await createSession(user.username);
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

export async function getFullCurrentUser() {
    const username = await getSessionUsername();
    if (!username) {
        redirect('/login');
    }
    const user = await getUserByUsername(username);
    if (!user) {
        redirect('/login');
    }
    return user;
}
