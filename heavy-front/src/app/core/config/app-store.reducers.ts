import { EnvironmentProviders } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { articulosReducer } from '../../store/articulos/reducers/articulos.reducer';
import { authReducer } from '../../store/auth/reducers/auth.reducer';
import { categoriasReducer } from '../../store/categorias/reducers/categorias.reducer';
import { contactosReducer } from '../../store/contactos/reducers/contactos.reducer';
import { cotizacionesReducer } from '../../store/cotizaciones/reducers/cotizaciones.reducer';
import { direccionesReducer } from '../../store/direcciones/reducers/direcciones.reducer';
import { empresasReducer } from '../../store/empresas/reducers/empresas.reducer';
import { listasReducer } from '../../store/listas/reducers/listas.reducer';
import { maquinasReducer } from '../../store/maquinas/reducers/maquinas.reducer';
import { ordenesCompraReducer } from '../../store/ordenes-compra/reducers/ordenes-compra.reducer';
import { ordenesTrabajoReducer } from '../../store/ordenes-trabajo/reducers/ordenes-trabajo.reducer';
import { pedidosReducer } from '../../store/pedidos/reducers/pedidos.reducer';
import { referenciasReducer } from '../../store/referencias/reducers/referencias.reducer';
import { sistemasReducer } from '../../store/sistemas/reducers/sistemas.reducer';
import { tercerosReducer } from '../../store/terceros/reducers/terceros.reducer';
import { transportadorasReducer } from '../../store/transportadoras/reducers/transportadoras.reducer';
import { trmsReducer } from '../../store/trms/reducers/trms.reducer';
import { usersReducer } from '../../store/users/reducers/users.reducer';

/** Store global: evita NG0201 si el preload instancia componentes que usan inject(Store). */
export const rootStoreProviders: EnvironmentProviders[] = [
    provideStore({
        auth: authReducer,
        pedidos: pedidosReducer,
        terceros: tercerosReducer,
        listas: listasReducer,
        sistemas: sistemasReducer,
        referencias: referenciasReducer,
        maquinas: maquinasReducer,
        articulos: articulosReducer,
        cotizaciones: cotizacionesReducer,
        ordenesCompra: ordenesCompraReducer,
        ordenesTrabajo: ordenesTrabajoReducer,
        empresas: empresasReducer,
        categorias: categoriasReducer,
        contactos: contactosReducer,
        direcciones: direccionesReducer,
        transportadoras: transportadorasReducer,
        trms: trmsReducer,
        users: usersReducer
    })
];
