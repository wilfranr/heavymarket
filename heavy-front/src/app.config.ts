import { IMAGE_CONFIG, IMAGE_LOADER } from '@angular/common';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { heavymarketImageLoader } from './app/core/image/heavymarket-image.loader';
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { CustomPreloadStrategy } from './app/core/strategies/preload-strategy';
import { MessageService, ConfirmationService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { appRoutes } from './app.routes';
import { rootStoreProviders } from './app/core/config/app-store.reducers';
import { authInterceptor } from './app/core/auth/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/auth/interceptors/error.interceptor';

registerLocaleData(localeEs);

const brandPalette = {
    50: '#fffaf0',
    100: '#fff3d6',
    200: '#ffe6a8',
    300: '#ffd87a',
    400: '#ffca4d',
    500: '#fdb831',
    600: '#e69d1a',
    700: '#cc830d',
    800: '#a6670b',
    900: '#8a530e',
    950: '#4d2b00'
};

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: brandPalette,
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.500}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.600}',
                    activeColor: '{primary.700}'
                },
                highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.100}',
                    color: '{primary.700}',
                    focusColor: '{primary.800}'
                }
            },
            dark: {
                primary: {
                    color: '{primary.500}',
                    contrastColor: '{surface.900}',
                    hoverColor: '{primary.400}',
                    activeColor: '{primary.300}'
                },
                highlight: {
                    background: 'color-mix(in srgb, {primary.500}, transparent 84%)',
                    focusBackground: 'color-mix(in srgb, {primary.500}, transparent 76%)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withPreloading(CustomPreloadStrategy)),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
        ...rootStoreProviders,
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } } }),
        MessageService,
        ConfirmationService,
        { provide: LOCALE_ID, useValue: 'es' },
        { provide: IMAGE_LOADER, useValue: heavymarketImageLoader },
        {
            provide: IMAGE_CONFIG,
            useValue: {
                breakpoints: [140, 280, 560]
            }
        }
    ]
};
