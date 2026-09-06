// import { Component, OnInit } from '@angular/core';

// @Component({
//   selector: 'app-transparent-toolbar',
//   templateUrl: './transparent-toolbar.component.html',
//   styleUrls: ['./transparent-toolbar.component.scss'],
//   imports: [],
// })
// export class TransparentToolbarComponent  implements OnInit {

//   constructor() { }

//   ngOnInit() {}

// }









// src/app/shared/components/transparent-toolbar/transparent-toolbar.component.ts

import { 
  Component, 
  inject, 
  Input, 
  Output, 
  EventEmitter, 
  signal, 
  computed, 
  HostListener, 
  ChangeDetectorRef, 
  OnChanges, 
  SimpleChanges, 
  OnInit, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonIcon, 
  IonButtons, 
  IonButton, 
  IonInput, 
  IonBadge, 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonItemDivider 
} from '@ionic/angular';
import { ThemeService } from '../../services/theme/theme';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

// ============================================================
// INTERFACES
// ============================================================

export interface NavLink {
  label: string;
  route: string;
  icon?: string;
  roles?: string[];
}

export interface UserMenuItem {
  label?: string;
  icon?: string;
  route?: string;
  action?: () => void;
  isDivider?: boolean;
  class?: string;
  roles?: string[];
  actionId?: string;
}

export interface ToolbarConfig {
  title?: string;
  position?: 'fixed' | 'sticky' | 'relative';
  backgroundColor?: string;
  backgroundOpacity?: number;
  showLogo?: boolean;
  showThemeToggle?: boolean;
  showMicToggle?: boolean;
  showUserAvatar?: boolean;
  showBackButton?: boolean;
  showHelp?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserGreeting?: boolean;
  greeting?: string;
  userNameDisplay?: string;
  userEmailDisplay?: string;
  currentTimeDisplay?: string;
  navLinks?: NavLink[];
  userMenuItems?: UserMenuItem[];
  unreadNotifications?: number;
}

