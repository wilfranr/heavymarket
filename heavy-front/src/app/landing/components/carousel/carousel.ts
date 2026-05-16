import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CarouselSlide {
    src: string;
    width: number;
    height: number;
    alt: string;
}

@Component({
    selector: 'app-carousel',
    imports: [CommonModule],
    templateUrl: './carousel.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: ``
})
export class Carousel implements OnInit, OnDestroy {
    readonly slides = [0, 1, 2] as const;

    readonly slideAssets: CarouselSlide[] = [
        { src: '/images/carrusel1.webp', width: 1306, height: 732, alt: 'Marcas prestigiosas' },
        { src: '/images/carrusel2.webp', width: 1208, height: 796, alt: 'Plataforma de cotización' },
        { src: '/images/carrusel3.webp', width: 1297, height: 796, alt: 'Asistencia continua' }
    ];

    readonly currentSlide = signal(0);
    readonly loadedSlides = signal<ReadonlySet<number>>(new Set([0]));

    private intervalId: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.preloadSlide(1);
        this.startAutoPlay();
    }

    ngOnDestroy(): void {
        this.stopAutoPlay();
    }

    isSlideLoaded(index: number): boolean {
        return this.loadedSlides().has(index);
    }

    showSlide(index: number): void {
        this.currentSlide.set(index);
        this.ensureSlidesAround(index);
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    nextSlide(): void {
        const next = (this.currentSlide() + 1) % this.slides.length;
        this.currentSlide.set(next);
        this.ensureSlidesAround(next);
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    prevSlide(): void {
        const prev = (this.currentSlide() - 1 + this.slides.length) % this.slides.length;
        this.currentSlide.set(prev);
        this.ensureSlidesAround(prev);
        this.stopAutoPlay();
        this.startAutoPlay();
    }

    private ensureSlidesAround(active: number): void {
        this.preloadSlide(active);
        this.preloadSlide((active + 1) % this.slides.length);
    }

    private preloadSlide(index: number): void {
        if (this.loadedSlides().has(index)) {
            return;
        }

        const asset = this.slideAssets[index];
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            const next = new Set(this.loadedSlides());
            next.add(index);
            this.loadedSlides.set(next);
        };
        img.src = asset.src;
    }

    private startAutoPlay(): void {
        this.intervalId = setInterval(() => {
            const next = (this.currentSlide() + 1) % this.slides.length;
            this.currentSlide.set(next);
            this.ensureSlidesAround(next);
        }, 5000);
    }

    private stopAutoPlay(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
