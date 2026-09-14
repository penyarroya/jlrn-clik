// // src/shared/services/router/previous-route.service.ts

// import { Injectable, inject } from '@angular/core';
// import { Router, NavigationStart } from '@angular/router';
// import { filter } from 'rxjs/operators';

// @Injectable({ providedIn: 'root' })
// export class PreviousRouteService {
//   private router = inject(Router); // ✅ Usar inject() en lugar de constructor
//   private previousUrl: string | null = null;

//   constructor() {
//     this.router.events.pipe(
//       filter(event => event instanceof NavigationStart)
//     ).subscribe(() => {
//       const currentUrl = this.router.url;
//       // Solo guardar si NO es /404
//       if (!currentUrl.includes('/404')) {
//         this.previousUrl = currentUrl;
//         console.log('✅ URL válida guardada como anterior:', this.previousUrl);
//       } else {
//         console.log('⚠️ URL inválida (404), no se guarda como anterior.');
//       }
//     });
//   }

//   getPreviousUrl(): string | null {
//     return this.previousUrl;
//   }
// }









// src/shared/services/router/previous-route.service.ts

import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PreviousRouteService {
  private router = inject(Router);

  private previousUrl: string | null = null;
  private currentUrl: string | null = null;

  private readonly IGNORED_ROUTES = [
    '/not-found',
    '/404',
    '/error'
  ];

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const newUrl = event.urlAfterRedirects;

        // ✅ GUARDAR SIEMPRE la URL anterior (que era la actual antes)
        if (this.currentUrl && this.currentUrl !== newUrl) {
          // Solo guardar si la URL anterior NO es ignorada
          if (!this.isIgnoredRoute(this.currentUrl)) {
            this.previousUrl = this.currentUrl;
            console.log(`✅ previousRouteService: guardada anterior: ${this.previousUrl}`);
          }
        }

        // ✅ Actualizar la URL actual SIEMPRE (incluso si es ignorada)
        this.currentUrl = newUrl;
        console.log(`✅ previousRouteService: URL actual: ${this.currentUrl}`);
      });
  }

  private isIgnoredRoute(url: string | null): boolean {
    if (!url) return true;
    if (url === '/') return true;
    return this.IGNORED_ROUTES.some(route => url.startsWith(route));
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }

  clearPreviousUrl(): void {
    this.previousUrl = null;
  }
}