// // src/app/features/pages/static/about/about.component.ts

// import { Location } from '@angular/common';
// import { Component, inject, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';
// import { 
//   IonIcon, 
//   IonButton, 
//   IonCard, 
//   IonCardHeader, 
//   IonCardTitle, 
//   IonCardContent, 
//   IonCardSubtitle 
// } from '@ionic/angular';
// import { addIcons } from 'ionicons';
// import { 
//   micOutline,
//   accessibilityOutline,
//   informationCircleOutline,
//   codeOutline,
//   arrowBackOutline,
//   chatbubbleEllipsesOutline
// } from 'ionicons/icons';
// import { MatIconModule } from '@angular/material/icon';  // ✅ SOLO AÑADIDO ESTO
// import { VoiceCommandHandlerService } from '../../../services/voz/voice-command-handler.service';
// import { VoiceContextService } from '../../../services/voz/voice-context.service';
// import { VoiceService } from '../../../services/voz/voice.service';
// import { ThemeService } from '../../../../shared/services/theme/theme';

// @Component({
//   selector: 'app-about',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     IonIcon,
//     IonButton,
//     IonCard,
//     IonCardHeader,
//     IonCardTitle,
//     IonCardContent,
//     IonCardSubtitle,
//     MatIconModule  // ✅ SOLO AÑADIDO ESTO
//   ],
//   templateUrl: './about.component.html',
//   styleUrls: ['./about.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class AboutComponent implements OnInit, OnDestroy {
//   private readonly location = inject(Location);
//   private ngZone = inject(NgZone);
//   public themeService = inject(ThemeService);
//   private voiceContext = inject(VoiceContextService);
//   private voiceService = inject(VoiceService);
//   private voiceHandler = inject(VoiceCommandHandlerService);

//   private isNavigating = false;
//   private welcomeShown = false;
//   private isDestroyed = false;
//   private destroy$ = new Subject<void>();

//   // ✅ Control de duplicados (igual que en tu código)
//   private lastProcessedCommand = '';
//   private lastProcessedTime = 0;
//   private readonly COMMAND_DEBOUNCE = 2000;

//   // ✅ Control de reintentos (igual que en tu código)
//   private noSpeechAttempts = 0;
//   private readonly MAX_NO_SPEECH_ATTEMPTS = 3;

//   currentYear: number = new Date().getFullYear();

//   constructor() {
//     addIcons({
//       micOutline,
//       accessibilityOutline,
//       informationCircleOutline,
//       codeOutline,
//       arrowBackOutline,
//       chatbubbleEllipsesOutline
//     });
//   }

//   ngOnInit(): void {
//     console.log('✅ AboutComponent inicializado (con voz contextual)');

//     // ✅ REACTIVAR MICRÓFONO AL ENTRAR (igual que tu código)
//     if (!this.voiceService.isRecognitionActive()) {
//       console.log('🎤 [About] Reconocimiento inactivo, iniciando...');
//       this.voiceService.startListening();
//     }

//     // ✅ CONTEXTO DE VOZ (igual que tu código)
//     const context = {
//       activationMessage: 'Bienvenido a la página Acerca de. Puedes decir "volver" para regresar o "leer" para escuchar la información.',
//       availableCommands: ['atrás', 'regresar', 'inicio', 'leer', 'información', 'volver'],
//       preventBackend: true
//     };
//     this.voiceContext.setContext(context);

//     // ✅ SUSCRIPCIÓN AL TRANSCRIPT (igual que tu código)
//     this.voiceService
//       .getTranscript()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((text: string) => {
//         this.ngZone.run(() => {
//           if (this.isDestroyed || !text) return;
//           this.handleVoiceCommand(text);
//         });
//       });

//     // ✅ CONTROL DE CAÍDAS DEL RECONOCIMIENTO (igual que tu código)
//     this.voiceService.ready$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((ready) => {
//         if (ready) {
//           this.noSpeechAttempts = 0;
//           return;
//         }

//         if (!ready && !this.isDestroyed) {
//           this.noSpeechAttempts++;
          
//           if (this.noSpeechAttempts >= this.MAX_NO_SPEECH_ATTEMPTS) {
//             console.warn('🔇 [About] Demasiados errores de no-speech, pausando micrófono');
//             this.voiceService.mute();
//             this.voiceService.speak('He pausado el micrófono por inactividad. Di "hola" para reactivarlo.');
//             this.noSpeechAttempts = 0;
//             return;
//           }

//           console.log(`🔄 [About] Reconocimiento caído, reintento ${this.noSpeechAttempts}...`);
//           setTimeout(() => {
//             if (!this.isDestroyed) {
//               this.voiceService.startListening();
//             }
//           }, 500);
//         }
//       });

//     // ✅ MENSAJE DE BIENVENIDA (igual que tu código)
//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         if (!this.voiceService.isRecognitionActive()) {
//           this.voiceService.startListening();
//         }
//         if (!this.voiceService.isCurrentlyMuted() && !this.welcomeShown) {
//           this.welcomeShown = true;
//           if (!this.voiceService.hasWelcomeBeenShown('about')) {
//             this.voiceService.markWelcomeAsShown('about');
//             this.voiceService.speakWhenReady(context.activationMessage);
//           }
//         }
//       }
//     }, 800);
//   }

