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
import { loadOrdenCompraById, transitionOrdenCompra } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import * as OrdenesCompraSelectors from '../../../store/ordenes-compra/selectors/ordenes-compra.selectors';
import { OrdenCompra, OrdenCompraEstado, OrdenCompraPedido, OrdenCompraReferencia, EstadoRecepcion } from '../../../core/models/orden-compra.model';
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
    Generada: ['Enviada', 'Cancelada'],
    Enviada: ['Confirmada', 'Cancelada'],
    Confirmada: ['Pagada', 'Cancelada'],
    Pagada: ['Despachada', 'Cancelada'],
    Despachada: ['Recibida parcialmente', 'Recibida', 'Cancelada'],
    'Recibida parcialmente': ['Recibida'],
    Recibida: [],
    Cancelada: []
};

export function ordenCompraPuedeTransitar(origen: OrdenCompraEstado | null, destino: OrdenCompraEstado): boolean {
    if (!origen) return false;
    // Las OC previas a la migración de estados pueden traer valores fuera del ciclo vigente.
    return (ORDEN_COMPRA_TRANSICIONES[origen] ?? []).includes(destino);
}

export function ordenCompraPuedeRecibir(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Enviada' || estado === 'Confirmada' || estado === 'Despachada' || estado === 'Recibida parcialmente';
}

export function ordenCompraPuedeCancelar(estado: OrdenCompraEstado | null): boolean {
    return estado === 'Generada' || estado === 'Enviada' || estado === 'Confirmada' || estado === 'Pagada' || estado === 'Despachada';
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
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, TableModule, TooltipModule, DialogModule, TextareaModule, InputTextModule, ProgressBarModule, TerceroFormComponent, MaquinaDetailComponent, RecepcionCompraModalComponent],
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
                                    <span class="text-blue-500 font-semibold">Email:</span> <span class="text-color truncate max-w-[200px]" [title]="ordenCompra()?.pedido?.contacto?.email || ordenCompra()?.pedido?.tercero?.email">{{ ordenCompra()?.pedido?.contacto?.email || ordenCompra()?.pedido?.tercero?.email || '---' }}</span>
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
                            </div>
                        </p-card>

                        <p-card header="Acciones de estado">
                            <div class="flex flex-wrap gap-2">
                                @if (puedePasarA('Enviada')) {
                                    <p-button label="Enviar al proveedor" icon="pi pi-send" (onClick)="transitionTo('Enviada')"></p-button>
                                }
                                @if (puedePasarA('Confirmada')) {
                                    <p-button label="Confirmar" icon="pi pi-thumbs-up" severity="success" (onClick)="transitionTo('Confirmada')"></p-button>
                                }
                                @if (puedePasarA('Pagada')) {
                                    <p-button label="Registrar Pago" icon="pi pi-dollar" severity="success" (onClick)="transitionTo('Pagada')"></p-button>
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
                                                <div class="flex items-center">
                                                    <span>{{ item.referencia?.articulo?.definicion || item.referencia?.articulo_definicion || item.referencia?.descripcion || item.referencia?.comentario || 'N/A' }}</span>
                                                    <i class="pi pi-question-circle text-[10px] text-muted-color ml-1 cursor-pointer" [title]="'Definición del artículo'"></i>
                                                </div>
                                            </td>
                                            <td class="text-center font-semibold text-color">{{ item.cantidad }}</td>
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

        <p-dialog [visible]="displayMaquinaDialog()" (visibleChange)="displayMaquinaDialog.set($event)" [modal]="true" [style]="{ width: '900px', 'max-width': '95vw' }" [showHeader]="true" [closable]="true" [dismissableMask]="true" appendTo="body" styleClass="machine-detail-modal">
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

        <p-dialog [visible]="displayTerceroDialog()" (visibleChange)="displayTerceroDialog.set($event)" [modal]="true" [style]="{ width: '1000px', 'max-width': '95vw' }" [showHeader]="true" [closable]="true" [dismissableMask]="true" appendTo="body" header="Detalle del Cliente">
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
        const data = {
            estado_destino: 'Cancelada' as OrdenCompraEstado,
            motivo_cancelacion: this.motivoCancelacion(),
            aprobacion_admin: this.ordenCompra()?.estado === 'Confirmada' ? true : undefined
        };

        this.store.dispatch(transitionOrdenCompra({ id: this.ordenCompraId(), data }));
        this.cancelDialogVisible.set(false);
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
                return 'success';
            case 'Enviada':
            case 'Despachada':
                return 'info';
            case 'Generada':
            case 'Recibida parcialmente':
                return 'warn';
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
