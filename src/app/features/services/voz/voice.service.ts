// // src/core/services/voz/voice.service.ts

// import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
// import { Observable, Subject, BehaviorSubject, firstValueFrom, filter, take, timeout } from 'rxjs';
// import { VoiceFilterService } from './voice-filter.service';
// import { VoiceCommandResponse } from '../../models/voz/VoiceCommandResponse-model';
// import { LoggerService } from '../../../shared/services/loggers/logger.service';
// import { VoiceContextService } from '../../../features/services/voz/voice-context.service';
// import { environment } from '../../../../environments/environment';
// import { UserPreferencesService } from '../../../shared/services/user-preferences/user-preferences.service';

// @Injectable({ providedIn: 'root' })
// export class VoiceService implements OnDestroy {
//   private recognition: any = null;
//   private isListening = false;
//   private ngZone = inject(NgZone);
//   private logger = inject(LoggerService);
//   private filterService = inject(VoiceFilterService);
//   private userPreferences = inject(UserPreferencesService);
//   private voiceContext = inject(VoiceContextService); // ✅ Inyectado

//   private transcriptSubject = new Subject<string>();
//   private currentTranscript = '';
//   private transcriptWithFinalSubject = new Subject<{ text: string; isFinal: boolean }>();
//   private responseSubject = new Subject<VoiceCommandResponse>();
//   private mutedSubject = new BehaviorSubject<boolean>(false);
//   private wakeWordSubject = new Subject<string>();
//   private errorSubject = new Subject<string>();

//   private listeningSubject = new BehaviorSubject<boolean>(false);
//   public listening$ = this.listeningSubject.asObservable();

//   private autoRestartSubject = new BehaviorSubject<boolean>(false);
//   public autoRestart$ = this.autoRestartSubject.asObservable();

//   private readySubject = new BehaviorSubject<boolean>(false);
//   public ready$ = this.readySubject.asObservable();

//   private readonly WAKE_WORDS = ['hola', 'asistente'];

//   // En la clase VoiceService
//   private ignoreNavCommandsUntil = 0;
//   private readonly NAV_BLOCK_MS = 1500;
//   private readonly NAV_COMMANDS = ['volver', 'atrás', 'atras', 'regresar', 'retroceder', 'cancelar'];

//   private isMuted = false;
//   private cachedVoice: SpeechSynthesisVoice | null = null;
//   private reconnectAttempts = 0;
//   private reconnectTimeout: any = null;

//   private isStarting = false;
//   private recognitionActive = false;

//   private lastWakeWordTime = 0;
//   private readonly WAKE_DEBOUNCE_TIME = 2000;

//   private headphonesMessageShown = false;
//   private headphonesCheckInterval: any = null;

//   private noHeadphonesMessageShown = false;
//   private noHeadphonesMessageTimeout: any = null;

//   private headphonesConnectedSubject = new BehaviorSubject<boolean>(false);
//   public headphonesConnected$ = this.headphonesConnectedSubject.asObservable();

//   private welcomeFlags = {
//     welcome: false,
//     about: false,
//     login: false,
//     init: false,
//     register: false,
//     notfound: false,
//     home: false,
//     dashboard: false
//   };

//   public muted$ = this.mutedSubject.asObservable();
//   public wakeWord$ = this.wakeWordSubject.asObservable();
//   public error$ = this.errorSubject.asObservable();
//   public response$ = this.responseSubject.asObservable();

//   private enableLogs = environment.enableLogs;
//   private lastProcessedTranscript = '';
//   private lastProcessedTime = 0;
//   private readonly GLOBAL_COMMAND_DEBOUNCE = 1500;
//   private restartCount = 0;

//   /**
//    * ✅ INICIALIZAR CON MICRÓFONO APAGADO PERO ESCUCHANDO "hola"
//    */
//   constructor() {
//     console.log('🔍 [VoiceService] CONSTRUCTOR INICIADO');
    
//     this.initRecognition();
//     this.loadVoices();
    
//     // ✅ SIEMPRE EMPEZAR CON MICRÓFONO APAGADO (PERO ESCUCHANDO)
//     this.isMuted = true;
//     this.mutedSubject.next(true);
//     this.listeningSubject.next(false);
//     this.readySubject.next(false);
    
//     if (this.enableLogs) {
//       this.logger.log(`🎤 ${this.voiceContext.getMessage('welcome')}`);
//     }

//     console.log('🔍 [VoiceService] Llamando a monitorHeadphones()...');
//     this.monitorHeadphones();
    
//     // ✅ INICIAR RECONOCIMIENTO (SIEMPRE ESCUCHANDO)
//     setTimeout(() => {
//       this.startListening();
//       console.log('🎤 Reconocimiento de voz activo (escuchando "hola")');
//     }, 1000);
    
//     // ✅ Detectar auriculares
//     setTimeout(() => {
//       this.checkHeadphonesOnStart();
//     }, 1500);
//   }

//   ngOnDestroy(): void {
//     if (this.headphonesCheckInterval) {
//       clearInterval(this.headphonesCheckInterval);
//       this.headphonesCheckInterval = null;
//     }
//     this.destroy();
//   }

//   // ============================================================
//   // INICIALIZACIÓN
//   // ============================================================

//   private loadVoices(): void {
//     if (window.speechSynthesis) {
//       window.speechSynthesis.getVoices();
//       window.speechSynthesis.onvoiceschanged = () => {
//         window.speechSynthesis.getVoices();
//         if (this.enableLogs) {
//           this.logger.log('🗣️ Voces cargadas');
//         }
//       };
//     }
//   }

//   areHeadphonesConnected(): boolean {
//     return this.headphonesConnectedSubject.value;
//   }

//   /**
//    * ✅ FORZAR DETECCIÓN - Ahora usa la detección REAL
//    */
//   async forceHeadphonesDetection(): Promise<boolean> {
//     console.log('🔧 [VoiceService] Forzando detección de auriculares...');
    
//     const hasHeadphones = await this.isHeadphonesConnected();
    
//     if (!hasHeadphones) {
//       console.log('🔇 [VoiceService] No se detectaron auriculares reales');
//       this.headphonesConnectedSubject.next(false);
//       return false;
//     }
    
//     console.log('🎧 [VoiceService] Auriculares reales detectados');
//     this.headphonesConnectedSubject.next(true);
//     return true;
//   }

//   async waitForHeadphonesDetection(): Promise<boolean> {
//     if (this.headphonesConnectedSubject.value !== null) {
//       return this.headphonesConnectedSubject.value;
//     }

//     return new Promise((resolve) => {
//       const subscription = this.headphonesConnected$.subscribe(value => {
//         if (value !== null) {
//           subscription.unsubscribe();
//           resolve(value);
//         }
//       });

//       setTimeout(() => {
//         subscription.unsubscribe();
//         resolve(false);
//       }, 5000);
//     });
//   }

//   private initRecognition(): void {
//     const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
//     const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

//     if (!SpeechRecognitionAPI) {
//       this.logger.warn('Web Speech API no soportada en este navegador');
//       return;
//     }

//     this.recognition = new SpeechRecognitionAPI();
//     this.recognition.continuous = true;
//     this.recognition.interimResults = true;
//     this.recognition.lang = 'es-ES';
//     this.recognition.maxAlternatives = 1;

//     this.recognition.onresult = this.handleResult.bind(this);
//     this.recognition.onerror = this.handleError.bind(this);
//     this.recognition.onend = this.handleEnd.bind(this);

//     this.recognition.onstart = () => {
//       this.ngZone.run(() => {
//         this.recognitionActive = true;
//         this.isListening = true;
//         this.readySubject.next(true);
//         console.log('🎤 Micrófono realmente activo (onstart)');
//       });
//     };

//     if (this.enableLogs) {
//       this.logger.log('✅ Speech Recognition inicializado');
//     }
//   }

//   public restartVoiceService(): void {
//     console.log('🔄 [VoiceService] Reiniciando servicio...');

//     this.stopListening();

//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }

//     this.isMuted = true;
//     this.mutedSubject.next(true);
//     this.listeningSubject.next(false);
//     this.readySubject.next(false);
//     this.recognitionActive = false;
//     this.isListening = false;
//     this.isStarting = false;
//     this.headphonesMessageShown = false;

//     if (this.recognition) {
//       try {
//         this.recognition.abort();
//         this.recognition = null;
//       } catch (e) {
//         // Ignorar
//       }
//     }

//     this.initRecognition();

//     setTimeout(() => {
//       this.startListening();
//       console.log('✅ [VoiceService] Servicio reiniciado correctamente');
//     }, 500);
//   }

//   // ============================================================
//   // MANEJO DE EVENTOS
//   // ============================================================
//   private handleResult(event: SpeechRecognitionEvent): void {
//     // 1. Validar que el sistema no está hablando
//     if (window.speechSynthesis.speaking) {
//       try {
//         const result = event.results[event.results.length - 1];
//         if (result && result[0]) {
//           const transcript = result[0].transcript.toLowerCase().trim();
//           if (transcript === 'hola' || transcript.includes('hola')) {
//             console.log('🔊 [VoiceService] "hola" detectado durante el habla, procesando...');
//           } else {
//             console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//             return;
//           }
//         } else {
//           console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//           return;
//         }
//       } catch {
//         console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//         return;
//       }
//     }

//     // 2. Obtener el transcript
//     if (!event.results || event.results.length === 0) return;

//     const result = event.results[event.results.length - 1];
//     if (!result || !result[0]) return;

//     const transcript = result[0].transcript.toLowerCase().trim();

//     if (this.enableLogs) {
//       console.log('🎤 Reconocido:', transcript, 'Final:', result.isFinal);
//     }

//     // 3. Manejar "hola" (activación del micrófono)
//     if (transcript === 'hola' || transcript === 'hola hola') {
//       this.handleWakeWord(transcript, result.isFinal);
//       return;
//     }

//     // 4. Manejar "silenciar"
//     if (transcript === 'silenciar' || transcript === 'mute' || 
//         transcript.includes('silenciar micrófono') || transcript.includes('apagar micrófono')) {
//       this.handleMute();
//       return;
//     }

//     // 5. Si el micrófono está muteado, solo permitir comandos esenciales
//     if (this.isMuted) {
//       const allowed = ['ayuda', 'help', 'hola', 'asistente'];
//       if (!allowed.includes(transcript)) {
//         console.log('🔇 [VoiceService] Muteado, ignorando:', transcript);
//         return;
//       }
//     }

//     // 6. ✅ DEBOUNCE GLOBAL: ignorar comandos duplicados en poco tiempo
//     const now = Date.now();
//     if (
//       transcript === this.lastProcessedTranscript &&
//       (now - this.lastProcessedTime) < this.GLOBAL_COMMAND_DEBOUNCE
//     ) {
//       console.log(`⏭️ [VoiceService] Comando duplicado ignorado globalmente: "${transcript}"`);
//       return;
//     }
//     this.lastProcessedTranscript = transcript;
//     this.lastProcessedTime = now;

//     // 7. ✅ SOLO EMITIR EL COMANDO (el componente decide qué hacer)
//     console.log('📤 [VoiceService] Emitiendo comando:', transcript);
//     this.transcriptSubject.next(transcript);
//     this.transcriptWithFinalSubject.next({ text: transcript, isFinal: result.isFinal });
//   }




//   private handleWakeWord(transcript: string, isFinal: boolean): void {
//     if (this.isMuted) {
//       const ahora = Date.now();
//       if (ahora - this.lastWakeWordTime > this.WAKE_DEBOUNCE_TIME) {
//         this.lastWakeWordTime = ahora;
//         this.unmute(); // ✅ Emite el mensaje del contexto
//         this.wakeWordSubject.next(transcript);
//       } else {
//         console.log('⏳ [VoiceService] Debounce: espera un momento');
//       }
//     } else {
//       // ✅ El micrófono ya está activo
//       console.log('🎤 [VoiceService] Micrófono ya activo');
//       // ❌ NO emitir mensajes de voz aquí (los emite el contexto)
//     }
//   }

//   private handleMute(): void {
//     if (!this.isMuted) {
//       this.mute();
//     } else {
//       console.log('ℹ️ [VoiceService] Micrófono ya está muteado');
//     }
//   }

//   //
//   private processWakeWord(transcript: string): void {
//     const ahora = Date.now();
    
//     if (ahora - this.lastWakeWordTime < this.WAKE_DEBOUNCE_TIME) {
//       if (this.enableLogs) {
//         this.logger.log('⏳ Wake word ignorada por debounce (demasiado rápido)');
//       }
//       return;
//     }
    
//     this.lastWakeWordTime = ahora;
    
//     if (this.isMuted) {
//       if (this.enableLogs) {
//         this.logger.log('🔊 Wake word detectada, activando micrófono');
//       }
//       this.unmute();
//       this.wakeWordSubject.next(transcript);
//     } else {
//       if (this.enableLogs) {
//         this.logger.log(`ℹ️ Wake word recibida pero micrófono ya activo: "${transcript}"`);
//       }
//     }
//   }

//   private handleError(event: SpeechRecognitionErrorEvent): void {
//     this.ngZone.run(() => {
//       if (event.error === 'no-speech') {
//         return;
//       }

//       console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
//       this.logger.error('Error en reconocimiento:', event.error);
//       this.errorSubject.next(event.error);

//       this.readySubject.next(false);
//       this.recognitionActive = false;

//       if (event.error === 'audio-capture') {
//         this.handleRecoverableError();
//       } else if (event.error === 'not-allowed') {
//         this.logger.error('❌ Permiso de micrófono denegado');
//         this.stopListening();
//         this.errorSubject.next(this.voiceContext.getMessage('permissionDenied'));
//         this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
//       } else {
//         this.logger.warn(`⚠️ Error recuperable (${event.error}), reintentando...`);
//         this.handleRecoverableError();
//       }
//     });
//   }

//   private handleRecoverableError(): void {
//     const delay = Math.min(500 * Math.pow(1.2, this.reconnectAttempts), 5000);
//     this.reconnectAttempts++;
    
//     if (this.enableLogs) {
//       this.logger.log(`⏳ Reintentando en ${delay}ms (intento #${this.reconnectAttempts})`);
//     }
    
//     this.reconnectTimeout = setTimeout(() => {
//       if (this.isListening && !this.isStarting) {
//         this.restart();
//       }
//     }, delay);
//   }

//   private handleEnd(): void {
//     console.log('🔍 [VoiceService] handleEnd:', {
//       isListening: this.isListening,
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       timestamp: new Date().toISOString()
//     });
    
//     this.isStarting = false;
//     this.isListening = false;
//     this.recognitionActive = false;
//     this.readySubject.next(false);
//     this.listeningSubject.next(false);
    
//     if (this.enableLogs) {
//       this.logger.log('🔴 Reconocimiento finalizado');
//     }
    
//     // ✅ SIEMPRE REINICIAR (para seguir escuchando "hola")
//     console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');
    
//     setTimeout(() => {
//       this.startListening();
//       console.log('🎤 [VoiceService] Reconocimiento reiniciado');
//     }, 500);
//   }

//   private restart(): void {
//     console.log('🔍 [VoiceService] restart() llamado:', {
//       isStarting: this.isStarting,
//       isListening: this.isListening,
//       timestamp: new Date().toISOString()
//     });
    
//     if (this.isStarting) return;
    
//     if (this.recognition && this.isListening) {
//       try {
//         this.recognitionActive = false;
//         this.recognition.stop();
        
//         this.autoRestartSubject.next(true);
        
//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             console.log('🔍 [VoiceService] → restart() llamando a startListening()');
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart');
//           }, 1000);
//         }, 100);
//       } catch (e) {
//         this.logger.warn('Error al reiniciar reconocimiento:', e);
//         this.autoRestartSubject.next(true);
//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             console.log('🔍 [VoiceService] → restart() (catch) llamando a startListening()');
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart (catch)');
//           }, 1000);
//         }, 300);
//       }
//     }
//   }

//   // ============================================================
//   // DETECCIÓN DE AURICULARES (MEJORADA)
//   // ============================================================

//   public async isHeadphonesConnected(): Promise<boolean> {
//     try {
//       console.log('🔍 [VoiceService] Iniciando detección de auriculares...');

//       if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
//         try {
//           const devices = await navigator.mediaDevices.enumerateDevices();
//           const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

//           console.log('🔍 [VoiceService] Audio outputs:', audioOutputs.length);
//           audioOutputs.forEach(d => console.log('  -', d.label || 'SIN ETIQUETA'));

//           const keywords = [
//             'headphone', 'earphone', 'headset', 'auricular', 
//             'bluetooth', 'wireless', 'stereo', 'hands-free',
//             'logitech', 'sony', 'jbl', 'apple', 'samsung'
//           ];
          
//           const hasHeadphones = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             const found = keywords.some(keyword => labelLower.includes(keyword));
//             if (found) {
//               console.log(`🔍 [VoiceService] Palabra clave encontrada: "${d.label}"`);
//             }
//             return found;
//           });

//           if (hasHeadphones) {
//             console.log('🎧 [VoiceService] Auriculares detectados POR ETIQUETA');
//             return true;
//           }

//           const speakerKeywords = ['speaker', 'altavoz', 'altoparlante'];
//           const isSpeakerOnly = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return speakerKeywords.some(keyword => labelLower.includes(keyword));
//           });

//           if (isSpeakerOnly && audioOutputs.length > 0) {
//             console.log('🔇 [VoiceService] Solo hay altavoces, NO auriculares');
//             return false;
//           }

//           const hasHeadphoneInName = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('headphone') || labelLower.includes('auricular');
//           });

//           if (hasHeadphoneInName) {
//             console.log('🎧 [VoiceService] Auriculares detectados por nombre');
//             return true;
//           }

//           const allSpeakers = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('speaker') || labelLower.includes('altavoz');
//           });

//           if (allSpeakers && audioOutputs.length > 1) {
//             console.log('🔇 [VoiceService] Múltiples altavoces, NO auriculares');
//             return false;
//           }

//           console.log('🔍 [VoiceService] Usando getUserMedia como respaldo...');
//           return await this.detectWithGetUserMedia();

//         } catch (error) {
//           console.warn('⚠️ [VoiceService] Error en enumerateDevices:', error);
//         }
//       }

//       console.log('🔇 [VoiceService] No se detectaron auriculares');
//       return false;

//     } catch (error) {
//       console.error('❌ [VoiceService] Error detectando auriculares:', error);
//       return false;
//     }
//   }

//   /**
//    * ✅ DETECCIÓN CON getUserMedia (respaldo)
//    */
//   private async detectWithGetUserMedia(): Promise<boolean> {
//     console.log('🎤 [VoiceService] Intentando getUserMedia...');
    
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       console.log('❌ [VoiceService] getUserMedia NO disponible');
//       return false;
//     }
    
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioTrack = stream.getAudioTracks()[0];
      
//       if (audioTrack) {
//         const settings = audioTrack.getSettings();
//         console.log('🔍 [VoiceService] Settings de audio:', settings);
        
