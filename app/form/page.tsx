'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface FileWithPreview {
  file: File;
  preview: string;
}

export default function FormPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados del formulario
  const [numeroCredito, setNumeroCredito] = useState('');
  const [fechaNotificacion, setFechaNotificacion] = useState('');
  const [gps, setGps] = useState('');
  const [diasMora, setDiasMora] = useState('');
  const [fechaCompromiso, setFechaCompromiso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [imagenes, setImagenes] = useState<FileWithPreview[]>([]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validar número máximo de archivos
    if (files.length + imagenes.length > 5) {
      setError('No puede seleccionar más de 5 imágenes en total');
      return;
    }

    // Validar cada archivo
    const validFiles: FileWithPreview[] = [];
    for (const file of files) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setError(`El archivo ${file.name} no es una imagen válida`);
        continue;
      }

      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`El archivo ${file.name} excede el tamaño máximo de 5MB`);
        continue;
      }

      // Crear preview
      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview });
    }

    setImagenes([...imagenes, ...validFiles]);
    setError('');
  };

  const removeImage = (index: number) => {
    const newImagenes = [...imagenes];
    URL.revokeObjectURL(newImagenes[index].preview);
    newImagenes.splice(index, 1);
    setImagenes(newImagenes);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Preparar FormData
      const formData = new FormData();
      formData.append('numeroCredito', numeroCredito);
      formData.append('fechaNotificacion', fechaNotificacion);
      formData.append('gps', gps);
      formData.append('diasMora', diasMora);
      formData.append('fechaCompromiso', fechaCompromiso);
      formData.append('observaciones', observaciones);

      // Agregar imágenes
      imagenes.forEach((img, index) => {
        formData.append(`imagen_${index}`, img.file);
      });

      // Enviar al API
      const response = await fetch('/api/sharepoint/create', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Error al crear el registro');
        setIsLoading(false);
        return;
      }

      // Éxito
      setSuccess(`Registro creado exitosamente. ID: ${data.itemId}`);

      // Limpiar formulario
      setNumeroCredito('');
      setFechaNotificacion('');
      setGps('');
      setDiasMora('');
      setFechaCompromiso('');
      setObservaciones('');
      imagenes.forEach(img => URL.revokeObjectURL(img.preview));
      setImagenes([]);

      setIsLoading(false);

      // Opcional: mostrar mensaje por 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      console.error('Error en submit:', err);
      setError('Error de conexión. Intente nuevamente.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Registro de Crédito
            </h1>
            <p className="text-gray-600 mt-1">
              Complete el formulario con la información del crédito
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Formulario */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Número de Crédito */}
            <div>
              <label htmlFor="numeroCredito" className="form-label">
                Número de Crédito *
              </label>
              <input
                id="numeroCredito"
                type="text"
                value={numeroCredito}
                onChange={(e) => setNumeroCredito(e.target.value)}
                className="form-input"
                placeholder="Ej: 12345678"
                required
                disabled={isLoading}
              />
            </div>

            {/* Grid de 2 columnas en desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de Notificación */}
              <div>
                <label htmlFor="fechaNotificacion" className="form-label">
                  Fecha de Notificación *
                </label>
                <input
                  id="fechaNotificacion"
                  type="date"
                  value={fechaNotificacion}
                  onChange={(e) => setFechaNotificacion(e.target.value)}
                  className="form-input"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Días de Mora */}
              <div>
                <label htmlFor="diasMora" className="form-label">
                  Días de Mora *
                </label>
                <input
                  id="diasMora"
                  type="number"
                  value={diasMora}
                  onChange={(e) => setDiasMora(e.target.value)}
                  className="form-input"
                  placeholder="Ej: 30"
                  min="1"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Debe ser un número mayor o igual a 1
                </p>
              </div>
            </div>

            {/* GPS */}
            <div>
              <label htmlFor="gps" className="form-label">
                Coordenadas GPS
              </label>
              <input
                id="gps"
                type="text"
                value={gps}
                onChange={(e) => setGps(e.target.value)}
                className="form-input"
                placeholder="Ej: -2.9001, -79.0059 o descripción de ubicación"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese las coordenadas GPS o una descripción de la ubicación
              </p>
            </div>

            {/* Fecha de Compromiso */}
            <div>
              <label htmlFor="fechaCompromiso" className="form-label">
                Fecha de Compromiso de Pago
              </label>
              <input
                id="fechaCompromiso"
                type="date"
                value={fechaCompromiso}
                onChange={(e) => setFechaCompromiso(e.target.value)}
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {/* Observaciones */}
            <div>
              <label htmlFor="observaciones" className="form-label">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="form-input"
                rows={4}
                placeholder="Ingrese observaciones adicionales..."
                disabled={isLoading}
              />
            </div>

            {/* Imágenes */}
            <div>
              <label className="form-label">
                Imágenes (máximo 5, hasta 5MB cada una)
              </label>

              {/* Input de archivos */}
              <div className="mt-2">
                <label
                  htmlFor="imagenes"
                  className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-primary-400 focus:outline-none"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Click para seleccionar imágenes
                    </span>
                    <span className="text-xs text-gray-500">
                      {imagenes.length}/5 imágenes seleccionadas
                    </span>
                  </div>
                </label>
                <input
                  id="imagenes"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading || imagenes.length >= 5}
                />
              </div>

              {/* Preview de imágenes */}
              {imagenes.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {imagenes.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img.preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">
                        {img.file.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Mensaje de Éxito */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                'Enviar Registro'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
