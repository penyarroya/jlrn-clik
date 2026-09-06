// src/shared/validators/validators.ts
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// ============================================================
// CONFIGURACIÓN CENTRALIZADA
// ============================================================
const VALIDATION_CONFIG = {
  username: {
    minLength: 3,
    maxLength: 50,
    // ✅ CORREGIDO: guion al final para que sea literal
    allowedChars: /^[a-zA-Z0-9._@!?-]+$/,
    emailPattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  password: {
    minLength: 9,
    maxLength: 64,
    specialChars: /[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]/,
  }
};

// ============================================================
// 1. VALIDADOR DE USUARIO (profesional)
// ============================================================
/**
 * Validador profesional para nombres de usuario y emails
 *
 * Permite:
 * - Nombres de usuario: letras, números, . _ @ ! ? -
 * - Emails: formato estándar
 * - Longitud: 3-50 caracteres
 *
 * @returns ValidatorFn
 */
export function usernameValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const errors: ValidationErrors = {};

    // 1. Validar longitud mínima
    if (value.length < VALIDATION_CONFIG.username.minLength) {
      errors['minlength'] = {
        requiredLength: VALIDATION_CONFIG.username.minLength,
        actualLength: value.length
      };
    }

    // 2. Validar longitud máxima
    if (value.length > VALIDATION_CONFIG.username.maxLength) {
      errors['maxlength'] = {
        requiredLength: VALIDATION_CONFIG.username.maxLength,
        actualLength: value.length
      };
    }

    // 3. Validar formato (username o email)
    const isValidUsername = VALIDATION_CONFIG.username.allowedChars.test(value);
    const isValidEmail = VALIDATION_CONFIG.username.emailPattern.test(value);

    if (!isValidUsername && !isValidEmail) {
      errors['invalidUsername'] = {
        value,
        allowedChars: 'a-zA-Z0-9._@!?-'
      };
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

// ============================================================
// 2. VALIDADOR DE CONTRASEÑA (profesional)
// ============================================================
/**
 * Validador profesional para contraseñas seguras
 *
 * Requisitos:
 * - Longitud mínima: 9 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 minúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial: !@#$%^&*(),.?":{}|<>-_+=
 *
 * @param minLength Longitud mínima (por defecto 9)
 * @returns ValidatorFn
 */
export function passwordValidator(minLength: number = 9): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const errors: ValidationErrors = {};
    const config = VALIDATION_CONFIG.password;

    // 1. Validar longitud mínima
    if (value.length < minLength) {
      errors['minlength'] = {
        requiredLength: minLength,
        actualLength: value.length
      };
    }

    // 2. Validar longitud máxima
    if (value.length > config.maxLength) {
      errors['maxlength'] = {
        requiredLength: config.maxLength,
        actualLength: value.length
      };
    }

    // 3. Validar mayúscula
    if (!/[A-Z]/.test(value)) {
      errors['missingUppercase'] = true;
    }

    // 4. Validar minúscula
    if (!/[a-z]/.test(value)) {
      errors['missingLowercase'] = true;
    }

    // 5. Validar número
    if (!/\d/.test(value)) {
      errors['missingNumber'] = true;
    }

    // 6. Validar carácter especial
    if (!config.specialChars.test(value)) {
      errors['missingSpecialChar'] = {
        allowedChars: '!@#$%^&*(),.?":{}|<>-_+=[]\\;:/'
      };
    }

    // 7. Validar que no tenga espacios
    if (/\s/.test(value)) {
      errors['hasSpaces'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

// ============================================================
// 3. VALIDADOR DE TELÉFONO
// ============================================================
/**
 * Validador para números de teléfono
 * Permite: +34 612345678 o 612345678
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    // Eliminar espacios
    const clean = value.replace(/\s/g, '');
    const regex = /^\+?[0-9]{9,15}$/;

    return regex.test(clean) ? null : { invalidPhone: { value } };
  };
}

// ============================================================
// 4. VALIDADOR DE EMAIL (específico)
// ============================================================
/**
 * Validador específico para emails
 * Más restrictivo que el de Angular
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    // Email estándar con dominios válidos
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return regex.test(value) ? null : { invalidEmail: { value } };
  };
}

// ============================================================
// 5. VALIDADOR DE CÓDIGO POSTAL
// ============================================================
/**
 * Validador para código postal español (5 dígitos)
 */
export function postalCodeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const regex = /^[0-9]{5}$/;

    return regex.test(value) ? null : { invalidPostalCode: { value } };
  };
}

// ============================================================
// 6. VALIDADOR DE URL
// ============================================================
/**
 * Validador para URLs
 */
export function urlValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;

    return regex.test(value) ? null : { invalidUrl: { value } };
  };
}

