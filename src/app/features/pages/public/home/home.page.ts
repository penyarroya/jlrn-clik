// // src/app/features/pages/public/home/home.page.ts

// import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
// import { RouterLink, Router } from '@angular/router';
// import { IonButton, IonIcon } from '@ionic/angular';
// import { addIcons } from 'ionicons';
// import { 
//   informationCircleOutline, 
//   personCircleOutline,
//   headsetOutline,
//   volumeHighOutline,
//   micOffOutline,
//   micOutline 
// } from 'ionicons/icons';
// import { Subscription, firstValueFrom, timeout } from 'rxjs';
// import { VoiceService } from '../../../services/voz/voice.service';
// import { VoiceContextService } from '../../../services/voz/voice-context.service';

// @Component({
//   selector: 'app-home',
//   templateUrl: 'home.page.html',
//   styleUrls: ['home.page.scss'],
//   imports: [
//     RouterLink,
//     IonButton, 
//     IonIcon
//   ],
// })
// export class HomePage implements OnInit, OnDestroy {
//   private voiceService = inject(VoiceService);
//   private voiceContext = inject(VoiceContextService);
//   private router = inject(Router);

//   slides = signal<string[]>(['assets/shapes.svg']);
//   totalDuration = signal<number>(5);

//   areHeadphonesConnected = signal<boolean>(false);
//   isMuted = signal<boolean>(true);
//   isRecognitionActive = signal<boolean>(false);
  
//   // ✅ Usar bandera GLOBAL del contexto
//   private initialCheckDone = false;

//   // ✅ NUEVO: control de navegación y debounce local
//   private isNavigating = false;
//   private lastProcessedCommand = '';
//   private lastProcessedTime = 0;
//   private readonly COMMAND_DEBOUNCE = 1500;

//   private subscriptions: Subscription[] = [];

//   constructor() {
//     addIcons({ 
//       informationCircleOutline, 
//       personCircleOutline,
//       headsetOutline,
//       volumeHighOutline,
//       micOffOutline,
//       micOutline
//     });
//   }

//   ngOnInit(): void {
//     // ✅ 1. Configurar contexto de voz para la página Home
//     this.voiceContext.setHomeContext();

//     // ✅ 2. Suscribirse al estado de auriculares
//     this.subscriptions.push(
//       this.voiceService.headphonesConnected$.subscribe(connected => {
//         console.log('📊 [Home] SUSCRIPCIÓN - Valor recibido:', connected);
//         console.log('📊 [Home] SUSCRIPCIÓN - Tipo:', typeof connected);
        
//         const previousState = this.areHeadphonesConnected();
//         this.areHeadphonesConnected.set(connected);
//         console.log('🎧 [Home] Estado de auriculares actualizado:', connected);
        
//         console.log('📊 [Home] SUSCRIPCIÓN - Banderas:');
//         console.log('  - welcomeShown (global):', this.voiceContext.isWelcomeShown());
//         console.log('  - initialCheckDone:', this.initialCheckDone);
        
//         // ✅ Usar la bandera GLOBAL del contexto
//         if (connected && !this.voiceContext.isWelcomeShown() && this.initialCheckDone) {
//           this.voiceContext.markWelcomeAsShown();
//           console.log('📢 [Home] 🎯 PRIMERA VEZ - Ejecutando bienvenida');
//           this.showWelcomeSequence();
//         } 
//         else if (!connected && previousState) {
//           console.log('🔇 [Home] Auriculares DESCONECTADOS');
//           this.voiceService.speakAlways(
//             this.voiceContext.getMessage('headphonesDisconnected')
//           );
//         }
//         else {
//           console.log('⏭️ [Home] Actualización de estado (sin mensaje)');
//         }
//       })
//     );

//     // ✅ 3. Suscribirse al estado del mute
//     this.subscriptions.push(
//       this.voiceService.muted$.subscribe(muted => {
//         this.isMuted.set(muted);
//         console.log('🎤 [Home] Micrófono muteado:', muted);
//       })
//     );

//     // ✅ 4. Suscribirse al estado de reconocimiento
//     this.subscriptions.push(
//       this.voiceService.listening$.subscribe(active => {
//         this.isRecognitionActive.set(active);
//         console.log('🎙️ [Home] Reconocimiento activo:', active);
//       })
//     );

