import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { 
  BehaviorSubject, 
  Observable, 
  of, 
  throwError, 
  catchError, 
  tap, 
  map, 
  switchMap 
} from 'rxjs';
import {
  UserPreferences,
  UserPreferenceResponseDTO,
  VoicePreferencesDto,
  VoicePreferencesUpdateRequest,
  ThemeOption
} from '../../models/user-preferences/user-preferences.model';
import { ThemeService } from '../theme/theme';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  // ============================================================
  // INYECCIONES
  // ============================================================
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  
  // ============================================================
  // CONSTANTES
  // ============================================================
  private readonly STORAGE_KEY = 'user_preferences';
  private userId = signal<number | null>(null);
  private isLoadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private preferencesSubject = new BehaviorSubject<UserPreferences | null>(null);
  
  // ============================================================
  // ESTADO PÚBLICO (Signals)
  // ============================================================
  public preferences = signal<UserPreferences | null>(null);
  public theme = computed<ThemeOption>(() => this.preferences()?.theme || 'light');
  public isLoading = this.isLoadingSignal.asReadonly();
  public error = this.errorSignal.asReadonly();
  public preferences$ = this.preferencesSubject.asObservable();
  
  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    console.log('🏗️ UserPreferencesService constructor');
    
    effect(() => {
      const prefs = this.preferences();
      if (prefs) this.saveToLocalStorage(prefs);
    });
    
    this.loadPreferences().subscribe();
  }
  
  // ============================================================
  // MÉTODOS PÚBLICOS
  // ============================================================
  
  loadPreferences(): Observable<UserPreferences> {
    const userId = this.userId();
    
    if (!userId) {
      console.log('⚠️ Usuario no autenticado, usando preferencias locales');
      return this.loadLocalPreferences();
    }
    
    console.log(`✅ Usuario autenticado (ID: ${userId}), cargando preferencias del backend`);
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);
    
    const localPrefs = this.loadFromLocalStorage();
    if (localPrefs) {
      this.updateState(localPrefs);
      this.syncWithBackend(userId, localPrefs).subscribe({
        next: (synced) => {
          this.updateState(synced);
          this.isLoadingSignal.set(false);
        },
        error: () => this.isLoadingSignal.set(false)
      });
      return of(localPrefs);
    }
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/dto`;
    
    return this.http.get<UserPreferenceResponseDTO>(url)
      .pipe(
        map(dto => this.mapDtoToFrontend(dto)),
        tap(prefs => {
          this.updateState(prefs);
          this.isLoadingSignal.set(false);
          console.log('✅ Preferencias cargadas desde backend:', prefs);
        }),
        catchError((error) => {
          this.errorSignal.set('Error al cargar preferencias');
          this.isLoadingSignal.set(false);
          console.error('❌ Error cargando preferencias:', error);
          return this.loadLocalPreferences();
        })
      );
  }
  
  savePreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    const current = this.getCurrentPreferences();
    const updated = { ...current, ...preferences };
    this.updateState(updated);
    
    const userId = this.userId();
    if (!userId) {
      console.log('ℹ️ Usuario no autenticado, guardando solo en localStorage');
      return of(updated);
    }
    
    const updates = this.mapFrontendToMap(updated);
    
    console.log(`📤 Enviando preferencias al backend para usuario ${userId}`);
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences`;
    
    return this.http.patch<UserPreferenceResponseDTO>(url, updates)
      .pipe(
        map(dto => this.mapDtoToFrontend(dto)),
        tap(savedPrefs => {
          this.updateState(savedPrefs);
          console.log('✅ Preferencias guardadas en backend:', savedPrefs);
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Error guardando preferencias en backend:', error);
          this.updateState(current);
          return throwError(() => error);
        })
      );
  }
  
  updatePreference<K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ): Observable<UserPreferences> {
    const current = this.getCurrentPreferences();
    const previousValue = current[key];
    
    this.updateField(key, value);
    
    if (key === 'theme') {
      this.themeService.setTheme(value as 'light' | 'dark');
    }
    
    const userId = this.userId();
    if (!userId) {
      console.log(`ℹ️ Usuario no autenticado, guardando ${key} solo en localStorage`);
      return of(this.getCurrentPreferences());
    }
    
    console.log(`📤 Enviando ${key}=${value} al backend para usuario ${userId}`);
    
    return this.sendPreferenceUpdate(userId, key, value).pipe(
      catchError((error) => {
        console.error(`❌ Error actualizando ${key} en backend:`, error);
        this.updateField(key, previousValue);
        if (key === 'theme') {
          this.themeService.setTheme(previousValue as 'light' | 'dark');
        }
        return throwError(() => error);
      })
    );
  }
  
  resetPreferences(): Observable<UserPreferences> {
    const userId = this.userId();
    
    if (!userId) {
      const defaults = this.getDefaultPreferences();
      this.updateState(defaults);
      return of(defaults);
    }
    
    this.isLoadingSignal.set(true);
    
    const resetUrl = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/reset`;
    
    return this.http.post<void>(resetUrl, null)
      .pipe(
        switchMap(() => this.http.get<UserPreferenceResponseDTO>(`${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/dto`)),
        map(dto => this.mapDtoToFrontend(dto)),
        tap(savedPrefs => {
          this.updateState(savedPrefs);
          this.isLoadingSignal.set(false);
          console.log('✅ Preferencias reseteadas en backend');
        }),
        catchError((error) => {
          this.errorSignal.set('Error al resetear preferencias');
          this.isLoadingSignal.set(false);
          console.error('❌ Error reseteando preferencias:', error);
          const defaults = this.getDefaultPreferences();
          this.updateState(defaults);
          return of(defaults);
        })
      );
  }
  
  getCurrentPreferences(): UserPreferences {
    return this.preferences() || this.loadFromLocalStorage() || this.getDefaultPreferences();
  }
  
  getPreference<K extends keyof UserPreferences>(key: K): UserPreferences[K] | null {
    const prefs = this.getCurrentPreferences();
    return prefs ? prefs[key] : null;
  }
  
  getVoicePreferences(): Observable<VoicePreferencesDto> {
    const userId = this.userId();
    if (!userId) {
      const current = this.getCurrentPreferences();
      return of({
        defaultVoice: current.defaultVoice,
        defaultSpeed: current.defaultSpeed,
        defaultLanguage: current.language,
        defaultSilenceDuration: current.defaultSilenceDuration,
        totalStep: current.totalStep
      });
    }
    
    return this.http.get<VoicePreferencesDto>(`${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/voice`);
  }
  
  updateVoicePreferences(request: VoicePreferencesUpdateRequest): Observable<UserPreferences> {
    const userId = this.userId();
    if (!userId) {
      const current = this.getCurrentPreferences();
      const updated = { ...current, ...request };
      this.updateState(updated);
      return of(updated);
    }
    
    return this.http.put<VoicePreferencesDto>(`${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/voice`, request)
      .pipe(
        map(voiceDto => {
          const current = this.getCurrentPreferences();
          return {
            ...current,
            defaultVoice: voiceDto.defaultVoice,
            defaultSpeed: voiceDto.defaultSpeed,
            defaultSilenceDuration: voiceDto.defaultSilenceDuration,
            totalStep: voiceDto.totalStep,
            language: voiceDto.defaultLanguage
          };
        }),
        tap(updated => {
          this.updateState(updated);
          console.log('✅ Preferencias de voz actualizadas en backend:', updated);
        })
      );
  }
  
  clearPreferences(): void {
    const userId = this.userId();
    const key = `${this.STORAGE_KEY}_${userId || 'anonymous'}`;
    localStorage.removeItem(key);
    this.userId.set(null);
    this.preferences.set(null);
    this.preferencesSubject.next(null);
    this.isLoadingSignal.set(false);
    this.errorSignal.set(null);
    console.log('🧹 Preferencias limpiadas');
  }
  
  public setUserId(userId: number): void {
    console.log(`🔄 [UserPreferencesService] setUserId llamado con: ${userId}`);
    console.log(`🔄 [UserPreferencesService] userId ANTES: ${this.userId()}`);
    
    this.userId.set(userId);
    
    console.log(`🔄 [UserPreferencesService] userId DESPUÉS: ${this.userId()}`);
    
    this.loadPreferences().subscribe({
      next: (prefs) => {
        console.log('✅ Preferencias recargadas con nuevo userId:', prefs);
      },
      error: (error) => {
        console.error('❌ Error recargando preferencias:', error);
      }
    });
  }

  public getUserId(): number | null {
    return this.userId();
  }

  /**
   * ✅ Sincroniza el theme con el backend
   * SIEMPRE intenta cargar del backend, si falla usa LIGHT por defecto
   */
  public syncThemeWithBackend(userId: number): void {
    if (!userId) {
      console.warn('⚠️ No se puede sincronizar theme: userId es null');
      return;
    }
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/theme`;
    
    this.http.get<{ theme: string }>(url, {
      withCredentials: true
    }).subscribe({
      next: (response) => {
        const theme = response.theme?.toLowerCase() as 'light' | 'dark' || 'light';
        console.log(`📥 Theme cargado del backend: ${theme}`);
        
        // ✅ Actualizar el theme en el servicio
        this.themeService.setTheme(theme);
        
        // ✅ Actualizar preferencias locales
        const current = this.getCurrentPreferences();
        this.updateState({
          ...current,
          theme: theme
        });
      },
      error: (error) => {
        console.warn('⚠️ No se pudo cargar el theme del backend:', error);
        // ✅ Usar LIGHT por defecto
        console.log('💡 Usando theme por defecto: LIGHT');
        this.themeService.setTheme('light');
      }
    });
  }

  /**
   * Sincroniza el tema local con el backend al hacer login
   * Si el tema local es diferente al del backend, se actualiza el backend
   */
  public syncThemeOnLogin(userId: number): void {
    // 1. Obtener tema del backend
    this.getUserTheme(userId).subscribe({
      next: (backendTheme) => {
        console.log(`📥 Theme del backend: ${backendTheme}`);
        
        // 2. Obtener tema de localStorage
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        console.log(`💾 Theme de localStorage: ${localTheme}`);
        
        // 3. Si son diferentes, actualizar el backend con el tema local
        if (localTheme !== backendTheme) {
          console.log(`🔄 Sincronizando: localStorage (${localTheme}) → Backend`);
          this.sendPreferenceUpdateTheme(userId, localTheme).subscribe({
            next: () => console.log('✅ Tema sincronizado con el backend'),
            error: (error) => console.error('❌ Error sincronizando tema:', error)
          });
        } else {
          console.log('✅ Temas sincronizados, no hay cambios');
        }
      },
      error: (error) => {
        console.warn('⚠️ No se pudo obtener tema del backend:', error);
        // Si falla, usar el tema local
        const localTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'light';
        this.themeService.setTheme(localTheme);
      }
    });
  }

  /**
   * Obtiene el theme del usuario desde el backend
   */
  public getUserTheme(userId: number): Observable<string> {
    if (!userId) {
      return throwError(() => new Error('userId es requerido'));
    }
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/theme`;
    
    return this.http.get<{ theme: string }>(url, { withCredentials: true }).pipe(
      map(response => response.theme?.toLowerCase() || 'light'),
      catchError((error) => {
        console.error('❌ Error obteniendo theme del backend:', error);
        return of('light');
      })
    );
  }
  

  /**
   * ✅ Enviar SOLO el campo theme al backend
   */
  public sendPreferenceUpdateTheme(userId: number, value: 'light' | 'dark'): Observable<UserPreferences> {
    if (!userId) {
      console.error('❌ userId es null o undefined');
      return throwError(() => new Error('Usuario no autenticado'));
    }
    
    const paramValue = value === 'dark' ? 'DARK' : 'LIGHT';
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/theme?theme=${encodeURIComponent(paramValue)}`;
    
    console.log(`📤 PATCH ${url}`);
    
    return this.http.patch<void>(url, null)
      .pipe(
        map(() => {
          console.log(`✅ Theme actualizado en backend: ${paramValue}`);
          return this.getCurrentPreferences();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`❌ Error actualizando theme:`, error);
          console.error(`❌ URL: ${url}`);
          console.error(`❌ Status: ${error.status}`);
          console.error(`❌ Message: ${error.message}`);
          return throwError(() => error);
        })
      );
  }
  
  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================
  
  private updateField<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]): void {
    const current = this.preferences();
    if (!current) return;
    
    const updated = { ...current, [key]: value };
    
    this.preferences.set(updated);
    this.preferencesSubject.next(updated);
    this.saveToLocalStorage(updated);
    
    console.log(`🔄 Campo actualizado: ${key} = ${value}`);
  }
  
  private updateState(prefs: UserPreferences): void {
    this.preferences.set(prefs);
    this.preferencesSubject.next(prefs);
    this.saveToLocalStorage(prefs);
    this.themeService.setTheme(prefs.theme);
  }
  
  private syncWithBackend(userId: number, localPrefs: UserPreferences): Observable<UserPreferences> {
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/dto`;
    
    return this.http.get<UserPreferenceResponseDTO>(url)
      .pipe(
        map(dto => this.mapDtoToFrontend(dto)),
        tap(backendPrefs => {
          if (JSON.stringify(localPrefs) !== JSON.stringify(backendPrefs)) {
            console.log('🔄 Sincronizando preferencias con backend');
            this.updateState(backendPrefs);
          }
        })
      );
  }
  
  private sendPreferenceUpdate(userId: number, key: string, value: any): Observable<UserPreferences> {
    const endpointMap: Record<string, { endpoint: string, paramName: string, transform?: (v: any) => any }> = {
      'theme': { endpoint: 'theme', paramName: 'theme', transform: (v) => v === 'dark' ? 'DARK' : 'LIGHT' },
      'lastVisitedSection': { endpoint: 'last-page', paramName: 'lastPage', transform: (v) => `/${v}` },
      'selectedInstitutionId': { endpoint: 'selected-institution', paramName: 'institutionId' },
      'defaultVoice': { endpoint: 'voice', paramName: 'defaultVoice' },
      'defaultSpeed': { endpoint: 'voice', paramName: 'defaultSpeed' },
      'defaultSilenceDuration': { endpoint: 'voice', paramName: 'defaultSilenceDuration' },
      'totalStep': { endpoint: 'voice', paramName: 'totalStep' },
      'language': { endpoint: 'voice', paramName: 'defaultLanguage' }
    };
    
    const mapping = endpointMap[key];
    if (!mapping) return this.savePreferences({ [key]: value });
    
    if (mapping.endpoint === 'voice') {
      const voiceUpdate: VoicePreferencesUpdateRequest = { [mapping.paramName]: value };
      return this.updateVoicePreferences(voiceUpdate);
    }
    
    const paramValue = mapping.transform ? mapping.transform(value) : value;
    
    const url = `${environment.apiGateway}${environment.apiV1}/users/${userId}/preferences/${mapping.endpoint}?${mapping.paramName}=${encodeURIComponent(paramValue)}`;
    
    console.log(`📤 PATCH ${url}`);
    
    return this.http.patch<void>(url, null)
      .pipe(
        map(() => {
          console.log(`✅ Preferencia ${key} actualizada en backend`);
          return this.getCurrentPreferences();
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`❌ Error actualizando ${key} en backend:`, error);
          console.error(`❌ URL: ${url}`);
          console.error(`❌ Status: ${error.status}`);
          if (error.status === 404) {
            console.error('❌ Endpoint no encontrado. Verifica que el backend tenga:');
            console.error(`   PATCH /api/v1/users/{userId}/preferences/${mapping.endpoint}`);
          } else if (error.status === 401) {
            console.error('❌ No autorizado. ¿Estás logueado?');
          }
          return throwError(() => error);
        })
      );
  }

  private mapDtoToFrontend(dto: UserPreferenceResponseDTO): UserPreferences {
    return {
      theme: dto.theme === 'DARK' ? 'dark' : 'light',
      micEnabled: true,
      language: dto.defaultLanguage || 'es',
      notificationsEnabled: true,
      voiceCommandsEnabled: true,
      sidebarCollapsed: false,
      activeProjectId: 'informatica',
      lastVisitedSection: dto.lastPage?.replace('/', '') || 'dashboard',
      welcomeShown: false,
      defaultVoice: dto.defaultVoice || 'M1',
      defaultSpeed: dto.defaultSpeed || 1.0,
      defaultSilenceDuration: dto.defaultSilenceDuration || 0.1,
      totalStep: dto.totalStep || 30,
      selectedInstitutionId: dto.selectedInstitutionId || 0
    };
  }
  
  private mapFrontendToMap(prefs: UserPreferences): Record<string, any> {
    const result: Record<string, any> = {};
    
    if (prefs['theme']) result['theme'] = prefs['theme'] === 'dark' ? 'DARK' : 'LIGHT';
    if (prefs['lastVisitedSection']) result['lastPage'] = `/${prefs['lastVisitedSection']}`;
    if (prefs['selectedInstitutionId'] !== undefined) result['selectedInstitutionId'] = prefs['selectedInstitutionId'];
    if (prefs['defaultVoice']) result['defaultVoice'] = prefs['defaultVoice'];
    if (prefs['defaultSpeed'] !== undefined) result['defaultSpeed'] = prefs['defaultSpeed'];
    if (prefs['language']) result['defaultLanguage'] = prefs['language'];
    if (prefs['defaultSilenceDuration'] !== undefined) result['defaultSilenceDuration'] = prefs['defaultSilenceDuration'];
    if (prefs['totalStep'] !== undefined) result['totalStep'] = prefs['totalStep'];
    
    return result;
  }
  
  private loadLocalPreferences(): Observable<UserPreferences> {
    const local = this.loadFromLocalStorage();
    if (local) {
      this.updateState(local);
      return of(local);
    }
    const defaults = this.getDefaultPreferences();
    this.updateState(defaults);
    return of(defaults);
  }
  
  private saveToLocalStorage(preferences: UserPreferences): void {
    try {
      const key = `${this.STORAGE_KEY}_${this.userId() || 'anonymous'}`;
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error guardando preferencias en localStorage:', error);
    }
  }
  
  private loadFromLocalStorage(): UserPreferences | null {
    try {
      const key = `${this.STORAGE_KEY}_${this.userId() || 'anonymous'}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error cargando preferencias desde localStorage:', error);
    }
    return null;
  }
  
  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      micEnabled: true,
      language: 'es',
      notificationsEnabled: true,
      voiceCommandsEnabled: true,
      sidebarCollapsed: false,
      activeProjectId: 'informatica',
      lastVisitedSection: 'dashboard',
      welcomeShown: false,
      defaultVoice: 'M1',
      defaultSpeed: 1.0,
      defaultSilenceDuration: 0.1,
      totalStep: 30,
      selectedInstitutionId: 0
    };
  }
}