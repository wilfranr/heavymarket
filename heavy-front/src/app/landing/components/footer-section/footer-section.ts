import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer-section',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './footer-section.html',
    styles: [`
        .cursor-pointer { cursor: pointer; }
    `]
})
export class FooterSection {
    @Output() openTerms = new EventEmitter<void>();

    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
