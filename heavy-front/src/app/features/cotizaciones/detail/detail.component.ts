import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PanelModule } from 'primeng/panel';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ImageModule } from 'primeng/image';
import { ConfirmationService, MessageService } from 'primeng/api';
import { loadCotizacionById } from '../../../store/cotizaciones/actions/cotizaciones.actions';
import * as CotizacionesSelectors from '../../../store/cotizaciones/selectors/cotizaciones.selectors';
import { Cotizacion } from '../../../core/models/cotizacion.model';
import { MaquinaService } from '../../../core/services/maquina.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';

import { TerceroFormComponent } from '../../../shared/components/tercero-form/tercero-form.component';
import { MaquinaDetailComponent } from '../../../shared/components/maquina-detail/maquina-detail.component';

/**
 * Componente de detalle de cotización
 * Rediseñado según mockup con soporte para modo claro/oscuro y arquitectura Zoneless
 */
@Component({
    selector: 'app-cotizacion-detail',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        CardModule,
        ButtonModule,
        TagModule,
        DividerModule,
        TableModule,
        ConfirmDialogModule,
        PanelModule,
        TooltipModule,
        InputNumberModule,
        DialogModule,
        ImageModule,
        TerceroFormComponent,
        MaquinaDetailComponent,
        CurrencyPipe,
        DatePipe
    ],
    providers: [MessageService],
    template: `
        <div class="px-4 py-6 md:px-6 lg:px-8 bg-slate-50 dark:bg-transparent min-h-screen">
            @if (loading()) {
                <div class="flex flex-col items-center justify-center py-20">
                    <i class="pi pi-spin pi-spinner text-5xl text-yellow-600 mb-4"></i>
                    <p class="text-xl font-medium text-muted-color">Cargando detalles de cotización...</p>
                </div>
            } @else if (cotizacion(); as cot) {
                <!-- Header -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 px-8">
                    <div>
                        <div class="text-slate-500 dark:text-slate-50 text-base font-medium mb-1" style="font-family: 'Figtree'">Cotizaciones > Detalle</div>
                        <h1 class="text-3xl font-bold text-yellow-600 dark:text-brand-yellow" style="font-family: 'Figtree'">
                            {{ cot.id ? 'COT-' + cot.id.toString().padStart(6, '0') : 'COT-XXXXXX' }}
                        </h1>
                    </div>
                    <div class="flex gap-4 items-center">
                        <p-tag [value]="cot.estado" [severity]="getEstadoSeverity(cot.estado)" styleClass="text-xs uppercase font-bold px-4 py-2 rounded-full"></p-tag>
                    </div>
                </div>

                @if (cot.estado === 'Borrador') {
                <div
                    class="mx-8 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"
                    style="border-color: var(--p-orange-500); background: color-mix(in srgb, var(--p-orange-500) 12%, transparent)"
                >
                    <i class="pi pi-exclamation-triangle text-orange-500 mt-0.5"></i>
                    <div class="text-slate-700 dark:text-slate-200">
                        <span class="font-semibold">Cotización en Borrador.</span>
                        Falta configurar la tarifa de flete (USD/lb) del país de uno o más proveedores internacionales del costeo.
                        <a routerLink="/app/countries" class="text-blue-600 dark:text-blue-400 font-medium ml-1 underline">Gestión de Países</a>
                    </div>
                </div>
                }

                <div class="flex flex-col gap-10">
                    <!-- Top Info Cards Grid -->
                    <div class="flex flex-col lg:flex-row gap-6 px-8">
                        <!-- 1. Order Info Card -->
                        <div class="figma-card p-0 overflow-hidden flex flex-col flex-1 min-h-[320px] bg-white dark:bg-[#343743] rounded-lg shadow-md border border-gray-200 dark:border-none">
                            <div class="p-3 bg-gray-50 dark:bg-[#343743] flex justify-between items-center border-b border-gray-200 dark:border-none">
                                <span class="font-bold text-gray-800 dark:text-white text-base pl-2">Información del pedido</span>
                                <div class="w-[47px] h-[44px] flex items-center justify-center">
                                    <i class="pi pi-shopping-bag text-gray-600 dark:text-white text-xl"></i>
                                </div>
                            </div>
                            <div class="p-4 space-y-2 flex-1 text-sm bg-white dark:bg-[#343743]">
                                <div class="flex justify-between">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Documento: Cotización</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Consecutivo: {{ cot.id }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Creación: {{ cot.created_at | date: 'MMMM d, y' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Actualización: {{ cot.updated_at | date: 'MMMM d, y' }}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Usuario: {{ cot.user?.name || '---' }}</span>
                                </div>
                                <div class="flex justify-between items-center mt-2">
                                    <span class="text-yellow-600 dark:text-brand-yellow font-semibold">Estado:</span>
                                    <p-tag [value]="cot.estado" [severity]="getEstadoSeverity(cot.estado)" styleClass="text-xs uppercase font-bold px-3 py-1"></p-tag>
                                </div>
                            </div>
                        </div>

                        <!-- 2. Client Info Card -->
                        <div class="figma-card p-0 overflow-hidden flex flex-col flex-1 min-h-[320px] bg-white dark:bg-[#343743] rounded-lg shadow-md border border-gray-200 dark:border-none">
                            <div class="p-3 bg-gray-50 dark:bg-[#343743] flex justify-between items-center border-b border-gray-200 dark:border-none">
                                <span class="font-bold text-gray-800 dark:text-white text-base pl-2">Información del Cliente</span>
                                <div class="flex items-center gap-1">
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewTercero(cot.tercero)" pTooltip="Ver detalle de cliente"></p-button>
                                    <p-button icon="pi pi-envelope" [rounded]="true" [text]="true" severity="secondary" (onClick)="sendEmail(cot.tercero?.email)" [disabled]="!cot.tercero?.email" pTooltip="Enviar correo"></p-button>
                                    <p-button
                                        icon="pi pi-whatsapp"
                                        [rounded]="true"
                                        [text]="true"
                                        severity="success"
                                        (onClick)="sendWhatsApp(cot.pedido?.contacto?.telefono || cot.tercero?.telefono)"
                                        [disabled]="!(cot.pedido?.contacto?.telefono || cot.tercero?.telefono)"
                                        pTooltip="Enviar WhatsApp"
                                    ></p-button>
                                </div>
                            </div>
                            <div class="p-4 space-y-3 flex-1 text-sm bg-white dark:bg-[#343743]">
                                @if (cot.tercero; as cliente) {
                                    <div class="flex flex-col gap-1">
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Tipo: {{ cliente.tipo || 'Cliente' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block truncate" [pTooltip]="cliente.nombre">Razón Social: {{ cliente.nombre || '---' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Tipo de documento: {{ cliente.tipo_documento || '---' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Número de documento: {{ cliente.numero_documento || '---' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Ciudad: {{ cliente.city?.name || cliente.ciudad?.name || '--' }}</span>
                                        <div class="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                                            <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Contacto: {{ cot.pedido?.contacto?.nombre || '---' }}</span>
                                            <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Teléfono: {{ cot.pedido?.contacto?.telefono || cliente.telefono || '---' }}</span>
                                        </div>
                                    </div>
                                } @else {
                                    <div class="flex flex-col items-center justify-center h-full text-muted-color opacity-50 italic">
                                        <i class="pi pi-user text-4xl mb-2"></i>
                                        <span>Sin información del cliente</span>
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- 3. Machine Info Card -->
                        <div class="figma-card p-0 overflow-hidden flex flex-col flex-1 min-h-[320px] bg-white dark:bg-[#343743] rounded-lg shadow-md border border-gray-200 dark:border-none">
                            <div class="p-3 bg-gray-50 dark:bg-[#343743] flex justify-between items-center border-b border-gray-200 dark:border-none">
                                <span class="font-bold text-gray-800 dark:text-white text-base pl-2">Información de la máquina</span>
                                <div class="flex items-center">
                                    <p-button icon="pi pi-eye" [rounded]="true" [text]="true" severity="info" (onClick)="viewMaquina(cot.pedido?.maquina)" pTooltip="Ver detalle de máquina"></p-button>
                                    <div class="w-[47px] h-[44px] flex items-center justify-center">
                                        <i class="pi pi-cog text-gray-600 dark:text-white text-xl"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="p-4 space-y-3 flex-1 text-sm bg-white dark:bg-[#343743]">
                                @if (cot.pedido?.maquina; as maquina) {
                                    <div class="flex flex-col gap-2">
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Máquina: {{ maquina.tipo || maquina.nombre || 'N/A' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Fabricante: {{ maquina.marca || 'N/A' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Serie: {{ maquina.serie || 'N/A' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">Modelo: {{ maquina.modelo || 'N/A' }}</span>
                                        <span class="text-yellow-600 dark:text-brand-yellow font-semibold block">ID adicional: {{ maquina.id_interno || '----' }}</span>
                                    </div>
                                } @else {
                                    <div class="flex flex-col items-center justify-center h-full text-muted-color opacity-50 italic">
                                        <i class="pi pi-cog text-4xl mb-2"></i>
                                        <span>Sin información de máquina</span>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Items Section -->
                    <div class="px-8">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-xl font-bold text-yellow-600 dark:text-brand-yellow uppercase tracking-wider">Detalle de ítems</h3>
                            <div class="bg-gray-100 dark:bg-[#343743] border border-gray-200 dark:border-none rounded-lg px-4 py-2">
                                <span class="text-gray-500 dark:text-slate-400 text-sm">Total ítems:</span>
                                <span class="text-yellow-600 dark:text-brand-yellow font-bold text-lg ml-2">{{ cot.referencias_proveedores?.length || 0 }}</span>
                            </div>
                        </div>

                        <div class="overflow-hidden rounded-xl bg-white dark:bg-[#343743] shadow-md border border-gray-200 dark:border-none">
                            <p-table [value]="cot.referencias_proveedores || []" styleClass="p-datatable-sm p-datatable-striped" [responsiveLayout]="'scroll'">
                                <ng-template pTemplate="header">
                                    <tr class="bg-gray-50 dark:bg-slate-800">
                                        <th style="width: 3rem"></th>
                                        <th class="text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Referencia</th>
                                        <th class="text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Descripción</th>
                                        <th class="text-center text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Cant</th>
                                        <th class="text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Marca</th>
                                        <th class="text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Entrega</th>
                                        <th class="text-right text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Precio</th>
                                        <th class="text-right text-slate-600 dark:text-slate-200 font-bold uppercase text-xs">Total</th>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="body" let-item>
                                    <tr class="dark:border-slate-700">
                                        <td><i class="pi pi-minus-circle text-muted-color opacity-30"></i></td>
                                        <td class="font-bold text-yellow-600 dark:text-brand-yellow">
                                            {{ item.pedido_referencia_proveedor?.referencia?.referencia || item.pedido_referencia_proveedor?.referencia_id || 'N/A' }}
                                        </td>
                                        <td class="text-slate-700 dark:text-slate-300">
                                            {{ item.pedido_referencia_proveedor?.referencia?.descripcion || item.pedido_referencia_proveedor?.referencia?.articulo?.definicion || 'N/A' }}
                                        </td>
                                        <td class="text-center font-semibold">{{ item.pedido_referencia_proveedor?.cantidad || 0 }}</td>
                                        <td class="text-slate-700 dark:text-slate-300">{{ item.pedido_referencia_proveedor?.marca?.nombre || item.pedido_referencia_proveedor?.marca?.valor || 'N/A' }}</td>
                                        <td class="text-slate-700 dark:text-slate-300">{{ item.pedido_referencia_proveedor?.dias_entrega || 0 }} días</td>
                                        <td class="text-right">{{ item.pedido_referencia_proveedor?.valor_unitario || item.pedido_referencia_proveedor?.valor_unidad | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                        <td class="text-right font-bold text-color">{{ item.pedido_referencia_proveedor?.valor_total | currency: 'COP' : 'symbol' : '1.0-0' }}</td>
                                    </tr>
                                </ng-template>
                                <ng-template pTemplate="footer">
                                    <tr class="dark:bg-slate-800/30">
                                        <td colspan="7" class="text-right border-0 pt-6"><span class="text-lg font-bold uppercase text-slate-500 dark:text-slate-400">SubTotal</span></td>
                                        <td class="text-right border-0 pt-6">
                                            <div class="px-3 py-2 text-lg font-bold text-slate-700 dark:text-slate-200">
                                                {{ subtotal() | currency: 'COP' : 'symbol' : '1.0-0' }}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="7" class="text-right border-0 py-2"><span class="text-lg font-bold uppercase text-slate-500 dark:text-slate-400">Descuento (0%)</span></td>
                                        <td class="text-right border-0 py-2">
                                            <div class="px-3 py-2 text-lg font-bold text-slate-700 dark:text-slate-200">
                                                {{ 0 | currency: 'COP' : 'symbol' : '1.0-0' }}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="7" class="text-right border-0 py-2"></td>
                                        <td class="text-right border-0 py-2">
                                            <div class="bg-yellow-600 dark:bg-brand-yellow text-white dark:text-slate-900 px-5 py-3 rounded-lg shadow-lg text-2xl font-black">
                                                {{ cot.total | currency: 'COP' : 'symbol' : '1.0-0' }}
                                            </div>
                                        </td>
                                    </tr>
                                </ng-template>
                            </p-table>
                        </div>
                    </div>

                    <!-- Acciones Finales -->
                    <div class="flex flex-wrap justify-end gap-4 mt-4 mb-20 px-8">
                        <button type="button" class="btn-pill btn-outline flex items-center gap-2" (click)="onBack()"><i class="pi pi-arrow-left"></i> Volver al listado</button>
                        <button type="button" class="btn-pill btn-secondary flex items-center gap-2" (click)="onEdit()" style="background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;"><i class="pi pi-pencil"></i> Editar</button>
                        @if (cot.estado === 'En_Proceso' || cot.estado === 'Pendiente') {
                            <button type="button" class="btn-pill flex items-center gap-2" (click)="onReject()" style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca;"><i class="pi pi-times"></i> Rechazar</button>
                            <button type="button" class="btn-pill flex items-center gap-2" (click)="onApprove()" style="background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0;"><i class="pi pi-check"></i> Aprobar</button>
                        }
                        <button type="button" class="btn-pill btn-primary flex items-center gap-2" (click)="onDownloadPDF()"><i class="pi pi-send"></i> Enviar / Descargar PDF</button>
                    </div>
                </div>

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
            } @else {
                <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div class="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
                        <i class="pi pi-exclamation-triangle text-5xl"></i>
                    </div>
                    <h2 class="text-3xl font-bold mb-3 text-color">Cotización no encontrada</h2>
                    <p class="text-muted-color text-lg mb-8 max-w-md">La cotización que buscas no existe o no tienes permisos para verla.</p>
                    <button type="button" class="btn-pill btn-primary" (click)="onBack()">Volver al Listado</button>
                </div>
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                font-family: 'Figtree', sans-serif;
            }

            .figma-card {
                box-shadow: -2px -1px 11.9px rgba(58, 58, 58, 0.1);
                border-radius: 8px;
                border: none;
                transition: transform 0.2s;
            }

            .text-brand-yellow {
                color: #fdb831 !important;
            }

            .bg-brand-yellow {
                background-color: #fdb831 !important;
                color: #0c0e0f !important;
            }

            .btn-pill {
                border-radius: 64px;
                font-weight: 600;
                padding: 12px 28px;
                border: none;
                transition: all 0.2s;
                cursor: pointer;
                font-size: 0.875rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;

                &.btn-primary {
                    background-color: #fdb831;
                    color: #0c0e0f;
                    box-shadow: 0 4px 12px rgba(253, 184, 49, 0.3);

                    &:hover {
                        filter: brightness(1.1);
                        transform: translateY(-1px);
                    }
                }

                &.btn-outline {
                    background-color: transparent;
                    color: #fdb831;
                    border: 2px solid #fdb831;

                    &:hover {
                        background-color: rgba(253, 184, 49, 0.1);
                    }
                }

                &.btn-secondary {
                    background-color: #f1f5f9;
                    color: #475569;
                    &:hover {
                        background-color: #e2e8f0;
                    }
                }
            }

            :host ::ng-deep {
                .p-datatable-header {
                    background: transparent;
                    border: none;
                }
                .p-datatable-footer {
                    background: transparent;
                    border: none;
                }
                .p-tag {
                    border-radius: 64px;
                }
                .machine-table-header {
                    background-color: #fdb831;
                    color: #000;
                    font-weight: bold;
                    padding: 0.5rem;
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                }
            }
        `
    ]
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly cotizacionService = inject(CotizacionService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);

    cotizacion = signal<any | null>(null);
    cotizacionId = signal<number>(0);
    loading = signal(true);
    subtotal = signal<number>(0);

    // Modales
    displayMaquinaDialog = signal(false);
    displayTerceroDialog = signal(false);
    selectedMaquina = signal<any>(null);
    selectedTercero = signal<any>(null);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.cotizacionId.set(+id);
            this.loadCotizacion(+id);
        }
    }

    sendEmail(email: string | undefined): void {
        if (email) {
            window.open(`mailto:${email}`, '_blank');
        }
    }

    sendWhatsApp(phone: string | undefined): void {
        if (phone) {
            // Limpiar el número de espacios y caracteres no numéricos
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    }

    private calculateSubtotal(cot: any): void {
        if (!cot.referencias_proveedores) {
            this.subtotal.set(0);
            return;
        }

        const total = cot.referencias_proveedores.reduce((acc: number, item: any) => {
            const valor = Number(item.pedido_referencia_proveedor?.valor_total || 0);
            return acc + valor;
        }, 0);

        this.subtotal.set(total);
    }

    private loadCotizacion(id: number): void {
        this.loading.set(true);
        this.cotizacionService.getById(id).subscribe({
            next: (response: any) => {
                if (response.data) {
                    this.cotizacion.set(response.data);
                    this.calculateSubtotal(response.data);
                    this.loading.set(false);
                }
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la cotización' });
            }
        });
    }

    viewMaquina(maquina: any): void {
        if (!maquina) return;

        // Cargamos la máquina completa para asegurar que tenga los componentes
        this.maquinaService.getById(maquina.id).subscribe({
            next: (response: any) => {
                this.selectedMaquina.set(response.data || response);
                this.displayMaquinaDialog.set(true);
            },
            error: () => {
                // Fallback a los datos que ya tenemos si falla la carga
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

    onEdit(): void {
        this.router.navigate(['/app/cotizaciones', this.cotizacionId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/cotizaciones']);
    }

    onDownloadPDF(): void {
        const id = this.cotizacionId();
        if (!id) return;

        this.cotizacionService.downloadPDF(id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `COT-${id}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'PDF descargado exitosamente' });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el PDF' });
            }
        });
    }

    onApprove(): void {
        const id = this.cotizacionId();
        if (!id) return;

        this.confirmationService.confirm({
            message: '¿Está seguro de aprobar esta cotización?',
            header: 'Aprobar Cotización',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.cotizacionService.approve(id).subscribe({
                    next: (response) => {
                        this.cotizacion.set(response.data);
                        this.messageService.add({ severity: 'success', summary: 'Aprobada', detail: 'Cotización aprobada exitosamente' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la cotización' });
                    }
                });
            }
        });
    }

    onReject(): void {
        const id = this.cotizacionId();
        if (!id) return;

        this.confirmationService.confirm({
            message: '¿Está seguro de rechazar esta cotización?',
            header: 'Rechazar Cotización',
            icon: 'pi pi-times-circle',
            accept: () => {
                this.cotizacionService.reject(id).subscribe({
                    next: (response) => {
                        this.cotizacion.set(response.data);
                        this.messageService.add({ severity: 'warn', summary: 'Rechazada', detail: 'Cotización rechazada exitosamente' });
                    },
                    error: () => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la cotización' });
                    }
                });
            }
        });
    }

    getEstadoSeverity(estado: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
        switch (estado) {
            case 'Aprobada':
                return 'success';
            case 'Enviada':
            case 'En_Proceso':
                return 'info';
            case 'Pendiente':
                return 'warn';
            case 'Rechazada':
            case 'Vencida':
                return 'danger';
            case 'Borrador':
                return 'warn';
            default:
                return 'secondary';
        }
    }
}
