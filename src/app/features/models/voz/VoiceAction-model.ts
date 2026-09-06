/**
 * Representa la acción a ejecutar en el frontend.
 */
export interface VoiceAction {
  /** Tipo de acción: navigate (navegar), speak (hablar), none (ninguna), undo (deshacer). */
  type: 'navigate' | 'speak' | 'none' | 'undo';
  /** Datos adicionales para la acción (ej. la ruta para navegar). */
  payload: Record<string, any>;
}