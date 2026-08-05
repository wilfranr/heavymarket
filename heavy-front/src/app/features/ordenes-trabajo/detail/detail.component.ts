import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { loadOrdenTrabajoById, registrarRecepcionCompra } from '../../../store/ordenes-trabajo/actions/ordenes-trabajo.actions';
import * as OrdenesTrabajoSelectors from '../../../store/ordenes-trabajo/selectors/ordenes-trabajo.selectors';
import { OrdenTrabajo } from '../../../core/models/orden-trabajo.model';
import { OrdenCompra, OrdenCompraReferencia } from '../../../core/models/orden-compra.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { OrdenCompraService } from '../../../core/services/orden-compra.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { TerceroFormComponent } from '../../../shared/components/tercero-form/tercero-form.component';
import { MaquinaDetailComponent } from '../../../shared/components/maquina-detail/maquina-detail.component';

export interface RecepcionLineaForm {
    orden_compra_detalle_id: number;
    referencia: string;
    cantidad_ordenada: number;
    cantidad_recibida: number;
    cantidad_conforme: number;
    cantidad_rechazada: number;
    motivo_rechazo: string | null;
}

export function recepcionCompraLineaValida(linea: RecepcionLineaForm): boolean {
    const sumaCondiciones = linea.cantidad_conforme + linea.cantidad_rechazada;
    const motivoValido = linea.cantidad_rechazada <= 0 || (linea.motivo_rechazo ?? '').trim().length > 0;

    return linea.cantidad_recibida > 0 && linea.cantidad_recibida === sumaCondiciones && linea.cantidad_recibida <= linea.cantidad_ordenada && motivoValido;
}

/**
 * Componente de detalle de orden de trabajo
 */
