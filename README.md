# SharePoint List Form - Next.js 14

Sistema completo de gestión de créditos con autenticación LDAP e integración con SharePoint Online mediante Microsoft Graph API.

## Características

- **Framework**: Next.js 14 con App Router
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS (Mobile-first)
- **Autenticación**: LDAP con JWT
- **Backend**: API Routes en Next.js
- **Integración**: Microsoft Graph para SharePoint Online
- **Adjuntos**: Soporte para hasta 5 imágenes por registro

## Estructura del Proyecto

```
sharepoint-list-form/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── ldap/
│   │   │   │   └── route.ts          # Endpoint de autenticación LDAP
│   │   │   └── logout/
│   │   │       └── route.ts          # Endpoint de cierre de sesión
│   │   └── sharepoint/
│   │       └── create/
│   │           └── route.ts          # Endpoint para crear items
│   ├── login/
│   │   └── page.tsx                  # Página de login
│   ├── form/
│   │   └── page.tsx                  # Formulario principal
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Página de inicio (redirect)
│   └── globals.css                   # Estilos globales
├── lib/
│   ├── auth.ts                       # Utilidades de autenticación JWT
│   ├── ldapClient.ts                 # Cliente LDAP
│   └── graphClient.ts                # Cliente Microsoft Graph
├── types/
│   └── global.d.ts                   # Tipos TypeScript
├── middleware.ts                     # Middleware de autenticación
├── .env.example                      # Plantilla de variables de entorno
├── package.json                      # Dependencias
├── tsconfig.json                     # Configuración TypeScript
├── tailwind.config.ts                # Configuración TailwindCSS
├── postcss.config.js                 # Configuración PostCSS
└── next.config.js                    # Configuración Next.js
```

## Instalación

### 1. Clonar el proyecto

```bash
git clone <url-del-repositorio>
cd sharepoint-list-form
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` con tus valores:

```env
# LDAP Configuration
LDAP_URL=ldap://localhost:389
LDAP_BASE_DN=OU=Users,DC=empresa,DC=local

# Microsoft Graph Configuration
GRAPH_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
GRAPH_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SharePoint Configuration
SP_SITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
SP_LIST_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Next Auth Secret
NEXTAUTH_SECRET=una_clave_segura_generada_aleatoriamente

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Configuración de Microsoft Graph (Guía Completa)

Esta sección te guiará paso a paso para configurar la integración con SharePoint Online mediante Microsoft Graph API.

### PASO 1: Registrar Aplicación en Azure AD

#### 1.1. Acceder al Portal de Azure

1. Abrir navegador e ir a [https://portal.azure.com](https://portal.azure.com)
2. Iniciar sesión con tu cuenta de Microsoft 365 (debe tener permisos de administrador)
3. Esperar a que cargue el panel de Azure

#### 1.2. Navegar a Azure Active Directory

1. En el menú lateral izquierdo, hacer clic en **Azure Active Directory**
   - Si no está visible, hacer clic en el menú hamburguesa (☰) arriba a la izquierda
   - También puedes buscarlo en la barra de búsqueda superior escribiendo "Azure Active Directory"

2. En el menú de Azure AD, buscar la sección **Manage** (Administrar)
3. Hacer clic en **App registrations** (Registros de aplicaciones)

#### 1.3. Crear Nuevo Registro de Aplicación

1. En la página de "App registrations", hacer clic en el botón **+ New registration** (+ Nuevo registro) en la parte superior

2. Completar el formulario de registro con los siguientes valores:

   **Name (Nombre):**
   ```
   SharePoint List Form App
   ```

   **Supported account types (Tipos de cuenta admitidos):**
   - Seleccionar: **Accounts in this organizational directory only (Solo cuentas de este directorio organizativo)**
   - Esto limita el acceso solo a usuarios de tu organización

   **Redirect URI (URI de redirección):**
   - Dejar en blanco (no es necesario para aplicaciones daemon/servidor)

3. Hacer clic en el botón **Register** (Registrar) en la parte inferior

4. **¡Éxito!** Serás redirigido a la página de información general de tu nueva aplicación

---

### PASO 2: Obtener Credenciales de Autenticación

#### 2.1. Copiar Application (Client) ID y Tenant ID

Ahora estás en la página **Overview** (Información general) de tu aplicación.

1. Localizar el panel de **Essentials** (Información esencial) en la parte superior
2. Buscar y copiar los siguientes valores:

   **Application (client) ID:**
   ```
   Ejemplo: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```
   - Copiar este valor completo
   - Pegarlo en tu archivo `.env` como: `GRAPH_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

   **Directory (tenant) ID:**
   ```
   Ejemplo: 9876fedc-ba98-7654-3210-fedcba987654
   ```
   - Copiar este valor completo
   - Pegarlo en tu archivo `.env` como: `GRAPH_TENANT_ID=9876fedc-ba98-7654-3210-fedcba987654`