//     // ✅ 5. SUSCRIBIRSE A LOS COMANDOS DE VOZ DE HOME
//     this.subscriptions.push(
//       this.voiceService.getTranscript().subscribe(transcript => {
//         if (!transcript) return;
//         // ✅ Ignorar comandos mientras se está navegando
//         if (this.isNavigating) {
//           console.log('⏭️ [Home] Ignorando comando durante navegación:', transcript);
//           return;
//         }
//         this.handleVoiceCommand(transcript);
//       })
//     );

//     // ✅ 6. Verificar si los auriculares ya están conectados al iniciar
//     this.checkInitialHeadphones();

//     console.log('🎯 [Home] Comandos disponibles:', this.voiceContext.getAvailableCommands());
//   }

//   //
//   private handleVoiceCommand(transcript: string): void {
//     const lower = transcript.toLowerCase().trim();

//     // ✅ Debounce local (defensa en profundidad)
//     const now = Date.now();
//     if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
//       console.log(`⏭️ [Home] Comando duplicado ignorado: "${lower}"`);
//       return;
//     }
//     this.lastProcessedCommand = lower;
//     this.lastProcessedTime = now;

//     console.log('📝 [Home] Comando de voz recibido:', lower);

//     // ✅ Comando "login"
//     if (lower === 'login' || lower === 'iniciar sesion' || lower === 'inicio de sesion') {
//       if (this.isNavigating) return;
//       this.isNavigating = true;
//       console.log('🔐 [Home] Navegando a login');
//       this.voiceService.clearTranscript();
//       this.router.navigateByUrl('/login', { replaceUrl: true }).finally(() => {
//         setTimeout(() => { this.isNavigating = false; }, 1000);
//       });
//       return;
//     }

//     // ✅ Comando "acerca de"
//     if (lower === 'acerca de' || lower === 'acerca') {
//       if (this.isNavigating) return;
//       this.isNavigating = true;
//       console.log('ℹ️ [Home] Navegando a About');
//       this.voiceService.clearTranscript();
//       this.router.navigateByUrl('/about', { replaceUrl: true }).finally(() => {
//         setTimeout(() => { this.isNavigating = false; }, 1000);
//       });
//       return;
//     }

//     // ✅ Comando "registro"
//     if (lower === 'registro' || lower === 'registrar') {
//       if (this.isNavigating) return;
//       this.isNavigating = true;
//       console.log('📝 [Home] Navegando a registro');
//       this.voiceService.clearTranscript();
//       this.router.navigateByUrl('/register', { replaceUrl: true }).finally(() => {
//         setTimeout(() => { this.isNavigating = false; }, 1000);
//       });
//       return;
//     }

//     // ✅ Comando "ayuda"
//     if (lower === 'ayuda' || lower === 'help') {
//       console.log('❓ [Home] Mostrando ayuda');
//       const commands = this.voiceContext.getAvailableCommands();
//       const helpMessage = `Comandos: ${commands.join(', ')}.`;
//       this.voiceService.speakAlways(helpMessage);
//       return;
//     }

//     // ❌ Comando "volver" ELIMINADO
//     // Home es la página raíz, no tiene sentido "volver" desde aquí.
//     // Este comando era el causante del bucle Home → Login → Home.

//     // ✅ Comandos no reconocidos en Home
//     console.log('⏭️ [Home] Comando no reconocido en esta página:', lower);
//   }
 

//   /**
//    * ✅ VERIFICAR AURICULARES AL INICIAR
//    */
//   private async checkInitialHeadphones(): Promise<void> {
//     console.log('🔍 [Home] Verificando estado inicial de auriculares...');
    
//     try {
//       console.log('📊 [Home] Esperando valor de headphonesConnected$...');
      
//       const connected = await firstValueFrom(
//         this.voiceService.headphonesConnected$.pipe(timeout(3000))
//       ).catch(() => {
//         console.log('⏱️ [Home] Timeout esperando estado de auriculares');
//         return false;
//       });

//       console.log('📊 [Home] VALOR RECIBIDO - connected:', connected);
//       console.log('📊 [Home] Tipo de dato:', typeof connected);
//       console.log('📊 [Home] ¿Es true?', connected === true);
//       console.log('📊 [Home] ¿Es false?', connected === false);
      
//       this.areHeadphonesConnected.set(connected);
      
//       console.log('📊 [Home] Estado de banderas:');
//       console.log('  - welcomeShown (global):', this.voiceContext.isWelcomeShown());
//       console.log('  - initialCheckDone:', this.initialCheckDone);
//       console.log('  - connected:', connected);
      
