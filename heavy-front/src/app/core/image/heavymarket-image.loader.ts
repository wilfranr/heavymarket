import { ImageLoaderConfig } from '@angular/common';

/**
 * Ajusta el ancho solicitado por NgOptimizedImage en URLs del endpoint de logos de landing.
 */
export function heavymarketImageLoader(config: ImageLoaderConfig): string {
    if (!config.width) {
        return config.src;
    }

    try {
        const url = new URL(config.src);
        url.searchParams.set('w', String(config.width));

        return url.href;
    } catch {
        return config.src;
    }
}