#### 2.2. Generar Client Secret (Secreto de Cliente)

El Client Secret es como una contraseña para tu aplicación.

1. En el menú lateral izquierdo de tu aplicación, bajo **Manage** (Administrar):
   - Hacer clic en **Certificates & secrets** (Certificados y secretos)

2. En la pestaña **Client secrets** (Secretos de cliente):
   - Hacer clic en el botón **+ New client secret** (+ Nuevo secreto de cliente)

3. En el panel lateral que aparece:

   **Description (Descripción):**
   ```
   SharePoint Form Secret
   ```

   **Expires (Expira):**
   - Seleccionar **24 months (recommended)** (24 meses - recomendado)
   - Nota: Deberás renovarlo antes de que expire

4. Hacer clic en **Add** (Agregar)

5. **⚠️ MUY IMPORTANTE - SOLO LO VERÁS UNA VEZ:**
   - En la tabla de "Client secrets" verás tu nuevo secreto
   - Copiar el valor de la columna **Value** (NO copies el "Secret ID")
   - El valor se verá así: `abc123def456~ghi789.jkl012mno345pqr678`
   - Pegarlo INMEDIATAMENTE en tu archivo `.env` como: `GRAPH_CLIENT_SECRET=abc123def456~ghi789.jkl012mno345pqr678`
   - **Si no lo copias ahora, tendrás que crear uno nuevo**

---

### PASO 3: Configurar Permisos de Microsoft Graph API

#### 3.1. Agregar Permisos de Aplicación

1. En el menú lateral izquierdo, bajo **Manage** (Administrar):
   - Hacer clic en **API permissions** (Permisos de API)

2. Verás un permiso por defecto ("User.Read"). Lo dejaremos ahí.

3. Hacer clic en el botón **+ Add a permission** (+ Agregar un permiso)

4. En el panel lateral "Request API permissions":
   - Hacer clic en **Microsoft Graph** (el primer cuadro grande)

5. Seleccionar **Application permissions** (Permisos de aplicación):
   - **NO** selecciones "Delegated permissions"
   - Los permisos de aplicación permiten que la app funcione sin usuario conectado

6. En la barra de búsqueda, escribir: `Sites`

7. Expandir la sección **Sites** y marcar las siguientes casillas:

   **Opción A - Permiso Amplio (Más Fácil):**
   - ☑ **Sites.ReadWrite.All**
     - Descripción: "Have full control of all site collections"
     - Permite leer y escribir en TODAS las listas de SharePoint

   **Opción B - Permiso Restrictivo (Más Seguro):**
   - ☑ **Sites.Selected**
     - Descripción: "Access selected site collections"
     - Requiere configuración adicional para otorgar acceso solo a sitios específicos
     - Recomendado para producción

   > **Recomendación:** Usa `Sites.ReadWrite.All` para desarrollo/pruebas, y `Sites.Selected` para producción.

8. Hacer clic en **Add permissions** (Agregar permisos) en la parte inferior del panel

#### 3.2. Otorgar Consentimiento de Administrador

**⚠️ PASO CRÍTICO - Sin esto, los permisos no funcionarán:**

1. De vuelta en la página de "API permissions":
   - Verás una advertencia amarilla: "Not granted for [tu organización]"

2. Hacer clic en el botón **⚡ Grant admin consent for [tu organización]**
   - Ubicado arriba de la tabla de permisos

3. Aparecerá un cuadro de diálogo de confirmación:
   - Leer los permisos solicitados
   - Hacer clic en **Yes** (Sí)

4. **Verificar éxito:**
   - Los iconos de estado deben cambiar a marcas verdes (✓)
   - La columna "Status" debe mostrar: "Granted for [tu organización]"

#### 3.3. Configuración Adicional para Sites.Selected (Opcional)

Si elegiste usar `Sites.Selected`, debes otorgar acceso específico a tu sitio de SharePoint:

