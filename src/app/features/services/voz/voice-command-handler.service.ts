// import { Injectable, inject, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import { Location } from '@angular/common'; // ✅ Importar Location
// import { Subscription, Subject } from 'rxjs';
// import { VoiceService } from './voice.service';
// import { VoiceCommandOrchestratorService } from './voice-command-orchestrator.service';
// import { LoggerService } from '../../../shared/services/loggers/logger.service';
// import { VoiceContextService } from './voice-context.service';

// @Injectable({ providedIn: 'root' })
// export class VoiceCommandHandlerService implements OnDestroy {
//   private voiceService = inject(VoiceService);
//   private orchestrator = inject(VoiceCommandOrchestratorService);
//   private router = inject(Router);
//   private location = inject(Location); // ✅ Inyectado
//   private logger = inject(LoggerService);
//   private voiceContext = inject(VoiceContextService);
//   private subscription?: Subscription;

//   public contextCommand$ = new Subject<string>();

//   constructor() {
//     this.subscription = this.voiceService.getTranscript().subscribe(transcript => {
//       this.handleCommand(transcript);
//     });
//   }

//   ngOnDestroy(): void {
//     this.subscription?.unsubscribe();
//     this.contextCommand$.complete();
//   }

//   private handleCommand(transcript: string): void {
//     const lower = transcript.toLowerCase().trim();
//     const context = this.voiceContext.getContext();

//     // ============================================================
//     // 1️⃣ COMANDOS CONTEXTUALES (prioridad)
//     // ============================================================
//     const available = context.availableCommands || [];
//     const isContextCommand = available.some(cmd => lower.includes(cmd));

//     if (isContextCommand) {
//       // Navegación contextual (sin "volver")
//       if (lower.includes('acerca de') || lower.includes('quiénes somos')) {
//         this.router.navigate(['/about']);
//         return;
//       }
//       if (lower.includes('login') || lower.includes('iniciar sesión')) {
//         this.router.navigate(['/login']);
//         return;
//       }
//       // if (lower.includes('inicio')) {
//       //   this.router.navigate(['/']);
//       //   return;
//       // }
//       if (lower === 'inicio' || lower.startsWith('ir al inicio')) {
//         this.router.navigate(['/']);
//         return;
//       }
//       // ✅ Resto de comandos contextuales se emiten (no incluimos "volver")
//       this.contextCommand$.next(transcript);
//       return;
//     }

//     // ============================================================
//     // 2️⃣ COMANDOS GLOBALES
//     // ============================================================
//     if (lower.includes('login') || lower.includes('iniciar sesión') || lower.includes('acceder')) {
//       this.router.navigate(['/login']);
//       return;
//     }

//     if (lower.includes('acerca') || lower.includes('quienes somos')) {
//       this.router.navigate(['/about']);
//       return;
//     }

//     // if (lower.includes('inicio') || lower.includes('welcome') || lower.includes('principal')) {
//     //   this.router.navigate(['/']);
//     //   return;
//     // }

//     if (lower === 'inicio' || lower === 'ir al inicio' || lower === 'página principal' || lower === 'pagina principal') {
//       this.router.navigate(['/']);
//       return;
//     }

//     if (lower.includes('registro') || lower.includes('registrar') || lower.includes('crear cuenta')) {
//       this.router.navigate(['/register']);
//       return;
//     }

//     if (lower.includes('ayuda') || lower.includes('help') || lower.includes('qué puedo decir')) {
//       this.voiceService.speak(
//         'Puedes decir "login" para ir al inicio de sesión, "acerca" para información, "inicio" para volver al inicio, o "registro" para crear una cuenta.'
//       );
//       return;
//     }

//     if (lower.includes('reportar') || lower.includes('reporte')) {
//       this.router.navigate(['/contact']);
//       return;
//     }

//     // ✅ COMANDO "VOLVER" GLOBAL (con location.back())
//     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
//       try {
//         this.location.back(); // ✅ Navega a la página anterior
//       } catch {
//         this.router.navigate(['/']); // Fallback a inicio
//       }
//       return;
//     }

