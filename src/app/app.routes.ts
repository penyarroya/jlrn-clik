import { Routes } from '@angular/router';

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
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login/login-component').then(m => m.LoginComponent),
    data: { showTheme: true }
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/components/register/register-component/register-component.component').then(m => m.RegisterComponent),
    data: { showTheme: true }
  },
  // ✅ AÑADIR: Página About
  {
    path: 'about',
    loadComponent: () => import('./features/pages/static/about/about.component').then(m => m.AboutComponent),
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