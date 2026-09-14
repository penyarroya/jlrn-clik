// src/features/services/voz/voice-context.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HelpItem } from '../../models/voz/voice-context-model.ts/HelpItem';

export interface VoiceContext {
  /** Mensaje que se reproduce al activar el micrófono */
  activationMessage: string;
  /** Lista de comandos disponibles en esta página */
  availableCommands: string[];
  /** Si es true, el orquestador NO enviará comandos al backend */
  preventBackend?: boolean;
}

// ============================================================
// MENSAJES DE VOZ CENTRALIZADOS (TODA LA APP)
// ============================================================

export const VOICE_MESSAGES = {
  // ============================================================
  // BIENVENIDA GLOBAL
  // ============================================================
  welcome: 'Bienvenido a VozAcción. Puedes usar comandos de voz en cualquier momento. Di "hola" para activar el micrófono o "ayuda" para ver los comandos disponibles.',

  // ============================================================
  // MICRÓFONO
  // ============================================================
  micActivated: 'Micrófono activado. Puedes decir "login" para inicio de sesión, "acerca de" para más información, o "silenciar" para desactivarlo.',
  micAlreadyActive: 'El micrófono ya está activo. Puedes decir "silenciar" para desactivarlo o "ayuda" para ver los comandos disponibles.',
  micDeactivated: 'Micrófono desactivado. Di "hola" para volver a activarlo.',
  micAlreadyDeactivated: 'El micrófono ya está desactivado. Di "hola" para activarlo.',
  micDebounce: 'Ya activaste el micrófono hace muy poco. Espera un momento o di "silenciar" si quieres desactivarlo.',

  // ============================================================
  // AURICULARES
  // ============================================================
  headphonesConnectedMicOff: 'Auriculares conectados. El micrófono está apagado. Di hola para activarlo.',
  headphonesConnectedMicOn: 'Auriculares conectados. El micrófono sigue activo.',
  headphonesDisconnected: 'Auriculares desconectados. El sonido se ha desactivado. Conecta auriculares para usar el reconocimiento de voz.',

  // ============================================================
  // COMANDOS
  // ============================================================
  help: 'Puedes decir: "hola" para activar el micrófono, "silenciar" para desactivarlo, "ayuda" para ver esta lista, o navegar con comandos como "inicio", "login", "registro", "acerca de".',
  commandNotFound: 'Comando no reconocido. Di "ayuda" para ver los comandos disponibles.',

  // ============================================================
  // NAVEGACIÓN
  // ============================================================
  navigatingTo: (page: string) => `Navegando a ${page}.`,
  login: 'Navegando a la página de inicio de sesión.',
  register: 'Navegando a la página de registro.',
  about: 'Navegando a la página Acerca de.',
  home: 'Navegando a la página de inicio.',
  dashboard: 'Navegando al panel de control.',
  back: 'Volviendo a la página anterior.',

  // ============================================================
  // LOGIN
  // ============================================================
  loginWelcome: 'Página de inicio de sesión. Puedes decir "usuario" para escribir tu usuario, "contraseña" para tu clave, "enviar" para iniciar sesión, "registro" para crear una cuenta, o "ayuda" para ver los comandos disponibles.',
  loginSuccess: 'Inicio de sesión exitoso. Redirigiendo al panel de control.',
  loginError: 'Error al iniciar sesión. Verifica tu usuario y contraseña.',

  // ============================================================
  // HOME
  // ============================================================
  homeWelcome: 'Página de inicio. Puedes decir "login" para iniciar sesión, "acerca de" para más información, o "ayuda" para ver los comandos disponibles.',

  // ============================================================
  // REGISTER
  // ============================================================
  registerWelcome: 'Página de registro. Puedes decir "nombre" para escribir tu nombre, "apellidos" para tus apellidos, "email" para tu correo, "contraseña" para tu clave, "confirmar" para confirmar, o "enviar" para completar el registro.',

  // ============================================================
  // ABOUT
  // ============================================================
  aboutWelcome: 'Página Acerca de. Puedes decir "volver" para regresar a la página anterior.',

  // ============================================================
  // DASHBOARD
  // ============================================================
  // dashboardWelcome: 'Panel de control. Puedes decir "perfil" para ver tu perfil, "configuración" para ajustes, o "cerrar sesión" para salir.',

  // ✅ NUEVO: mensaje corto único para entrada + "hola"
  dashboardGreeting: (name: string) => `Bienvenido al panel de control, ${name}. Di ayuda para escuchar las opciones disponibles.`,

  // ✅ MENSAJE DE AYUDA COMPLETO (ya existente, lo dejamos igual)
  // dashboardEntry: (name: string) =>
  //   `Estás en el panel principal, ${name}. Puedes decir: dashboard, cursos, perfil, configuración, proyecto informática, proyecto huertos, proyecto salud, proyecto finanzas, modo oscuro, modo claro, silenciar, activar micrófono, cerrar sesión o ayuda.`,

  // dashboardHelp: 'En el panel puedes decir: dashboard, cursos, perfil, configuración, preferencias de voz, proyecto informática, proyecto huertos, proyecto salud, proyecto finanzas, modo oscuro, modo claro, silenciar, activar micrófono, cerrar sesión o ayuda.',


  // ============================================================
  // ERRORES
  // ============================================================
  noHeadphones: 'No hay auriculares conectados. Conecta auriculares para usar el reconocimiento de voz.',
  permissionDenied: 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración del navegador.',
  noAudioDevice: 'No se encontró ningún dispositivo de audio. Conecta un micrófono o auriculares.',
};