```powershell
# Instalar módulo PnP si no lo tienes
Install-Module -Name PnP.PowerShell -Scope CurrentUser

# Conectar a tu tenant
Connect-PnPOnline -Url "https://[tu-tenant]-admin.sharepoint.com" -Interactive

# Otorgar permiso write a la aplicación para un sitio específico
Grant-PnPAzureADAppSitePermission -AppId "TU_CLIENT_ID_AQUÍ" `
  -DisplayName "SharePoint Form App" `
  -Site "https://[tu-tenant].sharepoint.com/sites/MiSitio" `
  -Permissions Write
```

---

### PASO 4: Obtener SharePoint Site ID y List ID

Necesitas identificar tu sitio de SharePoint y la lista donde se guardarán los datos.

#### 4.1. Opción A: Usando Microsoft Graph Explorer (Recomendado)

**Paso 4.1.1 - Obtener el Site ID:**

1. Ir a [Microsoft Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)

2. Hacer clic en **Sign in to Graph Explorer** e iniciar sesión con tu cuenta de Microsoft 365

3. En el panel izquierdo, otorgar los permisos necesarios:
   - Hacer clic en **Modify permissions**
   - Buscar y activar: `Sites.Read.All`
   - Hacer clic en **Consent**

4. Primero, necesitas la URL completa de tu sitio de SharePoint:
   - Formato: `https://[tu-tenant].sharepoint.com/sites/[nombre-sitio]`
   - Ejemplo: `https://contoso.sharepoint.com/sites/GestionCreditos`

5. En la barra de solicitud de Graph Explorer, cambiar el método a **GET**

6. Construir la URL de consulta:
   ```
   GET https://graph.microsoft.com/v1.0/sites/[tu-tenant].sharepoint.com:/sites/[nombre-sitio]
   ```

   **Ejemplo real:**
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/GestionCreditos
   ```

7. Hacer clic en **Run query** (Ejecutar consulta)

8. En la respuesta JSON, buscar el campo `"id"`:
   ```json
   {
     "id": "contoso.sharepoint.com,abc12345-def6-7890-ghij-klmnopqrstuv,98765432-fedc-ba98-7654-321098765432",
     "displayName": "Gestion Creditos",
     "webUrl": "https://contoso.sharepoint.com/sites/GestionCreditos",
     ...
   }
   ```

9. **Copiar el valor completo del `"id"`** (la cadena larga con comas):
   - Pegarlo en `.env` como: `SP_SITE_ID=contoso.sharepoint.com,abc12345-def6-7890-ghij-klmnopqrstuv,98765432-fedc-ba98-7654-321098765432`

**Paso 4.1.2 - Obtener el List ID:**

1. Ahora que tienes el Site ID, construir una nueva consulta para listar todas las listas:
   ```
   GET https://graph.microsoft.com/v1.0/sites/[SITE_ID_COMPLETO]/lists
   ```

   **Ejemplo real:**
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,abc12345-def6-7890-ghij-klmnopqrstuv,98765432-fedc-ba98-7654-321098765432/lists
   ```

2. Hacer clic en **Run query**

3. La respuesta mostrará todas las listas del sitio:
   ```json
   {
     "value": [
       {
         "id": "b57e4f4e-3456-4321-abcd-123456789abc",
         "displayName": "Creditos",
         "name": "Creditos",
         "list": { "template": "genericList" }
       },
       ...
     ]
   }
   ```

4. Buscar tu lista por el `"displayName"` o `"name"`

5. **Copiar el valor del `"id"` de tu lista:**
   - Pegarlo en `.env` como: `SP_LIST_ID=b57e4f4e-3456-4321-abcd-123456789abc`

#### 4.2. Opción B: Usando PowerShell (PnP)

Si prefieres usar PowerShell, sigue estos pasos:

```powershell
# 1. Instalar módulo PnP.PowerShell
Install-Module -Name PnP.PowerShell -Scope CurrentUser -Force

# 2. Conectar a tu sitio de SharePoint
$siteUrl = "https://[tu-tenant].sharepoint.com/sites/[nombre-sitio]"
Connect-PnPOnline -Url $siteUrl -Interactive

# 3. Obtener Site ID
$site = Get-PnPSite -Includes Id
Write-Host "Site ID: $($site.Id)" -ForegroundColor Green
# Copiar este valor a SP_SITE_ID

# 4. Obtener List ID
$listName = "Creditos"  # Cambiar por el nombre de tu lista
$list = Get-PnPList -Identity $listName
Write-Host "List ID: $($list.Id)" -ForegroundColor Green
# Copiar este valor a SP_LIST_ID

# 5. Listar todas las listas disponibles (opcional)
Get-PnPList | Select-Object Title, Id | Format-Table
```

