// src/core/services/voz/voice-command-orchestrator.service.ts
import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, from, Subscription, timer } from 'rxjs';
import { switchMap, tap, catchError, timeout, finalize, retry } from 'rxjs/operators';
import { VoiceApiService } from './voice-api.service';
import { AudioRecorderService } from './audio-recorder.service';
import { VoiceService } from './voice.service';
import { VoiceCommandResponse, isSuccessResponse, isErrorResponse } from '../../models/voz/VoiceCommandResponse-model';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../shared/services/loggers/logger.service';
import { VoiceContextService } from './voice-context.service';
// 🔥 IMPORTAR EL SERVICIO DE LIMPIEZA
import { FieldCleanupService } from './field-cleanup.service';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export interface CommandOptions {
  userId?: string;
  language?: string;
  timeoutMs?: number;
  includeAudio?: boolean;
}

export interface OrchestratorConfig {
  defaultTimeout?: number;
  autoResetDelay?: number;
  maxRetries?: number;
}

@Injectable({ providedIn: 'root' })
export class VoiceCommandOrchestratorService implements OnDestroy {
  private api = inject(VoiceApiService);
  private audioRecorder = inject(AudioRecorderService);
  private voiceService = inject(VoiceService);
  private logger = inject(LoggerService);
  private voiceContext = inject(VoiceContextService);
  private fieldCleanup = inject(FieldCleanupService);

  private readonly contextMessages: Record<string, string> = {
    register: 'No te he entendido. En registro puedes decir "nombre", "correo", "contraseña", "confirmar" o "registrar".',
    login:    'No te he entendido. En inicio de sesión puedes decir "usuario", "contraseña" o "entrar".',
    welcome:  'No entendí tu petición. Prueba con "login", "acerca de" o "ayuda".'
  };

  private defaultTimeout = 10000;
  private autoResetDelay = 3000;
  private maxRetries = 2;
  private enableLogs = environment.enableLogs;

  private statusSubject = new BehaviorSubject<VoiceStatus>('idle');
  private responseSubject = new BehaviorSubject<VoiceCommandResponse | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private progressSubject = new BehaviorSubject<number>(0);

  private processingSubscription?: Subscription;
  private statusResetTimer?: any;
  private retryCount = 0;
  private lastCommandText = '';

  status$ = this.statusSubject.asObservable();
  response$ = this.responseSubject.asObservable();
  error$ = this.errorSubject.asObservable();
  progress$ = this.progressSubject.asObservable();

