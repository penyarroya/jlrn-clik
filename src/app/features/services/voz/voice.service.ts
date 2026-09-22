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
//   private voiceContext = inject(VoiceContextService);

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

//   private restartTimer: any = null;
//   private lastStartAttempt = 0;

//   private lastWakeWordTime = 0;
//   private readonly WAKE_DEBOUNCE_TIME = 2000;

//   private headphonesMessageShown = false;
//   private headphonesCheckInterval: any = null;

//   private noHeadphonesMessageShown = false;
//   private noHeadphonesMessageTimeout: any = null;

//   private headphonesConnectedSubject = new BehaviorSubject<boolean>(false);
//   public headphonesConnected$ = this.headphonesConnectedSubject.asObservable();

//   // ✅ Bloquea llamadas paralelas a detectHeadphonesInternal()
//   private headphonesDetectionInFlight: Promise<boolean> | null = null;

//   // ✅ Cache TTL ampliado (antes 8s, ahora 15s)
//   //    El devicechange invalida el cache cuando cambia algo, así que 15s es seguro
//   private headphonesCache = {
//     result: false,
//     timestamp: 0,
//     ttlMs: 15000
//   };

//   // ✅ Listener reactivo del navegador (devicechange)
//   private deviceChangeListener: any = null;

//   // ✅ Debounce del devicechange (Windows lo dispara en ráfaga)
//   private deviceChangeDebounce: any = null;

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

//   constructor() {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] CONSTRUCTOR INICIADO');
//     }

//     this.initRecognition();
//     this.loadVoices();

//     this.isMuted = true;
//     this.mutedSubject.next(true);
//     this.listeningSubject.next(false);
//     this.readySubject.next(false);

//     if (this.enableLogs) {
//       this.logger.log(`🎤 ${this.voiceContext.getMessage('welcome')}`);
//       console.log('🔍 [VoiceService] Llamando a monitorHeadphones()...');
//     }

//     this.monitorHeadphones();

//     setTimeout(() => {
//       this.startListening();
//       if (this.enableLogs) {
//         console.log('🎤 Reconocimiento de voz activo (escuchando "hola")');
//       }
//     }, 1000);
//   }

//   public getIsSpeaking(): boolean {
//     return this.isSpeaking;
//   }

//   private navigationLockedUntil = 0;

//   public lockNavigation(ms: number = 3000): void {
//     this.navigationLockedUntil = Date.now() + ms;
//   }

//   private isNavigationLocked(): boolean {
//     return Date.now() < this.navigationLockedUntil;
//   }

//   ngOnDestroy(): void {
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

//   async forceHeadphonesDetection(): Promise<boolean> {
//     if (this.enableLogs) {
//       console.log('🔧 [VoiceService] Forzando detección de auriculares...');
//     }

//     const hasHeadphones = await this.isHeadphonesConnected(true);

//     if (!hasHeadphones) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] No se detectaron auriculares reales');
//       }
//       this.applyHeadphonesChange(false);
//       return false;
//     }

//     if (this.enableLogs) {
//       console.log('🎧 [VoiceService] Auriculares reales detectados');
//     }
//     this.applyHeadphonesChange(true);
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
//         this.isStarting = false;
//         this.recognitionActive = true;
//         this.isListening = true;
//         this.readySubject.next(true);
//         if (this.enableLogs) {
//           console.log('🎤 Micrófono realmente activo (onstart)');
//         }
//       });
//     };

//     if (this.enableLogs) {
//       this.logger.log('✅ Speech Recognition inicializado');
//     }
//   }

//   public restartVoiceService(): void {
//     if (this.enableLogs) {
//       console.log('🔄 [VoiceService] Reiniciando servicio...');
//     }

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
//       if (this.enableLogs) {
//         console.log('✅ [VoiceService] Servicio reiniciado correctamente');
//       }
//     }, 500);
//   }

//   // ============================================================
//   // MANEJO DE EVENTOS
//   // ============================================================
//   private handleResult(event: SpeechRecognitionEvent): void {
//     if (window.speechSynthesis.speaking) {
//       try {
//         const result = event.results[event.results.length - 1];
//         if (result && result[0]) {
//           const transcript = result[0].transcript.toLowerCase().trim();

//           const canInterrupt =
//             transcript === 'hola' ||
//             transcript.includes('hola') ||
//             transcript.includes('ayuda') ||
//             transcript.includes('para') ||
//             transcript.includes('silencio') ||
//             transcript.includes('silenciar') ||
//             transcript.includes('stop') ||
//             transcript.includes('calla');

//           if (!canInterrupt) {
//             if (this.enableLogs) {
//               console.log('🔇 [VoiceService] Sistema hablando, ignorando resultado');
//             }
//             return;
//           }

//           if (!result.isFinal) {
//             if (this.enableLogs) {
//               console.log('⏭️ [VoiceService] Comando prioritario parcial, esperando final:', transcript);
//             }
//             return;
//           }

//           if (this.enableLogs) {
//             console.log('🔊 [VoiceService] Comando prioritario FINAL detectado durante el habla:', transcript);
//           }

//           if (transcript.includes('para') ||
//               transcript.includes('silencio') ||
//               transcript.includes('silenciar') ||
//               transcript.includes('stop') ||
//               transcript.includes('calla') ||
//               transcript.includes('ayuda')) {
//             window.speechSynthesis.cancel();
//             if (this.enableLogs) {
//               console.log('🛑 [VoiceService] TTS interrumpido por comando prioritario');
//             }
//           }
//         } else {
//           return;
//         }
//       } catch {
//         return;
//       }
//     }

//     if (!event.results || event.results.length === 0) return;

//     const result = event.results[event.results.length - 1];
//     if (!result || !result[0]) return;

//     const transcript = result[0].transcript.toLowerCase().trim();

//     if (this.enableLogs) {
//       console.log('🎤 Reconocido:', transcript, 'Final:', result.isFinal);
//     }

//     if (transcript === 'hola' || transcript === 'hola hola') {
//       this.handleWakeWord(transcript, result.isFinal);
//       return;
//     }

//     if (transcript === 'silenciar' || transcript === 'mute' ||
//         transcript.includes('silenciar micrófono') || transcript.includes('apagar micrófono')) {
//       this.handleMute();
//       return;
//     }

//     if (this.isMuted) {
//       const allowed = ['ayuda', 'help', 'hola', 'asistente'];
//       if (!allowed.includes(transcript)) {
//         if (this.enableLogs) {
//           console.log('🔇 [VoiceService] Muteado, ignorando:', transcript);
//         }
//         return;
//       }
//     }

//     if (this.isNavigationCommand(transcript) && Date.now() < this.ignoreNavCommandsUntil) {
//       if (this.enableLogs) {
//         console.log(`⏭️ [VoiceService] Comando de navegación ignorado tras navegación: "${transcript}"`);
//       }
//       return;
//     }

//     const now = Date.now();
//     const isRepeatable =
//       transcript.includes('ayuda') ||
//       transcript.includes('hola') ||
//       transcript.includes('para') ||
//       transcript.includes('silencio') ||
//       transcript.includes('calla');

//     if (!isRepeatable &&
//         transcript === this.lastProcessedTranscript &&
//         (now - this.lastProcessedTime) < this.GLOBAL_COMMAND_DEBOUNCE) {
//       if (this.enableLogs) {
//         console.log(`⏭️ [VoiceService] Comando duplicado ignorado globalmente: "${transcript}"`);
//       }
//       return;
//     }
//     this.lastProcessedTranscript = transcript;
//     this.lastProcessedTime = now;

//     const isPriority =
//       transcript.includes('ayuda') ||
//       transcript.includes('para') ||
//       transcript.includes('silencio') ||
//       transcript.includes('calla') ||
//       transcript.includes('stop');

//     if (isPriority && !result.isFinal) {
//       if (this.enableLogs) {
//         console.log('⏭️ [VoiceService] Comando prioritario ignorado (aún no es final):', transcript);
//       }
//       return;
//     }

//     if (this.enableLogs) {
//       console.log('📤 [VoiceService] Emitiendo comando:', transcript, '(final:', result.isFinal + ')');
//     }

