// // shared/directives/focus-trap.directive.ts
// import {
//   Directive,
//   ElementRef,
//   AfterViewInit,
//   OnDestroy,
//   HostListener,
//   Input,
//   inject,
// } from '@angular/core';
// import { Subscription, fromEvent } from 'rxjs';
// import { debounceTime } from 'rxjs/operators';

// @Directive({
//   selector: '[appFocusTrap]',
//   standalone: true,
// })
// export class FocusTrapDirective implements AfterViewInit, OnDestroy {
//   private readonly el = inject(ElementRef<HTMLElement>);

//   @Input() trapSelector =
//     'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

//   @Input() preventClickOutside = true;

//   private focusableElements: HTMLElement[] = [];
//   private firstFocusable: HTMLElement | null = null;
//   private lastFocusable: HTMLElement | null = null;
//   private lastFocusedElement: HTMLElement | null = null; // 👈 NUEVO
//   private subscriptions: Subscription[] = [];

//   ngAfterViewInit(): void {
//     this.updateFocusableElements();

//     // Escuchamos los eventos de foco dentro del contenedor para recordar el último enfocado
//     this.el.nativeElement.addEventListener('focusin', this.onFocusIn.bind(this));

//     if (this.preventClickOutside) {
//       const sub = fromEvent<MouseEvent>(document, 'mousedown')
//         .pipe(debounceTime(10))
//         .subscribe((event: MouseEvent) => {
//           const target = event.target as Node | null;
//           if (!target || !this.el.nativeElement.contains(target)) {
//             const active = document.activeElement;
//             if (!active || !this.el.nativeElement.contains(active)) {
//               // Redirigimos al último elemento enfocado, o al primero si no hay
//               this.focusLastOrFirst();
//             }
//           }
//         });
//       this.subscriptions.push(sub);
//     }
//   }

//   // 👇 Guardamos el elemento que recibe el foco dentro del contenedor
//   private onFocusIn(event: FocusEvent): void {
//     const target = event.target as HTMLElement;
//     if (target && this.el.nativeElement.contains(target)) {
//       this.lastFocusedElement = target;
//     }
//   }

//   private updateFocusableElements(): void {
//     const elements = this.el.nativeElement.querySelectorAll(this.trapSelector);
//     this.focusableElements = Array.from(elements).filter(
//       (el): el is HTMLElement =>
//         el instanceof HTMLElement &&
//         !el.hasAttribute('disabled') &&
//         this.isVisible(el)
//     );

//     this.firstFocusable = this.focusableElements[0] || null;
//     this.lastFocusable =
//       this.focusableElements[this.focusableElements.length - 1] || null;
//   }

//   @HostListener('focusout', ['$event'])
//   onFocusOut(event: FocusEvent): void {
//     const relatedTarget = event.relatedTarget as HTMLElement | null;
//     if (!relatedTarget || !this.el.nativeElement.contains(relatedTarget)) {
//       // Redirigimos al último elemento enfocado, o al primero si no hay
//       this.focusLastOrFirst();
//       event.preventDefault();
//       event.stopPropagation();
//     }
//   }

//   // 👇 Método auxiliar para enfocar el último o el primero
//   private focusLastOrFirst(): void {
//     const target = this.lastFocusedElement || this.firstFocusable;
//     if (target) {
//       target.focus({ preventScroll: false });
//     }
//   }

//   @HostListener('keydown', ['$event'])
//   onKeydown(event: KeyboardEvent): void {
//     if (event.key !== 'Tab') return;

//     const focusable = this.focusableElements;
//     if (focusable.length === 0) return;

//     const active = document.activeElement as HTMLElement;
//     if (!active || !this.el.nativeElement.contains(active)) return;

//     const index = focusable.indexOf(active);
//     const isShift = event.shiftKey;

//     if (isShift && index === 0) {
//       const last = focusable[focusable.length - 1];
//       if (last) {
//         last.focus({ preventScroll: false });
//         event.preventDefault();
//       }
//     } else if (!isShift && index === focusable.length - 1) {
//       const first = focusable[0];
//       if (first) {
//         first.focus({ preventScroll: false });
//         event.preventDefault();
//       }
//     }
//   }

//   private isVisible(el: HTMLElement): boolean {
//     if (!el) return false;
//     const rect = el.getBoundingClientRect();
//     if (rect.width === 0 && rect.height === 0) return false;

//     let current: HTMLElement | null = el;
//     while (current) {
//       const style = window.getComputedStyle(current);
//       if (style.display === 'none' || style.visibility === 'hidden') {
//         return false;
//       }
//       current = current.parentElement;
//     }
//     return true;
//   }

