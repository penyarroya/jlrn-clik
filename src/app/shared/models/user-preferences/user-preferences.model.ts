/**
 * Preferencias del frontend (formato amigable para la UI)
 */
export interface UserPreferences {
  // Tema
  theme: 'light' | 'dark';
  
  // Voz
  micEnabled: boolean;
  defaultVoice: string;
  defaultSpeed: number;
  defaultSilenceDuration: number;
  totalStep: number;
  language: string;
  
  // UI
  sidebarCollapsed: boolean;
  lastVisitedSection: string;
  
  // Proyecto
  activeProjectId: string;
  selectedInstitutionId: number;
  
  // Preferencias generales
  notificationsEnabled: boolean;
  voiceCommandsEnabled: boolean;
  welcomeShown: boolean;
}

/**
 * DTO de preferencias de voz del backend
 */
export interface VoicePreferencesDto {
  defaultVoice: string;
  defaultSpeed: number;
  defaultLanguage: string;
  defaultSilenceDuration: number;
  totalStep: number;
}

/**
 * Request para actualizar preferencias de voz
 */
export interface VoicePreferencesUpdateRequest {
  defaultVoice?: string;
  defaultSpeed?: number;
  defaultLanguage?: string;
  defaultSilenceDuration?: number;
  totalStep?: number;
}

/**
 * DTO de respuesta de preferencias (UserPreferenceResponseDTO)
 * Coincide con la entidad Java del backend
 */
export interface UserPreferenceResponseDTO {
  userId: number;
  selectedInstitutionId: number;
  lastPage: string;
  theme: 'LIGHT' | 'DARK';
  defaultVoice: string;
  defaultSpeed: number;
  defaultLanguage: string;
  defaultSilenceDuration: number;
  totalStep: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tipo para opciones de tema
 */
export type ThemeOption = 'light' | 'dark';