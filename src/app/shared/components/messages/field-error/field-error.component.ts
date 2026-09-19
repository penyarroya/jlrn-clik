import { Component, input, signal, effect, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  informationCircleOutline
} from 'ionicons/icons';

export type MessageType = 'error' | 'success' | 'warning' | 'info';

@Component({
  selector: 'app-field-error',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './field-error.component.html',
  styleUrls: ['./field-error.component.scss']
})
export class FieldErrorComponent {
  private destroyRef = inject(DestroyRef);

  // ============================================================
  // INPUTS
  // ============================================================

  /** Control del formulario (modo formulario) */
  control = input<AbstractControl | null>(null);

  /** Campo del formulario (modo formulario) */
  field = input<any>(null);

  /** Tipo de mensaje manual (modo manual) */
  type = input<MessageType>('error');

  /** Mensaje manual (modo manual) */
  message = input<string | null>(null);

  /** Duración en ms para auto-ocultar (modo manual) */
  duration = input<number>(0);   // 0 = no se oculta

  // ============================================================
  // STATE
  // ============================================================

  /** Mensaje que se muestra actualmente */
  displayMessage = signal<string | null>(null);

  /** Tipo actual */
  displayType = signal<MessageType>('error');

  /** Visibilidad */
  visible = signal<boolean>(false);

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    addIcons({
      alertCircleOutline,
      checkmarkCircleOutline,
      warningOutline,
      informationCircleOutline
    });

    // ✅ MODO FORMULARIO: observa el control
    effect(() => {
      const c = this.control();
      if (!c) return;

      c.events
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateFromControl(c));

      this.updateFromControl(c);
    });

    // ✅ MODO MANUAL: escucha cambios en `message`
    effect(() => {
      const msg = this.message();
      const t = this.type();
      const dur = this.duration();

      if (!msg) {
        // Si no hay mensaje manual y no hay modo formulario, ocultar
        if (!this.control()) {
          this.visible.set(false);
        }
        return;
      }

      this.showMessage(t, msg, dur);
    });
  }

  // ============================================================
  // API PÚBLICA (para uso programático desde el padre)
  // ============================================================

  /** Muestra un mensaje manualmente */
  show(type: MessageType, message: string, duration: number = 0): void {
    this.showMessage(type, message, duration);
  }

  /** Oculta el mensaje */
  hide(): void {
    this.visible.set(false);
    this.displayMessage.set(null);
  }

  // ============================================================
  // INTERNOS
  // ============================================================

  private updateFromControl(c: AbstractControl): void {
    if (c.touched && c.errors) {
      const msg = this.buildErrorMessage(c.errors);
      this.displayType.set('error');
      this.displayMessage.set(msg);
      this.visible.set(true);
    } else {
      // Solo ocultar si no estamos en modo manual con mensaje activo
      if (!this.message()) {
        this.visible.set(false);
        this.displayMessage.set(null);
      }
    }
  }

  private showMessage(type: MessageType, message: string, duration: number): void {
    this.displayType.set(type);
    this.displayMessage.set(message);
    this.visible.set(true);

    if (duration > 0) {
      setTimeout(() => this.hide(), duration);
    }
  }

  private buildErrorMessage(errors: any): string {
    const f = this.field();

    if (errors['required']) {
      return f ? `${f.label} es obligatorio` : 'Este campo es obligatorio';
    }

    if (errors['email']) {
      return 'Email inválido';
    }

    if (errors['pattern']) {
      if (f?.type === 'email') {
        return 'Formato de email inválido (ejemplo@dominio.com)';
      }
      if (f?.type === 'password') {
        return 'La contraseña debe tener mínimo 9 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial';
      }
      // ✅ NUEVO: mensaje para el campo `name` de RoleEntity
      if (f?.key === 'name') {
        return 'El nombre debe estar en MAYÚSCULAS y solo puede contener letras y guiones bajos (ej: ROLE_ADMIN)';
      }
      return 'Formato inválido';
    }

    if (errors['minlength']) {
      return `Mínimo ${f?.minLength || errors['minlength'].requiredLength} caracteres`;
    }

    if (errors['maxlength']) {
      return `Máximo ${f?.maxLength || errors['maxlength'].requiredLength} caracteres`;
    }

    if (errors['backend']) {
      return errors['backend'];
    }

    return 'Campo inválido';
  }

  
  // ============================================================
  // GETTERS PARA EL TEMPLATE
  // ============================================================

  get iconName(): string {
    switch (this.displayType()) {
      case 'error':   return 'alert-circle-outline';
      case 'success': return 'checkmark-circle-outline';
      case 'warning': return 'warning-outline';
      case 'info':    return 'information-circle-outline';
      default:        return 'information-circle-outline';
    }
  }
}