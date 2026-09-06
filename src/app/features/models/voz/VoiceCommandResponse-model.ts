// import { VoiceAction } from "./VoiceAction-model";

// /**
//  * Modelo que representa la respuesta del backend tras procesar un comando de voz.
//  * Corresponde al DTO Java `VoiceCommandResponse`.
//  */
// // export interface VoiceCommandResponse {
// //   /** Indica si el comando se procesó exitosamente. */
// //   success: boolean;
// //   /** Identificador de la intención detectada (ej. 'login', 'about'). */
// //   intent: string;
// //   /** Mensaje de respuesta en lenguaje natural para mostrar al usuario. */
// //   reply: string;
// //   /** Acción a ejecutar en el frontend. */
// //   action: VoiceAction;
// //   /** Audio de la respuesta en Base64 (opcional, solo si se solicitó). */
// //   audio?: string;
// // }
// // src/core/models/voz/VoiceCommandResponse-model.ts

// /**
//  * Interfaz principal de respuesta de comandos de voz
//  * Versión simplificada y funcional
//  */
// export interface VoiceCommandResponse {
//   /** Estado de la operación: 'success' o 'error' */
//   status: 'success' | 'error';
  
//   /** Mensaje adicional (opcional) */
//   message?: string;
  
//   /** Mensaje de respuesta en lenguaje natural */
//   reply: string;
  
//   /** Acción a ejecutar en el frontend */
//   action?: {
//     /** Tipo de acción: 'navigate', 'speak', 'execute', 'input', 'login', etc. */
//     type: string;
//     /** Datos para la acción */
//     payload?: Record<string, any>;
//   };
  
//   /** Audio de la respuesta en Base64 (opcional) */
//   audioBase64?: string;
  
//   /** Datos adicionales para el frontend */
//   data?: any;
  
//   /** Mensaje de error (si status es 'error') */
//   error?: string;
  
//   /** Timestamp de la respuesta */
//   timestamp: string;
// }

// /**
//  * Tipo para verificar si la respuesta es exitosa
//  */
// export function isSuccessResponse(response: VoiceCommandResponse): boolean {
//   return response.status === 'success';
// }

// /**
//  * Tipo para verificar si la respuesta es un error
//  */
// export function isErrorResponse(response: VoiceCommandResponse): boolean {
//   return response.status === 'error';
// }

// /**
//  * Obtiene el mensaje de error de una respuesta
//  */
// export function getErrorMessage(response: VoiceCommandResponse): string | null {
//   if (isErrorResponse(response)) {
//     return response.error || response.message || response.reply || 'Error desconocido';
//   }
//   return null;
// }

// /**
//  * Verifica si la respuesta contiene audio
//  */
// export function hasAudio(response: VoiceCommandResponse): boolean {
//   return !!(response.audioBase64 && response.audioBase64.length > 0);
// }

// /**
//  * Obtiene el payload de acción si existe
//  */
// export function getActionPayload<T = Record<string, any>>(
//   response: VoiceCommandResponse,
//   actionType?: string
// ): T | null {
//   if (!response.action) return null;
//   if (actionType && response.action.type !== actionType) return null;
//   return (response.action.payload as T) || null;
// }

// /**
//  * Crea una respuesta de éxito
//  */
// export function createSuccessResponse(
//   reply: string,
//   action?: { type: string; payload?: Record<string, any> },
//   data?: any
// ): VoiceCommandResponse {
//   return {
//     status: 'success',
//     reply,
//     action,
//     data,
//     timestamp: new Date().toISOString()
//   };
// }

// /**
//  * Crea una respuesta de error
//  */
// export function createErrorResponse(
//   reply: string,
//   error?: string,
//   data?: any
// ): VoiceCommandResponse {
//   return {
//     status: 'error',
//     reply,
//     error: error || reply,
//     data,
//     timestamp: new Date().toISOString()
//   };
// }

// /**
//  * Crea una respuesta con audio
//  */
// export function createAudioResponse(
//   reply: string,
//   audioBase64: string,
//   action?: { type: string; payload?: Record<string, any> }
// ): VoiceCommandResponse {
//   return {
//     status: 'success',
//     reply,
//     audioBase64,
//     action,
//     timestamp: new Date().toISOString()
//   };
// }



// src/core/models/voz/VoiceCommandResponse-model.ts

/**
 * Modelo que representa la respuesta del backend tras procesar un comando de voz.
 * Corresponde al DTO Java `VoiceCommandResponse`.
 * 
 * El backend devuelve: success, intent, reply, action, audio (opcional).
 * El frontend usa además status para su lógica interna.
 */
export interface VoiceCommandResponse {
  // ============================================================
  // PROPIEDADES QUE VIENEN DIRECTAMENTE DEL BACKEND
  // ============================================================
  
  /** Indica si el comando se procesó exitosamente (backend). */
  success: boolean;
  
  /** Identificador de la intención detectada (backend). Ej: 'login', 'about', 'unknown'. */
  intent: string;
  
  /** Mensaje de respuesta en lenguaje natural (backend). */
  reply: string;
  