// ============================================================
// 7. VALIDADOR DE DNI/NIE (España)
// ============================================================
/**
 * Validador para DNI o NIE español
 * DNI: 8 dígitos + letra
 * NIE: X/Y/Z + 7 dígitos + letra
 */
export function dniValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    const clean = value.replace(/\s/g, '').toUpperCase();
    const regex = /^[XYZ]?\d{7,8}[A-Z]$/;

    if (!regex.test(clean)) {
      return { invalidDni: { value } };
    }

    // Validar letra
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let num = 0;

    if (clean.startsWith('X')) num = 0;
    else if (clean.startsWith('Y')) num = 1;
    else if (clean.startsWith('Z')) num = 2;
    else num = parseInt(clean.slice(0, -1), 10);

    const letter = clean.slice(-1);
    const expected = letters[num % 23];

    return letter === expected ? null : { invalidDni: { value } };
  };
}

// ============================================================
// 8. VALIDADOR DE EDAD (mayor de edad)
// ============================================================
/**
 * Validador para edad mínima
 * @param minAge Edad mínima (por defecto 18)
 */
export function ageValidator(minAge: number = 18): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age >= minAge ? null : { underAge: { minAge, actual: age } };
  };
}

// ============================================================
// 9. VALIDADOR DE CONFIRMACIÓN (para contraseñas)
// ============================================================
/**
 * Validador para confirmar que dos campos coinciden
 * @param controlName Nombre del control a comparar
 */
export function matchValidator(controlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;

    const targetControl = parent.get(controlName);
    if (!targetControl) return null;

    const value = control.value;
    const targetValue = targetControl.value;

    return value === targetValue ? null : { mismatch: { expected: targetValue } };
  };
}

// ============================================================
// 10. VALIDADOR DE FUERZA DE CONTRASEÑA (puntuación)
// ============================================================
/**
 * Validador que evalúa la fuerza de la contraseña
 * Devuelve una puntuación de 0 a 4
 */
export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;

    let score = 0;

    // Longitud
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;

    // Complejidad
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>-_+=]/.test(value)) score++;

    // Si es muy débil (score < 2), devolver error
    if (score < 2) {
      return { weakPassword: { score, maxScore: 5 } };
    }

    return null;
  };
}

// ============================================================
// UTILIDADES PARA MENSAJES DE ERROR
// ============================================================
/**
 * Obtiene un mensaje de error legible para el usuario
 */
export function getErrorMessage(error: ValidationErrors, fieldName: string): string {
  const errors = error;

  if (errors['required']) return `${fieldName} es obligatorio`;
  if (errors['minlength']) {
    const required = errors['minlength'].requiredLength;
    return `${fieldName} debe tener al menos ${required} caracteres`;
  }
  if (errors['maxlength']) {
    const required = errors['maxlength'].requiredLength;
    return `${fieldName} no puede tener más de ${required} caracteres`;
  }
  if (errors['invalidUsername']) return `El usuario solo puede contener letras, números y . _ @ ! ? -`;
  if (errors['invalidEmail']) return 'Introduce un correo electrónico válido';
  if (errors['invalidPhone']) return 'Introduce un número de teléfono válido';
  if (errors['invalidPostalCode']) return 'Introduce un código postal válido (5 dígitos)';
  if (errors['invalidUrl']) return 'Introduce una URL válida';
  if (errors['invalidDni']) return 'Introduce un DNI o NIE válido';
  if (errors['underAge']) return `Debes tener al menos ${errors['underAge'].minAge} años`;
  if (errors['mismatch']) return 'Los campos no coinciden';
  if (errors['weakPassword']) return 'La contraseña es demasiado débil';
  if (errors['hasSpaces']) return 'La contraseña no puede contener espacios';
  if (errors['missingUppercase']) return 'Debe contener al menos una mayúscula (A-Z)';
  if (errors['missingLowercase']) return 'Debe contener al menos una minúscula (a-z)';
  if (errors['missingNumber']) return 'Debe contener al menos un número (0-9)';
  if (errors['missingSpecialChar']) {
    const chars = errors['missingSpecialChar'].allowedChars || '!@#$%^&*(),.?":{}|<>';
    return `Debe contener al menos un carácter especial: ${chars}`;
  }

  return `${fieldName} inválido`;
}