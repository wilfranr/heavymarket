import { Component } from '@angular/core';
import { Navbar } from './components/navbar/navbar';
import { Carousel } from './components/carousel/carousel';
import { BrandsSection } from './components/brands-section/brands-section';
import { QuoteSection } from './components/quote-section/quote-section';
import { StepsSection } from './components/steps-section/steps-section';
import { SystemsSection } from './components/systems-section/systems-section';
import { FooterSection } from './components/footer-section/footer-section';

@Component({
  selector: 'app-landing',
  imports: [
    Navbar,
    Carousel,
    BrandsSection,
    QuoteSection,
    StepsSection,
    SystemsSection,
    FooterSection
  ],
  templateUrl: './landing.html',
  styles: ``,
})
export class Landing {

}
