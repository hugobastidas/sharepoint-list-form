# SharePoint List Form - Next.js 14

Aplicación web para gestión de créditos con autenticación LDAP e integración con SharePoint Online mediante REST API.

## Stack Tecnológico

- **Framework**: Next.js 14 con App Router y TypeScript
- **Autenticación**: LDAP (Active Directory)
- **SharePoint**: REST API con autenticación por certificado
- **UI**: TailwindCSS (diseño mobile-first)
- **Adjuntos**: Hasta 5 imágenes por registro

## Instalación

```bash
# Clonar e instalar dependencias
git clone <url-del-repositorio>
cd sharepoint-list-form
npm install
```

## Configuración

### 1. Variables de Entorno

Crear archivo `.env` con las siguientes variables:

```env
# LDAP Configuration
LDAP_SERVER=servidor-ad.empresa.local
LDAP_PORT=389
LDAP_DOMAIN=empresa.local
LDAP_USE_SSL=False
LDAP_BASE_DN=DC=empresa,DC=local
LDAP_USER_SEARCH_BASE=DC=empresa,DC=local
LDAP_USER_SEARCH_FILTER=(&(&(objectClass=user)(objectCategory=person))(!(userAccountControl:1.2.840.113556.1.4.803:=2))(sAMAccountName={username}))

# Azure AD App Configuration
GRAPH_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CERTIFICATE_PATH=./sharepoint-app-cert.pem

# SharePoint Configuration
SP_SITE_URL=https://tenant.sharepoint.com/sites/SiteName
SP_LIST_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Next Auth
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configurar Azure AD App

1. **Registrar aplicación en Azure AD:**
   - Portal Azure → Azure Active Directory → App registrations → New registration
   - Name: `SharePoint List Form App`
   - Supported account types: Single tenant
   - Redirect URI: (dejar en blanco)

2. **Generar certificado:**
```bash
# Generar certificado autofirmado
openssl req -x509 -newkey rsa:2048 -keyout cert.key -out cert.crt -days 365 -nodes

# Combinar en formato PEM
cat cert.key cert.crt > sharepoint-app-cert.pem
```

3. **Subir certificado a Azure AD:**
   - App registration → Certificates & secrets → Certificates tab
   - Upload: subir el archivo `cert.crt`
   - Copiar el Thumbprint (SHA-1)

4. **Configurar permisos:**
   - App registration → API permissions → Add permission
   - SharePoint → Application permissions → `Sites.FullControl.All`
   - Grant admin consent (botón verde)

5. **Copiar credenciales a .env:**
   - Application (client) ID → `GRAPH_CLIENT_ID`
   - Directory (tenant) ID → `GRAPH_TENANT_ID`
   - Certificado PEM → `GRAPH_CERTIFICATE_PATH`

### 3. Obtener SharePoint Site URL y List ID

**Opción A: Microsoft Graph Explorer**

1. Ir a [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Iniciar sesión y otorgar permisos `Sites.Read.All`

3. **Obtener Site URL:**
   - Tu sitio: `https://tenant.sharepoint.com/sites/SiteName`
   - Usar directamente en `.env` como `SP_SITE_URL`

4. **Obtener List ID:**
```
GET https://graph.microsoft.com/v1.0/sites/tenant.sharepoint.com:/sites/SiteName:/lists
```
   - Buscar tu lista por nombre
   - Copiar el `id` a `.env` como `SP_LIST_ID`

**Opción B: PowerShell**

```powershell
# Conectar a SharePoint
Connect-PnPOnline -Url "https://tenant.sharepoint.com/sites/SiteName" -Interactive

# Obtener List ID
$list = Get-PnPList -Identity "NombreLista"
Write-Host "List ID: $($list.Id)"
```

### 4. Configurar Lista de SharePoint

La lista debe tener estas columnas (nombres exactos):

| Columna           | Tipo             | Requerido | Notas                           |
|-------------------|------------------|-----------|---------------------------------|
| Title             | Single line text | Sí        | Se usa numeroCredito            |
| FechaNotificacion | Date             | Sí        |                                 |
| DiasMora          | Number           | Sí        |                                 |
| Compromiso        | Date             | No        |                                 |
| Observaciones     | Multiple lines   | No        |                                 |
| usuario           | Person or Group  | No        | Muestra quién creó el registro  |

**Configuración del campo "usuario":**
1. Crear columna tipo "Person or Group"
2. Nombre: `usuario`
3. Permitir seleccionar: Solo personas
4. Mostrar: Nombre (con presencia) y foto
5. Permitir múltiples valores: No

**Nota:** La aplicación usa la funcionalidad nativa de adjuntos de SharePoint Lists.

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Pruebas

Ejecutar el test de integración para verificar la configuración:

```bash
node tests/test-sharepoint-integration.js
```

Este test:
- Verifica la autenticación con certificado
- Crea un item de prueba en SharePoint
- Adjunta una imagen de prueba
- Confirma que todo funciona correctamente

## Uso

1. **Login:** Ingresar con credenciales LDAP (username@domain)
2. **Formulario:** Completar campos requeridos y adjuntar imágenes (opcional)
3. **Enviar:** El registro se crea en SharePoint con adjuntos

## Troubleshooting

**Error: "No se pudo obtener token"**
- Verificar que el certificado PEM esté en la ruta correcta
- Verificar `GRAPH_TENANT_ID` y `GRAPH_CLIENT_ID`
- Verificar que el certificado en Azure coincida con el local

**Error: "Error creando item"**
- Verificar `SP_SITE_URL` (debe incluir /sites/SiteName)
- Verificar `SP_LIST_ID`
- Verificar que los nombres de columnas en SharePoint coincidan exactamente

**Error: "Unsupported security token"**
- Verificar que el permiso `Sites.FullControl.All` tenga consentimiento de administrador
- Esperar 30 minutos después de subir el certificado (propagación)

## Arquitectura

```
Usuario → Login (LDAP) → JWT Cookie → Form → API Route → SharePoint REST API
```

La aplicación usa **solo SharePoint REST API** (no Microsoft Graph) para:
- Crear items en la lista
- Adjuntar archivos a items

Esto simplifica la arquitectura y elimina dependencias innecesarias.

## Estructura del Proyecto

```
sharepoint-list-form/
├── app/
│   ├── api/
│   │   ├── auth/ldap/          # Autenticación LDAP
│   │   └── sharepoint/create/  # Crear items en SharePoint
│   ├── login/                  # Página de login
│   └── form/                   # Formulario principal
├── lib/
│   ├── auth.ts                 # Utilidades JWT
│   ├── ldapClient.ts           # Cliente LDAP
│   └── sharePointClient.ts     # Cliente SharePoint REST API
├── tests/
│   └── test-sharepoint-integration.js  # Test de integración
└── .env                        # Variables de entorno
```

## Seguridad

- Autenticación LDAP con validación de cuentas activas
- JWT en cookies HttpOnly
- Middleware de protección de rutas
- Validación de tipos y tamaños de archivos
- Certificado para autenticación con SharePoint

## Licencia

Código abierto para uso interno.
