// src/core/services/voz/field-cleanup.service.ts
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { VoiceService } from './voice.service';

export interface FieldInfo {
  name: string;
  label: string;
  isFocused: boolean;
  clear: () => void;
  isEmpty: () => boolean;
  canClear?: boolean; // ✅ Opcional: permite marcar campos que no se pueden limpiar por voz
}

@Injectable({ providedIn: 'root' })
export class FieldCleanupService {
  private voiceService = inject(VoiceService);
  private fields: FieldInfo[] = [];
  private fieldsSubject = new BehaviorSubject<FieldInfo[]>([]);
  fields$ = this.fieldsSubject.asObservable();

  /**
   * Registra un campo para que pueda ser limpiado por voz
   */
  registerField(field: FieldInfo): void {
    const existing = this.fields.find(f => f.name === field.name);
    if (existing) {
      Object.assign(existing, field);
    } else {
      // ✅ Si no se especifica, por defecto se puede limpiar
      if (field.canClear === undefined) {
        field.canClear = true;
      }
      this.fields.push(field);
    }
    this.fieldsSubject.next(this.fields);
    console.log(`🧹 [FieldCleanup] Campo registrado: "${field.name}" (${field.label})`);
  }

  /**
   * Elimina el registro de un campo (al destruir el componente)
   */
  unregisterField(fieldName: string): void {
    this.fields = this.fields.filter(f => f.name !== fieldName);
    this.fieldsSubject.next(this.fields);
    console.log(`🧹 [FieldCleanup] Campo desregistrado: "${fieldName}"`);
  }

  /**
   * Limpia un campo específico por nombre
   */
  clearFieldByName(name: string): { success: boolean; message: string } {
    const field = this.fields.find(f => f.name === name);
    if (!field) {
      const msg = `No se encontró el campo "${name}"`;
      this.voiceService.speak(msg);
      console.warn(`🧹 [FieldCleanup] Campo no encontrado: "${name}"`);
      return { success: false, message: msg };
    }

    // ✅ Verificar si el campo puede limpiarse
    if (field.canClear === false) {
      const msg = `El campo ${field.label} no se puede limpiar por voz.`;
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }

    if (field.isEmpty()) {
      const msg = `El campo ${field.label} ya está vacío. Di "${field.label}" para escribir.`;
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }

    field.clear();
    const msg = `Campo ${field.label} limpiado. Di "${field.label}" para escribir.`;
    this.voiceService.speak(msg);
    console.log(`🧹 [FieldCleanup] Campo limpiado: "${field.name}" (${field.label})`);

    // Reactivar el reconocimiento después de hablar
    setTimeout(() => {
      if (!this.voiceService.isRecognitionActive()) {
        this.voiceService.startListening();
      }
    }, 400);

    return { success: true, message: msg };
  }

  /**
   * ✅ NUEVO: Limpia un campo por su label (para comandos de voz)
   */
  clearFieldByLabel(label: string): { success: boolean; message: string } {
    const normalizedLabel = label.toLowerCase().trim();
    const field = this.fields.find(f => f.label.toLowerCase() === normalizedLabel);
    if (!field) {
      const msg = `No se encontró el campo "${label}"`;
      this.voiceService.speak(msg);
      console.warn(`🧹 [FieldCleanup] Campo no encontrado por label: "${label}"`);
      return { success: false, message: msg };
    }
    return this.clearFieldByName(field.name);
  }

  /**
   * Limpia el campo que está enfocado
   */
  clearFocusedField(): { success: boolean; message: string } {
    const focused = this.fields.find(f => f.isFocused);
    if (!focused) {
      const msg = 'No hay ningún campo enfocado.';
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }
    if (focused.canClear === false) {
      const msg = `El campo ${focused.label} no se puede limpiar por voz.`;
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }
    if (focused.isEmpty()) {
      const msg = `El campo ${focused.label} ya está vacío. Di "${focused.label}" para escribir.`;
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }
    focused.clear();
    const msg = `Campo ${focused.label} limpiado. Di "${focused.label}" para escribir.`;
    this.voiceService.speak(msg);
    console.log(`🧹 [FieldCleanup] Campo enfocado limpiado: "${focused.name}"`);

    setTimeout(() => {
      if (!this.voiceService.isRecognitionActive()) {
        this.voiceService.startListening();
      }
    }, 400);

    return { success: true, message: msg };
  }

  /**
   * Limpia todos los campos registrados
   */
  clearAllFields(): { success: boolean; message: string } {
    const clearableFields = this.fields.filter(f => f.canClear !== false);
    const nonEmptyFields = clearableFields.filter(f => !f.isEmpty());

    if (nonEmptyFields.length === 0) {
      const msg = 'Todos los campos ya están vacíos.';
      this.voiceService.speak(msg);
      return { success: false, message: msg };
    }

    nonEmptyFields.forEach(f => f.clear());
    const msg = 'Todos los campos han sido limpiados.';
    this.voiceService.speak(msg);
    console.log(`🧹 [FieldCleanup] Todos los campos limpiados (${nonEmptyFields.length} campos)`);

    setTimeout(() => {
      if (!this.voiceService.isRecognitionActive()) {
        this.voiceService.startListening();
      }
    }, 400);

    return { success: true, message: msg };
  }

  /**
   * Obtiene la lista de nombres de campos registrados
   */
  getFieldNames(): string[] {
    return this.fields.map(f => f.name);
  }

  /**
   * Obtiene la lista de labels de campos registrados
   */
  getFieldLabels(): string[] {
    return this.fields.map(f => f.label);
  }

  /**
   * Verifica si un campo está registrado
   */
  hasField(name: string): boolean {
    return this.fields.some(f => f.name === name);
  }

  /**
   * Limpia todos los registros (útil para reset)
   */
  clearAllRegistrations(): void {
    this.fields = [];
    this.fieldsSubject.next(this.fields);
    console.log('🧹 [FieldCleanup] Todos los registros eliminados');
  }
}