  constructor() {
    this.voiceService.getResponses().subscribe(response => {
      this.responseSubject.next(response);
      if (response.audioBase64) {
        this.playAudioFromBase64(response.audioBase64).catch(err => {
          this.logger.error('Error al reproducir audio:', err);
        });
      }
      if (response.action?.type === 'navigate') {
        if (this.enableLogs) {
          this.logger.log('🚀 Acción de navegación detectada:', response.action.payload);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================================
  // ✅ MÉTODOS DE VERIFICACIÓN
  // ============================================================

  isVoiceServiceAvailable(): boolean {
    return this.voiceService.isSupported() && this.voiceService.isSpeechSynthesisSupported();
  }

  isAudioAvailable(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  isFullyAvailable(): boolean {
    return this.isVoiceServiceAvailable() && this.isAudioAvailable();
  }

  // ============================================================
  // ✅ MENSAJE CONTEXTUAL
  // ============================================================

  private getContextualMessage(defaultReply: string): string {
    if (!defaultReply.includes('No entendí tu petición')) {
      return defaultReply;
    }
    const context = this.voiceContext.getContext();
    const activationMsg = context.activationMessage || '';
    let key = 'default';
    if (activationMsg.includes('registro')) key = 'register';
    else if (activationMsg.includes('inicio de sesión') || activationMsg.includes('login')) key = 'login';
    else if (activationMsg.includes('Bienvenido') && !activationMsg.includes('registro') && !activationMsg.includes('inicio')) key = 'welcome';
    return this.contextMessages[key] || defaultReply;
  }

  // ============================================================
  // ✅ FLUJO: GRABACIÓN + STT
  // ============================================================

  startListening(): void {
    if (this.statusSubject.value === 'listening' || this.statusSubject.value === 'processing') {
      this.logger.warn('⚠️ Ya hay un proceso en curso');
      return;
    }
    if (!this.isAudioAvailable()) {
      this.logger.error('❌ Audio no disponible');
      this.statusSubject.next('error');
      this.errorSubject.next('No se puede acceder al micrófono');
      return;
    }
    if (this.enableLogs) this.logger.log('🎤 Iniciando grabación...');
    this.statusSubject.next('listening');
    this.progressSubject.next(0);
    this.errorSubject.next(null);
    this.retryCount = 0;

    this.audioRecorder.startRecording().subscribe({
      next: () => {
        if (this.enableLogs) this.logger.log('✅ Grabación iniciada');
        this.progressSubject.next(50);
      },
      error: (err) => {
        this.logger.error('❌ Error al iniciar grabación:', err);
        this.statusSubject.next('error');
        this.errorSubject.next('No se pudo acceder al micrófono');
      }
    });
  }

  stopListeningAndProcess(options: CommandOptions = {}): void {
    const { language = 'es', userId, timeoutMs = this.defaultTimeout } = options;
    if (this.statusSubject.value !== 'listening') {
      this.logger.warn('⚠️ No hay grabación activa');
      return;
    }
    if (this.enableLogs) this.logger.log('⏹️ Deteniendo grabación y procesando...');
    this.statusSubject.next('processing');
    this.progressSubject.next(75);

    this.cleanupSubscription();
    this.processingSubscription = this.audioRecorder.stopRecording()
      .pipe(
        tap(webmBlob => { if (this.enableLogs) this.logger.log(`🎤 Audio grabado: ${webmBlob.size} bytes`); this.progressSubject.next(80); }),
        switchMap(webmBlob => from(this.audioRecorder.convertToWav(webmBlob))),
        tap(wavBlob => { if (this.enableLogs) this.logger.log(`🎵 WAV generado: ${wavBlob.size} bytes`); this.progressSubject.next(90); }),
        switchMap(wavBlob => this.api.sendAudioCommand(wavBlob, language, userId, false, timeoutMs)),
        timeout(timeoutMs),
        tap({
          next: (response) => this.handleSuccessResponse(response),
          error: (err) => this.handleProcessingError(err)
        }),
        finalize(() => { if (this.enableLogs) this.logger.log('🏁 Procesamiento finalizado'); })
      )
      .subscribe();
  }

  // ============================================================
  // ✅ FLUJO: TEXTO → Backend (NLP + TTS) - CON LIMPIEZA UNIVERSAL
  // ============================================================
  
  // sendTextCommand(text: string, options: CommandOptions = {}): void {
  //   const { userId, timeoutMs = this.defaultTimeout, includeAudio = true } = options;

  //   // ============================================================
  //   // 🔥 FILTRAR COMANDOS LOCALES (NUNCA VAN AL BACKEND)
  //   // ============================================================
  //   const lower = text.toLowerCase().trim();
    
  //   // ✅ TODOS los comandos que NO deben ir al backend
  //   const localCommands = [
  //     // Comandos de dictado
  //     'usuario', 'contraseña', 'clave', 'password', 'pass', 'nombre', 'email', 'correo',
  //     'mayúscula', 'minúscula', 'rafa', 'fin', 'terminar', 'listo', 'ok', 'vale', 'hecho',
  //     'dictar', 'deletrear', 'escribir',
  //     // Comandos de acción (Login)
  //     'limpiar', 'borrar', 'resetear', 'empezar de cero', 'borrar campos', 'limpiar campos',
  //     'volver', 'atrás', 'regresar', 'retroceder', 'back',
  //     'enviar', 'logear', 'acceder', 'entrar', 'acceder al sistema',
  //     'iniciar sesión', 'login', 'ingresar',
  //     'ayuda', 'opciones', 'comandos', 'help',
  //     // Comandos de control de micrófono
  //     'silenciar', 'mute', 'apagar micrófono', 'dejar de escuchar',
  //     'activar micrófono', 'encender micrófono', 'unmute', 'escuchar',
  //     // Comandos de contraseña
  //     'mostrar contraseña', 'ver contraseña', 'mostrar clave', 'ver clave',
  //     'ocultar contraseña', 'ocultar clave', 'esconder contraseña',
  //     // Navegación
  //     'registro', 'registrar', 'crear cuenta', 'registrarme',
  //     'recuperar', 'olvidé', 'olvide contraseña',
  //     'privacidad', 'política de privacidad',
  //     'condiciones', 'términos', 'términos y condiciones'
  //   ];
    
  //   const isLocalCommand = localCommands.some(cmd => lower.includes(cmd));

  //   // Detectar si estamos en login
  //   const context = this.voiceContext.getContext();
    
  //   // ============================================================
  //   // 🔥 VERIFICAR preventBackend (NUNCA enviar al backend si está activo)
  //   // ============================================================
  //   if ((context as any)?.preventBackend) {
  //     if (this.enableLogs) {
  //       this.logger.log(`⏭️ [Orquestador] preventBackend activo, ignorando comando: "${text}"`);
  //     }
  //     return; // ← NO ENVIAR AL BACKEND
  //   }

  //   const activationMsg = context.activationMessage || '';
  //   const isLoginPage = activationMsg.includes('inicio de sesión') || 
  //                       activationMsg.includes('login') ||
  //                       activationMsg.includes('contraseña');

  //   // ============================================================
  //   // 🔥 COMANDOS DE LIMPIEZA UNIVERSAL (funcionan en cualquier página)
  //   // ============================================================
    
  //   // Verificar si es un comando de limpieza específico (ej: "limpiar usuario")
  //   const fieldNames = this.fieldCleanup.getFieldNames();
  //   const fieldLabels = this.fieldCleanup.getFieldLabels();
    
  //   let targetField: string | null = null;
    
  //   // Buscar por nombre de campo ("limpiar usuario")
  //   for (const field of fieldNames) {
  //     if (lower.includes(`limpiar ${field}`) || lower.includes(`borrar ${field}`)) {
  //       targetField = field;
  //       break;
  //     }
  //   }
    
  //   // Buscar por label ("limpiar nombre de usuario")
  //   if (!targetField) {
  //     for (const label of fieldLabels) {
  //       if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
  //         const index = fieldLabels.indexOf(label);
  //         if (index !== -1 && index < fieldNames.length) {
  //           targetField = fieldNames[index];
  //         }
  //         break;
  //       }
  //     }
  //   }
    
  //   // 🔥 "limpiar [campo]" → limpiar campo específico
  //   if (targetField) {
  //     const result = this.fieldCleanup.clearFieldByName(targetField);
  //     if (this.enableLogs) {
  //       this.logger.log(`🧹 [Orquestador] ${result.message}`);
  //     }
  //     this.voiceService.speak(result.message);
  //     return; // ← NO ENVIAR AL BACKEND
  //   }
    
  //   // 🔥 "limpiar campo" → limpiar campo enfocado
  //   const clearFieldCommands = ['limpiar campo', 'borrar campo', 'limpiar este campo', 'borrar este campo'];
  //   if (clearFieldCommands.some(cmd => lower.includes(cmd))) {
  //     const result = this.fieldCleanup.clearFocusedField();
  //     if (this.enableLogs) {
  //       this.logger.log(`🧹 [Orquestador] ${result.message}`);
  //     }
  //     this.voiceService.speak(result.message);
  //     return; // ← NO ENVIAR AL BACKEND
  //   }
    
  //   // 🔥 "limpiar campos" → limpiar todos los campos
  //   const clearAllCommands = ['limpiar campos', 'limpiar todo', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'];
  //   if (clearAllCommands.some(cmd => lower.includes(cmd))) {
  //     const result = this.fieldCleanup.clearAllFields();
  //     if (this.enableLogs) {
  //       this.logger.log(`🧹 [Orquestador] ${result.message}`);
  //     }
  //     this.voiceService.speak(result.message);
  //     return; // ← NO ENVIAR AL BACKEND
  //   }

  //   // 🔥 Ignorar TODOS los comandos locales en login
  //   if (isLocalCommand && isLoginPage) {
  //     if (this.enableLogs) {
  //       this.logger.log(`⏭️ [Orquestador] Comando local en login ignorado: "${text}"`);
  //     }
  //     return; // ← NO ENVIAR AL BACKEND
  //   }

  //   // ============================================================
  //   // RESTO DEL CÓDIGO ORIGINAL
  //   // ============================================================
  //   if (this.statusSubject.value === 'processing') {
  //     this.logger.warn('⚠️ Ya hay un comando en procesamiento');
  //     return;
  //   }

  //   this.lastCommandText = text;
  //   if (this.enableLogs) this.logger.log(`📤 Enviando comando: "${text}"`);
  //   this.statusSubject.next('processing');
  //   this.progressSubject.next(50);
  //   this.errorSubject.next(null);
  //   this.retryCount = 0;

  //   this.cleanupSubscription();
  //   this.processingSubscription = this.api.sendTextCommand(text, userId, includeAudio, timeoutMs)
  //     .pipe(
  //       timeout(timeoutMs),
  //       tap({
  //         next: (response) => this.handleSuccessResponse(response),
  //         error: (err) => this.handleProcessingError(err)
  //       }),
  //       finalize(() => { if (this.enableLogs) this.logger.log('🏁 Comando finalizado'); })
  //     )
  //     .subscribe();
  // }












  sendTextCommand(text: string, options: CommandOptions = {}): void {
    // ============================================================
    // 🔥 FILTRAR COMANDOS VACÍOS (NUNCA ENVIAR AL BACKEND)
    // ============================================================
    if (!text || text.trim().length === 0) {
      if (this.enableLogs) {
        this.logger.log(`⏭️ [Orquestador] Comando vacío ignorado`);
      }
      return; // ← NO HACER NADA, NO ENVIAR AL BACKEND
    }

    const { userId, timeoutMs = this.defaultTimeout, includeAudio = true } = options;

    // ============================================================
    // 🔥 FILTRAR COMANDOS LOCALES (NUNCA VAN AL BACKEND)
    // ============================================================
    const lower = text.toLowerCase().trim();
    
    // ✅ TODOS los comandos que NO deben ir al backend
    const localCommands = [
      // Comandos de dictado
      'usuario', 'contraseña', 'clave', 'password', 'pass', 'nombre', 'email', 'correo',
      'mayúscula', 'minúscula', 'rafa', 'fin', 'terminar', 'listo', 'ok', 'vale', 'hecho',
      'dictar', 'deletrear', 'escribir',
      // Comandos de acción (Login)
      'limpiar', 'borrar', 'resetear', 'empezar de cero', 'borrar campos', 'limpiar campos',
      'volver', 'atrás', 'regresar', 'retroceder', 'back',
      'enviar', 'logear', 'acceder', 'entrar', 'acceder al sistema',
      'iniciar sesión', 'login', 'ingresar',
      'ayuda', 'opciones', 'comandos', 'help',
      // Comandos de control de micrófono
      'silenciar', 'mute', 'apagar micrófono', 'dejar de escuchar',
      'activar micrófono', 'encender micrófono', 'unmute', 'escuchar',
      // Comandos de contraseña
      'mostrar contraseña', 'ver contraseña', 'mostrar clave', 'ver clave',
      'ocultar contraseña', 'ocultar clave', 'esconder contraseña',
      // Navegación
      'registro', 'registrar', 'crear cuenta', 'registrarme',
      'recuperar', 'olvidé', 'olvide contraseña',
      'privacidad', 'política de privacidad',
      'condiciones', 'términos', 'términos y condiciones'
    ];
    
    const isLocalCommand = localCommands.some(cmd => lower.includes(cmd));

    // Detectar el contexto actual
    const context = this.voiceContext.getContext();
    
    // ============================================================
    // 🔥 VERIFICAR preventBackend (NUNCA enviar al backend si está activo)
    // ============================================================
    if ((context as any)?.preventBackend) {
      if (this.enableLogs) {
        this.logger.log(`⏭️ [Orquestador] preventBackend activo, ignorando comando: "${text}"`);
      }
      return; // ← NO ENVIAR AL BACKEND
    }

    const activationMsg = context.activationMessage || '';
    const isLoginPage = activationMsg.includes('inicio de sesión') || 
                        activationMsg.includes('login') ||
                        activationMsg.includes('contraseña');

    // ============================================================
    // 🔥 COMANDOS DE LIMPIEZA UNIVERSAL (funcionan en cualquier página)
    // ============================================================
    
    // Verificar si es un comando de limpieza específico (ej: "limpiar usuario")
    const fieldNames = this.fieldCleanup.getFieldNames();
    const fieldLabels = this.fieldCleanup.getFieldLabels();
    
    let targetField: string | null = null;
    
    // Buscar por nombre de campo ("limpiar usuario")
    for (const field of fieldNames) {
      if (lower.includes(`limpiar ${field}`) || lower.includes(`borrar ${field}`)) {
        targetField = field;
        break;
      }
    }
    
    // Buscar por label ("limpiar nombre de usuario")
    if (!targetField) {
      for (const label of fieldLabels) {
        if (lower.includes(`limpiar ${label}`) || lower.includes(`borrar ${label}`)) {
          const index = fieldLabels.indexOf(label);
          if (index !== -1 && index < fieldNames.length) {
            targetField = fieldNames[index];
          }
          break;
        }
      }
    }
    
    // 🔥 "limpiar [campo]" → limpiar campo específico
    if (targetField) {
      const result = this.fieldCleanup.clearFieldByName(targetField);
      if (this.enableLogs) {
        this.logger.log(`🧹 [Orquestador] ${result.message}`);
      }
      this.voiceService.speak(result.message);
      return; // ← NO ENVIAR AL BACKEND
    }
    
    // 🔥 "limpiar campo" → limpiar campo enfocado
    const clearFieldCommands = ['limpiar campo', 'borrar campo', 'limpiar este campo', 'borrar este campo'];
    if (clearFieldCommands.some(cmd => lower.includes(cmd))) {
      const result = this.fieldCleanup.clearFocusedField();
      if (this.enableLogs) {
        this.logger.log(`🧹 [Orquestador] ${result.message}`);
      }
      this.voiceService.speak(result.message);
      return; // ← NO ENVIAR AL BACKEND
    }
    
    // 🔥 "limpiar campos" → limpiar todos los campos
    const clearAllCommands = ['limpiar campos', 'limpiar todo', 'borrar todo', 'resetear', 'empezar de cero', 'borrar campos'];
    if (clearAllCommands.some(cmd => lower.includes(cmd))) {
      const result = this.fieldCleanup.clearAllFields();
      if (this.enableLogs) {
        this.logger.log(`🧹 [Orquestador] ${result.message}`);
      }
      this.voiceService.speak(result.message);
      return; // ← NO ENVIAR AL BACKEND
    }

    // 🔥 Ignorar TODOS los comandos locales en login
    if (isLocalCommand && isLoginPage) {
      if (this.enableLogs) {
        this.logger.log(`⏭️ [Orquestador] Comando local en login ignorado: "${text}"`);
      }
      return; // ← NO ENVIAR AL BACKEND
    }

    // ============================================================
    // RESTO DEL CÓDIGO ORIGINAL (solo si llega hasta aquí)
    // ============================================================
    if (this.statusSubject.value === 'processing') {
      this.logger.warn('⚠️ Ya hay un comando en procesamiento');
      return;
    }

    this.lastCommandText = text;
    if (this.enableLogs) this.logger.log(`📤 Enviando comando: "${text}"`);
    this.statusSubject.next('processing');
    this.progressSubject.next(50);
    this.errorSubject.next(null);
    this.retryCount = 0;

    this.cleanupSubscription();
    this.processingSubscription = this.api.sendTextCommand(text, userId, includeAudio, timeoutMs)
      .pipe(
        timeout(timeoutMs),
        tap({
          next: (response) => this.handleSuccessResponse(response),
          error: (err) => this.handleProcessingError(err)
        }),
        finalize(() => { if (this.enableLogs) this.logger.log('🏁 Comando finalizado'); })
      )
      .subscribe();
  }








  //
  sendPriorityCommand(text: string, options: CommandOptions = {}): void {
    const priorityOptions = { ...options, timeoutMs: options.timeoutMs || 5000 };
    this.cancel();
    this.sendTextCommand(text, priorityOptions);
  }

  // ============================================================
  // ✅ MANEJO DE RESPUESTAS Y ERRORES
  // ============================================================

  private handleSuccessResponse(response: VoiceCommandResponse): void {
    if (this.enableLogs) this.logger.log('📥 Respuesta recibida:', response);
    this.progressSubject.next(100);
    this.retryCount = 0;
    if (response.success === undefined) response.success = true;
    if (response.intent === undefined) response.intent = 'success';
    if (!response.status) response.status = 'success';
    if (!response.reply || response.reply.trim().length === 0) {
      this.logger.warn('⚠️ Respuesta vacía recibida');
      response.reply = 'Comando procesado correctamente';
    }
    response.reply = this.getContextualMessage(response.reply);
    if (response.audioBase64) {
      this.playAudioFromBase64(response.audioBase64).catch(err => {
        this.logger.error('Error al reproducir audio:', err);
      });
    }
    this.responseSubject.next(response);
    this.statusSubject.next('done');
    this.scheduleAutoReset();
  }

  private handleProcessingError(err: any): void {
    this.logger.error('❌ Error en procesamiento:', err);
    if (this.retryCount < this.maxRetries && this.isRetryableError(err)) {
      this.retryCount++;
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 8000);
      if (this.enableLogs) this.logger.log(`🔄 Reintentando (${this.retryCount}/${this.maxRetries}) en ${delay}ms...`);
      setTimeout(() => {
        if (this.statusSubject.value === 'error' || this.statusSubject.value === 'processing') {
          if (this.enableLogs) this.logger.log('🔄 Ejecutando reintento...');
          if (this.lastCommandText) this.sendTextCommand(this.lastCommandText);
          else { this.statusSubject.next('processing'); this.retryCount = 0; }
        }
      }, delay);
      return;
    }
    const errorMessage = this.extractErrorMessage(err);
    console.log('📤 [handleProcessingError] Mensaje a usar:', errorMessage);
    const customReply = this.getContextualMessage(errorMessage);
    const errorResponse: VoiceCommandResponse = {
      success: false,
      intent: 'unknown',
      status: 'error',
      reply: customReply,
      error: customReply,
      data: { retryCount: this.retryCount, originalError: err },
      timestamp: new Date().toISOString()
    };
    this.responseSubject.next(errorResponse);
    this.errorSubject.next(customReply);
    this.statusSubject.next('error');
    this.retryCount = 0;
  }

  private isRetryableError(err: any): boolean {
    const retryableErrors = ['TimeoutError', 'NetworkError', 'ERR_CONNECTION_REFUSED', 'ERR_NETWORK', 'no-speech', 'audio-capture'];
    if (err.name && retryableErrors.includes(err.name)) return true;
    if (err.status) {
      const retryableStatus = [408, 429, 500, 502, 503, 504];
      if (retryableStatus.includes(err.status)) return true;
    }
    if (err.status === 'error' && err.error) {
      const errorMsg = err.error.toLowerCase();
      const retryableMessages = ['timeout', 'connection', 'network', 'temporarily'];
      if (retryableMessages.some(msg => errorMsg.includes(msg))) return true;
    }
    return false;
  }

  private extractErrorMessage(err: any): string {
    let result: string;
    let source: string = 'desconocido';
    if (typeof err === 'string') { result = err; source = 'string directo'; }
    else if (err.reply) { result = err.reply; source = 'err.reply'; }
    else if (err.error) {
      if (typeof err.error === 'string') { result = err.error; source = 'err.error (string)'; }
      else if (err.error.message) { result = err.error.message; source = 'err.error.message'; }
      else { result = 'Error sin mensaje en err.error'; source = 'err.error (sin mensaje)'; }
    } else if (err.message) { result = err.message; source = 'err.message'; }
    else { result = 'Error desconocido al procesar el comando'; source = 'fallback'; }
    console.log('🔍 [extractErrorMessage] Origen:', source);
    console.log('🔍 [extractErrorMessage] Objeto err completo:', err);
    console.log('🔍 [extractErrorMessage] Mensaje extraído:', result);
    return result;
  }

  // ============================================================
  // ✅ REPRODUCCIÓN DE AUDIO
  // ============================================================

  async playAudioFromBase64(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); if (this.enableLogs) this.logger.log('🔊 Audio reproducido correctamente'); resolve(); };
        audio.onerror = (err) => { URL.revokeObjectURL(url); this.logger.error('Error al reproducir audio:', err); reject(err); };
        audio.play().catch(err => { URL.revokeObjectURL(url); this.logger.error('Error al iniciar reproducción:', err); reject(err); });
      } catch (e) {
        this.logger.error('Error al decodificar audio:', e);
        reject(e);
      }
    });
  }

