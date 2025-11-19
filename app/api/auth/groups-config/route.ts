import { NextResponse } from 'next/server';

/**
 * GET /api/auth/groups-config
 * Retorna la configuración de grupos desde las variables de entorno
 */
export async function GET() {
  try {
    const gruposCobranzas = (process.env.AD_GROUP_COBRANZAS || '')
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g !== '');
    const gruposInspecciones = (process.env.AD_GROUP_INSPECCIONES || '')
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g !== '');

    return NextResponse.json({
      success: true,
      groups: {
        cobranzas: gruposCobranzas,
        inspecciones: gruposInspecciones,
      },
    });
  } catch (error: any) {
    console.error('Error obteniendo configuración de grupos:', error);
    return NextResponse.json(
      { success: false, error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
