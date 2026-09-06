// import { 
//   Component, 
//   inject, 
//   signal, 
//   input, 
//   effect, 
//   ViewEncapsulation, 
//   ChangeDetectionStrategy, 
//   CUSTOM_ELEMENTS_SCHEMA
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { IonButton, IonIcon } from '@ionic/angular';
// import { addIcons } from 'ionicons';
// import { micOutline, micOffOutline } from 'ionicons/icons';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { AppStateService } from '../../services/app-state/app-state.service';
// import { Router } from '@angular/router';
// import { VoiceContextService } from '../../../features/services/voz/voice-context.service';
// import { VoiceService } from '../../../features/services/voz/voice.service';

// export type MicState = 'idle' | 'listening' | 'error';

// @Component({
//   selector: 'app-voice-toggle',
//   standalone: true,
//   imports: [
//     CommonModule, 
//   ],
//   schemas: [CUSTOM_ELEMENTS_SCHEMA],
//   templateUrl: './voice-toggle.component.html',
//   styleUrl: './voice-toggle.component.scss',
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   encapsulation: ViewEncapsulation.Emulated
// })
// export class VoiceToggleComponent {
//   private voiceService = inject(VoiceService);
//   private appState = inject(AppStateService);
//   private router = inject(Router);
//   private voiceContext = inject(VoiceContextService);
  
//   showStatusLabel = input<boolean>(true);
//   size = input<'small' | 'medium' | 'large'>('medium');
//   position = input<'fixed' | 'relative'>('fixed');
//   showTooltip = input<boolean>(true);
  
//   public isMuted = signal(false);
//   private isListening = signal(false);
//   private hasError = signal(false);
//   micState = signal<MicState>('idle');
  
//   private _isReady = signal(false);
  
//   private activationMessageShown = signal(false);
//   private lastActivationTime = 0;
//   private readonly DEBOUNCE_TIME = 5000;
  
//   private ignoreNextActivation = false;

//   constructor() {
//     // Registrar iconos de Ionic
//     addIcons({ micOutline, micOffOutline });

//     effect(() => {
//       const muted = this.isMuted();
//       const listening = this.isListening();
//       const hasError = this.hasError();
      
//       this.micState.set(
//         hasError ? 'error' :
//         (listening && !muted) ? 'listening' :
//         'idle'
//       );
//     });

//     this.voiceService.ready$.pipe(takeUntilDestroyed()).subscribe(ready => {
//       console.log('🔍 [VoiceToggle] ready$ cambió:', { ready, timestamp: new Date().toISOString() });
//       this._isReady.set(ready);
//     });

//     this.voiceService.autoRestart$.pipe(takeUntilDestroyed()).subscribe(isAutoRestart => {
//       console.log('🔍 [VoiceToggle] autoRestart$ cambió:', { 
//         isAutoRestart, 
//         timestamp: new Date().toISOString() 
//       });
//       if (isAutoRestart) {
//         this.ignoreNextActivation = true;
//         console.log('🔍 [VoiceToggle] → ignoreNextActivation = true (por auto-restart)');
//       }
//     });

//     this.voiceService.muted$.pipe(takeUntilDestroyed()).subscribe(muted => {
//       const wasMuted = this.isMuted();
//       console.log('🔍 [VoiceToggle] muted$ cambió:', { muted, wasMuted, timestamp: new Date().toISOString() });
//       this.isMuted.set(muted);
      
//       if (muted) {
//         this.isListening.set(false);
//         this.activationMessageShown.set(false);
//       } else if (wasMuted) {
//         this.ignoreNextActivation = false;

//         if (!this.ignoreNextActivation) {
//           const contextMsg = this.voiceContext.getContext().activationMessage ||
//                              'Micrófono activado. Di "silenciar" para desactivarlo.';
//           this.voiceService.speakWhenReady(contextMsg);
//         }

//         this.playActivationMessage();
//       }
//     });

//     this.voiceService.listening$.pipe(takeUntilDestroyed()).subscribe(listening => {
//       const wasListening = this.isListening();
//       console.log('🔍 [VoiceToggle] listening$ cambió:', { 
//         de: wasListening, 
//         a: listening,
//         isMuted: this.isMuted(),
//         ignoreNextActivation: this.ignoreNextActivation,
//         timestamp: new Date().toISOString()
//       });
      
