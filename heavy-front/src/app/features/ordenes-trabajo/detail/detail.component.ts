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
    imports: [CommonModule, FormsModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule, TableModule, DialogModule, InputNumberModule, InputTextModule, SelectModule, TextareaModule],
    template: `
        <div class="card">
            <div class="flex justify-between items-center mb-4">
                <h2>Orden de Trabajo OT-{{ ordenTrabajoId() }}</h2>
                <div class="flex gap-2">
                    @if (puedeRegistrarRecepcion()) {
                        <p-button label="Registrar recepción" icon="pi pi-box" (onClick)="openRecepcionDialog()"> </p-button>
                    }
                    <p-button label="Descargar PDF" icon="pi pi-file-pdf" severity="danger" [outlined]="true" (onClick)="downloadPDF()"> </p-button>
                    <p-button label="Editar" icon="pi pi-pencil" severity="warn" [outlined]="true" (onClick)="onEdit()"> </p-button>
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" (onClick)="onBack()"> </p-button>
                </div>
            </div>

            @if (loading()) {
                <div class="text-center py-8">
                    <i class="pi pi-spin pi-spinner text-4xl"></i>
                    <p class="mt-4">Cargando orden de trabajo...</p>
                </div>
            } @else if (ordenTrabajo()) {
                <div class="grid">
                    <!-- Información General -->
                    <div class="col-12">
                        <p-card header="Información General">
                            <div class="grid">
                                <div class="col-12 md:col-6">
                                    <p><strong>ID:</strong> OT-{{ ordenTrabajo()?.id }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Estado:</strong>
                                        @if (ordenTrabajo()?.estado) {
                                            <p-tag [value]="ordenTrabajo()!.estado || 'N/A'" [severity]="getEstadoSeverity(ordenTrabajo()!.estado || 'Pendiente')"> </p-tag>
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Cliente:</strong> {{ ordenTrabajo()?.tercero?.razon_social || ordenTrabajo()?.tercero?.nombre_comercial || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Pedido:</strong> #{{ ordenTrabajo()?.pedido_id || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Cotización:</strong> {{ ordenTrabajo()?.cotizacion_id ? 'COT-' + ordenTrabajo()!.cotizacion_id : 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Transportadora:</strong> {{ ordenTrabajo()?.transportadora?.nombre || 'N/A' }}</p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Fecha de Ingreso:</strong>
                                        @if (ordenTrabajo()?.fecha_ingreso) {
                                            {{ ordenTrabajo()!.fecha_ingreso | date: 'short' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p>
                                        <strong>Fecha de Entrega:</strong>
                                        @if (ordenTrabajo()?.fecha_entrega) {
                                            {{ ordenTrabajo()!.fecha_entrega | date: 'short' }}
                                        } @else {
                                            N/A
                                        }
                                    </p>
                                </div>
                                <div class="col-12 md:col-6">
                                    <p><strong>Teléfono:</strong> {{ ordenTrabajo()?.telefono || 'N/A' }}</p>
                                </div>
                                @if (ordenTrabajo()?.guia) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Guía:</strong> {{ ordenTrabajo()!.guia }}</p>
                                    </div>
                                }
                                @if (ordenTrabajo()?.direccion) {
                                    <div class="col-12 md:col-6">
                                        <p><strong>Dirección:</strong> {{ ordenTrabajo()!.direccion.direccion || 'N/A' }}</p>
                                    </div>
                                }
                                @if (ordenTrabajo()?.observaciones) {
                                    <div class="col-12">
                                        <p><strong>Observaciones:</strong></p>
                                        <p class="mt-2">{{ ordenTrabajo()!.observaciones }}</p>
                                    </div>
                                }
                                @if (ordenTrabajo()?.motivo_cancelacion) {
                                    <div class="col-12">
                                        <p><strong>Motivo de Cancelación:</strong></p>
                                        <p class="mt-2 text-red-500">{{ ordenTrabajo()!.motivo_cancelacion }}</p>
                                    </div>
                                }
                            </div>
                        </p-card>
                    </div>

                    <!-- Referencias -->
                    @if (ordenTrabajo()?.referencias && ordenTrabajo()!.referencias!.length > 0) {
                        <div class="col-12">
                            <p-card header="Referencias">
                                <p-table [value]="ordenTrabajo()!.referencias!" styleClass="p-datatable-sm">
                                    <ng-template pTemplate="header">
                                        <tr>
                                            <th>ID</th>
                                            <th>Referencia</th>
                                            <th>Cantidad</th>
                                            <th>Cantidad Recibida</th>
                                            <th>Estado</th>
                                            <th>Recibido</th>
                                        </tr>
                                    </ng-template>
                                    <ng-template pTemplate="body" let-item>
                                        <tr>
                                            <td>{{ item.id }}</td>
                                            <td>{{ item.referencia?.referencia || item.pedido_referencia?.referencia?.referencia || 'N/A' }}</td>
                                            <td>{{ item.cantidad }}</td>
                                            <td>{{ item.cantidad_recibida || 'N/A' }}</td>
                                            <td>{{ item.estado || 'N/A' }}</td>
                                            <td>
                                                @if (item.recibido) {
                                                    <i class="pi pi-check text-green-500"></i>
                                                } @else {
                                                    <i class="pi pi-times text-red-500"></i>
                                                }
                                            </td>
                                        </tr>
                                    </ng-template>
                                </p-table>
                            </p-card>
                        </div>
                    }
                </div>
            } @else {
                <div class="text-center py-8">
                    <p class="text-xl text-gray-500">Orden de trabajo no encontrada</p>
                </div>
            }

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
                        <div class="text-sm text-red-500">
                            Verifique que cada línea tenga cantidad recibida mayor a cero, que recibida sea igual a conforme más rechazada y que todo rechazo tenga motivo.
                        </div>
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
        </div>
    `,
    styles: []
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly ordenCompraService = inject(OrdenCompraService);

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
            this.ordenesCompra.set(
                response.data.filter((orden) => orden.estado === 'Enviada' || orden.estado === 'Confirmada' || orden.estado === 'Recibida parcialmente')
            );
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

        this.recepcionLineas.set(
            (orden?.detalles ?? orden?.referencias ?? []).map((detalle) => this.crearLineaRecepcion(detalle))
        );
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
        return (
            this.selectedOrdenCompraId() !== null &&
            this.fechaRecepcion().length > 0 &&
            this.recepcionLineas().some((linea) => linea.cantidad_recibida > 0) &&
            this.recepcionLineas().every((linea) => recepcionCompraLineaValida(linea))
        );
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
}