@Component({
  selector: 'app-transparent-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonIcon,
    IonButtons,
    IonButton,
    IonInput,
    IonBadge,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonItemDivider
  ],
  templateUrl: './transparent-toolbar.component.html',
  styleUrls: ['./transparent-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransparentToolbarComponent implements OnChanges, OnInit {
  // ============================================================
  // INYECCIONES
  // ============================================================
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private themeService = inject(ThemeService);

  // ============================================================
  // INPUTS
  // ============================================================
  @Input() config: ToolbarConfig = {};
  @Input() title = 'Mi App';
  @Input() showLogo = true;
  @Input() showThemeToggle = true;
  @Input() showMicToggle = true;
  @Input() showUserAvatar = true;
  @Input() showBackButton = false;
  @Input() showHelp = false;
  @Input() showSearch = false;
  @Input() showNotifications = false;
  @Input() navLinks: NavLink[] = [];
  @Input() backgroundColor = 'transparent';
  @Input() position: 'fixed' | 'sticky' | 'relative' = 'fixed';
  @Input() backgroundOpacity = 0.85;
  @Input() greeting = '';
  @Input() userNameDisplay = '';
  @Input() userEmailDisplay = '';
  @Input() currentTimeDisplay = '';
  @Input() showUserGreeting = false;
  @Input() userMenuItems: UserMenuItem[] = [];

  // ============================================================
  // OUTPUTS - Con prefijo para evitar conflictos con eventos DOM
  // ============================================================
  @Output() backEvent = new EventEmitter<void>();
  @Output() helpEvent = new EventEmitter<void>();
  @Output() searchEvent = new EventEmitter<string>();
  @Output() themeToggled = new EventEmitter<string>();
  @Output() micToggled = new EventEmitter<boolean>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() loginEvent = new EventEmitter<void>();
  @Output() logoutEvent = new EventEmitter<void>();
  @Output() mobileMenuClick = new EventEmitter<void>();

  // ============================================================
  // ESTADO
  // ============================================================
  isAuthenticated = signal<boolean>(false);
  readonly userName = computed(() => 'Usuario');
  readonly userEmail = computed(() => 'usuario@email.com');
  isMicActive = signal<boolean>(false);
  isDarkTheme = computed(() => this.themeService.currentTheme() === 'dark');
  isMobileMenuOpen = signal<boolean>(false);
  isSearchOpen = signal<boolean>(false);
  isScrolled = signal<boolean>(false);
  unreadNotifications = 3;
  userRoles = signal<string[]>([]);

  // ============================================================
  // SEÑAL PARA LA CONFIGURACIÓN RESUELTA
  // ============================================================
  private _resolvedConfig = signal<ToolbarConfig>({});
  readonly resolvedConfig = this._resolvedConfig.asReadonly();

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons(allIcons);
  }

  // ============================================================
  // HOST LISTENERS
  // ============================================================
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 50);
  }

  // ============================================================
  // CICLO DE VIDA
  // ============================================================
  ngOnInit(): void {
    this.updateResolvedConfig();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentTimeDisplay']) {
      this.updateResolvedConfig();
    }
    if (changes['config'] || changes['userMenuItems'] || changes['navLinks']) {
      this.updateResolvedConfig();
    }
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================
  private updateResolvedConfig(): void {
    const c = this.config || {};
    const result = {
      title: this.title !== 'Mi App' || c.title === undefined ? this.title : c.title,
      position: this.position || c.position,
      backgroundColor: this.backgroundColor || c.backgroundColor,
      backgroundOpacity: this.backgroundOpacity ?? c.backgroundOpacity,
      showLogo: c.showLogo ?? this.showLogo,
      showThemeToggle: c.showThemeToggle ?? this.showThemeToggle,
      showMicToggle: c.showMicToggle ?? this.showMicToggle,
      showUserAvatar: c.showUserAvatar ?? this.showUserAvatar,
      showBackButton: c.showBackButton ?? this.showBackButton,
      showHelp: c.showHelp ?? this.showHelp,
      showSearch: c.showSearch ?? this.showSearch,
      showNotifications: c.showNotifications ?? this.showNotifications,
      showUserGreeting: c.showUserGreeting ?? this.showUserGreeting,
      greeting: this.greeting || c.greeting,
      userNameDisplay: this.userNameDisplay || c.userNameDisplay,
      userEmailDisplay: this.userEmailDisplay || c.userEmailDisplay,
      currentTimeDisplay: this.currentTimeDisplay || c.currentTimeDisplay,
      navLinks: this.navLinks.length ? this.navLinks : c.navLinks || [],
      userMenuItems: this.userMenuItems.length ? this.userMenuItems : c.userMenuItems || [],
      unreadNotifications: this.unreadNotifications ?? c.unreadNotifications,
    };

    const userRoles = this.userRoles();
    const filteredNavLinks = this.filterByRoles(result.navLinks, userRoles);
    const filteredUserMenuItems = this.filterByRoles(result.userMenuItems, userRoles);

    this._resolvedConfig.set({
      ...result,
      navLinks: filteredNavLinks,
      userMenuItems: filteredUserMenuItems,
    });

    this.cdr.detectChanges();
  }

  private filterByRoles<T extends { roles?: string[] }>(items: T[], userRoles: string[]): T[] {
    if (!items || items.length === 0) return [];
    if (!userRoles || userRoles.length === 0) {
      return items.filter(item => !item.roles || item.roles.length === 0);
    }
    return items.filter(item => {
      if (!item.roles || item.roles.length === 0) return true;
      return item.roles.some(role => userRoles.includes(role));
    });
  }

  // ============================================================
  // GETTERS
  // ============================================================
  get backgroundColorStyle(): string {
    if (this.backgroundColor === 'transparent') {
      return `rgba(var(--ion-background-color-rgb, 255, 255, 255), ${this.backgroundOpacity})`;
    }
    return this.backgroundColor;
  }

  get toolbarClasses(): string {
    const classes = [
      `position-${this.position}`,
      this.isDarkTheme() ? 'dark' : 'light',
      this.isScrolled() ? 'scrolled' : ''
    ];
    if (this.backgroundColor === 'transparent') {
      classes.push('transparent');
    }
    return classes.join(' ');
  }

  // ============================================================
  // MÉTODOS PÚBLICOS - TODOS CORREGIDOS
  // ============================================================

  toggleTheme(): void {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.currentTheme();
    this.themeToggled.emit(newTheme);
  }

  toggleMic(): void {
    this.isMicActive.set(!this.isMicActive());
    this.micToggled.emit(this.isMicActive());
  }

  toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
    if (!this.isSearchOpen()) {
      this.searchEvent.emit('');  // ✅ Corregido
    }
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchEvent.emit('');  // ✅ Corregido
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchEvent.emit(input.value);  // ✅ Corregido
  }

  onSearchSubmit(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchEvent.emit(input.value);  // ✅ Corregido
    this.isSearchOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  onMobileMenuClick(): void {
    this.mobileMenuClick.emit();
  }

  onBack(): void {
    this.backEvent.emit();  // ✅ Corregido
    window.history.back();
  }

  onHelp(): void {
    this.helpEvent.emit();  // ✅ Corregido
  }

  onNotificationClick(): void {
    this.unreadNotifications = 0;
    this.notificationClick.emit();
  }

  onLogin(): void {
    this.loginEvent.emit();  // ✅ Corregido
    this.router.navigate(['/login']);
  }

  onLogout(): void {
    this.isAuthenticated.set(false);
    this.logoutEvent.emit();  // ✅ Corregido
    this.router.navigate(['/login']);
  }

  isActiveRoute(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}