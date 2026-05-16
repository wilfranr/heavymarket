import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { LandingBrandDto, LandingService } from '../../../core/services/landing';

interface Brand {
    id: number;
    nombre: string;
    logo: string;
    width: number;
    height: number;
}

@Component({
    selector: 'app-brands-section',
    standalone: true,
    imports: [NgOptimizedImage],
    templateUrl: './brands-section.html',
    styleUrl: './brands-section.scss',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandsSection {
    private readonly landingService = inject(LandingService);

    readonly brands = toSignal(
        this.landingService.getBrands().pipe(
            map((data) => normalizeBrands(data)),
            map((items) => shuffleBrands(items)),
            catchError(() => of([] as Brand[]))
        ),
        { initialValue: [] as Brand[] }
    );

    readonly marqueeBrands = computed(() => {
        const items = this.brands();
        return items.length > 0 ? [...items, ...items] : [];
    });
}

function normalizeBrands(data: LandingBrandDto[] | null | undefined): Brand[] {
    return (data ?? [])
        .map((brand) => ({
            id: brand.id,
            nombre: brand.nombre,
            logo: brand.logo ?? brand.foto ?? '',
            width: brand.logoWidth ?? 140,
            height: brand.logoHeight ?? 68
        }))
        .filter((brand) => !!brand.logo);
}

function shuffleBrands(array: Brand[]): Brand[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
