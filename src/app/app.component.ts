// // src/app/app.component.ts

// import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
// import { IonApp, IonContent, IonAlert } from '@ionic/angular';
// import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
// import { VoiceToggleComponent } from "./shared/components/voice-toggle/voice-toggle.component";
// import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
// import { ThemeService } from './shared/services/theme/theme';
// import { filter } from 'rxjs';
// import { VoiceService } from './features/services/voz/voice.service';
// import { VoiceContextService } from './features/services/voz/voice-context.service';
// import { Subscription } from 'rxjs';

// @Component({
//   selector: 'app-root',
//   templateUrl: 'app.component.html',
//   imports: [
//     IonApp, 
//     IonContent, 
//     RouterOutlet, 
//     VoiceToggleComponent,
//     ThemeToggleComponent
//   ],
// })
// export class AppComponent implements OnInit, OnDestroy {
//   themeService = inject(ThemeService);
//   private router = inject(Router);
//   private voiceService = inject(VoiceService);
//   private voiceContext = inject(VoiceContextService);
  
//   showToggle: boolean = true;
  
//   showVoiceToggle = signal<boolean>(false);
  
//   showPermissionAlert = signal<boolean>(false);
//   showNoDeviceAlert = signal<boolean>(false);
//   alertMessage = signal<string>('');
//   alertHeader = signal<string>('');
  
//   private subscriptions: Subscription[] = [];
//   private detectionTimeout: any = null;
  
//   // ✅ AÑADIR: Flag para controlar que solo se ejecute una vez
//   private detectionExecuted = false;

//   //
//   ngOnInit(): void {
//     // ✅ 1. Controlar visibilidad del ThemeToggle
//     this.router.events
//     .pipe(filter(event => event instanceof NavigationEnd))
//     .subscribe(() => {
//       // ✅ Avisar al VoiceService para que bloquee comandos de navegación
//       this.voiceService.onNavigate();

//       const routeData = this.getRouteData();
//       this.showToggle = routeData['showTheme'] !== false;
//       this.updateVoiceContextForRoute();
//     });



//     // ✅ 2. Controlar visibilidad del VoiceToggle y mensajes de auriculares (GLOBAL)
//     this.subscriptions.push(
//       this.voiceService.headphonesConnected$.subscribe(connected => {
//         const previousState = this.showVoiceToggle();
//         this.showVoiceToggle.set(connected);
//         console.log('🎧 [App] Estado de auriculares actualizado:', connected);
//         console.log('🎧 [App] VoiceToggle visible:', connected);

//         // ✅ DESCONEXIÓN: Siempre mostrar mensaje
//         if (!connected && previousState) {
//           console.log('🔇 [App] Auriculares DESCONECTADOS');
//           this.voiceService.speakAlways(
//             this.voiceContext.getMessage('headphonesDisconnected')
//           );
//           this.voiceService.mute();
//         }
//         // ✅ CONEXIÓN: Mostrar mensaje solo si la bienvenida ya se mostró
//         // (evita cortar la bienvenida del Home al arranque)
//         else if (connected && !previousState) {
//           console.log('🎧 [App] Auriculares CONECTADOS');
          
//           if (this.voiceContext.isWelcomeShown()) {
//             console.log('🔊 [App] Bienvenida ya mostrada, emitiendo aviso de auriculares');
//             this.voiceService.speakAlways(
//               this.voiceContext.getMessage('headphonesConnected')
//             );
//           } else {
//             console.log('⏭️ [App] Bienvenida aún no mostrada, omitiendo aviso de auriculares');
//           }
          
//           // ✅ Actualizar contexto según la ruta actual
//           this.updateVoiceContextForRoute();
//         }
        
//         if (connected) {
//           this.updateVoiceContextForRoute();
//         }
//       })
//     );

//     // ✅ 3. Escuchar errores del VoiceService
//     this.subscriptions.push(
//       this.voiceService.error$.subscribe(error => {
//         console.log('🔴 [App] Error recibido:', error);
        
//         if (error === 'PERMISSION_DENIED') {
//           this.showPermissionGuide();
//         } else if (error === 'NO_AUDIO_DEVICE') {
//           this.showNoDeviceAlertFn();
//         }
//       })
//     );

//     // ✅ 4. Escuchar cambios de contexto
//     this.subscriptions.push(
//       this.voiceContext.context$.subscribe(context => {
//         console.log('📋 [App] Contexto de voz actualizado:', context);
//       })
//     );