//   // ============================================================
//   // ✅ HANDLE VOICE COMMAND (IGUAL QUE TU CÓDIGO)
//   // ============================================================

//   private handleVoiceCommand(text: string): void {
//     if (this.isDestroyed) return;
//     const lower = text.toLowerCase().trim();

//     console.log(`📝 [About] Comando recibido: "${lower}"`);

//     // ✅ Prevenir duplicados (igual que tu código)
//     const now = Date.now();
//     if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//       console.log(`⏭️ [About] Comando ignorado por debounce: "${lower}"`);
//       return;
//     }
//     this.lastProcessedCommand = lower;
//     this.lastProcessedTime = now;

//     // ✅ "volver" / "atrás" / "regresar" / "inicio" (igual que tu código)
//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('inicio')) {
//       console.log('🔙 [About] Ejecutando "volver"');
//       this.goBack();
//       return;
//     }

//     // ✅ "leer" / "información" (igual que tu código)
//     if (lower.includes('leer') || lower.includes('información')) {
//       console.log('📖 [About] Ejecutando "leer"');
//       this.readInfo();
//       return;
//     }

//     // ✅ "silenciar micrófono" (igual que tu código)
//     if (lower.includes('silenciar micrófono') || lower.includes('dejar de escuchar') || lower.includes('silenciar')) {
//       console.log('🔇 [About] Silenciando micrófono');
//       this.voiceService.mute();
//       return;
//     }

//     // ✅ "activar micrófono" (igual que tu código)
//     if (lower.includes('activar micrófono') || lower.includes('encender micrófono') || lower.includes('desmutear') || lower.includes('escuchar')) {
//       console.log('🔊 [About] Activando micrófono');
//       this.voiceService.unmute();
//       return;
//     }

//     console.log(`⏭️ [About] Comando no reconocido: "${lower}"`);
//   }

//   // ============================================================
//   // ✅ MÉTODOS PÚBLICOS (IGUAL QUE TU CÓDIGO)
//   // ============================================================

//   goBack(): void {
//     if (this.isNavigating) return;
//     this.isNavigating = true;
//     this.location.back();
//   }

//   readInfo(): void {
//     const message = `
//       VozAcción, el universo de la palabra. 
//       Comandos de voz para todos. 
//       Permite interactuar con la tecnología usando solo la voz, facilitando el acceso a personas con diversas capacidades. 
//       Control total por voz, sin necesidad de clics. 
//       Diseñado para personas con movilidad reducida. 
//       Asistente inteligente que entiende comandos naturales. 
//       Versión 1.0, proyecto de accesibilidad.
//     `;
//     this.voiceService.speak(message);
//   }

//   // ============================================================
//   // ✅ DESTRUCTOR (IGUAL QUE TU CÓDIGO)
//   // ============================================================

//   ngOnDestroy(): void {
//     console.log('🧹 AboutComponent destruido, contexto reseteado');
//     this.isDestroyed = true;
//     this.noSpeechAttempts = 0;
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.voiceContext.resetContext();
//     window.speechSynthesis.cancel();
//   }
// }








// src/app/features/pages/static/about/about.component.ts

