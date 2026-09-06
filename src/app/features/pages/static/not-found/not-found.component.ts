// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-not-found',
//   templateUrl: './not-found.component.html',
//   styleUrls: ['./not-found.component.scss'],
//   imports: [],
// })
// export class NotFoundComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }


// src/app/features/pages/public/not-found/not-found.component.ts

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonCard, 
  IonCardHeader, 
  IonBadge, 
  IonIcon, 
  IonCardTitle, 
  IonCardContent, 
  IonChip, 
  IonLabel, 
  IonButton 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  mapOutline, 
  alertCircleOutline, 
  arrowBackOutline,
  homeOutline,
  logInOutline,
  helpCircleOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { VoiceContextService } from '../../../services/voz/voice-context.service';
import { VoiceService } from '../../../services/voz/voice.service';
import { PreviousRouteService } from '../../../../shared/services/router/previous-route.service';
import { ThemeService } from '../../../../shared/services/theme/theme';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonCard,
    IonCardHeader,
    IonBadge,
    IonIcon,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonLabel,
    IonButton
  ],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private previousRouteService = inject(PreviousRouteService);
  public themeService = inject(ThemeService);
  private voiceContext = inject(VoiceContextService);
  private voiceService = inject(VoiceService);

  readonly currentYear = new Date().getFullYear();
  private welcomeShown = false;
  private subscriptions: Subscription[] = [];

  constructor() {
    // ✅ IMPORTAR ICONOS DE IONIC
    addIcons({
      mapOutline,
      alertCircleOutline,
      arrowBackOutline,
      homeOutline,
      logInOutline,
      helpCircleOutline
    });
  }

  ngOnInit(): void {
    console.log('✅ NotFoundComponent inicializado (con voz contextual)');

    // ✅ Configurar contexto de voz para Not Found
    const context = {
      activationMessage: 'Página no encontrada. Puedes decir "volver" para regresar, "home" para ir al inicio, "login" para iniciar sesión, o "ayuda" para ver los comandos disponibles.',
      availableCommands: ['volver', 'atrás', 'regresar', 'home', 'inicio', 'login', 'ayuda'],
      preventBackend: true
    };
    this.voiceContext.setContext(context);

    // ✅ Suscribirse a comandos de voz
    this.subscriptions.push(
      this.voiceService.getTranscript().subscribe(transcript => {
        if (!transcript) return;
        this.handleVoiceCommand(transcript);
      })
    );

    // ✅ Mensaje de bienvenida local
    setTimeout(() => {
      this.showWelcomeMessage();
    }, 1000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.voiceContext.resetContext();
    console.log('🧹 NotFoundComponent destruido, contexto reseteado');
  }

  /**
   * ✅ MANEJAR COMANDOS DE VOZ DE NOT FOUND
   */
  private handleVoiceCommand(transcript: string): void {
    const lower = transcript.toLowerCase().trim();
    console.log('📝 [NotFound] Comando de voz recibido:', lower);

    // ✅ Comando "volver" - navegar a página anterior
    if (lower === 'volver' || lower === 'atrás' || lower === 'regresar' || lower === 'back') {
      console.log('🔙 [NotFound] Volviendo');
      this.voiceService.speak('Volviendo a la página anterior.');
      this.goBack();
      return;
    }

    // ✅ Comando "home" o "inicio" - navegar a home
    if (lower === 'home' || lower === 'inicio') {
      console.log('🏠 [NotFound] Navegando a inicio');
      this.voiceService.speak('Navegando a la página de inicio.');
      this.goHome();
      return;
    }

    // ✅ Comando "login" - navegar a login
    if (lower === 'login' || lower === 'iniciar sesion' || lower === 'inicio de sesion') {
      console.log('🔐 [NotFound] Navegando a login');
      this.voiceService.speak('Navegando a la página de inicio de sesión.');
      this.router.navigate(['/login']);
      return;
    }

    // ✅ Comando "ayuda"
    if (lower === 'ayuda' || lower === 'help') {
      console.log('❓ [NotFound] Mostrando ayuda');
      const commands = this.voiceContext.getAvailableCommands();
      const helpMessage = `En esta página puedes usar: ${commands.join(', ')}.`;
      this.voiceService.speakAlways(helpMessage);
      return;
    }

    // ✅ Comandos no reconocidos
    console.log('⏭️ [NotFound] Comando no reconocido en esta página:', lower);
  }

  /**
   * ✅ MENSAJE DE BIENVENIDA LOCAL
   */
  private showWelcomeMessage(): void {
    if (this.welcomeShown) return;
    this.welcomeShown = true;

    const isMuted = this.voiceService.isCurrentlyMuted();
    
    let message = 'Página no encontrada. ';
    
    if (isMuted) {
      message += 'El micrófono está desactivado. Di "hola" para activarlo.';
    } else {
      message += 'Puedes decir "volver" para regresar, "home" para ir al inicio, "login" para iniciar sesión, o "ayuda" para más información.';
    }
    
    console.log('📢 [NotFound] Mensaje de bienvenida:', message);
    this.voiceService.speak(message);
  }

  /**
   * ✅ IR A HOME
   */
  goHome(): void {
    this.router.navigate(['/home']);
  }

  /**
   * ✅ VOLVER A LA PÁGINA ANTERIOR
   */
  goBack(): void {
    const prevUrl = this.previousRouteService.getPreviousUrl() as unknown as string | null;
    console.log('🔙 URL anterior válida:', prevUrl);

    if (prevUrl && prevUrl !== this.router.url) {
      console.log(`🔜 Navegando a: ${prevUrl}`);
      this.router.navigateByUrl(prevUrl);
      return;
    }

    if (window.history.length > 1) {
      console.log('🔜 Navegando a home');
      this.router.navigate(['/home']);
    } else {
      console.warn('⚠️ No hay historial, yendo a /home');
      this.router.navigate(['/home']);
    }
  }
}