//     // ✅ 5. Verificar estado inicial SOLO UNA VEZ
//     this.detectionTimeout = setTimeout(async () => {
//       if (!this.detectionExecuted) {
//         this.detectionExecuted = true;
//         console.log('🎤 [App] Iniciando detección real de auriculares...');
        
//         const connected = await this.voiceService.isHeadphonesConnected();
//         this.showVoiceToggle.set(connected);
//         console.log('🎧 [App] VoiceToggle inicial:', connected);
//       } else {
//         console.log('⏭️ [App] Detección ya ejecutada, omitiendo...');
//       }
      
//       this.detectionTimeout = null;
//     }, 2000);

//     console.log('🎤 VoiceService inicializado desde AppComponent');
//   }

//   /**
//    * ✅ Actualizar el contexto de voz según la ruta actual
//    */
//   private updateVoiceContextForRoute(): void {
//     const url = this.router.url;
    
//     if (url.includes('/login')) {
//       this.voiceContext.setLoginContext();
//     } else if (url.includes('/register') || url.includes('/registro')) {
//       this.voiceContext.setRegisterContext();
//     } else if (url.includes('/about') || url.includes('/acerca-de')) {
//       this.voiceContext.setAboutContext();
//     } else if (url.includes('/dashboard') || url.includes('/panel')) {
//       this.voiceContext.setDashboardContext();
//     } else if (url === '/' || url.includes('/home') || url.includes('/inicio')) {
//       this.voiceContext.setHomeContext();
//     } else {
//       this.voiceContext.resetContext();
//     }
//   }

//   /**
//    * ✅ Manejar cambios en el estado de auriculares
//    */
//   private handleHeadphoneStatusChange(connected: boolean): void {
//     if (connected) {
//       console.log('🎧 [App] Auriculares CONECTADOS');
//       this.updateVoiceContextForRoute();
//     } else {
//       console.log('🔇 [App] Auriculares DESCONECTADOS');
//       this.voiceService.mute();
      
//       setTimeout(() => {
//         this.voiceService.speakAlways(
//           this.voiceContext.getMessage('headphonesDisconnected')
//         );
//       }, 300);
//     }
//   }

//   ngOnDestroy(): void {
//     if (this.detectionTimeout) {
//       clearTimeout(this.detectionTimeout);
//       this.detectionTimeout = null;
//     }
//     this.subscriptions.forEach(sub => sub.unsubscribe());
//   }

//   private getRouteData(): any {
//     let route = this.router.routerState.snapshot.root;
//     while (route.firstChild) {
//       route = route.firstChild;
//     }
//     return route.data || {};
//   }

//   private showPermissionGuide(): void {
//     this.alertHeader.set('🔴 Permiso de micrófono');
//     this.alertMessage.set(`
//       ${this.voiceContext.getMessage('permissionDenied')}
      
//       <strong>¿Cómo configurarlo?</strong>
//       <ol>
//         <li>Haz clic en el candado 🔒 en la barra de direcciones</li>
//         <li>Ve a <strong>Permisos</strong> → <strong>Micrófono</strong></li>
//         <li>Cambia a <strong>Permitir</strong></li>
//         <li>Recarga la página (<strong>Ctrl + Shift + R</strong>)</li>
//       </ol>
//     `);
//     this.showPermissionAlert.set(true);
//   }

//   private showNoDeviceAlertFn(): void {
//     this.alertHeader.set('🔴 Sin dispositivo de audio');
//     this.alertMessage.set(`
//       ${this.voiceContext.getMessage('noAudioDevice')}
      
//       Conecta un <strong>micrófono</strong> o <strong>auriculares</strong> y vuelve a intentarlo.
//     `);
//     this.showNoDeviceAlert.set(true);
//   }

//   async retryDetection(): Promise<void> {
//     console.log('🔄 [App] Reintentando detección de auriculares...');
//     const connected = await this.voiceService.forceHeadphonesDetection();
//     this.showVoiceToggle.set(connected);
    
//     if (connected) {
//       this.voiceService.speakAlways(
//         this.voiceContext.getMessage('headphonesConnected')
//       );
//       this.updateVoiceContextForRoute();
//     } else {
//       this.voiceService.speakAlways(
//         this.voiceContext.getMessage('noHeadphones')
//       );
//     }
//   }

//   updateVoiceContext(page: 'login' | 'home' | 'about' | 'register' | 'dashboard'): void {
//     this.voiceService.setContextForPage(page);
//   }
// }











