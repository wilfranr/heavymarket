import { Component, ViewEncapsulation } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Carousel } from './components/carousel/carousel';
import { BrandsSection } from './components/brands-section/brands-section';
import { QuoteSection } from './components/quote-section/quote-section';
import { WhoWeAreSection } from './components/who-we-are-section/who-we-are-section';
import { ValuesSection } from './components/values-section/values-section';
import { StepsSection } from './components/steps-section/steps-section';
import { SystemsSection } from './components/systems-section/systems-section';
import { FooterSection } from './components/footer-section/footer-section';

import { TermsModalComponent } from './components/terms-modal/terms-modal.component';

@Component({
    selector: 'app-landing',
    imports: [Navbar, Carousel, BrandsSection, QuoteSection, WhoWeAreSection, ValuesSection, StepsSection, SystemsSection, FooterSection, TermsModalComponent],
    templateUrl: './landing.html',
    styleUrls: ['../../assets/css/landing.css'],
    encapsulation: ViewEncapsulation.None
})
export class Landing {
    showTerms = false;

    openTerms() {
        this.showTerms = true;
    }
}
