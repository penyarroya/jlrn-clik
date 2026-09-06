// src/app/core/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../features/auth/Services/auth-service';

/**
 * ✅ Interceptor de autenticación con HttpInterceptorFn
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 🟢 ENDPOINTS PÚBLICOS (no requieren token)
  const publicEndpoints = [
    '/auth/login',
    '/auth/register',
    '/auth/user-info',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/actuator/health',
    '/actuator/info'
  ];

  const isPublic = publicEndpoints.some(endpoint => req.url.includes(endpoint));

  // ✅ CLONAR CON withCredentials: true (CRUCIAL PARA COOKIES)
  const reqWithCreds = req.clone({
    withCredentials: true
  });

  // ✅ Si es un endpoint público, pasar directamente
  if (isPublic) {
    return next(reqWithCreds);
  }

  // ✅ Para endpoints protegidos, añadir el token
  const token = authService.getToken();
  let authReq = reqWithCreds;

  if (token) {
    authReq = reqWithCreds.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ✅ Si es 401 y no es refresh, intentar renovar token
      if (error.status === 401 && !req.url.includes('/refresh')) {
        console.warn('🔴 Access token expirado, intentando refresh...');
        
        return authService.refreshToken().pipe(
          switchMap(() => {
            console.log('✅ Token renovado, reintentando petición:', req.url);
            
            // ✅ Reintentar CON withCredentials y el nuevo token
            const newToken = authService.getToken();
            const retryReq = req.clone({
              withCredentials: true,
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.warn('🔴 Refresh token expirado, redirigiendo a login');
            authService.fullLocalLogout();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }
      
      return throwError(() => error);
    })
  );
};