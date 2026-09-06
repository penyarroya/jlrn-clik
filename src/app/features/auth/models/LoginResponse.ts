export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  permissions?: string[];        // Opcional
  expiresIn?: number;            // Opcional
  sessionId?: string;            // Opcional
  // ✅ CAMBIAR token → accessToken (para que coincida con la respuesta del backend)
  accessToken: string;
  refreshToken: string | null;
  // Mantener por compatibilidad si es necesario
  token?: string;                // Opcional, para compatibilidad
  type?: string;                 // Opcional
}