  // ============================================================
  // ✅ UTILIDADES
  // ============================================================

  getCurrentStatus(): VoiceStatus { return this.statusSubject.value; }
  getStatusLabel(): string {
    const labels: Record<VoiceStatus, string> = { 'idle': 'Listo', 'listening': 'Escuchando...', 'processing': 'Procesando...', 'done': 'Completado', 'error': 'Error' };
    return labels[this.statusSubject.value] || 'Listo';
  }
  getStatusIcon(): string {
    const icons: Record<VoiceStatus, string> = { 'idle': '🎤', 'listening': '🔴', 'processing': '⏳', 'done': '✅', 'error': '❌' };
    return icons[this.statusSubject.value] || '🎤';
  }
  getLastResponse(): VoiceCommandResponse | null { return this.responseSubject.value; }
  getLastError(): string | null { return this.errorSubject.value; }
  getProgress(): number { return this.progressSubject.value; }
  isProcessing(): boolean { return this.statusSubject.value === 'processing' || this.statusSubject.value === 'listening'; }
  isSuccess(): boolean { const response = this.responseSubject.value; return response ? isSuccessResponse(response) : false; }
  isError(): boolean { const response = this.responseSubject.value; return response ? isErrorResponse(response) : false; }

  cancel(): void {
    if (this.enableLogs) this.logger.log('⛔ Cancelando proceso...');
    this.cleanupSubscription();
    if (this.statusSubject.value === 'listening') this.audioRecorder.cancelRecording();
    this.statusSubject.next('idle');
    this.progressSubject.next(0);
    this.errorSubject.next(null);
    this.retryCount = 0;
  }