//     this.transcriptSubject.next(transcript);
//     this.transcriptWithFinalSubject.next({ text: transcript, isFinal: result.isFinal });
//   }
  
//   //
//   private handleWakeWord(transcript: string, isFinal: boolean): void {
//     if (this.isMuted) {
//       const ahora = Date.now();
//       if (ahora - this.lastWakeWordTime > this.WAKE_DEBOUNCE_TIME) {
//         this.lastWakeWordTime = ahora;
//         this.unmute();
//         this.wakeWordSubject.next(transcript);
//       } else {
//         if (this.enableLogs) {
//           console.log('⏳ [VoiceService] Debounce: espera un momento');
//         }
//       }
//     } else {
//       if (this.enableLogs) {
//         console.log('🎤 [VoiceService] Micrófono ya activo');
//       }
//     }
//   }

//   //
//   private handleMute(): void {
//     if (!this.isMuted) {
//       this.mute();
//     } else {
//       if (this.enableLogs) {
//         console.log('ℹ️ [VoiceService] Micrófono ya está muteado');
//       }
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

//   //
//   private handleError(event: SpeechRecognitionErrorEvent): void {
//     this.ngZone.run(() => {
//       if (event.error === 'no-speech') return;

//       if (this.enableLogs) {
//         console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
//       }
//       this.logger.error('Error en reconocimiento:', event.error);
//       this.errorSubject.next(event.error);

//       this.isStarting = false;
//       this.recognitionActive = false;
//       this.isListening = false;
//       this.readySubject.next(false);
//       this.listeningSubject.next(false);

//       if (event.error === 'not-allowed') {
//         this.logger.error('❌ Permiso de micrófono denegado');
//         this.stopListening();
//         this.errorSubject.next(this.voiceContext.getMessage('permissionDenied'));
//         this.speakAlways(this.voiceContext.getMessage('permissionDenied'));
//         return;
//       }

//       const delay = Math.min(500 * Math.pow(1.2, this.reconnectAttempts), 5000);
//       this.reconnectAttempts++;

//       if (this.enableLogs) {
//         this.logger.log(`⏳ Reintentando en ${delay}ms (intento #${this.reconnectAttempts})`);
//       }

//       this.scheduleRestart(delay, () => {
//         if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted) return;
//         if (this.recognitionActive) return;
//         this.reconnectAttempts = 0;
//         this.startListening({ source: 'handleError' });
//       });
//     });
//   }

//   private handleEnd(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] handleEnd:', {
//         isListening: this.isListening,
//         isStarting: this.isStarting,
//         recognitionActive: this.recognitionActive,
//         isSpeaking: this.isSpeaking,
//         msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
//         pendingPostTTSRestart: this.pendingPostTTSRestart,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const abortedDuringStart = this.isStarting;

//     this.isStarting = false;
//     this.isListening = false;
//     this.recognitionActive = false;

//     if (abortedDuringStart) {
//       if (this.enableLogs) {
//         console.log('⏭️ [VoiceService] handleEnd durante arranque → backoff largo');
//       }
//       this.readySubject.next(false);
//       this.listeningSubject.next(false);

//       if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted) {
//         return;
//       }

//       this.scheduleRestart(2500);
//       return;
//     }

//     if (this.isSpeaking) {
//       if (this.enableLogs) {
//         console.log('⏸️ [VoiceService] handleEnd → TTS activo, estado visual intacto');
//         this.logger.log('🔴 Reconocimiento pausado por TTS');
//       }

//       if (this.pendingPostTTSRestart || this.isMuted) return;

//       this.scheduleRestart(1500, () => {
//         if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted || this.recognitionActive) return;
//         if (this.enableLogs) {
//           console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
//         }
//         this.startListening();
//       });
//       return;
//     }

//     this.readySubject.next(false);
//     this.listeningSubject.next(false);

//     if (this.enableLogs) this.logger.log('🔴 Reconocimiento finalizado');

//     if (this.pendingPostTTSRestart) {
//       if (this.enableLogs) {
//         console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO reinicia');
//       }
//       return;
//     }

//     if (this.isNavigationLocked()) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
//       }
//       this.scheduleRestart(3100, () => {
//         if (this.isSpeaking || this.pendingPostTTSRestart) return;
//         if (!this.isNavigationLocked() && !this.recognitionActive) {
//           this.startListening();
//           if (this.enableLogs) {
//             console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
//           }
//         }
//       });
//       return;
//     }

//     if (this.isMuted) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
//       }
//       return;
//     }

//     if (this.enableLogs) {
//       console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');
//     }
//     this.scheduleRestart(1000);
//   }

//   private scheduleRestart(delay: number, action?: () => void): void {
//     clearTimeout(this.restartTimer);
//     this.restartTimer = setTimeout(() => {
//       this.restartTimer = null;
//       if (action) {
//         action();
//         return;
//       }
//       if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted || this.recognitionActive) {
//         return;
//       }
//       this.startListening();
//       if (this.enableLogs) {
//         console.log('🎤 [VoiceService] Reconocimiento reiniciado');
//       }
//     }, delay);
//   }

//   private restart(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] restart() llamado:', {
//         isStarting: this.isStarting,
//         isListening: this.isListening,
//         timestamp: new Date().toISOString()
//       });
//     }

//     if (this.isStarting) return;

//     if (this.recognition && this.isListening) {
//       try {
//         this.recognitionActive = false;
//         this.recognition.stop();

//         this.autoRestartSubject.next(true);

