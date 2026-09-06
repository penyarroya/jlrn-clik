// src/core/services/voz/voice-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, firstValueFrom } from 'rxjs'; // ✅ Añadir firstValueFrom
import { catchError, timeout, retry } from 'rxjs/operators';
import { VoiceCommandResponse } from '../../models/voz/VoiceCommandResponse-model';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../shared/services/loggers/logger.service';

@Injectable({ providedIn: 'root' })
export class VoiceApiService {
  private http = inject(HttpClient);
  private logger = inject(LoggerService);
  
  // 🔧 Configuración
  private defaultTimeout = 10000;
  private maxRetries = 2;
  private customBaseUrl: string | null = null; // ✅ NUEVO
  
  /**
   * Obtiene la URL base para el servicio de voz
   */
  private getBaseUrl(): string {
    // ✅ Si hay una URL personalizada, usarla
    if (this.customBaseUrl) {
      return this.customBaseUrl;
    }
    
    // Usar voiceEndpoint si existe
    if (environment.voiceEndpoint) {
      return `${environment.apiGateway}${environment.voiceEndpoint}`;
    }
    return `${environment.apiGateway}/voice`;
  }

  /**
   * Envía un texto al backend para procesar un comando
   */
  sendTextCommand(
    text: string, 
    userId?: string, 
    includeAudio = false,
    timeoutMs = this.defaultTimeout
  ): Observable<VoiceCommandResponse> {
    const url = this.buildUrl('/command', { includeAudio });
    const headers = this.buildHeaders(userId);
    const payload = { text, userId };
    
    if (environment.enableLogs) {
      this.logger.log(`📤 Enviando comando de texto: "${text}"`);
      this.logger.log(`📍 URL: ${url}`);
    }
    
    return this.http.post<VoiceCommandResponse>(url, payload, { headers })
      .pipe(
        timeout(timeoutMs),
        retry(this.maxRetries),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Envía un archivo de audio al backend para transcribir y procesar
   */
  sendAudioCommand(
    audioBlob: Blob,
    language = 'es',
    userId?: string,
    includeAudio = false,
    timeoutMs = this.defaultTimeout
  ): Observable<VoiceCommandResponse> {
    const url = this.buildUrl('/command/audio', { includeAudio });
    const headers = this.buildHeaders(userId);
    
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('language', language);
    if (userId) {
      formData.append('userId', userId);
    }
    
    if (environment.enableLogs) {
      this.logger.log(`📤 Enviando audio: ${audioBlob.size} bytes`);
      this.logger.log(`📍 URL: ${url}`);
    }
    
    return this.http.post<VoiceCommandResponse>(url, formData, { headers })
      .pipe(
        timeout(timeoutMs),
        retry(this.maxRetries),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Construye la URL con parámetros
   */
  private buildUrl(path: string, params: Record<string, any> = {}): string {
    const baseUrl = this.getBaseUrl();
    let url = `${baseUrl}${path}`;
    
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    }
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += '?' + queryString;
    }
    
    return url;
  }

  /**
   * Construye los headers de la petición
   */
  private buildHeaders(userId?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (userId) {
      headers = headers.set('X-UserId', userId);
    }
    
    // Añadir token de autenticación si existe
    const token = this.getAuthToken(); // ✅ Usar método auxiliar
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Headers adicionales para debug
    if (environment.enableLogs) {
      headers = headers.set('X-Debug', 'true');
    }
    
    return headers;
  }

  /**
   * Maneja errores de la API
   */
  // private handleError(error: any): Observable<never> {
  //   let errorMessage = 'Error desconocido';
  //   let statusCode = 500;
  //   let errorDetails = null;
    
  //   if (error.error instanceof ErrorEvent) {
  //     // Error del lado del cliente
  //     errorMessage = `Error: ${error.error.message}`;
  //     errorDetails = error.error;
  //   } else if (error.status === 0) {
  //     errorMessage = 'Error de conexión con el servidor. Verifica tu conexión a internet.';
  //     statusCode = 0;
  //   } else if (error.status === 401 || error.status === 403) {
  //     errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
  //     statusCode = error.status;
  //   } else if (error.status === 404) {
  //     errorMessage = 'El servicio de voz no está disponible. Contacta al administrador.';
  //     statusCode = error.status;
  //   } else if (error.status === 408 || error.name === 'TimeoutError') {
  //     errorMessage = 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
  //     statusCode = error.status;
  //   } else if (error.status === 429) {
  //     errorMessage = 'Demasiadas peticiones. Por favor, espera un momento.';
  //     statusCode = error.status;
  //   } else if (error.status >= 500) {
  //     errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
  //     statusCode = error.status;
  //   } else {
  //     errorMessage = error.message || `Error ${error.status}`;
  //     statusCode = error.status || 500;
  //   }
    
  //   this.logger.error('❌ Error en API:', error);
  //   this.logger.error('Mensaje:', errorMessage);
  //   this.logger.error('Status:', statusCode);
    
  // // Crear respuesta de error
  // const errorResponse: VoiceCommandResponse = {
  //     status: 'error',
  //     reply: errorMessage,
  //     error: errorMessage,
  //     data: { 
  //       statusCode, 
  //       originalError: error,
  //       details: errorDetails
  //     },
  //     timestamp: new Date().toISOString()
  //   };
    
  //   return throwError(() => errorResponse);
  // }



  private handleError(error: any): Observable<never> {
      let errorMessage = 'Error desconocido';
      let statusCode = 500;
      let errorDetails = null;
      
      if (error.error instanceof ErrorEvent) {
        // Error del lado del cliente
        errorMessage = `Error: ${error.error.message}`;
        errorDetails = error.error;
      } else if (error.status === 0) {
        errorMessage = 'Error de conexión con el servidor. Verifica tu conexión a internet.';
        statusCode = 0;
      } else if (error.status === 401 || error.status === 403) {
        errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        statusCode = error.status;
      } else if (error.status === 404) {
        errorMessage = 'El servicio de voz no está disponible. Contacta al administrador.';
        statusCode = error.status;
      } else if (error.status === 408 || error.name === 'TimeoutError') {
        errorMessage = 'Tiempo de espera agotado. El servidor tardó demasiado en responder.';
        statusCode = error.status;
      } else if (error.status === 429) {
        errorMessage = 'Demasiadas peticiones. Por favor, espera un momento.';
        statusCode = error.status;
      } else if (error.status >= 500) {
        errorMessage = 'Error del servidor. Por favor, intenta nuevamente más tarde.';
        statusCode = error.status;
      } else {
        errorMessage = error.message || `Error ${error.status}`;
        statusCode = error.status || 500;
      }
      
      this.logger.error('❌ Error en API:', error);
      this.logger.error('Mensaje:', errorMessage);
      this.logger.error('Status:', statusCode);
      
      // Crear respuesta de error con success e intent
      const errorResponse: VoiceCommandResponse = {
        success: false,              // AÑADIDO
        intent: 'error',             // AÑADIDO (podría ser 'unknown' si quieres que se trate como no entendido, pero mejor 'error')
        status: 'error',
        reply: errorMessage,
        error: errorMessage,
        data: { 
          statusCode, 
          originalError: error,
          details: errorDetails
        },
        timestamp: new Date().toISOString()
      };
      
      return throwError(() => errorResponse);
  }

  /**
   * Verifica la salud del servicio
   */
  healthCheck(): Observable<{ status: string; timestamp: string; service: string }> {
    const url = this.buildUrl('/health');
    
    if (environment.enableLogs) {
      this.logger.log(`🏥 Health check: ${url}`);
    }
    
    return this.http.get<{ status: string; timestamp: string; service: string }>(url)
      .pipe(
        timeout(3000),
        catchError(error => {
          this.logger.error('Health check falló:', error);
          return throwError(() => new Error('Servicio de voz no disponible'));
        })
      );
  }

  /**
   * Verifica la conectividad del servicio
   * ✅ CORREGIDO - Usa firstValueFrom en lugar de toPromise()
   */
  async ping(): Promise<boolean> {
    try {
      const result = await firstValueFrom(this.healthCheck());
      return result?.status === 'UP' || result?.status === 'OK';
    } catch (error) {
      this.logger.error('Ping falló:', error);
      return false;
    }
  }

  // ============================================================
  // ✅ NUEVOS: MÉTODOS DE AUTENTICACIÓN
  // ============================================================

  /**
   * Verifica si hay un token de autenticación disponible
   */
  hasAuthToken(): boolean {
    return !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
  }

  /**
   * Obtiene el token de autenticación actual
   */
  getAuthToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  // ============================================================
  // ✅ NUEVO: CANCELACIÓN DE PETICIONES
  // ============================================================

  /**
   * Cancela todas las peticiones HTTP en curso
   */
  cancelRequests(abortController?: AbortController): void {
    if (abortController) {
      abortController.abort();
      this.logger.log('⛔ Peticiones canceladas');
    }
  }

  /**
   * Crea un controlador de aborto para cancelar peticiones
   */
  createAbortController(): AbortController {
    return new AbortController();
  }

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  /**
   * Configura el servicio
   * ✅ MODIFICADO - Añadir baseUrl
   */
  configure(options: {
    defaultTimeout?: number;
    maxRetries?: number;
    baseUrl?: string;
  }): void {
    if (options.defaultTimeout !== undefined) {
      this.defaultTimeout = options.defaultTimeout;
    }
    if (options.maxRetries !== undefined) {
      this.maxRetries = options.maxRetries;
    }
    if (options.baseUrl !== undefined) {
      this.customBaseUrl = options.baseUrl;
    }
    
    if (environment.enableLogs) {
      this.logger.log('⚙️ VoiceApiService configurado:', {
        defaultTimeout: this.defaultTimeout,
        maxRetries: this.maxRetries,
        baseUrl: this.getBaseUrl()
      });
    }
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): {
    defaultTimeout: number;
    maxRetries: number;
    baseUrl: string;
  } {
    return {
      defaultTimeout: this.defaultTimeout,
      maxRetries: this.maxRetries,
      baseUrl: this.getBaseUrl()
    };
  }
}