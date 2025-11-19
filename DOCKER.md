# Despliegue con Docker

Esta aplicación incluye una configuración completa de Docker con Nginx como proxy reverso y soporte SSL.

## Arquitectura

```
Internet → Nginx (Puerto 443/SSL) → Next.js App (Puerto 3000)
```

- **Nginx**: Proxy reverso con SSL/TLS, redirige HTTP a HTTPS
- **Next.js App**: Aplicación corriendo en modo standalone

## Requisitos Previos

- Docker y Docker Compose instalados
- Certificados SSL (se pueden generar con el script incluido)

## Configuración Inicial

### 1. Generar Certificados SSL

Para desarrollo/testing, genere certificados autofirmados:

```bash
./generate-certificates.sh
```

Esto creará:
- `certs/private.pem` - Clave privada
- `certs/public.pem` - Certificado público

**Para producción**, reemplace estos archivos con certificados de una CA confiable (Let's Encrypt, etc.)

### 2. Configurar Variables de Entorno

Cree un archivo `.env` con sus variables de entorno:

```bash
# Copie el archivo de ejemplo
cp .env.example .env

# Edite las variables necesarias
nano .env
```

## Comandos de Docker

### Construir y Levantar los Servicios

```bash
# Construir las imágenes y levantar los contenedores
docker-compose up -d

# Ver los logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f nextjs-app
docker-compose logs -f nginx
```

### Detener los Servicios

```bash
# Detener los contenedores
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### Reconstruir la Aplicación

```bash
# Reconstruir después de cambios en el código
docker-compose build --no-cache
docker-compose up -d
```

### Ver Estado de los Contenedores

```bash
docker-compose ps
```

## Acceso a la Aplicación

Una vez que los servicios estén corriendo:

- **HTTPS**: https://localhost (recomendado)
- **HTTP**: http://localhost (redirige a HTTPS automáticamente)

**Nota**: Si está usando certificados autofirmados, su navegador mostrará una advertencia de seguridad. Esto es normal en desarrollo.

## Configuración de Nginx

El archivo `nginx.conf` incluye:

- Redirección automática de HTTP a HTTPS
- Headers de seguridad (HSTS, X-Frame-Options, etc.)
- Configuración SSL con TLS 1.2 y 1.3
- Límite de carga de archivos de 50MB
- Soporte para hot-reload de Next.js (desarrollo)
- Timeouts configurados para requests largos

### Modificar la Configuración

Si necesita ajustar la configuración de Nginx:

1. Edite `nginx.conf`
2. Reinicie el contenedor:

```bash
docker-compose restart nginx
```

## Límites de Tamaño de Archivos

La aplicación está configurada para soportar:
- **Imágenes**: Máximo 5 archivos de 10MB cada uno
- **Nginx**: Límite de carga de 50MB (`client_max_body_size`)

Para modificar estos límites:

1. **Next.js**: Edite `next.config.js` → `api.bodyParser.sizeLimit`
2. **Nginx**: Edite `nginx.conf` → `client_max_body_size`
3. Reconstruya y reinicie los contenedores

## Troubleshooting

### Error: "Cannot find module 'next'"

Reconstruya la imagen desde cero:

```bash
docker-compose build --no-cache
```

### Error: Certificados SSL no encontrados

Asegúrese de haber generado los certificados:

```bash
./generate-certificates.sh
```

### La aplicación no se conecta a Oracle/SharePoint

Verifique que:
1. Las variables de entorno estén configuradas en `.env`
2. Los servicios externos sean accesibles desde el contenedor
3. Los logs del contenedor para más detalles: `docker-compose logs -f nextjs-app`

### Nginx retorna 502 Bad Gateway

Esto generalmente significa que la aplicación Next.js no está corriendo:

```bash
# Verificar el estado
docker-compose ps

# Ver logs de la aplicación
docker-compose logs nextjs-app

# Reiniciar la aplicación
docker-compose restart nextjs-app
```

## Producción

### Recomendaciones de Seguridad

1. **Certificados SSL**: Use certificados de una CA confiable
2. **Variables de Entorno**: Nunca incluya secretos en las imágenes
3. **Actualizaciones**: Mantenga las imágenes base actualizadas
4. **Logs**: Configure rotación de logs
5. **Firewall**: Configure reglas de firewall apropiadas

### Optimizaciones

1. **Multi-stage Build**: El Dockerfile ya usa multi-stage build para optimizar el tamaño
2. **Caché de dependencias**: Las capas de Docker están optimizadas para aprovechar el caché
3. **Usuario no-root**: La aplicación corre con un usuario no privilegiado
4. **Standalone Output**: Next.js está configurado para generar un build standalone

### Monitoreo

Considere agregar:
- Monitoreo de salud de contenedores
- Recolección de logs centralizados
- Métricas de rendimiento
- Alertas automáticas

## Estructura de Archivos

```
.
├── Dockerfile              # Definición de la imagen de Next.js
├── docker-compose.yml      # Orquestación de servicios
├── nginx.conf             # Configuración del proxy reverso
├── .dockerignore          # Archivos a ignorar en el build
├── generate-certificates.sh # Script para generar certificados SSL
└── certs/                 # Certificados SSL
    ├── private.pem        # Clave privada
    ├── public.pem         # Certificado público
    └── README.md          # Documentación de certificados
```

## Soporte

Para problemas o preguntas sobre la configuración de Docker, consulte:
- [Documentación de Docker](https://docs.docker.com/)
- [Documentación de Docker Compose](https://docs.docker.com/compose/)
- [Documentación de Next.js con Docker](https://nextjs.org/docs/deployment#docker-image)