//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             if (this.enableLogs) {
//               console.log('🔍 [VoiceService] → restart() llamando a startListening()');
//             }
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             if (this.enableLogs) {
//               console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart');
//             }
//           }, 1000);
//         }, 100);
//       } catch (e) {
//         this.logger.warn('Error al reiniciar reconocimiento:', e);
//         this.autoRestartSubject.next(true);
//         setTimeout(() => {
//           if (this.isListening && !this.isStarting) {
//             if (this.enableLogs) {
//               console.log('🔍 [VoiceService] → restart() (catch) llamando a startListening()');
//             }
//             this.startListening();
//           }
//           setTimeout(() => {
//             this.autoRestartSubject.next(false);
//             if (this.enableLogs) {
//               console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart (catch)');
//             }
//           }, 1000);
//         }, 300);
//       }
//     }
//   }

//   // ============================================================
//   // DETECCIÓN DE AURICULARES
//   // ============================================================
//   public async isHeadphonesConnected(force: boolean = false): Promise<boolean> {
//     const now = Date.now();

//     if (!force && (now - this.headphonesCache.timestamp) < this.headphonesCache.ttlMs) {
//       if (this.enableLogs) {
//         console.log(`🔍 [VoiceService] isHeadphonesConnected → cache HIT (${now - this.headphonesCache.timestamp}ms)`);
//       }
//       return this.headphonesCache.result;
//     }

//     if (this.headphonesDetectionInFlight) {
//       if (this.enableLogs) {
//         console.log('🔍 [VoiceService] isHeadphonesConnected → uniéndose a detección en curso');
//       }
//       return this.headphonesDetectionInFlight;
//     }

//     this.headphonesDetectionInFlight = this.detectHeadphonesInternal();

//     try {
//       const result = await this.headphonesDetectionInFlight;
//       this.headphonesCache.result = result;
//       this.headphonesCache.timestamp = Date.now();
//       return result;
//     } finally {
//       this.headphonesDetectionInFlight = null;
//     }
//   }

//   private async detectHeadphonesInternal(): Promise<boolean> {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] Iniciando detección REAL de auriculares (cache miss)...');
//     }

//     try {
//       if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
//         try {
//           const devices = await navigator.mediaDevices.enumerateDevices();
//           const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

//           // ✅ Log compacto en una sola línea (solo si enableLogs)
//           if (this.enableLogs) {
//             console.log(`🔍 [VoiceService] Audio outputs (${audioOutputs.length}):`,
//               audioOutputs.map(d => d.label || 'SIN ETIQUETA'));
//           }

//           const keywords = [
//             'headphone', 'earphone', 'headset', 'auricular',
//             'bluetooth', 'wireless', 'stereo', 'hands-free',
//             'logitech', 'sony', 'jbl', 'apple', 'samsung'
//           ];

//           const hasHeadphones = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             const found = keywords.some(keyword => labelLower.includes(keyword));
//             if (found && this.enableLogs) {
//               console.log(`🔍 [VoiceService] Palabra clave encontrada: "${d.label}"`);
//             }
//             return found;
//           });

//           if (hasHeadphones) {
//             if (this.enableLogs) {
//               console.log('🎧 [VoiceService] Auriculares detectados POR ETIQUETA');
//             }
//             return true;
//           }

//           const speakerKeywords = ['speaker', 'altavoz', 'altoparlante'];
//           const isSpeakerOnly = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return speakerKeywords.some(keyword => labelLower.includes(keyword));
//           });

//           if (isSpeakerOnly && audioOutputs.length > 0) {
//             if (this.enableLogs) {
//               console.log('🔇 [VoiceService] Solo hay altavoces, NO auriculares');
//             }
//             return false;
//           }

//           const hasHeadphoneInName = audioOutputs.some(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('headphone') || labelLower.includes('auricular');
//           });

//           if (hasHeadphoneInName) {
//             if (this.enableLogs) {
//               console.log('🎧 [VoiceService] Auriculares detectados por nombre');
//             }
//             return true;
//           }

//           const allSpeakers = audioOutputs.every(d => {
//             if (!d.label) return false;
//             const labelLower = d.label.toLowerCase();
//             return labelLower.includes('speaker') || labelLower.includes('altavoz');
//           });

//           if (allSpeakers && audioOutputs.length > 1) {
//             if (this.enableLogs) {
//               console.log('🔇 [VoiceService] Múltiples altavoces, NO auriculares');
//             }
//             return false;
//           }

//           if (this.enableLogs) {
//             console.log('🔍 [VoiceService] Usando getUserMedia como respaldo...');
//           }
//           return await this.detectWithGetUserMedia();

//         } catch (error) {
//           console.warn('⚠️ [VoiceService] Error en enumerateDevices:', error);
//         }
//       }

//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] No se detectaron auriculares');
//       }
//       return false;

//     } catch (error) {
//       console.error('❌ [VoiceService] Error detectando auriculares:', error);
//       return false;
//     }
//   }

//   private async detectWithGetUserMedia(): Promise<boolean> {
//     if (this.enableLogs) {
//       console.log('🎤 [VoiceService] Intentando getUserMedia...');
//     }

//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       if (this.enableLogs) {
//         console.log('❌ [VoiceService] getUserMedia NO disponible');
//       }
//       return false;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const audioTrack = stream.getAudioTracks()[0];

//       if (audioTrack) {
//         const settings = audioTrack.getSettings();
//         if (this.enableLogs) {
//           console.log('🔍 [VoiceService] Settings de audio:', settings);
//         }

//         if (settings.deviceId) {
//           if (this.enableLogs) {
//             console.log('🎧 [VoiceService] Dispositivo de audio detectado por getUserMedia');
//           }
//           stream.getTracks().forEach(track => track.stop());

//           if (settings.deviceId.length > 10) {
//             if (this.enableLogs) {
//               console.log('🎧 [VoiceService] Dispositivo externo detectado');
//             }
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

//     if (this.enableLogs) {
//       console.log('🔇 [VoiceService] No se detectaron auriculares');
//     }
//     return false;
//   }

//   // ============================================================
//   // CHECK HEADPHONES ON START
//   // ============================================================

//   private async checkHeadphonesOnStart(): Promise<void> {
//     const hasHeadphones = await this.isHeadphonesConnected(true);

//     const prefs = this.userPreferences.getCurrentPreferences();
//     const userPrefersMic = prefs.micEnabled !== undefined ? prefs.micEnabled : true;

//     if (!hasHeadphones || !userPrefersMic) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] Sin auriculares o usuario desactivó el micrófono');
//       }
//       this.isMuted = true;
//       this.mutedSubject.next(true);
//     } else {
//       if (this.enableLogs) {
//         console.log('🎧 [VoiceService] Auriculares conectados, pero micrófono permanece MUTEADO');
//       }
//     }

//     this.applyHeadphonesChange(hasHeadphones);
//   }

//   // ============================================================
//   // CONTROL DEL MICRÓFONO
//   // ============================================================
//   async startListening(opts: { source?: string } = {}): Promise<void> {
//     const now = Date.now();

//     if (now - this.lastStartAttempt < 500) {
//       if (this.enableLogs) {
//         console.log(
//           `⏭️ [VoiceService] startListening ignorado (rate-limit) — source: ${opts.source ?? 'unknown'}`
//         );
//       }
//       return;
//     }
//     this.lastStartAttempt = now;

//     if (this.restartTimer) {
//       clearTimeout(this.restartTimer);
//       this.restartTimer = null;
//     }

//     this.pendingPostTTSRestart = false;

//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] startListening() llamado:', {
//         source: opts.source ?? 'unknown',
//         isStarting: this.isStarting,
//         recognitionActive: this.recognitionActive,
//         isMuted: this.isMuted,
//         timestamp: new Date().toISOString()
//       });
//     }

//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] No hay auriculares conectados');
//       }

//       if (!this.noHeadphonesMessageShown) {
//         this.noHeadphonesMessageShown = true;
//         this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

//         if (this.noHeadphonesMessageTimeout) {
//           clearTimeout(this.noHeadphonesMessageTimeout);
//         }
//         this.noHeadphonesMessageTimeout = setTimeout(() => {
//           this.noHeadphonesMessageShown = false;
//           if (this.enableLogs) {
//             console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
//           }
//         }, 5000);
//       } else {
//         if (this.enableLogs) {
//           console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
//         }
//       }

//       return;
//     }

//     if (this.isStarting) {
//       if (this.enableLogs) this.logger.log('🎤 Inicio en curso, omitiendo');
//       return;
//     }

//     if (this.recognitionActive) {
//       if (this.enableLogs) this.logger.log('🎤 Reconocimiento ya activo');
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

//   //
//   private monitorHeadphones(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] monitorHeadphones() iniciado');
//     }

//     if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
//       console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
//       return;
//     }

//     // ✅ 1. Detección inicial (una sola vez)
//     this.checkHeadphonesOnStart();

//     // ✅ 2. Polling cada 10s SIN forzar (usa cache)
//     //       El devicechange invalida el cache cuando cambia algo real
//     this.headphonesCheckInterval = setInterval(async () => {
//       const hasHeadphones = await this.isHeadphonesConnected(false);   // ← false
//       this.applyHeadphonesChange(hasHeadphones);
//     }, 10000);   // ← antes 5000

//     // ✅ 3. Listener devicechange CON DEBOUNCE (fuerza detección real)
//     if (typeof navigator.mediaDevices.addEventListener === 'function') {
//       this.deviceChangeListener = () => {
//         if (this.deviceChangeDebounce) {
//           clearTimeout(this.deviceChangeDebounce);
//         }

//         this.deviceChangeDebounce = setTimeout(async () => {
//           this.deviceChangeDebounce = null;
//           if (this.enableLogs) {
//             console.log('🎧 [VoiceService] devicechange procesado tras debounce');
//           }
//           const hasHeadphones = await this.isHeadphonesConnected(true);   // ← fuerza
//           this.applyHeadphonesChange(hasHeadphones);
//         }, 1000);
//       };

//       navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
//       if (this.enableLogs) {
//         console.log('🎧 [VoiceService] Listener devicechange registrado (con debounce 1s)');
//       }
//     }
//   }

//   /**
//    * ✅ ÚNICO punto donde se emite el cambio de estado de auriculares.
//    */
//   private applyHeadphonesChange(hasHeadphones: boolean): void {
//     const previous = this.headphonesConnectedSubject.value;

//     if (previous === hasHeadphones) {
//       return;
//     }

//     if (this.enableLogs) {
//       console.log(`🎧 [VoiceService] Cambio de estado: ${previous} → ${hasHeadphones}`);
//     }
//     this.headphonesConnectedSubject.next(hasHeadphones);

//     if (hasHeadphones) {
//       setTimeout(() => {
//         if (this.isSpeaking) {
//           if (this.enableLogs) {
//             console.log('⏭️ [VoiceService] TTS ya en curso, omitiendo aviso de conexión');
//           }
//           return;
//         }

//         const msg = this.isMuted
//           ? this.voiceContext.getMessage('headphonesConnectedMicOff')
//           : this.voiceContext.getMessage('headphonesConnectedMicOn');

//         if (this.enableLogs) {
//           console.log('🔊 [VoiceService] Emitiendo aviso de auriculares conectados:', msg);
//         }
//         this.speakAlways(msg);
//       }, 800);

//       const delay = 3500;
//       if (this.enableLogs) {
//         console.log(`🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento en ${delay}ms`);
//       }

//       setTimeout(() => {
//         if (this.isStarting) return;
//         if (!this.areHeadphonesConnected()) return;
//         if (this.enableLogs) {
//           console.log('🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento');
//         }
//         this.startListening();
//       }, delay);

//     } else {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] Auriculares desconectados → silencio intencional');
//       }

//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       this.isSpeaking = false;
//       this.lastTTSEndTime = Date.now();

//       this.stopListening();

//       if (!this.isMuted) {
//         this.mute();
//       }
//     }
//   }

//   //
//   public restartRecognition(): void {
//     if (this.enableLogs) {
//       console.log('🔄 [VoiceService] Reiniciando reconocimiento...');
//     }
//     this.stopListening();
//     setTimeout(() => {
//       this.startListening();
//     }, 300);
//   }

//   public onNavigate(): void {
//     this.ignoreNavCommandsUntil = Date.now() + this.NAV_BLOCK_MS;
//     this.lockNavigation(this.NAV_BLOCK_MS);
//     if (this.enableLogs) {
//       console.log(`🔇 [VoiceService] Comandos de navegación bloqueados durante ${this.NAV_BLOCK_MS}ms`);
//     }
//   }

//   private isNavigationCommand(text: string): boolean {
//     const lower = text.toLowerCase().trim();
//     return this.NAV_COMMANDS.some(cmd => lower === cmd || lower.includes(cmd));
//   }

//   stopListening(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] stopListening() llamado:', {
//         isStarting: this.isStarting,
//         recognitionActive: this.recognitionActive,
//         timestamp: new Date().toISOString()
//       });
//     }

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
//     if (this.enableLogs) {
//       console.log('🧹 [VoiceService] Limpiando transcript');
//     }
//     this.currentTranscript = '';
//     this.transcriptSubject.next('');
//     if (this.enableLogs) {
//       console.log('🧹 [VoiceService] Transcript limpiado (reconocimiento activo)');
//     }
//   }

//   abortRecognition(): void {
//     if (this.enableLogs) {
//       console.log('🛑 [VoiceService] Abortando reconocimiento');
//     }
//     if (this.recognition) {
//       try {
//         this.recognition.abort();
//       } catch (e) {
//         // Ignorar errores
//       }
//     }
//   }

//   // ============================================================
//   // MUTE / UNMUTE
//   // ============================================================

//   mute(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] mute() llamado');
//     }

//     this.isMuted = true;
//     this.mutedSubject.next(true);

//     this.userPreferences.updatePreference('micEnabled', false).subscribe();

//     if (this.areHeadphonesConnected()) {
//       this.speakAlways(this.voiceContext.getMessage('micDeactivated'));
//     }
//   }

//   async unmute(): Promise<void> {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] unmute() llamado');
//     }

//     const hasHeadphones = await this.isHeadphonesConnected();
//     if (!hasHeadphones) {
//       this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }

//     if (!this.isMuted) {
//       if (this.enableLogs) {
//         console.log('🎤 Micrófono ya activo');
//       }
//       return;
//     }

//     this.isMuted = false;
//     this.mutedSubject.next(false);

//     this.userPreferences.updatePreference('micEnabled', true).subscribe();

//     const contextMessage = this.voiceContext.getActivationMessage();
//     this.speakAlways(contextMessage);

//     if (!this.recognitionActive || !this.isListening) {
//       this.startListening();
//     }
//   }

//   toggleMute(): void {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] toggleMute() llamado:', {
//         isMuted: this.isMuted,
//         timestamp: new Date().toISOString()
//       });
//     }
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

//     if (!this.isMuted) {
//       this.speakAlways(this.voiceContext.getActivationMessage());
//     }
//   }

//   getWelcomeMessageForCurrentPage(): string {
//     return this.voiceContext.getActivationMessage();
//   }

//   getAvailableCommands(): string[] {
//     return this.voiceContext.getAvailableCommands();
//   }

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
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] speak() llamado:', {
//         text: text.substring(0, 50) + '...',
//         isMuted: this.isMuted,
//         timestamp: new Date().toISOString()
//       });
//     }

