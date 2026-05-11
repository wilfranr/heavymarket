import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LandingService } from '../../../core/services/landing';

interface Brand {
    id: number;
    nombre: string;
    logo: string;
}

@Component({
    selector: 'app-brands-section',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './brands-section.html',
    styleUrl: './brands-section.scss',
    encapsulation: ViewEncapsulation.None
})
export class BrandsSection implements OnInit {
    brands: Brand[] = [];

    constructor(private landingService: LandingService) {}

    ngOnInit() {
        this.landingService.getBrands().subscribe((data) => {
            const normalizedBrands: Brand[] = (data ?? [])
                .map((brand) => ({
                    id: brand.id,
                    nombre: brand.nombre,
                    // El backend expone la imagen como `foto`; mantenemos compatibilidad con `logo`.
                    logo: brand.logo ?? brand.foto ?? ''
                }))
                .filter((brand) => !!brand.logo);

            this.brands = this.shuffle(normalizedBrands);
        });
    }

    private shuffle(array: Brand[]): Brand[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