#### 4.3. Opción C: Usando cURL desde Terminal

Si tienes acceso a un token de autenticación:

```bash
# 1. Obtener Site ID
curl -X GET \
  'https://graph.microsoft.com/v1.0/sites/[tu-tenant].sharepoint.com:/sites/[nombre-sitio]' \
  -H 'Authorization: Bearer [TU_TOKEN]' \
  | jq '.id'

# 2. Obtener List ID (reemplazar SITE_ID con el valor obtenido)
curl -X GET \
  'https://graph.microsoft.com/v1.0/sites/[SITE_ID]/lists' \
  -H 'Authorization: Bearer [TU_TOKEN]' \
  | jq '.value[] | {name: .displayName, id: .id}'
```

#### 4.4. Verificar IDs Obtenidos

Para verificar que los IDs son correctos, ejecuta esta consulta en Graph Explorer:

```
GET https://graph.microsoft.com/v1.0/sites/[SP_SITE_ID]/lists/[SP_LIST_ID]
```

Deberías obtener información de tu lista. Si obtienes un error 404, los IDs son incorrectos.

---

### PASO 5: Configurar Campos Personalizados en SharePoint

La lista de SharePoint debe tener las siguientes columnas:

| Nombre Interno    | Tipo de Campo      | Requerido | Descripción                    |
|-------------------|-------------------|-----------|--------------------------------|
| Title             | Single line text  | Sí        | Campo por defecto de SharePoint|
| numeroCredito     | Single line text  | Sí        | Número de crédito              |
| fechaNotificacion | Date              | Sí        | Fecha de notificación          |
| gps               | Single line text  | No        | Coordenadas GPS                |
| diasMora          | Number            | Sí        | Días de mora                   |
| fechaCompromiso   | Date              | No        | Fecha de compromiso de pago    |
| observaciones     | Multiple lines    | No        | Observaciones adicionales      |
| usuario           | Single line text  | Sí        | Usuario que crea el registro   |

#### 5.1. Crear la Lista en SharePoint

1. Ir a tu sitio de SharePoint (ej: `https://[tu-tenant].sharepoint.com/sites/[nombre-sitio]`)

2. En la barra superior, hacer clic en **⚙ Settings** (engranaje) > **Site contents** (Contenido del sitio)

3. Hacer clic en **+ New** > **List** (Lista)

4. Seleccionar **Blank list** (Lista en blanco)

5. Configurar:
   - **Name**: `Creditos` (o el nombre que prefieras)
   - **Description**: `Lista para gestión de créditos con información de mora y adjuntos`
   - Hacer clic en **Create** (Crear)

#### 5.2. Crear Columnas Personalizadas

**⚠️ IMPORTANTE:** Los nombres de las columnas deben ser **EXACTAMENTE** iguales a los especificados (respetando mayúsculas/minúsculas).

**Columna 1: numeroCredito**

1. En tu lista, hacer clic en **+ Add column** (+ Agregar columna)
2. Seleccionar **Single line of text** (Una sola línea de texto)
3. Configurar:
   - **Name**: `numeroCredito`
   - **Require that this column contains information**: ✓ Yes
   - Hacer clic en **Save** (Guardar)

**Columna 2: fechaNotificacion**

1. Hacer clic en **+ Add column** > **Date and time** (Fecha y hora)
2. Configurar:
   - **Name**: `fechaNotificacion`
   - **Include time**: ☐ No (solo fecha)
   - **Require that this column contains information**: ✓ Yes
   - Hacer clic en **Save**

**Columna 3: gps**

1. Hacer clic en **+ Add column** > **Single line of text**
2. Configurar:
   - **Name**: `gps`
   - **Require that this column contains information**: ☐ No
   - **Maximum number of characters**: 255
   - Hacer clic en **Save**

**Columna 4: diasMora**

1. Hacer clic en **+ Add column** > **Number** (Número)
2. Configurar:
   - **Name**: `diasMora`
   - **Number type**: **Number** (not decimal)
   - **Minimum value**: 0
   - **Require that this column contains information**: ✓ Yes
   - Hacer clic en **Save**

**Columna 5: fechaCompromiso**

1. Hacer clic en **+ Add column** > **Date and time**
2. Configurar:
   - **Name**: `fechaCompromiso`
   - **Include time**: ☐ No
   - **Require that this column contains information**: ☐ No
   - Hacer clic en **Save**

**Columna 6: observaciones**

