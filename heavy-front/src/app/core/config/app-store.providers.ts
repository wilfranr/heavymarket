import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ArticulosEffects } from '../../store/articulos/effects/articulos.effects';
import { AuthEffects } from '../../store/auth/effects/auth.effects';
import { CategoriasEffects } from '../../store/categorias/effects/categorias.effects';
import { ContactosEffects } from '../../store/contactos/effects/contactos.effects';
import { CotizacionesEffects } from '../../store/cotizaciones/effects/cotizaciones.effects';
import { DireccionesEffects } from '../../store/direcciones/effects/direcciones.effects';
import { EmpresasEffects } from '../../store/empresas/effects/empresas.effects';
import { ListasEffects } from '../../store/listas/effects/listas.effects';
import { MaquinasEffects } from '../../store/maquinas/effects/maquinas.effects';
import { OrdenesCompraEffects } from '../../store/ordenes-compra/effects/ordenes-compra.effects';
import { OrdenesTrabajoEffects } from '../../store/ordenes-trabajo/effects/ordenes-trabajo.effects';
import { PedidosEffects } from '../../store/pedidos/effects/pedidos.effects';
import { ReferenciasEffects } from '../../store/referencias/effects/referencias.effects';
import { SistemasEffects } from '../../store/sistemas/effects/sistemas.effects';
import { TercerosEffects } from '../../store/terceros/effects/terceros.effects';
import { TransportadorasEffects } from '../../store/transportadoras/effects/transportadoras.effects';
import { TRMsEffects } from '../../store/trms/effects/trms.effects';
import { UsersEffects } from '../../store/users/effects/users.effects';

/** Effects y devtools solo en rutas autenticadas (/app, /provider). */
export const appStoreProviders: EnvironmentProviders[] = [
    provideEffects([
        AuthEffects,
        PedidosEffects,
        TercerosEffects,
        ListasEffects,
        SistemasEffects,
        ReferenciasEffects,
        MaquinasEffects,
        ArticulosEffects,
        CotizacionesEffects,
        OrdenesCompraEffects,
        OrdenesTrabajoEffects,
        EmpresasEffects,
        CategoriasEffects,
        ContactosEffects,
        DireccionesEffects,
        TransportadorasEffects,
        TRMsEffects,
        UsersEffects
    ]),
    ...(isDevMode() ? [provideStoreDevtools({ maxAge: 25, logOnly: false })] : [])
];
