// Verificar el campo "usuario" en SharePoint
const fs = require('fs');
const path = require('path');
const { ClientCertificateCredential } = require('@azure/identity');

// Cargar .env
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

async function checkUsuarioField() {
  console.log('\n========================================');
  console.log('  Verificando campo "usuario"');
  console.log('========================================\n');

  try {
    const tenantId = process.env.GRAPH_TENANT_ID;
    const clientId = process.env.GRAPH_CLIENT_ID;
    const certPath = path.resolve(process.cwd(), process.env.GRAPH_CERTIFICATE_PATH);
    const siteUrl = process.env.SP_SITE_URL;
    const listId = process.env.SP_LIST_ID;

    // Crear credencial
    const credential = new ClientCertificateCredential(tenantId, clientId, certPath);

    // Obtener token
    const url = new URL(siteUrl);
    const sharePointDomain = `${url.protocol}//${url.hostname}`;
    const tokenResponse = await credential.getToken([`${sharePointDomain}/.default`]);
    const token = tokenResponse.token;

    // Obtener información de los campos de la lista
    const fieldsUrl = `${siteUrl}/_api/web/lists/getbyid('${listId}')/fields?$filter=substringof('usuario',Title) or substringof('Usuario',Title)`;

    console.log('Consultando campos...');
    const response = await fetch(fieldsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json;odata=verbose',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.d.results.length === 0) {
      console.log('❌ No se encontró ningún campo con "usuario" en el título');
      console.log('\nListando TODOS los campos de la lista:');

      // Obtener todos los campos
      const allFieldsUrl = `${siteUrl}/_api/web/lists/getbyid('${listId}')/fields?$select=Title,InternalName,TypeAsString`;
      const allResponse = await fetch(allFieldsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=verbose',
        },
      });

      const allData = await allResponse.json();
      allData.d.results.forEach(field => {
        console.log(`  - ${field.Title} (${field.InternalName}) [${field.TypeAsString}]`);
      });
    } else {
      console.log('✅ Campo(s) encontrado(s):\n');
      data.d.results.forEach(field => {
        console.log('Campo:', field.Title);
        console.log('  - Nombre Interno:', field.InternalName);
        console.log('  - Tipo:', field.TypeAsString);
        console.log('  - Requerido:', field.Required ? 'Sí' : 'No');
        if (field.TypeAsString === 'User' || field.TypeAsString === 'UserMulti') {
          console.log('  - Permite múltiples valores:', field.AllowMultipleValues ? 'Sí' : 'No');
          console.log('  - Selección:', field.SelectionMode || 'N/A');
        }
        console.log();
      });
    }

    console.log('========================================\n');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsuarioField();
