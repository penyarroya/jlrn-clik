// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-dashboard',
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.scss'],
//   imports: [],
// })
// export class DashboardComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }


// // src/app/features/pages/public/dashboard/dashboard.component.ts

// import { Component, OnInit, OnDestroy, inject, signal, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';
// import { HttpClient } from '@angular/common/http';

// // ✅ Ionic - SOLO lo que usas en el HTML
// // import { IonIcon, IonProgressBar, IonContent } from '@ionic/angular';
// import { IonIcon, IonContent } from '@ionic/angular';

// import { addIcons } from 'ionicons';
// import {
//   gridOutline,
//   bookOutline,
//   settingsOutline,
//   logOutOutline,
//   moonOutline,
//   sunnyOutline,
//   micOutline,
//   micOffOutline,
//   flashOutline,
//   hourglassOutline,
//   trendingUpOutline,
//   trendingDownOutline,
//   removeOutline,
//   personOutline,
//   schoolOutline,        // ✅ NUEVO (para "school-outline" del JSON)
//   checkboxOutline,      // ✅ NUEVO (para "checkbox-outline" del JSON)
//   helpCircleOutline     // ✅ NUEVO (para "help-circle-outline" del JSON)
// } from 'ionicons/icons';

// // Servicios
// import { VoiceService } from '../../../services/voz/voice.service';
// import { VoiceContextService } from '../../../services/voz/voice-context.service';
// import { UserPreferencesService } from '../../../../shared/services/user-preferences/user-preferences.service';
// import { UserPreferences } from '../../../../shared/models/user-preferences/user-preferences.model';
// import { ThemeService } from '../../../../shared/services/theme/theme';
// import { AuthService } from '../../../auth/Services/auth-service';
// import { ToolbarConfig, TransparentToolbarComponent, UserMenuItem } from '../../../../shared/components/transparent-toolbar/transparent-toolbar.component';
// import { ProjectConfigService } from '../../../services/dashboard/project-config-service';
// import { ProjectConfig, StatsCard, Course, QuickAction, SidebarItem } from '../../../models/dashboard/project-config.model';

// export interface ExternalToolbarConfig extends ToolbarConfig {
//   userMenuItems?: (UserMenuItem & { actionId?: string })[];
// }

// // interface SidebarItem {
// //   id: string;
// //   label: string;
// //   icon: string;
// //   route?: string;
// //   roles?: string[];
// // }

// @Component({
//   selector: 'app-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     IonIcon,
//     TransparentToolbarComponent,
//     IonContent
// ],
//   templateUrl: './dashboard.component.html',
//   styleUrls: ['./dashboard.component.scss']
// })
// export class DashboardComponent implements OnInit, OnDestroy {
//   // ============================================================
//   // INYECCIONES
//   // ============================================================
//   public router = inject(Router);
//   public voiceService = inject(VoiceService);
//   private voiceContext = inject(VoiceContextService);
//   private authService = inject(AuthService);
//   private themeService = inject(ThemeService);
//   private projectConfigService = inject(ProjectConfigService);
//   private userPreferences = inject(UserPreferencesService);
//   private http = inject(HttpClient);

//   // ============================================================
//   // VARIABLES PRIVADAS
//   // ============================================================
//   private destroy$ = new Subject<void>();
//   private isDestroyed = false;
//   private timeInterval: any;

//   private actionMap: { [key: string]: () => void } = {
//     logout: () => this.logout(),
//   };

//   // ============================================================
//   // ESTADO (signals)
//   // ============================================================
//   currentTime = signal(new Date());
//   greeting = signal('');
//   currentTimeDisplay = signal('');
//   isDarkTheme = signal(false);
//   isMicActive = signal(true);
//   activeSection = signal('dashboard');
//   isSidebarCollapsed = signal(false);
//   isSidebarOpen = signal(false);

//   projectConfig = signal<ProjectConfig | null>(null);
//   availableProjects = ['informatica', 'huertos', 'salud', 'finanzas'];
//   currentProjectId = signal('informatica');

//   toolbarConfig = signal<ToolbarConfig>({});
//   sidebarItems = signal<SidebarItem[]>([]);

//   statsCards = signal<StatsCard[]>([]);
//   myCourses = signal<Course[]>([]);
//   quickActions = signal<QuickAction[]>([]);
//   isLoading = signal(true);

//   private welcomeShown = false;

//   // ============================================================
//   // GETTERS
//   // ============================================================
//   get userName(): string {
//     return this.authService.getUserName() || 'Usuario';
//   }

//   get userEmail(): string {
//     return this.authService.getUserEmail() || 'usuario@ejemplo.com';
//   }

//   get formattedCurrentTime(): string {
//     return this.currentTimeDisplay();
//   }

//   get isMicActuallyActive(): boolean {
//     return this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted();
//   }

//   get micButtonText(): string {
//     return this.isMicActuallyActive ? '🔴 Desactivar' : '🟢 Activar';
//   }

//   // ============================================================
//   // CONSTRUCTOR
//   // ============================================================
//   constructor() {
//     addIcons({
//       gridOutline,
//       bookOutline,
//       settingsOutline,
//       logOutOutline,
//       moonOutline,
//       sunnyOutline,
//       micOutline,
//       micOffOutline,
//       flashOutline,
//       hourglassOutline,
//       trendingUpOutline,
//       trendingDownOutline,
//       removeOutline,
//       personOutline,
//       schoolOutline,        // ✅ NUEVO
//       checkboxOutline,      // ✅ NUEVO
//       helpCircleOutline     // ✅ NUEVO
//     });
//   }

