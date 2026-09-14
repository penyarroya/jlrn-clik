export interface HelpItem {
  label: string;
  /** Si true, no se incluye en el mensaje (ej. divisores, items ocultos) */
  skip?: boolean;
  /** Categoría opcional para agrupar (ej: 'navegación', 'acciones') */
  category?: string;
}