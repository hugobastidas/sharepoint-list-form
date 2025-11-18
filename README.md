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

## Configuración de Microsoft Graph

### Paso 1: Registrar aplicación en Azure AD

1. Ir a [Azure Portal](https://portal.azure.com)
2. Navegar a **Azure Active Directory** > **App registrations**
3. Hacer clic en **+ New registration**

#### Configuración del registro:

- **Name**: SharePoint List Form App
- **Supported account types**: Accounts in this organizational directory only
- **Redirect URI**: No es necesario para aplicaciones de servidor
- Hacer clic en **Register**

### Paso 2: Obtener credenciales

#### Obtener Tenant ID y Client ID:

1. En la página **Overview** de tu aplicación, copiar:
   - **Application (client) ID** → `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → `GRAPH_TENANT_ID`

#### Crear Client Secret:

1. Ir a **Certificates & secrets**
2. Hacer clic en **+ New client secret**
3. Agregar descripción: "SharePoint Form Secret"
4. Seleccionar expiración (recomendado: 24 meses)
5. Hacer clic en **Add**
6. **IMPORTANTE**: Copiar el **Value** inmediatamente → `GRAPH_CLIENT_SECRET`
   (No podrás verlo nuevamente)

### Paso 3: Configurar permisos API

1. Ir a **API permissions**
2. Hacer clic en **+ Add a permission**
3. Seleccionar **Microsoft Graph**
4. Seleccionar **Application permissions**
5. Agregar los siguientes permisos:

   ```
   Sites.ReadWrite.All       # Para leer/escribir en SharePoint
   Sites.Selected            # Alternativa más restrictiva (recomendado)
   ```

6. Hacer clic en **Add permissions**
7. **IMPORTANTE**: Hacer clic en **Grant admin consent for [tu organización]**
8. Confirmar el consentimiento

### Paso 4: Obtener SharePoint Site ID y List ID

#### Opción A: Usando Microsoft Graph Explorer

1. Ir a [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer)
2. Iniciar sesión con tu cuenta
3. Ejecutar query para obtener Site ID:

   ```
   GET https://graph.microsoft.com/v1.0/sites/{hostname}:/sites/{site-name}
   ```

   Ejemplo:
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/MiSitio
   ```

4. Copiar el `id` del sitio → `SP_SITE_ID`

5. Ejecutar query para obtener List ID:

   ```
   GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists
   ```

6. Buscar tu lista y copiar su `id` → `SP_LIST_ID`

#### Opción B: Usando PowerShell

```powershell
# Instalar módulo si no lo tienes
Install-Module -Name PnP.PowerShell

# Conectar a SharePoint
Connect-PnPOnline -Url "https://contoso.sharepoint.com/sites/MiSitio" -Interactive

# Obtener Site ID
$site = Get-PnPSite
$site.Id  # Este es tu SP_SITE_ID

# Obtener List ID
$list = Get-PnPList -Identity "NombreDeTuLista"
$list.Id  # Este es tu SP_LIST_ID
```

#### Opción C: Desde la URL de SharePoint

1. Ir a tu lista en SharePoint
2. La URL será algo como:
   ```
   https://contoso.sharepoint.com/sites/MiSitio/Lists/MiLista/AllItems.aspx
   ```
3. El Site ID y List ID requerirán consulta a Graph API usando el sitio web

### Paso 5: Configurar campos personalizados en SharePoint

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

#### Crear columnas en SharePoint:

1. Ir a tu lista en SharePoint Online
2. Hacer clic en **Settings** (engranaje) > **List settings**
3. En **Columns**, hacer clic en **Create column**
4. Para cada campo:
   - Ingresar nombre (exactamente como en la tabla)
   - Seleccionar tipo
   - Configurar como requerido si aplica
   - Hacer clic en **OK**

### Paso 6: Generar NEXTAUTH_SECRET

Generar una clave segura para JWT:

```bash
# En Linux/Mac:
openssl rand -base64 32

# En Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copiar el resultado en `.env` como `NEXTAUTH_SECRET`

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