//     return new Promise((resolve) => {
//       if (this.isMuted) {
//         if (this.enableLogs) {
//           this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
//         }
//         resolve();
//         return;
//       }

//       if (!this.areHeadphonesConnected()) {
//         if (this.enableLogs) {
//           console.log('🔇 [VoiceService] → speak() CANCELADO: No hay auriculares');
//         }
//         resolve();
//         return;
//       }

//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         resolve();
//         return;
//       }

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
//         if (myToken === this.speakToken) {
//           this.isSpeaking = false;
//           this.lastTTSEndTime = Date.now();

//           if (this.pendingPostTTSRestart) {
//             if (this.enableLogs) {
//               console.log('🧹 [VoiceService] speak() limpiando pendingPostTTSRestart huérfano');
//             }
//             this.pendingPostTTSRestart = false;
//           }

//           setTimeout(() => {
//             if (
//               !this.isSpeaking &&
//               !this.isMuted &&
//               !this.recognitionActive &&
//               !this.pendingPostTTSRestart &&
//               this.areHeadphonesConnected()
//             ) {
//               if (this.enableLogs) {
//                 console.log('🔄 [VoiceService] speak() → reconexión automática del micro');
//               }
//               this.startListening();
//             }
//           }, 800);
//         }
//         resolve();
//       };

//       utterance.onend = () => {
//         if (this.enableLogs) {
//           console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
//         }
//         finalize();
//       };

//       utterance.onerror = (event: any) => {
//         if (event?.error === 'interrupted') {
//           if (this.enableLogs) {
//             console.log('🔍 [VoiceService] → speak() interrumpido');
//           }
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

//   public speakAlways(text: string, pauseRecognition: boolean = false): Promise<void> {
//     if (this.enableLogs) {
//       console.log('🔍 [VoiceService] speakAlways() llamado:', {
//         text: text.substring(0, 50) + '...',
//         isMuted: this.isMuted,
//         hasHeadphones: this.areHeadphonesConnected(),
//         pauseRecognition,
//         timestamp: new Date().toISOString()
//       });
//     }

//     if (!this.areHeadphonesConnected()) {
//       if (this.enableLogs) {
//         console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');
//       }

//       if (window.speechSynthesis) {
//         window.speechSynthesis.cancel();
//       }
//       this.isSpeaking = false;
//       this.lastTTSEndTime = Date.now();

//       return Promise.resolve();
//     }

//     return new Promise((resolve) => {
//       if (!window.speechSynthesis) {
//         this.logger.warn('Speech Synthesis no soportada');
//         resolve();
//         return;
//       }

//       const myToken = ++this.speakToken;
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

//           if (pauseRecognition) {
//             this.pendingPostTTSRestart = true;
//             if (this.enableLogs) {
//               console.log('⏸️ [VoiceService] pendingPostTTSRestart activado (el componente reiniciará)');
//             }

//             setTimeout(() => {
//               if (!this.pendingPostTTSRestart) return;
//               if (this.recognitionActive) return;
//               if (this.enableLogs) {
//                 console.log('⏰ [VoiceService] Timeout esperando componente → reinicio desde el servicio');
//               }
//               this.pendingPostTTSRestart = false;
//               this.startListening({ source: 'speakAlways.timeout' });
//             }, 3000);
//           }