@Injectable({
  providedIn: 'root',
})
export class VoiceContextService {
  private contextSubject = new BehaviorSubject<VoiceContext>({
    activationMessage: VOICE_MESSAGES.welcome,
    availableCommands: ['hola', 'silenciar', 'ayuda']
  });

  public context$ = this.contextSubject.asObservable();

  // ✅ BANDERA GLOBAL - Sirve para TODOS los componentes
  private welcomeShown = false;

  // ============================================================
  // MÉTODOS DE CONTEXTO (existentes)
  // ============================================================

  /**
   * Establece el contexto de voz para la página actual
   */
  setContext(context: VoiceContext): void {
    this.contextSubject.next(context);
  }

  /**
   * Obtiene el contexto actual
   */
  getContext(): VoiceContext {
    return this.contextSubject.value;
  }

  /**
   * Resetea el contexto al valor por defecto
   */
  resetContext(): void {
    this.contextSubject.next({
      activationMessage: VOICE_MESSAGES.welcome,
      availableCommands: ['hola', 'silenciar', 'ayuda']
    });
  }

  // ============================================================
  // ✅ BANDERA GLOBAL DE BIENVENIDA
  // ============================================================

  /**
   * ✅ Verifica si la bienvenida ya se mostró en CUALQUIER página
   */
  isWelcomeShown(): boolean {
    return this.welcomeShown;
  }

  /**
   * ✅ Marca la bienvenida como mostrada (GLOBAL)
   */
  markWelcomeAsShown(): void {
    this.welcomeShown = true;
  }

  /**
   * ✅ Resetea la bandera (para pruebas)
   */
  resetWelcomeShown(): void {
    this.welcomeShown = false;
  }

  // ============================================================
  // MÉTODOS PARA OBTENER MENSAJES
  // ============================================================

  /**
   * ✅ Obtiene un mensaje predefinido
   * 
   * @param key - Clave del mensaje en VOICE_MESSAGES
   * @param args - Argumentos para mensajes que son funciones
   * 
   * @example
   * this.voiceContext.getMessage('welcome')
   * this.voiceContext.getMessage('navigatingTo', 'login')
   */
  getMessage(key: keyof typeof VOICE_MESSAGES, ...args: any[]): string {
    const message = VOICE_MESSAGES[key];
    
    if (typeof message === 'function') {
      return (message as Function).apply(null, args);
    }
    
    return message as string || '';
  }

  /**
   * ✅ Obtiene el mensaje de activación del contexto actual
   */
  getActivationMessage(): string {
    const context = this.getContext();
    return context.activationMessage || this.getMessage('welcome');
  }

  /**
   * ✅ Obtiene los comandos disponibles del contexto actual
   */
  getAvailableCommands(): string[] {
    const context = this.getContext();
    return context.availableCommands || [];
  }

  // ============================================================
  // MÉTODOS PARA CONFIGURAR CONTEXTO POR PÁGINA
  // ============================================================