// src/app/app.component.ts

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { IonApp } from '@ionic/angular';
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { VoiceToggleComponent } from "./shared/components/voice-toggle/voice-toggle.component";
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';
import { ThemeService } from './shared/services/theme/theme';
import { filter, Subscription } from 'rxjs';
import { VoiceService } from './features/services/voz/voice.service';
import { VoiceContextService } from './features/services/voz/voice-context.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonApp,
    RouterOutlet,
    VoiceToggleComponent,
    ThemeToggleComponent
],
})
export class AppComponent implements OnInit, OnDestroy {
  themeService = inject(ThemeService);
  private router = inject(Router);
  private voiceService = inject(VoiceService);
  private voiceContext = inject(VoiceContextService);

  showToggle: boolean = true;

  showVoiceToggle = signal<boolean>(false);

  showPermissionAlert = signal<boolean>(false);
  showNoDeviceAlert = signal<boolean>(false);
  alertMessage = signal<string>('');
  alertHeader = signal<string>('');

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // ✅ 1. Navegación: bloqueo de comandos + tema + contexto
    this.subscriptions.push(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.voiceService.onNavigate();

          const routeData = this.getRouteData();
          this.showToggle = routeData['showTheme'] !== false;
          this.updateVoiceContextForRoute();
        })
    );

    // ✅ 2. Estado de auriculares: SOLO UI.
    //     Los avisos por voz y el mute automático los hace VoiceService.
    this.subscriptions.push(
      this.voiceService.headphonesConnected$.subscribe(connected => {
        this.showVoiceToggle.set(connected);
        console.log('🎧 [App] VoiceToggle visible:', connected);
      })
    );

    // ✅ 3. Errores del VoiceService
    this.subscriptions.push(
      this.voiceService.error$.subscribe(error => {
        console.log('🔴 [App] Error recibido:', error);

        if (error === 'PERMISSION_DENIED') {
          this.showPermissionGuide();
        } else if (error === 'NO_AUDIO_DEVICE') {
          this.showNoDeviceAlertFn();
        }
      })
    );

    // ✅ 4. Cambios de contexto (log)
    this.subscriptions.push(
      this.voiceContext.context$.subscribe(context => {
        console.log('📋 [App] Contexto de voz actualizado:', context);
      })
    );

    console.log('🎤 VoiceService inicializado desde AppComponent');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * ✅ Actualizar el contexto de voz según la ruta actual
   */
  private updateVoiceContextForRoute(): void {
    const url = this.router.url;

    if (url.includes('/login')) {
      this.voiceContext.setLoginContext();
    } else if (url.includes('/register') || url.includes('/registro')) {
      this.voiceContext.setRegisterContext();
    } else if (url.includes('/about') || url.includes('/acerca-de')) {
      this.voiceContext.setAboutContext();
    } else if (url.includes('/dashboard') || url.includes('/panel')) {
      this.voiceContext.setDashboardContext();
    } else if (url === '/' || url.includes('/home') || url.includes('/inicio')) {
      this.voiceContext.setHomeContext();
    } else {
      this.voiceContext.resetContext();
    }
  }

  private getRouteData(): any {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data || {};
  }

  private showPermissionGuide(): void {
    this.alertHeader.set('🔴 Permiso de micrófono');
    this.alertMessage.set(`
      ${this.voiceContext.getMessage('permissionDenied')}

      <strong>¿Cómo configurarlo?</strong>
      <ol>
        <li>Haz clic en el candado 🔒 en la barra de direcciones</li>
        <li>Ve a <strong>Permisos</strong> → <strong>Micrófono</strong></li>
        <li>Cambia a <strong>Permitir</strong></li>
        <li>Recarga la página (<strong>Ctrl + Shift + R</strong>)</li>
      </ol>
    `);
    this.showPermissionAlert.set(true);
  }

  private showNoDeviceAlertFn(): void {
    this.alertHeader.set('🔴 Sin dispositivo de audio');
    this.alertMessage.set(`
      ${this.voiceContext.getMessage('noAudioDevice')}

      Conecta un <strong>micrófono</strong> o <strong>auriculares</strong> y vuelve a intentarlo.
    `);
    this.showNoDeviceAlert.set(true);
  }

  async retryDetection(): Promise<void> {
    console.log('🔄 [App] Reintentando detección de auriculares...');
    const connected = await this.voiceService.forceHeadphonesDetection();
    this.showVoiceToggle.set(connected);
    // ✅ Ya no hablamos aquí: VoiceService emite los avisos al cambiar el estado.
  }

  updateVoiceContext(page: 'login' | 'home' | 'about' | 'register' | 'dashboard'): void {
    this.voiceService.setContextForPage(page);
  }
}