1. Hacer clic en **+ Add column** > **Multiple lines of text** (Varias líneas de texto)
2. Configurar:
   - **Name**: `observaciones`
   - **Specify the type of text to allow**: **Plain text**
   - **Number of lines for editing**: 6
   - **Require that this column contains information**: ☐ No
   - Hacer clic en **Save**

**Columna 7: usuario**

1. Hacer clic en **+ Add column** > **Single line of text**
2. Configurar:
   - **Name**: `usuario`
   - **Require that this column contains information**: ✓ Yes
   - Hacer clic en **Save**

#### 5.3. Verificar Columnas Creadas

1. En tu lista, hacer clic en **⚙ Settings** > **List settings** (Configuración de la lista)

2. En la sección **Columns** (Columnas), verificar que existan:
   - Title
   - numeroCredito
   - fechaNotificacion
   - gps
   - diasMora
   - fechaCompromiso
   - observaciones
   - usuario

3. **Verificar nombres exactos:** Si algún nombre no coincide exactamente, la aplicación fallará.

#### 5.4. Script PowerShell para Crear Columnas (Alternativa)

Si prefieres automatizar la creación de columnas:

```powershell
# Conectar a SharePoint
Connect-PnPOnline -Url "https://[tu-tenant].sharepoint.com/sites/[nombre-sitio]" -Interactive

# Crear la lista
New-PnPList -Title "Creditos" -Template GenericList

# Agregar columnas
Add-PnPField -List "Creditos" -DisplayName "numeroCredito" -InternalName "numeroCredito" -Type Text -Required
Add-PnPField -List "Creditos" -DisplayName "fechaNotificacion" -InternalName "fechaNotificacion" -Type DateTime -Required
Add-PnPField -List "Creditos" -DisplayName "gps" -InternalName "gps" -Type Text
Add-PnPField -List "Creditos" -DisplayName "diasMora" -InternalName "diasMora" -Type Number -Required
Add-PnPField -List "Creditos" -DisplayName "fechaCompromiso" -InternalName "fechaCompromiso" -Type DateTime
Add-PnPField -List "Creditos" -DisplayName "observaciones" -InternalName "observaciones" -Type Note
Add-PnPField -List "Creditos" -DisplayName "usuario" -InternalName "usuario" -Type Text -Required

Write-Host "Lista y columnas creadas exitosamente!" -ForegroundColor Green
```

---

### PASO 6: Generar NEXTAUTH_SECRET

Generar una clave segura para JWT:

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copiar el resultado en `.env` como `NEXTAUTH_SECRET`

---

### PASO 7: Verificar y Probar la Configuración de Microsoft Graph

#### 7.1. Checklist de Configuración Completa

Antes de ejecutar la aplicación, verifica que tengas todos estos valores:

| Variable de Entorno     | ¿Configurada? | Ejemplo de Formato                                    |
|-------------------------|---------------|-------------------------------------------------------|
| GRAPH_TENANT_ID         | ☐             | `9876fedc-ba98-7654-3210-fedcba987654`               |
| GRAPH_CLIENT_ID         | ☐             | `a1b2c3d4-e5f6-7890-abcd-ef1234567890`               |
| GRAPH_CLIENT_SECRET     | ☐             | `abc123def456~ghi789.jkl012mno345pqr678`             |
| SP_SITE_ID              | ☐             | `contoso.sharepoint.com,abc12...,98765...`           |
| SP_LIST_ID              | ☐             | `b57e4f4e-3456-4321-abcd-123456789abc`               |

**Permisos en Azure AD:**
- ☐ Sites.ReadWrite.All o Sites.Selected agregado
- ☐ Consentimiento de administrador otorgado (marcas verdes en Azure Portal)

**Lista de SharePoint:**
- ☐ Lista creada en SharePoint
- ☐ Todas las columnas creadas (7 columnas + Title)
- ☐ Nombres de columnas exactamente iguales (mayúsculas/minúsculas)

#### 7.2. Script de Prueba de Conexión (PowerShell)

Guarda este script como `test-graph-connection.ps1` y ejecútalo para verificar la conexión:

