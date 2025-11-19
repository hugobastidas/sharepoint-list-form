// tests/test-sharepoint-integration.js
// Test de integración completo para SharePoint REST API

const fs = require('fs');
const path = require('path');
const { ClientCertificateCredential } = require('@azure/identity');

// Cargar variables de entorno
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

// Crear una imagen de prueba (1x1 pixel PNG)
function createTestImage() {
  // PNG de 1x1 pixel rojo
  const png = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
    0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB4, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  return png;
}

async function getToken(credential, siteUrl) {
  const url = new URL(siteUrl);
  const sharePointDomain = `${url.protocol}//${url.hostname}`;
  const tokenResponse = await credential.getToken([`${sharePointDomain}/.default`]);
  return tokenResponse.token;
}

async function getFormDigest(token, siteUrl) {
  const response = await fetch(`${siteUrl}/_api/contextinfo`, {
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
}

async function getListEntityType(token, siteUrl, listId) {
  const url = `${siteUrl}/_api/web/lists/getbyid('${listId}')?$select=ListItemEntityTypeFullName`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json;odata=verbose',
    },
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo entity type: ${response.status}`);
  }

  const data = await response.json();
  return data.d.ListItemEntityTypeFullName;
}

async function createItem(token, formDigest, siteUrl, listId, itemData) {
  const url = `${siteUrl}/_api/web/lists/getbyid('${listId}')/items`;

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
    throw new Error(`Error creando item: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.d.Id;
}

async function attachFile(token, siteUrl, listId, itemId, fileName, fileBuffer) {
  const encodedFileName = encodeURIComponent(fileName);
  const url = `${siteUrl}/_api/web/lists/getbyid('${listId}')/items(${itemId})/AttachmentFiles/add(FileName='${encodedFileName}')`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json;odata=verbose',
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error adjuntando archivo: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.d.ServerRelativeUrl;
}

async function testSharePointIntegration() {
  console.log('\n========================================');
  console.log('  Test de Integración SharePoint REST API');
  console.log('========================================\n');

  try {
    // 1. Verificar variables de entorno
    console.log('[1] Verificando configuración...');
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const certPath = path.resolve(process.cwd(), process.env.GRAPH_CERTIFICATE_PATH);
    const siteUrl = process.env.SP_SITE_URL;
    const listId = process.env.SP_LIST_ID;

    console.log('  - Tenant ID:', tenantId ? '✓' : '✗');
    console.log('  - Client ID:', clientId ? '✓' : '✗');
    console.log('  - Certificado:', fs.existsSync(certPath) ? '✓' : '✗');
    console.log('  - Site URL:', siteUrl || '✗');
    console.log('  - List ID:', listId ? '✓' : '✗');

    if (!tenantId || !clientId || !fs.existsSync(certPath) || !siteUrl || !listId) {
      throw new Error('Falta configuración en .env');
    }
    console.log();

    // 2. Crear credencial
    console.log('[2] Creando credencial con certificado...');
    const credential = new ClientCertificateCredential(
      tenantId,
      clientId,
      certPath
    );
    console.log('  ✓ Credencial creada');
    console.log();

    // 3. Obtener token
    console.log('[3] Obteniendo token de SharePoint...');
    const token = await getToken(credential, siteUrl);
    console.log('  ✓ Token obtenido (length:', token.length, ')');
    console.log();

    // 4. Obtener Form Digest
    console.log('[4] Obteniendo Form Digest...');
    const formDigest = await getFormDigest(token, siteUrl);
    console.log('  ✓ Form Digest obtenido');
    console.log();

    // 5. Obtener Entity Type de la lista
    console.log('[5] Obteniendo Entity Type de la lista...');
    const entityType = await getListEntityType(token, siteUrl, listId);
    console.log('  ✓ Entity Type:', entityType);
    console.log();

    // 6. Crear item de prueba
    console.log('[6] Creando item de prueba...');
    const timestamp = new Date().toISOString();
    const itemData = {
      __metadata: { type: entityType },
      Title: `TEST-${Date.now()}`,
      FechaNotificacion: timestamp,
      DiasMora: 1,
      Observaciones: 'Item creado por test de integración'
    };

    const itemId = await createItem(token, formDigest, siteUrl, listId, itemData);
    console.log('  ✓ Item creado exitosamente');
    console.log('  - Item ID:', itemId);
    console.log();

    // 7. Crear y adjuntar imagen de prueba
    console.log('[7] Adjuntando imagen de prueba...');
    const testImage = createTestImage();
    const fileName = `test-image-${Date.now()}.png`;

    const attachmentUrl = await attachFile(token, siteUrl, listId, itemId, fileName, testImage);
    console.log('  ✓ Imagen adjuntada exitosamente');
    console.log('  - File name:', fileName);
    console.log('  - File size:', testImage.length, 'bytes');
    console.log('  - Server URL:', attachmentUrl);
    console.log();

    console.log('========================================');
    console.log('✓ TEST COMPLETADO EXITOSAMENTE');
    console.log('========================================');
    console.log('\nResumen:');
    console.log('  - Item ID:', itemId);
    console.log('  - Archivo adjunto:', fileName);
    console.log('  - URL:', attachmentUrl);
    console.log('\nPuedes verificar en SharePoint:');
    console.log('  ', siteUrl);
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSharePointIntegration();
