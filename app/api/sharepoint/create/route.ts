import { NextRequest, NextResponse } from 'next/server';
import { createGraphClient } from '@/lib/graphClient';
import { getCurrentUser } from '@/lib/auth';
import { FormData } from '@/types/global';

/**
 * POST /api/sharepoint/create
 * Endpoint para crear un item en SharePoint con adjuntos
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener datos del formulario
    const formData = await request.formData();

    // Extraer campos del formulario
    const numeroCredito = formData.get('numeroCredito') as string;
    const fechaNotificacion = formData.get('fechaNotificacion') as string;
    const gps = formData.get('gps') as string;
    const diasMora = formData.get('diasMora') as string;
    const fechaCompromiso = formData.get('fechaCompromiso') as string;
    const observaciones = formData.get('observaciones') as string;

    // Validar campos requeridos
    if (!numeroCredito || !fechaNotificacion || !diasMora) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: numeroCredito, fechaNotificacion, diasMora',
        },
        { status: 400 }
      );
    }

    // Validar que diasMora sea mayor a 0
    const diasMoraNum = parseInt(diasMora, 10);
    if (isNaN(diasMoraNum) || diasMoraNum < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Días de mora debe ser un número mayor o igual a 1',
        },
        { status: 400 }
      );
    }

    // Preparar datos para SharePoint
    const itemData: FormData = {
      numeroCredito,
      fechaNotificacion,
      gps: gps || '',
      diasMora: diasMoraNum,
      fechaCompromiso: fechaCompromiso || '',
      observaciones: observaciones || '',
    };

    // Procesar archivos adjuntos
    const files: Array<{ name: string; buffer: Buffer }> = [];
    const imageKeys = Array.from(formData.keys()).filter((key) => key.startsWith('imagen_'));

    for (const key of imageKeys) {
      const file = formData.get(key) as File;
      if (file && file.size > 0) {
        // Validar tamaño del archivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            {
              success: false,
              error: `El archivo ${file.name} excede el tamaño máximo de 5MB`,
            },
            { status: 400 }
          );
        }

        // Validar tipo de archivo (solo imágenes)
        if (!file.type.startsWith('image/')) {
          return NextResponse.json(
            {
              success: false,
              error: `El archivo ${file.name} no es una imagen válida`,
            },
            { status: 400 }
          );
        }

        // Convertir File a Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        files.push({
          name: file.name,
          buffer,
        });
      }
    }

    // Validar número de imágenes
    if (files.length > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pueden adjuntar más de 5 imágenes',
        },
        { status: 400 }
      );
    }

    console.log(`Creando item con ${files.length} archivo(s)...`);

    // Crear cliente Graph y crear item con adjuntos
    const graphClient = createGraphClient();
    const itemId = await graphClient.createItemWithAttachments(itemData, files);

    return NextResponse.json({
      success: true,
      itemId,
      message: `Item creado exitosamente con ${files.length} archivo(s) adjunto(s)`,
    });
  } catch (error: any) {
    console.error('Error en /api/sharepoint/create:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error del servidor al crear el item',
      },
      { status: 500 }
    );
  }
}

// Configuración de Next.js para manejar archivos grandes
export const config = {
  api: {
    bodyParser: false, // Deshabilitamos el bodyParser por defecto para usar formData
  },
};
