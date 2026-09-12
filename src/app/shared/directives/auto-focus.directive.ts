// src/app/shared/directives/auto-focus.directive.ts
import {
  Directive,
  ElementRef,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  Input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  @Input() focusDelay = 200;
  @Input() focusSelector = 'input:not([disabled]), button:not([disabled])';

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        let target: HTMLElement | null = null;
        if (this.focusSelector) {
          const el = this.el.nativeElement.querySelector(this.focusSelector);
          if (el instanceof HTMLElement) {
            target = el;
          }
        }
        if (!target) {
          target = this.el.nativeElement;
        }
        if (target) {
          target.focus({ preventScroll: true });
        }
      }, this.focusDelay);
    }
  }
}