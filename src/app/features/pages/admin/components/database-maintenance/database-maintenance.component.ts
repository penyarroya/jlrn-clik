// // // src/app/features/admin/pages/database-maintenance/database-maintenance.component.ts

// // import {
// //   Component, OnInit, OnDestroy, inject, NgZone,
// //   ChangeDetectorRef, ChangeDetectionStrategy,
// //   signal, computed, ViewChild
// // } from '@angular/core';
// // import { CommonModule } from '@angular/common';
// // import { Router, RouterModule } from '@angular/router';
// // import { HttpClient } from '@angular/common/http';
// // import { Subject, takeUntil } from 'rxjs';

// // // ✅ Ionic 9
// // import { IonIcon, IonContent, IonSpinner } from '@ionic/angular';
// // import { addIcons } from 'ionicons';
// // import {
// //   closeOutline,
// //   serverOutline,
// //   personOutline,
// //   settingsOutline,
// //   logOutOutline,
// //   folderOutline,
// //   shieldOutline,
// //   lockClosedOutline,
// //   clipboardOutline,
// //   syncOutline,
// //   keyOutline,
// //   helpCircleOutline,
// //   informationCircleOutline
// // } from 'ionicons/icons';
// // import { ToolbarConfig, UserMenuItem, TransparentToolbarComponent } from '../../../../../shared/components/transparent-toolbar/transparent-toolbar.component';
// // import { EntityCrudService } from '../../../../../shared/services/sidebar/entity-crud.service';
// // import { ThemeService } from '../../../../../shared/services/theme/theme';
// // import { AuthService } from '../../../../auth/Services/auth-service';
// // import { VoiceContextService } from '../../../../services/voz/voice-context.service';
// // import { VoiceService } from '../../../../services/voz/voice.service';
// // import { EntityConfig } from '../../models/entity-config';
// // import { EntityFormComponent } from '../entity-form/entity-form.component';
// // import { EntityTableComponent } from '../entity-table/entity-table.component';
// // import { EntitySidebarComponent } from '../../../../../shared/components/entity-sidebar/entity-sidebar.component';
// // import { ENTITY_REGISTRY, getEntityConfig } from '../../../../../shared/constants/entity-registry';

// // // Servicios y modelos


// // interface EntityDefinition {
// //   name: string;
// //   label: string;
// //   endpoint: string;
// //   icon: string;
// // }

// // export interface ExternalToolbarConfig extends ToolbarConfig {
// //   userMenuItems?: (UserMenuItem & { actionId?: string })[];
// // }

// // @Component({
// //   selector: 'app-database-maintenance',
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     IonIcon,
// //     TransparentToolbarComponent,
// //     EntitySidebarComponent,
// //     EntityTableComponent,
// //     EntityFormComponent
// // ],
// //   templateUrl: './database-maintenance.component.html',
// //   changeDetection: ChangeDetectionStrategy.OnPush,
// //   styleUrls: ['./database-maintenance.component.scss']
// // })
// // export class DatabaseMaintenanceComponent implements OnInit, OnDestroy {
// //   // ============================================================
// //   // INYECCIONES
// //   // ============================================================
// //   public router = inject(Router);
// //   private ngZone = inject(NgZone);
// //   private cdr = inject(ChangeDetectorRef);
// //   public voiceService = inject(VoiceService);
// //   private voiceContext = inject(VoiceContextService);
// //   private authService = inject(AuthService);
// //   private themeService = inject(ThemeService);
// //   private http = inject(HttpClient);
// //   private crudService = inject(EntityCrudService);

// //   @ViewChild(EntityTableComponent) tableComponent?: EntityTableComponent;

// //   // ============================================================
// //   // ESTADO
// //   // ============================================================
// //   private destroy$ = new Subject<void>();
// //   private isDestroyed = false;
// //   private timeInterval: any;

// //   // ✅ Control de comandos de voz
// //   private lastProcessedCommand = '';
// //   private lastProcessedTime = 0;
// //   private readonly COMMAND_DEBOUNCE = 1500;
// //   private announceDone = false;

// //   currentTime = new Date();
// //   greeting = '';
// //   currentTimeDisplay: string = '';

// //   showForm = signal(false);
// //   isEditing = signal(false);
// //   currentData = signal<any>(null);
// //   loading = signal(false);
// //   isMobileSidebarOpen = signal(false);

