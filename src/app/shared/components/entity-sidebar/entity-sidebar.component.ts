// // import { Component, OnInit } from '@angular/core';

// // @Component({
// //   selector: 'app-entity-sidebar',
// //   templateUrl: './entity-sidebar.component.html',
// //   styleUrls: ['./entity-sidebar.component.scss'],
// //   imports: [],
// // })
// // export class EntitySidebarComponent  implements OnInit {

// //   constructor() { }

// //   ngOnInit() {}

// // }




// // src/app/features/admin/dynamic-entity-manager/components/entity-sidebar/entity-sidebar.component.ts

// import { 
//   Component, 
//   input, 
//   output, 
//   inject, 
//   computed, 
//   signal, 
//   Input, 
//   ChangeDetectionStrategy 
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { 
//   IonMenu, 
//   IonHeader, 
//   IonToolbar, 
//   IonTitle, 
//   IonContent, 
//   IonList, 
//   IonItem, 
//   IonIcon, 
//   IonLabel, 
//   IonButton, 
//   IonButtons,
//   IonBadge,
//   IonToggle,
//   IonRange,
//   IonInput,
//   IonSelect,
//   IonSelectOption
// } from '@ionic/angular'; // ✅ Importar desde @ionic/angular (NO /standalone)
// import { EntityConfigService } from '../../services/sidebar/entity-config.service';
// import { addIcons } from 'ionicons';
// import * as allIcons from 'ionicons/icons';

// interface EntityItem {
//   label: string;
//   value: string;
//   icon: string;
//   module: string;
// }

// @Component({
//   selector: 'app-entity-sidebar',
//   standalone: true,
//   imports: [
//     CommonModule,
//     IonMenu,
//     IonHeader,
//     IonToolbar,
//     IonTitle,
//     IonContent,
//     IonList,
//     IonItem,
//     IonIcon,
//     IonLabel,
//     IonButton,
//     IonButtons,
//     IonBadge,
//     IonToggle,
//     IonRange,
//     IonInput,
//     IonSelect,
//     IonSelectOption
//   ],
//   templateUrl: './entity-sidebar.component.html',
//   styleUrls: ['./entity-sidebar.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class EntitySidebarComponent {
//   private configService = inject(EntityConfigService);

//   // ============================================================
//   // INPUTS / OUTPUTS
//   // ============================================================
//   selectedEntity = input<string>('');
//   entitySelected = output<string>();
//   @Input() bottomPadding: string = '20px';
//   @Input() menuId: string = 'entity-sidebar-menu';

//   // ============================================================
//   // ESTADO DEL SIDEBAR (persistente en localStorage)
//   // ============================================================
//   sidebarWidth = signal<number>(this.loadConfig('sidebarWidth', 280));
//   sidebarHeight = signal<string>(this.loadConfig('sidebarHeight', '100%'));
//   backgroundColor = signal<string>(this.loadConfig('backgroundColor', '#f8fafc'));
//   borderColor = signal<string>(this.loadConfig('borderColor', '#e2e8f0'));
//   fontSize = signal<number>(this.loadConfig('fontSize', 14));
//   showIcons = signal<boolean>(this.loadConfig('showIcons', true));
//   scrollable = signal<boolean>(this.loadConfig('scrollable', true));
//   isMinimized = signal<boolean>(this.loadConfig('isMinimized', false));
//   showConfig = signal<boolean>(false);

//   // ============================================================
//   // COMPUTED
//   // ============================================================
//   entityList = computed<EntityItem[]>(() => {
//     const configs = (this.configService.getConfigs() as any[]) || [];
//     return configs.map(config => ({
//       label: config.displayName,
//       value: config.entityName,
//       icon: config.icon || 'document-outline',
//       module: config.module || 'otros'
//     }));
//   });

//   currentWidth = computed<number>(() => {
//     return this.isMinimized() ? 68 : this.sidebarWidth();
//   });

//   currentFontSize = computed<string>(() => {
//     return `${this.fontSize()}px`;
//   });

//   // ============================================================
//   // CONSTRUCTOR
//   // ============================================================
//   constructor() {
//     addIcons(allIcons);
//   }

//   // ============================================================
//   // MÉTODOS PÚBLICOS
//   // ============================================================
  
//   selectEntity(entityName: string): void {
//     if (entityName !== this.selectedEntity()) {
//       this.onSelect.emit(entityName);
//     }
//   }

//   toggleMinimize(): void {
//     this.isMinimized.update(val => !val);
//     this.saveConfig('isMinimized', this.isMinimized());
//   }

//   toggleConfig(): void {
//     this.showConfig.update(val => !val);
//   }

//   onWidthChange(value: number): void {
//     this.sidebarWidth.set(value);
//     this.saveConfig('sidebarWidth', value);
//   }

//   onHeightChange(value: string): void {
//     this.sidebarHeight.set(value);
//     this.saveConfig('sidebarHeight', value);
//   }

//   onColorChange(key: 'bg' | 'border', value: string): void {
//     if (key === 'bg') {
//       this.backgroundColor.set(value);
//       this.saveConfig('backgroundColor', value);
//     } else if (key === 'border') {
//       this.borderColor.set(value);
//       this.saveConfig('borderColor', value);
//     }
//   }

//   onFontSizeChange(value: number): void {
//     this.fontSize.set(value);
//     this.saveConfig('fontSize', value);
//   }

//   toggleIcons(): void {
//     this.showIcons.update(val => !val);
//     this.saveConfig('showIcons', this.showIcons());
//   }

//   toggleScroll(): void {
//     this.scrollable.update(val => !val);
//     this.saveConfig('scrollable', this.scrollable());
//   }

//   resetConfig(): void {
//     this.sidebarWidth.set(280);
//     this.sidebarHeight.set('100%');
//     this.backgroundColor.set('#f8fafc');
//     this.borderColor.set('#e2e8f0');
//     this.fontSize.set(14);
//     this.showIcons.set(true);
//     this.scrollable.set(true);
//     this.isMinimized.set(false);
    
//     const keys = ['sidebarWidth', 'sidebarHeight', 'backgroundColor', 'borderColor', 'fontSize', 'showIcons', 'scrollable', 'isMinimized'];
//     keys.forEach(key => localStorage.removeItem(`sidebar_${key}`));
//   }

//   // ============================================================
//   // MÉTODOS PRIVADOS
//   // ============================================================
//   private loadConfig<T>(key: string, defaultValue: T): T {
//     const saved = localStorage.getItem(`sidebar_${key}`);
//     if (saved !== null) {
//       try {
//         return JSON.parse(saved) as T;
//       } catch {
//         return defaultValue;
//       }
//     }
//     return defaultValue;
//   }

//   private saveConfig(key: string, value: unknown): void {
//     localStorage.setItem(`sidebar_${key}`, JSON.stringify(value));
//   }
// }