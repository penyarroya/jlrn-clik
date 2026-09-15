import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/guest/guest.guard';
import { authGuard } from './core/guards/auth/auth-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('../app/features/pages/public/home/home.page').then((m) => m.HomePage),
    data: { showTheme: false } 
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  // ✅ AÑADIR: Página About
  {
    path: 'about',
    loadComponent: () => import('./features/pages/static/about/about.component').then(m => m.AboutComponent),
    data: { showTheme: false }
  },
  {
    path: 'server-down',
    loadComponent: () => import('./features/pages/static/maintenance/maintenance.component').then(m => m.MaintenanceComponent),
    title: 'Servidor no disponible - VozAcction',
    data: { showTheme: false }
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login-component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Inicio de sesión - VozAcción',
    data: { showTheme: true }
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register-component/register-component.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Nuevo usuario - VozAcction',
    data: { showTheme: true }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/components/password/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
    title: 'Recuperar Contraseña - VozAcction',
    data: { showTheme: false }
  },
  // =========================================================================
  // RUTAS PRIVADAS (requieren autenticación)
  // =========================================================================
  {
    path: 'dashboard',
    loadComponent: () => import('./features/pages/public/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Panel de Control - VozAcction',
    data: { showTheme: false }
  },
  // =========================================================================
  // DATABASE-MAINTENANCE
  // =========================================================================
  {
  path: 'admin/database-maintenance',
    loadComponent: () => import('./features/pages/admin/components/database-maintenance/database-maintenance.component').then(m => m.DatabaseMaintenanceComponent),
    //canActivate: [authGuard],
    title: 'Mantenimiento de Base de Datos - VozAcction',
    data: { showTheme: false }
  },
  // ✅ AÑADIR: Página Not Found
  {
    path: 'not-found',
    loadComponent: () => import('./features/pages/static/not-found/not-found.component').then(m => m.NotFoundComponent),
    data: { showTheme: false }
  },
  // ✅ AÑADIR: Ruta comodín (404) - SIEMPRE AL FINAL
  {
    path: '**',
    redirectTo: 'not-found'
  }
];