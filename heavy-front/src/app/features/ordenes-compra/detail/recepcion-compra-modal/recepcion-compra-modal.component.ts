import { Component, ChangeDetectionStrategy, OnChanges, SimpleChanges, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { OrdenCompra } from '../../../../core/models/orden-compra.model';
import { RecepcionCompra, RecepcionCompraImagenTipo } from '../../../../core/models/recepcion-compra.model';
import { OrdenCompraService } from '../../../../core/services/orden-compra.service';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { aplicarCantidadRecibida, aplicarCantidadRechazada, aplicarMotivoRechazo, construirPayloadRecepcion, crearLineasModal, estadoItemSeverity, lineasModalValidas, marcarTodoRecibidoLineas, RecepcionModalLinea } from './recepcion-compra-modal.util';

@Component({
    selector: 'app-recepcion-compra-modal',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, DialogModule, ButtonModule, DividerModule, TableModule, TagModule, InputNumberModule, InputTextModule, TextareaModule, ImageUploadComponent],
    template: `
        <p-dialog header="Registrar recepción de mercancía" [modal]="true" [visible]="visible()" (visibleChange)="onVisibleChange($event)" [style]="{ width: 'min(1024px, 95vw)' }" [dismissableMask]="true">
            <div class="grid grid-cols-1 gap-4 pt-2">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="field">
                        <label for="oc-fecha-recepcion" class="block text-sm font-medium mb-2">Fecha recepción <span class="text-red-500">*</span></label>
                        <input pInputText id="oc-fecha-recepcion" type="datetime-local" [ngModel]="fechaRecepcion()" (ngModelChange)="fechaRecepcion.set($event)" class="w-full" />
                    </div>
                    <div class="field">
                        <label for="oc-numero-remision" class="block text-sm font-medium mb-2">Número remisión</label>
                        <input pInputText id="oc-numero-remision" [ngModel]="numeroRemision()" (ngModelChange)="numeroRemision.set($event)" class="w-full" placeholder="Ej. REM-00123" />
                    </div>
                </div>

                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-color">Ítems de la orden</span>
                    <p-button label="Marcar todo como recibido" icon="pi pi-check-square" severity="secondary" size="small" [text]="true" (onClick)="marcarTodoRecibido()" />
                </div>

                <div class="overflow-hidden rounded-xl border border-surface-200 dark:border-surface-700">
                    <p-table [value]="lineas()" styleClass="p-datatable-sm">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Referencia</th>
                                <th class="text-center">Cant. Pedida</th>
                                <th class="text-center">Ya Recibida</th>
                                <th class="text-center">Cant. A Recibir</th>
                                <th class="text-center">Rechazada</th>
                                <th>Motivo rechazo</th>
                                <th class="text-center">Estado</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-linea>
                            <tr>
                                <td class="max-w-[16rem] truncate" [title]="linea.referencia">{{ linea.referencia }}</td>
                                <td class="text-center">{{ linea.cantidad_pedida }}</td>
                                <td class="text-center text-muted-color">{{ linea.ya_recibida }}</td>
                                <td class="text-center">
                                    <p-inputNumber [ngModel]="linea.cantidad_recibida" (ngModelChange)="actualizarCantidadRecibida(linea.orden_compra_detalle_id, $event)" [min]="0" [max]="linea.saldo_pendiente" inputStyleClass="w-20 text-center" />
                                </td>
                                <td class="text-center">
                                    <p-inputNumber
                                        [ngModel]="linea.cantidad_rechazada"
                                        (ngModelChange)="actualizarCantidadRechazada(linea.orden_compra_detalle_id, $event)"
                                        [min]="0"
                                        [max]="linea.cantidad_recibida"
                                        [disabled]="linea.cantidad_recibida <= 0"
                                        inputStyleClass="w-20 text-center"
                                    />
                                </td>
                                <td>
                                    <input
                                        pInputText
                                        [ngModel]="linea.motivo_rechazo"
                                        (ngModelChange)="actualizarMotivoRechazo(linea.orden_compra_detalle_id, $event)"
                                        [disabled]="linea.cantidad_rechazada <= 0"
                                        class="w-full"
                                        placeholder="Motivo del rechazo"
                                    />
                                </td>
                                <td class="text-center">
                                    @if (linea.estado_item) {
                                        <p-tag [value]="linea.estado_item" [severity]="estadoItemSeverity(linea.estado_item)" />
                                    } @else {
                                        <span class="text-muted-color text-xs">—</span>
                                    }
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="7" class="text-center text-muted-color py-4">Esta orden de compra no tiene ítems.</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>

                <div class="field">
                    <label for="oc-observaciones-recepcion" class="block text-sm font-medium mb-2">Observaciones</label>
                    <textarea pTextarea id="oc-observaciones-recepcion" [ngModel]="observaciones()" (ngModelChange)="observaciones.set($event)" rows="3" class="w-full" placeholder="Novedades de la entrega, estado del empaque, etc."></textarea>
                </div>

                <app-image-upload label="Foto o guía de la transportadora" icon="pi pi-camera" [currentImage]="null" accept="image/*,.pdf" height="10rem" (fileSelected)="onArchivoSeleccionado($event)" />

                @if (!recepcionValida()) {
                    <div class="text-sm text-red-500">Ingrese al menos una cantidad a recibir; verifique que ninguna línea supere el saldo pendiente y que todo rechazo tenga motivo.</div>
                }
                @if (errorMensaje()) {
                    <div class="text-sm text-red-500">{{ errorMensaje() }}</div>
                }
            </div>

            <ng-template pTemplate="footer">
                <p-divider />
                <div class="flex justify-end gap-2">
                    <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [text]="true" [disabled]="guardando()" (onClick)="cerrar()" />
                    <p-button label="Guardar recepción" icon="pi pi-check" [loading]="guardando()" [disabled]="!recepcionValida() || guardando()" (onClick)="guardarRecepcion()" />
                </div>
            </ng-template>
        </p-dialog>
    `
})
export class RecepcionCompraModalComponent implements OnChanges {
    private readonly ordenCompraService = inject(OrdenCompraService);

