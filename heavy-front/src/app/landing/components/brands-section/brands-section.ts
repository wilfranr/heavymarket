import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { LandingService } from '../../../core/services/landing';

interface LandingBrandDto {
    id: number;
    nombre: string;
    logo?: string;
    foto?: string;
}

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
            logo: brand.logo ?? brand.foto ?? ''
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
