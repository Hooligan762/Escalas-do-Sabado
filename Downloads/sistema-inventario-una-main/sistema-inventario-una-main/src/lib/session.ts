"use server";
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUsers } from './db';
import type { User } from './types';

const SESSION_COOKIE_NAME = 'inventory_session';

// Função para normalizar strings (remover acentos e caracteres especiais)
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

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
  let user = users.find(u => u.username && username && u.username.toLowerCase() === username.toLowerCase());

  // Se não encontrar, tenta buscar pelo usuário técnico que corresponde ao campus (com normalização)
  if (!user) {
    const normalizedUsername = normalizeString(username);
    
    user = users.find(u => {
      if (u.role !== 'tecnico' || !u.campus) return false;
      
      // Pegar o nome do campus (pode ser string ou objeto)
      const userCampusName = typeof u.campus === 'object' ? u.campus.name : u.campus;
      if (!userCampusName) return false;
      
      // Comparar normalizando (remove acentos, case-insensitive)
      const normalizedCampus = normalizeString(userCampusName);
      return normalizedCampus === normalizedUsername;
    });
  }

  return user || null;
}

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  // Importar os módulos de validação
  const { validateFormData, getLoginSchema } = await import('./validation');

  // Verificação básica de CSRF - em produção seria mais robusta
  const csrfToken = formData.get('csrfToken') as string | null;
  if (process.env.NODE_ENV === 'production' && !csrfToken) {
    console.log('Erro: Token CSRF ausente - ignorando para login');
    // return { error: 'Erro de segurança: token de proteção ausente.' };
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
  if (username && specialAdminUsers.includes(username.toLowerCase())) {
    // Para usuários especiais, busca diretamente pelo username
    const users = await getUsers();
    user = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
      return { error: 'Credenciais de administrador inválidas.' };
    }

    // Verificar se o campus selecionado é válido para admin
    if (selectedCampusName && selectedCampusName !== 'Administrador') {
      console.log(`⚠️ Admin tentou login com campus não-admin: ${selectedCampusName}`);
      return { error: 'Usuários administrativos devem selecionar o campus "Administrador".' };
    }

    // Se não selecionou campus ou selecionou "Administrador", está OK
    console.log(`✅ Login de usuário especial: ${user.username} (${user.name}) - Campus: ${selectedCampusName || 'Administrador'}`);
  }
  // Lógica para usuários de campus (precisa de campus selecionado)
  else if (selectedCampusName && selectedCampusName !== '') {
    // Busca todos os usuários
    const users = await getUsers();

    // Normalizar o nome do campus selecionado para comparação sem acentos
    const normalizedSelectedCampus = normalizeString(selectedCampusName);

    // MODO ULTRAFLEXÍVEL: simplesmente encontra qualquer técnico para este campus,
    // independentemente do nome de usuário inserido. Isso facilita o login quando há
    // discrepâncias entre o nome de usuário armazenado e o digitado pelo usuário.
    user = users.find(u => {
      if (u.role !== 'tecnico' || !u.campus) return false;
      
      // Pegar o nome do campus (pode ser string ou objeto)
      const userCampusName = typeof u.campus === 'object' ? u.campus.name : u.campus;
      if (!userCampusName) return false;
      
      // Comparar normalizando ambos (remove acentos, case-insensitive)
      const normalizedUserCampus = normalizeString(userCampusName);
      return normalizedUserCampus === normalizedSelectedCampus;
    });

    console.log(`Buscando técnico para campus ${selectedCampusName} (normalizado: ${normalizedSelectedCampus}):`, user ? `Encontrado: ${user.username}` : 'Não encontrado');

    if (!user) {
      return { error: `Não foi encontrado um técnico para o campus ${selectedCampusName}.` };
    }
  }
  // Se chegou aqui sem usuário, é porque não foi possível identificar
  else {
    return { error: 'Por favor, selecione um campus válido ou use credenciais de administrador.' };
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
  if (!username) {
    throw new Error('Username não fornecido');
  }
  const user = await getUserByUsername(username);
  if (!user) {
    redirect('/login');
  }
  return user;
}
