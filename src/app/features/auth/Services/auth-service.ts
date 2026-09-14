// src/app/core/services/auth.service.ts

import { Service, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, switchMap, BehaviorSubject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { UserPreferencesService } from '../../../shared/services/user-preferences/user-preferences.service';
import { ReadOtpResponse } from '../models/ReadOtpResponse';

@Service()
export class AuthService {
  // ============================================================
  // INYECCIONES
  // ============================================================
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private userPreferences = inject(UserPreferencesService);

  // ============================================================
  // CONSTANTES
  // ============================================================
  private readonly AUTH_URL = `${environment.apiGateway}${environment.authEndpoint}`;
  private readonly USER_INFO_KEY = 'user_info';
  // private readonly TAB_SESSION_KEY = 'app_session_active';
  private readonly API_V1_URL = `${environment.apiGateway}${environment.apiV1}`;
  private readonly httpOptions = { withCredentials: true };

  // ============================================================
  // ESTADO CON SIGNALS
  // ============================================================
  currentUser = signal<LoginResponse | null>(this.getInitialUser());
  isAuthenticated = computed(() => this.currentUser() !== null);

  private currentUserSubject = new BehaviorSubject<LoginResponse | null>(this.getInitialUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    console.log('🏗️ AuthService constructor - VERSIÓN ACTUALIZADA');
    console.log('🏗️ AuthService constructor - AUTH_URL:', this.AUTH_URL);
    console.log('🏗️ AuthService constructor - currentUser:', this.currentUser());
    
    effect(() => {
      const user = this.currentUser();
      this.currentUserSubject.next(user);

      // ✅ NUEVO: si hay usuario restaurado, cargar preferencias
      if (user?.id) {
        console.log('✅ [AuthService] Usuario restaurado, cargando preferencias para ID:', user.id);
        this.userPreferences.setUserId(user.id);
        this.userPreferences.loadPreferences().subscribe({
          next: (prefs) => console.log('✅ Preferencias cargadas tras restauración:', prefs),
          error: (err) => console.error('❌ Error cargando preferencias:', err)
        });
      }
    });
  }

  // ============================================================
  // MÉTODOS DE INICIALIZACIÓN
  // ============================================================
  private getInitialUser(): LoginResponse | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    // ✅ Leer directamente de localStorage (sin depender de sessionStorage)
    const savedUser = localStorage.getItem(this.USER_INFO_KEY);
    if (!savedUser) return null;

    try {
      const storedUser = JSON.parse(savedUser);

      const user: LoginResponse = {
        id: storedUser.id,
        username: storedUser.username,
        email: storedUser.email || '',
        roles: storedUser.roles || [],
        type: 'Bearer',
        accessToken: '',
        refreshToken: null,
        token: '',
        permissions: storedUser.permissions || []
      };

      if (isPlatformBrowser(this.platformId)) {
        const token = localStorage.getItem('access_token');
        if (token) {
          user.accessToken = token;
          user.token = token;
        }
      }

      console.log('✅ Sesión restaurada con roles:', user.roles);
      console.log('📧 Email restaurado:', user.email);
      return user;
    } catch (e) {
      console.error('Error parseando usuario:', e);
      return null;
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  getUserId(): number | null {
    const user = this.currentUser();
    return user ? user.id : null;
  }

  getUserName(): string {
    const user = this.currentUser();
    return user ? user.username : 'Usuario';
  }

  getUserEmail(): string | null {
    const user = this.currentUser();
    if (user?.email) return user.email;
    
    if (isPlatformBrowser(this.platformId)) {
      const email = localStorage.getItem('userEmail');
      if (email) return email;
    }
    
    return null;
  }

  getUserRoles(): string[] {
    const user = this.currentUser();
    return user?.roles || [];
  }

  /**
   * ✅ Obtener el token de autenticación
   * Busca en localStorage y en el usuario actual
   */
  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const token = localStorage.getItem('access_token') || 
                  localStorage.getItem('accessToken') ||
                  this.currentUser()?.accessToken ||
                  this.currentUser()?.token;
    
    return token || null;
  }

  // ============================================================
  // LOGIN
  // ============================================================

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.AUTH_URL}/login`, credentials, this.httpOptions)
      .pipe(
        tap((response) => {
          console.log('✅ Login exitoso');
          console.log('📧 Email recibido:', response.email);
          console.log('🆔 ID recibido:', response.id);
          
          // if (isPlatformBrowser(this.platformId)) {
          //   sessionStorage.setItem(this.TAB_SESSION_KEY, 'true');
          //   if (response.email) {
          //     localStorage.setItem('userEmail', response.email);
          //   }
          // }

          if (isPlatformBrowser(this.platformId)) {
            if (response.email) {
              localStorage.setItem('userEmail', response.email);
            }
          }
          
          this.updateLocalSession(response);
          
          if (response.id) {
            this.userPreferences.setUserId(response.id);
            this.userPreferences.loadPreferences().subscribe({
              next: (prefs) => {
                console.log('✅ Preferencias cargadas:', prefs);
                this.userPreferences.syncThemeOnLogin(response.id);
              },
              error: (error) => console.error('❌ Error cargando preferencias:', error)
            });
          }
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  logout(): Observable<void> {
    const currentPrefs = this.userPreferences.getCurrentPreferences();
    this.userPreferences.savePreferences({
      ...currentPrefs,
      lastVisitedSection: this.router.url || 'dashboard'
    }).subscribe({
      next: () => console.log('✅ Preferencias guardadas antes de logout'),
      error: (error) => console.error('❌ Error guardando preferencias:', error)
    });
    
    return this.http.post<void>(`${this.AUTH_URL}/logout`, {}, this.httpOptions)
      .pipe(
        tap(() => {
          this.fullLocalLogout();
          this.userPreferences.clearPreferences();
          console.log('✅ Logout exitoso');
        }),
        catchError(() => {
          this.fullLocalLogout();
          this.userPreferences.clearPreferences();
          return of(void 0);
        })
      );
  }

  // ============================================================
  // CHECK SESSION
  // ============================================================

  checkSession(): Observable<LoginResponse | null> {
    const localUser = this.currentUser();
    if (!localUser) {
      console.log('ℹ️ [checkSession] No hay sesión local, omitiendo verificación');
      return of(null);
    }

    console.log('🔄 [checkSession] Verificando sesión con el servidor...');
    
    return this.http.get<LoginResponse>(`${this.AUTH_URL}/user-info`, {
      ...this.httpOptions,
      withCredentials: true
    }).pipe(
      tap((user) => {
        if (user) {
          console.log('✅ [checkSession] Sesión válida');
          this.updateLocalSession(user);
          this.userPreferences.loadPreferences().subscribe({
            next: (prefs) => console.log('✅ Preferencias recargadas:', prefs),
            error: (error) => console.error('❌ Error recargando preferencias:', error)
          });
        }
      }),
      catchError((error: HttpErrorResponse): Observable<LoginResponse | null> => {
        if (error.status === 401) {
          console.warn('🔴 [checkSession] Token expirado, intentando refresh...');
          
          return this.refreshToken().pipe(
            switchMap((refreshResponse: LoginResponse) => {
              console.log('✅ [checkSession] Refresh exitoso');
              
              if (refreshResponse) {
                this.updateLocalSession(refreshResponse);
                this.userPreferences.loadPreferences().subscribe({
                  next: (prefs) => console.log('✅ Preferencias recargadas después de refresh'),
                  error: (err) => console.error('❌ Error recargando preferencias:', err)
                });
              }
              
              return this.http.get<LoginResponse>(`${this.AUTH_URL}/user-info`, {
                ...this.httpOptions,
                withCredentials: true
              }).pipe(
                tap((user) => {
                  if (user) {
                    console.log('✅ [checkSession] Sesión verificada después de refresh');
                    this.updateLocalSession(user);
                  }
                }),
                catchError(() => {
                  console.warn('❌ [checkSession] Falló la verificación después del refresh');
                  this.fullLocalLogout();
                  this.userPreferences.clearPreferences();
                  return of(null);
                })
              );
            }),
            catchError(() => {
              console.warn('❌ [checkSession] Falló el refresh, sesión expirada');
              this.fullLocalLogout();
              this.userPreferences.clearPreferences();
              return of(null);
            })
          );
        }
        
        if (error.status === 500) {
          console.error('❌ [checkSession] Error 500 - redirigiendo a login');
          this.fullLocalLogout();
          this.userPreferences.clearPreferences();
          setTimeout(() => this.router.navigate(['/login']), 0);
          return of(null);
        }
        
        console.error('❌ [checkSession] Error verificando sesión:', error.status);
        return of(null);
      })
    );
  }

  forceCheckSession(): Observable<LoginResponse | null> {
    console.log('🔄 [forceCheckSession] Verificando sesión forzadamente...');
    
    return this.http.get<LoginResponse>(`${this.AUTH_URL}/user-info`, this.httpOptions)
      .pipe(
        tap((user) => {
          if (user) {
            console.log('✅ [forceCheckSession] Sesión válida');
            this.updateLocalSession(user);
          }
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            console.warn('🔴 [forceCheckSession] Sesión inválida - limpiando');
            this.fullLocalLogout();
            this.userPreferences.clearPreferences();
          }
          return of(null);
        })
      );
  }

  // ============================================================
  // REFRESH TOKEN
  // ============================================================
  refreshToken(): Observable<LoginResponse> {
    const url = `${environment.apiGateway}${environment.authEndpoint}/refresh`;
    console.log('🔄 Llamando a refresh endpoint:', url);

    // ✅ El refresh token va en la cookie HttpOnly (withCredentials: true)
    //    Ya NO lo leemos de localStorage
    return this.http.post<LoginResponse>(url, {}, {
      withCredentials: true
    })
    .pipe(
      tap((response) => {
        console.log('✅ Refresh exitoso');
        console.log('📦 Respuesta del refresh:', response);

        // ❌ ELIMINADO: guardar accessToken en localStorage
        // ❌ ELIMINADO: guardar refreshToken en localStorage
        // Los tokens ya vienen en las cookies HttpOnly del backend

        if (response) {
          this.currentUser.set(response);
          console.log('✅ Usuario actualizado en memoria');
        }

        this.userPreferences.loadPreferences().subscribe({
          next: (prefs) => {
            console.log('✅ Preferencias recargadas después de refresh');
          },
          error: (error) => {
            console.error('❌ Error recargando preferencias:', error);
          }
        });
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error en refresh:', error.status, error.message);

        if (error.status === 401) {
          console.warn('🔴 Refresh token expirado o inválido, cerrando sesión');
          this.fullLocalLogout();
          this.userPreferences.clearPreferences();
          this.router.navigate(['/login']);
        } else if (error.status === 500) {
          console.error('🚨 Error interno del servidor (500) en refresh');
        }

        return throwError(() => error);
      })
    );
  }

  // ============================================================
  // REGISTER
  // ============================================================

  register(userData: unknown): Observable<unknown> {
    const data = userData as any;
    console.log(`📤 Registrando usuario: ${data.username} (${data.email})`);

    const payloadToSend = {
      username: data.username,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName
    };

    const registerOptions = {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    return this.http.post(`${this.AUTH_URL}/register`, payloadToSend, registerOptions)
      .pipe(
        tap(() => console.log('✅ Registro exitoso')),
        catchError((err) => this.handleError(err))
      );
  }

  // ============================================================
  // VERIFY OTP
  // ============================================================

  verifyOtp(data: { email: string, code: string }): Observable<any> {
    return this.http.post(`${this.AUTH_URL}/verify-email`, data, this.httpOptions)
      .pipe(
        tap(() => console.log('✅ Código OTP verificado con éxito')),
        catchError((err) => this.handleError(err))
      );
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  forgotPassword(email: string): Observable<any> {
    const url = `${this.AUTH_URL}/forgot-password`;
    console.log(`📤 Solicitud de recuperación para: ${email}`);
    return this.http.post(url, { email }, this.httpOptions).pipe(
      tap(() => console.log('✅ Solicitud de recuperación enviada')),
      catchError((err) => this.handleError(err))
    );
  }

  resetPassword(payload: { email: string; code: string; newPassword: string }): Observable<any> {
    const url = `${this.AUTH_URL}/reset-password`;
    console.log(`📤 Restableciendo contraseña para: ${payload.email}`);
    return this.http.post(url, payload, this.httpOptions).pipe(
      tap(() => console.log('✅ Contraseña restablecida con éxito')),
      catchError((err) => this.handleError(err))
    );
  }

  cancelPendingRegistration(email: string): Observable<any> {
    return this.http.delete(`${this.API_V1_URL}/users/register/pending`, {
      params: { email },
      ...this.httpOptions
    });
  }

  // ============================================================
  // MÉTODOS DE SESIÓN
  // ============================================================

  private updateLocalSession(user: LoginResponse): void {
    console.log('💾 Guardando sesión local');
    console.log('🔍 ====== DATOS DEL USUARIO RECIBIDOS ======');
    console.log('🔍 user.id:', user.id);
    console.log('🔍 user.username:', user.username);
    console.log('🔍 user.email:', user.email);
    console.log('🔍 user.roles:', user.roles);
    console.log('🔍 =========================================');
    
    this.currentUser.set(user);
    
    if (isPlatformBrowser(this.platformId)) {
      const sessionData = {
        id: user.id,
        username: user.username,
        email: user.email || '',
        roles: user.roles
      };
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(sessionData));
      
      if (user.email) {
        localStorage.setItem('userEmail', user.email);
      }
    }
  }

  public fullLocalLogout(): void {
    console.log('🧹 Limpiando toda la sesión local');
    
    if (this.currentUser) {
      this.currentUser.set(null);
    }
    
    // if (isPlatformBrowser(this.platformId)) {
    //   localStorage.removeItem(this.USER_INFO_KEY);
    //   sessionStorage.removeItem(this.TAB_SESSION_KEY);
    // }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.USER_INFO_KEY);
    }
    
    this.userPreferences.clearPreferences();
  }

  public restartAuthService(): void {
    console.log('🔄 [AuthService] Reiniciando estado de autenticación...');
    this.currentUser.set(null);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.USER_INFO_KEY);
      localStorage.removeItem('userEmail');
    }
    
    this.userPreferences.clearPreferences();
    
    console.log('✅ [AuthService] Estado reiniciado correctamente');
  }

  // ============================================================
  // ✅ NUEVO A2: LEER OTP POR VOZ
  // ============================================================

  /**
   * Lee el OTP descifrado del backend para leerlo por voz.
   * La cookie HttpOnly `otp_session` viaja automáticamente
   * gracias a `withCredentials: true`.
   *
   * @param email email del usuario que solicitó el reset
   * @returns { code: string, remainingReads: number }
   */
    readOtp(email: string): Observable<ReadOtpResponse> {
      const url = `${this.AUTH_URL}/read-otp`;
      console.log(`🔊 [AuthService] Solicitando lectura de OTP para: ${email}`);
      return this.http.post<ReadOtpResponse>(url, { email }, this.httpOptions)
        .pipe(
          tap((response) => {
            console.log(`✅ [AuthService] OTP leído:`, {
              code: response.code ? '***' + response.code.slice(-2) : null,
              remainingReads: response.remainingReads
            });
          }),
          catchError((err) => this.handleError(err))
        );
    }

  // ============================================================
  // HANDLE ERROR
  // ============================================================

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error inesperado';
    let errorStatus = error.status || 500;
    
    if (error.error && typeof error.error === 'object' && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor. Verifica tu conexión a internet.';
      errorStatus = 0;
    } else if (error.status === 404) {
      errorMessage = 'El correo electrónico no está registrado. Verifica que lo has escrito correctamente.';
    } else if (error.status === 409) {
      errorMessage = 'El correo electrónico o usuario ya existe.';
    } else if (error.status === 400) {
      errorMessage = error.error?.message || 'Solicitud inválida. Revisa los datos ingresados.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
    } else if (error.status === 503) {
      errorMessage = 'El servidor de autenticación no responde.';
    } else if (error.status === 401) {
      errorMessage = 'Usuario o contraseña incorrectos.';
    } else if (error.status === 403) {
      errorMessage = 'No tienes permiso para realizar esta acción.';
    }
    
    console.log('🔴 Error capturado en AuthService:', errorMessage);
    
    return throwError(() => ({ 
      status: errorStatus, 
      message: errorMessage,
      originalError: error
    }));
  }
}