//   // ============================================================
//   // ROLES
//   // ============================================================
//   private getUserRoles(): string[] {
//     const user = this.authService.currentUser();
//     return user?.roles || [];
//   }

//   private filterItemsByRoles<T extends { roles?: string[] }>(items: T[]): T[] {
//     const userRoles = this.getUserRoles();
//     return items.filter(item => {
//       if (!item.roles || item.roles.length === 0) return true;
//       return item.roles.some(role => userRoles.includes(role));
//     });
//   }

//   // ============================================================
//   // CARGA DE TOOLBAR
//   // ============================================================
//   private loadToolbarConfig(): void {
//     console.log('📂 [Dashboard] Cargando toolbar desde: /assets/config/dashboard/toolbar-config.json');

//     this.http.get<ExternalToolbarConfig>('/assets/config/dashboard/toolbar-config.json')
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (config) => {
//           let userMenuItems = config.userMenuItems?.map(item => {
//             if (item.actionId && this.actionMap[item.actionId]) {
//               return { ...item, action: this.actionMap[item.actionId] };
//             }
//             if (item.actionId && !this.actionMap[item.actionId]) {
//               console.warn(`⚠️ Acción no mapeada: ${item.actionId}`);
//               const { actionId, ...rest } = item;
//               return rest;
//             }
//             return item;
//           }) || [];

//           const navLinks = this.filterItemsByRoles(config.navLinks || []);
//           userMenuItems = this.filterItemsByRoles(userMenuItems);

//           this.toolbarConfig.set({
//             ...config,
//             navLinks,
//             userMenuItems
//           });

//           console.log('✅ Toolbar config cargada:', this.toolbarConfig());
//         },
//         error: (err) => {
//           console.error('❌ Error al cargar configuración del toolbar:', err);
//           this.toolbarConfig.set(this.getDefaultToolbarConfig());
//         }
//       });
//   }

//   private getDefaultToolbarConfig(): ToolbarConfig {
//     return {
//       title: 'Centro de Ayuda Digital',
//       showLogo: true,
//       showThemeToggle: true,
//       showMicToggle: true,
//       showUserAvatar: true,
//       showBackButton: false,
//       showHelp: true,
//       navLinks: [
//         { label: 'Dashboard', route: '/dashboard', icon: 'grid-outline', roles: ['USER'] }
//       ],
//       userMenuItems: [
//         { label: 'Mi Perfil', icon: 'person-outline', route: '/profile' },
//         { label: 'Configuración', icon: 'settings-outline', route: '/settings' },
//         { label: 'Preferencias de Voz', icon: 'mic-outline', route: '/voice-settings' },
//         { isDivider: true },
//         {
//           label: 'Cerrar Sesión',
//           icon: 'log-out-outline',
//           class: 'logout-item',
//           action: () => this.logout()
//         }
//       ],
//       unreadNotifications: 0
//     };
//   }

//   // ============================================================
//   // CARGA DE SIDEBAR
//   // ============================================================
//   private loadSidebarConfig(): void {
//     console.log('📂 [Dashboard] Cargando sidebar desde: /assets/config/dashboard/sidebar-config.json');

//     this.http.get<{ sidebarItems: SidebarItem[] }>('/assets/config/dashboard/sidebar-config.json')
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           this.sidebarItems.set(this.filterItemsByRoles(response.sidebarItems));
//           console.log('✅ Sidebar config cargada:', this.sidebarItems());
//         },
//         error: (err) => {
//           console.error('❌ Error al cargar sidebar:', err);
//           this.sidebarItems.set(this.getDefaultSidebarItems());
//         }
//       });
//   }

//   private getDefaultSidebarItems(): SidebarItem[] {
//     return [
//       { id: 'dashboard', label: 'Panel Principal', icon: 'grid-outline', roles: ['USER'] }
//     ];
//   }

//   onSidebarItemClick(item: SidebarItem): void {
//     if (item.route) {
//       this.router.navigate([item.route]);
//     } else {
//       this.setActiveSection(item.id);
//     }
//     if (window.innerWidth < 768) {
//       this.isSidebarOpen.set(false);
//     }
//   }

//   // ============================================================
//   // SIDEBAR
//   // ============================================================
//   toggleSidebar(): void {
//     this.isSidebarCollapsed.update(v => !v);
//     this.userPreferences.updatePreference('sidebarCollapsed', this.isSidebarCollapsed()).subscribe();
//   }

//   toggleSidebarMobile(): void {
//     this.isSidebarOpen.update(v => !v);
//   }

//   setActiveSection(section: string): void {
//     this.activeSection.set(section);
//     this.userPreferences.updatePreference('lastVisitedSection', section).subscribe();
//     if (window.innerWidth < 768) {
//       this.isSidebarOpen.set(false);
//     }
//   }

//   // ============================================================
//   // CICLO DE VIDA
//   // ============================================================
//   ngOnInit(): void {
//     console.log('🚀 Dashboard inicializado');

//     const prefs = this.userPreferences.getCurrentPreferences();
//     this.applyPreferences(prefs);

//     this.userPreferences.preferences$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(prefs => {
//         if (prefs) {
//           this.applyPreferences(prefs);
//         }
//       });

//     this.loadToolbarConfig();
//     this.loadSidebarConfig();

//     this.updateTimeDisplay();
//     this.timeInterval = setInterval(() => {
//       this.currentTime.set(new Date());
//       this.greeting.set(this.getGreeting());
//       this.updateTimeDisplay();
//     }, 1000);

//     this.greeting.set(this.getGreeting());

//     const projectId = this.userPreferences.getPreference('activeProjectId') || 'informatica';
//     this.loadProject(projectId);

//     this.setupVoiceContext();

//     this.voiceService
//       .getTranscript()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((text: string) => {
//         if (this.isDestroyed || !text) return;
//         this.handleVoiceCommand(text);
//       });

//     setTimeout(() => {
//       this.showWelcomeMessage();
//     }, 1500);

//     setTimeout(() => {
//       if (!this.isDestroyed) {
//         this.initializeMicState();
//       }
//     }, 500);
//   }

//   private applyPreferences(prefs: UserPreferences): void {
//     this.isDarkTheme.set(prefs.theme === 'dark');
//     this.isSidebarCollapsed.set(prefs.sidebarCollapsed || false);
//     this.activeSection.set(prefs.lastVisitedSection || 'dashboard');
//     this.isMicActive.set(prefs.micEnabled);
//     this.currentProjectId.set(prefs.activeProjectId || 'informatica');
//   }

//   private initializeMicState(): void {
//     const isMicActive = this.voiceService.isRecognitionActive();
//     const isMuted = this.voiceService.isCurrentlyMuted();

//     console.log(`🎤 [Dashboard] Micrófono: ${isMicActive ? '✅ ACTIVO' : '❌ INACTIVO'}, Muteado: ${isMuted}`);

//     if (this.userPreferences.getPreference('micEnabled') === false) {
//       if (isMicActive) {
//         this.voiceService.mute();
//         this.isMicActive.set(false);
//       }
//       return;
//     }

//     if (!isMicActive && !isMuted) {
//       this.voiceService.startListening();
//       this.isMicActive.set(true);
//     }
//   }

//   // ============================================================
//   // CARGAR PROYECTO
//   // ============================================================
//   loadProject(projectId: string): void {
//     this.isLoading.set(true);
//     this.currentProjectId.set(projectId);

//     this.userPreferences.updatePreference('activeProjectId', projectId).subscribe();

//     this.projectConfigService.loadProjectConfig(projectId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (config) => {
//           this.projectConfig.set(config);
//           this.statsCards.set(config.statsCards);
//           this.myCourses.set(config.courses);
//           this.quickActions.set(config.quickActions);
//           this.isLoading.set(false);
//           console.log(`✅ Proyecto cargado: ${config.projectName}`);
//         },
//         error: (err) => {
//           console.error('❌ Error cargando proyecto:', err);
//           this.loadDefaultData();
//           this.isLoading.set(false);
//         }
//       });
//   }

//   loadDefaultData(): void {
//     this.statsCards.set([
//       { icon: 'grid-outline', label: 'Proyectos', value: 1, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
//     ]);
//     this.myCourses.set([]);
//     this.quickActions.set([]);
//   }

//   // ============================================================
//   // VOZ
//   // ============================================================
//   private setupVoiceContext(): void {
//     const context = {
//       activationMessage: `Bienvenido de vuelta ${this.userName}.`,
//       availableCommands: ['dashboard', 'inicio', 'ayuda', 'silenciar', 'activar'],
//       preventBackend: true
//     };
//     this.voiceContext.setContext(context);
//   }

//   private handleVoiceCommand(text: string): void {
//     const lower = text.toLowerCase().trim();
//     console.log(`📝 [Dashboard] Comando recibido: "${lower}"`);

//     if (lower.includes('dashboard') || lower.includes('inicio') || lower.includes('panel')) {
//       this.setActiveSection('dashboard');
//       this.voiceService.speak('Navegando al panel principal');
//       return;
//     }

//     if (lower.includes('ayuda')) {
//       this.showHelp();
//       return;
//     }

//     if (lower.includes('silenciar') || lower.includes('activar')) {
//       this.toggleMic();
//       return;
//     }
//   }

//   // ============================================================
//   // BIENVENIDA
//   // ============================================================
//   private showWelcomeMessage(): void {
//     if (this.isDestroyed || this.welcomeShown) return;

//     if (this.userPreferences.getPreference('welcomeShown')) {
//       this.welcomeShown = true;
//       return;
//     }

//     this.welcomeShown = true;
//     const message = this.projectConfig()?.welcomeMessage || `Hola ${this.userName}, bienvenido.`;

//     if (!this.voiceService.hasWelcomeBeenShown('dashboard')) {
//       this.voiceService.markWelcomeAsShown('dashboard');
//       this.voiceService.speakWhenReady(message);
//       this.userPreferences.updatePreference('welcomeShown', true).subscribe();
//     }
//   }

//   // ============================================================
//   // UTILIDADES
//   // ============================================================
//   private getGreeting(): string {
//     const hour = this.currentTime().getHours();
//     if (hour < 12) return 'Buenos días 🌅';
//     if (hour < 18) return 'Buenas tardes ☀️';
//     return 'Buenas noches 🌙';
//   }

//   private updateTimeDisplay(): void {
//     this.currentTimeDisplay.set(new Intl.DateTimeFormat('es-ES', {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//       hour12: false
//     }).format(this.currentTime()));
//   }

//   showHelp(): void {
//     this.voiceService.speak('Puedes usar comandos de voz como: dashboard, inicio, ayuda, silenciar o activar');
//   }

//   // ============================================================
//   // ACCIONES
//   // ============================================================
//   toggleMic(): void {
//     const isMuted = this.voiceService.isCurrentlyMuted();
//     const isActive = this.voiceService.isRecognitionActive();

//     if (isMuted || !isActive) {
//       this.voiceService.stopListening();
//       setTimeout(() => {
//         this.voiceService.unmute();
//         this.voiceService.startListening();
//         this.isMicActive.set(true);
//         this.voiceService.speak('Micrófono activado');
//         this.userPreferences.updatePreference('micEnabled', true).subscribe();
//       }, 300);
//     } else {
//       this.voiceService.mute();
//       this.isMicActive.set(false);
//       this.voiceService.speak('Micrófono desactivado');
//       this.userPreferences.updatePreference('micEnabled', false).subscribe();
//     }
//   }

//   toggleTheme(): void {
//     const newTheme = this.isDarkTheme() ? 'light' : 'dark';
//     this.themeService.setTheme(newTheme);
//     this.isDarkTheme.set(newTheme === 'dark');

//     this.userPreferences.updatePreference('theme', newTheme as 'light' | 'dark').subscribe({
//       next: () => console.log('✅ Tema guardado:', newTheme),
//       error: (error) => console.error('❌ Error guardando tema:', error)
//     });
//   }

//   logout(): void {
//     this.userPreferences.savePreferences({
//       sidebarCollapsed: this.isSidebarCollapsed(),
//       lastVisitedSection: this.activeSection(),
//       activeProjectId: this.currentProjectId(),
//       micEnabled: this.isMicActive()
//     }).subscribe();

//     this.authService.logout().subscribe({
//       next: () => {
//         this.voiceService.clearTranscript();
//         this.voiceService.speak('Sesión cerrada');
//         this.router.navigate(['/login']);
//       },
//       error: () => {
//         this.authService.fullLocalLogout();
//         this.router.navigate(['/login']);
//       }
//     });
//   }

//   goToLogin(): void {
//     this.router.navigate(['/login']);
//   }

//   // ============================================================
//   // HOST LISTENERS
//   // ============================================================
//   @HostListener('window:resize')
//   onResize(): void {
//     if (window.innerWidth >= 768 && this.isSidebarOpen()) {
//       this.isSidebarOpen.set(false);
//     }
//   }

//   // ============================================================
//   // DESTROY
//   // ============================================================
//   ngOnDestroy(): void {
//     this.isDestroyed = true;
//     this.destroy$.next();
//     this.destroy$.complete();

//     if (this.timeInterval) {
//       clearInterval(this.timeInterval);
//     }

//     this.userPreferences.savePreferences({
//       sidebarCollapsed: this.isSidebarCollapsed(),
//       lastVisitedSection: this.activeSection(),
//       activeProjectId: this.currentProjectId(),
//       micEnabled: this.isMicActive()
//     }).subscribe();

//     this.voiceContext.resetContext();
//     window.speechSynthesis.cancel();
//     console.log('🧹 Dashboard destruido');
//   }
// }












// src/app/features/pages/public/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ✅ Ionic - SOLO lo que usas en el HTML
import { IonIcon, IonContent } from '@ionic/angular';

import { addIcons } from 'ionicons';
import {
  gridOutline,
  bookOutline,
  settingsOutline,
  logOutOutline,
  moonOutline,
  sunnyOutline,
  micOutline,
  micOffOutline,
  flashOutline,
  hourglassOutline,
  trendingUpOutline,
  trendingDownOutline,
  removeOutline,
  personOutline,
  schoolOutline,
  checkboxOutline,
  helpCircleOutline
} from 'ionicons/icons';

// Servicios
import { VoiceService } from '../../../services/voz/voice.service';
import { VoiceContextService } from '../../../services/voz/voice-context.service';
import { UserPreferencesService } from '../../../../shared/services/user-preferences/user-preferences.service';
import { UserPreferences } from '../../../../shared/models/user-preferences/user-preferences.model';
import { ThemeService } from '../../../../shared/services/theme/theme';
import { AuthService } from '../../../auth/Services/auth-service';
import { ToolbarConfig, TransparentToolbarComponent, UserMenuItem } from '../../../../shared/components/transparent-toolbar/transparent-toolbar.component';
import { ProjectConfigService } from '../../../services/dashboard/project-config-service';
import { ProjectConfig, StatsCard, Course, QuickAction, SidebarItem } from '../../../models/dashboard/project-config.model';

export interface ExternalToolbarConfig extends ToolbarConfig {
  userMenuItems?: (UserMenuItem & { actionId?: string })[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    TransparentToolbarComponent,
    IonContent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ============================================================
  // INYECCIONES
  // ============================================================
  public router = inject(Router);
  public voiceService = inject(VoiceService);
  private voiceContext = inject(VoiceContextService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private projectConfigService = inject(ProjectConfigService);
  private userPreferences = inject(UserPreferencesService);
  private http = inject(HttpClient);

  // ============================================================
  // VARIABLES PRIVADAS
  // ============================================================
  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private timeInterval: any;

  private actionMap: { [key: string]: () => void } = {
    logout: () => this.logout(),
    help: () => this.showHelp(),
    toggleMic: () => this.toggleMic(),
    toggleTheme: () => this.toggleTheme()
  };

  // ✅ NUEVO: control de comandos
  private lastProcessedCommand = '';
  private lastProcessedTime = 0;
  private readonly COMMAND_DEBOUNCE = 1500;

  // ✅ NUEVO: anuncio de entrada al Dashboard
  private announcementDone = false;

  // ============================================================
  // ESTADO (signals)
  // ============================================================
  currentTime = signal(new Date());
  greeting = signal('');
  currentTimeDisplay = signal('');
  isDarkTheme = signal(false);
  isMicActive = signal(true);
  activeSection = signal('dashboard');
  isSidebarCollapsed = signal(false);
  isSidebarOpen = signal(false);

  projectConfig = signal<ProjectConfig | null>(null);
  availableProjects = ['informatica', 'huertos', 'salud', 'finanzas'];
  currentProjectId = signal('informatica');

  toolbarConfig = signal<ToolbarConfig>({});
  sidebarItems = signal<SidebarItem[]>([]);

  statsCards = signal<StatsCard[]>([]);
  myCourses = signal<Course[]>([]);
  quickActions = signal<QuickAction[]>([]);
  isLoading = signal(true);

  private welcomeShown = false;


  // ============================================================
  // MENSAJE DE AYUDA DINÁMICO
  // ============================================================
  readonly dashboardHelpMessage = computed(() => {
    const sidebar = this.sidebarItems().map(i => ({ label: i.label }));

    const toolbar = (this.toolbarConfig().userMenuItems || [])
      .filter(i => !i.isDivider && i.label)
      .map(i => ({ label: i.label! }));

    return this.voiceContext.buildHelpMessage(
      [...sidebar, ...toolbar],
      {
        intro: 'En el panel puedes decir:',
        extraActions: ['modo oscuro', 'modo claro', 'silenciar', 'activar micrófono'],
        outro: 'o ayuda.'
      }
    );
  });

  // ============================================================
  // GETTERS
  // ============================================================
  get userName(): string {
    return this.authService.getUserName() || 'Usuario';
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'usuario@ejemplo.com';
  }

  get formattedCurrentTime(): string {
    return this.currentTimeDisplay();
  }

  get isMicActuallyActive(): boolean {
    return this.voiceService.isRecognitionActive() && !this.voiceService.isCurrentlyMuted();
  }

  get micButtonText(): string {
    return this.isMicActuallyActive ? '🔴 Desactivar' : '🟢 Activar';
  }

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons({
      gridOutline,
      bookOutline,
      settingsOutline,
      logOutOutline,
      moonOutline,
      sunnyOutline,
      micOutline,
      micOffOutline,
      flashOutline,
      hourglassOutline,
      trendingUpOutline,
      trendingDownOutline,
      removeOutline,
      personOutline,
      schoolOutline,
      checkboxOutline,
      helpCircleOutline
    });
  }

  // ============================================================
  // ROLES
  // ============================================================
  private getUserRoles(): string[] {
    const user = this.authService.currentUser();
    return user?.roles || [];
  }

  private filterItemsByRoles<T extends { roles?: string[] }>(items: T[]): T[] {
    const userRoles = this.getUserRoles();
    return items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(role => userRoles.includes(role));
    });
  }

  // ============================================================
  // CARGA DE TOOLBAR
  // ============================================================
  private loadToolbarConfig(): void {
    console.log('📂 [Dashboard] Cargando toolbar desde: /assets/config/dashboard/toolbar-config.json');

    this.http.get<ExternalToolbarConfig>('/assets/config/dashboard/toolbar-config.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          let userMenuItems = config.userMenuItems?.map(item => {
            if (item.actionId && this.actionMap[item.actionId]) {
              return { ...item, action: this.actionMap[item.actionId] };
            }
            if (item.actionId && !this.actionMap[item.actionId]) {
              console.warn(`⚠️ Acción no mapeada: ${item.actionId}`);
              const { actionId, ...rest } = item;
              return rest;
            }
            return item;
          }) || [];

          const navLinks = this.filterItemsByRoles(config.navLinks || []);
          userMenuItems = this.filterItemsByRoles(userMenuItems);

          this.toolbarConfig.set({
            ...config,
            navLinks,
            userMenuItems
          });

          console.log('✅ Toolbar config cargada:', this.toolbarConfig());
        },
        error: (err) => {
          console.error('❌ Error al cargar configuración del toolbar:', err);
          this.toolbarConfig.set(this.getDefaultToolbarConfig());
        }
      });
  }

  private getDefaultToolbarConfig(): ToolbarConfig {
    return {
      title: 'Centro de Ayuda Digital',
      showLogo: true,
      showThemeToggle: true,
      showMicToggle: true,
      showUserAvatar: true,
      showBackButton: false,
      showHelp: true,
      navLinks: [
        { label: 'Dashboard', route: '/dashboard', icon: 'grid-outline', roles: ['USER'] }
      ],
      userMenuItems: [
        { label: 'Mi Perfil', icon: 'person-outline', route: '/profile' },
        { label: 'Configuración', icon: 'settings-outline', route: '/settings' },
        { label: 'Preferencias de Voz', icon: 'mic-outline', route: '/voice-settings' },
        { isDivider: true },
        {
          label: 'Cerrar Sesión',
          icon: 'log-out-outline',
          class: 'logout-item',
          action: () => this.logout()
        }
      ],
      unreadNotifications: 0
    };
  }

  // ============================================================
  // CARGA DE SIDEBAR
  // ============================================================
  private loadSidebarConfig(): void {
    console.log('📂 [Dashboard] Cargando sidebar desde: /assets/config/dashboard/sidebar-config.json');

    this.http.get<{ sidebarItems: SidebarItem[] }>('/assets/config/dashboard/sidebar-config.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sidebarItems.set(this.filterItemsByRoles(response.sidebarItems));
          console.log('✅ Sidebar config cargada:', this.sidebarItems());
        },
        error: (err) => {
          console.error('❌ Error al cargar sidebar:', err);
          this.sidebarItems.set(this.getDefaultSidebarItems());
        }
      });
  }

  private getDefaultSidebarItems(): SidebarItem[] {
    return [
      { id: 'dashboard', label: 'Panel Principal', icon: 'grid-outline', roles: ['USER'] }
    ];
  }

  onSidebarItemClick(item: SidebarItem): void {
    if (item.route) {
      this.router.navigate([item.route]);
    } else {
      this.setActiveSection(item.id);
    }
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  // ============================================================
  // SIDEBAR
  // ============================================================
  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
    this.userPreferences.updatePreference('sidebarCollapsed', this.isSidebarCollapsed()).subscribe();
  }

  toggleSidebarMobile(): void {
    this.isSidebarOpen.update(v => !v);
  }

  setActiveSection(section: string): void {
    this.activeSection.set(section);
    this.userPreferences.updatePreference('lastVisitedSection', section).subscribe();
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit(): void {
    console.log('🚀 Dashboard inicializado');

    const prefs = this.userPreferences.getCurrentPreferences();
    this.applyPreferences(prefs);

    this.userPreferences.preferences$
      .pipe(takeUntil(this.destroy$))
      .subscribe(prefs => {
        if (prefs) {
          this.applyPreferences(prefs);
        }
      });

    this.loadToolbarConfig();
    this.loadSidebarConfig();

    this.updateTimeDisplay();
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date());
      this.greeting.set(this.getGreeting());
      this.updateTimeDisplay();
    }, 1000);

    this.greeting.set(this.getGreeting());

    const projectId = this.userPreferences.getPreference('activeProjectId') || 'informatica';
    this.loadProject(projectId);

    this.setupVoiceContext();

    // ✅ Sobrescribir activationMessage con el nombre real del usuario
    setTimeout(() => {
      if (this.isDestroyed) return;
      const greeting = this.voiceContext.getMessage('dashboardGreeting', this.userName);
      const current = this.voiceContext.getContext();
      this.voiceContext.setContext({
        ...current,
        activationMessage: greeting
      });
      console.log('🎤 [Dashboard] Contexto personalizado con nombre:', this.userName);
    }, 100);

    // ✅ Suscripción a comandos
    this.voiceService
      .getTranscript()
      .pipe(takeUntil(this.destroy$))
      .subscribe((text: string) => {
        if (this.isDestroyed || !text) return;
        this.handleVoiceCommand(text);
      });

    // ✅ Anuncio de entrada al Dashboard (cada vez)
    this.announceDashboardEntry();

    // setTimeout(() => {
    //   this.showWelcomeMessage();
    // }, 1500);

    setTimeout(() => {
      if (!this.isDestroyed) {
        this.initializeMicState();
      }
    }, 500);
  }

  private applyPreferences(prefs: UserPreferences): void {
    this.isDarkTheme.set(prefs.theme === 'dark');
    this.isSidebarCollapsed.set(prefs.sidebarCollapsed || false);
    this.activeSection.set(prefs.lastVisitedSection || 'dashboard');
    this.isMicActive.set(prefs.micEnabled);
    this.currentProjectId.set(prefs.activeProjectId || 'informatica');
  }

  private initializeMicState(): void {
    const isMicActive = this.voiceService.isRecognitionActive();
    const isMuted = this.voiceService.isCurrentlyMuted();

    console.log(`🎤 [Dashboard] Micrófono: ${isMicActive ? '✅ ACTIVO' : '❌ INACTIVO'}, Muteado: ${isMuted}`);

    if (this.userPreferences.getPreference('micEnabled') === false) {
      if (isMicActive) {
        this.voiceService.mute();
        this.isMicActive.set(false);
      }
      return;
    }

    if (!isMicActive && !isMuted) {
      this.voiceService.startListening();
      this.isMicActive.set(true);
    }
  }

  // ============================================================
  // CARGAR PROYECTO
  // ============================================================
  loadProject(projectId: string): void {
    this.isLoading.set(true);
    this.currentProjectId.set(projectId);

    this.userPreferences.updatePreference('activeProjectId', projectId).subscribe();

    this.projectConfigService.loadProjectConfig(projectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.projectConfig.set(config);
          this.statsCards.set(config.statsCards);
          this.myCourses.set(config.courses);
          this.quickActions.set(config.quickActions);
          this.isLoading.set(false);
          console.log(`✅ Proyecto cargado: ${config.projectName}`);
        },
        error: (err) => {
          console.error('❌ Error cargando proyecto:', err);
          this.loadDefaultData();
          this.isLoading.set(false);
        }
      });
  }

  loadDefaultData(): void {
    this.statsCards.set([
      { icon: 'grid-outline', label: 'Proyectos', value: 1, gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }
    ]);
    this.myCourses.set([]);
    this.quickActions.set([]);
  }

  // ============================================================
  // VOZ
  // ============================================================
  private setupVoiceContext(): void {
    // ✅ Delegar en el contexto oficial del Dashboard
    this.voiceContext.setDashboardContext();
  }

  private handleVoiceCommand(text: string): void {
    if (this.isDestroyed) return;

    const lower = text.toLowerCase().trim();
    if (!lower) return;

    // ✅ Comandos que SIEMPRE pueden interrumpir el TTS
    const canInterrupt =
      lower.includes('ayuda') ||
      lower.includes('para') ||
      lower.includes('stop') ||
      lower.includes('silencio') ||
      lower.includes('silenciar') ||
      lower.includes('calla');

    // ✅ Si el TTS habla y NO es un comando prioritario → ignorar
    if (window.speechSynthesis.speaking && !canInterrupt) {
      console.log(`🔇 [Dashboard] TTS activo, ignorando comando: "${lower}"`);
      return;
    }

    // ✅ Si es un comando prioritario y el TTS habla → cortar y seguir
    if (canInterrupt && window.speechSynthesis.speaking) {
      console.log(`🛑 [Dashboard] Interrumpiendo TTS para: "${lower}"`);
      window.speechSynthesis.cancel();
    }

    console.log(`📝 [Dashboard] Comando recibido: "${lower}"`);

    // ✅ Debounce local (NO aplica a "ayuda", "para", "silencio")
    const now = Date.now();
    const isRepeatable = canInterrupt;
    if (!isRepeatable &&
        lower === this.lastProcessedCommand &&
        (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
      console.log(`⏭️ [Dashboard] Comando duplicado ignorado: "${lower}"`);
      return;
    }
    this.lastProcessedCommand = lower;
    this.lastProcessedTime = now;

    // ============================================================
    // PARAR TTS (prioritario)
    // ============================================================
    if (lower.includes('para') || lower.includes('stop') ||
        lower.includes('silencio') || lower.includes('calla')) {
      console.log('🛑 [Dashboard] TTS detenido por comando');
      window.speechSynthesis.cancel();
      return;
    }

    // ============================================================
    // MICRÓFONO
    // ============================================================
    if (lower.includes('silenciar') || lower.includes('desactivar micrófono') || lower === 'mute') {
      if (!this.voiceService.isCurrentlyMuted()) {
        this.voiceService.mute();
        this.isMicActive.set(false);
        this.userPreferences.updatePreference('micEnabled', false).subscribe();
        this.voiceService.speak('Micrófono desactivado');
      }
      return;
    }

    if (lower.includes('activar micrófono') || lower.includes('encender micrófono') || lower === 'unmute') {
      if (this.voiceService.isCurrentlyMuted()) {
        this.voiceService.unmute();
        this.voiceService.startListening();
        this.isMicActive.set(true);
        this.userPreferences.updatePreference('micEnabled', true).subscribe();
        this.voiceService.speak('Micrófono activado');
      }
      return;
    }

    // ============================================================
    // TEMA
    // ============================================================
    if (lower.includes('modo oscuro') || lower.includes('tema oscuro')) {
      if (!this.isDarkTheme()) this.toggleTheme();
      return;
    }

    if (lower.includes('modo claro') || lower.includes('tema claro')) {
      if (this.isDarkTheme()) this.toggleTheme();
      return;
    }

    // ============================================================
    // NAVEGACIÓN POR SECCIONES
    // ============================================================
    if (lower.includes('dashboard') || lower.includes('panel') || lower.includes('inicio')) {
      this.setActiveSection('dashboard');
      this.voiceService.speak('Panel principal');
      return;
    }

    if (lower.includes('curso')) {
      this.setActiveSection('courses');
      this.voiceService.speak('Cursos');
      return;
    }

    if (lower.includes('perfil') || lower.includes('mi cuenta')) {
      this.voiceService.speak('Abriendo perfil');
      this.router.navigate(['/profile']);
      return;
    }

    if (lower.includes('configuración') || lower.includes('configuracion') || lower.includes('ajustes')) {
      this.voiceService.speak('Abriendo configuración');
      this.router.navigate(['/settings']);
      return;
    }

    if (lower.includes('preferencias de voz')) {
      this.voiceService.speak('Abriendo preferencias de voz');
      this.router.navigate(['/voice-settings']);
      return;
    }

    // ============================================================
    // PROYECTOS
    // ============================================================
    if (lower.includes('informatica') || lower.includes('informática')) {
      this.loadProject('informatica');
      this.voiceService.speak('Cargando proyecto de informática');
      return;
    }

    if (lower.includes('huertos')) {
      this.loadProject('huertos');
      this.voiceService.speak('Cargando proyecto de huertos');
      return;
    }

    if (lower.includes('salud')) {
      this.loadProject('salud');
      this.voiceService.speak('Cargando proyecto de salud');
      return;
    }

    if (lower.includes('finanzas')) {
      this.loadProject('finanzas');
      this.voiceService.speak('Cargando proyecto de finanzas');
      return;
    }

    // ============================================================
    // SESIÓN
    // ============================================================
    if (lower.includes('cerrar sesión') || lower.includes('cerrar sesion') ||
        lower.includes('logout') || lower.includes('salir')) {
      this.voiceService.speak('Cerrando sesión');
      setTimeout(() => this.logout(), 800);
      return;
    }

    // ============================================================
    // AYUDA
    // ============================================================
    if (lower.includes('ayuda') || lower === 'help') {
      this.showHelp();
      return;
    }

    console.log(`⏭️ [Dashboard] Comando no reconocido: "${lower}"`);
  }
  
  // ============================================================
  // ANUNCIO DE ENTRADA AL DASHBOARD
  // ============================================================
  private announceDashboardEntry(): void {
    if (this.announcementDone) return;
    this.announcementDone = true;

    setTimeout(() => {
      if (this.isDestroyed) return;

      // Si el micro está muteado, no se oye nada; lo dejamos para cuando diga "hola"
      if (this.voiceService.isCurrentlyMuted()) {
        console.log('🔇 [Dashboard] Micrófono muteado, el saludo se emitirá al decir "hola"');
        return;
      }

      const message = this.voiceContext.getMessage('dashboardGreeting', this.userName);
      console.log('📢 [Dashboard] Anunciando entrada:', message);

      this.voiceService.speakAlways(message, true)
        .then(() => {
          console.log('✅ [Dashboard] Anuncio emitido');
          setTimeout(() => {
            if (!this.voiceService.isRecognitionActive() &&
                !this.voiceService.isCurrentlyMuted()) {
              this.voiceService.startListening({ source: 'announceEntry' });
            }
          }, 400);
        })
        .catch((err) => {
          console.warn('⚠️ [Dashboard] speakAlways falló:', err);
          if (!this.voiceService.isRecognitionActive() &&
              !this.voiceService.isCurrentlyMuted()) {
            this.voiceService.startListening({ source: 'announceEntry.catch' });
          }
        });
    }, 900);
  }

  // ============================================================
  // BIENVENIDA (una vez por sesión)
  // ============================================================
  private showWelcomeMessage(): void {
    if (this.isDestroyed || this.welcomeShown) return;

    if (this.userPreferences.getPreference('welcomeShown')) {
      this.welcomeShown = true;
      return;
    }

    this.welcomeShown = true;
    const message = this.projectConfig()?.welcomeMessage || `Hola ${this.userName}, bienvenido.`;

    if (!this.voiceService.hasWelcomeBeenShown('dashboard')) {
      this.voiceService.markWelcomeAsShown('dashboard');
      this.voiceService.speakWhenReady(message);
      this.userPreferences.updatePreference('welcomeShown', true).subscribe();
    }
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  private getGreeting(): string {
    const hour = this.currentTime().getHours();
    if (hour < 12) return 'Buenos días 🌅';
    if (hour < 18) return 'Buenas tardes ☀️';
    return 'Buenas noches 🌙';
  }

  private updateTimeDisplay(): void {
    this.currentTimeDisplay.set(new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(this.currentTime()));
  }

  // showHelp(): void {
  //   const message = this.voiceContext.getMessage('dashboardHelp');
  //   this.voiceService.speakAlways(message, true);
  // }

  showHelp(): void {
    const message = this.dashboardHelpMessage();
    console.log('📢 [Dashboard] Ayuda:', message);

    this.voiceService.speakAlways(message, true)
      .then(() => {
        console.log('✅ [Dashboard] Ayuda emitida');
        setTimeout(() => {
          if (!this.voiceService.isRecognitionActive() &&
              !this.voiceService.isCurrentlyMuted()) {
            this.voiceService.startListening({ source: 'showHelp' });
          }
        }, 400);
      })
      .catch((err) => {
        console.warn('⚠️ [Dashboard] speakAlways falló:', err);
        if (!this.voiceService.isRecognitionActive() &&
            !this.voiceService.isCurrentlyMuted()) {
          this.voiceService.startListening({ source: 'showHelp.catch' });
        }
      });
  }

  // ============================================================
  // ACCIONES
  // ============================================================
  toggleMic(): void {
    const isMuted = this.voiceService.isCurrentlyMuted();
    const isActive = this.voiceService.isRecognitionActive();

    if (isMuted || !isActive) {
      this.voiceService.stopListening();
      setTimeout(() => {
        this.voiceService.unmute();
        this.voiceService.startListening();
        this.isMicActive.set(true);
        this.voiceService.speak('Micrófono activado');
        this.userPreferences.updatePreference('micEnabled', true).subscribe();
      }, 300);
    } else {
      this.voiceService.mute();
      this.isMicActive.set(false);
      this.voiceService.speak('Micrófono desactivado');
      this.userPreferences.updatePreference('micEnabled', false).subscribe();
    }
  }

  toggleTheme(): void {
    const newTheme = this.isDarkTheme() ? 'light' : 'dark';
    this.themeService.setTheme(newTheme);
    this.isDarkTheme.set(newTheme === 'dark');

    this.userPreferences.updatePreference('theme', newTheme as 'light' | 'dark').subscribe({
      next: () => console.log('✅ Tema guardado:', newTheme),
      error: (error) => console.error('❌ Error guardando tema:', error)
    });
  }

  logout(): void {
    this.userPreferences.savePreferences({
      sidebarCollapsed: this.isSidebarCollapsed(),
      lastVisitedSection: this.activeSection(),
      activeProjectId: this.currentProjectId(),
      micEnabled: this.isMicActive()
    }).subscribe();

    this.authService.logout().subscribe({
      next: () => {
        this.voiceService.clearTranscript();
        this.voiceService.speak('Sesión cerrada');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.fullLocalLogout();
        this.router.navigate(['/login']);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ============================================================
  // HOST LISTENERS
  // ============================================================
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 768 && this.isSidebarOpen()) {
      this.isSidebarOpen.set(false);
    }
  }

  // ============================================================
  // DESTROY
  // ============================================================
  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();

    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    this.userPreferences.savePreferences({
      sidebarCollapsed: this.isSidebarCollapsed(),
      lastVisitedSection: this.activeSection(),
      activeProjectId: this.currentProjectId(),
      micEnabled: this.isMicActive()
    }).subscribe();

    this.voiceContext.resetContext();
    window.speechSynthesis.cancel();
    console.log('🧹 Dashboard destruido');
  }
}