    ordenCompra = input<OrdenCompra | null>(null);
    visible = input<boolean>(false);

    cerrado = output<void>();
    recepcionRegistrada = output<RecepcionCompra>();

    fechaRecepcion = signal(this.toDatetimeLocal(new Date()));
    numeroRemision = signal<string | null>(null);
    observaciones = signal<string | null>(null);
    lineas = signal<RecepcionModalLinea[]>([]);
    archivoSeleccionado = signal<File | null>(null);
    guardando = signal(false);
    errorMensaje = signal<string | null>(null);

    readonly estadoItemSeverity = estadoItemSeverity;

    ngOnChanges(changes: SimpleChanges): void {
        if ((changes['visible'] && this.visible()) || changes['ordenCompra']) {
            this.resetFormulario();
        }
    }

    onVisibleChange(valor: boolean): void {
        if (!valor) {
            this.cerrar();
        }
    }

    cerrar(): void {
        this.cerrado.emit();
    }

    marcarTodoRecibido(): void {
        this.lineas.update(marcarTodoRecibidoLineas);
    }

    actualizarCantidadRecibida(id: number, valor: number | null): void {
        this.lineas.update((lineas) => aplicarCantidadRecibida(lineas, id, valor));
    }

    actualizarCantidadRechazada(id: number, valor: number | null): void {
        this.lineas.update((lineas) => aplicarCantidadRechazada(lineas, id, valor));
    }

    actualizarMotivoRechazo(id: number, valor: string | null): void {
        this.lineas.update((lineas) => aplicarMotivoRechazo(lineas, id, valor));
    }

    onArchivoSeleccionado(file: File): void {
        this.archivoSeleccionado.set(file);
    }

    recepcionValida(): boolean {
        return this.fechaRecepcion().length > 0 && lineasModalValidas(this.lineas());
    }

    guardarRecepcion(): void {
        const ordenCompra = this.ordenCompra();

        if (!ordenCompra || !this.recepcionValida() || this.guardando()) {
            return;
        }

        this.guardando.set(true);
        this.errorMensaje.set(null);

        const payload = construirPayloadRecepcion(this.lineas(), new Date(this.fechaRecepcion()).toISOString(), this.numeroRemision(), this.observaciones());

        this.ordenCompraService.registrarRecepcion(ordenCompra.id, payload).subscribe({
            next: (recepcion) => this.adjuntarImagenSiAplica(recepcion),
            error: (error) => {
                this.guardando.set(false);
                this.errorMensaje.set(error?.error?.message ?? 'No se pudo registrar la recepción. Intente nuevamente.');
            }
        });
    }

    private adjuntarImagenSiAplica(recepcion: RecepcionCompra): void {
        const archivo = this.archivoSeleccionado();

        if (!archivo) {
            this.guardando.set(false);
            this.recepcionRegistrada.emit(recepcion);
            return;
        }

        const tipo: RecepcionCompraImagenTipo = archivo.type === 'application/pdf' ? 'guia' : 'foto';

        this.ordenCompraService.adjuntarImagenRecepcion(recepcion.id, archivo, tipo).subscribe({
            next: () => {
                this.guardando.set(false);
                this.recepcionRegistrada.emit(recepcion);
            },
            error: () => {
                // La recepción ya quedó registrada; la imagen puede reintentarse luego desde el historial.
                this.guardando.set(false);
                this.recepcionRegistrada.emit(recepcion);
            }
        });
    }

    private resetFormulario(): void {
        this.fechaRecepcion.set(this.toDatetimeLocal(new Date()));
        this.numeroRemision.set(null);
        this.observaciones.set(null);
        this.archivoSeleccionado.set(null);
        this.guardando.set(false);
        this.errorMensaje.set(null);
        this.lineas.set(crearLineasModal(this.ordenCompra()));
    }

    private toDatetimeLocal(date: Date): string {
        const pad = (value: number) => value.toString().padStart(2, '0');

        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
}
