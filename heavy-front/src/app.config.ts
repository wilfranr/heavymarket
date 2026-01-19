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
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { authInterceptor } from './app/core/auth/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/auth/interceptors/error.interceptor';
import { authReducer } from './app/store/auth/reducers/auth.reducer';
import { pedidosReducer } from './app/store/pedidos/reducers/pedidos.reducer';
import { tercerosReducer } from './app/store/terceros/reducers/terceros.reducer';
import { listasReducer } from './app/store/listas/reducers/listas.reducer';
import { AuthEffects } from './app/store/auth/effects/auth.effects';
import { PedidosEffects } from './app/store/pedidos/effects/pedidos.effects';
import { TercerosEffects } from './app/store/terceros/effects/terceros.effects';
import { ListasEffects } from './app/store/listas/effects/listas.effects';

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
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        provideStore({
            auth: authReducer,
            pedidos: pedidosReducer,
            terceros: tercerosReducer,
            listas: listasReducer
        }),
        provideEffects([AuthEffects, PedidosEffects, TercerosEffects, ListasEffects]),
        provideStoreDevtools({ maxAge: 25, logOnly: false }),
        MessageService,
        ConfirmationService
    ]
};
