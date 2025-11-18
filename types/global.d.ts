// Tipos para el formulario
export interface FormData {
  numeroCredito: string;
  fechaNotificacion: string;
  gps: string;
  diasMora: number;
  fechaCompromiso: string;
  observaciones: string;
  usuario: string;
}

// Tipos para SharePoint
export interface SharePointItem {
  fields: {
    Title: string;
    numeroCredito: string;
    fechaNotificacion: string;
    gps: string;
    diasMora: number;
    fechaCompromiso: string;
    observaciones: string;
    usuario: string;
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