//         if (settings.deviceId) {
//           console.log('🎧 [VoiceService] Dispositivo de audio detectado por getUserMedia');
//           stream.getTracks().forEach(track => track.stop());
          
//           if (settings.deviceId.length > 10) {
//             console.log('🎧 [VoiceService] Dispositivo externo detectado');
//             return true;
//           }
//           return true;
//         }
//       }
//       stream.getTracks().forEach(track => track.stop());
//     } catch (error: any) {
//       console.warn('⚠️ [VoiceService] Error en getUserMedia:', error);
      
//       if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
//         console.warn('🔴 [VoiceService] Permiso de micrófono denegado');
//         this.errorSubject.next('PERMISSION_DENIED');
//         this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
//         return false;
//       }
      
//       if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
//         console.warn('🔴 [VoiceService] No se encontró dispositivo de audio');
//         this.errorSubject.next('NO_AUDIO_DEVICE');
//         this.speakAlways(this.voiceContext.getMessage('noAudioDevice'));
//         return false;
//       }
//     }
    
//     console.log('🔇 [VoiceService] No se detectaron auriculares');
//     return false;
//   }

//   // ============================================================
//   // CHECK HEADPHONES ON START (CON PREFERENCIAS)
//   // ============================================================

//   private async checkHeadphonesOnStart(): Promise<void> {
//     const hasHeadphones = await this.isHeadphonesConnected();
    
//     this.headphonesConnectedSubject.next(hasHeadphones);

//     const prefs = this.userPreferences.getCurrentPreferences();
//     const userPrefersMic = prefs.micEnabled !== undefined ? prefs.micEnabled : true;

//     if (!hasHeadphones || !userPrefersMic) {
//       console.log('🔇 [VoiceService] Sin auriculares o usuario desactivó el micrófono');
//       this.isMuted = true;
//       this.mutedSubject.next(true);
      
//       if (!hasHeadphones) {
//         this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       }
//     } else {
//       console.log('🎧 [VoiceService] Auriculares conectados, pero micrófono permanece MUTEADO');
//       //this.speakAlways(this.voiceContext.getActivationMessage());
//     }
//   }

//   // ============================================================
//   // CONTROL DEL MICRÓFONO (CON PREFERENCIAS)
//   // ============================================================

//   async startListening(): Promise<void> {
//     console.log('🔍 [VoiceService] startListening() llamado:', {
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });

//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       console.log('🔇 [VoiceService] No hay auriculares conectados');

//       if (!this.noHeadphonesMessageShown) {
//         this.noHeadphonesMessageShown = true;
//         this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

//         if (this.noHeadphonesMessageTimeout) {
//           clearTimeout(this.noHeadphonesMessageTimeout);
//         }
//         this.noHeadphonesMessageTimeout = setTimeout(() => {
//           this.noHeadphonesMessageShown = false;
//           console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
//         }, 5000);
//       } else {
//         console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
//       }

//       return;
//     }

//     if (this.isStarting) {
//       this.logger.log('🎤 Inicio en curso, omitiendo');
//       return;
//     }

//     if (this.recognitionActive) {
//       this.logger.log('🎤 Reconocimiento ya activo');
//       return;
//     }

//     if (!this.recognition) {
//       this.logger.error('Speech recognition no disponible');
//       this.errorSubject.next('Speech recognition no disponible');
//       return;
//     }

//     this.isStarting = true;
//     this.listeningSubject.next(true);

//     try {
//       if (this.reconnectTimeout) {
//         clearTimeout(this.reconnectTimeout);
//         this.reconnectTimeout = null;
//       }

//       this.recognition.start();
//     } catch (e: any) {
//       this.isStarting = false;
      
//       if (e.name === 'InvalidStateError') {
//         this.logger.warn('Reconocimiento ya iniciado, reiniciando...');
//         this.recognitionActive = true;
//         this.isListening = true;
//         this.readySubject.next(true);
//       } else {
//         this.logger.warn('Error al iniciar reconocimiento:', e);
//         this.errorSubject.next('Error al activar el micrófono');
//         this.listeningSubject.next(false);
//         this.readySubject.next(false);
//       }
//     }
//   }

//   /**
//    * ✅ MONITOREAR AURICULARES (SIN ACTIVAR MICRÓFONO AUTOMÁTICAMENTE)
//   */
//   private monitorHeadphones(): void {
//     console.log('🔍 [VoiceService] monitorHeadphones() iniciado');
    
//     if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
//       console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
//       return;
//     }

//     this.headphonesCheckInterval = setInterval(async () => {
//       const hasHeadphones = await this.isHeadphonesConnected();
      
//       const previousState = this.headphonesConnectedSubject.value;
//       this.headphonesConnectedSubject.next(hasHeadphones);
      
//       // ✅ Solo avisar cuando hay un cambio de estado
//       if (hasHeadphones && !previousState) {
//         console.log('🎧 [VoiceService] Auriculares conectados');
        
//         // ✅ Solo emitir el aviso si la bienvenida del Home ya se mostró.
//         // Al arranque, la bienvenida aún no se ha mostrado y el Home
//         // se encarga de emitir su propio mensaje. Si emitiéramos aquí,
//         // el speakAlways() del Home cortaría este mensaje.
//         if (this.voiceContext.isWelcomeShown()) {
//           console.log('🔊 [VoiceService] Bienvenida ya mostrada, emitiendo aviso de auriculares');
//           this.speakAlways(this.voiceContext.getMessage('headphonesConnected'));
//         } else {
//           console.log('⏭️ [VoiceService] Bienvenida aún no mostrada, omitiendo aviso de auriculares');
//         }
//       } else if (!hasHeadphones && previousState) {
//         console.log('🔇 [VoiceService] Auriculares desconectados');
//         this.speakAlways(this.voiceContext.getMessage('headphonesDisconnected'));
//         // ✅ Mute automático al desconectar auriculares
//         if (!this.isMuted) {
//           this.mute();
//         }
//       }
      
//     }, 3000);
//   }

//   public restartRecognition(): void {
//     console.log('🔄 [VoiceService] Reiniciando reconocimiento...');
//     this.stopListening();
//     setTimeout(() => {
//       this.startListening();
//     }, 300);
//   }




//   stopListening(): void {
//     console.log('🔍 [VoiceService] stopListening() llamado:', {
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       timestamp: new Date().toISOString()
//     });

//     this.isStarting = false;

//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//       this.reconnectTimeout = null;
//     }

//     if (this.recognition && this.recognitionActive) {
//       try {
//         this.recognition.stop();
//         this.recognitionActive = false;
//         this.isListening = false;
//         this.reconnectAttempts = 0;

//         this.listeningSubject.next(false);
//         this.readySubject.next(false);

//         if (this.enableLogs) {
//           this.logger.log('🔇 Micrófono desactivado');
//         }
//       } catch (e) {
//         this.logger.warn('Error al desactivar micrófono:', e);
//         this.recognitionActive = false;
//         this.isListening = false;
//         this.listeningSubject.next(false);
//         this.readySubject.next(false);
//       }
//     } else {
//       this.recognitionActive = false;
//       this.isListening = false;
//       this.listeningSubject.next(false);
//       this.readySubject.next(false);
//     }
//   }

//   clearTranscript(): void {
//     console.log('🧹 [VoiceService] Limpiando transcript');
//     this.currentTranscript = '';
//     this.transcriptSubject.next('');
//     console.log('🧹 [VoiceService] Transcript limpiado (reconocimiento activo)');
//   }

//   abortRecognition(): void {
//     console.log('🛑 [VoiceService] Abortando reconocimiento');
//     if (this.recognition) {
//       try {
//         this.recognition.abort();
//       } catch (e) {
//         // Ignorar errores
//       }
//     }
//   }

//   // ============================================================
//   // MUTE / UNMUTE (CON PREFERENCIAS Y MENSAJES CENTRALIZADOS)
//   // ============================================================

//   /**
//    * ✅ MUTE (desactiva el sonido pero SIGUE ESCUCHANDO)
//    */
//   mute(): void {
//     console.log('🔍 [VoiceService] mute() llamado');
    
//     this.isMuted = true;
//     this.mutedSubject.next(true);
    
//     this.userPreferences.updatePreference('micEnabled', false).subscribe();
    
//     if (this.areHeadphonesConnected()) {
//       this.speakAlways(this.voiceContext.getMessage('micDeactivated'));
//     }
//   }

//   /**
//    * ✅ UNMUTE (activa el sonido)
//    */
//   async unmute(): Promise<void> {
//     console.log('🔍 [VoiceService] unmute() llamado');
    
//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }
    
//     if (!this.isMuted) {
//       console.log('🎤 Micrófono ya activo');
//       return;
//     }

//     this.isMuted = false;
//     this.mutedSubject.next(false);
    
//     this.userPreferences.updatePreference('micEnabled', true).subscribe();
    
//     // ✅ CAMBIADO: Usar activationMessage del contexto actual (mensaje por página)
//     const contextMessage = this.voiceContext.getActivationMessage();
//     this.speakAlways(contextMessage);
    
//     if (!this.recognitionActive || !this.isListening) {
//       this.startListening();
//     }
//   }

//   //
//   toggleMute(): void {
//     console.log('🔍 [VoiceService] toggleMute() llamado:', {
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });
//     this.isMuted ? this.unmute() : this.mute();
//   }

//   isCurrentlyMuted(): boolean {
//     return this.isMuted;
//   }

//   isRecognitionActive(): boolean {
//     return this.recognitionActive;
//   }

//   // ============================================================
//   // MÉTODOS PARA ACTUALIZAR CONTEXTO POR PÁGINA
//   // ============================================================

//   /**
//    * ✅ Configura el contexto de voz para la página actual
//    */
//   setContextForPage(page: 'login' | 'home' | 'about' | 'register' | 'dashboard'): void {
//     switch (page) {
//       case 'login':
//         this.voiceContext.setLoginContext();
//         break;
//       case 'home':
//         this.voiceContext.setHomeContext();
//         break;
//       case 'about':
//         this.voiceContext.setAboutContext();
//         break;
//       case 'register':
//         this.voiceContext.setRegisterContext();
//         break;
//       case 'dashboard':
//         this.voiceContext.setDashboardContext();
//         break;
//     }
    
//     // ✅ Reproducir mensaje de bienvenida del nuevo contexto
//     if (!this.isMuted) {
//       this.speakAlways(this.voiceContext.getActivationMessage());
//     }
//   }

//   /**
//    * ✅ Obtiene el mensaje de bienvenida de la página actual
//    */
//   getWelcomeMessageForCurrentPage(): string {
//     return this.voiceContext.getActivationMessage();
//   }

//   /**
//    * ✅ Obtiene los comandos disponibles del contexto actual
//    */
//   getAvailableCommands(): string[] {
//     return this.voiceContext.getAvailableCommands();
//   }

//   /**
//    * ✅ Verifica si un comando está disponible en el contexto actual
//    */
//   isCommandAvailable(command: string): boolean {
//     const availableCommands = this.voiceContext.getAvailableCommands();
//     return availableCommands.some(cmd => command.includes(cmd) || command === cmd);
//   }

//   // ============================================================
//   // SPEAK WHEN READY
//   // ============================================================

//   async speakWhenReady(text: string): Promise<void> {
//     if (this.recognitionActive && this.readySubject.value) {
//       return this.speak(text);
//     }
//     try {
//       await firstValueFrom(
//         this.ready$.pipe(
//           filter(ready => ready),
//           take(1),
//           timeout(5000)
//         )
//       );
//     } catch {
//       this.logger.warn('Timeout esperando reconocimiento, reproduciendo igual');
//     }
//     return this.speak(text);
//   }

//   waitForRecognitionReady(): Promise<void> {
//     return new Promise((resolve) => {
//       if (this.recognitionActive && this.readySubject.value) {
//         resolve();
//         return;
//       }
//       const checkInterval = setInterval(() => {
//         if (this.recognitionActive && this.readySubject.value) {
//           clearInterval(checkInterval);
//           resolve();
//         }
//       }, 100);
//       setTimeout(() => {
//         clearInterval(checkInterval);
//         resolve();
//       }, 3000);
//     });
//   }

//   // ============================================================
//   // CONTROL DE BIENVENIDA
//   // ============================================================

//   hasWelcomeBeenShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): boolean {
//     return this.welcomeFlags[page];
//   }

//   markWelcomeAsShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): void {
//     this.welcomeFlags[page] = true;
//     if (this.enableLogs) {
//       this.logger.log(`📌 Welcome marcado para: ${page}`);
//     }
//   }

//   resetWelcomeFlags(): void {
//     this.welcomeFlags = {
//       welcome: false,
//       about: false,
//       login: false,
//       init: false,
//       register: false,
//       notfound: false,
//       home: false,
//       dashboard: false
//     };
//     if (this.enableLogs) {
//       this.logger.log('🔄 Welcome flags reiniciados');
//     }
//   }

//   // ============================================================
//   // SÍNTESIS DE VOZ (TTS)
//   // ============================================================

//   private getNaturalVoice(lang: string): SpeechSynthesisVoice | null {
//     if (this.cachedVoice) return this.cachedVoice;
//     const voices = window.speechSynthesis.getVoices();
//     const preferred = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
//     this.cachedVoice = preferred.find(v =>
//       /google|samantha|microsoft|diego|helena|zira|david|clara|maria|juan/i.test(v.name)
//     ) || preferred[0] || null;
//     if (this.cachedVoice && this.enableLogs) {
//       this.logger.log(`🗣️ Voz seleccionada: ${this.cachedVoice.name} (${this.cachedVoice.lang})`);
//     }
//     return this.cachedVoice;
//   }

//   speak(text: string, lang: string = 'es-ES', rate: number = 0.9, pitch: number = 1.05): Promise<void> {
//     console.log('🔍 [VoiceService] speak() llamado:', {
//       text: text.substring(0, 50) + '...',
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });

//     return new Promise((resolve, reject) => {
//       if (this.isMuted) {
//         if (this.enableLogs) {
//           this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
//         }
//         resolve();
//         return;
//       }

//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         reject(new Error('Speech Synthesis no soportada'));
//         return;
//       }

//       window.speechSynthesis.cancel();

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = lang;
//       utterance.rate = rate;
//       utterance.pitch = pitch;
//       utterance.volume = 1;

//       const voice = this.getNaturalVoice(lang);
//       if (voice) {
//         utterance.voice = voice;
//       }

//       utterance.onend = () => {
//         console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
//         resolve();
//       };

//       utterance.onerror = (event) => {
//         if (event.error === 'interrupted') {
//           resolve();
//           return;
//         }
//         this.logger.warn('Error en síntesis de voz:', event);
//         reject(event);
//       };

//       window.speechSynthesis.speak(utterance);
//       if (this.enableLogs) {
//         this.logger.log(`🗣️ Hablando: "${text}"`);
//       }
//     });
//   }

//   public speakAlways(text: string): Promise<void> {
//     console.log('🔍 [VoiceService] speakAlways() llamado:', {
//       text: text.substring(0, 50) + '...',
//       isMuted: this.isMuted,
//       hasHeadphones: this.areHeadphonesConnected(),
//       timestamp: new Date().toISOString()
//     });

//     // ✅ SI NO HAY AURICULARES, NO HABLAR
//     if (!this.areHeadphonesConnected()) {
//       console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');
//       return Promise.resolve();
//     }

//     return new Promise((resolve, reject) => {
//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         reject(new Error('Speech Synthesis no soportada'));
//         return;
//       }

//       // ✅ NO FORZAR DETENCIÓN DEL MICRÓFONO
//       if (window.speechSynthesis.speaking) {
//         window.speechSynthesis.cancel();
//       }
      
//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = 'es-ES';
//       utterance.rate = 0.9;
//       utterance.pitch = 1.05;
//       utterance.volume = 1;
      
//       const voice = this.getNaturalVoice('es-ES');
//       if (voice) {
//         utterance.voice = voice;
//       }
      
//       utterance.onend = () => {
//         console.log('🔍 [VoiceService] → speakAlways() onend');
//         resolve();
//       };
      
//       utterance.onerror = (event) => {
//         if (event.error === 'interrupted') {
//           console.log('🔍 [VoiceService] → speakAlways() interrumpido');
//           resolve();
//           return;
//         }
//         this.logger.warn('Error en síntesis de voz:', event);
//         reject(event);
//       };
      
//       window.speechSynthesis.speak(utterance);
//       if (this.enableLogs) {
//         this.logger.log(`🗣️ Hablando (siempre): "${text}"`);
//       }
//     });
//   }

//   // ============================================================
//   // MÉTODOS PARA ENVIAR RESPUESTAS
//   // ============================================================

//   sendSuccessResponse(
//     reply: string,
//     action?: { type: string; payload?: Record<string, any> },
//     data?: any
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: true,
//       intent: 'success',
//       status: 'success',
//       reply,
//       action,
//       data,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   sendErrorResponse(
//     reply: string,
//     error?: string,
//     data?: any
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: false,
//       intent: 'error',
//       status: 'error',
//       reply,
//       error: error || reply,
//       data,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   sendAudioResponse(
//     reply: string,
//     audioBase64: string,
//     action?: { type: string; payload?: Record<string, any> }
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: true,
//       intent: 'audio',
//       status: 'success',
//       reply,
//       audioBase64,
//       action,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   // ============================================================
//   // OBSERVABLES PÚBLICOS
//   // ============================================================

//   getTranscript(): Observable<string> {
//     return this.transcriptSubject.asObservable();
//   }

//   getTranscriptWithFinal(): Observable<{ text: string; isFinal: boolean }> {
//     return this.transcriptWithFinalSubject.asObservable();
//   }

//   getResponses(): Observable<VoiceCommandResponse> {
//     return this.responseSubject.asObservable();
//   }

//   getMutedState(): Observable<boolean> {
//     return this.mutedSubject.asObservable();
//   }

//   getErrors(): Observable<string> {
//     return this.errorSubject.asObservable();
//   }

//   getWakeWords(): Observable<string> {
//     return this.wakeWordSubject.asObservable();
//   }

//   // ============================================================
//   // UTILIDADES
//   // ============================================================

//   isSupported(): boolean {
//     if (this.isFirefox()) {
//       console.warn('🦊 Firefox: SpeechRecognition no soportado nativamente');
//       return false;
//     }
//     const win = window as Record<string, any>;
//     return !!(win['SpeechRecognition'] || win['webkitSpeechRecognition']);
//   }

//   getBrowserSupportMessage(): string {
//     if (this.isFirefox()) {
//       return '⚠️ El reconocimiento de voz no está disponible en Firefox. Por favor, usa Chrome, Edge o Safari para usar comandos de voz.';
//     }
//     if (!this.isSupported()) {
//       return '⚠️ El reconocimiento de voz no está disponible en este navegador.';
//     }
//     return '';
//   }

//   isListeningActive(): boolean {
//     return this.isListening;
//   }

