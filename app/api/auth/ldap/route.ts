import { NextRequest, NextResponse } from 'next/server';
import { ldapClient } from '@/lib/ldapClient';
import { createToken, setAuthCookie } from '@/lib/auth';

/**
 * POST /api/auth/ldap
 * Endpoint para autenticación LDAP
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validar campos requeridos
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Validar contra LDAP
    const authResult = await ldapClient.authenticate(username, password);

    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { success: false, error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const { displayName, email } = authResult.user;

    // Crear token JWT con información del usuario
    const token = await createToken(username, displayName, email);

    // Crear respuesta
    const response = NextResponse.json({
      success: true,
      message: 'Autenticación exitosa',
      username,
    });

    // Configurar cookie con el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error en autenticación LDAP:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor al autenticar' },
      { status: 500 }
    );
  }
}
