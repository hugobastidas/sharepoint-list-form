'use client';

import { useRouter } from 'next/navigation';

export default function InspeccionesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Inspecciones de Crédito
            </h1>
            <p className="text-gray-600 mt-1">
              Módulo en desarrollo
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver al Menú
          </button>
        </div>

        {/* Contenido */}
        <div className="card">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Módulo en Desarrollo
            </h2>
            <p className="text-gray-600 mb-6">
              El módulo de Inspecciones de Crédito estará disponible próximamente.
            </p>
            <p className="text-sm text-gray-500">
              Este módulo permitirá registrar inspecciones de crédito con evaluación de garantías y documentación completa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
