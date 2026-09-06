// src/app/shared/services/app-state/app-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  private welcomeFirstLoadSubject = new BehaviorSubject<boolean>(true);
  public welcomeFirstLoad$ = this.welcomeFirstLoadSubject.asObservable();

  private micInitializedSubject = new BehaviorSubject<boolean>(false);
  public micInitialized$ = this.micInitializedSubject.asObservable();

  private welcomeMessageShownSubject = new BehaviorSubject<boolean>(false);
  public welcomeMessageShown$ = this.welcomeMessageShownSubject.asObservable();

  private firefoxMessageVisibleSubject = new BehaviorSubject<boolean>(true);
  public firefoxMessageVisible$ = this.firefoxMessageVisibleSubject.asObservable();

  // Detección adaptada para Web y Entorno Nativo (Capacitor)
  private browserInfo = {
    isNative: Capacitor.isNativePlatform(),
    isFirefox: !Capacitor.isNativePlatform() && navigator.userAgent.toLowerCase().includes('firefox'),
    isChrome: !Capacitor.isNativePlatform() && navigator.userAgent.toLowerCase().includes('chrome') && 
              !navigator.userAgent.toLowerCase().includes('edge'),
    isEdge: !Capacitor.isNativePlatform() && navigator.userAgent.toLowerCase().includes('edge'),
    isSafari: !Capacitor.isNativePlatform() && navigator.userAgent.toLowerCase().includes('safari') && 
              !navigator.userAgent.toLowerCase().includes('chrome') &&
              !navigator.userAgent.toLowerCase().includes('edge')
  };

  get isWelcomeFirstLoad(): boolean {
    return this.welcomeFirstLoadSubject.value;
  }

  get isWelcomeMessageShown(): boolean {
    return this.welcomeMessageShownSubject.value;
  }

  get isFirefox(): boolean {
    return this.browserInfo.isFirefox;
  }

  get isChrome(): boolean {
    return this.browserInfo.isChrome;
  }

  get isEdge(): boolean {
    return this.browserInfo.isEdge;
  }

  get isSafari(): boolean {
    return this.browserInfo.isSafari;
  }

  get isNative(): boolean {
    return this.browserInfo.isNative;
  }

  get browserName(): string {
    if (this.isNative) return 'App Nativa (Capacitor)';
    if (this.isFirefox) return 'Firefox';
    if (this.isEdge) return 'Edge';
    if (this.isChrome) return 'Chrome';
    if (this.isSafari) return 'Safari';
    return 'Navegador desconocido';
  }

  get isVoiceSupported(): boolean {
    // Si corre en la app nativa de Capacitor, por lo general requiere plugins específicos o WebView de Android
    if (this.isFirefox) return false;
    return this.isNative || !!(window.SpeechRecognitionEvent || (window as any).webkitSpeechRecognition);
  }

  get isFirefoxMessageVisible(): boolean {
    return this.firefoxMessageVisibleSubject.value;
  }

  closeFirefoxMessage(): void {
    this.firefoxMessageVisibleSubject.next(false);
  }

  getVoiceUnsupportedMessage(): string {
    if (this.isFirefox) {
      return 'El reconocimiento de voz no está disponible en Firefox. Por favor, usa Chrome o Edge para usar comandos de voz.';
    }
    return 'El reconocimiento de voz no está disponible en este navegador.';
  }

  getWelcomeMessageForBrowser(defaultMessage: string): string {
    if (this.isFirefox) {
      return `Bienvenido a JLRN Clik. El reconocimiento de voz no está disponible en Firefox. 
              Puedes usar otro navegador como Edge, Opera o Chrome para usar comandos de voz.`;
    }
    return defaultMessage;
  }

  constructor() {
    // Lógica de inicio en memoria
  }

  markWelcomeAsShown(): void {
    this.welcomeFirstLoadSubject.next(false);
    this.welcomeMessageShownSubject.next(true);
  }

  resetState(): void {
    this.welcomeFirstLoadSubject.next(true);
    this.micInitializedSubject.next(false);
    this.welcomeMessageShownSubject.next(false);
    this.firefoxMessageVisibleSubject.next(true);
  }
}