//       this.isListening.set(listening);
      
//       if (listening && !wasListening && !this.isMuted()) {
//         if (this.ignoreNextActivation) {
//           console.log('🔍 [VoiceToggle] → Ignorando activación (reinicio automático)');
//           this.ignoreNextActivation = false;
//           return;
//         }
//         console.log('🔍 [VoiceToggle] → Micrófono activado (solo log, sin voz)');
//         this.playActivationMessage();
//       } else {
//         console.log('🔍 [VoiceToggle] → Estado de escucha actualizado', {
//           listening,
//           wasListening,
//           isMuted: this.isMuted()
//         });
//       }
//     });

//     this.voiceService.error$.pipe(takeUntilDestroyed()).subscribe(error => {
//       const recoverableErrors = ['no-speech', 'network', 'audio-capture'];
//       if (recoverableErrors.includes(error)) {
//         console.log('🔄 Error recuperable ignorado en UI:', error);
//         return;
//       }
//       this.hasError.set(!!error);
//     });

//     this.isMuted.set(this.voiceService.isCurrentlyMuted());
//     this.isListening.set(this.voiceService.isListeningActive());
//   }

//   private playActivationMessage(): void {
//     const now = Date.now();
//     const diff = now - this.lastActivationTime;
    
//     if (!this.activationMessageShown() && 
//         !this.isMuted() && 
//         diff > this.DEBOUNCE_TIME) {
      
//       this.activationMessageShown.set(true);
//       this.lastActivationTime = now;
      
//       setTimeout(() => {
//         this.activationMessageShown.set(false);
//         console.log('🔍 [VoiceToggle] → Flag activationMessageShown resetado');
//       }, 1000);
//     }
//   }

//   // Getters actualizados a nombres de Ionic (mic-outline / mic-off-outline)
//   get micIcon(): string {
//     const state = this.micState();
//     if (state === 'error') return 'mic-off-outline';
//     if (state === 'listening') return 'mic-outline';
//     return this.isMuted() ? 'mic-off-outline' : 'mic-outline';
//   }

//   get tooltipText(): string {
//     const state = this.micState();
//     if (state === 'error') return 'Error en el micrófono. Haz clic para reiniciar';
//     if (state === 'listening') return 'Escuchando... Haz clic para silenciar';
//     return this.isMuted() ? 'Activar micrófono' : 'Silenciar micrófono';
//   }

//   get statusText(): string {
//     const state = this.micState();
//     if (state === 'error') return '❌ Error';
//     if (state === 'listening') return '🎤 Escuchando...';
//     return this.isMuted() ? '🔇 Apagado' : '🎤 Activo';
//   }

//   get isPulsing(): boolean {
//     return this.micState() === 'listening';
//   }

//   get buttonSize(): string {
//     const sizes = {
//       small: '36px',
//       medium: '48px',
//       large: '56px'
//     };
//     return sizes[this.size()] || sizes['medium'];
//   }

//   get iconSize(): string {
//     const sizes = {
//       small: '20px',
//       medium: '24px',
//       large: '28px'
//     };
//     return sizes[this.size()] || sizes['medium'];
//   }

//   get isFirefox(): boolean {
//     return this.appState.isFirefox;
//   }

//   get showFirefoxMessage(): boolean {
//     return this.appState.isFirefoxMessageVisible && this.isWelcomePage;
//   }

//   get isWelcomePage(): boolean {
//     return this.router.url === '/' || this.router.url === '/welcome';
//   }

//   get browserSupportMessage(): string {
//     return this.appState.getVoiceUnsupportedMessage();
//   }

//   get isReady(): boolean {
//     return this._isReady();
//   }

//   closeFirefoxMessage(): void {
//     this.appState.closeFirefoxMessage();
//   }

//   toggleMic(): void {
//     if (this.appState.isFirefox) {
//       console.warn('🦊 Firefox: Reconocimiento de voz no soportado');
//       return;
//     }

//     if (this.hasError()) {
//       this.hasError.set(false);
//       this.voiceService.startListening();
//       return;
//     }
    
//     const wasMuted = this.isMuted();
    
//     if (wasMuted) {
//       window.speechSynthesis.cancel();
//       this.activationMessageShown.set(false);
//       this.ignoreNextActivation = false;
//     }
    
