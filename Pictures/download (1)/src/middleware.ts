import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('inventory_session');
  const username = sessionCookie?.value;
  const { pathname } = request.nextUrl;

  // Criar resposta
  const response = NextResponse.next();
  
  // Adicionar cabeçalhos de segurança manualmente
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " + 
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + 
    "style-src 'self' 'unsafe-inline'; " + 
    "img-src 'self' data: blob:; " + 
    "font-src 'self'; " + 
    "connect-src 'self'; " + 
    "frame-ancestors 'none'; " + 
    "form-action 'self'"
  );
  
  // Adicionar outros cabeçalhos de segurança
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Não divulgar informações de software no cabeçalho Server
  response.headers.set('Server', '');

  const isPublicPage = pathname === '/login' || pathname.startsWith('/requests');
  const isAdminPage = pathname.startsWith('/admin');

  if (!username && !isPublicPage) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    
    // Aplicar cabeçalhos de segurança à resposta de redirecionamento
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('X-XSS-Protection', '1; mode=block');
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    
    return redirectResponse;
  }
  
  if (username && pathname === '/login') {
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    
    // Aplicar cabeçalhos de segurança à resposta de redirecionamento
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('X-XSS-Protection', '1; mode=block');
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    
    return redirectResponse;
  }
  
  // A proteção das rotas /admin será feita na própria página,
  // pois o middleware não tem acesso fácil ao 'role' do usuário.

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