//         }
//         resolve();
//       };

//       utterance.onend = () => {
//         if (this.enableLogs) {
//           console.log('🔍 [VoiceService] → speakAlways() onend');
//         }
//         finalize();
//       };

//       utterance.onerror = (event: any) => {
//         if (event?.error === 'interrupted') {
//           if (this.enableLogs) {
//             console.log('🔍 [VoiceService] → speakAlways() interrumpido');
//           }
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
//     if (this.enableLogs) this.logger.log('🧹 Destruyendo VoiceService...');

//     if (this.restartTimer) {
//       clearTimeout(this.restartTimer);
//       this.restartTimer = null;
//     }

//     if (this.deviceChangeDebounce) { clearTimeout(this.deviceChangeDebounce); this.deviceChangeDebounce = null; }
//     if (this.deviceChangeListener && typeof navigator.mediaDevices?.removeEventListener === 'function') {
//       navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener);
//       this.deviceChangeListener = null;
//     }
//     if (this.headphonesCheckInterval) { clearInterval(this.headphonesCheckInterval); this.headphonesCheckInterval = null; }
//     if (this.reconnectTimeout) { clearTimeout(this.reconnectTimeout); this.reconnectTimeout = null; }
//     if (this.noHeadphonesMessageTimeout) { clearTimeout(this.noHeadphonesMessageTimeout); this.noHeadphonesMessageTimeout = null; }

//     this.stopListening();

//     if (window.speechSynthesis) window.speechSynthesis.cancel();

//     this.transcriptSubject.complete();
//     this.transcriptWithFinalSubject.complete();
//     this.responseSubject.complete();
//     this.mutedSubject.complete();
//     this.wakeWordSubject.complete();
//     this.errorSubject.complete();
//     this.listeningSubject.complete();
//     this.readySubject.complete();
//     this.headphonesConnectedSubject.complete();

//     this.filterService.reset();

//     if (this.recognition) {
//       this.recognition.onresult = null as any;
//       this.recognition.onerror = null as any;
//       this.recognition.onend = null as any;
//       this.recognition.onstart = null as any;
//       this.recognition = null as any;
//     }