```powershell
# test-graph-connection.ps1
# Script para verificar la configuración de Microsoft Graph

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantId,

    [Parameter(Mandatory=$true)]
    [string]$ClientId,

    [Parameter(Mandatory=$true)]
    [string]$ClientSecret,

    [Parameter(Mandatory=$true)]
    [string]$SiteId,

    [Parameter(Mandatory=$true)]
    [string]$ListId
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Test de Conexión Microsoft Graph  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Obtener token de acceso
Write-Host "[1/4] Obteniendo token de acceso..." -ForegroundColor Yellow

$tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
$body = @{
    client_id     = $ClientId
    scope         = "https://graph.microsoft.com/.default"
    client_secret = $ClientSecret
    grant_type    = "client_credentials"
}

try {
    $tokenResponse = Invoke-RestMethod -Method Post -Uri $tokenUrl -Body $body -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    Write-Host "✓ Token obtenido exitosamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error obteniendo token: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Probar acceso al sitio
Write-Host "[2/4] Probando acceso al sitio..." -ForegroundColor Yellow

$siteUrl = "https://graph.microsoft.com/v1.0/sites/$SiteId"
$headers = @{
    Authorization = "Bearer $accessToken"
}

try {
    $siteResponse = Invoke-RestMethod -Method Get -Uri $siteUrl -Headers $headers
    Write-Host "✓ Sitio accesible: $($siteResponse.displayName)" -ForegroundColor Green
    Write-Host "  URL: $($siteResponse.webUrl)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error accediendo al sitio: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Verifica que SP_SITE_ID sea correcto" -ForegroundColor Red
    exit 1
}

# 3. Probar acceso a la lista
Write-Host "[3/4] Probando acceso a la lista..." -ForegroundColor Yellow

$listUrl = "https://graph.microsoft.com/v1.0/sites/$SiteId/lists/$ListId"

try {
    $listResponse = Invoke-RestMethod -Method Get -Uri $listUrl -Headers $headers
    Write-Host "✓ Lista accesible: $($listResponse.displayName)" -ForegroundColor Green
    Write-Host "  Nombre: $($listResponse.name)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Error accediendo a la lista: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Verifica que SP_LIST_ID sea correcto" -ForegroundColor Red
    exit 1
}

# 4. Verificar columnas
Write-Host "[4/4] Verificando columnas..." -ForegroundColor Yellow

$columnsUrl = "https://graph.microsoft.com/v1.0/sites/$SiteId/lists/$ListId/columns"

try {
    $columnsResponse = Invoke-RestMethod -Method Get -Uri $columnsUrl -Headers $headers
    $columnNames = $columnsResponse.value | Select-Object -ExpandProperty name

    $requiredColumns = @("Title", "numeroCredito", "fechaNotificacion", "gps", "diasMora", "fechaCompromiso", "observaciones", "usuario")
    $missingColumns = @()

    foreach ($required in $requiredColumns) {
        if ($columnNames -notcontains $required) {
            $missingColumns += $required
        }
    }

    if ($missingColumns.Count -eq 0) {
        Write-Host "✓ Todas las columnas necesarias están presentes" -ForegroundColor Green
        Write-Host ""
        Write-Host "Columnas encontradas:" -ForegroundColor Gray
        $requiredColumns | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    } else {
        Write-Host "✗ Faltan columnas:" -ForegroundColor Red
        $missingColumns | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
        Write-Host ""
        Write-Host "Por favor, crea estas columnas en SharePoint" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Error verificando columnas: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  ✓ CONFIGURACIÓN EXITOSA           " -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tu configuración de Microsoft Graph está correcta." -ForegroundColor Green
Write-Host "Puedes proceder a ejecutar la aplicación con 'npm run dev'" -ForegroundColor Green
```

**Ejecutar el script:**

```powershell
# Cargar variables desde .env (si usas PowerShell 7+)
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# Ejecutar test
.\test-graph-connection.ps1 `
  -TenantId $env:GRAPH_TENANT_ID `
  -ClientId $env:GRAPH_CLIENT_ID `
  -ClientSecret $env:GRAPH_CLIENT_SECRET `
  -SiteId $env:SP_SITE_ID `
  -ListId $env:SP_LIST_ID
```

#### 7.3. Probar desde Node.js (Alternativa)

Crea un archivo `test-graph.js` en la raíz del proyecto:

```javascript
// test-graph.js
require('dotenv').config();
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

