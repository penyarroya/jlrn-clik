// // src/app/core/interceptors/health-interceptor.ts
// import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { catchError, throwError } from 'rxjs';

// export const healthInterceptor: HttpInterceptorFn = (req, next) => {
//   // ✅ LOG DENTRO DE LA FUNCIÓN (no se elimina con tree-shaking)
//   console.log('🚀 [healthInterceptor] PASANDO:', req.method, req.url);

//   const router = inject(Router);

//   // 🚫 Excluir peticiones que no deben ser interceptadas
//   const isExcluded =
//     req.url.includes('/actuator/health') ||
//     req.url.includes('/actuator/info') ||
//     req.url.includes('.json') ||
//     req.url.includes('/menus/') ||
//     req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|css|js|map)$/i);

//   if (isExcluded) {
//     return next(req);
//   }

//   // ⚠️ Si ya estamos en /server-down, no redirigir
//   if (router.url.startsWith('/server-down')) {
//     return next(req);
//   }

//   return next(req).pipe(
//     catchError((error: HttpErrorResponse) => {
//       console.log('🔍 [healthInterceptor] Error en:', req.url, '→ status:', error.status);

//       const isAuthError = error.status === 401 || error.status === 403;
//       const isCritical = (error.status === 0 || error.status >= 500) && !isAuthError;

//       if (isCritical) {
//         console.error('🚨 [healthInterceptor] Backend caído o error crítico:', error.status);
//         router.navigate(['/server-down']);
//       }

//       return throwError(() => error);
//     })
//   );
// };




// src/app/core/interceptors/health-interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const healthInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🚀 [healthInterceptor] PASANDO:', req.method, req.url);

  const router = inject(Router);

  // 🚫 Excluir peticiones que no deben ser interceptadas
  const isExcluded =
    req.url.includes('/actuator/health') ||
    req.url.includes('/actuator/info') ||
    req.url.includes('.json') ||
    req.url.includes('/menus/') ||
    req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico|woff|woff2|ttf|eot|css|js|map)$/i);

  if (isExcluded) {
    return next(req);
  }

  // ⚠️ Si ya estamos en /server-down, no redirigir
  if (router.url.startsWith('/server-down')) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('🔍 [healthInterceptor] Error en:', req.url, '→ status:', error.status);

      // ✅ SOLO redirigir a /server-down si:
      //   1) El servidor está INALCANZABLE (status 0: backend apagado, sin red, timeout, DNS, CORS)
      //   2) O si el endpoint consultado ES el health check y devuelve 5xx
      const isNetworkDown = error.status === 0;
      const isHealthEndpointDown =
        error.url?.includes('/actuator/health') && error.status >= 500;

      const isServerDown = isNetworkDown || isHealthEndpointDown;

      if (isServerDown) {
        console.error('🚨 [healthInterceptor] Servidor caído:', error.status, error.url);
        router.navigate(['/server-down']);
      } else {
        // Errores de negocio (400, 401, 403, 404, 409, 422, 500 puntual...)
        // se propagan al componente para que muestre el mensaje adecuado.
        console.warn('⚠️ [healthInterceptor] Error de negocio propagado:', error.status, req.url);
      }

      return throwError(() => error);
    })
  );
};