//     if (this.enableLogs) this.logger.log('✅ VoiceService destruido correctamente');
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
  // private readonly NAV_COMMANDS = ['volver', 'atrás', 'atras', 'regresar', 'retroceder', 'cancelar'];
  private readonly NAV_COMMANDS = ['volver', 'atrás', 'atras', 'regresar', 'retroceder', 'cancelar', 'registrar', 'registro'];

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
  // ✅ CAMBIO 1: debounce del wake word reducido de 2000 a 500 ms
  private readonly WAKE_DEBOUNCE_TIME = 500;

  private suppressStopWords = false;

  private headphonesMessageShown = false;
  private headphonesCheckInterval: any = null;

  private noHeadphonesMessageShown = false;
  private noHeadphonesMessageTimeout: any = null;

  private headphonesConnectedSubject = new BehaviorSubject<boolean>(false);
  public headphonesConnected$ = this.headphonesConnectedSubject.asObservable();

  private headphonesDetectionInFlight: Promise<boolean> | null = null;

  private headphonesCache = {
    result: false,
    timestamp: 0,
    ttlMs: 15000
  };

  private deviceChangeListener: any = null;
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
  // private readonly GLOBAL_COMMAND_DEBOUNCE = 1500;
  private readonly GLOBAL_COMMAND_DEBOUNCE = 500;
  private restartCount = 0;

  constructor() {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] CONSTRUCTOR INICIADO');
    }

    this.initRecognition();
    this.loadVoices();

    this.isMuted = true;
    this.mutedSubject.next(true);
    this.listeningSubject.next(false);
    this.readySubject.next(false);

    if (this.enableLogs) {
      this.logger.log(`🎤 ${this.voiceContext.getMessage('welcome')}`);
      console.log('🔍 [VoiceService] Llamando a monitorHeadphones()...');
    }

    this.monitorHeadphones();

    setTimeout(() => {
      this.startListening();
      if (this.enableLogs) {
        console.log('🎤 Reconocimiento de voz activo (escuchando "hola")');
      }
    }, 1000);
  }

  public setSuppressStopWords(value: boolean): void {
    this.suppressStopWords = value;
    if (this.enableLogs) {
      console.log(`🔇 [VoiceService] suppressStopWords: ${value}`);
    }
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
    if (this.enableLogs) {
      console.log('🔧 [VoiceService] Forzando detección de auriculares...');
    }

    const hasHeadphones = await this.isHeadphonesConnected(true);

    if (!hasHeadphones) {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] No se detectaron auriculares reales');
      }
      this.applyHeadphonesChange(false);
      return false;
    }

    if (this.enableLogs) {
      console.log('🎧 [VoiceService] Auriculares reales detectados');
    }
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
        if (this.enableLogs) {
          console.log('🎤 Micrófono realmente activo (onstart)');
        }
      });
    };

    if (this.enableLogs) {
      this.logger.log('✅ Speech Recognition inicializado');
    }
  }

  public restartVoiceService(): void {
    if (this.enableLogs) {
      console.log('🔄 [VoiceService] Reiniciando servicio...');
    }

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
      if (this.enableLogs) {
        console.log('✅ [VoiceService] Servicio reiniciado correctamente');
      }
    }, 500);
  }

  // ============================================================
  // MANEJO DE EVENTOS
  // ============================================================
  private handleResult(event: SpeechRecognitionEvent): void {
    if (!event.results || event.results.length === 0) return;

    const result = event.results[event.results.length - 1];
    if (!result || !result[0]) return;

    const transcript = result[0].transcript.toLowerCase().trim();
    if (!transcript) return;

    if (this.enableLogs) {
      console.log('🎤 Reconocido:', transcript, 'Final:', result.isFinal);
    }

    // ========================================================
    // 1. Comandos de control del TTS (funcionan SIEMPRE, incluso parciales)
    //    Sirven para interrumpir al sistema mientras habla.
    //    ✅ CAMBIO 2: quitado 'silenciar' de aquí para que llegue al bloque 3 y mute el micro.
    // ========================================================
    // const isStopCommand =
    //   transcript.includes('para') ||
    //   transcript.includes('silencio') ||
    //   transcript.includes('stop') ||
    //   transcript.includes('calla');

    // if (isStopCommand) {
    //   if (window.speechSynthesis.speaking) {
    //     window.speechSynthesis.cancel();
    //     if (this.enableLogs) {
    //       console.log('🛑 [VoiceService] TTS interrumpido por comando de control');
    //     }
    //   }
    //   return;
    // }

    const isStopCommand =
        transcript.includes('para') ||
        transcript.includes('silencio') ||
        transcript.includes('stop') ||
        transcript.includes('calla');

      if (isStopCommand) {
        if (this.suppressStopWords) {
          // ✅ Dejar pasar el "para" al componente, que decidirá qué hacer
          if (this.enableLogs) {
            console.log('⏭️ [VoiceService] Stop-word ignorada (suppressStopWords=true):', transcript);
          }
          // No retornamos: sigue al bloque de emisión
        } else {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (this.enableLogs) {
              console.log('🛑 [VoiceService] TTS interrumpido por comando de control');
            }
          }
          return;
        }
      }

    // ========================================================
    // 2. Wake word ("hola" / "asistente")
    //    ✅ CAMBIO 3: añadido "asistente" como wake word (coherente con el bloque 4)
    // ========================================================
    if (
      transcript === 'hola' ||
      transcript === 'hola hola' ||
      transcript.startsWith('hola ') ||
      transcript === 'asistente' ||
      transcript.startsWith('asistente ')
    ) {
      this.handleWakeWord(transcript, result.isFinal);
      return;
    }

    // ========================================================
    // 3. Comando de silenciar micrófono
    // ========================================================
    if (transcript === 'silenciar' ||
        transcript === 'mute' ||
        transcript.includes('silenciar micrófono') ||
        transcript.includes('apagar micrófono')) {
      this.handleMute();
      return;
    }

    // ========================================================
    // 4. Si el micro está muteado, ignoramos todo salvo ayuda/hola/asistente
    // ========================================================
    if (this.isMuted) {
      const allowed = ['ayuda', 'help', 'hola', 'asistente'];
      if (!allowed.includes(transcript)) {
        if (this.enableLogs) {
          console.log('🔇 [VoiceService] Muteado, ignorando:', transcript);
        }
        return;
      }
    }

    // ========================================================
    // 5. Bloqueo de comandos de navegación tras navegar
    // ========================================================
    if (this.isNavigationCommand(transcript) && Date.now() < this.ignoreNavCommandsUntil) {
      if (this.enableLogs) {
        console.log(`⏭️ [VoiceService] Comando de navegación ignorado tras navegación: "${transcript}"`);
      }
      return;
    }

    // ========================================================
    // 6. Debounce global (excepto comandos repetibles)
    // ========================================================
    const now = Date.now();
    const isRepeatable =
      transcript.includes('ayuda') ||
      transcript.includes('hola') ||
      transcript.includes('para') ||
      transcript.includes('silencio') ||
      transcript.includes('calla');

    if (!isRepeatable &&
        transcript === this.lastProcessedTranscript &&
        (now - this.lastProcessedTime) < this.GLOBAL_COMMAND_DEBOUNCE) {
      if (this.enableLogs) {
        console.log(`⏭️ [VoiceService] Comando duplicado ignorado globalmente: "${transcript}"`);
      }
      return;
    }
    this.lastProcessedTranscript = transcript;
    this.lastProcessedTime = now;

    // ========================================================
    // 7. Emitir comando hacia arriba (a los componentes)
    // ========================================================
    if (this.enableLogs) {
      console.log('📤 [VoiceService] Emitiendo comando:', transcript, '(final:', result.isFinal + ')');
    }

    this.transcriptSubject.next(transcript);
    this.transcriptWithFinalSubject.next({ text: transcript, isFinal: result.isFinal });
  }





  private handleWakeWord(transcript: string, isFinal: boolean): void {
    if (!this.isMuted) {
      if (this.enableLogs) {
        console.log('🎤 [VoiceService] Micrófono ya activo');
      }
      return;
    }

    const ahora = Date.now();
    if (ahora - this.lastWakeWordTime <= this.WAKE_DEBOUNCE_TIME) {
      if (this.enableLogs) {
        console.log('⏳ [VoiceService] Debounce: espera un momento');
      }
      return;
    }

    this.lastWakeWordTime = ahora;

    if (this.enableLogs) {
      console.log('🔊 [VoiceService] Wake word detectada, activando micrófono');
    }

    // ✅ Lanzamos unmute sin await para no bloquear el hilo del reconocimiento
    void this.unmute();

    // ✅ Notificamos a los suscriptores (por si quieren reaccionar)
    this.wakeWordSubject.next(transcript);
  }

  private handleMute(): void {
    if (!this.isMuted) {
      this.mute();
    } else {
      if (this.enableLogs) {
        console.log('ℹ️ [VoiceService] Micrófono ya está muteado');
      }
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

  private handleError(event: SpeechRecognitionErrorEvent): void {
    this.ngZone.run(() => {
      if (event.error === 'no-speech') return;

      if (this.enableLogs) {
        console.log('🔍 [VoiceService] handleError:', { error: event.error, timestamp: new Date().toISOString() });
      }
      this.logger.error('Error en reconocimiento:', event.error);
      this.errorSubject.next(event.error);

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

  private handleEnd(): void {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] handleEnd:', {
        isListening: this.isListening,
        isStarting: this.isStarting,
        recognitionActive: this.recognitionActive,
        isSpeaking: this.isSpeaking,
        msSinceTTSEnd: Date.now() - this.lastTTSEndTime,
        pendingPostTTSRestart: this.pendingPostTTSRestart,
        timestamp: new Date().toISOString()
      });
    }

    const abortedDuringStart = this.isStarting;

    this.isStarting = false;
    this.isListening = false;
    this.recognitionActive = false;

    if (abortedDuringStart) {
      if (this.enableLogs) {
        console.log('⏭️ [VoiceService] handleEnd durante arranque → backoff largo');
      }
      this.readySubject.next(false);
      this.listeningSubject.next(false);

      if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted) {
        return;
      }

      this.scheduleRestart(2500);
      return;
    }

    if (this.isSpeaking) {
      if (this.enableLogs) {
        console.log('⏸️ [VoiceService] handleEnd → TTS activo, estado visual intacto');
        this.logger.log('🔴 Reconocimiento pausado por TTS');
      }

      if (this.pendingPostTTSRestart || this.isMuted) return;

      this.scheduleRestart(1500, () => {
        if (this.isSpeaking || this.pendingPostTTSRestart || this.isMuted || this.recognitionActive) return;
        if (this.enableLogs) {
          console.log('🔄 [VoiceService] handleEnd diferido → reiniciando tras TTS');
        }
        this.startListening();
      });
      return;
    }

    this.readySubject.next(false);
    this.listeningSubject.next(false);

    if (this.enableLogs) this.logger.log('🔴 Reconocimiento finalizado');

    if (this.pendingPostTTSRestart) {
      if (this.enableLogs) {
        console.log('⏸️ [VoiceService] handleEnd → pendiente reinicio del componente, NO reinicia');
      }
      return;
    }

    if (this.isNavigationLocked()) {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] handleEnd → navegación reciente, reinicio diferido');
      }
      this.scheduleRestart(3100, () => {
        if (this.isSpeaking || this.pendingPostTTSRestart) return;
        if (!this.isNavigationLocked() && !this.recognitionActive) {
          this.startListening();
          if (this.enableLogs) {
            console.log('🎤 [VoiceService] Reconocimiento reiniciado tras bloqueo');
          }
        }
      });
      return;
    }

    if (this.isMuted) {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] handleEnd → micrófono muteado, NO se reinicia');
      }
      return;
    }

    if (this.enableLogs) {
      console.log('🔄 [VoiceService] Reiniciando reconocimiento automáticamente...');
    }
    this.scheduleRestart(1000);
  }

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
      if (this.enableLogs) {
        console.log('🎤 [VoiceService] Reconocimiento reiniciado');
      }
    }, delay);
  }

  private restart(): void {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] restart() llamado:', {
        isStarting: this.isStarting,
        isListening: this.isListening,
        timestamp: new Date().toISOString()
      });
    }

    if (this.isStarting) return;

    if (this.recognition && this.isListening) {
      try {
        this.recognitionActive = false;
        this.recognition.stop();

        this.autoRestartSubject.next(true);

        setTimeout(() => {
          if (this.isListening && !this.isStarting) {
            if (this.enableLogs) {
              console.log('🔍 [VoiceService] → restart() llamando a startListening()');
            }
            this.startListening();
          }
          setTimeout(() => {
            this.autoRestartSubject.next(false);
            if (this.enableLogs) {
              console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart');
            }
          }, 1000);
        }, 100);
      } catch (e) {
        this.logger.warn('Error al reiniciar reconocimiento:', e);
        this.autoRestartSubject.next(true);
        setTimeout(() => {
          if (this.isListening && !this.isStarting) {
            if (this.enableLogs) {
              console.log('🔍 [VoiceService] → restart() (catch) llamando a startListening()');
            }
            this.startListening();
          }
          setTimeout(() => {
            this.autoRestartSubject.next(false);
            if (this.enableLogs) {
              console.log('🔍 [VoiceService] → autoRestartSubject resetado a false desde restart (catch)');
            }
          }, 1000);
        }, 300);
      }
    }
  }

  // ============================================================
  // DETECCIÓN DE AURICULARES
  // ============================================================
  public async isHeadphonesConnected(force: boolean = false): Promise<boolean> {
    const now = Date.now();

    if (!force && (now - this.headphonesCache.timestamp) < this.headphonesCache.ttlMs) {
      if (this.enableLogs) {
        console.log(`🔍 [VoiceService] isHeadphonesConnected → cache HIT (${now - this.headphonesCache.timestamp}ms)`);
      }
      return this.headphonesCache.result;
    }

    if (this.headphonesDetectionInFlight) {
      if (this.enableLogs) {
        console.log('🔍 [VoiceService] isHeadphonesConnected → uniéndose a detección en curso');
      }
      return this.headphonesDetectionInFlight;
    }

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

  private async detectHeadphonesInternal(): Promise<boolean> {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] Iniciando detección REAL de auriculares (cache miss)...');
    }

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

          if (this.enableLogs) {
            console.log(`🔍 [VoiceService] Audio outputs (${audioOutputs.length}):`,
              audioOutputs.map(d => d.label || 'SIN ETIQUETA'));
          }

          const keywords = [
            'headphone', 'earphone', 'headset', 'auricular',
            'bluetooth', 'wireless', 'stereo', 'hands-free',
            'logitech', 'sony', 'jbl', 'apple', 'samsung'
          ];

          const hasHeadphones = audioOutputs.some(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            const found = keywords.some(keyword => labelLower.includes(keyword));
            if (found && this.enableLogs) {
              console.log(`🔍 [VoiceService] Palabra clave encontrada: "${d.label}"`);
            }
            return found;
          });

          if (hasHeadphones) {
            if (this.enableLogs) {
              console.log('🎧 [VoiceService] Auriculares detectados POR ETIQUETA');
            }
            return true;
          }

          const speakerKeywords = ['speaker', 'altavoz', 'altoparlante'];
          const isSpeakerOnly = audioOutputs.every(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return speakerKeywords.some(keyword => labelLower.includes(keyword));
          });

          if (isSpeakerOnly && audioOutputs.length > 0) {
            if (this.enableLogs) {
              console.log('🔇 [VoiceService] Solo hay altavoces, NO auriculares');
            }
            return false;
          }

          const hasHeadphoneInName = audioOutputs.some(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return labelLower.includes('headphone') || labelLower.includes('auricular');
          });

          if (hasHeadphoneInName) {
            if (this.enableLogs) {
              console.log('🎧 [VoiceService] Auriculares detectados por nombre');
            }
            return true;
          }

          const allSpeakers = audioOutputs.every(d => {
            if (!d.label) return false;
            const labelLower = d.label.toLowerCase();
            return labelLower.includes('speaker') || labelLower.includes('altavoz');
          });

          if (allSpeakers && audioOutputs.length > 1) {
            if (this.enableLogs) {
              console.log('🔇 [VoiceService] Múltiples altavoces, NO auriculares');
            }
            return false;
          }

          if (this.enableLogs) {
            console.log('🔍 [VoiceService] Usando getUserMedia como respaldo...');
          }
          return await this.detectWithGetUserMedia();

        } catch (error) {
          console.warn('⚠️ [VoiceService] Error en enumerateDevices:', error);
        }
      }

      if (this.enableLogs) {
        console.log('🔇 [VoiceService] No se detectaron auriculares');
      }
      return false;

    } catch (error) {
      console.error('❌ [VoiceService] Error detectando auriculares:', error);
      return false;
    }
  }

  private async detectWithGetUserMedia(): Promise<boolean> {
    if (this.enableLogs) {
      console.log('🎤 [VoiceService] Intentando getUserMedia...');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (this.enableLogs) {
        console.log('❌ [VoiceService] getUserMedia NO disponible');
      }
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];

      if (audioTrack) {
        const settings = audioTrack.getSettings();
        if (this.enableLogs) {
          console.log('🔍 [VoiceService] Settings de audio:', settings);
        }

        if (settings.deviceId) {
          if (this.enableLogs) {
            console.log('🎧 [VoiceService] Dispositivo de audio detectado por getUserMedia');
          }
          stream.getTracks().forEach(track => track.stop());

          if (settings.deviceId.length > 10) {
            if (this.enableLogs) {
              console.log('🎧 [VoiceService] Dispositivo externo detectado');
            }
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

    if (this.enableLogs) {
      console.log('🔇 [VoiceService] No se detectaron auriculares');
    }
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
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] Sin auriculares o usuario desactivó el micrófono');
      }
      this.isMuted = true;
      this.mutedSubject.next(true);
    } else {
      if (this.enableLogs) {
        console.log('🎧 [VoiceService] Auriculares conectados, pero micrófono permanece MUTEADO');
      }
    }

    this.applyHeadphonesChange(hasHeadphones);
  }

  // ============================================================
  // CONTROL DEL MICRÓFONO
  // ============================================================
  async startListening(opts: { source?: string } = {}): Promise<void> {
    const now = Date.now();

    if (now - this.lastStartAttempt < 500) {
      if (this.enableLogs) {
        console.log(
          `⏭️ [VoiceService] startListening ignorado (rate-limit) — source: ${opts.source ?? 'unknown'}`
        );
      }
      return;
    }
    this.lastStartAttempt = now;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.pendingPostTTSRestart = false;

    if (this.enableLogs) {
      console.log('🔍 [VoiceService] startListening() llamado:', {
        source: opts.source ?? 'unknown',
        isStarting: this.isStarting,
        recognitionActive: this.recognitionActive,
        isMuted: this.isMuted,
        timestamp: new Date().toISOString()
      });
    }

    // ✅ CAMBIO 4: usamos el valor SÍNCRONO cacheado, sin await.
    // Si no hay auriculares, lanzamos detección en background y, si aparecen, reintentamos.
    if (!this.areHeadphonesConnected()) {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] No hay auriculares conectados (según cache síncrono)');
      }

      // Lanzar detección en background (no bloquea)
      this.isHeadphonesConnected().then(has => {
        if (has && !this.recognitionActive && !this.isMuted) {
          this.startListening({ source: 'post-headphones-check' });
        }
      });

      if (!this.noHeadphonesMessageShown) {
        this.noHeadphonesMessageShown = true;
        this.speakAlways(this.voiceContext.getMessage('noHeadphones'));

        if (this.noHeadphonesMessageTimeout) {
          clearTimeout(this.noHeadphonesMessageTimeout);
        }
        this.noHeadphonesMessageTimeout = setTimeout(() => {
          this.noHeadphonesMessageShown = false;
          if (this.enableLogs) {
            console.log('🔄 [VoiceService] Bandera de mensaje sin auriculares reseteda');
          }
        }, 5000);
      } else {
        if (this.enableLogs) {
          console.log('🔇 [VoiceService] Mensaje ya mostrado, omitiendo repetición');
        }
      }

      return;
    }

    if (this.isStarting) {
      if (this.enableLogs) this.logger.log('🎤 Inicio en curso, omitiendo');
      return;
    }

    if (this.recognitionActive) {
      if (this.enableLogs) this.logger.log('🎤 Reconocimiento ya activo');
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

      // ✅ CAMBIO 5: resetear el debounce del wake word para que el próximo "hola" siempre pase
      this.lastWakeWordTime = 0;

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

  //
  private monitorHeadphones(): void {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] monitorHeadphones() iniciado');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.log('⚠️ [VoiceService] No se puede monitorear auriculares en este navegador');
      return;
    }

    this.checkHeadphonesOnStart();

    this.headphonesCheckInterval = setInterval(async () => {
      const hasHeadphones = await this.isHeadphonesConnected(false);
      this.applyHeadphonesChange(hasHeadphones);
    }, 10000);

    if (typeof navigator.mediaDevices.addEventListener === 'function') {
      this.deviceChangeListener = () => {
        if (this.deviceChangeDebounce) {
          clearTimeout(this.deviceChangeDebounce);
        }

        this.deviceChangeDebounce = setTimeout(async () => {
          this.deviceChangeDebounce = null;
          if (this.enableLogs) {
            console.log('🎧 [VoiceService] devicechange procesado tras debounce');
          }
          const hasHeadphones = await this.isHeadphonesConnected(true);
          this.applyHeadphonesChange(hasHeadphones);
        }, 1000);
      };

      navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeListener);
      if (this.enableLogs) {
        console.log('🎧 [VoiceService] Listener devicechange registrado (con debounce 1s)');
      }
    }
  }

  private applyHeadphonesChange(hasHeadphones: boolean): void {
    const previous = this.headphonesConnectedSubject.value;

    if (previous === hasHeadphones) {
      return;
    }

    if (this.enableLogs) {
      console.log(`🎧 [VoiceService] Cambio de estado: ${previous} → ${hasHeadphones}`);
    }
    this.headphonesConnectedSubject.next(hasHeadphones);

    if (hasHeadphones) {
      setTimeout(() => {
        if (this.isSpeaking) {
          if (this.enableLogs) {
            console.log('⏭️ [VoiceService] TTS ya en curso, omitiendo aviso de conexión');
          }
          return;
        }

        const msg = this.isMuted
          ? this.voiceContext.getMessage('headphonesConnectedMicOff')
          : this.voiceContext.getMessage('headphonesConnectedMicOn');

        if (this.enableLogs) {
          console.log('🔊 [VoiceService] Emitiendo aviso de auriculares conectados:', msg);
        }
        this.speakAlways(msg);
      }, 800);

      // ✅ CAMBIO 6: reducir el delay de arranque del micro de 3500 a 500 ms
      const delay = 500;
      if (this.enableLogs) {
        console.log(`🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento en ${delay}ms`);
      }

      setTimeout(() => {
        if (this.isStarting) return;
        if (!this.areHeadphonesConnected()) return;
        if (this.enableLogs) {
          console.log('🎤 [VoiceService] Auriculares conectados → arrancando reconocimiento');
        }
        this.startListening();
      }, delay);

    } else {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] Auriculares desconectados → silencio intencional');
      }

      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.isSpeaking = false;
      this.lastTTSEndTime = Date.now();

      this.stopListening();

      if (!this.isMuted) {
        this.mute();
      }
    }
  }

  //
  public restartRecognition(): void {
    if (this.enableLogs) {
      console.log('🔄 [VoiceService] Reiniciando reconocimiento...');
    }
    this.stopListening();
    setTimeout(() => {
      this.startListening();
    }, 300);
  }

  public onNavigate(): void {
    this.ignoreNavCommandsUntil = Date.now() + this.NAV_BLOCK_MS;
    this.lockNavigation(this.NAV_BLOCK_MS);
    if (this.enableLogs) {
      console.log(`🔇 [VoiceService] Comandos de navegación bloqueados durante ${this.NAV_BLOCK_MS}ms`);
    }
  }

  private isNavigationCommand(text: string): boolean {
    const lower = text.toLowerCase().trim();
    return this.NAV_COMMANDS.some(cmd => lower === cmd || lower.includes(cmd));
  }

  stopListening(): void {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] stopListening() llamado:', {
        isStarting: this.isStarting,
        recognitionActive: this.recognitionActive,
        timestamp: new Date().toISOString()
      });
    }

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
    if (this.enableLogs) {
      console.log('🧹 [VoiceService] Limpiando transcript');
    }
    this.currentTranscript = '';
    this.transcriptSubject.next('');
    if (this.enableLogs) {
      console.log('🧹 [VoiceService] Transcript limpiado (reconocimiento activo)');
    }
  }

  abortRecognition(): void {
    if (this.enableLogs) {
      console.log('🛑 [VoiceService] Abortando reconocimiento');
    }
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
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] mute() llamado');
    }

    this.isMuted = true;
    this.mutedSubject.next(true);

    this.userPreferences.updatePreference('micEnabled', false).subscribe();

    if (this.areHeadphonesConnected()) {
      this.speakAlways(this.voiceContext.getMessage('micDeactivated'));
    }
  }

  // ✅ CAMBIO 7: unmute() síncrono (sin await) y arranca el micro ANTES del TTS
  async unmute(): Promise<void> {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] unmute() llamado');
    }

    // ✅ Síncrono: ya sabemos que hay auriculares porque el micro solo se activa con ellos
    if (!this.areHeadphonesConnected()) {
      this.speakAlways(this.voiceContext.getMessage('noHeadphones'));
      return;
    }

    if (!this.isMuted) {
      if (this.enableLogs) {
        console.log('🎤 Micrófono ya activo');
      }
      return;
    }

    this.isMuted = false;
    this.mutedSubject.next(false);

    this.userPreferences.updatePreference('micEnabled', true).subscribe();

    // ✅ Arranca el micro YA, antes del TTS de activación
    if (!this.recognitionActive || !this.isListening) {
      this.startListening();
    }

    // ✅ Luego habla (no bloquea el arranque del micro)
    const contextMessage = this.voiceContext.getActivationMessage();
    this.speakAlways(contextMessage);
  }

  toggleMute(): void {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] toggleMute() llamado:', {
        isMuted: this.isMuted,
        timestamp: new Date().toISOString()
      });
    }
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

  speak(text: string, lang: string = 'es-ES', rate: number = 0.9, pitch: number = 1.05): Promise<void> {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] speak() llamado:', {
        text: text.substring(0, 50) + '...',
        isMuted: this.isMuted,
        timestamp: new Date().toISOString()
      });
    }

    return new Promise((resolve) => {
      if (this.isMuted) {
        if (this.enableLogs) {
          this.logger.debug(`🔇 Muteado, mensaje ignorado: "${text}"`);
        }
        resolve();
        return;
      }

      if (!this.areHeadphonesConnected()) {
        if (this.enableLogs) {
          console.log('🔇 [VoiceService] → speak() CANCELADO: No hay auriculares');
        }
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

          if (this.pendingPostTTSRestart) {
            if (this.enableLogs) {
              console.log('🧹 [VoiceService] speak() limpiando pendingPostTTSRestart huérfano');
            }
            this.pendingPostTTSRestart = false;
          }

          setTimeout(() => {
            if (
              !this.isSpeaking &&
              !this.isMuted &&
              !this.recognitionActive &&
              !this.pendingPostTTSRestart &&
              this.areHeadphonesConnected()
            ) {
              if (this.enableLogs) {
                console.log('🔄 [VoiceService] speak() → reconexión automática del micro');
              }
              this.startListening();
            }
          }, 800);
        }
        resolve();
      };

      utterance.onend = () => {
        if (this.enableLogs) {
          console.log('🔍 [VoiceService] → speak() onend, micrófono permanece activo');
        }
        finalize();
      };

      utterance.onerror = (event: any) => {
        if (event?.error === 'interrupted') {
          if (this.enableLogs) {
            console.log('🔍 [VoiceService] → speak() interrumpido');
          }
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

  public speakAlways(text: string, pauseRecognition: boolean = false): Promise<void> {
    if (this.enableLogs) {
      console.log('🔍 [VoiceService] speakAlways() llamado:', {
        text: text.substring(0, 50) + '...',
        isMuted: this.isMuted,
        hasHeadphones: this.areHeadphonesConnected(),
        pauseRecognition,
        timestamp: new Date().toISOString()
      });
    }

    if (!this.areHeadphonesConnected()) {
      if (this.enableLogs) {
        console.log('🔇 [VoiceService] → speakAlways() CANCELADO: No hay auriculares');
      }

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
            if (this.enableLogs) {
              console.log('⏸️ [VoiceService] pendingPostTTSRestart activado (el componente reiniciará)');
            }

            // ✅ CAMBIO 8: timeout reducido de 3000 a 500 ms
            setTimeout(() => {
              if (!this.pendingPostTTSRestart) return;
              if (this.recognitionActive) return;
              if (this.enableLogs) {
                console.log('⏰ [VoiceService] Timeout esperando componente → reinicio desde el servicio');
              }
              this.pendingPostTTSRestart = false;
              this.startListening({ source: 'speakAlways.timeout' });
            }, 500);
          }

        }
        resolve();
      };

      utterance.onend = () => {
        if (this.enableLogs) {
          console.log('🔍 [VoiceService] → speakAlways() onend');
        }
        finalize();
      };

      utterance.onerror = (event: any) => {
        if (event?.error === 'interrupted') {
          if (this.enableLogs) {
            console.log('🔍 [VoiceService] → speakAlways() interrumpido');
          }
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
  destroy(): void {
    if (this.enableLogs) this.logger.log('🧹 Destruyendo VoiceService...');

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