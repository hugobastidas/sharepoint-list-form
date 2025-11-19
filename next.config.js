/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Docker (standalone output)
  output: 'standalone',
  experimental: {
    serverActions: true,
  },
  // Configuración para manejar archivos grandes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
