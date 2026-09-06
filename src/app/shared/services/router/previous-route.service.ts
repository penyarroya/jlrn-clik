// src/shared/services/router/previous-route.service.ts

import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PreviousRouteService {
  private router = inject(Router); // ✅ Usar inject() en lugar de constructor
  private previousUrl: string | null = null;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      const currentUrl = this.router.url;
      // Solo guardar si NO es /404
      if (!currentUrl.includes('/404')) {
        this.previousUrl = currentUrl;
        console.log('✅ URL válida guardada como anterior:', this.previousUrl);
      } else {
        console.log('⚠️ URL inválida (404), no se guarda como anterior.');
      }
    });
  }

  getPreviousUrl(): string | null {
    return this.previousUrl;
  }
}