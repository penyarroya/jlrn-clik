// // src/main.ts
// import { bootstrapApplication } from '@angular/platform-browser';
// import {
//   RouteReuseStrategy,
//   provideRouter,
//   withComponentInputBinding,
//   withPreloading,
//   PreloadAllModules
// } from '@angular/router';
// import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

// import { routes } from './app/app.routes';
// import { AppComponent } from './app/app.component';
// import { provideHttpClient, withInterceptors } from '@angular/common/http';
// import { authInterceptor } from './app/core/interceptors/auth-interceptor';
// import { healthInterceptor } from './app/core/interceptors/health-interceptor';

// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
//     provideIonicAngular(),
//     provideRouter(
//       routes,
//       withPreloading(PreloadAllModules),
//       withComponentInputBinding()
//     ),
//     provideHttpClient(
//       withInterceptors([
//         authInterceptor,
//         healthInterceptor,
//       ])
//     ),
//   ],
// }).catch((err) => console.error('❌ Error al arrancar la app:', err));










// src/main.ts
// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app.component';
// import { appConfig } from './app/app.config';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error('❌ Error al arrancar la app:', err));



// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// ✅ Limpiar sesión ANTES de arrancar Angular
//    Así AuthService.getInitialUser() no ve residuos
if (typeof window !== 'undefined' && window.localStorage) {
  const AUTH_KEYS = [
    'user_info',
    'userEmail',
    'access_token',
    'accessToken',
    'refreshToken',
    'refresh_token'
  ];

  let cleaned = 0;
  AUTH_KEYS.forEach(key => {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      cleaned++;
    }
  });

  if (!environment.production) {
    console.log(`🧹 [main] Sesión limpiada antes del bootstrap (${cleaned} claves)`);
  }
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('❌ Error al arrancar la app:', err));