import { Component, OnInit, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { ImageModule } from 'primeng/image';
import { loadOrdenCompraById, transitionOrdenCompra } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { OrdenCompra, OrdenCompraEstado, OrdenCompraPedido, OrdenCompraReferencia, EstadoRecepcion, TransitionOrdenCompraDto } from '../../../core/models/orden-compra.model';
import { RecepcionCompra } from '../../../core/models/recepcion-compra.model';
import { Maquina } from '../../../core/models/maquina.model';
import { MaquinaService } from '../../../core/services/maquina.service';
import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TerceroFormComponent } from '../../../shared/components/tercero-form/tercero-form.component';
import { MaquinaDetailComponent } from '../../../shared/components/maquina-detail/maquina-detail.component';
import { RecepcionCompraModalComponent } from './recepcion-compra-modal/recepcion-compra-modal.component';
import { estadoRecepcionLabel, estadoRecepcionSeverity } from '../../../core/utils/estado-recepcion';

type PedidoMaquina = NonNullable<OrdenCompraPedido['maquina']>;
type PedidoTercero = NonNullable<OrdenCompraPedido['tercero']>;
type MaquinaDetalle = Maquina | PedidoMaquina;

const ORDEN_COMPRA_TRANSICIONES: Record<OrdenCompraEstado, OrdenCompraEstado[]> = {
    // Nuevos estados formales
    'Pendiente de Revisión de Stock': ['Stock Incompleto', 'En Espera de Aprobación Gerencial', 'Confirmada', 'Cancelada'],
    'Stock Incompleto': ['En Espera de Aprobación Gerencial', 'Cancelada'],
    'En Espera de Aprobación Gerencial': ['Pendiente de Pago', 'Devuelta por Gerencia', 'Cancelada'],
    'Devuelta por Gerencia': ['En Espera de Aprobación Gerencial', 'Pendiente de Revisión de Stock', 'Cancelada'],
    'Pendiente de Pago': ['Pagada / Lista para Despacho', 'Pagada', 'Cancelada'],
    'Pagada / Lista para Despacho': ['En Tránsito', 'Despachada', 'Cancelada - Reembolso Pendiente', 'Cancelada'],
    'Cancelada - Reembolso Pendiente': [],
    'En Tránsito': ['Recepción con Novedades (Bloqueada)', 'Entregada / Cerrada', 'Recibida parcialmente', 'Recibida', 'Cancelada'],
    'Recepción con Novedades (Bloqueada)': ['Pagada / Lista para Despacho', 'Entregada / Cerrada', 'Cancelada'],
    'Entregada / Cerrada': [],

    // Retrocompatibilidad
    Generada: ['Pendiente de Revisión de Stock', 'Enviada', 'Cancelada'],
    Enviada: ['Confirmada', 'Stock Incompleto', 'En Espera de Aprobación Gerencial', 'Cancelada'],
    Confirmada: ['Pendiente de Pago', 'En Espera de Aprobación Gerencial', 'Pagada', 'Despachada', 'En Tránsito', 'Cancelada'],
    Pagada: ['En Tránsito', 'Despachada', 'Cancelada - Reembolso Pendiente', 'Cancelada'],
    Despachada: ['En Tránsito', 'Recepción con Novedades (Bloqueada)', 'Entregada / Cerrada', 'Recibida parcialmente', 'Recibida', 'Cancelada'],
    'Recibida parcialmente': ['Recibida', 'Entregada / Cerrada', 'Recepción con Novedades (Bloqueada)'],
    Recibida: [],
    Cancelada: []
};

export function ordenCompraPuedeTransitar(origen: OrdenCompraEstado | null, destino: OrdenCompraEstado): boolean {
    if (!origen) return false;
    return (ORDEN_COMPRA_TRANSICIONES[origen] ?? []).includes(destino);
}

export function ordenCompraPuedeRecibir(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Enviada' || estado === 'Confirmada' || estado === 'Despachada' || estado === 'En Tránsito' || estado === 'Recibida parcialmente' || estado === 'Recepción con Novedades (Bloqueada)';
}

export function ordenCompraPuedeCancelar(estado: OrdenCompraEstado | null): boolean {
    return (
        estado === 'Generada' ||
        estado === 'Pendiente de Revisión de Stock' ||
        estado === 'Stock Incompleto' ||
        estado === 'En Espera de Aprobación Gerencial' ||
        estado === 'Devuelta por Gerencia' ||
        estado === 'Pendiente de Pago' ||
        estado === 'Pagada / Lista para Despacho' ||
        estado === 'Enviada' ||
        estado === 'Confirmada' ||
        estado === 'Pagada' ||
        estado === 'Despachada' ||
        estado === 'En Tránsito'
    );
}

export function ordenCompraProgresoItem(item: Pick<OrdenCompraReferencia, 'cantidad' | 'cantidad_recibida'>): number {
    const cantidad = item.cantidad || 0;
    const recibido = item.cantidad_recibida || 0;

    if (cantidad <= 0) return 0;

    return Math.min(100, Math.round((recibido / cantidad) * 100));
}

/**
 * Componente de detalle de orden de compra
 */