//   ngOnDestroy(): void {
//     // Limpiamos el event listener
//     this.el.nativeElement.removeEventListener('focusin', this.onFocusIn.bind(this));
//     this.subscriptions.forEach((sub) => sub.unsubscribe());
//   }
// }













// shared/directives/focus-trap.directive.ts
import {
  Directive,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  Input,
  inject,
} from '@angular/core';
import { Subscription, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef);

  @Input() trapSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  @Input() preventClickOutside = true;

  private focusableElements: HTMLElement[] = [];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private subscriptions: Subscription[] = [];

  ngAfterViewInit(): void {
    // ✅ Verificar que el elemento exista antes de continuar
    if (!this.el || !this.el.nativeElement) {
      console.warn('FocusTrapDirective: elemento no disponible');
      return;
    }

    // ✅ Verificar que nativeElement sea un elemento HTML
    if (!(this.el.nativeElement instanceof HTMLElement)) {
      console.warn('FocusTrapDirective: nativeElement no es HTMLElement');
      return;
    }

    // ✅ Verificar que tenga querySelectorAll
    if (typeof this.el.nativeElement.querySelectorAll !== 'function') {
      console.warn('FocusTrapDirective: querySelectorAll no disponible');
      return;
    }

    this.updateFocusableElements();

    this.el.nativeElement.addEventListener('focusin', this.onFocusIn.bind(this));

    if (this.preventClickOutside) {
      const sub = fromEvent<MouseEvent>(document, 'mousedown')
        .pipe(debounceTime(10))
        .subscribe((event: MouseEvent) => {
          const target = event.target as Node | null;
          if (!target || !this.el.nativeElement.contains(target)) {
            const active = document.activeElement;
            if (!active || !this.el.nativeElement.contains(active)) {
              this.focusLastOrFirst();
            }
          }
        });
      this.subscriptions.push(sub);
    }
  }

  private onFocusIn(event: FocusEvent): void {
    const target = event.target as HTMLElement;
    if (target && this.el.nativeElement.contains(target)) {
      this.lastFocusedElement = target;
    }
  }

  private updateFocusableElements(): void {
    // ✅ Verificar que el elemento exista
    if (!this.el || !this.el.nativeElement) return;

    try {
      const elements = this.el.nativeElement.querySelectorAll(this.trapSelector);
      this.focusableElements = Array.from(elements).filter(
        (el): el is HTMLElement =>
          el instanceof HTMLElement &&
          !el.hasAttribute('disabled') &&
          this.isVisible(el)
      );

      this.firstFocusable = this.focusableElements[0] || null;
      this.lastFocusable =
        this.focusableElements[this.focusableElements.length - 1] || null;
    } catch (error) {
      console.warn('FocusTrapDirective: error al actualizar elementos', error);
      this.focusableElements = [];
      this.firstFocusable = null;
      this.lastFocusable = null;
    }
  }

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent): void {
    // ✅ Verificar que el elemento exista
    if (!this.el || !this.el.nativeElement) return;

    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (!relatedTarget || !this.el.nativeElement.contains(relatedTarget)) {
      this.focusLastOrFirst();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private focusLastOrFirst(): void {
    const target = this.lastFocusedElement || this.firstFocusable;
    if (target) {
      try {
        target.focus({ preventScroll: false });
      } catch (error) {
        // Ignorar errores de focus
      }
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    // ✅ Verificar que el elemento exista
    if (!this.el || !this.el.nativeElement) return;

    const focusable = this.focusableElements;
    if (focusable.length === 0) return;

    const active = document.activeElement as HTMLElement;
    if (!active || !this.el.nativeElement.contains(active)) return;

    const index = focusable.indexOf(active);
    const isShift = event.shiftKey;

    if (isShift && index === 0) {
      const last = focusable[focusable.length - 1];
      if (last) {
        last.focus({ preventScroll: false });
        event.preventDefault();
      }
    } else if (!isShift && index === focusable.length - 1) {
      const first = focusable[0];
      if (first) {
        first.focus({ preventScroll: false });
        event.preventDefault();
      }
    }
  }

  private isVisible(el: HTMLElement): boolean {
    if (!el) return false;
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return false;

      let current: HTMLElement | null = el;
      while (current) {
        const style = window.getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden') {
          return false;
        }
        current = current.parentElement;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  ngOnDestroy(): void {
    if (this.el && this.el.nativeElement) {
      this.el.nativeElement.removeEventListener('focusin', this.onFocusIn.bind(this));
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}