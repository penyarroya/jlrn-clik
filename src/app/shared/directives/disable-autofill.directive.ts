// import { Directive, ElementRef, Renderer2, OnInit, inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';

// @Directive({
//   selector: '[disableAutofill]', // ¡Importante! Ahora es un atributo, no global.
//   standalone: true
// })
// export class DisableAutofillDirective implements OnInit {
//   // Inyección de dependencias con inject() (estilo Angular 14+)
//   private readonly el = inject(ElementRef);
//   private readonly renderer = inject(Renderer2);
//   private readonly platformId = inject(PLATFORM_ID);

//   ngOnInit(): void {
//     // Solo ejecutamos en navegador (por si usas SSR en el futuro)
//     if (!isPlatformBrowser(this.platformId)) {
//       return;
//     }

//     const nativeElement = this.el.nativeElement;
//     const inputType = nativeElement.getAttribute('type') || 'text';

//     // -----------------------------------------------------------------
//     // 1. AUTOFILL INTELIGENTE (Solución para Chrome/Edge/Safari)
//     // -----------------------------------------------------------------
//     // El navegador ignora 'autocomplete="off"'. Usamos valores "inventados"
//     // que el navegador no reconoce como campos de login guardados.
//     let autocompleteValue: string;
//     switch (inputType) {
//       case 'password':
//         // 'new-password' es el estándar oficial para decir "no uses la guardada"
//         autocompleteValue = 'new-password';
//         break;
//       case 'email':
//       case 'tel':
//       case 'text':
//       default:
//         // 'new-username' es ampliamente soportado para evitar el autofill de usuarios
//         autocompleteValue = 'new-username';
//         break;
//     }

//     this.renderer.setAttribute(nativeElement, 'autocomplete', autocompleteValue);

//     // -----------------------------------------------------------------
//     // 2. DESACTIVAR CORRECCIONES MOLESTAS (UX)
//     // -----------------------------------------------------------------
//     // Evita que el móvil ponga mayúscula automática en la primera letra
//     this.renderer.setAttribute(nativeElement, 'autocapitalize', 'none');
    
//     // Evita la corrección ortográfica automática (útil para nombres de usuario o códigos)
//     this.renderer.setAttribute(nativeElement, 'autocorrect', 'off');
    
//     // Quita el subrayado rojo de errores ortográficos
//     this.renderer.setAttribute(nativeElement, 'spellcheck', 'false');

//     // -----------------------------------------------------------------
//     // 3. EXTRA (Opcional pero muy útil)
//     // -----------------------------------------------------------------
//     // En móviles, evita que el teclado muestre opciones de contacto/email
//     // si el campo no es específicamente para eso.
//     if (inputType === 'text' || inputType === 'password') {
//       this.renderer.setAttribute(nativeElement, 'inputmode', 'text');
//     }
//   }
// }













import { Directive, ElementRef, Renderer2, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[disableAutofill]',
  standalone: true
})
export class DisableAutofillDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const nativeElement = this.el.nativeElement;
    const inputType = nativeElement.getAttribute('type') || 'text';

    if (inputType === 'password') {
      // Cambiar a text para evitar autofill
      this.renderer.setAttribute(nativeElement, 'type', 'text');
      this.renderer.addClass(nativeElement, 'password-mask');
      this.renderer.setAttribute(nativeElement, 'autocomplete', 'off');
      this.renderer.setAttribute(nativeElement, 'data-lpignore', 'true');
      this.renderer.setAttribute(nativeElement, 'data-form-type', 'other');
    } else {
      // Para otros campos
      this.renderer.setAttribute(nativeElement, 'autocomplete', 'new-username');
      this.renderer.setAttribute(nativeElement, 'autocorrect', 'off');
      this.renderer.setAttribute(nativeElement, 'autocapitalize', 'off');
      this.renderer.setAttribute(nativeElement, 'spellcheck', 'false');
    }
  }
}