//       this.initialCheckDone = true;
//       console.log('✅ [Home] Verificación inicial COMPLETADA - initialCheckDone = true');

//       console.log('📊 [Home] Evaluando condición:');
//       console.log('  - connected:', connected);
//       console.log('  - !welcomeShown (global):', !this.voiceContext.isWelcomeShown());
//       console.log('  - Resultado:', connected && !this.voiceContext.isWelcomeShown());
      
//       // ✅ NUEVOS LOGS PARA DEPURAR
//       console.log('🔍 [Home] checkInitialHeadphones - welcomeShown:', this.voiceContext.isWelcomeShown());
//       console.log('🔍 [Home] checkInitialHeadphones - connected:', connected);
      
//       // ✅ Usar la bandera GLOBAL del contexto
//       if (connected && !this.voiceContext.isWelcomeShown()) {
//         console.log('🔴 [Home] ¡SE VA A EMITIR LA BIENVENIDA!');
//         this.voiceContext.markWelcomeAsShown();
//         console.log('📢 [Home] 🎯 PRIMERA VEZ (inicio) - Ejecutando bienvenida');
//         this.showWelcomeSequence();
//       } else {
//         console.log('🟢 [Home] NO se emite bienvenida');
//         console.log('⏭️ [Home] Inicio - No se cumple condición:');
//         if (!connected) console.log('  - ❌ connected es false');
//         if (this.voiceContext.isWelcomeShown()) console.log('  - ❌ welcomeShown es true (ya ejecutada)');
//       }

//     } catch (error) {
//       console.error('❌ [Home] Error verificando estado inicial:', error);
//       this.initialCheckDone = true;
//     }
//   }

//   ngOnDestroy(): void {
//     // ✅ Resetear bandera de navegación
//     this.isNavigating = false;
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   /**
//    * ✅ SECUENCIA DE BIENVENIDA (SOLO UNA VEZ EN TODA LA APP)
//    */
//   private showWelcomeSequence(): void {
//     console.log('📢 [Home] EJECUTANDO BIENVENIDA');

//     const isMuted = this.voiceService.isCurrentlyMuted();

//     let message = 'Bienvenido. ';

//     if (isMuted) {
//       message += 'Micrófono desactivado. Di "hola" para activarlo.';
//     } else {
//       message += 'Micrófono activado. Puedes decir "login", "acerca de", "registro" o "ayuda".';
//     }

//     console.log('📢 [Home] Mensaje a emitir:', message);

//     // ✅ Pequeño retraso para que el reconocimiento no capture el eco
//     setTimeout(() => {
//       // ✅ Pasar `true` para que speakAlways active pendingPostTTSRestart
//       //    y programe el reinicio del micro automáticamente
//       this.voiceService.speakAlways(message, true)
//         .then(() => {
//           console.log('✅ [Home] Mensaje emitido');

//           // ✅ Reinicio explícito del micro tras el TTS
//           setTimeout(() => {
//             if (!this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted()) {
//               console.log('🎤 [Home] Bienvenida terminada → arrancando micro');
//               this.voiceService.startListening();
//             }
//           }, 400);
//         })
//         .catch((err) => {
//           console.warn('⚠️ [Home] speakAlways falló, arrancando micro igualmente', err);
//           if (!this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted()) {
//             this.voiceService.startListening();
//           }
//         });
//     }, 500);
//   }

//   // ============================================================
//   // ✅ MÉTODOS DEL BOTÓN (SIEMPRE FUNCIONAN)
//   // ============================================================

//   playSound(): void {
//     if (!this.areHeadphonesConnected()) {
//       this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }

//     if (this.isMuted()) {
//       this.voiceService.speakAlways(this.voiceContext.getMessage('micDeactivated'));
//       return;
//     }

//     this.voiceService.speak('¡Sonido funcionando correctamente!');
//   }

//   toggleMic(): void {
//     if (!this.areHeadphonesConnected()) {
//       this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }
//     this.voiceService.toggleMute();
//   }

//   getAvailableCommands(): string[] {
//     return this.voiceContext.getAvailableCommands();
//   }

//   showHelp(): void {
//     if (!this.areHeadphonesConnected()) {
//       this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
//       return;
//     }
    
//     const commands = this.voiceContext.getAvailableCommands();
//     const helpMessage = `En esta página puedes usar: ${commands.join(', ')}. `;
//     this.voiceService.speakAlways(helpMessage + this.voiceContext.getMessage('help'));
//   }
// }













