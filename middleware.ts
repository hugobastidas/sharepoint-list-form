import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development'
);

/**
 * Middleware para proteger rutas que requieren autenticación
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/api/auth/ldap'];

  // Si es una ruta pública, permitir acceso
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Obtener token de la cookie
  const token = request.cookies.get('auth-token')?.value;

  // Si no hay token, redirigir a login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // Verificar el token
    await jwtVerify(token, SECRET_KEY);

    // Token válido, continuar
    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado, redirigir a login
    console.error('Token inválido:', error);
    const url = request.nextUrl.clone();
    url.pathname = '/login';

    const response = NextResponse.redirect(url);
    response.cookies.delete('auth-token');

    return response;
  }
}

// Configurar qué rutas debe proteger el middleware
export const config = {
  matcher: [
    /*
     * Proteger todas las rutas excepto:
     * - api (manejamos auth en los endpoints)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