//     this.voiceService.toggleMute();
    
//     if (wasMuted) {
//       setTimeout(() => this.playActivationMessage(), 200);
//     }
//   }

//   isVoiceSupported(): boolean {
//     return this.appState.isVoiceSupported && 
//            this.voiceService.isSpeechSynthesisSupported();
//   }
// }













import { 
  Component, 
  inject, 
  signal, 
  input, 
  effect, 
  ViewEncapsulation, 
  ChangeDetectionStrategy, 
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { micOutline, micOffOutline } from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppStateService } from '../../services/app-state/app-state.service';
import { Router } from '@angular/router';
import { VoiceContextService } from '../../../features/services/voz/voice-context.service';
import { VoiceService } from '../../../features/services/voz/voice.service';

export type MicState = 'idle' | 'listening' | 'error';

@Component({
  selector: 'app-voice-toggle',
  standalone: true,
  imports: [
    CommonModule, 
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './voice-toggle.component.html',
  styleUrl: './voice-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.Emulated
})
export class VoiceToggleComponent {
  private voiceService = inject(VoiceService);
  private appState = inject(AppStateService);
  private router = inject(Router);
  private voiceContext = inject(VoiceContextService);
  
  showStatusLabel = input<boolean>(true);
  size = input<'small' | 'medium' | 'large'>('medium');
  position = input<'fixed' | 'relative'>('fixed');
  showTooltip = input<boolean>(true);
  
  public isMuted = signal(false);
  private isListening = signal(false);
  private hasError = signal(false);
  micState = signal<MicState>('idle');
  
  private _isReady = signal(false);
  
  private activationMessageShown = signal(false);
  private lastActivationTime = 0;
  private readonly DEBOUNCE_TIME = 5000;
  
  private ignoreNextActivation = false;

  constructor() {
    // Registrar iconos de Ionic
    addIcons({ micOutline, micOffOutline });

    effect(() => {
      const muted = this.isMuted();
      const listening = this.isListening();
      const hasError = this.hasError();
      
      this.micState.set(
        hasError ? 'error' :
        (listening && !muted) ? 'listening' :
        'idle'
      );
    });

    this.voiceService.ready$.pipe(takeUntilDestroyed()).subscribe(ready => {
      console.log('🔍 [VoiceToggle] ready$ cambió:', { ready, timestamp: new Date().toISOString() });
      this._isReady.set(ready);
    });

    this.voiceService.autoRestart$.pipe(takeUntilDestroyed()).subscribe(isAutoRestart => {
      console.log('🔍 [VoiceToggle] autoRestart$ cambió:', { 
        isAutoRestart, 
        timestamp: new Date().toISOString() 
      });
      if (isAutoRestart) {
        this.ignoreNextActivation = true;
        console.log('🔍 [VoiceToggle] → ignoreNextActivation = true (por auto-restart)');
      }
    });

    // ✅ CORREGIDO: Suscripción a muted$ - SOLO actualiza estado, sin emitir mensajes
    this.voiceService.muted$.pipe(takeUntilDestroyed()).subscribe(muted => {
      const wasMuted = this.isMuted();
      console.log('🔍 [VoiceToggle] muted$ cambió:', { muted, wasMuted, timestamp: new Date().toISOString() });
      this.isMuted.set(muted);
      
      if (muted) {
        this.isListening.set(false);
        this.activationMessageShown.set(false);
      } else if (wasMuted) {
        this.ignoreNextActivation = false;
        // ✅ SOLO actualizar estado sin emitir mensajes
        console.log('🔍 [VoiceToggle] Micrófono activado (solo log)');
      }
    });

    // ✅ CORREGIDO: Suscripción a listening$ - SOLO actualiza estado, sin emitir mensajes
    this.voiceService.listening$.pipe(takeUntilDestroyed()).subscribe(listening => {
      const wasListening = this.isListening();
      console.log('🔍 [VoiceToggle] listening$ cambió:', { 
        de: wasListening, 
        a: listening,
        isMuted: this.isMuted(),
        ignoreNextActivation: this.ignoreNextActivation,
        timestamp: new Date().toISOString()
      });
      
      this.isListening.set(listening);
      
      if (listening && !wasListening && !this.isMuted()) {
        if (this.ignoreNextActivation) {
          console.log('🔍 [VoiceToggle] → Ignorando activación (reinicio automático)');
          this.ignoreNextActivation = false;
          return;
        }
        console.log('🔍 [VoiceToggle] → Micrófono activado (solo log, sin voz)');
      } else {
        console.log('🔍 [VoiceToggle] → Estado de escucha actualizado', {
          listening,
          wasListening,
          isMuted: this.isMuted()
        });
      }
    });

    this.voiceService.error$.pipe(takeUntilDestroyed()).subscribe(error => {
      const recoverableErrors = ['no-speech', 'network', 'audio-capture'];
      if (recoverableErrors.includes(error)) {
        console.log('🔄 Error recuperable ignorado en UI:', error);
        return;
      }
      this.hasError.set(!!error);
    });

    this.isMuted.set(this.voiceService.isCurrentlyMuted());
    this.isListening.set(this.voiceService.isListeningActive());
  }

  // ✅ playActivationMessage() SOLO controla el flag de debounce, NO emite mensajes
  private playActivationMessage(): void {
    const now = Date.now();
    const diff = now - this.lastActivationTime;
    
    if (!this.activationMessageShown() && 
        !this.isMuted() && 
        diff > this.DEBOUNCE_TIME) {
      
      this.activationMessageShown.set(true);
      this.lastActivationTime = now;
      
      setTimeout(() => {
        this.activationMessageShown.set(false);
        console.log('🔍 [VoiceToggle] → Flag activationMessageShown resetado');
      }, 1000);
    }
  }

  // Getters actualizados a nombres de Ionic (mic-outline / mic-off-outline)
  get micIcon(): string {
    const state = this.micState();
    if (state === 'error') return 'mic-off-outline';
    if (state === 'listening') return 'mic-outline';
    return this.isMuted() ? 'mic-off-outline' : 'mic-outline';
  }

  get tooltipText(): string {
    const state = this.micState();
    if (state === 'error') return 'Error en el micrófono. Haz clic para reiniciar';
    if (state === 'listening') return 'Escuchando... Haz clic para silenciar';
    return this.isMuted() ? 'Activar micrófono' : 'Silenciar micrófono';
  }

  get statusText(): string {
    const state = this.micState();
    if (state === 'error') return '❌ Error';
    if (state === 'listening') return '🎤 Escuchando...';
    return this.isMuted() ? '🔇 Apagado' : '🎤 Activo';
  }

  get isPulsing(): boolean {
    return this.micState() === 'listening';
  }

  get buttonSize(): string {
    const sizes = {
      small: '36px',
      medium: '48px',
      large: '56px'
    };
    return sizes[this.size()] || sizes['medium'];
  }

  get iconSize(): string {
    const sizes = {
      small: '20px',
      medium: '24px',
      large: '28px'
    };
    return sizes[this.size()] || sizes['medium'];
  }

  get isFirefox(): boolean {
    return this.appState.isFirefox;
  }

  get showFirefoxMessage(): boolean {
    return this.appState.isFirefoxMessageVisible && this.isWelcomePage;
  }

  get isWelcomePage(): boolean {
    return this.router.url === '/' || this.router.url === '/welcome';
  }

  get browserSupportMessage(): string {
    return this.appState.getVoiceUnsupportedMessage();
  }

  get isReady(): boolean {
    return this._isReady();
  }

  closeFirefoxMessage(): void {
    this.appState.closeFirefoxMessage();
  }

  //
  toggleMic(): void {
    if (this.appState.isFirefox) {
      console.warn('🦊 Firefox: Reconocimiento de voz no soportado');
      return;
    }

    if (this.hasError()) {
      this.hasError.set(false);
      this.voiceService.startListening();
      return;
    }
    
    const wasMuted = this.isMuted();
    
    if (wasMuted) {
      window.speechSynthesis.cancel();
      this.activationMessageShown.set(false);
      this.ignoreNextActivation = false;
    }
    
    this.voiceService.toggleMute();
    
    // ✅ ELIMINADO: El mensaje ya lo emite VoiceService.unmute()
    // if (wasMuted) {
    //   setTimeout(() => this.playActivationMessage(), 200);
    // }
  }


  isVoiceSupported(): boolean {
    return this.appState.isVoiceSupported && 
           this.voiceService.isSpeechSynthesisSupported();
  }
}