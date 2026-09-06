// src/app/shared/components/theme-toggle/theme-toggle.component.ts
import { 
  Component, 
  inject, 
  computed, 
  input, 
  ChangeDetectionStrategy, 
  OnInit, 
  OnDestroy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ThemeService } from '../../services/theme/theme';

// ✅ Importar servicios de autenticación (si los tienes en Ionic)
// import { AuthService } from '../../../core/services/auth.service';
// import { UserPreferencesService } from '../../../services/user-preferences/user-preferences.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  private themeService = inject(ThemeService);
  private router = inject(Router);
  
  // ✅ Si tienes AuthService en Ionic, descomenta:
  // private authService = inject(AuthService);
  // private userPreferences = inject(UserPreferencesService);
  
  private authSubscription?: Subscription;
  private routerSubscription?: Subscription;
  
  // ✅ Estado para controlar visibilidad por ruta
  shouldShow: boolean = true;
  
  isDark = computed(() => this.themeService.currentTheme() === 'dark');
  isVisible = input<boolean>(false);
  size = input<'small' | 'default' | 'large'>('default');

  // ngOnInit(): void {
  //   console.log('🌗 [ThemeToggle] Inicializado');
    
  //   // ✅ Verificar visibilidad por ruta (showTheme)
  //   this.checkRouteVisibility();
    
  //   // ✅ Escuchar cambios de ruta
  //   this.routerSubscription = this.router.events
  //     .pipe(filter(event => event instanceof NavigationEnd))
  //     .subscribe(() => {
  //       this.checkRouteVisibility();
  //     });

  //   // ✅ Si tienes autenticación en Ionic, descomenta:
  //   /*
  //   const userId = this.userPreferences.getUserId();
    
  //   if (userId) {
  //     console.log('🔄 [ThemeToggle] Cargando theme del backend para usuario:', userId);
  //     this.userPreferences.syncThemeWithBackend(userId);
  //   } else {
  //     console.log('ℹ️ [ThemeToggle] Usuario no autenticado, usando theme LIGHT por defecto');
  //     this.themeService.setTheme('light');
      
  //     this.authSubscription = this.authService.currentUser$.subscribe(user => {
  //       if (user?.id) {
  //         console.log('🔄 [ThemeToggle] Usuario autenticado, cargando theme del backend');
  //         this.userPreferences.syncThemeWithBackend(user.id);
  //       }
  //     });
  //   }
  //   */
  // }


  ngOnInit(): void {
    console.log('🌗 [ThemeToggle] Inicializado');
    
    // ✅ Verificar al inicio con pequeño retraso para que la redirección ocurra
    setTimeout(() => {
      this.checkRouteVisibility();
    }, 0);
    
    // ✅ Escuchar cambios de ruta
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRouteVisibility();
      });
  }


  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
    this.routerSubscription?.unsubscribe();
  }

  toggleTheme(): void {
    // ✅ Cambiar tema
    this.themeService.toggleTheme();
    const newTheme = this.themeService.currentTheme();
    console.log('🔄 Tema cambiado a:', newTheme);
    
    // ✅ Si tienes autenticación en Ionic, descomenta:
    /*
    const userId = this.userPreferences.getUserId();
    
    if (userId) {
      console.log(`📤 Guardando tema en backend: ${newTheme}`);
      this.userPreferences.sendPreferenceUpdateTheme(userId, newTheme as 'light' | 'dark').subscribe({
        next: () => console.log('✅ Tema guardado en backend:', newTheme),
        error: (error) => console.error('❌ Error guardando tema:', error)
      });
    } else {
      console.log('💾 Tema guardado solo en localStorage (usuario no autenticado)');
    }
    */
  }

  // ✅ Verificar si el toggle debe mostrarse según la ruta actual
  private checkRouteVisibility(): void {
    const routeData = this.getRouteData();
    
    if (routeData && routeData['showTheme'] !== undefined) {
      this.shouldShow = routeData['showTheme'] === true;
    } else {
      this.shouldShow = true;
    }
    
    console.log('🌗 [ThemeToggle] Visibilidad:', this.shouldShow, 'Ruta:', this.router.url);
  }

  // ✅ Obtener data de la ruta actual
  private getRouteData(): any {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data;
  }
}