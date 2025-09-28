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
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    return user || null;
}

export async function login(prevState: { error: string } | undefined, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const selectedCampusName = formData.get('campus') as string | null;

  if (!username || !password || !selectedCampusName) {
    return { error: 'Todos os campos são obrigatórios.' };
  }

  const user = await getUserByUsername(username);

  if (!user || !user.password) {
    return { error: 'Usuário ou senha inválidos.' };
  }

  if (password !== user.password) {
      return { error: 'Usuário ou senha inválidos.' };
  }

  if (user.role === 'admin') {
      if (selectedCampusName !== 'Administrador') {
         return { error: `Login de administrador inválido. Selecione a opção "Administrador".` };
      }
  } else {
      if (user.campus !== selectedCampusName) {
          return { error: `Este usuário não pertence ao campus ${selectedCampusName}.` };
      }
  }

  await createSession(username);
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
