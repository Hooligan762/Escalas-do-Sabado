'use server';

import 'server-only';
import bcrypt from 'bcrypt';

// Função para gerar hash de senha
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Função para verificar senha
export async function verifyPassword(providedPassword: string, storedPassword: string): Promise<boolean> {
  // Verificar se a senha armazenada é um hash bcrypt
  if (storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$')) {
    // É um hash bcrypt, usar bcrypt.compare
    return await bcrypt.compare(providedPassword, storedPassword);
  } else {
    // Comparação de texto simples (legado)
    return providedPassword === storedPassword;
  }
}
