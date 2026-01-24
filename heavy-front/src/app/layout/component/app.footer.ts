import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        <span class="text-primary font-bold">HEAVYMARKET.NET</span>
        <span class="font-medium ml-2">© 2026 Todos los derechos reservados</span>
    </div>`
})
export class AppFooter { }