//   isSpeechSynthesisSupported(): boolean {
//     return !!(window.speechSynthesis);
//   }

//   isFullySupported(): boolean {
//     return this.isSupported() && this.isSpeechSynthesisSupported();
//   }

//   isFirefox(): boolean {
//     return navigator.userAgent.toLowerCase().includes('firefox');
//   }

//   // ============================================================
//   // LIMPIEZA
//   // ============================================================

//   destroy(): void {
//     if (this.enableLogs) {
//       this.logger.log('🧹 Destruyendo VoiceService...');
//     }

//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//       this.reconnectTimeout = null;
//     }

//     this.stopListening();

//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }

//     this.transcriptSubject.complete();
//     this.transcriptWithFinalSubject.complete();
//     this.responseSubject.complete();
//     this.mutedSubject.complete();
//     this.wakeWordSubject.complete();
//     this.errorSubject.complete();
//     this.listeningSubject.complete();
//     this.readySubject.complete();

//     this.filterService.reset();

//     if (this.recognition) {
//       this.recognition.onresult = null as any;
//       this.recognition.onerror = null as any;
//       this.recognition.onend = null as any;
//       this.recognition.onstart = null as any;
//       this.recognition = null as any;
//     }

//     if (this.enableLogs) {
//       this.logger.log('✅ VoiceService destruido correctamente');
//     }
//   }
// }














// // src/core/services/voz/voice.service.ts

// import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
// import { Observable, Subject, BehaviorSubject, firstValueFrom, filter, take, timeout } from 'rxjs';
// import { VoiceFilterService } from './voice-filter.service';
// import { VoiceCommandResponse } from '../../models/voz/VoiceCommandResponse-model';
// import { LoggerService } from '../../../shared/services/loggers/logger.service';
// import { VoiceContextService } from '../../../features/services/voz/voice-context.service';
// import { environment } from '../../../../environments/environment';
// import { UserPreferencesService } from '../../../shared/services/user-preferences/user-preferences.service';

// @Injectable({ providedIn: 'root' })
// export class VoiceService implements OnDestroy {
//   private recognition: any = null;
//   private isListening = false;
//   private ngZone = inject(NgZone);
//   private logger = inject(LoggerService);
//   private filterService = inject(VoiceFilterService);
//   private userPreferences = inject(UserPreferencesService);
//   private voiceContext = inject(VoiceContextService); // ✅ Inyectado

//   private transcriptSubject = new Subject<string>();
//   private currentTranscript = '';
//   private transcriptWithFinalSubject = new Subject<{ text: string; isFinal: boolean }>();
//   private responseSubject = new Subject<VoiceCommandResponse>();
//   private mutedSubject = new BehaviorSubject<boolean>(false);
//   private wakeWordSubject = new Subject<string>();
//   private errorSubject = new Subject<string>();

//   private listeningSubject = new BehaviorSubject<boolean>(false);
//   public listening$ = this.listeningSubject.asObservable();

//   private autoRestartSubject = new BehaviorSubject<boolean>(false);
//   public autoRestart$ = this.autoRestartSubject.asObservable();

//   private readySubject = new BehaviorSubject<boolean>(false);
//   public ready$ = this.readySubject.asObservable();

//   private readonly WAKE_WORDS = ['hola', 'asistente'];

//   // En la clase VoiceService
//   private ignoreNavCommandsUntil = 0;
//   private readonly NAV_BLOCK_MS = 3000;
//   private readonly NAV_COMMANDS = ['volver', 'atrás', 'atras', 'regresar', 'retroceder', 'cancelar'];

//   private isMuted = false;
//   private cachedVoice: SpeechSynthesisVoice | null = null;
//   private reconnectAttempts = 0;
//   private reconnectTimeout: any = null;

//   private isStarting = false;
//   private recognitionActive = false;

//   private isSpeaking = false;
//   private pendingPostTTSRestart = false;

//   private lastTTSEndTime = 0;
//   private speakToken = 0;

//   private lastWakeWordTime = 0;
//   private readonly WAKE_DEBOUNCE_TIME = 2000;

//   private headphonesMessageShown = false;
//   private headphonesCheckInterval: any = null;

//   private noHeadphonesMessageShown = false;
//   private noHeadphonesMessageTimeout: any = null;

//   private headphonesConnectedSubject = new BehaviorSubject<boolean>(false);
//   public headphonesConnected$ = this.headphonesConnectedSubject.asObservable();

//   private welcomeFlags = {
//     welcome: false,
//     about: false,
//     login: false,
//     init: false,
//     register: false,
//     notfound: false,
//     home: false,
//     dashboard: false
//   };

//   public muted$ = this.mutedSubject.asObservable();
//   public wakeWord$ = this.wakeWordSubject.asObservable();
//   public error$ = this.errorSubject.asObservable();
//   public response$ = this.responseSubject.asObservable();

//   private enableLogs = environment.enableLogs;
//   private lastProcessedTranscript = '';
//   private lastProcessedTime = 0;
//   private readonly GLOBAL_COMMAND_DEBOUNCE = 1500;
//   private restartCount = 0;

//   /**
//    * ✅ INICIALIZAR CON MICRÓFONO APAGADO PERO ESCUCHANDO "hola"
//    */
//   constructor() {
//     console.log('🔍 [VoiceService] CONSTRUCTOR INICIADO');
    
//     this.initRecognition();
//     this.loadVoices();
    
//     // ✅ SIEMPRE EMPEZAR CON MICRÓFONO APAGADO (PERO ESCUCHANDO)
//     this.isMuted = true;
//     this.mutedSubject.next(true);
//     this.listeningSubject.next(false);
//     this.readySubject.next(false);
    
//     if (this.enableLogs) {
//       this.logger.log(`🎤 ${this.voiceContext.getMessage('welcome')}`);
//     }

//     console.log('🔍 [VoiceService] Llamando a monitorHeadphones()...');
//     this.monitorHeadphones();
    
//     // ✅ INICIAR RECONOCIMIENTO (SIEMPRE ESCUCHANDO)
//     setTimeout(() => {
//       this.startListening();
//       console.log('🎤 Reconocimiento de voz activo (escuchando "hola")');
//     }, 1000);
    
//     // ✅ Detectar auriculares
//     setTimeout(() => {
//       this.checkHeadphonesOnStart();
//     }, 1500);
//   }

//   public getIsSpeaking(): boolean {
//     return this.isSpeaking;
//   }

//   // Bandera de bloqueo por navegación (la pones a true cuando navegas y a false tras 3000ms)
//   private navigationLockedUntil = 0;

//   public lockNavigation(ms: number = 3000): void {
//     this.navigationLockedUntil = Date.now() + ms;
//   }

//   private isNavigationLocked(): boolean {
//     return Date.now() < this.navigationLockedUntil;
//   }

//   // Ajusta esto si tu propiedad se llama distinto
//   // Asegúrate de tener `isDestroyed` en el servicio, o elimina esa comprobación

//   ngOnDestroy(): void {
//     if (this.headphonesCheckInterval) {
//       clearInterval(this.headphonesCheckInterval);
//       this.headphonesCheckInterval = null;
//     }
//     this.destroy();
//   }

//   // ============================================================
//   // INICIALIZACIÓN
//   // ============================================================

//   private loadVoices(): void {
//     if (window.speechSynthesis) {
//       window.speechSynthesis.getVoices();
//       window.speechSynthesis.onvoiceschanged = () => {
//         window.speechSynthesis.getVoices();
//         if (this.enableLogs) {
//           this.logger.log('🗣️ Voces cargadas');
//         }
//       };
//     }
//   }

//   areHeadphonesConnected(): boolean {
//     return this.headphonesConnectedSubject.value;
//   }

//   /**
//    * ✅ FORZAR DETECCIÓN - Ahora usa la detección REAL
//    */
//   async forceHeadphonesDetection(): Promise<boolean> {
//     console.log('🔧 [VoiceService] Forzando detección de auriculares...');
    
//     const hasHeadphones = await this.isHeadphonesConnected();
    
//     if (!hasHeadphones) {
//       console.log('🔇 [VoiceService] No se detectaron auriculares reales');
//       this.headphonesConnectedSubject.next(false);
//       return false;
//     }
    
//     console.log('🎧 [VoiceService] Auriculares reales detectados');
//     this.headphonesConnectedSubject.next(true);
//     return true;
//   }

//   async waitForHeadphonesDetection(): Promise<boolean> {
//     if (this.headphonesConnectedSubject.value !== null) {
//       return this.headphonesConnectedSubject.value;
//     }

//     return new Promise((resolve) => {
//       const subscription = this.headphonesConnected$.subscribe(value => {
//         if (value !== null) {
//           subscription.unsubscribe();
//           resolve(value);
//         }
//       });

//       setTimeout(() => {
//         subscription.unsubscribe();
//         resolve(false);
//       }, 5000);
//     });
//   }

//   private initRecognition(): void {
//     const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
//     const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

//     if (!SpeechRecognitionAPI) {
//       this.logger.warn('Web Speech API no soportada en este navegador');
//       return;
//     }

//     this.recognition = new SpeechRecognitionAPI();
//     this.recognition.continuous = true;
//     this.recognition.interimResults = true;
//     this.recognition.lang = 'es-ES';
//     this.recognition.maxAlternatives = 1;

//     this.recognition.onresult = this.handleResult.bind(this);
//     this.recognition.onerror = this.handleError.bind(this);
//     this.recognition.onend = this.handleEnd.bind(this);

//     this.recognition.onstart = () => {
//       this.ngZone.run(() => {
//         this.recognitionActive = true;
//         this.isListening = true;
//         this.readySubject.next(true);
//         console.log('🎤 Micrófono realmente activo (onstart)');
//       });
//     };

//     if (this.enableLogs) {
//       this.logger.log('✅ Speech Recognition inicializado');
//     }
//   }

//   public restartVoiceService(): void {
//     console.log('🔄 [VoiceService] Reiniciando servicio...');

//     this.stopListening();

//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }

//     this.isMuted = true;
//     this.mutedSubject.next(true);
//     this.listeningSubject.next(false);
//     this.readySubject.next(false);
//     this.recognitionActive = false;
//     this.isListening = false;
//     this.isStarting = false;
//     this.headphonesMessageShown = false;

//     if (this.recognition) {
//       try {
//         this.recognition.abort();
//         this.recognition = null;
//       } catch (e) {
//         // Ignorar
//       }
//     }

//     this.initRecognition();

//     setTimeout(() => {
//       this.startListening();
//       console.log('✅ [VoiceService] Servicio reiniciado correctamente');
//     }, 500);
//   }

//   // ============================================================
//   // MANEJO DE EVENTOS
//   // ============================================================
//   private handleResult(event: SpeechRecognitionEvent): void {
//     // 1. Validar que el sistema no está hablando
//     if (window.speechSynthesis.speaking) {
//       try {
//         const result = event.results[event.results.length - 1];
//         if (result && result[0]) {
//           const transcript = result[0].transcript.toLowerCase().trim();
//           if (transcript === 'hola' || transcript.includes('hola')) {
//             console.log('🔊 [VoiceService] "hola" detectado durante el habla, procesando...');
//           } else {
//             console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//             return;
//           }
//         } else {
//           console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//           return;
//         }
//       } catch {
//         console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//         return;
//       }
//     }

//     // 2. Obtener el transcript
//     if (!event.results || event.results.length === 0) return;

//     const result = event.results[event.results.length - 1];
//     if (!result || !result[0]) return;

//     const transcript = result[0].transcript.toLowerCase().trim();

//     if (this.enableLogs) {
//       console.log('🎤 Reconocido:', transcript, 'Final:', result.isFinal);
//     }

//     // 3. Manejar "hola" (activación del micrófono)
//     if (transcript === 'hola' || transcript === 'hola hola') {
//       this.handleWakeWord(transcript, result.isFinal);
//       return;
//     }

//     // 4. Manejar "silenciar"
//     if (transcript === 'silenciar' || transcript === 'mute' || 
//         transcript.includes('silenciar micrófono') || transcript.includes('apagar micrófono')) {
//       this.handleMute();
//       return;
//     }

//     // 5. Si el micrófono está muteado, solo permitir comandos esenciales
//     if (this.isMuted) {
//       const allowed = ['ayuda', 'help', 'hola', 'asistente'];
//       if (!allowed.includes(transcript)) {
//         console.log('🔇 [VoiceService] Muteado, ignorando:', transcript);
//         return;
//       }
//     }

//     // 6. ✅ BLOQUEAR COMANDOS DE NAVEGACIÓN TRAS UNA NAVEGACIÓN RECIENTE
//     //    (evita que el eco del comando anterior llegue al componente nuevo)
//     if (this.isNavigationCommand(transcript) && Date.now() < this.ignoreNavCommandsUntil) {
//       console.log(`⏭️ [VoiceService] Comando de navegación ignorado tras navegación: "${transcript}"`);
//       return;
//     }

//     // 7. ✅ DEBOUNCE GLOBAL: ignorar comandos duplicados en poco tiempo
//     const now = Date.now();
//     if (
//       transcript === this.lastProcessedTranscript &&
//       (now - this.lastProcessedTime) < this.GLOBAL_COMMAND_DEBOUNCE
//     ) {
//       console.log(`⏭️ [VoiceService] Comando duplicado ignorado globalmente: "${transcript}"`);
//       return;
//     }
//     this.lastProcessedTranscript = transcript;
//     this.lastProcessedTime = now;

//     // 8. ✅ SOLO EMITIR EL COMANDO (el componente decide qué hacer)
//     console.log('📤 [VoiceService] Emitiendo comando:', transcript);
//     this.transcriptSubject.next(transcript);
//     this.transcriptWithFinalSubject.next({ text: transcript, isFinal: result.isFinal });
//   }




//   private handleWakeWord(transcript: string, isFinal: boolean): void {
//     if (this.isMuted) {
//       const ahora = Date.now();
//       if (ahora - this.lastWakeWordTime > this.WAKE_DEBOUNCE_TIME) {
//         this.lastWakeWordTime = ahora;
//         this.unmute(); // ✅ Emite el mensaje del contexto
//         this.wakeWordSubject.next(transcript);
//       } else {
//         console.log('⏳ [VoiceService] Debounce: espera un momento');
//       }
//     } else {
//       // ✅ El micrófono ya está activo
//       console.log('🎤 [VoiceService] Micrófono ya activo');
//       // ❌ NO emitir mensajes de voz aquí (los emite el contexto)
//     }
//   }

//   private handleMute(): void {
//     if (!this.isMuted) {
//       this.mute();
//     } else {
//       console.log('ℹ️ [VoiceService] Micrófono ya está muteado');
//     }
//   }

//   //
//   private processWakeWord(transcript: string): void {
//     const ahora = Date.now();
    
//     if (ahora - this.lastWakeWordTime < this.WAKE_DEBOUNCE_TIME) {
//       if (this.enableLogs) {
//         this.logger.log('⏳ Wake word ignorada por debounce (demasiado rápido)');
//       }
//       return;
//     }
    
//     this.lastWakeWordTime = ahora;
    
//     if (this.isMuted) {
//       if (this.enableLogs) {
//         this.logger.log('🔊 Wake word detectada, activando micrófono');
//       }
//       this.unmute();
//       this.wakeWordSubject.next(transcript);
//     } else {
//       if (this.enableLogs) {
//         this.logger.log(`ℹ️ Wake word recibida pero micrófono ya activo: "${transcript}"`);
//       }
//     }
//   }

//   private handleError(event: SpeechRecognitionErrorEvent): void {
//     this.ngZone.run(() => {
//       if (event.error === 'no-speech') {
//         return;
//       }

//       console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
//       this.logger.error('Error en reconocimiento:', event.error);
//       this.errorSubject.next(event.error);

//       this.readySubject.next(false);
//       this.recognitionActive = false;

//       if (event.error === 'audio-capture') {
//         this.handleRecoverableError();
//       } else if (event.error === 'not-allowed') {
//         this.logger.error('❌ Permiso de micrófono denegado');
//         this.stopListening();
//         this.errorSubject.next(this.voiceContext.getMessage('permissionDenied'));
//         this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
//       } else {
//         this.logger.warn(`⚠️ Error recuperable (${event.error}), reintentando...`);
//         this.handleRecoverableError();
//       }
//     });
//   }

//   //
//   private handleRecoverableError(): void {
//     const delay = Math.min(500 * Math.pow(1.2, this.reconnectAttempts), 5000);
//     this.reconnectAttempts++;

//     if (this.enableLogs) {
//       this.logger.log(`⏳ Reintentando en ${delay}ms (intento #${this.reconnectAttempts})`);
//     }

//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//     }

//     this.reconnectTimeout = setTimeout(() => {
//       if (this.isSpeaking) {
//         console.log('⏸️ [VoiceService] reconnectTimeout → TTS activo, reprogramando');
//         this.handleRecoverableError();
//         return;
//       }
//       if (this.pendingPostTTSRestart) {
//         console.log('⏸️ [VoiceService] reconnectTimeout → pendiente reinicio del componente');
//         return;
//       }
//       if (this.isMuted) {
//         console.log('🔇 [VoiceService] reconnectTimeout → micrófono muteado');
//         return;
//       }
//       if (this.recognitionActive) {
//         console.log('ℹ️ [VoiceService] reconnectTimeout → reconocimiento ya activo');
//         return;
//       }

//       console.log('🔄 [VoiceService] reconnectTimeout → reiniciando reconocimiento tras error');
//       this.reconnectAttempts = 0;
//       this.startListening();
//     }, delay);
//   }

//   //
//   private handleEnd(): void {
//     console.log('🔍 [VoiceService] handleEnd:', {
//       isListening: this.isListening,
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       isSpeaking: this.isSpeaking,
//       msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
//       pendingPostTTSRestart: this.pendingPostTTSRestart,
//       timestamp: new Date().toISOString()
//     });

//     this.isStarting = false;
//     this.isListening = false;
//     this.recognitionActive = false;
//     this.readySubject.next(false);
//     this.listeningSubject.next(false);

//     if (this.enableLogs) {
//       this.logger.log('🔴 Reconocimiento finalizado');
//     }

//     // ✅ 1. SI EL TTS ESTÁ HABLANDO AHORA MISMO, NO REINICIAR
//     if (this.isSpeaking) {
//       console.log('⏸️ [VoiceService] handleEnd → TTS activo, NO se reinicia automáticamente');

//       // 🔁 Reintento diferido por si el TTS no dispara el reconnect ni pendingPostTTSRestart
//       setTimeout(() => {
//         if (this.isSpeaking) return;
//         if (this.pendingPostTTSRestart) return;
//         if (this.isMuted) return;
//         if (this.recognitionActive) return;

//         console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
//         this.startListening();
//       }, 1500);

//       return;
//     }

//     // ✅ 2. SI EL COMPONENTE DEBE REINICIAR TRAS EL TTS, NO REINICIAR AQUÍ
//     if (this.pendingPostTTSRestart) {
//       console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO se reinicia automáticamente');
//       return;
//     }