import { Location } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, NgZone, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  IonIcon, 
  IonButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardContent, 
  IonCardSubtitle 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  micOutline,
  accessibilityOutline,
  informationCircleOutline,
  codeOutline,
  arrowBackOutline,
  chatbubbleEllipsesOutline
} from 'ionicons/icons';
import { MatIconModule } from '@angular/material/icon';
import { VoiceCommandHandlerService } from '../../../services/voz/voice-command-handler.service';
import { VoiceContextService } from '../../../services/voz/voice-context.service';
import { VoiceService } from '../../../services/voz/voice.service';
import { ThemeService } from '../../../../shared/services/theme/theme';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonCardSubtitle,
    MatIconModule
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit, OnDestroy {
  private ngZone = inject(NgZone);
  public themeService = inject(ThemeService);
  private voiceContext = inject(VoiceContextService);
  private voiceService = inject(VoiceService);

  private isNavigating = false;
  private welcomeShown = false;
  private isDestroyed = false;
  private destroy$ = new Subject<void>();

  private router = inject(Router);
  
  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 2000;

  private noSpeechAttempts = 0;
  private readonly MAX_NO_SPEECH_ATTEMPTS = 3;

  currentYear: number = new Date().getFullYear();

  constructor() {
    addIcons({
      micOutline,
      accessibilityOutline,
      informationCircleOutline,
      codeOutline,
      arrowBackOutline,
      chatbubbleEllipsesOutline
    });
  }

  ngOnInit(): void {
    console.log('✅ AboutComponent inicializado (con voz contextual)');
     console.trace('🔵 AboutComponent inicializado - Callstack:');

    // ✅ FORZAR INICIO DEL RECONOCIMIENTO
    this.voiceService.startListening();
    console.log('🎤 [About] Reconocimiento iniciado');

    // ✅ CONTEXTO DE VOZ
    const context = {
      activationMessage: 'Bienvenido a la página Acerca de. Puedes decir "volver" para regresar o "leer" para escuchar la información.',
      availableCommands: ['atrás', 'regresar', 'inicio', 'leer', 'información', 'volver'],
      preventBackend: true
    };
    this.voiceContext.setContext(context);
    console.log('📢 [About] Contexto configurado');

    // ✅ SUSCRIPCIÓN AL TRANSCRIPT
    this.voiceService
      .getTranscript()
      .pipe(takeUntil(this.destroy$))
      .subscribe((text: string) => {
        this.ngZone.run(() => {
          if (this.isDestroyed || !text) return;
          console.log(`🎤 [About] Transcript: "${text}"`);
          this.handleVoiceCommand(text);
        });
      });

    // ✅ CONTROL DE CAÍDAS
    this.voiceService.ready$
      .pipe(takeUntil(this.destroy$))
      .subscribe((ready) => {
        console.log(`🎤 [About] Ready: ${ready}`);
        if (ready) {
          this.noSpeechAttempts = 0;
          return;
        }

        if (!ready && !this.isDestroyed) {
          this.noSpeechAttempts++;
          
          if (this.noSpeechAttempts >= this.MAX_NO_SPEECH_ATTEMPTS) {
            console.warn('🔇 [About] Pausando micrófono');
            this.voiceService.mute();
            this.voiceService.speak('He pausado el micrófono por inactividad.');
            this.noSpeechAttempts = 0;
            return;
          }

          console.log(`🔄 [About] Reintento ${this.noSpeechAttempts}...`);
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.voiceService.startListening();
            }
          }, 500);
        }
      });

    // ✅ MENSAJE DE BIENVENIDA CON speak() DIRECTO
    setTimeout(() => {
      if (!this.isDestroyed) {
        console.log('📢 [About] Intentando mensaje de bienvenida...');
        
        // Forzar inicio del reconocimiento
        this.voiceService.startListening();
        
        if (!this.welcomeShown) {
          this.welcomeShown = true;
          
          // ✅ USAR speak() DIRECTAMENTE (no speakWhenReady)
          const message = 'Bienvenido a la página Acerca de. Puedes decir "volver" para regresar o "leer" para escuchar la información.';
          console.log(`📢 [About] Reproduciendo: "${message}"`);
          this.voiceService.speak(message);
          
          // ✅ Marcar como mostrado
          this.voiceService.markWelcomeAsShown('about');
        }
      }
    }, 1500); // Aumentado a 1.5 segundos
  }

  // ============================================================
  // HANDLE VOICE COMMAND
  // ============================================================

  private handleVoiceCommand(text: string): void {
    if (this.isDestroyed) return;
    const lower = text.toLowerCase().trim();

    console.log(`📝 [About] Procesando: "${lower}"`);

    const now = Date.now();
    if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ [About] Debounce: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar') || lower.includes('inicio')) {
      console.log('🔙 [About] Volviendo');
      //this.voiceService.speak('Volviendo a la página anterior.');
      this.goBack();
      return;
    }

    if (lower.includes('leer') || lower.includes('información')) {
      console.log('📖 [About] Leyendo');
      this.readInfo();
      return;
    }

    if (lower.includes('silenciar') || lower.includes('dejar de escuchar')) {
      console.log('🔇 [About] Silenciando');
      this.voiceService.mute();
      this.voiceService.speak('Micrófono silenciado.');
      return;
    }

    if (lower.includes('activar') || lower.includes('desmutear') || lower.includes('escuchar')) {
      console.log('🔊 [About] Activando');
      this.voiceService.unmute();
      this.voiceService.speak('Micrófono activado.');
      return;
    }

    console.log(`⏭️ [About] No reconocido: "${lower}"`);
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================

  goBack(): void {
    if (this.isNavigating) return;
    this.isNavigating = true;
    console.log('🔙 [About] Volviendo a /home');

    this.router.navigate(['/home']).finally(() => {
      this.isNavigating = false;
    });
  }

  readInfo(): void {
    const message = `
      VozAcción, el universo de la palabra. 
      Comandos de voz para todos. 
      Permite interactuar con la tecnología usando solo la voz, facilitando el acceso a personas con diversas capacidades. 
      Control total por voz, sin necesidad de clics. 
      Diseñado para personas con movilidad reducida. 
      Asistente inteligente que entiende comandos naturales. 
      Versión 1.0, proyecto de accesibilidad.
    `;
    console.log('📢 [About] Leyendo información...');
    this.voiceService.speak(message);
  }

  // ============================================================
  // DESTRUCTOR
  // ============================================================

  ngOnDestroy(): void {
    console.log('🧹 AboutComponent destruido');
    this.isDestroyed = true;
    this.noSpeechAttempts = 0;
    this.destroy$.next();
    this.destroy$.complete();
    this.voiceContext.resetContext();
    window.speechSynthesis.cancel();
  }
}