// src/app/features/pages/public/home/home.page.ts

import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';                          // ✅ NUEVO
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  informationCircleOutline, 
  personCircleOutline,
  headsetOutline,
  volumeHighOutline,
  micOffOutline,
  micOutline 
} from 'ionicons/icons';
import { Subscription, firstValueFrom, timeout, finalize } from 'rxjs';      // ✅ finalize añadido
import { VoiceService } from '../../../services/voz/voice.service';
import { VoiceContextService } from '../../../services/voz/voice-context.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    RouterLink,
    IonButton, 
    IonIcon
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private voiceService = inject(VoiceService);
  private voiceContext = inject(VoiceContextService);
  private router = inject(Router);
  private http = inject(HttpClient);                                          // ✅ NUEVO

  slides = signal<string[]>([]);                                              // ✅ vacío al inicio
  totalDuration = signal<number>(0);                                          // ✅ 0 al inicio

  areHeadphonesConnected = signal<boolean>(false);
  isMuted = signal<boolean>(true);
  isRecognitionActive = signal<boolean>(false);
  
  // ✅ Usar bandera GLOBAL del contexto
  private initialCheckDone = false;

  // ✅ NUEVO: control de navegación y debounce local
  private isNavigating = false;
  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 1500;

  private subscriptions: Subscription[] = [];

  constructor() {
    addIcons({ 
      informationCircleOutline, 
      personCircleOutline,
      headsetOutline,
      volumeHighOutline,
      micOffOutline,
      micOutline
    });
  }

  ngOnInit(): void {
    // ✅ NUEVO: Cargar imágenes del carrusel
    this.loadImages();

    // ✅ 1. Configurar contexto de voz para la página Home
    this.voiceContext.setHomeContext();

    // ✅ 2. Suscribirse al estado de auriculares
    this.subscriptions.push(
      this.voiceService.headphonesConnected$.subscribe(connected => {
        console.log('📊 [Home] SUSCRIPCIÓN - Valor recibido:', connected);
        console.log('📊 [Home] SUSCRIPCIÓN - Tipo:', typeof connected);
        
        const previousState = this.areHeadphonesConnected();
        this.areHeadphonesConnected.set(connected);
        console.log('🎧 [Home] Estado de auriculares actualizado:', connected);
        
        console.log('📊 [Home] SUSCRIPCIÓN - Banderas:');
        console.log('  - welcomeShown (global):', this.voiceContext.isWelcomeShown());
        console.log('  - initialCheckDone:', this.initialCheckDone);
        
        // ✅ Usar la bandera GLOBAL del contexto
        if (connected && !this.voiceContext.isWelcomeShown() && this.initialCheckDone) {
          this.voiceContext.markWelcomeAsShown();
          console.log('📢 [Home] 🎯 PRIMERA VEZ - Ejecutando bienvenida');
          this.showWelcomeSequence();
        } 
        else if (!connected && previousState) {
          console.log('🔇 [Home] Auriculares DESCONECTADOS');
          this.voiceService.speakAlways(
            this.voiceContext.getMessage('headphonesDisconnected')
          );
        }
        else {
          console.log('⏭️ [Home] Actualización de estado (sin mensaje)');
        }
      })
    );

    // ✅ 3. Suscribirse al estado del mute
    this.subscriptions.push(
      this.voiceService.muted$.subscribe(muted => {
        this.isMuted.set(muted);
        console.log('🎤 [Home] Micrófono muteado:', muted);
      })
    );

    // ✅ 4. Suscribirse al estado de reconocimiento
    this.subscriptions.push(
      this.voiceService.listening$.subscribe(active => {
        this.isRecognitionActive.set(active);
        console.log('🎙️ [Home] Reconocimiento activo:', active);
      })
    );

    // ✅ 5. SUSCRIBIRSE A LOS COMANDOS DE VOZ DE HOME
    this.subscriptions.push(
      this.voiceService.getTranscript().subscribe(transcript => {
        if (!transcript) return;
        // ✅ Ignorar comandos mientras se está navegando
        if (this.isNavigating) {
          console.log('⏭️ [Home] Ignorando comando durante navegación:', transcript);
          return;
        }
        this.handleVoiceCommand(transcript);
      })
    );

    // ✅ 6. Verificar si los auriculares ya están conectados al iniciar
    this.checkInitialHeadphones();

    console.log('🎯 [Home] Comandos disponibles:', this.voiceContext.getAvailableCommands());
  }

  //
  private handleVoiceCommand(transcript: string): void {
    const lower = transcript.toLowerCase().trim();

    // ✅ Debounce local (defensa en profundidad)
    const now = Date.now();
    if (lower === this.lastProcessedCommand && (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ [Home] Comando duplicado ignorado: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    console.log('📝 [Home] Comando de voz recibido:', lower);

    // ✅ Comando "login"
    if (lower === 'login' || lower === 'iniciar sesion' || lower === 'inicio de sesion') {
      if (this.isNavigating) return;
      this.isNavigating = true;
      console.log('🔐 [Home] Navegando a login');
      this.voiceService.clearTranscript();
      this.router.navigateByUrl('/login', { replaceUrl: true }).finally(() => {
        setTimeout(() => { this.isNavigating = false; }, 1000);
      });
      return;
    }

    // ✅ Comando "acerca de"
    if (lower === 'acerca de' || lower === 'acerca') {
      if (this.isNavigating) return;
      this.isNavigating = true;
      console.log('ℹ️ [Home] Navegando a About');
      this.voiceService.clearTranscript();
      this.router.navigateByUrl('/about', { replaceUrl: true }).finally(() => {
        setTimeout(() => { this.isNavigating = false; }, 1000);
      });
      return;
    }

    // ✅ Comando "registro"
    if (lower === 'registro' || lower === 'registrar') {
      if (this.isNavigating) return;
      this.isNavigating = true;
      console.log('📝 [Home] Navegando a registro');
      this.voiceService.clearTranscript();
      this.router.navigateByUrl('/register', { replaceUrl: true }).finally(() => {
        setTimeout(() => { this.isNavigating = false; }, 1000);
      });
      return;
    }

    // ✅ Comando "ayuda"
    if (lower === 'ayuda' || lower === 'help') {
      console.log('❓ [Home] Mostrando ayuda');
      const commands = this.voiceContext.getAvailableCommands();
      const helpMessage = `Comandos: ${commands.join(', ')}.`;
      this.voiceService.speakAlways(helpMessage);
      return;
    }

    // ❌ Comando "volver" ELIMINADO
    // Home es la página raíz, no tiene sentido "volver" desde aquí.
    // Este comando era el causante del bucle Home → Login → Home.

    // ✅ Comandos no reconocidos en Home
    console.log('⏭️ [Home] Comando no reconocido en esta página:', lower);
  }
 

  /**
   * ✅ VERIFICAR AURICULARES AL INICIAR
   */
  private async checkInitialHeadphones(): Promise<void> {
    console.log('🔍 [Home] Verificando estado inicial de auriculares...');
    
    try {
      console.log('📊 [Home] Esperando valor de headphonesConnected$...');
      
      const connected = await firstValueFrom(
        this.voiceService.headphonesConnected$.pipe(timeout(3000))
      ).catch(() => {
        console.log('⏱️ [Home] Timeout esperando estado de auriculares');
        return false;
      });

      console.log('📊 [Home] VALOR RECIBIDO - connected:', connected);
      console.log('📊 [Home] Tipo de dato:', typeof connected);
      console.log('📊 [Home] ¿Es true?', connected === true);
      console.log('📊 [Home] ¿Es false?', connected === false);
      
      this.areHeadphonesConnected.set(connected);
      
      console.log('📊 [Home] Estado de banderas:');
      console.log('  - welcomeShown (global):', this.voiceContext.isWelcomeShown());
      console.log('  - initialCheckDone:', this.initialCheckDone);
      console.log('  - connected:', connected);
      
      this.initialCheckDone = true;
      console.log('✅ [Home] Verificación inicial COMPLETADA - initialCheckDone = true');

      console.log('📊 [Home] Evaluando condición:');
      console.log('  - connected:', connected);
      console.log('  - !welcomeShown (global):', !this.voiceContext.isWelcomeShown());
      console.log('  - Resultado:', connected && !this.voiceContext.isWelcomeShown());
      
      // ✅ NUEVOS LOGS PARA DEPURAR
      console.log('🔍 [Home] checkInitialHeadphones - welcomeShown:', this.voiceContext.isWelcomeShown());
      console.log('🔍 [Home] checkInitialHeadphones - connected:', connected);
      
      // ✅ Usar la bandera GLOBAL del contexto
      if (connected && !this.voiceContext.isWelcomeShown()) {
        console.log('🔴 [Home] ¡SE VA A EMITIR LA BIENVENIDA!');
        this.voiceContext.markWelcomeAsShown();
        console.log('📢 [Home] 🎯 PRIMERA VEZ (inicio) - Ejecutando bienvenida');
        this.showWelcomeSequence();
      } else {
        console.log('🟢 [Home] NO se emite bienvenida');
        console.log('⏭️ [Home] Inicio - No se cumple condición:');
        if (!connected) console.log('  - ❌ connected es false');
        if (this.voiceContext.isWelcomeShown()) console.log('  - ❌ welcomeShown es true (ya ejecutada)');
      }

    } catch (error) {
      console.error('❌ [Home] Error verificando estado inicial:', error);
      this.initialCheckDone = true;
    }
  }

  ngOnDestroy(): void {
    // ✅ Resetear bandera de navegación
    this.isNavigating = false;
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * ✅ SECUENCIA DE BIENVENIDA (SOLO UNA VEZ EN TODA LA APP)
   */
  private showWelcomeSequence(): void {
    console.log('📢 [Home] EJECUTANDO BIENVENIDA');

    const isMuted = this.voiceService.isCurrentlyMuted();

    let message = 'Bienvenido. ';

    if (isMuted) {
      message += 'Micrófono desactivado. Di "hola" para activarlo.';
    } else {
      message += 'Micrófono activado. Puedes decir "login", "acerca de", "registro" o "ayuda".';
    }

    console.log('📢 [Home] Mensaje a emitir:', message);

    // ✅ Pequeño retraso para que el reconocimiento no capture el eco
    setTimeout(() => {
      // ✅ Pasar `true` para que speakAlways active pendingPostTTSRestart
      //    y programe el reinicio del micro automáticamente
      this.voiceService.speakAlways(message, true)
        .then(() => {
          console.log('✅ [Home] Mensaje emitido');

          // ✅ Reinicio explícito del micro tras el TTS
          setTimeout(() => {
            if (!this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted()) {
              console.log('🎤 [Home] Bienvenida terminada → arrancando micro');
              this.voiceService.startListening();
            }
          }, 400);
        })
        .catch((err) => {
          console.warn('⚠️ [Home] speakAlways falló, arrancando micro igualmente', err);
          if (!this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted()) {
            this.voiceService.startListening();
          }
        });
    }, 500);
  }

  // ============================================================
  // ✅ MÉTODOS DEL BOTÓN (SIEMPRE FUNCIONAN)
  // ============================================================

  playSound(): void {
    if (!this.areHeadphonesConnected()) {
      this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
      return;
    }

    if (this.isMuted()) {
      this.voiceService.speakAlways(this.voiceContext.getMessage('micDeactivated'));
      return;
    }

    this.voiceService.speak('¡Sonido funcionando correctamente!');
  }

  toggleMic(): void {
    if (!this.areHeadphonesConnected()) {
      this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
      return;
    }
    this.voiceService.toggleMute();
  }

  getAvailableCommands(): string[] {
    return this.voiceContext.getAvailableCommands();
  }

  showHelp(): void {
    if (!this.areHeadphonesConnected()) {
      this.voiceService.speakAlways(this.voiceContext.getMessage('noHeadphones'));
      return;
    }
    
    const commands = this.voiceContext.getAvailableCommands();
    const helpMessage = `En esta página puedes usar: ${commands.join(', ')}. `;
    this.voiceService.speakAlways(helpMessage + this.voiceContext.getMessage('help'));
  }

  // ============================================================
  // ✅ NUEVO: CARRUSEL
  // ============================================================
  private loadImages(): void {
    this.http.get<string[]>('assets/img/images.json')
      .pipe(finalize(() => {
        if (this.slides().length === 0) {
          this.slides.set(['assets/img/carrusel/FondoConBarco.webp']);
          this.totalDuration.set(5);
        }
      }))
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            // Prefijar cada ruta con assets/img/
            const urls = data.map(p => `assets/img/${p}`);
            this.slides.set(urls);
            this.totalDuration.set(urls.length * 5);
            console.log('🎠 [Home] Carrusel cargado:', urls.length, 'imágenes');
          }
        },
        error: (err) => {
          console.warn('⚠️ [Home] Error cargando carrusel, usando respaldo.', err);
          this.slides.set(['assets/img/carrusel/FondoConBarco.webp']);
          this.totalDuration.set(5);
        }
      });
  }
}