//     // ✅ 3. RESPETAR BLOQUEO POR NAVEGACIÓN
//     if (this.isNavigationLocked()) {
//       console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
//       setTimeout(() => {
//         if (this.isSpeaking) return;
//         if (this.pendingPostTTSRestart) return;
//         if (!this.isNavigationLocked() && !this.recognitionActive) {
//           this.startListening();
//           console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
//         }
//       }, 3100);
//       return;
//     }

//     // ✅ 4. SI EL USUARIO MUTEÓ, NO REINICIAR
//     if (this.isMuted) {
//       console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
//       return;
//     }

//     console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');

//     setTimeout(() => {
//       if (this.isSpeaking) {
//         console.log('⏸️ [VoiceService] reinicio cancelado: TTS sigue activo');
//         return;
//       }
//       if (this.pendingPostTTSRestart) {
//         console.log('⏸️ [VoiceService] reinicio cancelado: pendiente reinicio del componente');
//         return;
//       }
//       if (!this.isMuted && !this.recognitionActive) {
//         this.startListening();
//         console.log('🎤 [VoiceService] Reconocimiento reiniciado');
//       }
//     }, 500);
//   }

//   //
//   private restart(): void {
//     console.log('🔍 [VoiceService] restart() llamado:', {
//       isStarting: this.isStarting,
//       isListening: this.isListening,
//       timestamp: new Date().toISOString()
//     });
    
//     if (this.isStarting) return;
    
//     if (this.recognition && this.isListening) {
//       try {
//         this.recognitionActive = false;
//         this.recognition.stop();
        
//         this.autoRestartSubject.next(true);
        
//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             console.log('🔍 [VoiceService] → restart() llamando a startListening()');
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart');
//           }, 1000);
//         }, 100);
//       } catch (e) {
//         this.logger.warn('Error al reiniciar reconocimiento:', e);
//         this.autoRestartSubject.next(true);
//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             console.log('🔍 [VoiceService] → restart() (catch) llamando a startListening()');
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart (catch)');
//           }, 1000);
//         }, 300);
//       }
//     }
//   }

//   // ============================================================
//   // DETECCIÓN DE AURICULARES (MEJORADA)
//   // ============================================================

//   public async isHeadphonesConnected(): Promise<boolean> {
//     try {
//       console.log('🔍 [VoiceService] Iniciando detección de auriculares...');

//       if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
//         try {
//           const devices = await navigator.mediaDevices.enumerateDevices();
//           const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

//           console.log('🔍 [VoiceService] Audio outputs:', audioOutputs.length);
//           audioOutputs.forEach(d => console.log('  -', d.label || 'SIN ETIQUETA'));

//           const keywords = [
//             'headphone', 'earphone', 'headset', 'auricular', 
//             'bluetooth', 'wireless', 'stereo', 'hands-free',
//             'logitech', 'sony', 'jbl', 'apple', 'samsung'
//           ];
          
//           const hasHeadphones = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             const found = keywords.some(keyword => labelLower.includes(keyword));
//             if (found) {
//               console.log(`🔍 [VoiceService] Palabra clave encontrada: "${d.label}"`);
//             }
//             return found;
//           });

//           if (hasHeadphones) {
//             console.log('🎧 [VoiceService] Auriculares detectados POR ETIQUETA');
//             return true;
//           }

//           const speakerKeywords = ['speaker', 'altavoz', 'altoparlante'];
//           const isSpeakerOnly = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return speakerKeywords.some(keyword => labelLower.includes(keyword));
//           });

//           if (isSpeakerOnly && audioOutputs.length > 0) {
//             console.log('🔇 [VoiceService] Solo hay altavoces, NO auriculares');
//             return false;
//           }

//           const hasHeadphoneInName = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('headphone') || labelLower.includes('auricular');
//           });

//           if (hasHeadphoneInName) {
//             console.log('🎧 [VoiceService] Auriculares detectados por nombre');
//             return true;
//           }

//           const allSpeakers = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('speaker') || labelLower.includes('altavoz');
//           });

//           if (allSpeakers && audioOutputs.length > 1) {
//             console.log('🔇 [VoiceService] Múltiples altavoces, NO auriculares');
//             return false;
//           }

//           console.log('🔍 [VoiceService] Usando getUserMedia como respaldo...');
//           return await this.detectWithGetUserMedia();

//         } catch (error) {
//           console.warn('⚠️ [VoiceService] Error en enumerateDevices:', error);
//         }
//       }

//       console.log('🔇 [VoiceService] No se detectaron auriculares');
//       return false;

//     } catch (error) {
//       console.error('❌ [VoiceService] Error detectando auriculares:', error);
//       return false;
//     }
//   }

//   /**
//    * ✅ DETECCIÓN CON getUserMedia (respaldo)
//    */
//   private async detectWithGetUserMedia(): Promise<boolean> {
//     console.log('🎤 [VoiceService] Intentando getUserMedia...');
    
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       console.log('❌ [VoiceService] getUserMedia NO disponible');
//       return false;
//     }
    
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioTrack = stream.getAudioTracks()[0];
      
//       if (audioTrack) {
//         const settings = audioTrack.getSettings();
//         console.log('🔍 [VoiceService] Settings de audio:', settings);
        
//         if (settings.deviceId) {
//           console.log('🎧 [VoiceService] Dispositivo de audio detectado por getUserMedia');
//           stream.getTracks().forEach(track => track.stop());
          
//           if (settings.deviceId.length > 10) {
//             console.log('🎧 [VoiceService] Dispositivo externo detectado');
//             return true;
//           }
//           return true;
//         }
//       }
//       stream.getTracks().forEach(track => track.stop());
//     } catch (error: any) {
//       console.warn('⚠️ [VoiceService] Error en getUserMedia:', error);
      
//       if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
//         console.warn('🔴 [VoiceService] Permiso de micrófono denegado');
//         this.errorSubject.next('PERMISSION_DENIED');
//         this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
//         return false;
//       }
      
//       if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
//         console.warn('🔴 [VoiceService] No se encontró dispositivo de audio');
//         this.errorSubject.next('NO_AUDIO_DEVICE');
//         this.speakAlways(this.voiceContext.getMessage('noAudioDevice'));
//         return false;
//       }
//     }
    
//     console.log('🔇 [VoiceService] No se detectaron auriculares');
//     return false;
//   }

//   // ============================================================
//   // CHECK HEADPHONES ON START (CON PREFERENCIAS)
//   // ============================================================

//   private async checkHeadphonesOnStart(): Promise<void> {
//     const hasHeadphones = await this.isHeadphonesConnected();
    
//     this.headphonesConnectedSubject.next(hasHeadphones);

//     const prefs = this.userPreferences.getCurrentPreferences();
//     const userPrefersMic = prefs.micEnabled !== undefined ? prefs.micEnabled : true;

//     if (!hasHeadphones || !userPrefersMic) {
//       console.log('🔇 [VoiceService] Sin auriculares o usuario desactivó el micrófono');
//       this.isMuted = true;
//       this.mutedSubject.next(true);
      
//       if (!hasHeadphones) {
//         this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       }
//     } else {
//       console.log('🎧 [VoiceService] Auriculares conectados, pero micrófono permanece MUTEADO');
//       //this.speakAlways(this.voiceContext.getActivationMessage());
//     }
//   }

//   // ============================================================
//   // CONTROL DEL MICRÓFONO (CON PREFERENCIAS)
//   // ============================================================

//   async startListening(): Promise<void> {
//     this.pendingPostTTSRestart = false;   
//     console.log('🔍 [VoiceService] startListening() llamado:', {
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });

//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       console.log('🔇 [VoiceService] No hay auriculares conectados');

//       if (!this.noHeadphonesMessageShown) {
//         this.noHeadphonesMessageShown = true;
//         this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

//         if (this.noHeadphonesMessageTimeout) {
//           clearTimeout(this.noHeadphonesMessageTimeout);
//         }
//         this.noHeadphonesMessageTimeout = setTimeout(() => {
//           this.noHeadphonesMessageShown = false;
//           console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
//         }, 5000);
//       } else {
//         console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
//       }

//       return;
//     }

//     if (this.isStarting) {
//       this.logger.log('🎤 Inicio en curso, omitiendo');
//       return;
//     }

//     if (this.recognitionActive) {
//       this.logger.log('🎤 Reconocimiento ya activo');
//       return;
//     }

//     if (!this.recognition) {
//       this.logger.error('Speech recognition no disponible');
//       this.errorSubject.next('Speech recognition no disponible');
//       return;
//     }

//     this.isStarting = true;
//     this.listeningSubject.next(true);

//     try {
//       if (this.reconnectTimeout) {
//         clearTimeout(this.reconnectTimeout);
//         this.reconnectTimeout = null;
//       }

//       this.recognition.start();
//     } catch (e: any) {
//       this.isStarting = false;
      
//       if (e.name === 'InvalidStateError') {
//         this.logger.warn('Reconocimiento ya iniciado, reiniciando...');
//         this.recognitionActive = true;
//         this.isListening = true;
//         this.readySubject.next(true);
//       } else {
//         this.logger.warn('Error al iniciar reconocimiento:', e);
//         this.errorSubject.next('Error al activar el micrófono');
//         this.listeningSubject.next(false);
//         this.readySubject.next(false);
//       }
//     }
//   }

//   /**
//    * ✅ MONITOREAR AURICULARES (SIN ACTIVAR MICRÓFONO AUTOMÁTICAMENTE)
//   */
//   private monitorHeadphones(): void {
//     console.log('🔍 [VoiceService] monitorHeadphones() iniciado');
    
//     if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
//       console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
//       return;
//     }

//     this.headphonesCheckInterval = setInterval(async () => {
//       const hasHeadphones = await this.isHeadphonesConnected();
      
//       const previousState = this.headphonesConnectedSubject.value;
//       this.headphonesConnectedSubject.next(hasHeadphones);
      
//       // ✅ Solo avisar cuando hay un cambio de estado
//       if (hasHeadphones && !previousState) {
//         console.log('🎧 [VoiceService] Auriculares conectados');
        
//         // ✅ Solo emitir el aviso si la bienvenida del Home ya se mostró.
//         // Al arranque, la bienvenida aún no se ha mostrado y el Home
//         // se encarga de emitir su propio mensaje. Si emitiéramos aquí,
//         // el speakAlways() del Home cortaría este mensaje.
//         if (this.voiceContext.isWelcomeShown()) {
//           console.log('🔊 [VoiceService] Bienvenida ya mostrada, emitiendo aviso de auriculares');
//           this.speakAlways(this.voiceContext.getMessage('headphonesConnected'));
//         } else {
//           console.log('⏭️ [VoiceService] Bienvenida aún no mostrada, omitiendo aviso de auriculares');
//         }
//       } else if (!hasHeadphones && previousState) {
//         console.log('🔇 [VoiceService] Auriculares desconectados');
//         this.speakAlways(this.voiceContext.getMessage('headphonesDisconnected'));
//         // ✅ Mute automático al desconectar auriculares
//         if (!this.isMuted) {
//           this.mute();
//         }
//       }
      
//     }, 3000);
//   }

//   public restartRecognition(): void {
//     console.log('🔄 [VoiceService] Reiniciando reconocimiento...');
//     this.stopListening();
//     setTimeout(() => {
//       this.startListening();
//     }, 300);
//   }

//   /**
//    * ✅ Llamado por AppComponent en cada NavigationEnd.
//    * Bloquea los comandos de navegación ("volver", "atrás"...) durante
//    * NAV_BLOCK_MS ms para evitar que el eco del comando anterior llegue
//    * al componente recién cargado.
//   */
//   public onNavigate(): void {
//     this.ignoreNavCommandsUntil = Date.now() + this.NAV_BLOCK_MS;
//     this.lockNavigation(this.NAV_BLOCK_MS);            // ← AÑADIR
//     console.log(`🔇 [VoiceService] Comandos de navegación bloqueados durante ${this.NAV_BLOCK_MS}ms`);
//   }

//   /**
//    * ✅ Detecta si un comando es de navegación hacia atrás.
//    */
//   private isNavigationCommand(text: string): boolean {
//     const lower = text.toLowerCase().trim();
//     return this.NAV_COMMANDS.some(cmd => lower === cmd || lower.includes(cmd));
//   }

//   stopListening(): void {
//     console.log('🔍 [VoiceService] stopListening() llamado:', {
//       isStarting: this.isStarting,
//       recognitionActive: this.recognitionActive,
//       timestamp: new Date().toISOString()
//     });

//     this.isStarting = false;

//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//       this.reconnectTimeout = null;
//     }

//     if (this.recognition && this.recognitionActive) {
//       try {
//         this.recognition.stop();
//         this.recognitionActive = false;
//         this.isListening = false;
//         this.reconnectAttempts = 0;

//         this.listeningSubject.next(false);
//         this.readySubject.next(false);

//         if (this.enableLogs) {
//           this.logger.log('🔇 Micrófono desactivado');
//         }
//       } catch (e) {
//         this.logger.warn('Error al desactivar micrófono:', e);
//         this.recognitionActive = false;
//         this.isListening = false;
//         this.listeningSubject.next(false);
//         this.readySubject.next(false);
//       }
//     } else {
//       this.recognitionActive = false;
//       this.isListening = false;
//       this.listeningSubject.next(false);
//       this.readySubject.next(false);
//     }
//   }

//   clearTranscript(): void {
//     console.log('🧹 [VoiceService] Limpiando transcript');
//     this.currentTranscript = '';
//     this.transcriptSubject.next('');
//     console.log('🧹 [VoiceService] Transcript limpiado (reconocimiento activo)');
//   }

//   abortRecognition(): void {
//     console.log('🛑 [VoiceService] Abortando reconocimiento');
//     if (this.recognition) {
//       try {
//         this.recognition.abort();
//       } catch (e) {
//         // Ignorar errores
//       }
//     }
//   }

//   // ============================================================
//   // MUTE / UNMUTE (CON PREFERENCIAS Y MENSAJES CENTRALIZADOS)
//   // ============================================================

//   /**
//    * ✅ MUTE (desactiva el sonido pero SIGUE ESCUCHANDO)
//    */
//   mute(): void {
//     console.log('🔍 [VoiceService] mute() llamado');
    
//     this.isMuted = true;
//     this.mutedSubject.next(true);
    
//     this.userPreferences.updatePreference('micEnabled', false).subscribe();
    
//     if (this.areHeadphonesConnected()) {
//       this.speakAlways(this.voiceContext.getMessage('micDeactivated'));
//     }
//   }

//   /**
//    * ✅ UNMUTE (activa el sonido)
//    */
//   async unmute(): Promise<void> {
//     console.log('🔍 [VoiceService] unmute() llamado');
    
//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }
    
//     if (!this.isMuted) {
//       console.log('🎤 Micrófono ya activo');
//       return;
//     }

//     this.isMuted = false;
//     this.mutedSubject.next(false);
    
//     this.userPreferences.updatePreference('micEnabled', true).subscribe();
    
//     // ✅ CAMBIADO: Usar activationMessage del contexto actual (mensaje por página)
//     const contextMessage = this.voiceContext.getActivationMessage();
//     this.speakAlways(contextMessage);
    
//     if (!this.recognitionActive || !this.isListening) {
//       this.startListening();
//     }
//   }

//   //
//   toggleMute(): void {
//     console.log('🔍 [VoiceService] toggleMute() llamado:', {
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });
//     this.isMuted ? this.unmute() : this.mute();
//   }

//   isCurrentlyMuted(): boolean {
//     return this.isMuted;
//   }

//   isRecognitionActive(): boolean {
//     return this.recognitionActive;
//   }

//   // ============================================================
//   // MÉTODOS PARA ACTUALIZAR CONTEXTO POR PÁGINA
//   // ============================================================

//   /**
//    * ✅ Configura el contexto de voz para la página actual
//    */
//   setContextForPage(page: 'login' | 'home' | 'about' | 'register' | 'dashboard'): void {
//     switch (page) {
//       case 'login':
//         this.voiceContext.setLoginContext();
//         break;
//       case 'home':
//         this.voiceContext.setHomeContext();
//         break;
//       case 'about':
//         this.voiceContext.setAboutContext();
//         break;
//       case 'register':
//         this.voiceContext.setRegisterContext();
//         break;
//       case 'dashboard':
//         this.voiceContext.setDashboardContext();
//         break;
//     }
    
//     // ✅ Reproducir mensaje de bienvenida del nuevo contexto
//     if (!this.isMuted) {
//       this.speakAlways(this.voiceContext.getActivationMessage());
//     }
//   }

//   /**
//    * ✅ Obtiene el mensaje de bienvenida de la página actual
//    */
//   getWelcomeMessageForCurrentPage(): string {
//     return this.voiceContext.getActivationMessage();
//   }

//   /**
//    * ✅ Obtiene los comandos disponibles del contexto actual
//    */
//   getAvailableCommands(): string[] {
//     return this.voiceContext.getAvailableCommands();
//   }

//   /**
//    * ✅ Verifica si un comando está disponible en el contexto actual
//    */
//   isCommandAvailable(command: string): boolean {
//     const availableCommands = this.voiceContext.getAvailableCommands();
//     return availableCommands.some(cmd => command.includes(cmd) || command === cmd);
//   }

//   // ============================================================
//   // SPEAK WHEN READY
//   // ============================================================

//   async speakWhenReady(text: string): Promise<void> {
//     if (this.recognitionActive && this.readySubject.value) {
//       return this.speak(text);
//     }
//     try {
//       await firstValueFrom(
//         this.ready$.pipe(
//           filter(ready => ready),
//           take(1),
//           timeout(5000)
//         )
//       );
//     } catch {
//       this.logger.warn('Timeout esperando reconocimiento, reproduciendo igual');
//     }
//     return this.speak(text);
//   }

//   waitForRecognitionReady(): Promise<void> {
//     return new Promise((resolve) => {
//       if (this.recognitionActive && this.readySubject.value) {
//         resolve();
//         return;
//       }
//       const checkInterval = setInterval(() => {
//         if (this.recognitionActive && this.readySubject.value) {
//           clearInterval(checkInterval);
//           resolve();
//         }
//       }, 100);
//       setTimeout(() => {
//         clearInterval(checkInterval);
//         resolve();
//       }, 3000);
//     });
//   }

//   // ============================================================
//   // CONTROL DE BIENVENIDA
//   // ============================================================

//   hasWelcomeBeenShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): boolean {
//     return this.welcomeFlags[page];
//   }

//   markWelcomeAsShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): void {
//     this.welcomeFlags[page] = true;
//     if (this.enableLogs) {
//       this.logger.log(`📌 Welcome marcado para: ${page}`);
//     }
//   }

//   resetWelcomeFlags(): void {
//     this.welcomeFlags = {
//       welcome: false,
//       about: false,
//       login: false,
//       init: false,
//       register: false,
//       notfound: false,
//       home: false,
//       dashboard: false
//     };
//     if (this.enableLogs) {
//       this.logger.log('🔄 Welcome flags reiniciados');
//     }
//   }

