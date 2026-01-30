import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-carousel',
    imports: [CommonModule],
    templateUrl: './carousel.html',
    styles: ``
})
export class Carousel implements OnInit, OnDestroy {
    currentSlide = 0;
    slides = [0, 1, 2]; // 3 slides as per blade template
    intervalId: any;

    ngOnInit() {
        this.startAutoPlay();
    }

    ngOnDestroy() {
        this.stopAutoPlay();
    }

    showSlide(index: number) {
        this.currentSlide = index;
        // Reset timer on manual interaction? Maybe or keep it running.
        // Let's reset to avoid immediate jump
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    startAutoPlay() {
        this.intervalId = setInterval(() => {
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        }, 5000);
    }

    stopAutoPlay() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
    }
}
