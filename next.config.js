/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Docker (standalone output)
  output: 'standalone',
  // Server Actions están habilitados por defecto en Next.js 14.2+
  // La configuración api.bodyParser debe configurarse en route handlers individuales si es necesaria
}

module.exports = nextConfig
