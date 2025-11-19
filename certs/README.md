# Certificados SSL

Esta carpeta contiene los certificados SSL utilizados por el proxy reverso Nginx.

## Archivos

- **private.pem**: Clave privada SSL
- **public.pem**: Certificado público SSL

## Generación de Certificados

Los certificados actuales son autofirmados y fueron generados usando el script `generate-certificates.sh` en la raíz del proyecto.

Para regenerar los certificados, ejecute:

```bash
./generate-certificates.sh
```

## Uso en Producción

**IMPORTANTE**: Los certificados autofirmados son solo para desarrollo y testing.

Para producción, debe usar certificados de una Autoridad Certificadora (CA) confiable:

### Opción 1: Let's Encrypt (Gratuito)
```bash
# Instalar certbot
sudo apt-get install certbot

# Generar certificados
sudo certbot certonly --standalone -d su-dominio.com

# Copiar certificados a esta carpeta
sudo cp /etc/letsencrypt/live/su-dominio.com/fullchain.pem ./public.pem
sudo cp /etc/letsencrypt/live/su-dominio.com/privkey.pem ./private.pem
```

### Opción 2: Certificados Comerciales
Si tiene certificados de una CA comercial, simplemente coloque:
- El certificado público en `public.pem`
- La clave privada en `private.pem`

## Seguridad

- **NUNCA** comparta o suba la clave privada (`private.pem`) a repositorios públicos
- La carpeta `certs` está incluida en `.gitignore` para evitar commits accidentales
- Los permisos de `private.pem` deben ser restrictivos: `chmod 600 private.pem`

## Información del Certificado Actual

Para ver los detalles del certificado actual:

```bash
openssl x509 -in public.pem -text -noout
```

Para verificar la validez:

```bash
openssl x509 -in public.pem -noout -dates
```
