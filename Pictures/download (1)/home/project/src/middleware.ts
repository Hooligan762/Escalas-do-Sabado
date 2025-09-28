import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionUsername } from './lib/session';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('inventory_session');
  const username = sessionCookie?.value;
  const { pathname } = request.nextUrl;

  const isPublicPage = pathname === '/login';
  const isAdminPage = pathname.startsWith('/admin');

  if (!username && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (username && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // A proteção das rotas /admin será feita na própria página,
  // pois o middleware não tem acesso fácil ao 'role' do usuário.
  if (isAdminPage) {
      if (!username) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      // A verificação de role (admin) é feita no client-side da página.
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
