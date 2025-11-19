'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserInfo {
  username: string;
  displayName?: string;
  email?: string;
  groups?: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCobranzas, setShowCobranzas] = useState(false);
  const [showInspecciones, setShowInspecciones] = useState(false);

  useEffect(() => {
    // Obtener información del usuario autenticado
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!data.success || !data.user) {
        // Si no está autenticado, redirigir al login
        router.push('/login');
        return;
      }

      setUser(data.user);

      // Determinar qué opciones mostrar según los grupos
      const userGroups = (data.user.groups || []).map((g: string) => g.toLowerCase());

      // Obtener configuración de grupos desde el endpoint
      const configResponse = await fetch('/api/auth/groups-config');
      const configData = await configResponse.json();

      if (configData.success) {
        const { cobranzas, inspecciones } = configData.groups;

        // Verificar si tiene acceso a Cobranzas (puede ser uno de varios grupos)
        const hasCobranzas = cobranzas.some((grupo: string) =>
          userGroups.includes(grupo.toLowerCase())
        );
        setShowCobranzas(hasCobranzas);

        // Verificar si tiene acceso a Inspecciones
        const hasInspecciones = inspecciones.some((grupo: string) =>
          userGroups.includes(grupo.toLowerCase())
        );
        setShowInspecciones(hasInspecciones);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      router.push('/login');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {user?.displayName || user?.username}
            </h1>
            <p className="text-gray-600 mt-1">
              Seleccione una opción para continuar
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Opciones de Menú */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notificaciones Cobranzas */}
          {showCobranzas && (
            <button
              onClick={() => router.push('/form')}
              className="group relative bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Notificaciones Cobranzas
                </h2>
                <p className="text-gray-600 text-sm">
                  Registrar notificaciones de cobranza con seguimiento de ubicación y adjuntos
                </p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-6 h-6 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          )}

          {/* Inspecciones de Crédito */}
          {showInspecciones && (
            <button
              onClick={() => router.push('/inspecciones')}
              className="group relative bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Inspecciones de Crédito
                </h2>
                <p className="text-gray-600 text-sm">
                  Registrar inspecciones de crédito con evaluación de garantías y documentación
                </p>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-6 h-6 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          )}
        </div>

        {/* Mensaje si no tiene acceso a ninguna opción */}
        {!showCobranzas && !showInspecciones && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
            <p className="font-medium">No tiene acceso a ningún módulo</p>
            <p className="text-sm mt-1">
              Contacte al administrador para solicitar permisos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
