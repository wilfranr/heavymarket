import { Directive, ElementRef, AfterViewInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterViewInit {
  private el = inject(ElementRef);

  ngAfterViewInit(): void {
    setTimeout(() => {
      const nativeEl = this.el.nativeElement;
      if (!nativeEl) return;

      // Buscamos si es un input, botón o elemento interactivo
      const tagName = nativeEl.tagName.toLowerCase();
      const focusableElements = ['input', 'button', 'select', 'textarea'];

      if (focusableElements.includes(tagName) || nativeEl.hasAttribute('tabindex')) {
        nativeEl.focus();
      } else {
        // Si no es un elemento interactivo directamente, buscamos en sus descendientes
        // (por ejemplo si se aplica en un contenedor, p-button, p-dropdown, etc.)
        const child = nativeEl.querySelector('input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
        if (child) {
          (child as HTMLElement).focus();
        }
      }
    }, 100);
  }
}
