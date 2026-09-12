// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-maintenance',
//   templateUrl: './maintenance.component.html',
//   styleUrls: ['./maintenance.component.scss'],
//   imports: [],
// })
// export class MaintenanceComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }




// src/app/features/pages/static/maintenance/maintenance.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  ChangeDetectorRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Subscription, interval, switchMap, startWith, catchError, of } from 'rxjs';

// ✅ IONIC standalone imports (sustituyen a MatButtonModule y MatIconModule)
import {
  IonContent,
  IonIcon,
  IonButton,
  IonSpinner,
} from '@ionic/angular';

// ✅ Iconos de ionicons (equivalencias de los MatIcon)
import { addIcons } from 'ionicons';
import {
  cloudOfflineOutline,
  refreshOutline,
  hourglassOutline,
  cloudUploadOutline,
  timeOutline,
} from 'ionicons/icons';

import { environment } from '../../../../../environments/environment';
import { VoiceService } from '../../../services/voz/voice.service';
import { ThemeService } from '../../../../shared/services/theme/theme';
import { AuthService } from '../../../auth/Services/auth-service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [
    RouterModule,
    IonContent,
    IonIcon,
    IonButton,
  ],
  templateUrl: './maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './maintenance.component.scss',
})
export class MaintenanceComponent implements OnInit, OnDestroy {
  public Math = Math;

  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);
  private themeService = inject(ThemeService);
  private voiceService = inject(VoiceService);
  private authService = inject(AuthService);

  private autoCheckSub?: Subscription;
  private isBrowser = isPlatformBrowser(this.platformId);
  private readonly healthUrl = environment.healthUrl;
  private voiceAnnounced = false;

  // 🔥 Estados UI
  public showServerDown = true;
  public showEurekaTimer = false;
  public isChecking = true;

  public readonly EUREKA_WAIT_SECONDS = 15;
  private eurekaEndTime: number = 0;
  public remainingSeconds = this.EUREKA_WAIT_SECONDS;
  public progressPercent = 0;
  private countdownInterval?: any;

  public isRetrying = false;
  public statusMessage = 'Verificando servidor...';

  // 🔥 Getter para el tema actual
  get currentTheme() {
    return this.themeService.currentTheme();
  }

  constructor() {
    // ✅ Registrar iconos usados en el HTML
    addIcons({
      cloudOfflineOutline,
      refreshOutline,
      hourglassOutline,
      cloudUploadOutline,
      timeOutline,
    });
  }

  ngOnInit() {
    if (this.isBrowser) {
      this.startHealthCheck();
      // Anunciar estado inicial después de un breve delay
      setTimeout(() => {
        this.announceVoiceMessage(
          'Bienvenido. Estamos verificando la conexión con el servidor. Por favor, espera unos segundos mientras comprobamos que todo está funcionando correctamente.'
        );
      }, 1500);
    } else {
      console.log('🔧 SSR: Componente de mantenimiento renderizado en servidor');
    }
  }

  // ============================================================
  // 🗣️ FUNCIONES DE VOZ PARA ACCESIBILIDAD
  // ============================================================

  /**
   * Anuncia un mensaje de voz usando el VoiceService
   * 🔥 RETORNA Promise para poder esperar a que termine
   */
  private announceVoiceMessage(message: string, priority: boolean = true): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    // Evitar anuncios repetidos en el mismo estado
    if (this.voiceAnnounced && !priority) {
      return Promise.resolve();
    }

    console.log(`🗣️ [Accesibilidad] Anunciando: "${message}"`);

    // Usar speakAlways para que el mensaje se reproduzca incluso si el micrófono está muteado
    const result = this.voiceService.speakAlways(message);

    // Marcar que ya se anunció (excepto para mensajes prioritarios)
    if (!priority) {
      this.voiceAnnounced = true;
    }

    return result;
  }

  /**
   * Anuncia el estado actual del servidor con mensajes más explícitos
   */
  private announceServerStatus(status: 'up' | 'down' | 'reconnecting' | 'ready'): void {
    const messages = {
      'up': '¡Buenas noticias! El servidor ya está disponible. Estamos preparando todos los servicios para que puedas continuar.',
      'down': 'Lo sentimos, el servidor no está disponible en este momento. No te preocupes, estamos intentando reconectar automáticamente. Puedes esperar o pulsar el botón de reintentar.',
      'reconnecting': 'Estamos intentando reconectar con el servidor. Por favor, espera un momento mientras verificamos la conexión.',
      'ready': '¡Todo listo! El servidor ya está funcionando correctamente. Serás redirigido a la página de inicio de sesión en unos segundos para que puedas entrar con tu cuenta.'
    };

    const message = messages[status] || 'Estado del servidor desconocido. Por favor, espera un momento.';
    this.announceVoiceMessage(message, true);
  }

  // ============================================================
  // 🔥 LÓGICA DE MONITOREO (MODIFICADA CON VOZ)
  // ============================================================

  private startHealthCheck() {
    console.log('🔍 Iniciando monitoreo de salud en:', this.healthUrl);
    this.autoCheckSub = interval(5000)
      .pipe(
        startWith(0),
        switchMap(() => {
          return this.http.get(this.healthUrl, { timeout: 10000 }).pipe(
            catchError((error) => {
              console.log('❌ Backend no disponible:', error.status || error.message);

              // Solo anunciar si cambia el estado
              if (this.showEurekaTimer) {
                this.cancelEurekaTimer();
              }
              if (!this.showServerDown) {
                this.showServerDown = true;
                this.showEurekaTimer = false;
                this.statusMessage = 'Servidor no disponible. Reintentando en 5 segundos...';
                this.voiceAnnounced = false;
                this.announceServerStatus('down');
                this.cdr.detectChanges();
              }
              return of(null);
            })
          );
        })
      )
      .subscribe((response: any) => {
        if (response && response.status === 'UP') {
          console.log('✅ Servidor detectado. Iniciando temporizador de Eureka...');

          // Anunciar que el servidor está disponible
          if (this.showServerDown || !this.showEurekaTimer) {
            this.voiceAnnounced = false;
            this.announceServerStatus('up');
            this.startEurekaTimer();
          }
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * 🔥 Inicia el temporizador de Eureka (15 segundos)
   * Restaura los servicios antes de redirigir al login
   */
  private startEurekaTimer() {
    this.showServerDown = false;
    this.showEurekaTimer = true;
    this.isRetrying = false;
    this.eurekaEndTime = Date.now() + (this.EUREKA_WAIT_SECONDS * 1000);
    this.remainingSeconds = this.EUREKA_WAIT_SECONDS;
    this.progressPercent = 0;

    // ✅ RESTAURAR SERVICIOS AL INICIAR EL TEMPORIZADOR
    console.log('🔄 [Maintenance] Restaurando servicios...');
    this.authService.restartAuthService();   // ✅ Reiniciar Auth
    this.voiceService.restartVoiceService(); // ✅ Reiniciar Voice

    // ✅ Inicio - claro y conciso
    this.announceVoiceMessage(`Servidor disponible. Espera ${this.EUREKA_WAIT_SECONDS} segundos.`, true);

    console.log(`⏳ Eureka iniciando. Esperando ${this.EUREKA_WAIT_SECONDS} segundos...`);
    if (this.countdownInterval) clearInterval(this.countdownInterval);

    let announcedHalfway = false;

    this.countdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((this.eurekaEndTime - Date.now()) / 1000));
      this.remainingSeconds = remaining;
      this.progressPercent = ((this.EUREKA_WAIT_SECONDS - remaining) / this.EUREKA_WAIT_SECONDS) * 100;

      // ✅ Solo un mensaje a mitad del proceso (solo una vez)
      if (remaining === 7 && !announcedHalfway) {
        announcedHalfway = true;
        this.announceVoiceMessage('Preparando servicios. Un momento por favor.', false);
      }

      if (remaining === 0) {
        clearInterval(this.countdownInterval);
        console.log('✅ Eureka listo. Redirigiendo a login...');

        // ✅ ESPERAR A QUE TERMINE EL MENSAJE FINAL
        this.announceVoiceMessage('Listo para iniciar sesión.', true)
          .then(() => {
            console.log('✅ Mensaje completado, redirigiendo...');
            setTimeout(() => {
              this.router.navigate(['/login'], { queryParams: { from: 'maintenance' } });
            }, 500);
          })
          .catch(() => {
            console.log('⚠️ Mensaje interrumpido, redirigiendo...');
            setTimeout(() => {
              this.router.navigate(['/login'], { queryParams: { from: 'maintenance' } });
            }, 500);
          });
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  /**
   * Cancela el temporizador de Eureka
   */
  private cancelEurekaTimer() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
    this.showEurekaTimer = false;
    console.log('❌ Temporizador de Eureka cancelado');
  }

  /**
   * Reintento manual de conexión
   */
  retry() {
    if (!this.isBrowser) return;
    console.log('🔄 Reintento manual solicitado');
    this.isRetrying = true;
    this.statusMessage = 'Reintentando conexión...';
    this.voiceAnnounced = false;

    this.announceVoiceMessage(
      'Estás intentando reconectar manualmente. Vamos a verificar el estado del servidor. Por favor, espera un momento.',
      true
    );

    this.cdr.detectChanges();

    this.http.get(this.healthUrl, { timeout: 10000 }).subscribe({
      next: (response: any) => {
        if (response && response.status === 'UP') {
          console.log('✅ Backend disponible. Iniciando temporizador de Eureka...');
          this.voiceAnnounced = false;
          this.announceServerStatus('up');
          this.startEurekaTimer();
        } else {
          this.statusMessage = 'El servidor respondió pero no está listo. Reintentando...';
          this.isRetrying = false;
          this.announceVoiceMessage(
            'El servidor ha respondido, pero aún no está completamente listo. Vamos a seguir intentando automáticamente.',
            true
          );
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.statusMessage = 'Servidor no disponible. Reintentando en 5 segundos...';
        this.isRetrying = false;
        this.announceServerStatus('down');
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    if (this.isBrowser && this.autoCheckSub) {
      this.autoCheckSub.unsubscribe();
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
}