// Tipos para el formulario
export interface FormData {
  numeroCredito: string; // Se usará como ID/Title en SharePoint
  fechaNotificacion: string; // Fecha de notificación (ISO string)
  gps: string; // Coordenadas GPS o descripción
  diasMora: number; // Días de mora (número mayor a 0)
  agencia: string; // Nombre de la agencia/sucursal
  fechaCompromiso: string; // Fecha de compromiso de pago (ISO string)
  observaciones: string; // Observaciones adicionales
}

// Tipos para SharePoint
// IMPORTANTE: Los nombres de campos deben coincidir con los nombres internos (name) en SharePoint
// IMPORTANTE: Los campos opcionales solo deben incluirse si tienen valor (no enviar strings vacíos)
export interface SharePointItem {
  fields: {
    Title: string; // Número de crédito (campo opcional en SharePoint pero requerido por nuestra app)
    FechaNotificacion: string; // Fecha de notificación (dateTime, REQUERIDO en SharePoint)
    DiasMora: number; // Días de mora (number, REQUERIDO en SharePoint, mínimo 1)
    Agencia: string; // Nombre de la agencia/sucursal (REQUERIDO)
    GPS?: string; // Coordenadas GPS (NOTA: Campo tipo Location - actualmente omitido, no acepta strings)
    Compromiso?: string; // Fecha de compromiso de pago (dateTime, opcional)
    Observaciones?: string; // Observaciones (text, opcional)
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
  displayName?: string;
  email?: string;
  iat?: number;
  exp?: number;
}