@Component({
    selector: 'app-orden-compra-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        TableModule,
        TooltipModule,
        DialogModule,
        TextareaModule,
        InputTextModule,
        ProgressBarModule,
        ImageModule,
        TerceroFormComponent,
        MaquinaDetailComponent,
        RecepcionCompraModalComponent
    ],
    template: `
        <div class="card">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 class="m-0">Orden de Compra OC-{{ ordenCompraId() }}</h2>
                    <p class="text-gray-500 m-0">Detalle completo y referencias vinculadas</p>
                </div>
                <div class="flex gap-2">
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [text]="true" (onClick)="onBack()"></p-button>
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" (onClick)="onEdit()"></p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
                    <p class="mt-4">Cargando información...</p>
                </div>
            } @else if (ordenCompra()) {
                <!-- Fila Superior de Tarjetas Informativas (Tipo Costeo) -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <!-- Tarjeta Información del pedido -->
                    <div class="figma-card p-0 overflow-hidden flex flex-col h-[290px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-lg">
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-color text-base pl-2">Información del pedido</span>
                            <div class="w-[47px] h-[44px] flex items-center justify-center">
                                <i class="pi pi-shopping-bag text-muted-color text-xl"></i>
                            </div>
                        </div>
                        <div class="p-4 space-y-3 flex-1 text-sm bg-surface-0 dark:bg-surface-900">
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Pedido:</span> <span class="text-color">{{ ordenCompra()?.pedido_id || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Creación:</span> <span class="text-color">{{ ordenCompra()?.pedido?.created_at | date: 'MMMM d, y' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Actualización:</span> <span class="text-color">{{ ordenCompra()?.pedido?.updated_at | date: 'MMMM d, y' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Usuario:</span> <span class="text-color">{{ ordenCompra()?.pedido?.user?.name || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-2"><span class="text-blue-500 font-semibold">Cargo:</span> <span class="text-color">Asesor</span></div>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-blue-500 font-semibold">Estado:</span>
                                <p-tag [value]="ordenCompra()?.pedido?.estado || 'N/A'" [severity]="getPedidoEstadoSeverity(ordenCompra()?.pedido?.estado || '')" styleClass="text-xs px-2.5 py-0.5 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta Información de la máquina -->
                    <div class="figma-card p-0 overflow-hidden flex flex-col h-[290px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-lg">
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-color text-base pl-2">Información de la máquina</span>
                            <div class="flex items-center gap-1 pr-2">
                                @if (ordenCompra()?.pedido?.maquina) {
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewMaquina(ordenCompra()?.pedido?.maquina)" pTooltip="Ver detalle de máquina" styleClass="w-8 h-8"></p-button>
                                }
                                <i class="pi pi-cog text-muted-color text-xl p-2"></i>
                            </div>
                        </div>
                        <div class="p-4 space-y-3 flex-1 text-sm bg-surface-0 dark:bg-surface-900">
                            @if (ordenCompra()?.pedido?.maquina) {
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Máquina:</span> <span class="text-color">{{ ordenCompra()?.pedido?.maquina?.tipo || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Fabricante:</span> <span class="text-color">{{ ordenCompra()?.pedido?.maquina?.marca || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Modelo:</span> <span class="text-color">{{ ordenCompra()?.pedido?.maquina?.modelo || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Serie:</span> <span class="text-color">{{ ordenCompra()?.pedido?.maquina?.serie || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Horas:</span> <span class="text-color">{{ ordenCompra()?.pedido?.maquina?.horas || '----' }}</span>
                                </div>
                            } @else {
                                <p class="text-muted-color italic m-0">Sin máquina asociada</p>
                            }
                        </div>
                    </div>

                    <!-- Tarjeta Información de tercero -->
                    <div class="figma-card p-0 overflow-hidden flex flex-col h-[290px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-lg">
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-color text-base pl-2">Información del cliente</span>
                            <div class="flex items-center gap-1 pr-2">
                                @if (ordenCompra()?.pedido?.tercero) {
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewTercero(ordenCompra()?.pedido?.tercero)" pTooltip="Ver detalle de cliente" styleClass="w-8 h-8"></p-button>
                                }
                                <i class="pi pi-user text-muted-color text-xl p-2"></i>
                            </div>
                        </div>
                        <div class="p-4 space-y-2 flex-1 text-sm bg-surface-0 dark:bg-surface-900">
                            @if (ordenCompra()?.pedido?.tercero) {
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Cliente:</span> <span class="text-color truncate max-w-[200px]" [title]="ordenCompra()?.pedido?.tercero?.nombre">{{ ordenCompra()?.pedido?.tercero?.nombre }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Número de documento:</span> <span class="text-color">{{ ordenCompra()?.pedido?.tercero?.nit || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Ciudad:</span> <span class="text-color">{{ ordenCompra()?.pedido?.tercero?.city?.name || '--' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Contacto:</span> <span class="text-color">{{ ordenCompra()?.pedido?.contacto?.nombre || '--' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Teléfono:</span> <span class="text-color">{{ ordenCompra()?.pedido?.contacto?.telefono || ordenCompra()?.pedido?.tercero?.telefono || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Email:</span>
                                    <span class="text-color truncate max-w-[200px]" [title]="ordenCompra()?.pedido?.contacto?.email || ordenCompra()?.pedido?.tercero?.email">{{
                                        ordenCompra()?.pedido?.contacto?.email || ordenCompra()?.pedido?.tercero?.email || '---'
                                    }}</span>
                                </div>
                            } @else {
                                <p class="text-muted-color italic m-0">No hay información del cliente asociada.</p>
                            }
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Columna Izquierda: Info Principal -->
                    <div class="lg:col-span-2 flex flex-col gap-6">
                        @if (ordenCompra()?.estado === 'Stock Incompleto') {
                            <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-exclamation-triangle text-amber-600 dark:text-amber-400 text-2xl mt-0.5"></i>
                                    <div>
                                        <h4 class="m-0 text-amber-900 dark:text-amber-200 font-bold text-base">El proveedor reportó faltantes de inventario</h4>
                                        <p class="m-0 text-xs sm:text-sm text-amber-800 dark:text-amber-300 mt-1">
                                            Revise las unidades disponibles reportadas a continuación. Puede continuar el flujo con las cantidades confirmadas o cancelar la orden de compra.
                                        </p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                    <p-button label="Aceptar Cantidades Disponibles" icon="pi pi-check" severity="success" (onClick)="transitionTo('En Espera de Aprobación Gerencial')"></p-button>
                                    <p-button label="Cancelar Orden" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="openCancelDialog()"></p-button>
                                </div>
                            </div>
                        }

                        @if (ordenCompra()?.estado === 'Devuelta por Gerencia') {
                            <div class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-exclamation-circle text-red-600 dark:text-red-400 text-2xl mt-0.5"></i>
                                    <div>
                                        <h4 class="m-0 text-red-900 dark:text-red-200 font-bold text-base">Orden devuelta por Gerencia Comercial</h4>
                                        <p class="m-0 text-xs sm:text-sm text-red-800 dark:text-red-300 mt-1"><strong>Motivo:</strong> {{ ordenCompra()?.motivo_rechazo_gerencia || 'No especificado' }}</p>
                                        <p class="m-0 text-xs text-red-700 dark:text-red-400 mt-1">Por favor corrija las observaciones o ajuste las condiciones antes de reenviar a aprobación.</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                    <p-button label="Reenviar a Aprobación Gerencial" icon="pi pi-send" severity="primary" (onClick)="transitionTo('En Espera de Aprobación Gerencial')"></p-button>
                                </div>
                            </div>
                        }

                        @if (tieneTransitoProlongado()) {
                            <div class="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border-2 border-orange-400 dark:border-orange-600 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-exclamation-triangle text-orange-600 dark:text-orange-400 text-2xl mt-0.5"></i>
                                    <div>
                                        <h4 class="m-0 text-orange-900 dark:text-orange-200 font-bold text-base">Alerta: Tránsito Prolongado ({{ diasEnTransito() }} días sin entrega)</h4>
                                        <p class="m-0 text-xs sm:text-sm text-orange-800 dark:text-orange-300 mt-1">
                                            Esta orden de compra fue despachada el {{ ordenCompra()?.fecha_despacho | date: 'mediumDate' }} y excede el umbral de 5 días. Por favor contacte a la transportadora
                                            <strong>{{ ordenCompra()?.transportadora?.nombre || 'asignada' }}</strong> con el número de guía <strong>{{ ordenCompra()?.guia }}</strong
                                            >.
                                        </p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                    <p-tag severity="warn" value="Monitoreo Requerido" icon="pi pi-clock"></p-tag>
                                </div>
                            </div>
                        }

                        @if (ordenCompra()?.estado === 'Recepción con Novedades (Bloqueada)') {
                            <div class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-600 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div class="flex items-start gap-3">
                                    <i class="pi pi-shield text-rose-600 dark:text-rose-400 text-2xl mt-0.5"></i>
                                    <div>
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h4 class="m-0 text-rose-900 dark:text-rose-200 font-bold text-base">Recepción con Novedades (Bloqueada)</h4>
                                            <p-tag severity="danger" value="Bloqueada por Logística" icon="pi pi-lock"></p-tag>
                                        </div>
                                        <p class="m-0 text-xs sm:text-sm text-rose-800 dark:text-rose-300 mt-1">
                                            Se recibieron piezas dañadas o no conformes con evidencia fotográfica. El Asesor Comercial o Administrador debe resolver el conflicto aprobando una reposición o solicitando nota crédito / reembolso.
                                        </p>
                                    </div>
                                </div>
                                @if (puedeResolverNovedades()) {
                                    <div class="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                                        <p-button label="Aprobar Reposición" icon="pi pi-refresh" severity="warn" (onClick)="openResolucionNovedadDialog('reposicion')"></p-button>
                                        <p-button label="Solicitar Nota Crédito" icon="pi pi-file-excel" severity="danger" [outlined]="true" (onClick)="openResolucionNovedadDialog('nota_credito')"></p-button>
                                    </div>
                                }
                            </div>
                        }

                        <p-card header="Información General">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Proveedor</span>
                                    <span class="text-lg">{{ ordenCompra()?.proveedor?.nombre || 'N/A' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Estado</span>
                                    <div class="mt-1 flex items-center gap-2 flex-wrap">
                                        <p-tag [value]="ordenCompra()?.estado || 'N/A'" [severity]="getEstadoSeverity(ordenCompra()?.estado || '')"></p-tag>
                                        @if (ordenCompra()?.estado_recepcion; as estadoRecepcion) {
                                            <p-tag [value]="getRecepcionLabel(estadoRecepcion)" [severity]="getRecepcionSeverity(estadoRecepcion)"></p-tag>
                                        }
                                    </div>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Fecha Expedición</span>
                                    <span>{{ ordenCompra()?.fecha_expedicion | date: 'longDate' }}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Fecha Entrega</span>
                                    <span>{{ ordenCompra()?.fecha_entrega | date: 'longDate' }}</span>
                                </div>
                                <div class="flex flex-col md:col-span-2">
                                    <span class="text-sm font-bold text-gray-500 uppercase">Observaciones</span>
                                    <p class="mt-1 m-0 text-gray-300 italic">{{ ordenCompra()?.observaciones || 'Sin observaciones' }}</p>
                                </div>
                                @if (ordenCompra()?.motivo_rechazo_gerencia; as motivoRechazo) {
                                    <div class="flex flex-col md:col-span-2 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                                        <div class="flex items-center gap-2 mb-1">
                                            <i class="pi pi-info-circle text-red-500 text-sm"></i>
                                            <span class="text-xs font-bold text-red-600 dark:text-red-400 uppercase">Motivo de Devolución por Gerencia</span>
                                        </div>
                                        <p class="m-0 text-sm text-color whitespace-pre-wrap">{{ motivoRechazo }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.motivo_reembolso; as motivoReembolso) {
                                    <div class="flex flex-col md:col-span-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <div class="flex items-center gap-2 mb-1">
                                            <i class="pi pi-exclamation-circle text-amber-500 text-sm"></i>
                                            <span class="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Motivo de Reembolso Pendiente</span>
                                        </div>
                                        <p class="m-0 text-sm text-color whitespace-pre-wrap">{{ motivoReembolso }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.comprobante_pago_ruta; as comprobanteRuta) {
                                    <div class="flex flex-col md:col-span-2 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                        <div class="flex items-center justify-between flex-wrap gap-2">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-file-check text-emerald-600 dark:text-emerald-400 text-base"></i>
                                                <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Comprobante de Pago Registrado</span>
                                                @if (ordenCompra()?.referencia_pago; as refPago) {
                                                    <span class="text-xs font-mono bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">Ref: {{ refPago }}</span>
                                                }
                                            </div>
                                            <a [href]="getComprobanteUrl(comprobanteRuta)" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline">
                                                <i class="pi pi-external-link text-xs"></i>
                                                Ver Comprobante
                                            </a>
                                        </div>
                                        @if (ordenCompra()?.fecha_pago; as fechaPago) {
                                            <span class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Registrado el {{ fechaPago | date: 'medium' }}</span>
                                        }
                                    </div>
                                }
                                @if (ordenCompra()?.instrucciones_despacho; as instrucciones) {
                                    <div class="flex flex-col md:col-span-2 bg-surface-50 dark:bg-surface-800 p-3 rounded-lg border border-surface-200 dark:border-surface-700">
                                        <div class="flex items-center gap-2 mb-1">
                                            <i class="pi pi-directions text-primary text-sm"></i>
                                            <span class="text-xs font-bold text-gray-500 uppercase">Instrucciones de Despacho</span>
                                        </div>
                                        <p class="m-0 text-sm text-color whitespace-pre-wrap">{{ instrucciones }}</p>
                                    </div>
                                }
                                @if (ordenCompra()?.resolucion_novedad_tipo; as resolucionTipo) {
                                    <div class="flex flex-col md:col-span-2 bg-purple-50 dark:bg-purple-950/30 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                                        <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-check-circle text-purple-600 dark:text-purple-400 text-sm"></i>
                                                <span class="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase"
                                                    >Resolución de Novedad: {{ resolucionTipo === 'reposicion' ? 'Reposición Aprobada' : 'Nota Crédito / Reembolso Solicitado' }}</span
                                                >
                                            </div>
                                            @if (ordenCompra()?.fecha_resolucion_novedad; as fechaRes) {
                                                <span class="text-xs text-purple-600 dark:text-purple-400">{{ fechaRes | date: 'medium' }}</span>
                                            }
                                        </div>
                                        <p class="m-0 text-sm text-color whitespace-pre-wrap">{{ ordenCompra()?.resolucion_novedad_comentario || 'Sin comentario adicional' }}</p>
                                        @if (ordenCompra()?.resuelto_por?.name; as resolutor) {
                                            <span class="text-xs text-muted-color mt-1">Resuelto por: {{ resolutor }}</span>
                                        }
                                    </div>
                                }
                            </div>
                        </p-card>

                        <p-card header="Acciones de estado">
                            <div class="flex flex-wrap gap-2">
                                @if (puedeResolverNovedades()) {
                                    <p-button label="Resolver: Aprobar Reposición" icon="pi pi-refresh" severity="warn" (onClick)="openResolucionNovedadDialog('reposicion')"></p-button>
                                    <p-button label="Resolver: Nota Crédito" icon="pi pi-file-excel" severity="danger" [outlined]="true" (onClick)="openResolucionNovedadDialog('nota_credito')"></p-button>
                                }
                                @if (puedeAprobarGerencia()) {
                                    <p-button label="Aprobar Orden (Gerencia)" icon="pi pi-check-circle" severity="success" (onClick)="transitionTo('Pendiente de Pago')"></p-button>
                                }
                                @if (puedeDevolverGerencia()) {
                                    <p-button label="Devolver a Asesor" icon="pi pi-replay" severity="warn" [outlined]="true" (onClick)="openDevolucionGerenciaDialog()"></p-button>
                                }
                                @if (puedePasarA('Pendiente de Revisión de Stock')) {
                                    <p-button label="Enviar a Revisión de Stock" icon="pi pi-send" severity="primary" (onClick)="openEnvioRevisionDialog()"></p-button>
                                }
                                @if (puedePasarA('En Espera de Aprobación Gerencial') && ordenCompra()?.estado !== 'Stock Incompleto') {
                                    <p-button label="Enviar a Aprobación Gerencial" icon="pi pi-send" severity="success" (onClick)="transitionTo('En Espera de Aprobación Gerencial')"></p-button>
                                }
                                @if (puedePasarA('Enviada')) {
                                    <p-button label="Enviar al proveedor" icon="pi pi-send" (onClick)="transitionTo('Enviada')"></p-button>
                                }
                                @if (puedePasarA('Confirmada')) {
                                    <p-button label="Confirmar" icon="pi pi-thumbs-up" severity="success" (onClick)="transitionTo('Confirmada')"></p-button>
                                }
                                @if (puedeRegistrarPago()) {
                                    <p-button label="Registrar Pago (Contabilidad)" icon="pi pi-dollar" severity="success" (onClick)="openRegistroPagoDialog()"></p-button>
                                }
                                @if (puedePasarA('Pagada') && !puedeRegistrarPago()) {
                                    <p-button label="Registrar Pago" icon="pi pi-dollar" severity="success" (onClick)="openRegistroPagoDialog()"></p-button>
                                }
                                @if (puedePasarA('Despachada')) {
                                    <p-button label="Registrar Despacho" icon="pi pi-truck" severity="info" (onClick)="transitionTo('Despachada')"></p-button>
                                }
                                @if (puedeCancelar()) {
                                    <p-button label="Cancelar" icon="pi pi-times" severity="danger" [outlined]="true" (onClick)="openCancelDialog()"></p-button>
                                }
                                @if (puedeRecibir()) {
                                    <p-button label="Registrar Recepción" icon="pi pi-box" severity="info" (onClick)="openRecepcionModal()"></p-button>
                                }
                            </div>
                        </p-card>

                        <p-card header="Referencias vinculadas">
                            <div class="overflow-hidden rounded-xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
                                <p-table [value]="ordenCompra()?.detalles || ordenCompra()?.referencias || []" styleClass="p-datatable-sm p-datatable-striped" [responsiveLayout]="'scroll'">
                                    <ng-template pTemplate="header">
                                        <tr class="bg-surface-50 dark:bg-surface-800">
                                            <th style="width: 3rem"></th>
                                            <th class="text-color font-bold uppercase text-xs">Referencia</th>
                                            <th class="text-color font-bold uppercase text-xs">Descripción</th>
                                            <th class="text-center text-color font-bold uppercase text-xs">Cant</th>
                                            <th class="text-color font-bold uppercase text-xs">Recibido</th>
                                            <th class="text-color font-bold uppercase text-xs">Marca</th>
                                            <th class="text-color font-bold uppercase text-xs">Entrega</th>
                                            <th class="text-right text-color font-bold uppercase text-xs">Costo unitario</th>
                                            <th class="text-right text-color font-bold uppercase text-xs">Total</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-item>
                                        <tr class="dark:border-surface-700">
                                            <td>
                                                <span class="inline-block w-3 h-3 rounded-full" [ngClass]="getIndicadorEstadoClass(item)" [title]="getIndicadorEstadoTitle(item)"></span>
                                            </td>
                                            <td class="font-bold text-yellow-600 dark:text-yellow-500">
                                                <div class="flex items-center">
                                                    <span>{{ item.referencia?.referencia || item.referencia?.codigo_heavymarket || 'N/A' }}</span>
                                                    <i class="pi pi-question-circle text-[10px] text-muted-color ml-1 cursor-pointer" [title]="'Información de referencia'"></i>
                                                </div>
                                            </td>
                                            <td class="text-color-secondary">
                                                <div class="flex flex-col">
                                                    <div class="flex items-center">
                                                        <span>{{ item.referencia?.articulo?.definicion || item.referencia?.articulo_definicion || item.referencia?.descripcion || item.referencia?.comentario || 'N/A' }}</span>
                                                        <i class="pi pi-question-circle text-[10px] text-muted-color ml-1 cursor-pointer" [title]="'Definición del artículo'"></i>
                                                    </div>
                                                    @if (item.motivo_faltante) {
                                                        <span class="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1"> <i class="pi pi-info-circle mr-1"></i>Faltante: {{ item.motivo_faltante }} </span>
                                                    }
                                                </div>
                                            </td>
                                            <td class="text-center font-semibold text-color">
                                                @if (item.cantidad_original && item.cantidad < item.cantidad_original) {
                                                    <div class="flex flex-col items-center">
                                                        <span class="line-through text-xs text-muted-color">{{ item.cantidad_original }}</span>
                                                        <span class="text-amber-600 dark:text-amber-400 font-bold">{{ item.cantidad }}</span>
                                                    </div>
                                                } @else {
                                                    {{ item.cantidad }}
                                                }
                                            </td>
                                            <td class="min-w-[7rem]">
                                                <div class="flex items-center gap-2">
                                                    <p-progressBar [value]="progresoRecepcionItem(item)" [showValue]="false" styleClass="h-1.5 flex-1"></p-progressBar>
                                                    <span class="text-xs text-color-secondary whitespace-nowrap">{{ item.cantidad_recibida || 0 }}/{{ item.cantidad }}</span>
                                                </div>
                                            </td>
                                            <td class="text-color-secondary">
                                                {{ item.referencia?.marca?.nombre || 'N/A' }}
                                            </td>
                                            <td class="text-color-secondary">Inmediata</td>
                                            <td class="text-right text-color-secondary">
                                                {{ item.valor_unitario || 0 | currency: 'COP' : 'symbol' : '1.0-0' }}
                                            </td>
                                            <td class="text-right font-bold text-color">
                                                {{ item.valor_total || (item.valor_unitario || 0) * item.cantidad | currency: 'COP' : 'symbol' : '1.0-0' }}
                                            </td>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="footer">
                                        <tr class="dark:bg-surface-800/30">
                                            <td colspan="8" class="text-right border-0 pt-6"><span class="text-base font-bold uppercase text-muted-color">SubTotal</span></td>
                                            <td class="text-right border-0 pt-6">
                                                <div class="px-3 py-2 text-base font-bold text-color">
                                                    {{ calcularSubtotalReferencias() | currency: 'COP' : 'symbol' : '1.0-0' }}
                                                </div>
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </div>
                        </p-card>
                    </div>

                    <!-- Columna Derecha: Info Entrega / Vínculos -->
                    <div class="flex flex-col gap-6">
                        <p-card header="Logística y Entrega">
                            <div class="flex flex-col gap-4">
                                @if (ultimaRecepcion()?.observaciones; as observacionesRecepcion) {
                                    <div class="flex items-start gap-3 bg-surface-50 dark:bg-surface-800 p-3 rounded border border-surface-200 dark:border-surface-700">
                                        <i class="pi pi-info-circle text-primary text-lg mt-0.5"></i>
                                        <div class="flex flex-col">
                                            <span class="text-xs font-bold text-gray-500 uppercase">Novedades de la última recepción</span>
                                            <span class="text-sm text-color whitespace-pre-wrap break-words">{{ observacionesRecepcion }}</span>
                                        </div>
                                    </div>
                                }
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-map-marker text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">DIRECCIÓN</span>
                                        <span>{{ ordenCompra()?.direccion || 'No especificada' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-phone text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">TELÉFONO</span>
                                        <span>{{ ordenCompra()?.telefono || 'N/A' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-truck text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">GUÍA DE TRANSPORTE</span>
                                        <span class="font-mono">{{ ordenCompra()?.guia || 'Pendiente' }}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <i class="pi pi-calendar-clock text-primary text-xl"></i>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-gray-500">FECHAS DE CICLO</span>
                                        <span class="text-sm">Envío: {{ (ordenCompra()?.fecha_envio | date: 'short') || 'Pendiente' }}</span>
                                        <span class="text-sm">Confirmación: {{ (ordenCompra()?.fecha_confirmacion | date: 'short') || 'Pendiente' }}</span>
                                        <span class="text-sm">Despacho: {{ (ordenCompra()?.fecha_despacho | date: 'short') || 'Pendiente' }}</span>
                                        <span class="text-sm">Recepción: {{ (ordenCompra()?.fecha_recepcion | date: 'short') || 'Pendiente' }}</span>
                                    </div>
                                </div>

                                @if (ordenCompra()?.archivos_despacho && (ordenCompra()?.archivos_despacho?.length || 0) > 0) {
                                    <div class="pt-2 border-t border-surface-200 dark:border-surface-700 flex flex-col gap-2">
                                        <span class="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"> <i class="pi pi-images text-emerald-500"></i> Evidencias de Despacho ({{ ordenCompra()?.archivos_despacho?.length }}) </span>
                                        <div class="grid grid-cols-2 gap-2 mt-1">
                                            @for (archivo of ordenCompra()?.archivos_despacho; track archivo.id) {
                                                <div class="p-2 rounded bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col items-center gap-1 text-center">
                                                    @if (archivo.tipo === 'foto_paquete' && !archivo.mime?.includes('pdf')) {
                                                        <p-image [src]="getComprobanteUrl(archivo.ruta)" [preview]="true" alt="Evidencia de despacho" imageClass="w-16 h-16 object-cover rounded shadow-xs"></p-image>
                                                    } @else {
                                                        <div class="w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-950/40 rounded text-red-600 dark:text-red-400">
                                                            <i class="pi pi-file-pdf text-2xl"></i>
                                                        </div>
                                                    }
                                                    <span class="text-[11px] text-color truncate max-w-full font-medium" [title]="archivo.nombre_original">{{ archivo.nombre_original }}</span>
                                                    <a [href]="getComprobanteUrl(archivo.ruta)" target="_blank" rel="noopener noreferrer" class="text-[11px] text-primary hover:underline flex items-center gap-1">
                                                        <i class="pi pi-download text-[10px]"></i> Ver
                                                    </a>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }

                                @if (ultimaRecepcion()?.imagenes && (ultimaRecepcion()?.imagenes?.length || 0) > 0) {
                                    <div class="pt-2 border-t border-surface-200 dark:border-surface-700 flex flex-col gap-2">
                                        <span class="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"> <i class="pi pi-camera text-rose-500"></i> Evidencias de Recepción / Daño ({{ ultimaRecepcion()?.imagenes?.length }}) </span>
                                        <div class="grid grid-cols-2 gap-2 mt-1">
                                            @for (img of ultimaRecepcion()?.imagenes; track img.id) {
                                                <div class="p-2 rounded bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 flex flex-col items-center gap-1 text-center">
                                                    @if (!img.mime.includes('pdf')) {
                                                        <p-image [src]="getComprobanteUrl(img.ruta)" [preview]="true" alt="Evidencia de recepción" imageClass="w-16 h-16 object-cover rounded shadow-xs"></p-image>
                                                    } @else {
                                                        <div class="w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-950/40 rounded text-red-600 dark:text-red-400">
                                                            <i class="pi pi-file-pdf text-2xl"></i>
                                                        </div>
                                                    }
                                                    <span class="text-[11px] text-color truncate max-w-full font-medium" [title]="img.nombre_original">{{ img.nombre_original }}</span>
                                                    <a [href]="getComprobanteUrl(img.ruta)" target="_blank" rel="noopener noreferrer" class="text-[11px] text-primary hover:underline flex items-center gap-1">
                                                        <i class="pi pi-download text-[10px]"></i> Ver
                                                    </a>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </p-card>

                        <p-card header="Documentos Relacionados">
                            <div class="flex flex-col gap-3">
                                @if (ordenCompra()?.pedido_id) {
                                    <p-button [label]="'Pedido #' + ordenCompra()?.pedido_id" icon="pi pi-external-link" [text]="true" size="small" styleClass="p-0"></p-button>
                                }
                                @if (ordenCompra()?.cotizacion_id) {
                                    <p-button [label]="'Cotización #' + ordenCompra()?.cotizacion_id" icon="pi pi-external-link" [text]="true" size="small" styleClass="p-0"></p-button>
                                }
                                @if (!ordenCompra()?.pedido_id && !ordenCompra()?.cotizacion_id) {
                                    <p class="text-gray-500 text-sm italic">Sin documentos vinculados</p>
                                }
                            </div>
                        </p-card>
                    </div>
                </div>
            } @else {
                <div class="text-center py-12">
                    <i class="pi pi-exclamation-circle text-6xl text-gray-700 mb-4"></i>
                    <p class="text-xl text-gray-500">No se encontró la orden de compra solicitada</p>
                    <p-button label="Volver a la lista" icon="pi pi-arrow-left" (onClick)="onBack()" styleClass="mt-4"></p-button>
                </div>
            }
        </div>

        <p-dialog [visible]="cancelDialogVisible()" (visibleChange)="cancelDialogVisible.set($event)" header="Cancelar orden de compra" [modal]="true" [style]="{ width: '32rem' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <div class="field">
                    <label for="motivo_cancelacion" class="block text-sm font-medium mb-2">Motivo de cancelación <span class="text-red-500">*</span></label>
                    <textarea pTextarea id="motivo_cancelacion" [ngModel]="motivoCancelacion()" (ngModelChange)="motivoCancelacion.set($event)" rows="4" class="w-full" placeholder="Explique por qué se cancela la orden"></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Volver" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="cancelDialogVisible.set(false)" />
                    <p-button label="Confirmar cancelación" icon="pi pi-check" severity="danger" [disabled]="!motivoCancelacion().trim()" (onClick)="confirmCancel()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="envioRevisionDialogVisible()" (visibleChange)="envioRevisionDialogVisible.set($event)" header="Enviar a Revisión de Stock" [modal]="true" [style]="{ width: '36rem' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <p class="text-sm text-color-secondary m-0">Se enviará la orden de compra al portal del proveedor para confirmar disponibilidad de stock. Es obligatorio especificar las instrucciones de despacho.</p>
                <div class="field">
                    <label for="instrucciones_despacho" class="block text-sm font-medium mb-2">Instrucciones de despacho <span class="text-red-500">*</span></label>
                    <textarea
                        pTextarea
                        id="instrucciones_despacho"
                        [ngModel]="instruccionesDespacho()"
                        (ngModelChange)="instruccionesDespacho.set($event)"
                        rows="4"
                        class="w-full"
                        placeholder="Ejemplo: Entregar en bodega central, empaque rotulado con número de OC, horario de 8am a 4pm..."
                    ></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="envioRevisionDialogVisible.set(false)" />
                    <p-button label="Enviar al proveedor" icon="pi pi-send" severity="primary" [disabled]="!instruccionesDespacho().trim()" (onClick)="confirmEnvioRevision()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="devolucionGerenciaDialogVisible()" (visibleChange)="devolucionGerenciaDialogVisible.set($event)" header="Devolver Orden al Asesor" [modal]="true" [style]="{ width: '36rem' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <p class="text-sm text-color-secondary m-0">La orden de compra volverá a estado "Devuelta por Gerencia". Especifique detalladamente el motivo de rechazo u observaciones para que el asesor pueda corregirlo.</p>
                <div class="field">
                    <label for="motivo_rechazo_gerencia" class="block text-sm font-medium mb-2">Motivo de devolución / rechazo <span class="text-red-500">*</span></label>
                    <textarea
                        pTextarea
                        id="motivo_rechazo_gerencia"
                        [ngModel]="motivoRechazoGerencia()"
                        (ngModelChange)="motivoRechazoGerencia.set($event)"
                        rows="4"
                        class="w-full"
                        placeholder="Explique las razones del rechazo o las modificaciones necesarias..."
                    ></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="devolucionGerenciaDialogVisible.set(false)" />
                    <p-button label="Confirmar Devolución" icon="pi pi-replay" severity="warn" [disabled]="!motivoRechazoGerencia().trim()" (onClick)="confirmDevolucionGerencia()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog [visible]="registroPagoDialogVisible()" (visibleChange)="registroPagoDialogVisible.set($event)" header="Registrar Pago de Orden de Compra" [modal]="true" [style]="{ width: '36rem' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <p class="text-sm text-color-secondary m-0">Como responsable de Contabilidad, adjunte el comprobante de transferencia bancaria o soporte de pago. La orden pasará a <strong>Pagada / Lista para Despacho</strong>.</p>
                <div class="field">
                    <label for="referencia_pago" class="block text-sm font-medium mb-2">Referencia / Número de Transacción</label>
                    <input pInputText id="referencia_pago" [ngModel]="referenciaPago()" (ngModelChange)="referenciaPago.set($event)" placeholder="Ej: TRANSF-123456, Recibo de caja #..." class="w-full" />
                </div>
                <div class="field">
                    <label class="block text-sm font-medium mb-2">Comprobante de Pago (PDF, PNG, JPG) <span class="text-red-500">*</span></label>
                    <input
                        type="file"
                        (change)="onComprobanteFileSelected($event)"
                        accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                        class="w-full text-sm text-color file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-emphasis cursor-pointer"
                    />
                    @if (selectedComprobanteFile()) {
                        <div class="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <i class="pi pi-check-circle"></i>
                            <span>Archivo listo: {{ selectedComprobanteFile()?.name }} ({{ ((selectedComprobanteFile()?.size || 0) / 1024).toFixed(1) }} KB)</span>
                        </div>
                    }
                    @if (uploadingComprobante()) {
                        <p class="text-xs text-blue-500 mt-1 italic">Subiendo archivo...</p>
                    }
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="registroPagoDialogVisible.set(false)" />
                    <p-button label="Confirmar y Registrar Pago" icon="pi pi-check" severity="success" [disabled]="!selectedComprobanteFile() || uploadingComprobante()" (onClick)="confirmRegistroPago()" />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            [visible]="resolucionNovedadDialogVisible()"
            (visibleChange)="resolucionNovedadDialogVisible.set($event)"
            [header]="resolucionNovedadTipo() === 'reposicion' ? 'Resolver Novedad: Aprobar Reposición' : 'Resolver Novedad: Solicitar Nota Crédito'"
            [modal]="true"
            [style]="{ width: '38rem' }"
        >
            <div class="grid grid-cols-1 gap-4 pt-2">
                @if (resolucionNovedadTipo() === 'reposicion') {
                    <p class="text-sm text-color-secondary m-0">
                        Al aprobar la reposición, la orden de compra volverá al estado <strong>"Pagada / Lista para Despacho"</strong> para que el proveedor genere un nuevo despacho y número de guía por las piezas sustituidas.
                    </p>
                } @else {
                    <p class="text-sm text-color-secondary m-0">
                        Al solicitar Nota Crédito o Reembolso, la orden de compra transicionará al estado <strong>"Entregada / Cerrada"</strong> consolidando las unidades conformes efectivamente recibidas, y notificará al área de contabilidad.
                    </p>
                }
                <div class="field">
                    <label for="resolucion_novedad_comentario" class="block text-sm font-medium mb-2">Comentario de resolución del conflicto <span class="text-red-500">*</span></label>
                    <textarea
                        pTextarea
                        id="resolucion_novedad_comentario"
                        [ngModel]="resolucionNovedadComentario()"
                        (ngModelChange)="resolucionNovedadComentario.set($event)"
                        rows="4"
                        class="w-full"
                        placeholder="Describa el acuerdo llegado con el proveedor, transportadora o cliente..."
                    ></textarea>
                </div>
            </div>
            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="resolucionNovedadDialogVisible.set(false)" />
                    <p-button
                        [label]="resolucionNovedadTipo() === 'reposicion' ? 'Confirmar Reposición' : 'Confirmar Nota Crédito'"
                        [icon]="resolucionNovedadTipo() === 'reposicion' ? 'pi pi-refresh' : 'pi pi-file-excel'"
                        [severity]="resolucionNovedadTipo() === 'reposicion' ? 'warn' : 'danger'"
                        [disabled]="!resolucionNovedadComentario().trim()"
                        (onClick)="confirmResolucionNovedad()"
                    />
                </div>
            </ng-template>
        </p-dialog>

        <p-dialog
            [visible]="displayMaquinaDialog()"
            (visibleChange)="displayMaquinaDialog.set($event)"
            [modal]="true"
            [style]="{ width: '900px', 'max-width': '95vw' }"
            [showHeader]="true"
            [closable]="true"
            [dismissableMask]="true"
            appendTo="body"
            styleClass="machine-detail-modal"
        >
            <ng-template pTemplate="header">
                <div class="w-full text-center">
                    @if (selectedMaquina()) {
                        <div class="space-y-1">
                            <h2 class="text-2xl font-bold text-yellow-500 uppercase tracking-wider m-0">{{ maquinaModelo() }}</h2>
                            <p class="text-sm text-gray-600 dark:text-gray-300 m-0">Fabricante: {{ maquinaFabricante() }}</p>
                        </div>
                    }
                </div>
            </ng-template>
            @if (selectedMaquina(); as m) {
                <app-maquina-detail [maquina]="m"></app-maquina-detail>
            }
        </p-dialog>

        <p-dialog
            [visible]="displayTerceroDialog()"
            (visibleChange)="displayTerceroDialog.set($event)"
            [modal]="true"
            [style]="{ width: '1000px', 'max-width': '95vw' }"
            [showHeader]="true"
            [closable]="true"
            [dismissableMask]="true"
            appendTo="body"
            header="Detalle del Cliente"
        >
            @if (selectedTercero(); as t) {
                <app-tercero-form [terceroId]="t.id" [isViewMode]="true" [showLandingAccess]="false" (onCancel)="displayTerceroDialog.set(false)"></app-tercero-form>
            }
        </p-dialog>

        <app-recepcion-compra-modal [ordenCompra]="ordenCompra()" [visible]="recepcionModalVisible()" (cerrado)="onRecepcionModalCerrado()" (recepcionRegistrada)="onRecepcionRegistrada()" />
    `,
    styles: []
})
export class DetailComponent implements OnInit, OnDestroy {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly maquinaService = inject(MaquinaService);
    private readonly authService = inject(AuthService);
    private readonly ordenCompraService = inject(OrdenCompraService);
    private readonly destroy$ = new Subject<void>();