async function testGraphConnection() {
  console.log('\n=====================================');
  console.log('  Test de Conexión Microsoft Graph  ');
  console.log('=====================================\n');

  try {
    // 1. Crear credenciales
    console.log('[1/4] Creando credenciales...');
    const credential = new ClientSecretCredential(
      process.env.GRAPH_TENANT_ID,
      process.env.GRAPH_CLIENT_ID,
      process.env.GRAPH_CLIENT_SECRET
    );
    console.log('✓ Credenciales creadas\n');

    // 2. Crear cliente Graph
    console.log('[2/4] Creando cliente Graph...');
    const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });
    const client = Client.initWithMiddleware({ authProvider });
    console.log('✓ Cliente creado\n');

    // 3. Probar acceso al sitio
    console.log('[3/4] Probando acceso al sitio...');
    const site = await client.api(`/sites/${process.env.SP_SITE_ID}`).get();
    console.log(`✓ Sitio: ${site.displayName}`);
    console.log(`  URL: ${site.webUrl}\n`);

    // 4. Probar acceso a la lista
    console.log('[4/4] Probando acceso a la lista...');
    const list = await client.api(`/sites/${process.env.SP_SITE_ID}/lists/${process.env.SP_LIST_ID}`).get();
    console.log(`✓ Lista: ${list.displayName}`);
    console.log(`  Nombre: ${list.name}\n`);

    console.log('=====================================');
    console.log('  ✓ CONFIGURACIÓN EXITOSA           ');
    console.log('=====================================\n');
    console.log('Tu configuración de Microsoft Graph está correcta.');

  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
  }
}

testGraphConnection();
```

**Ejecutar:**

```bash
node test-graph.js
```

#### 7.4. Troubleshooting de Microsoft Graph

**Error: "Invalid client secret"**
- El Client Secret expiró o es incorrecto
- Solución: Crear un nuevo Client Secret en Azure Portal

**Error: "Insufficient privileges"**
- Los permisos no están otorgados correctamente
- Solución: Verificar que Sites.ReadWrite.All tenga consentimiento de administrador (marca verde)

**Error: "Resource not found" al acceder al sitio**
- El SP_SITE_ID es incorrecto
- Solución: Volver a obtener el Site ID usando Graph Explorer

**Error: "Resource not found" al acceder a la lista**
- El SP_LIST_ID es incorrecto
- Solución: Volver a obtener el List ID usando Graph Explorer

**Error: "The provided value for column 'X' is invalid"**
- El nombre de la columna en SharePoint no coincide exactamente
- Solución: Verificar que los nombres de columnas sean exactos (mayúsculas/minúsculas)

**Error: "Access denied"**
- La aplicación no tiene permisos en el sitio específico (cuando usas Sites.Selected)
- Solución: Ejecutar `Grant-PnPAzureADAppSitePermission` (ver sección 3.3)

---

### Resumen de Configuración de Microsoft Graph

Al completar todos los pasos, tu archivo `.env` debería verse así:

```env
# LDAP Configuration
LDAP_URL=ldap://ad.empresa.local:389
LDAP_BASE_DN=OU=Usuarios,DC=empresa,DC=local

# Microsoft Graph Configuration
GRAPH_TENANT_ID=9876fedc-ba98-7654-3210-fedcba987654
GRAPH_CLIENT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
GRAPH_CLIENT_SECRET=abc123def456~ghi789.jkl012mno345pqr678

# SharePoint Configuration
SP_SITE_ID=contoso.sharepoint.com,abc12345-def6-7890-ghij-klmnopqrstuv,98765432-fedc-ba98-7654-321098765432
SP_LIST_ID=b57e4f4e-3456-4321-abcd-123456789abc

# Next Auth Secret
NEXTAUTH_SECRET=TU_SECRET_GENERADO_AQUI

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Lista de verificación final:**
- ☐ Aplicación registrada en Azure AD
- ☐ Client ID, Tenant ID y Client Secret obtenidos
- ☐ Permisos Sites.ReadWrite.All configurados con consentimiento de administrador
- ☐ Site ID obtenido de SharePoint
- ☐ List ID obtenido de SharePoint
- ☐ Lista creada en SharePoint con las 8 columnas correctas
- ☐ Todas las variables configuradas en `.env`
- ☐ Script de prueba ejecutado exitosamente

**¡Listo!** Ahora puedes ejecutar `npm run dev` y usar la aplicación.

---

## Configuración de LDAP

### Configurar servidor LDAP

Las variables de entorno LDAP:

```env
LDAP_URL=ldap://servidor-ldap:389
LDAP_BASE_DN=OU=Users,DC=empresa,DC=local
```

#### Ejemplo para Active Directory:

```env
LDAP_URL=ldap://ad.empresa.local:389
LDAP_BASE_DN=OU=Usuarios,DC=empresa,DC=local
```

#### Ejemplo para OpenLDAP:

```env
LDAP_URL=ldap://ldap.empresa.local:389
LDAP_BASE_DN=ou=people,dc=empresa,dc=local
```

