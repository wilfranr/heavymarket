import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-loader',
    standalone: true,
    imports: [CommonModule],
    template: `<div class="loader"></div>`,
    styles: [
        `
            :host {
                display: inline-block;
            }
        `
    ]
})
export class LoaderComponent {}
