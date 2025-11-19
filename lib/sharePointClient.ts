import { ClientCertificateCredential } from '@azure/identity';
import { FormData } from '@/types/global';
import fs from 'fs';
import path from 'path';

/**
 * Cliente simplificado para SharePoint REST API
 * Usa solo SharePoint REST API (no Microsoft Graph)
 */
export class SharePointClient {
  private credential: ClientCertificateCredential;
  private siteUrl: string;
  private listId: string;
  private sharePointDomain: string;
  private listEntityType: string | null = null;

  constructor() {
    // Validar variables de entorno
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const certificatePath = process.env.GRAPH_CERTIFICATE_PATH;

    if (!tenantId || !clientId || !certificatePath) {
      throw new Error('Faltan variables de entorno: GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CERTIFICATE_PATH');
    }

    this.siteUrl = process.env.SP_SITE_URL || '';
    this.listId = process.env.SP_LIST_ID || '';

    if (!this.siteUrl || !this.listId) {
      throw new Error('Faltan variables de entorno: SP_SITE_URL, SP_LIST_ID');
    }

    // Extraer el dominio de SharePoint
    const url = new URL(this.siteUrl);
    this.sharePointDomain = `${url.protocol}//${url.hostname}`;

    // Cargar certificado
    const certPath = path.resolve(process.cwd(), certificatePath);
    if (!fs.existsSync(certPath)) {
      throw new Error(`Certificado no encontrado en: ${certPath}`);
    }

    this.credential = new ClientCertificateCredential(
      tenantId,
      clientId,
      certPath
    );

    console.log('✓ SharePoint Client inicializado');
    console.log('  - Site:', this.siteUrl);
    console.log('  - Domain:', this.sharePointDomain);
  }

  /**
   * Obtiene un token de acceso para SharePoint REST API
   */
  private async getToken(): Promise<string> {
    try {
      const tokenResponse = await this.credential.getToken([`${this.sharePointDomain}/.default`]);
      if (!tokenResponse) {
        throw new Error('No se pudo obtener token de SharePoint');
      }
      return tokenResponse.token;
    } catch (error: any) {
      console.error('Error obteniendo token:', error);
      throw new Error(`Error obteniendo token: ${error.message}`);
    }
  }