### Probar conexión LDAP

El sistema construye el DN del usuario como:

```
CN={username},{LDAP_BASE_DN}
```

Si tu estructura es diferente, modifica `lib/ldapClient.ts` línea 21:

```typescript
// Ejemplo: si usas uid en lugar de CN
const userDN = `uid=${username},${this.baseDN}`;
```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

### Modo producción

```bash
npm run build
npm start
```

## Uso de la Aplicación

### 1. Login

1. Abrir `http://localhost:3000`
2. Serás redirigido a `/login`
3. Ingresar credenciales LDAP
4. Al autenticarte, serás redirigido a `/form`

### 2. Crear registro

1. Completar los campos del formulario:
   - **Número de Crédito** (requerido)
   - **Fecha de Notificación** (requerido)
   - **GPS** (opcional)
   - **Días de Mora** (requerido)
   - **Fecha de Compromiso** (opcional)
   - **Observaciones** (opcional)
   - **Usuario** (requerido)

2. Adjuntar imágenes (opcional):
   - Click en el área de adjuntos
   - Seleccionar hasta 5 imágenes
   - Máximo 5MB por imagen
   - Formatos soportados: JPG, PNG, GIF, etc.

3. Hacer clic en **Enviar Registro**

4. El sistema:
   - Creará el item en SharePoint
   - Adjuntará las imágenes al item
   - Mostrará mensaje de éxito con el ID del item

### 3. Cerrar sesión

Hacer clic en **Cerrar Sesión** en la esquina superior derecha

## Flujo de Datos

```
┌─────────┐     LDAP Auth      ┌──────────────┐
│ Usuario │ ──────────────────>│ /api/auth/   │
│ (Login) │ <──────────────────│    ldap      │
└─────────┘    JWT Cookie      └──────────────┘
                                        │
                                        ▼
┌─────────┐   Form + Files    ┌──────────────┐    Graph API    ┌────────────┐
│ Usuario │ ──────────────────>│ /api/share-  │ ──────────────> │ SharePoint │
│ (Form)  │ <──────────────────│   point/     │ <────────────── │   Online   │
└─────────┘   Success/Error    │   create     │   Item + Files  └────────────┘
                                └──────────────┘
```

## Seguridad

- **Autenticación**: LDAP con validación de credenciales
- **Sesión**: JWT almacenado en cookie HttpOnly
- **Middleware**: Protección de rutas privadas
- **Validaciones**: Tamaño y tipo de archivos
- **HTTPS**: Recomendado en producción
- **Variables de entorno**: Credenciales nunca expuestas al frontend

## Troubleshooting

### Error: "Faltan variables de entorno de Graph"

Verificar que todas las variables en `.env` estén configuradas correctamente.

### Error: "Credenciales inválidas" (LDAP)

- Verificar que `LDAP_URL` sea accesible
- Verificar que `LDAP_BASE_DN` sea correcto
- Probar credenciales con otra herramienta LDAP

### Error: "Error creando item en SharePoint"

- Verificar que los permisos de Graph estén otorgados
- Verificar que `SP_SITE_ID` y `SP_LIST_ID` sean correctos
- Verificar que las columnas existan en la lista de SharePoint
- Revisar logs del servidor con `console.log`

### Error: "Token inválido"

- Generar nuevo `NEXTAUTH_SECRET`
- Limpiar cookies del navegador
- Volver a iniciar sesión

### Error de CORS en producción

Configurar en `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'tu-dominio.com' },
      ],
    },
  ];
}
```

## Deployment

### Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel Dashboard
```

### Docker

Crear `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build y run:

```bash
docker build -t sharepoint-form .
docker run -p 3000:3000 --env-file .env sharepoint-form
```

## Personalización

### Agregar más campos

1. Agregar campo en SharePoint
2. Actualizar tipo `FormData` en `types/global.d.ts`
3. Agregar input en `app/form/page.tsx`
4. Incluir campo en `app/api/sharepoint/create/route.ts`

### Cambiar estilos

Todos los estilos están en:
- `app/globals.css` (clases utilitarias)
- `tailwind.config.ts` (tema)
- Componentes individuales (clases inline)

### Modificar validaciones

Editar:
- Frontend: `app/form/page.tsx`
- Backend: `app/api/sharepoint/create/route.ts`

## Licencia

Este proyecto es de código abierto para uso interno.

## Soporte

Para problemas o preguntas:
1. Revisar este README
2. Revisar logs del servidor
3. Contactar al administrador del sistema