  /**
   * ✅ Configura el contexto para la página de Login
   */
  setLoginContext(): void {
    this.setContext({
      activationMessage: this.getMessage('loginWelcome'),
      availableCommands: ['usuario', 'contraseña', 'enviar', 'registro', 'recuperar', 'ayuda', 'volver'],
      preventBackend: true
    });
  }

  /**
   * ✅ Configura el contexto para la página de Home
   */
  setHomeContext(): void {
    this.setContext({
      activationMessage: 'Micrófono activado. Di login para iniciar sesión, acerca de para más información, silenciar para apagar micrófono o ayuda para todos los comandos.',
      availableCommands: ['login', 'acerca de', 'ayuda', 'silenciar'],
      preventBackend: true
    });
  }

  /**
   * ✅ Configura el contexto para la página de About
   */
  setAboutContext(): void {
    this.setContext({
      activationMessage: this.getMessage('aboutWelcome'),
      availableCommands: ['volver', 'ayuda'],
      preventBackend: true
    });
  }

  /**
   * ✅ Configura el contexto para la página de Register
   */
  setRegisterContext(): void {
    this.setContext({
      activationMessage: this.getMessage('registerWelcome'),
      availableCommands: ['nombre', 'apellidos', 'email', 'contraseña', 'confirmar', 'enviar', 'volver', 'ayuda'],
      preventBackend: true
    });
  }

  /**
   * ✅ Configura el contexto para la página de Dashboard
   */
  setDashboardContext(): void {
    this.setContext({
      activationMessage: this.getMessage('dashboardGreeting', 'usuario'),
      availableCommands: [
        'dashboard',
        'cursos',
        'perfil',
        'configuración',
        'preferencias de voz',
        'proyecto informática',
        'proyecto huertos',
        'proyecto salud',
        'proyecto finanzas',
        'modo oscuro',
        'modo claro',
        'silenciar',
        'activar micrófono',
        'cerrar sesión',
        'ayuda'
      ],
      preventBackend: true
    });
  }

  /**
 * ✅ Construye un mensaje de ayuda natural a partir de una lista de items.
 *    Filtra duplicados, respeta mayúsculas y agrupa por categoría si se indica.
 * 
 * @param items - Lista de items con label (y opcionalmente skip/category)
 * @param options - Personalización (intro, acciones extra, outro)
 * @returns Mensaje listo para TTS
 * 
 * @example
 * buildHelpMessage([{ label: 'Panel Principal' }, { label: 'Guías' }])
 * // → "Puedes decir: panel principal, guías."
 */
  buildHelpMessage(
    items: HelpItem[],
    options?: {
      intro?: string;              // "En el panel puedes decir:"
      extraActions?: string[];     // ['modo oscuro', 'silenciar']
      outro?: string;              // "o ayuda."
      separator?: string;          // ', '
      lastSeparator?: string;      // ' o '
      capitalizeFirst?: boolean;   // false por defecto
    }
  ): string {
    const {
      intro = 'Puedes decir:',
      extraActions = [],
      outro = 'o ayuda.',
      separator = ', ',
      lastSeparator = ' o ',
      capitalizeFirst = false
    } = options || {};

    // 1. Normalizar y filtrar
    const commands = items
      .filter(i => i.label && !i.skip)
      .map(i => i.label.toLowerCase().trim())
      .filter(c => c.length > 0);

    // 2. Eliminar duplicados preservando orden
    const unique = Array.from(new Set(commands));

    // 3. Añadir acciones extra
    const all = [...unique, ...extraActions.map(a => a.toLowerCase().trim())];

    // 4. Caso vacío
    if (all.length === 0) {
      return capitalizeFirst
        ? `${intro.charAt(0).toUpperCase()}${intro.slice(1)} ${outro}`
        : `${intro} ${outro}`;
    }

    // 5. Unir con separador "normal" y "último" (más natural para TTS)
    let list: string;
    if (all.length === 1) {
      list = all[0];
    } else if (all.length === 2) {
      list = `${all[0]}${lastSeparator}${all[1]}`;
    } else {
      const head = all.slice(0, -1).join(separator);
      const tail = all[all.length - 1];
      list = `${head}${lastSeparator}${tail}`;
    }

    // 6. Unir todo
    const message = `${intro} ${list} ${outro}`;

    return capitalizeFirst
      ? `${message.charAt(0).toUpperCase()}${message.slice(1)}`
      : message;
  }
}