  /**
   * Obtiene el Form Digest (necesario para operaciones POST/UPDATE/DELETE)
   */
  private async getFormDigest(): Promise<string> {
    try {
      const token = await this.getToken();
      const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
        },
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo Form Digest: ${response.status}`);
      }

      const data = await response.json();
      return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error: any) {
      console.error('Error obteniendo Form Digest:', error);
      throw new Error(`Error obteniendo Form Digest: ${error.message}`);
    }
  }

  /**
   * Busca un usuario en SharePoint por email y retorna su ID
   */
  private async getUserIdByEmail(email: string): Promise<number | null> {
    try {
      const token = await this.getToken();
      const encodedEmail = encodeURIComponent(email);
      const response = await fetch(
        `${this.siteUrl}/_api/web/siteusers?$filter=Email eq '${encodedEmail}'`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        console.error('Error buscando usuario:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.d && data.d.results && data.d.results.length > 0) {
        const userId = data.d.results[0].Id;
        console.log(`Usuario encontrado: ${email} -> ID: ${userId}`);
        return userId;
      }

      console.log(`Usuario no encontrado en SharePoint: ${email}`);
      return null;
    } catch (error: any) {
      console.error('Error buscando usuario en SharePoint:', error);
      return null;
    }
  }

  /**
   * Obtiene el Entity Type de la lista (necesario para crear items)
   */
  private async getListEntityType(): Promise<string> {
    if (this.listEntityType) {
      return this.listEntityType;
    }

    try {
      const token = await this.getToken();
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbyid('${this.listId}')?$select=ListItemEntityTypeFullName`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error obteniendo entity type: ${response.status}`);
      }

      const data = await response.json();
      this.listEntityType = data.d.ListItemEntityTypeFullName;
      return this.listEntityType;
    } catch (error: any) {
      console.error('Error obteniendo entity type:', error);
      throw new Error(`Error obteniendo entity type: ${error.message}`);
    }
  }

  /**
   * Crea un item en la lista de SharePoint usando REST API
   */
  async createListItem(formData: FormData, userEmail?: string): Promise<string> {
    try {
      console.log('\n[SharePoint REST] Creando item...');

      const token = await this.getToken();
      const formDigest = await this.getFormDigest();
      const entityType = await this.getListEntityType();

      // Buscar el usuario en SharePoint si tenemos el email
      let authorId: number | null = null;
      if (userEmail) {
        console.log(`Buscando usuario en SharePoint: ${userEmail}`);
        authorId = await this.getUserIdByEmail(userEmail);
      }

      // Preparar campos
      const itemData: any = {
        __metadata: { type: entityType },
        Title: formData.numeroCredito,
        FechaNotificacion: formData.fechaNotificacion,
        DiasMora: formData.diasMora,
      };

      // Establecer el campo "usuario" (campo personalizado de tipo User)
      if (authorId) {
        itemData.usuarioId = authorId;
        console.log(`✓ Estableciendo campo usuario con ID: ${authorId}`);
      }

      // Agregar campos opcionales solo si tienen valor
      if (formData.fechaCompromiso && formData.fechaCompromiso.trim() !== '') {
        itemData.Compromiso = formData.fechaCompromiso;
      }

      if (formData.observaciones && formData.observaciones.trim() !== '') {
        itemData.Observaciones = formData.observaciones;
      }

      const url = `${this.siteUrl}/_api/web/lists/getbyid('${this.listId}')/items`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': formDigest,
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creando item:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const itemId = result.d.Id;

      console.log('✓ Item creado exitosamente, ID:', itemId);
      return itemId.toString();
    } catch (error: any) {
      console.error('Error creando item:', error);
      throw new Error(`Error creando item: ${error.message}`);
    }
  }

  /**
   * Adjunta un archivo a un item de la lista
   */
  async attachFileToItem(itemId: string, fileName: string, fileBuffer: Buffer): Promise<void> {
    try {
      console.log(`\n[SharePoint REST] Adjuntando archivo ${fileName} al item ${itemId}...`);

      const token = await this.getToken();
      const encodedFileName = encodeURIComponent(fileName);
      const url = `${this.siteUrl}/_api/web/lists/getbyid('${this.listId}')/items(${itemId})/AttachmentFiles/add(FileName='${encodedFileName}')`;

      console.log('  - URL:', url);
      console.log('  - File size:', fileBuffer.length, 'bytes');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      });

      console.log('  - Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error adjuntando archivo:', errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✓ Archivo adjuntado:', result.d.ServerRelativeUrl);
    } catch (error: any) {
      console.error('Error adjuntando archivo:', error);
      throw new Error(`Error adjuntando archivo: ${error.message}`);
    }
  }

  /**
   * Crea un item y adjunta múltiples archivos
   */
  async createItemWithAttachments(
    formData: FormData,
    files: Array<{ name: string; buffer: Buffer }>,
    userEmail?: string
  ): Promise<string> {
    try {
      // Crear el item con el email del usuario
      const itemId = await this.createListItem(formData, userEmail);

      // Adjuntar archivos si hay
      if (files && files.length > 0) {
        console.log(`\nAdjuntando ${files.length} archivo(s)...`);
        for (const file of files) {
          await this.attachFileToItem(itemId, file.name, file.buffer);
        }
        console.log('✓ Todos los archivos adjuntados exitosamente\n');
      }

      return itemId;
    } catch (error: any) {
      console.error('Error en createItemWithAttachments:', error);
      throw error;
    }
  }
}

// Factory function
export function createSharePointClient(): SharePointClient {
  return new SharePointClient();
}
