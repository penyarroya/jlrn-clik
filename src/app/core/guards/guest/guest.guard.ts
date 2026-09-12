// src/app/core/guards/guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../features/auth/Services/auth-service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🔥 Verificar si viene de mantenimiento
  const fromMaintenance = route.queryParams['from'] === 'maintenance';

  if (authService.isAuthenticated()) {
    // 🔥 Si viene de mantenimiento, forzar logout y permitir acceso a login
    if (fromMaintenance) {
      console.log('🔄 [guestGuard] Viniendo de mantenimiento, forzando logout y permitiendo login');
      authService.fullLocalLogout();
      return true; // Permitir acceso a login
    }
    
    console.log('🔍 guestGuard - Usuario autenticado, redirigiendo a: /home');
    return router.parseUrl('/home');
  }

  console.log('🔍 guestGuard - Usuario NO autenticado, permitiendo acceso');
  return true;
};