  /** Acción a ejecutar en el frontend (backend). */
  action?: {
    /** Tipo de acción: 'navigate', 'speak', 'execute', 'input', 'login', etc. */
    type: string;
    /** Datos para la acción (opcional) */
    payload?: Record<string, any>;
  };
  
  /** Audio de la respuesta en Base64 (backend, solo si se solicitó). */
  audio?: string;          // Nota: el backend usa 'audio', pero el frontend usa 'audioBase64'
  
  // ============================================================
  // PROPIEDADES QUE USA EL FRONTEND (asignadas internamente)
  // ============================================================
  
  /** Estado de la operación: 'success' o 'error' (asignado por el orquestador). */
  status?: 'success' | 'error';
  
  /** Mensaje adicional (opcional, usado en algunas respuestas de error). */
  message?: string;
  
  /** Versión del frontend de audioBase64 (se asigna desde 'audio' o desde el orquestador). */
  audioBase64?: string;
  
  /** Datos adicionales (por ejemplo, para debugging o metadatos). */
  data?: any;
  
  /** Mensaje de error (si status es 'error'). */
  error?: string;
  
  /** Timestamp de la respuesta (generado por el frontend si no viene del backend). */
  timestamp: string;
}

// ============================================================
// FUNCIONES DE UTILIDAD (actualizadas)
// ============================================================

/**
 * Verifica si la respuesta es exitosa (usando 'status' si existe, o 'success' como fallback).
 */
export function isSuccessResponse(response: VoiceCommandResponse): boolean {
  if (response.status !== undefined) {
    return response.status === 'success';
  }
  return response.success === true;
}

/**
 * Verifica si la respuesta es un error.
 */
export function isErrorResponse(response: VoiceCommandResponse): boolean {
  if (response.status !== undefined) {
    return response.status === 'error';
  }
  return response.success === false;
}

/**
 * Obtiene el mensaje de error de una respuesta.
 */
export function getErrorMessage(response: VoiceCommandResponse): string | null {
  if (isErrorResponse(response)) {
    return response.error || response.message || response.reply || 'Error desconocido';
  }
  return null;
}

/**
 * Verifica si la respuesta contiene audio.
 * Busca tanto en 'audioBase64' como en 'audio' (backup).
 */
export function hasAudio(response: VoiceCommandResponse): boolean {
  return !!(response.audioBase64 || response.audio);
}

/**
 * Obtiene el audio en Base64 (prioriza 'audioBase64', luego 'audio').
 */
export function getAudioBase64(response: VoiceCommandResponse): string | null {
  return response.audioBase64 || response.audio || null;
}

/**
 * Obtiene el payload de acción si existe.
 */
export function getActionPayload<T = Record<string, any>>(
  response: VoiceCommandResponse,
  actionType?: string
): T | null {
  if (!response.action) return null;
  if (actionType && response.action.type !== actionType) return null;
  return (response.action.payload as T) || null;
}

/**
 * Crea una respuesta de éxito.
 */
export function createSuccessResponse(
  reply: string,
  action?: { type: string; payload?: Record<string, any> },
  data?: any
): VoiceCommandResponse {
  return {
    success: true,
    intent: 'success',
    reply,
    action,
    data,
    status: 'success',
    timestamp: new Date().toISOString()
  };
}

/**
 * Crea una respuesta de error.
 */
export function createErrorResponse(
  reply: string,
  error?: string,
  data?: any,
  intent: string = 'error'
): VoiceCommandResponse {
  return {
    success: false,
    intent,
    reply,
    error: error || reply,
    data,
    status: 'error',
    timestamp: new Date().toISOString()
  };
}

/**
 * Crea una respuesta con audio.
 */
export function createAudioResponse(
  reply: string,
  audioBase64: string,
  action?: { type: string; payload?: Record<string, any> }
): VoiceCommandResponse {
  return {
    success: true,
    intent: 'audio',
    reply,
    audioBase64,
    action,
    status: 'success',
    timestamp: new Date().toISOString()
  };
}

/**
 * Normaliza una respuesta del backend para que tenga todas las propiedades necesarias.
 * Útil para compatibilidad entre versiones.
 */
export function normalizeResponse(raw: Partial<VoiceCommandResponse>): VoiceCommandResponse {
  const result: VoiceCommandResponse = {
    success: raw.success ?? false,
    intent: raw.intent ?? 'unknown',
    reply: raw.reply ?? '',
    timestamp: raw.timestamp ?? new Date().toISOString()
  };

  // Copiar propiedades opcionales si existen
  if (raw.action) result.action = raw.action;
  if (raw.audio) result.audio = raw.audio;
  if (raw.audioBase64) result.audioBase64 = raw.audioBase64;
  if (raw.data) result.data = raw.data;
  if (raw.error) result.error = raw.error;
  if (raw.message) result.message = raw.message;

  // Asignar status basado en success si no está definido
  if (raw.status !== undefined) {
    result.status = raw.status;
  } else {
    result.status = raw.success ? 'success' : 'error';
  }

  return result;
}