//   // ============================================================
//   // SÍNTESIS DE VOZ (TTS)
//   // ============================================================

//   private getNaturalVoice(lang: string): SpeechSynthesisVoice | null {
//     if (this.cachedVoice) return this.cachedVoice;
//     const voices = window.speechSynthesis.getVoices();
//     const preferred = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
//     this.cachedVoice = preferred.find(v =>
//       /google|samantha|microsoft|diego|helena|zira|david|clara|maria|juan/i.test(v.name)
//     ) || preferred[0] || null;
//     if (this.cachedVoice && this.enableLogs) {
//       this.logger.log(`🗣️ Voz seleccionada: ${this.cachedVoice.name} (${this.cachedVoice.lang})`);
//     }
//     return this.cachedVoice;
//   }

//   //
//   speak(text: string, lang: string = 'es-ES', rate: number = 0.9, pitch: number = 1.05): Promise<void> {
//     console.log('🔍 [VoiceService] speak() llamado:', {
//       text: text.substring(0, 50) + '...',
//       isMuted: this.isMuted,
//       timestamp: new Date().toISOString()
//     });

//     return new Promise((resolve) => {
//       if (this.isMuted) {
//         if (this.enableLogs) {
//           this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
//         }
//         resolve();
//         return;
//       }

//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         resolve();
//         return;
//       }

//       // ✅ MISMO TOKEN Y BANDERA QUE speakAlways
//       const myToken = ++this.speakToken;
//       this.isSpeaking = true;

//       if (window.speechSynthesis.speaking) {
//         window.speechSynthesis.cancel();
//       }

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = lang;
//       utterance.rate = rate;
//       utterance.pitch = pitch;
//       utterance.volume = 1;

//       const voice = this.getNaturalVoice(lang);
//       if (voice) {
//         utterance.voice = voice;
//       }

//       const finalize = () => {
//         // ✅ Solo la última llamada controla isSpeaking
//         if (myToken === this.speakToken) {
//           this.isSpeaking = false;
//           this.lastTTSEndTime = Date.now();
//         }
//         resolve();
//       };

//       utterance.onend = () => {
//         console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
//         finalize();
//       };

//       utterance.onerror = (event: any) => {
//         if (event?.error === 'interrupted') {
//           console.log('🔍 [VoiceService] → speak() interrumpido');
//         } else {
//           this.logger.warn('Error en síntesis de voz:', event);
//         }
//         finalize();
//       };

//       window.speechSynthesis.speak(utterance);

//       if (this.enableLogs) {
//         this.logger.log(`🗣️ Hablando: "${text}"`);
//       }
//     });
//   }

//   //
//   public speakAlways(text: string): Promise<void> {
//     console.log('🔍 [VoiceService] speakAlways() llamado:', {
//       text: text.substring(0, 50) + '...',
//       isMuted: this.isMuted,
//       hasHeadphones: this.areHeadphonesConnected(),
//       timestamp: new Date().toISOString()
//     });

//     // ✅ SI NO HAY AURICULARES, NO HABLAR
//     if (!this.areHeadphonesConnected()) {
//       console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');
//       return Promise.resolve();
//     }

//     return new Promise((resolve) => {
//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         resolve();
//         return;
//       }

//       // ✅ TOKEN: identifica esta llamada. Si llega otra, la anterior no apaga isSpeaking.
//       const myToken = ++this.speakToken;

//       // ✅ MARCAR QUE ESTAMOS HABLANDO ANTES DE CUALQUIER CANCEL
//       this.isSpeaking = true;

//       if (window.speechSynthesis.speaking) {
//         window.speechSynthesis.cancel();
//       }

//       const utterance = new SpeechSynthesisUtterance(text);
//       utterance.lang = 'es-ES';
//       utterance.rate = 0.9;
//       utterance.pitch = 1.05;
//       utterance.volume = 1;

//       const voice = this.getNaturalVoice('es-ES');
//       if (voice) {
//         utterance.voice = voice;
//       }

//       const finalize = () => {
//         if (myToken === this.speakToken) {
//           this.isSpeaking = false;
//           this.lastTTSEndTime = Date.now();
//           this.pendingPostTTSRestart = true;          // ← AÑADIR

//           // ⏰ Timeout de seguridad: si el componente nunca llama a startListening,
//           //    reinicia pasado un margen razonable.
//           setTimeout(() => {
//             if (this.pendingPostTTSRestart && !this.isMuted && !this.recognitionActive) {
//               console.log('⏰ [VoiceService] Timeout esperando componente, reiniciando desde el servicio');
//               this.pendingPostTTSRestart = false;
//               this.startListening();
//             }
//           }, 3000);
//         }
//         resolve();
//       };

//       utterance.onend = () => {
//         console.log('🔍 [VoiceService] → speakAlways() onend');
//         finalize();
//       };

//       utterance.onerror = (event: any) => {
//         if (event?.error === 'interrupted') {
//           console.log('🔍 [VoiceService] → speakAlways() interrumpido');
//         } else {
//           this.logger.warn('Error en síntesis de voz:', event);
//         }
//         finalize();
//       };

//       window.speechSynthesis.speak(utterance);

//       if (this.enableLogs) {
//         this.logger.log(`🗣️ Hablando (siempre): "${text}"`);
//       }
//     });
//   }

//   // ============================================================
//   // MÉTODOS PARA ENVIAR RESPUESTAS
//   // ============================================================

//   sendSuccessResponse(
//     reply: string,
//     action?: { type: string; payload?: Record<string, any> },
//     data?: any
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: true,
//       intent: 'success',
//       status: 'success',
//       reply,
//       action,
//       data,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   sendErrorResponse(
//     reply: string,
//     error?: string,
//     data?: any
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: false,
//       intent: 'error',
//       status: 'error',
//       reply,
//       error: error || reply,
//       data,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   sendAudioResponse(
//     reply: string,
//     audioBase64: string,
//     action?: { type: string; payload?: Record<string, any> }
//   ): void {
//     const response: VoiceCommandResponse = {
//       success: true,
//       intent: 'audio',
//       status: 'success',
//       reply,
//       audioBase64,
//       action,
//       timestamp: new Date().toISOString()
//     };
//     this.responseSubject.next(response);
//   }

//   // ============================================================
//   // OBSERVABLES PÚBLICOS
//   // ============================================================

//   getTranscript(): Observable<string> {
//     return this.transcriptSubject.asObservable();
//   }

//   getTranscriptWithFinal(): Observable<{ text: string; isFinal: boolean }> {
//     return this.transcriptWithFinalSubject.asObservable();
//   }

//   getResponses(): Observable<VoiceCommandResponse> {
//     return this.responseSubject.asObservable();
//   }

//   getMutedState(): Observable<boolean> {
//     return this.mutedSubject.asObservable();
//   }

//   getErrors(): Observable<string> {
//     return this.errorSubject.asObservable();
//   }

//   getWakeWords(): Observable<string> {
//     return this.wakeWordSubject.asObservable();
//   }

//   // ============================================================
//   // UTILIDADES
//   // ============================================================

//   isSupported(): boolean {
//     if (this.isFirefox()) {
//       console.warn('🦊 Firefox: SpeechRecognition no soportado nativamente');
//       return false;
//     }
//     const win = window as Record<string, any>;
//     return !!(win['SpeechRecognition'] || win['webkitSpeechRecognition']);
//   }

//   getBrowserSupportMessage(): string {
//     if (this.isFirefox()) {
//       return '⚠️ El reconocimiento de voz no está disponible en Firefox. Por favor, usa Chrome, Edge o Safari para usar comandos de voz.';
//     }
//     if (!this.isSupported()) {
//       return '⚠️ El reconocimiento de voz no está disponible en este navegador.';
//     }
//     return '';
//   }

//   isListeningActive(): boolean {
//     return this.isListening;
//   }

//   isSpeechSynthesisSupported(): boolean {
//     return !!(window.speechSynthesis);
//   }

//   isFullySupported(): boolean {
//     return this.isSupported() && this.isSpeechSynthesisSupported();
//   }

//   isFirefox(): boolean {
//     return navigator.userAgent.toLowerCase().includes('firefox');
//   }

//   // ============================================================
//   // LIMPIEZA
//   // ============================================================

//   destroy(): void {
//     if (this.enableLogs) {
//       this.logger.log('🧹 Destruyendo VoiceService...');
//     }

//     if (this.reconnectTimeout) {
//       clearTimeout(this.reconnectTimeout);
//       this.reconnectTimeout = null;
//     }

//     this.stopListening();

//     if (window.speechSynthesis) {
//       window.speechSynthesis.cancel();
//     }

//     this.transcriptSubject.complete();
//     this.transcriptWithFinalSubject.complete();
//     this.responseSubject.complete();
//     this.mutedSubject.complete();
//     this.wakeWordSubject.complete();
//     this.errorSubject.complete();
//     this.listeningSubject.complete();
//     this.readySubject.complete();

//     this.filterService.reset();

//     if (this.recognition) {
//       this.recognition.onresult = null as any;
//       this.recognition.onerror = null as any;
//       this.recognition.onend = null as any;
//       this.recognition.onstart = null as any;
//       this.recognition = null as any;
//     }

//     if (this.enableLogs) {
//       this.logger.log('✅ VoiceService destruido correctamente');
//     }
//   }
// }













// src/core/services/voz/voice.service.ts

import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, firstValueFrom, filter, take, timeout } from 'rxjs';
import { VoiceFilterService } from './voice-filter.service';
import { VoiceCommandResponse } from '../../models/voz/VoiceCommandResponse-model';
import { LoggerService } from '../../../shared/services/loggers/logger.service';
import { VoiceContextService } from '../../../features/services/voz/voice-context.service';
import { environment } from '../../../../environments/environment';
import { UserPreferencesService } from '../../../shared/services/user-preferences/user-preferences.service';

@Injectable({ providedIn: 'root' })
export class VoiceService implements OnDestroy {
  private recognition: any = null;
  private isListening = false;
  private ngZone = inject(NgZone);
  private logger = inject(LoggerService);
  private filterService = inject(VoiceFilterService);
  private userPreferences = inject(UserPreferencesService);
  private voiceContext = inject(VoiceContextService);

  private transcriptSubject = new Subject<string>();
  private currentTranscript = '';
  private transcriptWithFinalSubject = new Subject<{ text: string; isFinal: boolean }>();
  private responseSubject = new Subject<VoiceCommandResponse>();
  private mutedSubject = new BehaviorSubject<boolean>(false);
  private wakeWordSubject = new Subject<string>();
  private errorSubject = new Subject<string>();

  private listeningSubject = new BehaviorSubject<boolean>(false);
  public listening$ = this.listeningSubject.asObservable();

  private autoRestartSubject = new BehaviorSubject<boolean>(false);
  public autoRestart$ = this.autoRestartSubject.asObservable();

  private readySubject = new BehaviorSubject<boolean>(false);
  public ready$ = this.readySubject.asObservable();

  private readonly WAKE_WORDS = ['hola', 'asistente'];

  private ignoreNavCommandsUntil = 0;
  private readonly NAV_BLOCK_MS = 3000;
  private readonly NAV_COMMANDS = ['volver', 'atrás', 'atras', 'regresar', 'retroceder', 'cancelar'];

  private isMuted = false;
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: any = null;

  private isStarting = false;
  private recognitionActive = false;

  private isSpeaking = false;
  private pendingPostTTSRestart = false;

  private lastTTSEndTime = 0;
  private speakToken = 0;

  private restartTimer: any = null;
  private lastStartAttempt = 0;

  private lastWakeWordTime = 0;
  private readonly WAKE_DEBOUNCE_TIME = 2000;

  private headphonesMessageShown = false;
  private headphonesCheckInterval: any = null;

  private noHeadphonesMessageShown = false;
  private noHeadphonesMessageTimeout: any = null;

  private headphonesConnectedSubject = new BehaviorSubject<boolean>(false);
  public headphonesConnected$ = this.headphonesConnectedSubject.asObservable();

  // ✅ NUEVO: bloquea llamadas paralelas a detectHeadphonesInternal()
  private headphonesDetectionInFlight: Promise<boolean> | null = null;

  // ✅ NUEVO: Cache TTL para evitar enumerateDevices() constante
  private headphonesCache = {
    result: false,
    timestamp: 0,
    ttlMs: 8000
  };

  // ✅ NUEVO: Listener reactivo del navegador (devicechange)
  private deviceChangeListener: any = null;

  // ✅ NUEVO: Debounce del devicechange (Windows lo dispara en ráfaga)
  private deviceChangeDebounce: any = null;

  private welcomeFlags = {
    welcome: false,
    about: false,
    login: false,
    init: false,
    register: false,
    notfound: false,
    home: false,
    dashboard: false
  };

  public muted$ = this.mutedSubject.asObservable();
  public wakeWord$ = this.wakeWordSubject.asObservable();
  public error$ = this.errorSubject.asObservable();
  public response$ = this.responseSubject.asObservable();

  private enableLogs = environment.enableLogs;
  private lastProcessedTranscript = '';
  private lastProcessedTime = 0;
  private readonly GLOBAL_COMMAND_DEBOUNCE = 1500;
  private restartCount = 0;

