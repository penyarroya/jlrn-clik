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

// // ✅ Tipo local: RangeValue no se exporta desde @ionic/angular
// type RangeValue = number | { lower: number; upper: number };

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
//         this.entitySelected.emit(entityName);
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

//   //
//   onColorChange(key: 'bg' | 'border', value: string | null | undefined): void {
//     // Si viene null/undefined, usamos un valor por defecto
//     const safeValue = value ?? (key === 'bg' ? '#f8fafc' : '#e2e8f0');

//     if (key === 'bg') {
//         this.backgroundColor.set(safeValue);
//         this.saveConfig('backgroundColor', safeValue);
//     } else if (key === 'border') {
//         this.borderColor.set(safeValue);
//         this.saveConfig('borderColor', safeValue);
//     }
//  }
 

//   onFontSizeChange(value: RangeValue): void {
//     const fontSize = typeof value === 'number' ? value : value.lower;
//     this.fontSize.set(fontSize);
//     this.saveConfig('fontSize', fontSize);
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










// src/app/features/admin/dynamic-entity-manager/components/entity-sidebar/entity-sidebar.component.ts

import {
  Component,
  input,
  output,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonButton,
  IonBadge,
  IonToggle,
  IonRange,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular';
import { EntityConfigService } from '../../services/sidebar/entity-config.service';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

// ✅ Tipo local: RangeValue no se exporta desde @ionic/angular
type RangeValue = number | { lower: number; upper: number };

interface EntityItem {
  label: string;
  value: string;
  icon: string;        // nombre de Ionicon (por si lo usas en otro sitio)
  iconEmoji: string;   // ← emoji original para mostrar con su color
  module: string;
}

@Component({
  selector: 'app-entity-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonButton,
    IonBadge,
    IonToggle,
    IonRange,
    IonInput,
    IonSelect,
    IonSelectOption
  ],
  templateUrl: './entity-sidebar.component.html',
  styleUrls: ['./entity-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitySidebarComponent {
  private configService = inject(EntityConfigService);

  // ============================================================
  // INPUTS / OUTPUTS
  // ============================================================
  selectedEntity = input<string>('');
  entitySelected = output<string>();

  // ============================================================
  // ESTADO DEL SIDEBAR (persistente en localStorage)
  // ============================================================
  sidebarWidth = signal<number>(this.loadConfig('sidebarWidth', 280));
  sidebarHeight = signal<string>(this.loadConfig('sidebarHeight', '100%'));
  backgroundColor = signal<string>(this.loadConfig('backgroundColor', '#f8fafc'));
  borderColor = signal<string>(this.loadConfig('borderColor', '#e2e8f0'));
  fontSize = signal<number>(this.loadConfig('fontSize', 14));
  showIcons = signal<boolean>(this.loadConfig('showIcons', true));
  scrollable = signal<boolean>(this.loadConfig('scrollable', true));
  isMinimized = signal<boolean>(this.loadConfig('isMinimized', false));
  showConfig = signal<boolean>(false);

  // ============================================================
  // COMPUTED — con emoji original + nombre de Ionicon
  // ============================================================
  entityList = computed<EntityItem[]>(() => {
    const configs = (this.configService.getConfigs() as any[]) || [];
    return configs.map(config => ({
      label: config.displayName,
      value: config.entityName,
      icon: this.mapIconToIonicon(config.icon || ''),  // Ionicon (por si acaso)
      iconEmoji: config.icon || '📄',                   // ← emoji dinámico
      module: config.module || 'otros'
    }));
  });

  currentWidth = computed<number>(() => {
    return this.isMinimized() ? 68 : this.sidebarWidth();
  });

  currentFontSize = computed<string>(() => {
    return `${this.fontSize()}px`;
  });

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons(allIcons);
  }

  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================
  selectEntity(entityName: string): void {
    if (entityName !== this.selectedEntity()) {
      this.entitySelected.emit(entityName);
    }
  }

  toggleMinimize(): void {
    this.isMinimized.update(val => !val);
    this.saveConfig('isMinimized', this.isMinimized());
  }

  toggleConfig(): void {
    this.showConfig.update(val => !val);
  }

  onWidthChange(value: RangeValue): void {
    const width = typeof value === 'number' ? value : value.lower;
    this.sidebarWidth.set(width);
    this.saveConfig('sidebarWidth', width);
  }

  onHeightChange(value: string): void {
    this.sidebarHeight.set(value);
    this.saveConfig('sidebarHeight', value);
  }

  onColorChange(key: 'bg' | 'border', value: string | null | undefined): void {
    const safeValue = value ?? (key === 'bg' ? '#f8fafc' : '#e2e8f0');

    if (key === 'bg') {
      this.backgroundColor.set(safeValue);
      this.saveConfig('backgroundColor', safeValue);
    } else if (key === 'border') {
      this.borderColor.set(safeValue);
      this.saveConfig('borderColor', safeValue);
    }
  }

  onFontSizeChange(value: RangeValue): void {
    const fontSize = typeof value === 'number' ? value : value.lower;
    this.fontSize.set(fontSize);
    this.saveConfig('fontSize', fontSize);
  }

  toggleIcons(): void {
    this.showIcons.update(val => !val);
    this.saveConfig('showIcons', this.showIcons());
  }

  toggleScroll(): void {
    this.scrollable.update(val => !val);
    this.saveConfig('scrollable', this.scrollable());
  }

  resetConfig(): void {
    this.sidebarWidth.set(280);
    this.sidebarHeight.set('100%');
    this.backgroundColor.set('#f8fafc');
    this.borderColor.set('#e2e8f0');
    this.fontSize.set(14);
    this.showIcons.set(true);
    this.scrollable.set(true);
    this.isMinimized.set(false);

    const keys = ['sidebarWidth', 'sidebarHeight', 'backgroundColor', 'borderColor', 'fontSize', 'showIcons', 'scrollable', 'isMinimized'];
    keys.forEach(key => localStorage.removeItem(`sidebar_${key}`));
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  /**
   * ✅ Convierte emojis a nombres válidos de Ionicons.
   *    Se mantiene por si en algún otro sitio quieres usar el nombre del Ionicon.
   */
  private mapIconToIonicon(iconString: string): string {
    const map: Record<string, string> = {
      '👤': 'person-outline',
      '🛡️': 'shield-outline',
      '🔐': 'lock-closed-outline',
      '📋': 'clipboard-outline',
      '⚙️': 'settings-outline',
      '🏛️': 'business-outline',
      '📚': 'library-outline',
      '📁': 'folder-outline',
      '📖': 'book-outline',
      '📄': 'document-outline',
      '📝': 'create-outline',
      '📎': 'attach-outline',
      '💬': 'chatbubble-outline',
      '🤝': 'people-circle-outline',
      '🏅': 'medal-outline',
      '⭐': 'star-outline',
      '📊': 'bar-chart-outline',
      '👥': 'people-outline',
      '🔒': 'lock-closed-outline',
      '🔑': 'key-outline',
      '📂': 'folder-open-outline',
      '🏢': 'business-outline',
      '💼': 'briefcase-outline',
      '🛒': 'cart-outline',
      '📦': 'cube-outline',
      '🎓': 'school-outline',
      '📧': 'mail-outline',
      '✉️': 'mail-outline',
      '🔔': 'notifications-outline',
      '📍': 'location-outline',
      '🗺️': 'map-outline',
      '📅': 'calendar-outline',
      '⏰': 'time-outline',
      '❤️': 'heart-outline',
      '🏠': 'home-outline',
      '🔍': 'search-outline',
      '➕': 'add-outline',
      '❌': 'close-outline',
      '✅': 'checkmark-outline',
      '⚠️': 'warning-outline',
      'ℹ️': 'information-circle-outline',
      '❓': 'help-circle-outline',
    };

    if (iconString.includes('-')) return iconString;
    return map[iconString] || 'document-outline';
  }

  private loadConfig<T>(key: string, defaultValue: T): T {
    const saved = localStorage.getItem(`sidebar_${key}`);
    if (saved !== null) {
      try {
        return JSON.parse(saved) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  private saveConfig(key: string, value: unknown): void {
    localStorage.setItem(`sidebar_${key}`, JSON.stringify(value));
  }
}