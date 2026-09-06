// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../features/auth/Services/auth-service';

/**
 * ✅ Guard para rutas protegidas
 * Redirige a login si el usuario no está autenticado
 */
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

/**
 * ✅ Guard para rutas públicas (login, register, etc.)
 * Redirige a dashboard si el usuario ya está autenticado
 */
export const publicGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};