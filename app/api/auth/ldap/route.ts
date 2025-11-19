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

    const { displayName, email, groups } = authResult.user;

    // Obtener grupos permitidos desde variables de entorno
    const gruposCobranzas = (process.env.AD_GROUP_COBRANZAS || '').split(',').map(g => g.trim().toLowerCase()).filter(g => g !== '');
    const gruposInspecciones = (process.env.AD_GROUP_INSPECCIONES || '').split(',').map(g => g.trim().toLowerCase()).filter(g => g !== '');
    const gruposPermitidos = [...gruposCobranzas, ...gruposInspecciones];

    // Validar que el usuario pertenezca al menos a uno de los grupos permitidos
    const userGroups = groups || [];
    const hasPermission = userGroups.some((group: string) =>
      gruposPermitidos.includes(group.toLowerCase())
    );

    if (!hasPermission) {
      console.log(`Usuario ${username} no pertenece a ningún grupo permitido`);
      console.log(`Grupos del usuario:`, userGroups);
      console.log(`Grupos permitidos:`, gruposPermitidos);
      return NextResponse.json(
        {
          success: false,
          error: 'No tiene permisos para acceder a esta aplicación. Usuario no pertenece a grupos permitidos.'
        },
        { status: 403 }
      );
    }

    // Crear token JWT con información del usuario incluyendo grupos
    const token = await createToken(username, displayName, email, groups);

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
