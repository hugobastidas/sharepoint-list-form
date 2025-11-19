#!/bin/bash

# Script para generar certificados SSL autofirmados para desarrollo/testing
# NOTA: Para producción, use certificados de una CA confiable (Let's Encrypt, etc.)

echo "Generando certificados SSL autofirmados..."

# Crear carpeta certs si no existe
mkdir -p certs

# Generar clave privada (private.pem)
openssl genrsa -out certs/private.pem 2048

# Generar certificado autofirmado (public.pem)
openssl req -new -x509 -key certs/private.pem -out certs/public.pem -days 365 \
  -subj "/C=EC/ST=Guayas/L=Guayaquil/O=SharePoint Form/OU=IT/CN=localhost"

# Establecer permisos apropiados
chmod 600 certs/private.pem
chmod 644 certs/public.pem

echo ""
echo "✓ Certificados generados exitosamente:"
echo "  - certs/private.pem (clave privada)"
echo "  - certs/public.pem (certificado público)"
echo ""
echo "NOTA: Estos son certificados autofirmados válidos por 365 días."
echo "Para producción, use certificados de una Autoridad Certificadora confiable."
echo ""
echo "Para iniciar la aplicación con Docker, ejecute:"
echo "  docker-compose up -d"
echo ""
