import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/logout
 * Endpoint para cerrar sesión
 */
export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente',
  });

  // Eliminar cookie de autenticación
  response.cookies.delete('auth-token');

  return response;
}
