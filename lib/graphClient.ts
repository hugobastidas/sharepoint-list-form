import { ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { FormData, SharePointItem } from '@/types/global';

/**
 * Cliente de Microsoft Graph para interactuar con SharePoint
 */
export class GraphClient {
  private client: Client;
  private siteId: string;
  private listId: string;

  constructor() {
    // Validar variables de entorno
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const clientSecret = process.env.GRAPH_CLIENT_SECRET;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Faltan variables de entorno de Graph (GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET)');
    }

    this.siteId = process.env.SP_SITE_ID || '';
    this.listId = process.env.SP_LIST_ID || '';

    if (!this.siteId || !this.listId) {
      throw new Error('Faltan variables de entorno de SharePoint (SP_SITE_ID, SP_LIST_ID)');
    }

    // Crear credencial
    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret
    );

    // Crear proveedor de autenticación
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    // Crear cliente Graph
    this.client = Client.initWithMiddleware({
      authProvider,
    });
  }

  /**
   * Crea un item en la lista de SharePoint
   */
  async createListItem(formData: FormData): Promise<string> {
    try {
      // Preparar el objeto con los campos de SharePoint
      // IMPORTANTE: Los nombres de campos deben coincidir EXACTAMENTE con los nombres internos (name) en SharePoint
      const itemData: SharePointItem = {
        fields: {
          Title: formData.numeroCredito, // Campo requerido por SharePoint (lo usamos para el número de crédito)
          FechaNotificacion: formData.fechaNotificacion, // Campo dateTime requerido
          GPS: formData.gps, // Campo GPS (puede ser coordenadas o descripción)
          DiasMora: formData.diasMora, // Campo number requerido (mínimo 1)
          Compromiso: formData.fechaCompromiso, // Campo dateTime opcional (nota: el nombre es "Compromiso", no "fechaCompromiso")
          Observaciones: formData.observaciones, // Campo text opcional
        },
      };

      // Crear el item
      const result = await this.client
        .api(`/sites/${this.siteId}/lists/${this.listId}/items`)
        .post(itemData);

      console.log('Item creado exitosamente:', result.id);
      return result.id;
    } catch (error: any) {
      console.error('Error creando item en SharePoint:', error);

      // Log detallado del error para debugging
      if (error.body) {
        console.error('Error body:', JSON.stringify(error.body, null, 2));
      }

      throw new Error(`Error creando item: ${error.message}`);
    }
  }

  /**
   * Adjunta un archivo a un item de la lista
   */
  async attachFileToItem(itemId: string, fileName: string, fileBuffer: Buffer): Promise<void> {
    try {
      // La ruta para adjuntar archivos a un list item
      const attachmentUrl = `/sites/${this.siteId}/lists/${this.listId}/items/${itemId}/driveItem/children/${fileName}/content`;

      await this.client
        .api(attachmentUrl)
        .header('Content-Type', 'application/octet-stream')
        .put(fileBuffer);

      console.log(`Archivo ${fileName} adjuntado exitosamente al item ${itemId}`);
    } catch (error: any) {
      console.error(`Error adjuntando archivo ${fileName}:`, error);
      throw new Error(`Error adjuntando archivo: ${error.message}`);
    }
  }

  /**
   * Crea un item y adjunta múltiples archivos
   */
  async createItemWithAttachments(
    formData: FormData,
    files: Array<{ name: string; buffer: Buffer }>
  ): Promise<string> {
    try {
      // Primero crear el item
      const itemId = await this.createListItem(formData);

      // Luego adjuntar todos los archivos
      if (files && files.length > 0) {
        console.log(`Adjuntando ${files.length} archivo(s) al item ${itemId}...`);

        for (const file of files) {
          await this.attachFileToItem(itemId, file.name, file.buffer);
        }

        console.log('Todos los archivos adjuntados exitosamente');
      }

      return itemId;
    } catch (error: any) {
      console.error('Error en createItemWithAttachments:', error);
      throw error;
    }
  }

  /**
   * Obtiene un item de la lista
   */
  async getListItem(itemId: string): Promise<any> {
    try {
      const result = await this.client
        .api(`/sites/${this.siteId}/lists/${this.listId}/items/${itemId}`)
        .expand('fields')
        .get();

      return result;
    } catch (error: any) {
      console.error('Error obteniendo item:', error);
      throw new Error(`Error obteniendo item: ${error.message}`);
    }
  }
}

// Exportar una función factory en lugar de singleton para evitar problemas con variables de entorno
export function createGraphClient(): GraphClient {
  return new GraphClient();
}