  reset(): void {
    if (this.enableLogs) this.logger.log('🔄 Reiniciando orquestador');
    this.cancel();
    this.responseSubject.next(null);
    this.errorSubject.next(null);
    this.statusSubject.next('idle');
    this.progressSubject.next(0);
    this.retryCount = 0;
    this.lastCommandText = '';
  }

  // ============================================================
  // ✅ PRIVADOS
  // ============================================================

  private cleanupSubscription(): void {
    if (this.processingSubscription) {
      this.processingSubscription.unsubscribe();
      this.processingSubscription = undefined;
    }
  }

  private scheduleAutoReset(): void {
    if (this.statusResetTimer) clearTimeout(this.statusResetTimer);
    this.statusResetTimer = setTimeout(() => {
      if (this.statusSubject.value === 'done' || this.statusSubject.value === 'error') {
        if (this.enableLogs) this.logger.log('🔄 Auto-reset después de inactividad');
        this.statusSubject.next('idle');
        this.progressSubject.next(0);
      }
      this.statusResetTimer = undefined;
    }, this.autoResetDelay);
  }

  private cleanup(): void {
    this.cleanupSubscription();
    if (this.statusResetTimer) { clearTimeout(this.statusResetTimer); this.statusResetTimer = undefined; }
    this.statusSubject.complete();
    this.responseSubject.complete();
    this.errorSubject.complete();
    this.progressSubject.complete();
    if (this.enableLogs) this.logger.log('🧹 Orquestador limpiado');
  }

  configure(config: OrchestratorConfig): void {
    if (config.defaultTimeout !== undefined) this.defaultTimeout = config.defaultTimeout;
    if (config.autoResetDelay !== undefined) this.autoResetDelay = config.autoResetDelay;
    if (config.maxRetries !== undefined) this.maxRetries = config.maxRetries;
    if (this.enableLogs) this.logger.log('⚙️ Orquestador configurado:', { defaultTimeout: this.defaultTimeout, autoResetDelay: this.autoResetDelay, maxRetries: this.maxRetries });
  }

  getConfig(): OrchestratorConfig {
    return { defaultTimeout: this.defaultTimeout, autoResetDelay: this.autoResetDelay, maxRetries: this.maxRetries };
  }
}