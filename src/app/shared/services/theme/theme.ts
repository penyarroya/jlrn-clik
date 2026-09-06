import { Service, signal, computed, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type Theme = 'light' | 'dark';

@Service()
export class ThemeService {
  // 1. Estado reactivo con Signals
  private themeSignal = signal<Theme>('light');
  private visibilitySignal = signal<boolean>(true);

  // 2. Exponemos Signals de solo lectura para los componentes
  public readonly currentTheme = computed(() => this.themeSignal());
  public readonly isButtonVisible = computed(() => this.visibilitySignal());

  constructor() {
    // Cargar tema guardado al iniciar
    this.loadThemePreference();

    // Efecto para aplicar el tema cuando cambie
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      this.saveThemePreference(theme);
    });

    // Escuchar cambios en el sistema (cuando el usuario cambia el tema del OS)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        // Solo aplicar si el usuario no ha establecido una preferencia manual
        this.getStoredTheme().then(stored => {
          if (!stored) {
            this.setTheme(e.matches ? 'dark' : 'light');
          }
        });
      });
    }
  }

  /**
   * Cambiar entre tema claro/oscuro
   */
  toggleTheme(): void {
    const next = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  /**
   * Establecer tema específico
   */
  setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
  }

  /**
   * Aplicar tema al DOM
   */
  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark-theme');
      html.classList.remove('light-theme');
    } else {
      html.classList.remove('dark-theme');
      html.classList.add('light-theme');
    }
  }

  /**
   * Guardar preferencia en almacenamiento nativo
   */
  private async saveThemePreference(theme: Theme): Promise<void> {
    try {
      await Preferences.set({
        key: 'theme_preference',
        value: theme,
      });
    } catch (error) {
      console.error('Error al guardar preferencia de tema:', error);
    }
  }

  /**
   * Cargar preferencia guardada
   */
  private async loadThemePreference(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'theme_preference' });
      
      if (value === 'dark' || value === 'light') {
        this.setTheme(value as Theme);
      } else {
        // Si no hay preferencia guardada, detectar sistema
        if (typeof window !== 'undefined') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          this.setTheme(prefersDark ? 'dark' : 'light');
        }
      }
    } catch (error) {
      console.error('Error al cargar preferencia de tema:', error);
      // Fallback: detectar sistema
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }

  /**
   * Obtener tema guardado (sin aplicar)
   */
  private async getStoredTheme(): Promise<Theme | null> {
    try {
      const { value } = await Preferences.get({ key: 'theme_preference' });
      return (value === 'dark' || value === 'light') ? value as Theme : null;
    } catch {
      return null;
    }
  }

  /**
   * Controla la visibilidad del botón de tema de forma global
   */
  setVisibility(visible: boolean): void {
    this.visibilitySignal.set(visible);
  }
}