@Component({
    selector: 'app-orden-trabajo-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, TableModule, DialogModule, InputNumberModule, InputTextModule, SelectModule, TextareaModule, TerceroFormComponent, MaquinaDetailComponent],
    template: `
        <div class="px-4 py-8 md:px-6 lg:px-8">
            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando orden de trabajo...</p>
                </div>
            } @else if (ordenTrabajo()) {
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <div class="flex items-center gap-3">
                            <h1 class="text-3xl font-bold text-color m-0">Orden de Trabajo OT-{{ ordenTrabajo()?.id }}</h1>
                            @if (ordenTrabajo()?.estado) {
                                <p-tag [value]="ordenTrabajo()!.estado || 'N/A'" [severity]="getEstadoSeverity(ordenTrabajo()!.estado || 'Pendiente')" styleClass="text-sm px-3 py-1 rounded-full"></p-tag>
                            }
                        </div>
                        <p class="text-muted-color mt-2 mb-0 flex flex-wrap items-center gap-2">
                            <span
                                >Ingresado el {{ ordenTrabajo()?.fecha_ingreso | date: 'dd/MM/yyyy HH:mm' }}
                                @if (ordenTrabajo()?.user) {
                                    por {{ ordenTrabajo()?.user?.name }}
                                }
                            </span>
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"></p-button>
                        @if (puedeRegistrarRecepcion()) {
                            <p-button label="Registrar recepción" icon="pi pi-box" (onClick)="openRecepcionDialog()"></p-button>
                        }
                        <p-button label="Descargar PDF" icon="pi pi-file-pdf" severity="danger" [outlined]="true" (onClick)="downloadPDF()"></p-button>
                        <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"></p-button>
                    </div>
                </div>

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
                            <!--
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Documento:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.origen || 'Análisis' }}</span>
                            </div>
                            -->
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Pedido:</span> <span class="text-color">{{ ordenTrabajo()?.pedido_id || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Creación:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.created_at | date: 'MMMM d, y' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Actualización:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.updated_at | date: 'MMMM d, y' }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-blue-500 font-semibold">Usuario:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.user?.name || '---' }}</span>
                            </div>
                            <div class="flex items-center gap-2"><span class="text-blue-500 font-semibold">Cargo:</span> <span class="text-color">Asesor</span></div>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="text-blue-500 font-semibold">Estado:</span>
                                <p-tag [value]="ordenTrabajo()?.pedido?.estado || 'N/A'" [severity]="getPedidoEstadoSeverity(ordenTrabajo()?.pedido?.estado || '')" styleClass="text-xs px-2.5 py-0.5 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <!-- Tarjeta Información de la máquina -->
                    <div class="figma-card p-0 overflow-hidden flex flex-col h-[290px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-lg">
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-color text-base pl-2">Información de la máquina</span>
                            <div class="flex items-center gap-1 pr-2">
                                @if (ordenTrabajo()?.pedido?.maquina) {
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewMaquina(ordenTrabajo()?.pedido?.maquina)" pTooltip="Ver detalle de máquina" styleClass="w-8 h-8"></p-button>
                                }
                                <i class="pi pi-cog text-muted-color text-xl p-2"></i>
                            </div>
                        </div>
                        <div class="p-4 space-y-3 flex-1 text-sm bg-surface-0 dark:bg-surface-900">
                            @if (ordenTrabajo()?.pedido?.maquina) {
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Máquina:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.maquina?.tipo || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Fabricante:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.maquina?.marca || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Modelo:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.maquina?.modelo || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Serie:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.maquina?.serie || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">ID adicional:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.maquina?.id_interno || '----' }}</span>
                                </div>
                            } @else {
                                <p class="text-muted-color italic m-0">Sin máquina asociada</p>
                            }
                        </div>
                    </div>

                    <!-- Tarjeta Información de tercero -->
                    <div class="figma-card p-0 overflow-hidden flex flex-col h-[290px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm rounded-lg">
                        <div class="p-3 bg-surface-50 dark:bg-surface-800 flex justify-between items-center border-b border-surface-200 dark:border-surface-700">
                            <span class="font-bold text-color text-base pl-2">Información de tercero</span>
                            <div class="flex items-center gap-1 pr-2">
                                @if (ordenTrabajo()?.pedido?.tercero) {
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewTercero(ordenTrabajo()?.pedido?.tercero)" pTooltip="Ver detalle de cliente" styleClass="w-8 h-8"></p-button>
                                }
                                <i class="pi pi-envelope text-muted-color text-xl p-2"></i>
                                <i class="pi pi-whatsapp text-muted-color text-xl p-2"></i>
                            </div>
                        </div>
                        <div class="p-4 space-y-2 flex-1 text-sm bg-surface-0 dark:bg-surface-900">
                            @if (ordenTrabajo()?.pedido?.tercero) {
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Tipo:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.tercero?.tipo || 'Cliente' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Razón social:</span> <span class="text-color truncate max-w-[200px]" [title]="ordenTrabajo()?.pedido?.tercero?.nombre">{{ ordenTrabajo()?.pedido?.tercero?.nombre }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Tipo de documento:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.tercero?.tipo_documento || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Número de documento:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.tercero?.numero_documento || '---' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Ciudad:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.tercero?.city?.nombre || ordenTrabajo()?.pedido?.tercero?.city?.name || '--' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Contacto:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.contacto?.nombre || '--' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Cargo:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.contacto?.cargo || '--' }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-blue-500 font-semibold">Teléfono:</span> <span class="text-color">{{ ordenTrabajo()?.pedido?.tercero?.telefono || '---' }}</span>
                                </div>
                            } @else {
                                <p class="text-muted-color italic m-0">No hay información del cliente asociada.</p>
                            }
                        </div>
                    </div>
                </div>

                <!-- Fila Inferior: Referencias y Logística -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <!-- Columna Izquierda (Principal - Referencias) -->
                    <div class="xl:col-span-2 flex flex-col gap-6">
                        @if (ordenTrabajo()?.referencias && ordenTrabajo()!.referencias!.length > 0) {
                            <div class="card shadow-sm border-round p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                                <h3 class="text-xl font-bold mb-4 text-color"><i class="pi pi-list mr-2 text-primary"></i>Referencias</h3>
                                <div class="overflow-hidden rounded-xl bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-sm">
                                    <p-table [value]="ordenTrabajo()!.referencias!" styleClass="p-datatable-sm p-datatable-striped" [responsiveLayout]="'scroll'">
                                        <ng-template pTemplate="header">
                                            <tr class="bg-surface-50 dark:bg-surface-800">
                                                <th style="width: 3rem"></th>
                                                <th class="text-color font-bold uppercase text-xs">Referencia</th>
                                                <th class="text-color font-bold uppercase text-xs">Descripción</th>
                                                <th class="text-center text-color font-bold uppercase text-xs">Cant</th>
                                                <th class="text-color font-bold uppercase text-xs">Marca</th>
                                                <th class="text-color font-bold uppercase text-xs">Entrega</th>
                                                <th class="text-right text-color font-bold uppercase text-xs">Precio</th>
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
                                                        <span>{{ item.referencia?.referencia || item.pedido_referencia?.referencia?.referencia || 'N/A' }}</span>
                                                        <i class="pi pi-question-circle text-[10px] text-muted-color ml-1 cursor-pointer" [title]="'Información de referencia'"></i>
                                                    </div>
                                                </td>
                                                <td class="text-color-secondary">
                                                    <div class="flex items-center">
                                                        <span>{{ item.pedido_referencia?.definicion || item.referencia?.descripcion || 'N/A' }}</span>
                                                        <i class="pi pi-question-circle text-[10px] text-muted-color ml-1 cursor-pointer" [title]="'Definición del artículo'"></i>
                                                    </div>
                                                </td>
                                                <td class="text-center font-semibold text-color">{{ item.cantidad }}</td>
                                                <td class="text-color-secondary">
                                                    {{ getProveedorAprobado(item)?.marca?.nombre || item.pedido_referencia?.marca?.nombre || 'N/A' }}
                                                </td>
                                                <td class="text-color-secondary">
                                                    {{ getProveedorAprobado(item)?.entrega_label || 'Inmediata' }}
                                                </td>
                                                <td class="text-right text-color-secondary">
                                                    {{ getProveedorAprobado(item)?.valor_unidad || 0 | currency: 'COP' : 'symbol' : '1.0-0' }}
                                                </td>
                                                <td class="text-right font-bold text-color">
                                                    {{ ((getProveedorAprobado(item)?.valor_unidad || 0) * item.cantidad) | currency: 'COP' : 'symbol' : '1.0-0' }}
                                                </td>
                                            </tr>
                                        </ng-template>
                                        <ng-template pTemplate="footer">
                                            <tr class="dark:bg-surface-800/30">
                                                <td colspan="7" class="text-right border-0 pt-6"><span class="text-base font-bold uppercase text-muted-color">SubTotal</span></td>
                                                <td class="text-right border-0 pt-6">
                                                    <div class="px-3 py-2 text-base font-bold text-color">
                                                        {{ calcularSubtotal() | currency: 'COP' : 'symbol' : '1.0-0' }}
                                                    </div>
                                                </td>
                                            </tr>
                                        </ng-template>
                                    </p-table>
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Columna Derecha (Lateral - Logística y Despacho) -->
                    <div class="flex flex-col gap-6">
                        <div class="card shadow-sm border-round p-4 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700">
                            <h3 class="text-xl font-bold mb-4 text-color"><i class="pi pi-map mr-2 text-primary"></i>Detalles de Despacho y Logística</h3>
                            <div class="grid grid-cols-1 gap-4">
                                <div>
                                    <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Transportadora</span>
                                    <span class="font-medium text-color block">{{ ordenTrabajo()?.transportadora?.nombre || 'N/A' }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Número de Guía</span>
                                    <span class="font-medium text-color block">{{ ordenTrabajo()?.guia || 'N/A' }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Fecha de Ingreso</span>
                                    <span class="font-medium text-color block">{{ ordenTrabajo()?.fecha_ingreso ? (ordenTrabajo()!.fecha_ingreso | date: 'dd/MM/yyyy HH:mm') : 'N/A' }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Fecha de Entrega Prometida</span>
                                    <span class="font-medium text-color block">{{ ordenTrabajo()?.fecha_entrega ? (ordenTrabajo()!.fecha_entrega | date: 'dd/MM/yyyy HH:mm') : 'N/A' }}</span>
                                </div>
                                <div>
                                    <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Teléfono de Contacto</span>
                                    <span class="font-medium text-color block">{{ ordenTrabajo()?.telefono || 'N/A' }}</span>
                                </div>
                                @if (ordenTrabajo()?.direccion?.direccion) {
                                    <div>
                                        <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Dirección de Despacho</span>
                                        <span class="font-medium text-color block">{{ ordenTrabajo()?.direccion?.direccion }}</span>
                                    </div>
                                }
                                @if (ordenTrabajo()?.observaciones) {
                                    <div>
                                        <span class="text-muted-color block text-xs uppercase tracking-wider mb-1">Observaciones</span>
                                        <p class="text-color m-0 whitespace-pre-wrap break-words bg-surface-50 dark:bg-surface-800 p-3 rounded border border-surface-200 dark:border-surface-700">{{ ordenTrabajo()!.observaciones }}</p>
                                    </div>
                                }
                                @if (ordenTrabajo()?.motivo_cancelacion) {
                                    <div>
                                        <span class="text-muted-color block text-xs uppercase tracking-wider mb-1 text-red-500">Motivo de Cancelación</span>
                                        <p class="text-red-500 m-0 whitespace-pre-wrap break-words bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-800/40">{{ ordenTrabajo()!.motivo_cancelacion }}</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            } @else {
                <div class="flex flex-col items-center justify-center min-h-[50vh] bg-surface-0 dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-sm p-8 text-center">
                    <div class="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mb-6">
                        <i class="pi pi-exclamation-triangle text-4xl"></i>
                    </div>
                    <h2 class="text-3xl font-bold mb-3 text-color">Orden de trabajo no encontrada</h2>
                    <p class="text-muted-color text-lg mb-8 max-w-md">La orden de trabajo que buscas no existe, no tienes permisos para verla, o ha sido eliminada.</p>
                    <p-button label="Volver al Listado de Órdenes" icon="pi pi-arrow-left" size="large" (onClick)="onBack()"></p-button>
                </div>
            }
        </div>

        <p-dialog header="Registrar recepción de compra" [modal]="true" [visible]="recepcionDialogVisible()" (visibleChange)="recepcionDialogVisible.set($event)" [style]="{ width: 'min(960px, 95vw)' }">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <div class="field">
                    <label for="orden-compra-recepcion" class="block text-sm font-medium mb-2">Orden de compra <span class="text-red-500">*</span></label>
                    <p-select
                        inputId="orden-compra-recepcion"
                        [options]="ordenCompraOptions()"
                        [ngModel]="selectedOrdenCompraId()"
                        (ngModelChange)="seleccionarOrdenCompra($event)"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccione OC relacionada"
                        styleClass="w-full"
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="fecha-recepcion" class="block text-sm font-medium mb-2">Fecha recepción <span class="text-red-500">*</span></label>
                        <input pInputText id="fecha-recepcion" type="datetime-local" [ngModel]="fechaRecepcion()" (ngModelChange)="fechaRecepcion.set($event)" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="numero-remision" class="block text-sm font-medium mb-2">Número remisión</label>
                        <input pInputText id="numero-remision" [ngModel]="numeroRemision()" (ngModelChange)="numeroRemision.set($event)" class="w-full" />
                    </div>
                </div>

                <div class="field">
                    <label for="observaciones-recepcion" class="block text-sm font-medium mb-2">Observaciones</label>
                    <textarea pTextarea id="observaciones-recepcion" [ngModel]="observacionesRecepcion()" (ngModelChange)="observacionesRecepcion.set($event)" rows="3" class="w-full"></textarea>
                </div>

                <p-table [value]="recepcionLineas()" styleClass="p-datatable-sm">
                    <ng-template pTemplate="header">
                        <tr>
                            <th>Referencia</th>
                            <th>Ordenada</th>
                            <th>Recibida</th>
                            <th>Conforme</th>
                            <th>Rechazada</th>
                            <th>Motivo rechazo</th>
                        </tr>
                    </ng-template>
                    <ng-template pTemplate="body" let-linea>
                        <tr>
                            <td>{{ linea.referencia }}</td>
                            <td>{{ linea.cantidad_ordenada }}</td>
                            <td>
                                <p-inputNumber [ngModel]="linea.cantidad_recibida" (ngModelChange)="actualizarLinea(linea.orden_compra_detalle_id, 'cantidad_recibida', $event)" [min]="0" [max]="linea.cantidad_ordenada" inputStyleClass="w-24" />
                            </td>
                            <td>
                                <p-inputNumber [ngModel]="linea.cantidad_conforme" (ngModelChange)="actualizarLinea(linea.orden_compra_detalle_id, 'cantidad_conforme', $event)" [min]="0" [max]="linea.cantidad_ordenada" inputStyleClass="w-24" />
                            </td>
                            <td>
                                <p-inputNumber [ngModel]="linea.cantidad_rechazada" (ngModelChange)="actualizarLinea(linea.orden_compra_detalle_id, 'cantidad_rechazada', $event)" [min]="0" [max]="linea.cantidad_ordenada" inputStyleClass="w-24" />
                            </td>
                            <td>
                                <input pInputText [ngModel]="linea.motivo_rechazo" (ngModelChange)="actualizarMotivoRechazo(linea.orden_compra_detalle_id, $event)" [disabled]="linea.cantidad_rechazada <= 0" class="w-full" />
                            </td>
                        </tr>
                    </ng-template>
                </p-table>

                @if (!recepcionValida()) {
                    <div class="text-sm text-red-500">Verifique que cada línea tenga cantidad recibida mayor a cero, que recibida sea igual a conforme más rechazada y que todo rechazo tenga motivo.</div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" (onClick)="recepcionDialogVisible.set(false)" />
                    <p-button label="Guardar recepción" icon="pi pi-check" [disabled]="!recepcionValida()" (onClick)="guardarRecepcion()" />
                </div>
            </ng-template>
        </p-dialog>

        <!-- Modales de detalle -->
        <p-dialog [(visible)]="displayMaquinaDialog" [modal]="true" [style]="{ width: '900px', 'max-width': '95vw' }" [showHeader]="true" [closable]="true" [dismissableMask]="true" appendTo="body" styleClass="machine-detail-modal">
            <ng-template pTemplate="header">
                <div class="w-full text-center">
                    @if (selectedMaquina(); as m) {
                        <div class="space-y-1">
                            <h2 class="text-2xl font-bold text-yellow-500 uppercase tracking-wider m-0">{{ m.modelo }}</h2>
                            <p class="text-sm text-gray-600 dark:text-gray-300 m-0">Fabricante: {{ m.marca || m.fabricante?.nombre || 'No registrado' }}</p>
                        </div>
                    }
                </div>
            </ng-template>
            @if (selectedMaquina(); as m) {
                <app-maquina-detail [maquina]="m"></app-maquina-detail>
            }
        </p-dialog>

        <p-dialog [(visible)]="displayTerceroDialog" [modal]="true" [style]="{ width: '1000px', 'max-width': '95vw' }" [showHeader]="true" [closable]="true" [dismissableMask]="true" appendTo="body" header="Detalle del Cliente">
            @if (selectedTercero(); as t) {
                <app-tercero-form [terceroId]="t.id" [isViewMode]="true" [showLandingAccess]="false" (onCancel)="displayTerceroDialog.set(false)"> </app-tercero-form>
            }
        </p-dialog>
    `,
    styles: []
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly ordenCompraService = inject(OrdenCompraService);
    private readonly maquinaService = inject(MaquinaService);

    ordenTrabajo = signal<OrdenTrabajo | null>(null);
    ordenTrabajoId = signal<number>(0);
    loading = signal(true);
    ordenesCompra = signal<OrdenCompra[]>([]);
    recepcionDialogVisible = signal(false);
    selectedOrdenCompraId = signal<number | null>(null);
    fechaRecepcion = signal(this.toDatetimeLocal(new Date()));
    numeroRemision = signal<string | null>(null);
    observacionesRecepcion = signal<string | null>(null);
    recepcionLineas = signal<RecepcionLineaForm[]>([]);

    displayMaquinaDialog = signal<boolean>(false);
    displayTerceroDialog = signal<boolean>(false);
    selectedMaquina = signal<any>(null);
    selectedTercero = signal<any>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.ordenTrabajoId.set(+id);
            this.loadOrdenTrabajo(+id);
        }
    }

    private loadOrdenTrabajo(id: number): void {
        this.store.dispatch(loadOrdenTrabajoById({ id }));

        this.store.select(OrdenesTrabajoSelectors.selectOrdenTrabajoById(id)).subscribe((ordenTrabajo) => {
            if (ordenTrabajo) {
                this.ordenTrabajo.set(ordenTrabajo);
                this.loading.set(false);
                this.loadOrdenesCompraRelacionadas(ordenTrabajo);
            }
        });
    }

    private loadOrdenesCompraRelacionadas(ordenTrabajo: OrdenTrabajo): void {
        const params = ordenTrabajo.pedido_id ? { pedido_id: ordenTrabajo.pedido_id, per_page: 50 } : ordenTrabajo.cotizacion_id ? { cotizacion_id: ordenTrabajo.cotizacion_id, per_page: 50 } : { per_page: 50 };

        this.ordenCompraService.getAll(params).subscribe((response) => {
            this.ordenesCompra.set(response.data.filter((orden) => orden.estado === 'Enviada' || orden.estado === 'Confirmada' || orden.estado === 'Recibida parcialmente'));
        });
    }

    puedeRegistrarRecepcion(): boolean {
        const roles = this.authService.currentUser()?.roles ?? [];
        const tieneRol = roles.includes('Logistica') || roles.includes('Administrador') || roles.includes('super_admin');

        return tieneRol && this.ordenesCompra().length > 0;
    }

    ordenCompraOptions(): { label: string; value: number }[] {
        return this.ordenesCompra().map((orden) => ({
            label: `OC-${orden.id} · ${orden.proveedor?.nombre || orden.proveedor?.razon_social || 'Proveedor'} · ${orden.estado}`,
            value: orden.id
        }));
    }

    openRecepcionDialog(): void {
        const primeraOrden = this.ordenesCompra()[0] ?? null;
        this.fechaRecepcion.set(this.toDatetimeLocal(new Date()));
        this.numeroRemision.set(null);
        this.observacionesRecepcion.set(null);
        this.recepcionDialogVisible.set(true);
        this.seleccionarOrdenCompra(primeraOrden?.id ?? null);
    }

    seleccionarOrdenCompra(ordenCompraId: number | null): void {
        this.selectedOrdenCompraId.set(ordenCompraId);
        const orden = this.ordenesCompra().find((item) => item.id === ordenCompraId);

        this.recepcionLineas.set((orden?.detalles ?? orden?.referencias ?? []).map((detalle) => this.crearLineaRecepcion(detalle)));
    }

    actualizarLinea(id: number, campo: 'cantidad_recibida' | 'cantidad_conforme' | 'cantidad_rechazada', valor: number | null): void {
        this.recepcionLineas.update((lineas) =>
            lineas.map((linea) =>
                linea.orden_compra_detalle_id === id
                    ? {
                          ...linea,
                          [campo]: Number(valor ?? 0)
                      }
                    : linea
            )
        );
    }

    actualizarMotivoRechazo(id: number, valor: string | null): void {
        this.recepcionLineas.update((lineas) =>
            lineas.map((linea) =>
                linea.orden_compra_detalle_id === id
                    ? {
                          ...linea,
                          motivo_rechazo: valor
                      }
                    : linea
            )
        );
    }

    recepcionValida(): boolean {
        return this.selectedOrdenCompraId() !== null && this.fechaRecepcion().length > 0 && this.recepcionLineas().some((linea) => linea.cantidad_recibida > 0) && this.recepcionLineas().every((linea) => recepcionCompraLineaValida(linea));
    }

    guardarRecepcion(): void {
        const ordenCompraId = this.selectedOrdenCompraId();

        if (ordenCompraId === null || !this.recepcionValida()) {
            return;
        }

        this.store.dispatch(
            registrarRecepcionCompra({
                ordenTrabajoId: this.ordenTrabajoId(),
                data: {
                    orden_compra_id: ordenCompraId,
                    fecha_recepcion: new Date(this.fechaRecepcion()).toISOString(),
                    numero_remision: this.numeroRemision(),
                    observaciones: this.observacionesRecepcion(),
                    detalles: this.recepcionLineas()
                        .filter((linea) => linea.cantidad_recibida > 0)
                        .map((linea) => ({
                            orden_compra_detalle_id: linea.orden_compra_detalle_id,
                            cantidad_recibida: linea.cantidad_recibida,
                            cantidad_conforme: linea.cantidad_conforme,
                            cantidad_rechazada: linea.cantidad_rechazada,
                            motivo_rechazo: linea.motivo_rechazo
                        }))
                }
            })
        );
        this.recepcionDialogVisible.set(false);
    }

    private crearLineaRecepcion(detalle: OrdenCompraReferencia): RecepcionLineaForm {
        return {
            orden_compra_detalle_id: detalle.id,
            referencia: detalle.referencia?.referencia || detalle.referencia?.codigo_heavymarket || `Detalle #${detalle.id}`,
            cantidad_ordenada: detalle.cantidad,
            cantidad_recibida: 0,
            cantidad_conforme: 0,
            cantidad_rechazada: 0,
            motivo_rechazo: null
        };
    }

    private toDatetimeLocal(date: Date): string {
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    onEdit(): void {
        this.router.navigate(['/app/ordenes-trabajo', this.ordenTrabajoId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/ordenes-trabajo']);
    }

    downloadPDF(): void {
        window.open(`/api/v1/ordenes-trabajo/${this.ordenTrabajoId()}/download-pdf`, '_blank');
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Completado':
                return 'success';
            case 'En Proceso':
                return 'info';
            case 'Pendiente':
                return 'warn';
            case 'Cancelado':
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

    getProveedorAprobado(item: any): any {
        const proveedores = item?.pedido_referencia?.proveedores || [];
        return proveedores.find((p: any) => p.estado == 1) || proveedores[0] || null;
    }

    getIndicadorEstadoClass(item: any): string {
        const cant = item.cantidad || 0;
        const recibida = item.cantidad_recibida || 0;

        if (recibida >= cant) {
            return 'bg-green-500'; // Llegó todo
        }
        if (recibida > 0 && recibida < cant) {
            return 'bg-orange-500'; // Llegó parcialmente (Naranja)
        }
        
        // Si no llegó nada (recibida == 0)
        const estadoOT = this.ordenTrabajo()?.estado;
        if (estadoOT === 'Completado' || estadoOT === 'Cancelado' || item.estado === 'Cancelado' || item.estado === 'No Llegó') {
            return 'bg-red-500'; // No llegó
        }
        
        return 'bg-yellow-500'; // Pendiente de recibido - En tránsito
    }

    getIndicadorEstadoTitle(item: any): string {
        const cant = item.cantidad || 0;
        const recibida = item.cantidad_recibida || 0;

        if (recibida >= cant) {
            return 'Llegó todo';
        }
        if (recibida > 0 && recibida < cant) {
            return 'Llegó parcialmente';
        }

        const estadoOT = this.ordenTrabajo()?.estado;
        if (estadoOT === 'Completado' || estadoOT === 'Cancelado' || item.estado === 'Cancelado' || item.estado === 'No Llegó') {
            return 'No llegó';
        }

        return 'Pendiente de recibido - En tránsito';
    }

    calcularSubtotal(): number {
        const referencias = this.ordenTrabajo()?.referencias || [];
        return referencias.reduce((acc, item) => {
            const prov = this.getProveedorAprobado(item);
            const precio = prov?.valor_unitario || prov?.valor_unidad || 0;
            return acc + (precio * item.cantidad);
        }, 0);
    }

    viewMaquina(maquina: any): void {
        if (!maquina) return;
        this.maquinaService.getById(maquina.id).subscribe({
            next: (response: any) => {
                this.selectedMaquina.set(response.data || response);
                this.displayMaquinaDialog.set(true);
            },
            error: () => {
                this.selectedMaquina.set(maquina);
                this.displayMaquinaDialog.set(true);
            }
        });
    }

    viewTercero(tercero: any): void {
        if (!tercero) return;
        this.selectedTercero.set(tercero);
        this.displayTerceroDialog.set(true);
    }
}
