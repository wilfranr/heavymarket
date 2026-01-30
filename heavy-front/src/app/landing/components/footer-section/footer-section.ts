import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-footer-section',
    imports: [CommonModule],
    templateUrl: './footer-section.html',
    styles: ``
})
export class FooterSection {
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