    ordenCompraId = signal<number>(0);
    loading = toSignal(this.store.select(OrdenesCompraSelectors.selectOrdenesCompraLoading), { initialValue: true });

    ordenCompra = signal<OrdenCompra | null>(null);
    cancelDialogVisible = signal(false);
    motivoCancelacion = signal('');
    envioRevisionDialogVisible = signal(false);
    instruccionesDespacho = signal('');
    devolucionGerenciaDialogVisible = signal(false);
    motivoRechazoGerencia = signal('');
    registroPagoDialogVisible = signal(false);
    referenciaPago = signal('');
    selectedComprobanteFile = signal<File | null>(null);
    uploadingComprobante = signal(false);
    resolucionNovedadDialogVisible = signal(false);
    resolucionNovedadTipo = signal<'reposicion' | 'nota_credito'>('reposicion');
    resolucionNovedadComentario = signal('');
    displayMaquinaDialog = signal(false);
    displayTerceroDialog = signal(false);
    recepcionModalVisible = signal(false);
    selectedMaquina = signal<MaquinaDetalle | null>(null);
    selectedTercero = signal<PedidoTercero | null>(null);
    ultimaRecepcion = signal<RecepcionCompra | null>(null);

    maquinaModelo = computed(() => this.selectedMaquina()?.modelo || 'Máquina');
    maquinaFabricante = computed(() => {
        const maquina = this.selectedMaquina();
        if (!maquina) return 'No registrado';
        const fabricante = 'fabricante' in maquina ? maquina.fabricante?.nombre : null;
        const marca = 'marca' in maquina ? maquina.marca : null;
        return fabricante || marca || 'No registrado';
    });

