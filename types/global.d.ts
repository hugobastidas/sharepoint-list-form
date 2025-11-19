// Tipos para el formulario
export interface FormData {
  numeroCredito: string; // Se usará como ID/Title en SharePoint
  fechaNotificacion: string; // Fecha de notificación (ISO string)
  gps: string; // Coordenadas GPS o descripción
  diasMora: number; // Días de mora (número mayor a 0)
  fechaCompromiso: string; // Fecha de compromiso de pago (ISO string)
  observaciones: string; // Observaciones adicionales
}

// Tipos para SharePoint
// IMPORTANTE: Los nombres de campos deben coincidir con los nombres internos (name) en SharePoint
export interface SharePointItem {
  fields: {
    Title: string; // Número de crédito (campo requerido por SharePoint)
    FechaNotificacion: string; // Fecha de notificación (dateTime, requerido)
    GPS: string; // Coordenadas GPS o descripción
    DiasMora: number; // Días de mora (number, requerido, mínimo 1)
    Compromiso: string; // Fecha de compromiso de pago (dateTime, opcional)
    Observaciones: string; // Observaciones (text, opcional)
  };
}

// Tipos para la respuesta de la API
export interface ApiResponse {
  success: boolean;
  itemId?: string;
  error?: string;
  message?: string;
}

// Tipos para LDAP
export interface LdapUser {
  dn: string;
  cn?: string;
  mail?: string;
  displayName?: string;
}

// Tipo para el JWT payload
export interface JWTPayload {
  username: string;
  iat?: number;
  exp?: number;
}
