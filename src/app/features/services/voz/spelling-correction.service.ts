// src/core/services/spelling-correction.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SpellingCorrectionService {
//  
  private http = inject(HttpClient);
  
  // Usamos apiGateway como base (ej: http://localhost:8080/api)
  private baseUrl = `${environment.apiGateway}/spelling`; // ✅ CORREGIDO

  private correctionsSubject = new BehaviorSubject<Map<string, string>>(new Map());
  public corrections$ = this.correctionsSubject.asObservable();

  private loaded = false;

  /**
   * Carga todas las correcciones desde el backend.
   */
  loadCorrections(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.baseUrl}/corrections`).pipe(
      tap((data) => {
        const map = new Map(Object.entries(data));
        this.correctionsSubject.next(map);
        this.loaded = true;
        console.log(`✅ Correcciones cargadas: ${map.size} entradas`);
      })
    );
  }

  /**
   * Carga las correcciones y devuelve una promesa (para APP_INITIALIZER).
   */
  loadCorrectionsPromise(): Promise<void> {
    return firstValueFrom(this.loadCorrections()).then(() => {});
  }

  /**
   * Devuelve el mapa actual (síncrono).
   */
  getCorrectionMap(): Map<string, string> {
    return this.correctionsSubject.value;
  }

  /**
   * Aplica todas las correcciones a un texto.
   */
  applyCorrections(text: string): string {
    const map = this.getCorrectionMap();
    if (!map || map.size === 0) return text;
    let result = text;
    for (const [wrong, correct] of map) {
      result = result.replace(new RegExp(`\\b${this.escapeRegex(wrong)}\\b`, 'gi'), correct);
    }
    return result;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Envía una sugerencia de corrección al backend.
   */
  suggestCorrection(wrongWord: string, suggestedCorrect: string, context?: string): Observable<any> {
    const payload = { wrongWord, suggestedCorrect, context };
    return this.http.post(`${this.baseUrl}/suggest`, payload);
  }

  hasCorrection(word: string): boolean {
    return this.getCorrectionMap().has(word.toLowerCase());
  }

  getCorrection(word: string): string | undefined {
    return this.getCorrectionMap().get(word.toLowerCase());
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  reload(): Observable<Record<string, string>> {
    this.loaded = false;
    return this.loadCorrections();
  }
}