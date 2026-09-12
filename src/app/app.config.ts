// // src/app/app.config.ts

// import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
// import { provideRouter } from '@angular/router';
// import { provideHttpClient, withInterceptors } from '@angular/common/http';
// import { routes } from './app.routes';
// import { authInterceptor } from './core/interceptors/auth-interceptor';
// import { healthInterceptor } from './core/interceptors/health-interceptor';

// export const appConfig: ApplicationConfig = {
//   providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }),
//     provideRouter(routes),
//     provideHttpClient(
//       withInterceptors([
//         //authInterceptor, 
//         healthInterceptor,
//       ])  // ✅ Registrar los  interceptor
//     )
//   ]
// };








// src/app/app.config.ts
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import {
  RouteReuseStrategy,
  provideRouter,
  withComponentInputBinding,
  withPreloading,
  PreloadAllModules
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { healthInterceptor } from './core/interceptors/health-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Zoneless: NO requiere Zone.js
    provideZonelessChangeDetection(),

    // ✅ Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),

    // ✅ Rutas
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withComponentInputBinding()
    ),

    // ✅ HTTP con interceptores
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        healthInterceptor,
      ])
    ),
  ],
};