// //   private actionMap: { [key: string]: () => void } = {
// //     logout: () => this.logout(),
// //     help: () => this.showHelp(),
// //     toggleMic: () => this.voiceService.toggleMute(),
// //     toggleTheme: () => this.themeService.toggleTheme()
// //   };

// //   // ============================================================
// //   // ENTIDADES
// //   // ============================================================
// //   entities = signal<EntityDefinition[]>(
// //     (() => {
// //       const values = Object.values(ENTITY_REGISTRY);
// //       return values.map(config => ({
// //         name: config.entityName ?? '',
// //         label: config.displayName ?? '',
// //         endpoint: this.extractEndpoint(config.apiPath ?? ''),
// //         icon: this.mapIconToIonicon(config.icon ?? '')
// //       }));
// //     })()
// //   );

// //   selectedEntity = signal<EntityDefinition | null>(null);

// //   selectedEntityConfig = computed<EntityConfig | null>(() => {
// //     const current = this.selectedEntity();
// //     if (!current) return null;
// //     return getEntityConfig(current.name) || null;
// //   });

// //   // ============================================================
// //   // TOOLBAR CONFIG
// //   // ============================================================
// //   toolbarConfig = computed<ToolbarConfig>(() => {
// //     const current = this.selectedEntity();
// //     const baseConfig = this.baseToolbarConfig;
// //     return {
// //       ...baseConfig,
// //       title: current ? `Mantenimiento: ${current.label}` : 'Mantenimiento de Base de Datos',
// //       showSearch: false
// //     };
// //   });

// //   private baseToolbarConfig: ToolbarConfig = {
// //     title: 'Mantenimiento de Base de Datos',
// //     showLogo: true,
// //     showThemeToggle: true,
// //     showMicToggle: true,
// //     showUserAvatar: true,
// //     showBackButton: true,
// //     showHelp: true,
// //     userMenuItems: [
// //       { label: 'Mi Perfil', icon: 'person-outline', route: '/profile' },
// //       { label: 'Configuración', icon: 'settings-outline', route: '/settings' },
// //       { isDivider: true },
// //       {
// //         label: 'Cerrar Sesión',
// //         icon: 'log-out-outline',
// //         class: 'logout-item',
// //         actionId: 'logout'
// //       }
// //     ]
// //   };

// //   // ============================================================
// //   // MENSAJE DE AYUDA DINÁMICO (con buildHelpMessage)
// //   // ============================================================
// //   readonly helpMessage = computed(() => {
// //     const sidebar = this.entities().map(e => ({ label: e.label }));

// //     return this.voiceContext.buildHelpMessage(
// //       sidebar,
// //       {
// //         intro: 'En el mantenimiento de base de datos puedes decir:',
// //         extraActions: [
// //           'inicio',
// //           'volver',
// //           'modo oscuro',
// //           'modo claro',
// //           'silenciar',
// //           'activar micrófono'
// //         ],
// //         outro: 'o ayuda.'
// //       }
// //     );
// //   });

// //   // ============================================================
// //   // GETTERS
// //   // ============================================================
// //   get userName(): string {
// //     return this.authService.getUserName() || 'Administrador';
// //   }

// //   get userEmail(): string {
// //     return this.authService.getUserEmail() || 'admin@database.com';
// //   }

// //   get formattedCurrentTime(): string {
// //     return this.currentTimeDisplay;
// //   }

// //   // ============================================================
// //   // CONSTRUCTOR
// //   // ============================================================
// //   constructor() {
// //     addIcons({
// //       closeOutline,
// //       serverOutline,
// //       personOutline,
// //       settingsOutline,
// //       logOutOutline,
// //       folderOutline,
// //       shieldOutline,
// //       lockClosedOutline,
// //       clipboardOutline,
// //       syncOutline,
// //       keyOutline,
// //       helpCircleOutline,
// //       informationCircleOutline
// //     });
// //   }

// //   // ============================================================
// //   // CICLO DE VIDA
// //   // ============================================================
// //   ngOnInit(): void {
// //     console.log('🚀 DatabaseMaintenanceComponent inicializado');

// //     this.updateTimeDisplay();
// //     this.timeInterval = setInterval(() => {
// //       this.currentTime = new Date();
// //       this.greeting = this.getGreeting();
// //       this.updateTimeDisplay();
// //       this.cdr.detectChanges();
// //     }, 1000);

// //     this.greeting = this.getGreeting();
// //     this.setupVoiceContext();