  constructor() {
    console.log('🔍 [VoiceService] CONSTRUCTOR INICIADO');

    this.initRecognition();
    this.loadVoices();

    this.isMuted = true;
    this.mutedSubject.next(true);
    this.listeningSubject.next(false);
    this.readySubject.next(false);

    if (this.enableLogs) {
      this.logger.log(`🎤 ${this.voiceContext.getMessage('welcome')}`);
    }

    console.log('🔍 [VoiceService] Llamando a monitorHeadphones()...');
    this.monitorHeadphones();

    // ✅ INICIAR RECONOCIMIENTO (SIEMPRE ESCUCHANDO)
    setTimeout(() => {
      this.startListening();
      console.log('🎤 Reconocimiento de voz activo (escuchando "hola")');
    }, 1000);

    // ✅ NOTA: checkHeadphonesOnStart() ya se llama dentro de monitorHeadphones(),
    //          así que NO lo duplicamos aquí.
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  private navigationLockedUntil = 0;

  public lockNavigation(ms: number = 3000): void {
    this.navigationLockedUntil = Date.now() + ms;
  }

  private isNavigationLocked(): boolean {
    return Date.now() < this.navigationLockedUntil;
  }

  // ngOnDestroy(): void {
  //   if (this.headphonesCheckInterval) {
  //     clearInterval(this.headphonesCheckInterval);
  //     this.headphonesCheckInterval = null;
  //   }
  //   this.destroy();
  // }

  //
  // ngOnDestroy(): void {
  //   if (this.headphonesCheckInterval) {
  //     clearInterval(this.headphonesCheckInterval);
  //     this.headphonesCheckInterval = null;
  //   }

  //   // ✅ NUEVO: limpiar debounce también aquí
  //   if (this.deviceChangeDebounce) {
  //     clearTimeout(this.deviceChangeDebounce);
  //     this.deviceChangeDebounce = null;
  //   }

  //   this.destroy();
  // }

  ngOnDestroy(): void {
    this.destroy();
  }

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  private loadVoices(): void {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
        if (this.enableLogs) {
          this.logger.log('🗣️ Voces cargadas');
        }
      };
    }
  }

  areHeadphonesConnected(): boolean {
    return this.headphonesConnectedSubject.value;
  }

  async forceHeadphonesDetection(): Promise<boolean> {
    console.log('🔧 [VoiceService] Forzando detección de auriculares...');

    const hasHeadphones = await this.isHeadphonesConnected(true);  // ✅ force

    if (!hasHeadphones) {
      console.log('🔇 [VoiceService] No se detectaron auriculares reales');
      this.applyHeadphonesChange(false);
      return false;
    }

    console.log('🎧 [VoiceService] Auriculares reales detectados');
    this.applyHeadphonesChange(true);
    return true;
  }

  async waitForHeadphonesDetection(): Promise<boolean> {
    if (this.headphonesConnectedSubject.value !== null) {
      return this.headphonesConnectedSubject.value;
    }

    return new Promise((resolve) => {
      const subscription = this.headphonesConnected$.subscribe(value => {
        if (value !== null) {
          subscription.unsubscribe();
          resolve(value);
        }
      });

      setTimeout(() => {
        subscription.unsubscribe();
        resolve(false);
      }, 5000);
    });
  }

  private initRecognition(): void {
    const win = window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any };
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.logger.warn('Web Speech API no soportada en este navegador');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'es-ES';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = this.handleResult.bind(this);
    this.recognition.onerror = this.handleError.bind(this);
    this.recognition.onend = this.handleEnd.bind(this);

    this.recognition.onstart = () => {
      this.ngZone.run(() => {
        this.isStarting = false; 
        this.recognitionActive = true;
        this.isListening = true;
        this.readySubject.next(true);
        console.log('🎤 Micrófono realmente activo (onstart)');
      });
    };

    if (this.enableLogs) {
      this.logger.log('✅ Speech Recognition inicializado');
    }
  }

  public restartVoiceService(): void {
    console.log('🔄 [VoiceService] Reiniciando servicio...');

    this.stopListening();

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.isMuted = true;
    this.mutedSubject.next(true);
    this.listeningSubject.next(false);
    this.readySubject.next(false);
    this.recognitionActive = false;
    this.isListening = false;
    this.isStarting = false;
    this.headphonesMessageShown = false;

    if (this.recognition) {
      try {
        this.recognition.abort();
        this.recognition = null;
      } catch (e) {
        // Ignorar
      }
    }

    this.initRecognition();

    setTimeout(() => {
      this.startListening();
      console.log('✅ [VoiceService] Servicio reiniciado correctamente');
    }, 500);
  }

  // ============================================================
  // MANEJO DE EVENTOS
  // ============================================================
  private handleResult(event: SpeechRecognitionEvent): void {
    if (window.speechSynthesis.speaking) {
      try {
        const result = event.results[event.results.length - 1];
        if (result && result[0]) {
          const transcript = result[0].transcript.toLowerCase().trim();
          if (transcript === 'hola' || transcript.includes('hola')) {
            console.log('🔊 [VoiceService] "hola" detectado durante el habla, procesando...');
          } else {
            console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
            return;
          }
        } else {
          console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
          return;
        }
      } catch {
        console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
        return;
      }
    }

    if (!event.results || event.results.length === 0) return;

    const result = event.results[event.results.length - 1];
    if (!result || !result[0]) return;

    const transcript = result[0].transcript.toLowerCase().trim();

    if (this.enableLogs) {
      console.log('🎤 Reconocido:', transcript, 'Final:', result.isFinal);
    }

    if (transcript === 'hola' || transcript === 'hola hola') {
      this.handleWakeWord(transcript, result.isFinal);
      return;
    }

    if (transcript === 'silenciar' || transcript === 'mute' ||
        transcript.includes('silenciar micrófono') || transcript.includes('apagar micrófono')) {
      this.handleMute();
      return;
    }

    if (this.isMuted) {
      const allowed = ['ayuda', 'help', 'hola', 'asistente'];
      if (!allowed.includes(transcript)) {
        console.log('🔇 [VoiceService] Muteado, ignorando:', transcript);
        return;
      }
    }

    if (this.isNavigationCommand(transcript) && Date.now() < this.ignoreNavCommandsUntil) {
      console.log(`⏭️ [VoiceService] Comando de navegación ignorado tras navegación: "${transcript}"`);
      return;
    }

    const now = Date.now();
    if (
      transcript === this.lastProcessedTranscript &&
      (now - this.lastProcessedTime) < this.GLOBAL_COMMAND_DEBOUNCE
    ) {
      console.log(`⏭️ [VoiceService] Comando duplicado ignorado globalmente: "${transcript}"`);
      return;
    }
    this.lastProcessedTranscript = transcript;
    this.lastProcessedTime = now;

    console.log('📤 [VoiceService] Emitiendo comando:', transcript);
    this.transcriptSubject.next(transcript);
    this.transcriptWithFinalSubject.next({ text: transcript, isFinal: result.isFinal });
  }

  private handleWakeWord(transcript: string, isFinal: boolean): void {
    if (this.isMuted) {
      const ahora = Date.now();
      if (ahora - this.lastWakeWordTime > this.WAKE_DEBOUNCE_TIME) {
        this.lastWakeWordTime = ahora;
        this.unmute();
        this.wakeWordSubject.next(transcript);
      } else {
        console.log('⏳ [VoiceService] Debounce: espera un momento');
      }
    } else {
      console.log('🎤 [VoiceService] Micrófono ya activo');
    }
  }

  private handleMute(): void {
    if (!this.isMuted) {
      this.mute();
    } else {
      console.log('ℹ️ [VoiceService] Micrófono ya está muteado');
    }
  }

  private processWakeWord(transcript: string): void {
    const ahora = Date.now();

    if (ahora - this.lastWakeWordTime < this.WAKE_DEBOUNCE_TIME) {
      if (this.enableLogs) {
        this.logger.log('⏳ Wake word ignorada por debounce (demasiado rápido)');
      }
      return;
    }

    this.lastWakeWordTime = ahora;

    if (this.isMuted) {
      if (this.enableLogs) {
        this.logger.log('🔊 Wake word detectada, activando micrófono');
      }
      this.unmute();
      this.wakeWordSubject.next(transcript);
    } else {
      if (this.enableLogs) {
        this.logger.log(`ℹ️ Wake word recibida pero micrófono ya activo: "${transcript}"`);
      }
    }
  }

  // private handleError(event: SpeechRecognitionErrorEvent): void {
  //   this.ngZone.run(() => {
  //     if (event.error === 'no-speech') {
  //       return;
  //     }

  //     console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
  //     this.logger.error('Error en reconocimiento:', event.error);
  //     this.errorSubject.next(event.error);

  //     this.readySubject.next(false);
  //     this.recognitionActive = false;

  //     if (event.error === 'audio-capture') {
  //       this.handleRecoverableError();
  //     } else if (event.error === 'not-allowed') {
  //       this.logger.error('❌ Permiso de micrófono denegado');
  //       this.stopListening();
  //       this.errorSubject.next(this.voiceContext.getMessage('permissionDenied'));
  //       this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
  //     } else {
  //       this.logger.warn(`⚠️ Error recuperable (${event.error}), reintentando...`);
  //       this.handleRecoverableError();
  //     }
  //   });
  // }



  private handleError(event: SpeechRecognitionErrorEvent): void {
    this.ngZone.run(() => {
      if (event.error === 'no-speech') return;

      console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
      this.logger.error('Error en reconocimiento:', event.error);
      this.errorSubject.next(event.error);

      // ✅ Resetear TODOS los flags para que handleEnd no tome una rama equivocada
      this.isStarting = false;
      this.recognitionActive = false;
      this.isListening = false;
      this.readySubject.next(false);
      this.listeningSubject.next(false);

      if (event.error === 'not-allowed') {
        this.logger.error('❌ Permiso de micrófono denegado');
        this.stopListening();
        this.errorSubject.next(this.voiceContext.getMessage('permissionDenied'));
        this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
        return;
      }

      // ✅ audio-capture y cualquier otro error recuperable → un único canal de reinicio
      const delay = Math.min(500 * Math.pow(1.2, this.reconnectAttempts), 5000);
      this.reconnectAttempts++;

      if (this.enableLogs) {
        this.logger.log(`⏳ Reintentando en ${delay}ms (intento #${this.reconnectAttempts})`);
      }

      this.scheduleRestart(delay, () => {
        if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted) return;
        if (this.recognitionActive) return;
        this.reconnectAttempts = 0;
        this.startListening({ source: 'handleError' });
      });
    });
  }




  //  NO SE USA
  // private handleRecoverableError(): void {
  //   const delay = Math.min(500 * Math.pow(1.2, this.reconnectAttempts), 5000);
  //   this.reconnectAttempts++;

  //   if (this.enableLogs) {
  //     this.logger.log(`⏳ Reintentando en ${delay}ms (intento #${this.reconnectAttempts})`);
  //   }

  //   if (this.reconnectTimeout) {
  //     clearTimeout(this.reconnectTimeout);
  //   }

  //   this.reconnectTimeout = setTimeout(() => {
  //     if (this.isSpeaking) {
  //       console.log('⏸️ [VoiceService] reconnectTimeout → TTS activo, reprogramando');
  //       this.handleRecoverableError();
  //       return;
  //     }
  //     if (this.pendingPostTTSRestart) {
  //       console.log('⏸️ [VoiceService] reconnectTimeout → pendiente reinicio del componente');
  //       return;
  //     }
  //     if (this.isMuted) {
  //       console.log('🔇 [VoiceService] reconnectTimeout → micrófono muteado');
  //       return;
  //     }
  //     if (this.recognitionActive) {
  //       console.log('ℹ️ [VoiceService] reconnectTimeout → reconocimiento ya activo');
  //       return;
  //     }

  //     console.log('🔄 [VoiceService] reconnectTimeout → reiniciando reconocimiento tras error');
  //     this.reconnectAttempts = 0;
  //     this.startListening();
  //   }, delay);
  // }



  // private handleEnd(): void {
  //   console.log('🔍 [VoiceService] handleEnd:', {
  //     isListening: this.isListening,
  //     isStarting: this.isStarting,
  //     recognitionActive: this.recognitionActive,
  //     isSpeaking: this.isSpeaking,
  //     msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
  //     pendingPostTTSRestart: this.pendingPostTTSRestart,
  //     timestamp: new Date().toISOString()
  //   });

  //   this.isStarting = false;
  //   this.isListening = false;
  //   this.recognitionActive = false;
  //   this.readySubject.next(false);
  //   this.listeningSubject.next(false);

  //   if (this.enableLogs) {
  //     this.logger.log('🔴 Reconocimiento finalizado');
  //   }

  //   // ✅ 1. TTS activo → no reiniciar (con reintento diferido)
  //   if (this.isSpeaking) {
  //     console.log('⏸️ [VoiceService] handleEnd → TTS activo, NO se reinicia automáticamente');

  //     setTimeout(() => {
  //       if (this.isSpeaking) return;
  //       if (this.pendingPostTTSRestart) return;
  //       if (this.isMuted) return;
  //       if (this.recognitionActive) return;

  //       console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
  //       this.startListening();
  //     }, 1500);

  //     return;
  //   }

  //   // ✅ 2. Pendiente reinicio del componente
  //   if (this.pendingPostTTSRestart) {
  //     console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO se reinicia automáticamente');
  //     return;
  //   }

  //   // ✅ 3. Bloqueo por navegación
  //   if (this.isNavigationLocked()) {
  //     console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
  //     setTimeout(() => {
  //       if (this.isSpeaking) return;
  //       if (this.pendingPostTTSRestart) return;
  //       if (!this.isNavigationLocked() && !this.recognitionActive) {
  //         this.startListening();
  //         console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
  //       }
  //     }, 3100);
  //     return;
  //   }

  //   // ✅ 4. Muteado
  //   if (this.isMuted) {
  //     console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
  //     return;
  //   }

  //   console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');

  //   setTimeout(() => {
  //     if (this.isSpeaking) {
  //       console.log('⏸️ [VoiceService] reinicio cancelado: TTS sigue activo');
  //       return;
  //     }
  //     if (this.pendingPostTTSRestart) {
  //       console.log('⏸️ [VoiceService] reinicio cancelado: pendiente reinicio del componente');
  //       return;
  //     }
  //     if (!this.isMuted && !this.recognitionActive) {
  //       this.startListening();
  //       console.log('🎤 [VoiceService] Reconocimiento reiniciado');
  //     }
  //   }, 500);
  // }









  // private handleEnd(): void {
  //   console.log('🔍 [VoiceService] handleEnd:', {
  //     isListening: this.isListening,
  //     isStarting: this.isStarting,
  //     recognitionActive: this.recognitionActive,
  //     isSpeaking: this.isSpeaking,
  //     msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
  //     pendingPostTTSRestart: this.pendingPostTTSRestart,
  //     timestamp: new Date().toISOString()
  //   });

  //   // ✅ FIX: si el reconocimiento se cortó por el TTS, NO emitir
  //   //    listeningSubject/readySubject → el icono del toggle no gira
  //   if (this.isSpeaking) {
  //     this.isStarting = false;
  //     this.isListening = false;
  //     this.recognitionActive = false;

  //     console.log('⏸️ [VoiceService] handleEnd → TTS activo, estado visual intacto');

  //     if (this.enableLogs) {
  //       this.logger.log('🔴 Reconocimiento pausado por TTS');
  //     }

  //     setTimeout(() => {
  //       if (this.isSpeaking) return;
  //       if (this.pendingPostTTSRestart) return;
  //       if (this.isMuted) return;
  //       if (this.recognitionActive) return;

  //       console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
  //       this.startListening();
  //     }, 1500);

  //     return;
  //   }

  //   // ─────────────────────────────────────────────────────────
  //   // A partir de aquí, el reconocimiento se ha cortado
  //   // por causas NO relacionadas con el TTS
  //   // ─────────────────────────────────────────────────────────
  //   this.isStarting = false;
  //   this.isListening = false;
  //   this.recognitionActive = false;
  //   this.readySubject.next(false);
  //   this.listeningSubject.next(false);

  //   if (this.enableLogs) {
  //     this.logger.log('🔴 Reconocimiento finalizado');
  //   }

  //   // ✅ 1. Pendiente reinicio del componente
  //   if (this.pendingPostTTSRestart) {
  //     console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO se reinicia automáticamente');
  //     return;
  //   }

  //   // ✅ 2. Bloqueo por navegación
  //   if (this.isNavigationLocked()) {
  //     console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
  //     setTimeout(() => {
  //       if (this.isSpeaking) return;
  //       if (this.pendingPostTTSRestart) return;
  //       if (!this.isNavigationLocked() && !this.recognitionActive) {
  //         this.startListening();
  //         console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
  //       }
  //     }, 3100);
  //     return;
  //   }

  //   // ✅ 3. Muteado
  //   if (this.isMuted) {
  //     console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
  //     return;
  //   }

  //   console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');

  //   setTimeout(() => {
  //     if (this.isSpeaking) {
  //       console.log('⏸️ [VoiceService] reinicio cancelado: TTS sigue activo');
  //       return;
  //     }
  //     if (this.pendingPostTTSRestart) {
  //       console.log('⏸️ [VoiceService] reinicio cancelado: pendiente reinicio del componente');
  //       return;
  //     }
  //     if (!this.isMuted && !this.recognitionActive) {
  //       this.startListening();
  //       console.log('🎤 [VoiceService] Reconocimiento reiniciado');
  //     }
  //   }, 500);
  // }





  private handleEnd(): void {
    console.log('🔍 [VoiceService] handleEnd:', {
      isListening: this.isListening,
      isStarting: this.isStarting,
      recognitionActive: this.recognitionActive,
      isSpeaking: this.isSpeaking,
      msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
      pendingPostTTSRestart: this.pendingPostTTSRestart,
      timestamp: new Date().toISOString()
    });

    // ─────────────────────────────────────────────────────
    // Capturar ANTES de resetear: ¿fue un abort durante el arranque?
    // ─────────────────────────────────────────────────────
    const abortedDuringStart = this.isStarting;

    // Resetear SIEMPRE primero
    this.isStarting = false;
    this.isListening = false;
    this.recognitionActive = false;

    // ─────────────────────────────────────────────────────
    // CASO 0: abort durante el arranque → NO reiniciar en cadena
    // ─────────────────────────────────────────────────────
    if (abortedDuringStart) {
      console.log('⏭️ [VoiceService] handleEnd durante arranque → backoff largo');
      this.readySubject.next(false);
      this.listeningSubject.next(false);

      if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted) {
        return; // alguien más lo reiniciará
      }

      // Backoff largo: evita el ping-pong con el navegador
      this.scheduleRestart(2500);
      return;
    }

    // ─────────────────────────────────────────────────────
    // CASO 1: TTS activo → estado visual intacto
    // ─────────────────────────────────────────────────────
    if (this.isSpeaking) {
      console.log('⏸️ [VoiceService] handleEnd → TTS activo, estado visual intacto');
      if (this.enableLogs) this.logger.log('🔴 Reconocimiento pausado por TTS');

      if (this.pendingPostTTSRestart || this.isMuted) return;

      this.scheduleRestart(1500, () => {
        if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted || this.recognitionActive) return;
        console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
        this.startListening();
      });
      return;
    }

    // ─────────────────────────────────────────────────────
    // A partir de aquí: corte NO-TTS
    // ─────────────────────────────────────────────────────
    this.readySubject.next(false);
    this.listeningSubject.next(false);

    if (this.enableLogs) this.logger.log('🔴 Reconocimiento finalizado');

    // CASO 2: pendiente reinicio del componente
    if (this.pendingPostTTSRestart) {
      console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO reinicia');
      return;
    }

    // CASO 3: bloqueo por navegación
    if (this.isNavigationLocked()) {
      console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
      this.scheduleRestart(3100, () => {
        if (this.isSpeaking || this.pendingPostTTSRestart) return;
        if (!this.isNavigationLocked() && !this.recognitionActive) {
          this.startListening();
          console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
        }
      });
      return;
    }

    // CASO 4: muteado
    if (this.isMuted) {
      console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
      return;
    }

    // CASO 5: reinicio normal con backoff sano (no 500 ms)
    console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');
    this.scheduleRestart(1000);
  }

  /**
   * Programa un reinicio único, cancelando cualquier otro pendiente.
   * Evita que TTS + navegación + onend normal disparen 3 startListening distintos.
   */
  private scheduleRestart(delay: number, action?: () => void): void {
    clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (action) {
        action();
        return;
      }
      if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted || this.recognitionActive) {
        return;
      }
      this.startListening();
      console.log('🎤 [VoiceService] Reconocimiento reiniciado');
    }, delay);
  }









  private restart(): void {
    console.log('🔍 [VoiceService] restart() llamado:', {
      isStarting: this.isStarting,
      isListening: this.isListening,
      timestamp: new Date().toISOString()
    });

    if (this.isStarting) return;

    if (this.recognition && this.isListening) {
      try {
        this.recognitionActive = false;
        this.recognition.stop();

        this.autoRestartSubject.next(true);

        setTimeout(() => {
          if (this.isListening && !this.isStarting) {
            console.log('🔍 [VoiceService] → restart() llamando a startListening()');
            this.startListening();
          }
          setTimeout(() => {
            this.autoRestartSubject.next(false);
            console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart');
          }, 1000);
        }, 100);
      } catch (e) {
        this.logger.warn('Error al reiniciar reconocimiento:', e);
        this.autoRestartSubject.next(true);
        setTimeout(() => {
          if (this.isListening && !this.isStarting) {
            console.log('🔍 [VoiceService] → restart() (catch) llamando a startListening()');
            this.startListening();
          }
          setTimeout(() => {
            this.autoRestartSubject.next(false);
            console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart (catch)');
          }, 1000);
        }, 300);
      }
    }
  }

  // ============================================================
  // DETECCIÓN DE AURICULARES
  // ============================================================

  /**
   * ✅ PÚBLICO: cache TTL. Llama con force=true para ignorar el cache.
   */
  // public async isHeadphonesConnected(force: boolean = false): Promise<boolean> {
  //   const now = Date.now();

  //   if (!force && (now - this.headphonesCache.timestamp) < this.headphonesCache.ttlMs) {
  //     if (this.enableLogs) {
  //       console.log(`🔍 [VoiceService] isHeadphonesConnected → cache HIT (${now - this.headphonesCache.timestamp}ms)`);
  //     }
  //     return this.headphonesCache.result;
  //   }

  //   const result = await this.detectHeadphonesInternal();

  //   this.headphonesCache.result = result;
  //   this.headphonesCache.timestamp = Date.now();

  //   return result;
  // }




  public async isHeadphonesConnected(force: boolean = false): Promise<boolean> {
    const now = Date.now();

    // Cache HIT si no es forzado y aún está vigente
    if (!force && (now - this.headphonesCache.timestamp) < this.headphonesCache.ttlMs) {
      if (this.enableLogs) {
        console.log(`🔍 [VoiceService] isHeadphonesConnected → cache HIT (${now - this.headphonesCache.timestamp}ms)`);
      }
      return this.headphonesCache.result;
    }

    // ✅ NUEVO: si ya hay una detección en curso, esperarla en vez de lanzar otra
    if (this.headphonesDetectionInFlight) {
      if (this.enableLogs) {
        console.log('🔍 [VoiceService] isHeadphonesConnected → uniéndose a detección en curso');
      }
      return this.headphonesDetectionInFlight;
    }

    // ✅ Lanzar UNA sola detección y compartirla entre todas las llamadas
    this.headphonesDetectionInFlight = this.detectHeadphonesInternal();

    try {
      const result = await this.headphonesDetectionInFlight;
      this.headphonesCache.result = result;
      this.headphonesCache.timestamp = Date.now();
      return result;
    } finally {
      this.headphonesDetectionInFlight = null;
    }
  }



  /**
   * ✅ PRIVADO: detección real (llama a enumerateDevices + getUserMedia).
   */
  private async detectHeadphonesInternal(): Promise<boolean> {
    console.log('🔍 [VoiceService] Iniciando detección REAL de auriculares (cache miss)...');

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

          console.log('🔍 [VoiceService] Audio outputs:', audioOutputs.length);
          audioOutputs.forEach(d => console.log('  -', d.label || 'SIN ETIQUETA'));

          const keywords = [
            'headphone', 'earphone', 'headset', 'auricular',
            'bluetooth', 'wireless', 'stereo', 'hands-free',
            'logitech', 'sony', 'jbl', 'apple', 'samsung'
          ];

          const hasHeadphones = audioOutputs.some(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            const found = keywords.some(keyword => labelLower.includes(keyword));
            if (found) {
              console.log(`🔍 [VoiceService] Palabra clave encontrada: "${d.label}"`);
            }
            return found;
          });

          if (hasHeadphones) {
            console.log('🎧 [VoiceService] Auriculares detectados POR ETIQUETA');
            return true;
          }

          const speakerKeywords = ['speaker', 'altavoz', 'altoparlante'];
          const isSpeakerOnly = audioOutputs.every(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return speakerKeywords.some(keyword => labelLower.includes(keyword));
          });

          if (isSpeakerOnly && audioOutputs.length > 0) {
            console.log('🔇 [VoiceService] Solo hay altavoces, NO auriculares');
            return false;
          }

          const hasHeadphoneInName = audioOutputs.some(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return labelLower.includes('headphone') || labelLower.includes('auricular');
          });

          if (hasHeadphoneInName) {
            console.log('🎧 [VoiceService] Auriculares detectados por nombre');
            return true;
          }

          const allSpeakers = audioOutputs.every(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return labelLower.includes('speaker') || labelLower.includes('altavoz');
          });

          if (allSpeakers && audioOutputs.length > 1) {
            console.log('🔇 [VoiceService] Múltiples altavoces, NO auriculares');
            return false;
          }

          console.log('🔍 [VoiceService] Usando getUserMedia como respaldo...');
          return await this.detectWithGetUserMedia();

        } catch (error) {
          console.warn('⚠️ [VoiceService] Error en enumerateDevices:', error);
        }
      }

      console.log('🔇 [VoiceService] No se detectaron auriculares');
      return false;

    } catch (error) {
      console.error('❌ [VoiceService] Error detectando auriculares:', error);
      return false;
    }
  }

  /**
   * ✅ DETECCIÓN CON getUserMedia (respaldo)
   */
  private async detectWithGetUserMedia(): Promise<boolean> {
    console.log('🎤 [VoiceService] Intentando getUserMedia...');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('❌ [VoiceService] getUserMedia NO disponible');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];

      if (audioTrack) {
        const settings = audioTrack.getSettings();
        console.log('🔍 [VoiceService] Settings de audio:', settings);

        if (settings.deviceId) {
          console.log('🎧 [VoiceService] Dispositivo de audio detectado por getUserMedia');
          stream.getTracks().forEach(track => track.stop());

          if (settings.deviceId.length > 10) {
            console.log('🎧 [VoiceService] Dispositivo externo detectado');
            return true;
          }
          return true;
        }
      }
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      console.warn('⚠️ [VoiceService] Error en getUserMedia:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.warn('🔴 [VoiceService] Permiso de micrófono denegado');
        this.errorSubject.next('PERMISSION_DENIED');
        this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
        return false;
      }

      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        console.warn('🔴 [VoiceService] No se encontró dispositivo de audio');
        this.errorSubject.next('NO_AUDIO_DEVICE');
        this.speakAlways(this.voiceContext.getMessage('noAudioDevice'));
        return false;
      }
    }

    console.log('🔇 [VoiceService] No se detectaron auriculares');
    return false;
  }

  // ============================================================
  // CHECK HEADPHONES ON START
  // ============================================================

  private async checkHeadphonesOnStart(): Promise<void> {
    const hasHeadphones = await this.isHeadphonesConnected(true);

    const prefs = this.userPreferences.getCurrentPreferences();
    const userPrefersMic = prefs.micEnabled !== undefined ? prefs.micEnabled : true;

    if (!hasHeadphones || !userPrefersMic) {
      console.log('🔇 [VoiceService] Sin auriculares o usuario desactivó el micrófono');
      this.isMuted = true;
      this.mutedSubject.next(true);
    } else {
      console.log('🎧 [VoiceService] Auriculares conectados, pero micrófono permanece MUTEADO');
    }

    // ✅ Emitir el estado inicial (solo si cambió)
    this.applyHeadphonesChange(hasHeadphones);
  }

  // ============================================================
  // CONTROL DEL MICRÓFONO
  // ============================================================

  // async startListening(): Promise<void> {
  //   this.pendingPostTTSRestart = false;
  //   console.log('🔍 [VoiceService] startListening() llamado:', {
  //     isStarting: this.isStarting,
  //     recognitionActive: this.recognitionActive,
  //     isMuted: this.isMuted,
  //     timestamp: new Date().toISOString()
  //   });

  //   const hasHeadphones = await this.isHeadphonesConnected();
  //   if (!hasHeadphones) {
  //     console.log('🔇 [VoiceService] No hay auriculares conectados');

  //     if (!this.noHeadphonesMessageShown) {
  //       this.noHeadphonesMessageShown = true;
  //       this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

  //       if (this.noHeadphonesMessageTimeout) {
  //         clearTimeout(this.noHeadphonesMessageTimeout);
  //       }
  //       this.noHeadphonesMessageTimeout = setTimeout(() => {
  //         this.noHeadphonesMessageShown = false;
  //         console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
  //       }, 5000);
  //     } else {
  //       console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
  //     }

  //     return;
  //   }

  //   if (this.isStarting) {
  //     this.logger.log('🎤 Inicio en curso, omitiendo');
  //     return;
  //   }

  //   if (this.recognitionActive) {
  //     this.logger.log('🎤 Reconocimiento ya activo');
  //     return;
  //   }

  //   if (!this.recognition) {
  //     this.logger.error('Speech recognition no disponible');
  //     this.errorSubject.next('Speech recognition no disponible');
  //     return;
  //   }

  //   this.isStarting = true;
  //   this.listeningSubject.next(true);

  //   try {
  //     if (this.reconnectTimeout) {
  //       clearTimeout(this.reconnectTimeout);
  //       this.reconnectTimeout = null;
  //     }

  //     this.recognition.start();
  //   } catch (e: any) {
  //     this.isStarting = false;

  //     if (e.name === 'InvalidStateError') {
  //       this.logger.warn('Reconocimiento ya iniciado, reiniciando...');
  //       this.recognitionActive = true;
  //       this.isListening = true;
  //       this.readySubject.next(true);
  //     } else {
  //       this.logger.warn('Error al iniciar reconocimiento:', e);
  //       this.errorSubject.next('Error al activar el micrófono');
  //       this.listeningSubject.next(false);
  //       this.readySubject.next(false);
  //     }
  //   }
  // }







  async startListening(opts: { source?: string } = {}): Promise<void> {
    const now = Date.now();

    // ─────────────────────────────────────────────────────
    // 1) Rate-limit: evita los startListening duplicados a 1ms
    // ─────────────────────────────────────────────────────
    if (now - this.lastStartAttempt < 500) {
      console.log(
        `⏭️ [VoiceService] startListening ignorado (rate-limit) — source: ${opts.source ?? 'unknown'}`
      );
      return;
    }
    this.lastStartAttempt = now;

    // ─────────────────────────────────────────────────────
    // 2) Cancelar cualquier reinicio pendiente: ya estamos arrancando
    // ─────────────────────────────────────────────────────
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.pendingPostTTSRestart = false;

    console.log('🔍 [VoiceService] startListening() llamado:', {
      source: opts.source ?? 'unknown',
      isStarting: this.isStarting,
      recognitionActive: this.recognitionActive,
      isMuted: this.isMuted,
      timestamp: new Date().toISOString()
    });

    const hasHeadphones = await this.isHeadphonesConnected();
    if (!hasHeadphones) {
      console.log('🔇 [VoiceService] No hay auriculares conectados');

      if (!this.noHeadphonesMessageShown) {
        this.noHeadphonesMessageShown = true;
        this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

        if (this.noHeadphonesMessageTimeout) {
          clearTimeout(this.noHeadphonesMessageTimeout);
        }
        this.noHeadphonesMessageTimeout = setTimeout(() => {
          this.noHeadphonesMessageShown = false;
          console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
        }, 5000);
      } else {
        console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
      }

      return;
    }

    if (this.isStarting) {
      this.logger.log('🎤 Inicio en curso, omitiendo');
      return;
    }

    if (this.recognitionActive) {
      this.logger.log('🎤 Reconocimiento ya activo');
      return;
    }

    if (!this.recognition) {
      this.logger.error('Speech recognition no disponible');
      this.errorSubject.next('Speech recognition no disponible');
      return;
    }

    this.isStarting = true;
    this.listeningSubject.next(true);

    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      this.recognition.start();
    } catch (e: any) {
      this.isStarting = false;

      if (e.name === 'InvalidStateError') {
        this.logger.warn('Reconocimiento ya iniciado, reiniciando...');
        this.recognitionActive = true;
        this.isListening = true;
        this.readySubject.next(true);
      } else {
        this.logger.warn('Error al iniciar reconocimiento:', e);
        this.errorSubject.next('Error al activar el micrófono');
        this.listeningSubject.next(false);
        this.readySubject.next(false);
      }
    }
  }







  // /**
  //  * ✅ MONITOREAR AURICULARES (polling + devicechange, emisión solo al cambiar)
  //  */
  // private monitorHeadphones(): void {
  //   console.log('🔍 [VoiceService] monitorHeadphones() iniciado');

  //   if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
  //     console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
  //     return;
  //   }

  //   // ✅ 1. Detección inicial (una sola vez)
  //   this.checkHeadphonesOnStart();

  //   // ✅ 2. Polling cada 3s (con force=true, pero solo emite si cambió)
  //   this.headphonesCheckInterval = setInterval(async () => {
  //     const hasHeadphones = await this.isHeadphonesConnected(true);
  //     this.applyHeadphonesChange(hasHeadphones);
  //   }, 3000);

  //   // ✅ 3. Listener reactivo del navegador (conectar/desconectar instantáneo)
  //   if (typeof navigator.mediaDevices.addEventListener === 'function') {
  //     this.deviceChangeListener = async () => {
  //       console.log('🎧 [VoiceService] event devicechange detectado');
  //       const hasHeadphones = await this.isHeadphonesConnected(true);
  //       this.applyHeadphonesChange(hasHeadphones);
  //     };
  //     navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
  //     console.log('🎧 [VoiceService] Listener devicechange registrado');
  //   }
  // }







  private monitorHeadphones(): void {
    console.log('🔍 [VoiceService] monitorHeadphones() iniciado');

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
      return;
    }

    // ✅ 1. Detección inicial (una sola vez)
    this.checkHeadphonesOnStart();

    // ✅ 2. Polling cada 5s (antes 3s) como fallback silencioso
    this.headphonesCheckInterval = setInterval(async () => {
      const hasHeadphones = await this.isHeadphonesConnected(true);
      this.applyHeadphonesChange(hasHeadphones);
    }, 5000);

    // ✅ 3. Listener devicechange CON DEBOUNCE
    if (typeof navigator.mediaDevices.addEventListener === 'function') {
      this.deviceChangeListener = () => {
        // Si ya hay un debounce pendiente, lo cancelamos y reemplazamos
        if (this.deviceChangeDebounce) {
          clearTimeout(this.deviceChangeDebounce);
        }

        this.deviceChangeDebounce = setTimeout(async () => {
          this.deviceChangeDebounce = null;
          console.log('🎧 [VoiceService] devicechange procesado tras debounce');
          const hasHeadphones = await this.isHeadphonesConnected(true);
          this.applyHeadphonesChange(hasHeadphones);
        }, 1000);  // ✅ 1s de calma antes de verificar
      };

      navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
      console.log('🎧 [VoiceService] Listener devicechange registrado (con debounce 1s)');
    }
  }





  

  /**
   * ✅ ÚNICO punto donde se emite el cambio de estado de auriculares.
   * Solo emite si el valor cambió, y decide si hablar según el estado.
   */
  private applyHeadphonesChange(hasHeadphones: boolean): void {
    const previous = this.headphonesConnectedSubject.value;

    if (previous === hasHeadphones) {
      // Nada cambió: no emitir, no hablar
      return;
    }

    console.log(`🎧 [VoiceService] Cambio de estado: ${previous} → ${hasHeadphones}`);
    this.headphonesConnectedSubject.next(hasHeadphones);

    if (hasHeadphones) {
      // ✅ CONECTADOS

      // 1) Aviso por voz tras 800ms (para no pisar bienvenidas de Home/Login)
      setTimeout(() => {
        if (this.isSpeaking) {
          console.log('⏭️ [VoiceService] TTS ya en curso, omitiendo aviso de conexión');
          return;
        }

        const msg = this.isMuted
          ? this.voiceContext.getMessage('headphonesConnectedMicOff')
          : this.voiceContext.getMessage('headphonesConnectedMicOn');

        console.log('🔊 [VoiceService] Emitiendo aviso de auriculares conectados:', msg);
        this.speakAlways(msg);
      }, 800);

      // 2) Arrancar el reconocimiento SIEMPRE.
      //    startListening() es idempotente: si ya está activo, sale sin hacer nada.
      const delay = 3500;
      console.log(`🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento en ${delay}ms`);

      setTimeout(() => {
        if (this.isStarting) return;
        if (!this.areHeadphonesConnected()) return;
        console.log('🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento');
        this.startListening();
      }, delay);

    } else {
      // ✅ DESCONECTADOS: silencio intencional + limpieza completa de estado
      console.log('🔇 [VoiceService] Auriculares desconectados → silencio intencional');

      // 1) Cancelar cualquier TTS en curso y resetear isSpeaking
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.isSpeaking = false;
      this.lastTTSEndTime = Date.now();

      // 2) Parar el recognizer → recognitionActive = false, isListening = false
      //    Esto es CLAVE: si no lo paramos, al reconectar startListening()
      //    saldrá early pensando que sigue activo, y el micro nunca se reanudará.
      this.stopListening();

      // 3) Mute (guarda preferencia, actualiza UI)
      if (!this.isMuted) {
        this.mute();
      }
    }
  }





  public restartRecognition(): void {
    console.log('🔄 [VoiceService] Reiniciando reconocimiento...');
    this.stopListening();
    setTimeout(() => {
      this.startListening();
    }, 300);
  }

  public onNavigate(): void {
    this.ignoreNavCommandsUntil = Date.now() + this.NAV_BLOCK_MS;
    this.lockNavigation(this.NAV_BLOCK_MS);
    console.log(`🔇 [VoiceService] Comandos de navegación bloqueados durante ${this.NAV_BLOCK_MS}ms`);
  }

  private isNavigationCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return this.NAV_COMMANDS.some(cmd => lower === cmd || lower.includes(cmd));
  }

  stopListening(): void {
    console.log('🔍 [VoiceService] stopListening() llamado:', {
      isStarting: this.isStarting,
      recognitionActive: this.recognitionActive,
      timestamp: new Date().toISOString()
    });

    this.isStarting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.recognition && this.recognitionActive) {
      try {
        this.recognition.stop();
        this.recognitionActive = false;
        this.isListening = false;
        this.reconnectAttempts = 0;

        this.listeningSubject.next(false);
        this.readySubject.next(false);

        if (this.enableLogs) {
          this.logger.log('🔇 Micrófono desactivado');
        }
      } catch (e) {
        this.logger.warn('Error al desactivar micrófono:', e);
        this.recognitionActive = false;
        this.isListening = false;
        this.listeningSubject.next(false);
        this.readySubject.next(false);
      }
    } else {
      this.recognitionActive = false;
      this.isListening = false;
      this.listeningSubject.next(false);
      this.readySubject.next(false);
    }
  }

  clearTranscript(): void {
    console.log('🧹 [VoiceService] Limpiando transcript');
    this.currentTranscript = '';
    this.transcriptSubject.next('');
    console.log('🧹 [VoiceService] Transcript limpiado (reconocimiento activo)');
  }

  abortRecognition(): void {
    console.log('🛑 [VoiceService] Abortando reconocimiento');
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {
        // Ignorar errores
      }
    }
  }

  // ============================================================
  // MUTE / UNMUTE
  // ============================================================

  mute(): void {
    console.log('🔍 [VoiceService] mute() llamado');

    this.isMuted = true;
    this.mutedSubject.next(true);

    this.userPreferences.updatePreference('micEnabled', false).subscribe();

    if (this.areHeadphonesConnected()) {
      this.speakAlways(this.voiceContext.getMessage('micDeactivated'));
    }
  }

  async unmute(): Promise<void> {
    console.log('🔍 [VoiceService] unmute() llamado');

    const hasHeadphones = await this.isHeadphonesConnected();
    if (!hasHeadphones) {
      this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
      return;
    }

    if (!this.isMuted) {
      console.log('🎤 Micrófono ya activo');
      return;
    }

    this.isMuted = false;
    this.mutedSubject.next(false);

    this.userPreferences.updatePreference('micEnabled', true).subscribe();

    const contextMessage = this.voiceContext.getActivationMessage();
    this.speakAlways(contextMessage);

    if (!this.recognitionActive || !this.isListening) {
      this.startListening();
    }
  }

  toggleMute(): void {
    console.log('🔍 [VoiceService] toggleMute() llamado:', {
      isMuted: this.isMuted,
      timestamp: new Date().toISOString()
    });
    this.isMuted ? this.unmute() : this.mute();
  }

  isCurrentlyMuted(): boolean {
    return this.isMuted;
  }

  isRecognitionActive(): boolean {
    return this.recognitionActive;
  }

  // ============================================================
  // MÉTODOS PARA ACTUALIZAR CONTEXTO POR PÁGINA
  // ============================================================

  setContextForPage(page: 'login' | 'home' | 'about' | 'register' | 'dashboard'): void {
    switch (page) {
      case 'login':
        this.voiceContext.setLoginContext();
        break;
      case 'home':
        this.voiceContext.setHomeContext();
        break;
      case 'about':
        this.voiceContext.setAboutContext();
        break;
      case 'register':
        this.voiceContext.setRegisterContext();
        break;
      case 'dashboard':
        this.voiceContext.setDashboardContext();
        break;
    }

    if (!this.isMuted) {
      this.speakAlways(this.voiceContext.getActivationMessage());
    }
  }

  getWelcomeMessageForCurrentPage(): string {
    return this.voiceContext.getActivationMessage();
  }

  getAvailableCommands(): string[] {
    return this.voiceContext.getAvailableCommands();
  }

  isCommandAvailable(command: string): boolean {
    const availableCommands = this.voiceContext.getAvailableCommands();
    return availableCommands.some(cmd => command.includes(cmd) || command === cmd);
  }

  // ============================================================
  // SPEAK WHEN READY
  // ============================================================

  async speakWhenReady(text: string): Promise<void> {
    if (this.recognitionActive && this.readySubject.value) {
      return this.speak(text);
    }
    try {
      await firstValueFrom(
        this.ready$.pipe(
          filter(ready => ready),
          take(1),
          timeout(5000)
        )
      );
    } catch {
      this.logger.warn('Timeout esperando reconocimiento, reproduciendo igual');
    }
    return this.speak(text);
  }

  waitForRecognitionReady(): Promise<void> {
    return new Promise((resolve) => {
      if (this.recognitionActive && this.readySubject.value) {
        resolve();
        return;
      }
      const checkInterval = setInterval(() => {
        if (this.recognitionActive && this.readySubject.value) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 3000);
    });
  }

  // ============================================================
  // CONTROL DE BIENVENIDA
  // ============================================================

  hasWelcomeBeenShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): boolean {
    return this.welcomeFlags[page];
  }

  markWelcomeAsShown(page: 'welcome' | 'about' | 'login' | 'init' | 'register' | 'notfound' | 'home' | 'dashboard'): void {
    this.welcomeFlags[page] = true;
    if (this.enableLogs) {
      this.logger.log(`📌 Welcome marcado para: ${page}`);
    }
  }

  resetWelcomeFlags(): void {
    this.welcomeFlags = {
      welcome: false,
      about: false,
      login: false,
      init: false,
      register: false,
      notfound: false,
      home: false,
      dashboard: false
    };
    if (this.enableLogs) {
      this.logger.log('🔄 Welcome flags reiniciados');
    }
  }

  // ============================================================
  // SÍNTESIS DE VOZ (TTS)
  // ============================================================

  private getNaturalVoice(lang: string): SpeechSynthesisVoice | null {
    if (this.cachedVoice) return this.cachedVoice;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.filter(v => v.lang.startsWith(lang.split('-')[0]));
    this.cachedVoice = preferred.find(v =>
      /google|samantha|microsoft|diego|helena|zira|david|clara|maria|juan/i.test(v.name)
    ) || preferred[0] || null;
    if (this.cachedVoice && this.enableLogs) {
      this.logger.log(`🗣️ Voz seleccionada: ${this.cachedVoice.name} (${this.cachedVoice.lang})`);
    }
    return this.cachedVoice;
  }


  //
  // speak(text: string, lang: string = 'es-ES', rate: number = 0.9, pitch: number = 1.05): Promise<void> {
  //   console.log('🔍 [VoiceService] speak() llamado:', {
  //     text: text.substring(0, 50) + '...',
  //     isMuted: this.isMuted,
  //     timestamp: new Date().toISOString()
  //   });

  //   return new Promise((resolve) => {
  //     if (this.isMuted) {
  //       if (this.enableLogs) {
  //         this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
  //       }
  //       resolve();
  //       return;
  //     }

  //     // ✅ NUEVO: bloquear si no hay auriculares
  //     if (!this.areHeadphonesConnected()) {
  //       console.log('🔇 [VoiceService] → speak() CANCELADO: No hay auriculares');
  //       resolve();
  //       return;
  //     }

  //     if (!window.speechSynthesis) {
  //       this.logger.warn('Speech Synthesis no soportada');
  //       resolve();
  //       return;
  //     }

  //     const myToken = ++this.speakToken;
  //     this.isSpeaking = true;

  //     if (window.speechSynthesis.speaking) {
  //       window.speechSynthesis.cancel();
  //     }

  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = lang;
  //     utterance.rate = rate;
  //     utterance.pitch = pitch;
  //     utterance.volume = 1;

  //     const voice = this.getNaturalVoice(lang);
  //     if (voice) {
  //       utterance.voice = voice;
  //     }

  //     const finalize = () => {
  //       if (myToken === this.speakToken) {
  //         this.isSpeaking = false;
  //         this.lastTTSEndTime = Date.now();
  //       }
  //       resolve();
  //     };

  //     utterance.onend = () => {
  //       console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
  //       finalize();
  //     };

  //     utterance.onerror = (event: any) => {
  //       if (event?.error === 'interrupted') {
  //         console.log('🔍 [VoiceService] → speak() interrumpido');
  //       } else {
  //         this.logger.warn('Error en síntesis de voz:', event);
  //       }
  //       finalize();
  //     };

  //     window.speechSynthesis.speak(utterance);

  //     if (this.enableLogs) {
  //       this.logger.log(`🗣️ Hablando: "${text}"`);
  //     }
  //   });
  // }








  speak(text: string, lang: string = 'es-ES', rate: number = 0.9, pitch: number = 1.05): Promise<void> {
    console.log('🔍 [VoiceService] speak() llamado:', {
      text: text.substring(0, 50) + '...',
      isMuted: this.isMuted,
      timestamp: new Date().toISOString()
    });

    return new Promise((resolve) => {
      if (this.isMuted) {
        if (this.enableLogs) {
          this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
        }
        resolve();
        return;
      }

      // ✅ Bloquear si no hay auriculares
      if (!this.areHeadphonesConnected()) {
        console.log('🔇 [VoiceService] → speak() CANCELADO: No hay auriculares');
        resolve();
        return;
      }

      if (!window.speechSynthesis) {
        this.logger.warn('Speech Synthesis no soportada');
        resolve();
        return;
      }

      const myToken = ++this.speakToken;
      this.isSpeaking = true;

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = 1;

      const voice = this.getNaturalVoice(lang);
      if (voice) {
        utterance.voice = voice;
      }

      const finalize = () => {
        if (myToken === this.speakToken) {
          this.isSpeaking = false;
          this.lastTTSEndTime = Date.now();

          // ✅ NUEVO: speak() normal NO espera reinicio del componente.
          //    Si había un pendingPostTTSRestart huérfano, lo limpiamos.
          if (this.pendingPostTTSRestart) {
            console.log('🧹 [VoiceService] speak() limpiando pendingPostTTSRestart huérfano');
            this.pendingPostTTSRestart = false;
          }

          // ✅ NUEVO: si el reconocimiento quedó apagado, reconectar automáticamente
          setTimeout(() => {
            if (
              !this.isSpeaking &&
              !this.isMuted &&
              !this.recognitionActive &&
              !this.pendingPostTTSRestart &&
              this.areHeadphonesConnected()
            ) {
              console.log('🔄 [VoiceService] speak() → reconexión automática del micro');
              this.startListening();
            }
          }, 800);
        }
        resolve();
      };

      utterance.onend = () => {
        console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
        finalize();
      };

      utterance.onerror = (event: any) => {
        if (event?.error === 'interrupted') {
          console.log('🔍 [VoiceService] → speak() interrumpido');
        } else {
          this.logger.warn('Error en síntesis de voz:', event);
        }
        finalize();
      };

      window.speechSynthesis.speak(utterance);

      if (this.enableLogs) {
        this.logger.log(`🗣️ Hablando: "${text}"`);
      }
    });
  }














  // public speakAlways(text: string): Promise<void> {
  //   console.log('🔍 [VoiceService] speakAlways() llamado:', {
  //     text: text.substring(0, 50) + '...',
  //     isMuted: this.isMuted,
  //     hasHeadphones: this.areHeadphonesConnected(),
  //     timestamp: new Date().toISOString()
  //   });

  //   if (!this.areHeadphonesConnected()) {
  //     console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');
  //     return Promise.resolve();
  //   }

  //   return new Promise((resolve) => {
  //     if (!window.speechSynthesis) {
  //       this.logger.warn('Speech Synthesis no soportada');
  //       resolve();
  //       return;
  //     }

  //     const myToken = ++this.speakToken;
  //     this.isSpeaking = true;

  //     if (window.speechSynthesis.speaking) {
  //       window.speechSynthesis.cancel();
  //     }

  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = 'es-ES';
  //     utterance.rate = 0.9;
  //     utterance.pitch = 1.05;
  //     utterance.volume = 1;

  //     const voice = this.getNaturalVoice('es-ES');
  //     if (voice) {
  //       utterance.voice = voice;
  //     }

  //     const finalize = () => {
  //       if (myToken === this.speakToken) {
  //         this.isSpeaking = false;
  //         this.lastTTSEndTime = Date.now();
  //         this.pendingPostTTSRestart = true;

  //         setTimeout(() => {
  //           if (this.pendingPostTTSRestart && !this.isMuted && !this.recognitionActive) {
  //             console.log('⏰ [VoiceService] Timeout esperando componente, reiniciando desde el servicio');
  //             this.pendingPostTTSRestart = false;
  //             this.startListening();
  //           }
  //         }, 3000);
  //       }
  //       resolve();
  //     };

  //     utterance.onend = () => {
  //       console.log('🔍 [VoiceService] → speakAlways() onend');
  //       finalize();
  //     };

  //     utterance.onerror = (event: any) => {
  //       if (event?.error === 'interrupted') {
  //         console.log('🔍 [VoiceService] → speakAlways() interrumpido');
  //       } else {
  //         this.logger.warn('Error en síntesis de voz:', event);
  //       }
  //       finalize();
  //     };

  //     window.speechSynthesis.speak(utterance);

  //     if (this.enableLogs) {
  //       this.logger.log(`🗣️ Hablando (siempre): "${text}"`);
  //     }
  //   });
  // }







  public speakAlways(text: string, pauseRecognition: boolean = false): Promise<void> {
    console.log('🔍 [VoiceService] speakAlways() llamado:', {
      text: text.substring(0, 50) + '...',
      isMuted: this.isMuted,
      hasHeadphones: this.areHeadphonesConnected(),
      pauseRecognition,
      timestamp: new Date().toISOString()
    });

    if (!this.areHeadphonesConnected()) {
      console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');

      // ✅ Cancelar cualquier TTS pendiente y resetear isSpeaking
      //    (si no, se queda pegado cuando se desconectan los auriculares durante un TTS)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.isSpeaking = false;
      this.lastTTSEndTime = Date.now();

      return Promise.resolve();
    }

    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        this.logger.warn('Speech Synthesis no soportada');
        resolve();
        return;
      }

      const myToken = ++this.speakToken;
      this.isSpeaking = true;

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      const voice = this.getNaturalVoice('es-ES');
      if (voice) {
        utterance.voice = voice;
      }

      const finalize = () => {
        if (myToken === this.speakToken) {
          this.isSpeaking = false;
          this.lastTTSEndTime = Date.now();

          if (pauseRecognition) {
            this.pendingPostTTSRestart = true;
            console.log('⏸️ [VoiceService] pendingPostTTSRestart activado (el componente reiniciará)');

            setTimeout(() => {
              if (!this.pendingPostTTSRestart) return;
              if (this.recognitionActive) return;
              // ✅ NO comprobar isMuted: el micro debe escuchar el wake word aunque esté muteado
              console.log('⏰ [VoiceService] Timeout esperando componente → reinicio desde el servicio');
              this.pendingPostTTSRestart = false;
              this.startListening({ source: 'speakAlways.timeout' });
            }, 3000);
          }
        }
        resolve();
      };

      utterance.onend = () => {
        console.log('🔍 [VoiceService] → speakAlways() onend');
        finalize();
      };

      utterance.onerror = (event: any) => {
        if (event?.error === 'interrupted') {
          console.log('🔍 [VoiceService] → speakAlways() interrumpido');
        } else {
          this.logger.warn('Error en síntesis de voz:', event);
        }
        finalize();
      };

      window.speechSynthesis.speak(utterance);

      if (this.enableLogs) {
        this.logger.log(`🗣️ Hablando (siempre): "${text}"`);
      }
    });
  }





  // ============================================================
  // MÉTODOS PARA ENVIAR RESPUESTAS
  // ============================================================

  sendSuccessResponse(
    reply: string,
    action?: { type: string; payload?: Record<string, any> },
    data?: any
  ): void {
    const response: VoiceCommandResponse = {
      success: true,
      intent: 'success',
      status: 'success',
      reply,
      action,
      data,
      timestamp: new Date().toISOString()
    };
    this.responseSubject.next(response);
  }

  sendErrorResponse(
    reply: string,
    error?: string,
    data?: any
  ): void {
    const response: VoiceCommandResponse = {
      success: false,
      intent: 'error',
      status: 'error',
      reply,
      error: error || reply,
      data,
      timestamp: new Date().toISOString()
    };
    this.responseSubject.next(response);
  }

  sendAudioResponse(
    reply: string,
    audioBase64: string,
    action?: { type: string; payload?: Record<string, any> }
  ): void {
    const response: VoiceCommandResponse = {
      success: true,
      intent: 'audio',
      status: 'success',
      reply,
      audioBase64,
      action,
      timestamp: new Date().toISOString()
    };
    this.responseSubject.next(response);
  }

  // ============================================================
  // OBSERVABLES PÚBLICOS
  // ============================================================

  getTranscript(): Observable<string> {
    return this.transcriptSubject.asObservable();
  }

  getTranscriptWithFinal(): Observable<{ text: string; isFinal: boolean }> {
    return this.transcriptWithFinalSubject.asObservable();
  }

  getResponses(): Observable<VoiceCommandResponse> {
    return this.responseSubject.asObservable();
  }

  getMutedState(): Observable<boolean> {
    return this.mutedSubject.asObservable();
  }

  getErrors(): Observable<string> {
    return this.errorSubject.asObservable();
  }

  getWakeWords(): Observable<string> {
    return this.wakeWordSubject.asObservable();
  }

  // ============================================================
  // UTILIDADES
  // ============================================================

  isSupported(): boolean {
    if (this.isFirefox()) {
      console.warn('🦊 Firefox: SpeechRecognition no soportado nativamente');
      return false;
    }
    const win = window as Record<string, any>;
    return !!(win['SpeechRecognition'] || win['webkitSpeechRecognition']);
  }

  getBrowserSupportMessage(): string {
    if (this.isFirefox()) {
      return '⚠️ El reconocimiento de voz no está disponible en Firefox. Por favor, usa Chrome, Edge o Safari para usar comandos de voz.';
    }
    if (!this.isSupported()) {
      return '⚠️ El reconocimiento de voz no está disponible en este navegador.';
    }
    return '';
  }

  isListeningActive(): boolean {
    return this.isListening;
  }

  isSpeechSynthesisSupported(): boolean {
    return !!(window.speechSynthesis);
  }

  isFullySupported(): boolean {
    return this.isSupported() && this.isSpeechSynthesisSupported();
  }

  isFirefox(): boolean {
    return navigator.userAgent.toLowerCase().includes('firefox');
  }

  // ============================================================
  // LIMPIEZA
  // ============================================================

  // destroy(): void {
  //   if (this.enableLogs) {
  //     this.logger.log('🧹 Destruyendo VoiceService...');
  //   }

  //   // ✅ Quitar listener devicechange
  //   if (this.deviceChangeListener && typeof navigator.mediaDevices?.removeEventListener === 'function') {
  //     navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
  //     this.deviceChangeListener = null;
  //   }

  //   // ✅ Limpiar interval de polling
  //   if (this.headphonesCheckInterval) {
  //     clearInterval(this.headphonesCheckInterval);
  //     this.headphonesCheckInterval = null;
  //   }

  //   if (this.reconnectTimeout) {
  //     clearTimeout(this.reconnectTimeout);
  //     this.reconnectTimeout = null;
  //   }

  //   this.stopListening();

  //   if (window.speechSynthesis) {
  //     window.speechSynthesis.cancel();
  //   }

  //   this.transcriptSubject.complete();
  //   this.transcriptWithFinalSubject.complete();
  //   this.responseSubject.complete();
  //   this.mutedSubject.complete();
  //   this.wakeWordSubject.complete();
  //   this.errorSubject.complete();
  //   this.listeningSubject.complete();
  //   this.readySubject.complete();

  //   this.filterService.reset();

  //   if (this.recognition) {
  //     this.recognition.onresult = null as any;
  //     this.recognition.onerror = null as any;
  //     this.recognition.onend = null as any;
  //     this.recognition.onstart = null as any;
  //     this.recognition = null as any;
  //   }

  //   if (this.enableLogs) {
  //     this.logger.log('✅ VoiceService destruido correctamente');
  //   }
  // }



  // destroy(): void {
  //   if (this.enableLogs) {
  //     this.logger.log('🧹 Destruyendo VoiceService...');
  //   }

  //   // ✅ NUEVO: limpiar debounce del devicechange
  //   if (this.deviceChangeDebounce) {
  //     clearTimeout(this.deviceChangeDebounce);
  //     this.deviceChangeDebounce = null;
  //   }

  //   // ✅ Quitar listener devicechange
  //   if (this.deviceChangeListener && typeof navigator.mediaDevices?.removeEventListener === 'function') {
  //     navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
  //     this.deviceChangeListener = null;
  //   }

  //   // ✅ Limpiar interval de polling
  //   if (this.headphonesCheckInterval) {
  //     clearInterval(this.headphonesCheckInterval);
  //     this.headphonesCheckInterval = null;
  //   }

  //   if (this.reconnectTimeout) {
  //     clearTimeout(this.reconnectTimeout);
  //     this.reconnectTimeout = null;
  //   }

  //   this.stopListening();

  //   if (window.speechSynthesis) {
  //     window.speechSynthesis.cancel();
  //   }

  //   this.transcriptSubject.complete();
  //   this.transcriptWithFinalSubject.complete();
  //   this.responseSubject.complete();
  //   this.mutedSubject.complete();
  //   this.wakeWordSubject.complete();
  //   this.errorSubject.complete();
  //   this.listeningSubject.complete();
  //   this.readySubject.complete();

  //   this.filterService.reset();

  //   if (this.recognition) {
  //     this.recognition.onresult = null as any;
  //     this.recognition.onerror = null as any;
  //     this.recognition.onend = null as any;
  //     this.recognition.onstart = null as any;
  //     this.recognition = null as any;
  //   }

  //   if (this.enableLogs) {
  //     this.logger.log('✅ VoiceService destruido correctamente');
  //   }
  // }



  destroy(): void {
    if (this.enableLogs) this.logger.log('🧹 Destruyendo VoiceService...');

    // ✅ NUEVO: cancelar el restart pendiente
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.deviceChangeDebounce) { clearTimeout(this.deviceChangeDebounce); this.deviceChangeDebounce = null; }
    if (this.deviceChangeListener && typeof navigator.mediaDevices?.removeEventListener === 'function') {
      navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
      this.deviceChangeListener = null;
    }
    if (this.headphonesCheckInterval) { clearInterval(this.headphonesCheckInterval); this.headphonesCheckInterval = null; }
    if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; }
    if (this.noHeadphonesMessageTimeout) { clearTimeout(this.noHeadphonesMessageTimeout); this.noHeadphonesMessageTimeout = null; }

    this.stopListening();

    if (window.speechSynthesis) window.speechSynthesis.cancel();

    this.transcriptSubject.complete();
    this.transcriptWithFinalSubject.complete();
    this.responseSubject.complete();
    this.mutedSubject.complete();
    this.wakeWordSubject.complete();
    this.errorSubject.complete();
    this.listeningSubject.complete();
    this.readySubject.complete();
    this.headphonesConnectedSubject.complete();

    this.filterService.reset();

    if (this.recognition) {
      this.recognition.onresult = null as any;
      this.recognition.onerror = null as any;
      this.recognition.onend = null as any;
      this.recognition.onstart = null as any;
      this.recognition = null as any;
    }

    if (this.enableLogs) this.logger.log('✅ VoiceService destruido correctamente');
  }

}