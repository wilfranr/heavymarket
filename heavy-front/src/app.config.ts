import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withPreloading } from '@angular/router';
import { CustomPreloadStrategy } from './app/core/strategies/preload-strategy';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { MessageService, ConfirmationService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { providePrimeNG } from 'primeng/config';

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
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/auth/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/auth/interceptors/error.interceptor';
import { authReducer } from './app/store/auth/reducers/auth.reducer';
import { pedidosReducer } from './app/store/pedidos/reducers/pedidos.reducer';
import { tercerosReducer } from './app/store/terceros/reducers/terceros.reducer';
import { listasReducer } from './app/store/listas/reducers/listas.reducer';
import { fabricantesReducer } from './app/store/fabricantes/reducers/fabricantes.reducer';
import { sistemasReducer } from './app/store/sistemas/reducers/sistemas.reducer';
import { referenciasReducer } from './app/store/referencias/reducers/referencias.reducer';
import { maquinasReducer } from './app/store/maquinas/reducers/maquinas.reducer';
import { articulosReducer } from './app/store/articulos/reducers/articulos.reducer';
import { cotizacionesReducer } from './app/store/cotizaciones/reducers/cotizaciones.reducer';
import { ordenesCompraReducer } from './app/store/ordenes-compra/reducers/ordenes-compra.reducer';
import { ordenesTrabajoReducer } from './app/store/ordenes-trabajo/reducers/ordenes-trabajo.reducer';
import { empresasReducer } from './app/store/empresas/reducers/empresas.reducer';
import { AuthEffects } from './app/store/auth/effects/auth.effects';
import { PedidosEffects } from './app/store/pedidos/effects/pedidos.effects';
import { TercerosEffects } from './app/store/terceros/effects/terceros.effects';
import { ListasEffects } from './app/store/listas/effects/listas.effects';
import { FabricantesEffects } from './app/store/fabricantes/effects/fabricantes.effects';
import { SistemasEffects } from './app/store/sistemas/effects/sistemas.effects';
import { ReferenciasEffects } from './app/store/referencias/effects/referencias.effects';
import { MaquinasEffects } from './app/store/maquinas/effects/maquinas.effects';
import { ArticulosEffects } from './app/store/articulos/effects/articulos.effects';
import { CotizacionesEffects } from './app/store/cotizaciones/effects/cotizaciones.effects';
import { OrdenesCompraEffects } from './app/store/ordenes-compra/effects/ordenes-compra.effects';
import { OrdenesTrabajoEffects } from './app/store/ordenes-trabajo/effects/ordenes-trabajo.effects';

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(
            appRoutes,
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
            withEnabledBlockingInitialNavigation(),
            withPreloading(CustomPreloadStrategy)
        ),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: MyPreset, options: { darkModeSelector: '.app-dark' } } }),
        provideStore({
            auth: authReducer,
            pedidos: pedidosReducer,
            terceros: tercerosReducer,
            listas: listasReducer,
            fabricantes: fabricantesReducer,
            sistemas: sistemasReducer,
            referencias: referenciasReducer,
            maquinas: maquinasReducer,
            articulos: articulosReducer,
            cotizaciones: cotizacionesReducer,
            ordenesCompra: ordenesCompraReducer,
            ordenesTrabajo: ordenesTrabajoReducer
        }),
        provideEffects([AuthEffects, PedidosEffects, TercerosEffects, ListasEffects, FabricantesEffects, SistemasEffects, ReferenciasEffects, MaquinasEffects, ArticulosEffects, CotizacionesEffects, OrdenesCompraEffects, OrdenesTrabajoEffects]),
        provideStoreDevtools({ maxAge: 25, logOnly: false }),
        MessageService,
        ConfirmationService
    ]
};
