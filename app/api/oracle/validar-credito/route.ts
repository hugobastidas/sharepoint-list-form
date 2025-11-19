import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { buscarCredito } from '@/lib/oracleClient';

/**
 * GET /api/oracle/validar-credito
 * Endpoint para validar si un crédito existe en Oracle
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener número de crédito desde query params
    const { searchParams } = new URL(request.url);
    const numeroCredito = searchParams.get('numeroCredito');

    if (!numeroCredito) {
      return NextResponse.json(
        { success: false, error: 'Número de crédito requerido' },
        { status: 400 }
      );
    }

    // Validar formato (12 caracteres)
    if (numeroCredito.length !== 12) {
      return NextResponse.json(
        { success: false, error: 'El número de crédito debe tener exactamente 12 caracteres' },
        { status: 400 }
      );
    }

    console.log(`Buscando crédito en Oracle: ${numeroCredito}`);

    // Buscar el crédito en Oracle
    const creditoInfo = await buscarCredito(numeroCredito);

    if (!creditoInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Crédito no encontrado. Verifique el número ingresado.',
        },
        { status: 404 }
      );
    }

    console.log(`✓ Crédito encontrado:`, creditoInfo);

    return NextResponse.json({
      success: true,
      data: {
        numeroCredito: creditoInfo.ccuenta,
        agencia: creditoInfo.sucursal,
        diasMora: creditoInfo.diasmora,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/oracle/validar-credito:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error del servidor al validar el crédito',
      },
      { status: 500 }
    );
  }
}