// //     this.voiceService.getTranscript()
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe((text: string) => {
// //         this.ngZone.run(() => {
// //           if (this.isDestroyed || !text) return;
// //           this.handleVoiceCommand(text);
// //         });
// //       });

// //     // ✅ Anuncio de entrada
// //     this.announceEntry();
// //   }

// //   ngOnDestroy(): void {
// //     this.isDestroyed = true;
// //     this.destroy$.next();
// //     this.destroy$.complete();

// //     if (this.timeInterval) {
// //       clearInterval(this.timeInterval);
// //     }

// //     this.voiceContext.resetContext();
// //     window.speechSynthesis.cancel();
// //     console.log('🧹 DatabaseMaintenanceComponent destruido');
// //   }

// //   // ============================================================
// //   // SIDEBAR Y ENTIDADES
// //   // ============================================================
// //   toggleMobileSidebar(): void {
// //     this.isMobileSidebarOpen.update(value => !value);
// //   }

// //   onSelectEntityByName(entityName: string): void {
// //     const foundEntity = this.entities().find(e => e.name === entityName);
// //     if (foundEntity) {
// //       this.selectEntity(foundEntity);
// //       this.isMobileSidebarOpen.set(false);
// //     }
// //   }

// //   onSearch(query: string): void {
// //     console.log('Búsqueda global:', query);
// //   }

// //   selectEntity(entity: EntityDefinition): void {
// //     this.selectedEntity.set(entity);
// //     this.showForm.set(false);
// //   }

// //   // ============================================================
// //   // CRUD
// //   // ============================================================
// //   editEntityItem(rowOrId: any): void {
// //     const config = this.selectedEntityConfig();
// //     if (!config) return;

// //     let id: any = null;

// //     if (typeof rowOrId === 'object' && rowOrId !== null) {
// //       const primaryField = config.fields.find(f => f.isPrimaryKey)?.key;
// //       if (primaryField && rowOrId[primaryField] !== undefined) {
// //         id = rowOrId[primaryField];
// //       } else if (rowOrId['userId'] !== undefined) {
// //         id = rowOrId['userId'];
// //       } else if (rowOrId['id'] !== undefined) {
// //         id = rowOrId['id'];
// //       }
// //     } else {
// //       id = rowOrId;
// //     }

// //     if (id === undefined || id === null || id === '') {
// //       console.error('🚨 No se pudo identificar la clave primaria:', rowOrId);
// //       return;
// //     }

// //     this.loading.set(true);
// //     this.crudService.getById(config, id).subscribe({
// //       next: (data) => {
// //         this.currentData.set(data);
// //         this.isEditing.set(true);
// //         this.showForm.set(true);
// //         this.loading.set(false);
// //       },
// //       error: (err) => {
// //         console.error('Error al cargar registro:', err);
// //         this.loading.set(false);
// //       }
// //     });
// //   }

// //   deleteEntityItem(rowOrId: any): void {
// //     const config = this.selectedEntityConfig();
// //     if (!config) return;

// //     const primaryKeyField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
// //     const id = typeof rowOrId === 'object' && rowOrId !== null
// //       ? rowOrId[primaryKeyField]
// //       : rowOrId;

// //     if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
// //       this.loading.set(true);
// //       this.crudService.delete(config, id).subscribe({
// //         next: () => {
// //           this.loading.set(false);
// //           this.tableComponent?.reload();
// //         },
// //         error: (err) => {
// //           console.error('Error al eliminar registro:', err);
// //           this.loading.set(false);
// //         }
// //       });
// //     }
// //   }

// //   openCreateForm(): void {
// //     this.isEditing.set(false);
// //     this.currentData.set(null);
// //     this.showForm.set(true);
// //   }

// //   closeForm(): void {
// //     this.showForm.set(false);
// //     this.currentData.set(null);
// //     this.loading.set(false);
// //   }

// //   handleSave(formData: any): void {
// //     const config = this.selectedEntityConfig();
// //     if (!config) return;

// //     this.loading.set(true);

// //     const request$ = this.isEditing()
// //       ? this.crudService.update(
// //           config,
// //           this.currentData()?.id ||
// //           this.currentData()?._id ||
// //           this.currentData()?.userId,
// //           formData
// //         )
// //       : this.crudService.create(config, formData);

// //     request$.subscribe({
// //       next: () => {
// //         this.loading.set(false);
// //         this.closeForm();
// //         this.tableComponent?.reload();
// //       },
// //       error: (err) => {
// //         this.loading.set(false);
// //         console.error('Error al guardar el registro:', err);
// //       }
// //     });
// //   }

// //   // ============================================================
// //   // ADAPTACIÓN DE REGISTRO
// //   // ============================================================
// //   private extractEndpoint(apiPath: string): string {
// //     const parts = apiPath.split('/api/v1');
// //     if (parts.length > 1) return parts[1];
// //     return apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
// //   }

// //   private mapIconToIonicon(iconString: string): string {
// //     const map: Record<string, string> = {
// //       '👤': 'person-outline',
// //       '🛡️': 'shield-outline',
// //       '🔐': 'lock-closed-outline',
// //       '📋': 'clipboard-outline',
// //       '⚙️': 'settings-outline',
// //       '🔄': 'sync-outline',
// //       '🔑': 'key-outline'
// //     };
// //     return map[iconString] || iconString || 'folder-outline';
// //   }

// //   // ============================================================
// //   // UTILIDADES
// //   // ============================================================
// //   private getGreeting(): string {
// //     const hour = this.currentTime.getHours();
// //     if (hour < 12) return 'Buenos días 🌅';
// //     if (hour < 18) return 'Buenas tardes ☀️';
// //     return 'Buenas noches 🌙';
// //   }

// //   private updateTimeDisplay(): void {
// //     this.currentTimeDisplay = new Intl.DateTimeFormat('es-ES', {
// //       weekday: 'long',
// //       day: 'numeric',
// //       month: 'long',
// //       year: 'numeric',
// //       hour: '2-digit',
// //       minute: '2-digit',
// //       second: '2-digit',
// //       hour12: false
// //     }).format(this.currentTime);
// //   }

// //   // ============================================================
// //   // VOZ
// //   // ============================================================
// //   private setupVoiceContext(): void {
// //     this.voiceContext.setContext({
// //       activationMessage: 'Mantenimiento de Base de Datos. Di ayuda para escuchar las opciones disponibles.',
// //       availableCommands: [
// //         'inicio',
// //         'volver',
// //         'modo oscuro',
// //         'modo claro',
// //         'silenciar',
// //         'activar micrófono',
// //         'ayuda'
// //       ],
// //       preventBackend: true
// //     });
// //   }

// //   private announceEntry(): void {
// //     if (this.announceDone) return;
// //     this.announceDone = true;

// //     setTimeout(() => {
// //       if (this.isDestroyed) return;

// //       if (this.voiceService.isCurrentlyMuted()) {
// //         console.log('🔇 [DB] Micrófono muteado, no se anuncia entrada');
// //         return;
// //       }

// //       const message = 'Mantenimiento de base de datos. Di ayuda para escuchar las opciones disponibles.';
// //       console.log('📢 [DB] Anunciando entrada:', message);

// //       this.voiceService.speakAlways(message, true)
// //         .then(() => {
// //           setTimeout(() => {
// //             if (!this.voiceService.isRecognitionActive() &&
// //                 !this.voiceService.isCurrentlyMuted()) {
// //               this.voiceService.startListening({ source: 'announceEntry' });
// //             }
// //           }, 400);
// //         })
// //         .catch((err) => {
// //           console.warn('⚠️ [DB] speakAlways falló:', err);
// //           if (!this.voiceService.isRecognitionActive() &&
// //               !this.voiceService.isCurrentlyMuted()) {
// //             this.voiceService.startListening({ source: 'announceEntry.catch' });
// //           }
// //         });
// //     }, 900);
// //   }

// //   private handleVoiceCommand(text: string): void {
// //     if (this.isDestroyed) return;

// //     const lower = text.toLowerCase().trim();
// //     if (!lower) return;

// //     const canInterrupt =
// //       lower.includes('ayuda') ||
// //       lower.includes('para') ||
// //       lower.includes('silencio') ||
// //       lower.includes('silenciar') ||
// //       lower.includes('calla');

// //     if (window.speechSynthesis.speaking && !canInterrupt) {
// //       return;
// //     }

// //     if (canInterrupt && window.speechSynthesis.speaking) {
// //       window.speechSynthesis.cancel();
// //     }

// //     const now = Date.now();
// //     if (!canInterrupt &&
// //         lower === this.lastProcessedCommand &&
// //         (now - this.lastProcessedTime) < this.COMMAND_DEBOUNCE) {
// //       return;
// //     }
// //     this.lastProcessedCommand = lower;
// //     this.lastProcessedTime = now;

// //     // Parar TTS
// //     if (lower.includes('para') || lower.includes('silencio') || lower.includes('calla')) {
// //       window.speechSynthesis.cancel();
// //       return;
// //     }

// //     // Micrófono
// //     if (lower.includes('silenciar') || lower === 'mute') {
// //       if (!this.voiceService.isCurrentlyMuted()) {
// //         this.voiceService.mute();
// //         this.voiceService.speak('Micrófono desactivado');
// //       }
// //       return;
// //     }

// //     if (lower.includes('activar micrófono') || lower === 'unmute') {
// //       if (this.voiceService.isCurrentlyMuted()) {
// //         this.voiceService.unmute();
// //       }
// //       return;
// //     }

// //     // Tema
// //     if (lower.includes('modo oscuro') || lower.includes('tema oscuro')) {
// //       if (this.themeService.currentTheme() !== 'dark') this.themeService.toggleTheme();
// //       return;
// //     }

// //     if (lower.includes('modo claro') || lower.includes('tema claro')) {
// //       if (this.themeService.currentTheme() !== 'light') this.themeService.toggleTheme();
// //       return;
// //     }

// //     // Navegación
// //     if (lower.includes('volver') || lower.includes('atrás') || lower.includes('regresar')) {
// //       this.volverAtras();
// //       this.voiceService.speak('Volviendo al panel principal');
// //       return;
// //     }

// //     if (lower.includes('inicio') || lower.includes('home')) {
// //       this.router.navigate(['/dashboard']);
// //       return;
// //     }

// //     // Selección de entidad por nombre
// //     const matchedEntity = this.entities().find(e =>
// //       lower.includes(e.label.toLowerCase()) ||
// //       lower.includes(e.name.toLowerCase())
// //     );
// //     if (matchedEntity) {
// //       this.selectEntity(matchedEntity);
// //       this.voiceService.speak(`Abriendo ${matchedEntity.label}`);
// //       return;
// //     }

// //     // Ayuda
// //     if (lower.includes('ayuda') || lower === 'help') {
// //       this.showHelp();
// //       return;
// //     }

// //     console.log(`⏭️ [DB] Comando no reconocido: "${lower}"`);
// //   }

// //   showHelp(): void {
// //     const message = this.helpMessage();
// //     console.log('📢 [DB] Ayuda:', message);

// //     this.voiceService.speakAlways(message, true)
// //       .then(() => {
// //         setTimeout(() => {
// //           if (!this.voiceService.isRecognitionActive() &&
// //               !this.voiceService.isCurrentlyMuted()) {
// //             this.voiceService.startListening({ source: 'showHelp' });
// //           }
// //         }, 400);
// //       })
// //       .catch((err) => {
// //         console.warn('⚠️ [DB] speakAlways falló:', err);
// //         if (!this.voiceService.isRecognitionActive() &&
// //             !this.voiceService.isCurrentlyMuted()) {
// //           this.voiceService.startListening({ source: 'showHelp.catch' });
// //         }
// //       });
// //   }

// //   // ============================================================
// //   // ACCIONES
// //   // ============================================================
// //   logout(): void {
// //     this.authService.logout().subscribe({
// //       next: () => {
// //         this.voiceService.clearTranscript();
// //         this.voiceService.speak('Sesión cerrada');
// //         this.router.navigate(['/login']);
// //       },
// //       error: () => {
// //         this.authService.fullLocalLogout();
// //         this.router.navigate(['/login']);
// //       }
// //     });
// //   }

// //   goToLogin(): void {
// //     this.router.navigate(['/login']);
// //   }

// //   volverAtras(): void {
// //     this.selectedEntity.set(null);
// //     this.closeForm();
// //   }
// // }














// src/app/features/admin/pages/database-maintenance/database-maintenance.component.ts

import {
  Component, OnInit, OnDestroy, inject, NgZone,
  ChangeDetectorRef, ChangeDetectionStrategy,
  signal, computed, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';

// ✅ Ionic 9
import { AlertController, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  serverOutline,
  personOutline,
  settingsOutline,
  logOutOutline
} from 'ionicons/icons';

// Servicios y componentes compartidos
import {
  TransparentToolbarComponent,
  ToolbarConfig,
  UserMenuItem
} from '../../../../../shared/components/transparent-toolbar/transparent-toolbar.component';
import { AuthService } from '../../../../auth/Services/auth-service';
import { ThemeService } from '../../../../../shared/services/theme/theme';
import { VoiceContextService } from '../../../../services/voz/voice-context.service';
import { VoiceService } from '../../../../services/voz/voice.service';
import { EntitySidebarComponent } from '../../../../../shared/components/entity-sidebar/entity-sidebar.component';
import { EntityCrudService } from '../../../../../shared/services/sidebar/entity-crud.service';

// Entidades
import { ENTITY_REGISTRY, getEntityConfig } from '../../../../../shared/constants/entity-registry';
import { EntityTableComponent } from '../../components/entity-table/entity-table.component';
import { EntityFormComponent } from '../../components/entity-form/entity-form.component';
import { EntityConfig } from '../../models/entity-config';
import { MessageType, FieldErrorComponent } from '../../../../../shared/components/messages/field-error/field-error.component';

interface EntityDefinition {
  name: string;
  label: string;
  endpoint: string;
  icon: string;
}

export interface ExternalToolbarConfig extends ToolbarConfig {
  userMenuItems?: (UserMenuItem & { actionId?: string })[];
}

@Component({
  selector: 'app-database-maintenance',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    TransparentToolbarComponent,
    EntitySidebarComponent,
    EntityTableComponent,
    EntityFormComponent,
    FieldErrorComponent
],
  templateUrl: './database-maintenance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./database-maintenance.component.scss']
})
export class DatabaseMaintenanceComponent implements OnInit, OnDestroy {
  // ============================================================
  // INYECCIONES
  // ============================================================
  public router = inject(Router);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  public voiceService = inject(VoiceService);
  private voiceContext = inject(VoiceContextService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  private http = inject(HttpClient);
  private crudService = inject(EntityCrudService);
  private alertController = inject(AlertController);

  @ViewChild(EntityTableComponent) tableComponent?: EntityTableComponent;

  // ============================================================
  // ESTADO
  // ============================================================
  private destroy$ = new Subject<void>();
  private isDestroyed = false;
  private timeInterval: any;

  currentTime = new Date();
  greeting = '';
  currentTimeDisplay: string = '';

  showForm = signal(false);
  isEditing = signal(false);
  currentData = signal<any>(null);
  loading = signal(false);
  isMobileSidebarOpen = signal(false);

  // ✅ Mensajes globales
  globalMessage = signal<string | null>(null);
  globalMessageType = signal<MessageType>('info');
  globalMessageDuration = signal<number>(3000);

  // ============================================================
  // ✅ ACTION MAP — traduce actionId del JSON a funciones reales
  // ============================================================
  private actionMap: { [key: string]: () => void } = {
    'select-user': () => this.selectEntityByName('UserEntity'),
    'select-role': () => this.selectEntityByName('RoleEntity'),
    'select-permission': () => this.selectEntityByName('PermissionEntity'),
    'logout': () => this.logout(),
  };

  // ============================================================
  // ENTIDADES
  // ============================================================
  entities = signal<EntityDefinition[]>(
    (() => {
      const values = Object.values(ENTITY_REGISTRY);
      return values.map(config => ({
        name: config.entityName ?? '',
        label: config.displayName ?? '',
        endpoint: this.extractEndpoint(config.apiPath ?? ''),
        icon: this.mapIconToIonicon(config.icon ?? '')
      }));
    })()
  );

  selectedEntity = signal<EntityDefinition | null>(null);

  selectedEntityConfig = computed<EntityConfig | null>(() => {
    const current = this.selectedEntity();
    if (!current) return null;
    return getEntityConfig(current.name) || null;
  });

  // ============================================================
  // ✅ TOOLBAR — ahora baseToolbarConfig es un signal
  // ============================================================
  private baseToolbarConfig = signal<ToolbarConfig>({
    title: 'Mantenimiento de Base de Datos',
    showLogo: true,
    showThemeToggle: true,
    showMicToggle: true,
    showUserAvatar: true,
    showBackButton: true,
    showHelp: true,
    showNotifications: false,
    unreadNotifications: 0,
    navLinks: [],
    userMenuItems: []
  });

  toolbarConfig = computed<ToolbarConfig>(() => {
    const current = this.selectedEntity();
    const baseConfig = this.baseToolbarConfig();
    return {
      ...baseConfig,
      title: current ? `Mantenimiento: ${current.label}` : 'Mantenimiento de Base de Datos',
      showSearch: false
    };
  });

  // ============================================================
  // GETTERS
  // ============================================================
  get userName(): string {
    return this.authService.getUserName() || 'Administrador';
  }

  get userEmail(): string {
    return this.authService.getUserEmail() || 'admin@database.com';
  }

  get formattedCurrentTime(): string {
    return this.currentTimeDisplay;
  }

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons({
      closeOutline,
      serverOutline,
      personOutline,
      settingsOutline,
      logOutOutline
    });
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit(): void {
    console.log('🚀 DatabaseMaintenanceComponent inicializado');

    // ✅ Cargar el config del toolbar desde el JSON
    this.loadToolbarConfig();

    this.updateTimeDisplay();
    this.timeInterval = setInterval(() => {
      this.currentTime = new Date();
      this.greeting = this.getGreeting();
      this.updateTimeDisplay();
      this.cdr.detectChanges();
    }, 1000);

    this.greeting = this.getGreeting();
    this.setupVoiceContext();

    this.voiceService.getTranscript()
      .pipe(takeUntil(this.destroy$))
      .subscribe((text: string) => {
        this.ngZone.run(() => {
          if (this.isDestroyed || !text) return;
          this.handleVoiceCommand(text);
        });
      });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();

    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    this.voiceContext.resetContext();
    window.speechSynthesis.cancel();
    console.log('🧹 DatabaseMaintenanceComponent destruido');
  }

  // ============================================================
  // ✅ CARGA DEL TOOLBAR DESDE JSON
  // ============================================================
  private loadToolbarConfig(): void {
    console.log('📂 [DB] Cargando toolbar desde: /assets/config/database-maintenance/toolbar-config.json');

    this.http.get<ExternalToolbarConfig>('/assets/config/database-maintenance/toolbar-config.json')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          // ✅ Convierte actionId → action usando el actionMap
          const userMenuItems = config.userMenuItems?.map(item => {
            if (item.actionId && this.actionMap[item.actionId]) {
              return { ...item, action: this.actionMap[item.actionId] };
            }
            if (item.actionId && !this.actionMap[item.actionId]) {
              console.warn(`⚠️ [DB] Acción no mapeada: ${item.actionId}`);
              const { actionId, ...rest } = item;
              return rest;
            }
            return item;
          }) || [];

          this.baseToolbarConfig.set({
            ...config,
            userMenuItems
          });

          console.log('✅ [DB] Toolbar config cargada:', this.baseToolbarConfig());
        },
        error: (err) => {
          console.error('❌ [DB] Error cargando toolbar config:', err);
        }
      });
  }

  // ============================================================
  // SIDEBAR Y ENTIDADES
  // ============================================================
  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(value => !value);
  }

  onSelectEntityByName(entityName: string): void {
    const foundEntity = this.entities().find(e => e.name === entityName);
    if (foundEntity) {
      this.selectEntity(foundEntity);
      this.isMobileSidebarOpen.set(false);
    }
  }

  // ✅ Método auxiliar para el menú de la toolbar
  selectEntityByName(name: string): void {
    const found = this.entities().find(e => e.name === name);
    if (found) {
      this.selectEntity(found);
    }
  }

  onSearch(query: string): void {
    console.log('Búsqueda global:', query);
  }

  selectEntity(entity: EntityDefinition): void {
    this.selectedEntity.set(entity);
    this.showForm.set(false);
  }

  // ============================================================
  // CRUD
  // ============================================================
  editEntityItem(rowOrId: any): void {
    const config = this.selectedEntityConfig();
    if (!config) return;

    let id: any = null;

    if (typeof rowOrId === 'object' && rowOrId !== null) {
      const primaryField = config.fields.find(f => f.isPrimaryKey)?.key;
      if (primaryField && rowOrId[primaryField] !== undefined) {
        id = rowOrId[primaryField];
      } else if (rowOrId['userId'] !== undefined) {
        id = rowOrId['userId'];
      } else if (rowOrId['id'] !== undefined) {
        id = rowOrId['id'];
      }
    } else {
      id = rowOrId;
    }

    if (id === undefined || id === null || id === '') {
      console.error('🚨 [editEntityItem] No se pudo identificar la clave primaria:', rowOrId);
      return;
    }

    this.loading.set(true);
    this.crudService.getById(config, id).subscribe({
      next: (data) => {
        this.currentData.set(data);
        this.isEditing.set(true);
        this.showForm.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar registro para editar:', err);
        this.loading.set(false);
      }
    });
  }

  //
  async deleteEntityItem(rowOrId: any): Promise<void> {
    const config = this.selectedEntityConfig();
    if (!config) return;

    const primaryKeyField = config.fields.find(f => f.isPrimaryKey)?.key || 'id';
    const id = typeof rowOrId === 'object' && rowOrId !== null
      ? rowOrId[primaryKeyField]
      : rowOrId;

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.',
      cssClass: 'alert-confirm-delete',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-btn-cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: () => this.performDelete(config, id)
        }
      ]
    });

    await alert.present();
  }

  //
  private performDelete(config: EntityConfig, id: any): void {
    this.loading.set(true);

    this.crudService.delete(config, id).subscribe({
      next: () => {
        this.loading.set(false);
        this.tableComponent?.reload();
        this.showMessage('success', 'Registro eliminado correctamente', 3000);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al eliminar registro:', err);
        this.showMessage('error', this.extractErrorMessage(err), 5000);
      }
    });
  }

  openCreateForm(): void {
    this.isEditing.set(false);
    this.currentData.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.currentData.set(null);
    this.loading.set(false);
  }

  //
  handleSave(formData: any): void {
    const config = this.selectedEntityConfig();
    if (!config) return;

    this.loading.set(true);

    const request$ = this.isEditing()
      ? this.crudService.update(
          config,
          this.currentData()?.id ||
          this.currentData()?._id ||
          this.currentData()?.userId,
          formData
        )
      : this.crudService.create(config, formData);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.closeForm();
        this.tableComponent?.reload();
        this.showMessage(
          'success',
          this.isEditing()
            ? 'Registro actualizado correctamente'
            : 'Registro creado correctamente',
          3000
        );
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al guardar el registro:', err);
        this.showMessage('error', this.extractErrorMessage(err), 5000);
      }
    });
  }

  //
  private extractErrorMessage(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (err?.error?.validationErrors) {
      return Object.entries(err.error.validationErrors)
        .map(([field, msg]) => `${field}: ${msg}`)
        .join('\n');
    }
    if (err?.message) return err.message;
    return 'Error al procesar la solicitud';
  }


 // ============================================================
  // MENSAJES GLOBALES
  // ============================================================
  private showMessage(type: MessageType, message: string, duration: number = 3000): void {
    this.globalMessageType.set(type);
    this.globalMessage.set(message);
    this.globalMessageDuration.set(duration);

    // Limpiar después de la duración
    if (duration > 0) {
      setTimeout(() => {
        if (this.globalMessage() === message) {
          this.globalMessage.set(null);
        }
      }, duration);
    }
  }

  // ============================================================
  // ADAPTACIÓN DE REGISTRO
  // ============================================================
  private extractEndpoint(apiPath: string): string {
    const parts = apiPath.split('/api/v1');
    if (parts.length > 1) return parts[1];
    return apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  }

  private mapIconToIonicon(iconString: string): string {
    const map: Record<string, string> = {
      '👤': 'person-outline',
      '🛡️': 'shield-outline',
      '🔐': 'lock-closed-outline',
      '📋': 'clipboard-outline',
      '⚙️': 'settings-outline',
      '🔄': 'sync-outline',
      '🔑': 'key-outline'
    };
    return map[iconString] || iconString || 'folder-outline';
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  private getGreeting(): string {
    const hour = this.currentTime.getHours();
    if (hour < 12) return 'Buenos días 🌅';
    if (hour < 18) return 'Buenas tardes ☀️';
    return 'Buenas noches 🌙';
  }

  private updateTimeDisplay(): void {
    this.currentTimeDisplay = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(this.currentTime);
  }

  // ============================================================
  // VOZ
  // ============================================================
  private setupVoiceContext(): void {
    this.voiceContext.setContext({
      activationMessage: 'Panel de Mantenimiento de Base de Datos.',
      availableCommands: ['ayuda', 'inicio'],
      preventBackend: true
    });
  }

  private handleVoiceCommand(text: string): void {
    if (this.voiceService.isCurrentlyMuted()) return;

    const lower = text.toLowerCase().trim();
    if (lower.includes('ayuda')) {
      this.showHelp();
    }
  }

  showHelp(): void {
    this.voiceService.speak('Selecciona una entidad en el menú lateral para ver y gestionar sus registros.');
  }

  // ============================================================
  // ACCIONES
  // ============================================================
  logout(): void {
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

  volverAtras(): void {
    this.selectedEntity.set(null);
    this.closeForm();
  }
}