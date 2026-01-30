import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import bcrypt from 'bcrypt';

// Função para normalizar strings (remover acentos)
function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export async function POST(request: Request) {
  try {
    const { login, senha, campus } = await request.json();
    
    if (!login || !senha) {
      return NextResponse.json({ error: 'Login e senha obrigatórios.' }, { status: 400 });
    }

    const users = await db.getUsers();
    console.log('Usuários retornados do banco:', users.length);
    
    // Normalizar campus para comparação
    const normalizedCampus = campus ? normalizeString(campus) : '';
    
    // Buscar usuário
    const user = users.find((u: any) => {
      const matchesLogin = u.username === login || u.login === login;
      
      // Admin pode logar de qualquer campus
      if (u.role === 'admin') {
        return matchesLogin;
      }
      
      // Técnico precisa ter campus correto (normalizado)
      const userCampusName = typeof u.campus === 'object' ? u.campus?.name : u.campus;
      const normalizedUserCampus = userCampusName ? normalizeString(userCampusName) : '';
      const matchesCampus = normalizedUserCampus === normalizedCampus || !campus;
      
      return matchesLogin && matchesCampus;
    });

    if (!user) {
      console.log('Usuário não encontrado. Login:', login, 'Campus:', campus);
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 401 });
    }
    
    if (!user.password) {
      return NextResponse.json({ error: 'Usuário sem senha cadastrada.' }, { status: 401 });
    }

    // Validar senha (suporta hash bcrypt e texto plano)
    let senhaValida = false;
    if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
      // Senha em hash bcrypt
      senhaValida = await bcrypt.compare(senha, user.password);
    } else {
      // Senha em texto plano (técnicos antigos)
      senhaValida = senha === user.password;
    }

    if (!senhaValida) {
      console.log('Senha incorreta para usuário:', login);
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    // Permitir login de admin e tecnico
    if (user.role !== 'admin' && user.role !== 'tecnico') {
      return NextResponse.json({ error: 'Permissão insuficiente para acessar o sistema.' }, { status: 403 });
    }

    console.log('Login bem-sucedido:', user.username, 'Role:', user.role);
    
    // Retorna dados do usuário (sem senha)
    const { password: _, ...userData } = user;
    return NextResponse.json({ success: true, user: userData });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno na autenticação.' }, { status: 500 });
  }
}