    diasEnTransito = computed(() => {
        const oc = this.ordenCompra();
        if (!oc?.fecha_despacho) return 0;
        const fechaDespacho = new Date(oc.fecha_despacho);
        const hoy = new Date();
        const diffTime = hoy.getTime() - fechaDespacho.getTime();
        return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    });

    tieneTransitoProlongado = computed(() => {
        const oc = this.ordenCompra();
        const estado = oc?.estado;
        const enTransito = estado === 'En Tránsito' || estado === 'Despachada';
        return enTransito && this.diasEnTransito() >= 5;
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenCompraId.set(+id);
            this.store.dispatch(loadOrdenCompraById({ id: +id }));

            this.store
                .select(OrdenesCompraSelectors.selectOrdenCompraById(+id))
                .pipe(takeUntil(this.destroy$))
                .subscribe((val) => {
                    if (val) this.ordenCompra.set(val);
                });

            this.loadUltimaRecepcion(+id);
        }
    }

    private loadUltimaRecepcion(ordenCompraId: number): void {
        this.ordenCompraService.listarRecepciones(ordenCompraId).subscribe({
            next: (recepciones) => this.ultimaRecepcion.set(recepciones[0] ?? null),
            error: () => this.ultimaRecepcion.set(null)
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onEdit(): void {
        this.router.navigate(['/app/ordenes-compra', this.ordenCompraId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/ordenes-compra']);
    }

    puedePasarA(destino: OrdenCompraEstado): boolean {
        return ordenCompraPuedeTransitar(this.ordenCompra()?.estado ?? null, destino);
    }

    puedeAprobarGerencia(): boolean {
        const tieneRol = this.authService.hasAnyRole(['Gerente Comercial', 'Administrador', 'super_admin']);
        return tieneRol && this.ordenCompra()?.estado === 'En Espera de Aprobación Gerencial';
    }

    puedeDevolverGerencia(): boolean {
        const tieneRol = this.authService.hasAnyRole(['Gerente Comercial', 'Administrador', 'super_admin']);
        return tieneRol && this.ordenCompra()?.estado === 'En Espera de Aprobación Gerencial';
    }

    puedeResolverNovedades(): boolean {
        const tieneRol = this.authService.hasAnyRole(['Asesor', 'Administrador', 'super_admin']);
        return tieneRol && this.ordenCompra()?.estado === 'Recepción con Novedades (Bloqueada)';
    }

    puedeRegistrarPago(): boolean {
        const tieneRol = this.authService.hasAnyRole(['Contabilidad', 'Administrador', 'super_admin']);
        const estado = this.ordenCompra()?.estado;
        return tieneRol && (estado === 'Pendiente de Pago' || estado === 'Confirmada');
    }

    puedeCancelar(): boolean {
        return ordenCompraPuedeCancelar(this.ordenCompra()?.estado ?? null);
    }

    puedeRecibir(): boolean {
        const tieneRol = this.authService.hasAnyRole(['Logistica', 'Administrador', 'super_admin']);

        return tieneRol && ordenCompraPuedeRecibir(this.ordenCompra()?.estado ?? null);
    }

    openRecepcionModal(): void {
        this.recepcionModalVisible.set(true);
    }

    onRecepcionModalCerrado(): void {
        this.recepcionModalVisible.set(false);
    }

    onRecepcionRegistrada(): void {
        this.recepcionModalVisible.set(false);
        this.store.dispatch(loadOrdenCompraById({ id: this.ordenCompraId() }));
        this.loadUltimaRecepcion(this.ordenCompraId());
    }

    getRecepcionSeverity(estado: EstadoRecepcion): 'success' | 'info' | 'warn' {
        return estadoRecepcionSeverity(estado);
    }

    getRecepcionLabel(estado: EstadoRecepcion): string {
        return estadoRecepcionLabel(estado);
    }

    progresoRecepcionItem(item: OrdenCompraReferencia): number {
        return ordenCompraProgresoItem(item);
    }

    transitionTo(estadoDestino: OrdenCompraEstado): void {
        this.store.dispatch(
            transitionOrdenCompra({
                id: this.ordenCompraId(),
                data: { estado_destino: estadoDestino }
            })
        );
    }

    openCancelDialog(): void {
        this.motivoCancelacion.set('');
        this.cancelDialogVisible.set(true);
    }

    confirmCancel(): void {
        const estadoActual = this.ordenCompra()?.estado;
        const esPostPago = estadoActual === 'Pagada' || estadoActual === 'Pagada / Lista para Despacho';
        const estadoDestino: OrdenCompraEstado = esPostPago ? 'Cancelada - Reembolso Pendiente' : 'Cancelada';

        const data: TransitionOrdenCompraDto = {
            estado_destino: estadoDestino,
            motivo_cancelacion: this.motivoCancelacion().trim(),
            motivo_reembolso: esPostPago ? this.motivoCancelacion().trim() : undefined,
            aprobacion_admin: estadoActual === 'Confirmada' || esPostPago ? true : undefined
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.cancelDialogVisible.set(false);
    }

    openEnvioRevisionDialog(): void {
        this.instruccionesDespacho.set(this.ordenCompra()?.instrucciones_despacho || '');
        this.envioRevisionDialogVisible.set(true);
    }

    confirmEnvioRevision(): void {
        const data: TransitionOrdenCompraDto = {
            estado_destino: 'Pendiente de Revisión de Stock',
            instrucciones_despacho: this.instruccionesDespacho().trim()
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.envioRevisionDialogVisible.set(false);
    }

    openDevolucionGerenciaDialog(): void {
        this.motivoRechazoGerencia.set('');
        this.devolucionGerenciaDialogVisible.set(true);
    }

    confirmDevolucionGerencia(): void {
        const data: TransitionOrdenCompraDto = {
            estado_destino: 'Devuelta por Gerencia',
            motivo_rechazo_gerencia: this.motivoRechazoGerencia().trim()
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.devolucionGerenciaDialogVisible.set(false);
    }

    openResolucionNovedadDialog(tipo: 'reposicion' | 'nota_credito'): void {
        this.resolucionNovedadTipo.set(tipo);
        this.resolucionNovedadComentario.set('');
        this.resolucionNovedadDialogVisible.set(true);
    }

    confirmResolucionNovedad(): void {
        const tipo = this.resolucionNovedadTipo();
        const estadoDestino: OrdenCompraEstado = tipo === 'reposicion' ? 'Pagada / Lista para Despacho' : 'Entregada / Cerrada';

        const data: TransitionOrdenCompraDto = {
            estado_destino: estadoDestino,
            resolucion_novedad_tipo: tipo,
            resolucion_novedad_comentario: this.resolucionNovedadComentario().trim()
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.resolucionNovedadDialogVisible.set(false);
    }

    openRegistroPagoDialog(): void {
        this.referenciaPago.set('');
        this.selectedComprobanteFile.set(null);
        this.uploadingComprobante.set(false);
        this.registroPagoDialogVisible.set(true);
    }

    onComprobanteFileSelected(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target?.files?.[0] || null;
        this.selectedComprobanteFile.set(file);
    }

    confirmRegistroPago(): void {
        const file = this.selectedComprobanteFile();
        if (!file) return;

        this.uploadingComprobante.set(true);
        this.ordenCompraService.uploadComprobantePago(this.ordenCompraId(), file).subscribe({
            next: (uploadRes) => {
                this.uploadingComprobante.set(false);
                const data: TransitionOrdenCompraDto = {
                    estado_destino: 'Pagada / Lista para Despacho',
                    comprobante_pago_ruta: uploadRes.file_name,
                    referencia_pago: this.referenciaPago().trim() || undefined
                };
                this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
                this.registroPagoDialogVisible.set(false);
            },
            error: () => {
                this.uploadingComprobante.set(false);
            }
        });
    }

    getComprobanteUrl(ruta: string): string {
        if (!ruta) return '';
        if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
            return ruta;
        }
        return `/storage/${ruta.replace(/^\/+/, '')}`;
    }

    viewMaquina(maquina: PedidoMaquina | null | undefined): void {
        if (!maquina) return;
        this.maquinaService.getById(maquina.id).subscribe({
            next: (response) => {
                this.selectedMaquina.set(response.data);
                this.displayMaquinaDialog.set(true);
            },
            error: () => {
                this.selectedMaquina.set(maquina);
                this.displayMaquinaDialog.set(true);
            }
        });
    }

    viewTercero(tercero: PedidoTercero | null | undefined): void {
        if (!tercero) return;
        this.selectedTercero.set(tercero);
        this.displayTerceroDialog.set(true);
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Confirmada':
            case 'Pagada':
            case 'Recibida':
            case 'Entregada / Cerrada':
                return 'success';
            case 'Enviada':
            case 'Despachada':
            case 'En Tránsito':
            case 'En Espera de Aprobación Gerencial':
                return 'info';
            case 'Generada':
            case 'Pendiente de Revisión de Stock':
            case 'Stock Incompleto':
            case 'Pendiente de Pago':
            case 'Pagada / Lista para Despacho':
            case 'Recibida parcialmente':
                return 'warn';
            case 'Devuelta por Gerencia':
            case 'Recepción con Novedades (Bloqueada)':
            case 'Cancelada - Reembolso Pendiente':
            case 'Cancelada':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getPedidoEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Aprobado':
            case 'Entregado':
                return 'success';
            case 'En_Analisis':
            case 'En_Costeo':
            case 'Enviado':
                return 'info';
            case 'Nuevo':
            case 'Cotizado':
                return 'warn';
            case 'Rechazado':
            case 'Cancelado':
                return 'danger';
            default:
                return 'secondary';
        }
    }

    getIndicadorEstadoClass(item: OrdenCompraReferencia): string {
        const cant = item.cantidad || 0;
        const recibida = item.cantidad_recibida || 0;

        if (recibida >= cant && cant > 0) {
            return 'bg-green-500';
        }
        if (recibida > 0 && recibida < cant) {
            return 'bg-orange-500';
        }

        const estadoOC = this.ordenCompra()?.estado;
        if (estadoOC === 'Cancelada') {
            return 'bg-red-500';
        }

        return 'bg-yellow-500';
    }

    getIndicadorEstadoTitle(item: OrdenCompraReferencia): string {
        const cant = item.cantidad || 0;
        const recibida = item.cantidad_recibida || 0;

        if (recibida >= cant && cant > 0) {
            return 'Llegó todo';
        }
        if (recibida > 0 && recibida < cant) {
            return 'Llegó parcialmente';
        }

        const estadoOC = this.ordenCompra()?.estado;
        if (estadoOC === 'Cancelada') {
            return 'No llegó';
        }

        return 'Pendiente de recibido - En tránsito';
    }

    calcularSubtotalReferencias(): number {
        const referencias = this.ordenCompra()?.detalles || this.ordenCompra()?.referencias || [];
        return referencias.reduce((acc, item) => {
            const total = item.valor_total ?? (item.valor_unitario || 0) * (item.cantidad || 0);
            return acc + Number(total || 0);
        }, 0);
    }
}