//     // ============================================================
//     // 3️⃣ DELEGAR AL ORQUESTADOR (BACKEND)
//     // ============================================================
//     if (this.orchestrator.isFullyAvailable()) {
//       this.logger.log(`📤 Enviando al backend: "${transcript}"`);
//       this.orchestrator.sendTextCommand(transcript);
//     } else {
//       this.voiceService.speak('Lo siento, no entiendo ese comando. Prueba con "ayuda" para ver opciones.');
//     }
//   }
// }








// src/app/features/services/voz/voice-command-handler.service.ts

import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription, Subject } from 'rxjs';
import { VoiceService } from './voice.service';
import { VoiceCommandOrchestratorService } from './voice-command-orchestrator.service';
import { LoggerService } from '../../../shared/services/loggers/logger.service';
import { VoiceContextService } from './voice-context.service';

@Injectable({ providedIn: 'root' })
export class VoiceCommandHandlerService implements OnDestroy {
  private voiceService = inject(VoiceService);
  private orchestrator = inject(VoiceCommandOrchestratorService);
  private router = inject(Router);
  private location = inject(Location);
  private logger = inject(LoggerService);
  private voiceContext = inject(VoiceContextService);
  private subscription?: Subscription;

  public contextCommand$ = new Subject<string>();

  constructor() {
    this.subscription = this.voiceService.getTranscript().subscribe(transcript => {
      this.handleCommand(transcript);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.contextCommand$.complete();
  }

  private handleCommand(transcript: string): void {
    const lower = transcript.toLowerCase().trim();
    const context = this.voiceContext.getContext();

    // ============================================================
    // 1️⃣ COMANDOS CONTEXTUALES (prioridad)
    // ============================================================
    const available = context.availableCommands || [];
    const isContextCommand = available.some(cmd => lower.includes(cmd));

    if (isContextCommand) {
      // Navegación contextual (sin "volver")
      if (lower === 'acerca de' || lower === 'acerca' || lower.includes('quiénes somos')) {
        this.router.navigate(['/about']);
        return;
      }
      if (lower.includes('login') || lower.includes('iniciar sesión')) {
        this.router.navigate(['/login']);
        return;
      }
      if (lower === 'inicio' || lower.startsWith('ir al inicio')) {
        this.router.navigate(['/']);
        return;
      }
      // ✅ Resto de comandos contextuales se emiten (no incluimos "volver")
      this.contextCommand$.next(transcript);
      return;
    }

    // ============================================================
    // 2️⃣ COMANDOS GLOBALES
    // ============================================================
    if (lower.includes('login') || lower.includes('iniciar sesión') || lower === 'acceder') {
      this.router.navigate(['/login']);
      return;
    }

    if (lower.includes('acerca') || lower.includes('quienes somos')) {
      this.router.navigate(['/about']);
      return;
    }

    if (lower === 'inicio' || lower === 'ir al inicio' || lower === 'página principal' || lower === 'pagina principal') {
      this.router.navigate(['/']);
      return;
    }

    if (lower.includes('registro') || lower.includes('registrar') || lower.includes('crear cuenta')) {
      this.router.navigate(['/register']);
      return;
    }

    if (lower === 'reportar' || lower === 'reporte' || lower === 'contacto') {
      this.router.navigate(['/contact']);
      return;
    }

    // ❌ Eliminado el bloque de "ayuda" (ahora lo maneja cada componente con showHelp)
    // ❌ Eliminado el bloque de "volver" (ahora lo maneja cada componente con goBack)

    // ============================================================
    // 3️⃣ DELEGAR AL ORQUESTADOR (BACKEND)
    // ============================================================
    if (this.orchestrator.isFullyAvailable()) {
      this.logger.log(`📤 Enviando al backend: "${transcript}"`);
      this.orchestrator.sendTextCommand(transcript);
    } else {
      this.voiceService.speak('Lo siento, no entiendo ese comando. Prueba con "ayuda" para ver opciones.');
    }
  }
}