import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { ProviderPortalService } from '../services/provider-portal.service';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';

@Component({
    selector: 'app-costing-opportunities',
    standalone: true,
    imports: [CommonModule, ButtonModule, ReactiveFormsModule, FormsModule, InputTextModule, InputNumberModule, ToastModule, SelectModule, TagModule, TabsModule],
    providers: [MessageService],
    template: `
        <div class="flex flex-col gap-6 p-4">
            <!-- Header Section -->
            <div class="flex justify-between items-center bg-surface-0 dark:bg-surface-900 p-4 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <div>
                    <h1 class="text-2xl font-bold m-0 flex items-center gap-3">
                        <i class="pi pi-bolt text-emerald-500 text-3xl"></i>
                        Oportunidades de Costeo
                    </h1>
                    <p class="text-surface-500 mt-1 m-0">Oferte sus mejores precios para las piezas solicitadas.</p>
                </div>
                <p-button icon="pi pi-refresh" [loading]="loading()" (onClick)="loadOpportunities()" [outlined]="true" label="Sincronizar" severity="secondary"></p-button>
            </div>

            <!-- Filtros de Estado -->
            <div class="bg-surface-0 dark:bg-surface-900 p-2 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
                <p-tabs [value]="activeStatus()" (valueChange)="onStatusChange($event)">
                    <p-tablist styleClass="border-none bg-transparent">
                        <p-tab value="pending" class="font-bold flex items-center gap-2">
                            <i class="pi pi-clock text-blue-500"></i>
                            Pendientes
                        </p-tab>
                        <p-tab value="sent" class="font-bold flex items-center gap-2">
                            <i class="pi pi-send text-orange-500"></i>
                            Enviados
                        </p-tab>
                        <p-tab value="approved" class="font-bold flex items-center gap-2">
                            <i class="pi pi-check-circle text-emerald-500"></i>
                            Aprobados
                        </p-tab>
                    </p-tablist>
                </p-tabs>
            </div>

            <!-- List of Opportunities -->
            <div *ngIf="opportunities().length > 0; else emptyState" class="flex flex-col gap-4">
                <div *ngFor="let ref of opportunities()" class="bg-surface-0 dark:bg-surface-900 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden transition-all hover:shadow-md">
                    
                    <!-- Header Row (Piece Info) -->
                    <div class="bg-surface-50 dark:bg-surface-800 px-4 py-3 flex flex-wrap items-center gap-4 border-b border-surface-200 dark:border-surface-700">
                        <p-tag value="DISPONIBLE" severity="success" [rounded]="true" class="text-xs"></p-tag>
                        <p-tag [value]="ref.categoria_comercial?.nombre || 'General'" [rounded]="true" class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-none text-xs font-semibold px-3"></p-tag>
                        
                        <div class="flex items-center gap-2">
                            <span class="text-surface-500 text-sm">Cant.</span>
                            <span class="font-bold text-surface-900 dark:text-surface-0">{{ ref.cantidad }}</span>
                        </div>

                        <div class="h-4 w-px bg-surface-300 dark:bg-surface-600 hidden md:block"></div>

                        <span class="font-bold text-blue-600 dark:text-blue-400 text-lg tracking-tight">{{ ref.referencia?.referencia || 'N/A' }}</span>
                        <span class="text-surface-600 dark:text-surface-400 font-medium">{{ ref.definicion || 'Sin definición' }}</span>

                        <div class="ml-auto flex items-center gap-2">
                            <p-button icon="pi pi-comments" [rounded]="true" [text]="true" severity="secondary" size="small" pTooltip="Comentarios del analista"></p-button>
                            <i class="pi pi-chevron-up text-surface-400"></i>
                        </div>
                    </div>

                    <!-- Input Row (Form) -->
                    <div class="p-5">
                        <div class="grid grid-cols-12 gap-4 items-end">
                            
                            <!-- Item ID -->
                            <div class="col-span-12 md:col-span-1 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">Ítem</label>
                                <div class="bg-surface-100 dark:bg-surface-800 text-surface-500 rounded-lg p-2.5 text-center font-medium border border-surface-200 dark:border-surface-700">
                                    {{ ref.id }}
                                </div>
                            </div>

                            <!-- Cantidad -->
                            <div class="col-span-12 md:col-span-1 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">Cant.</label>
                                <p-inputNumber [(ngModel)]="ref.cantidad" [disabled]="true" inputStyleClass="w-full text-center font-bold bg-surface-50 dark:bg-surface-800" styleClass="w-full"></p-inputNumber>
                            </div>

                            <!-- Marca Select -->
                            <div class="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">Marca Ofrecida</label>
                                <p-select 
                                    [options]="marcas" 
                                    [(ngModel)]="ref.form_marca_id"
                                    optionLabel="label" 
                                    optionValue="value" 
                                    [filter]="true" 
                                    [placeholder]="ref.marca?.nombre || 'Seleccionar'" 
                                    class="w-full h-[46px]"
                                    styleClass="w-full border-surface-300 rounded-lg"
                                    [showClear]="true"
                                    appendTo="body"
                                    [disabled]="ref.already_costed">
                                </p-select>
                            </div>

                            <!-- Entrega Select -->
                            <div class="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">Entrega</label>
                                <p-select 
                                    [options]="tiemposEntrega" 
                                    [(ngModel)]="ref.form_dias_entrega"
                                    optionLabel="label" 
                                    optionValue="value" 
                                    placeholder="Seleccionar"
                                    class="w-full h-[46px]"
                                    styleClass="w-full border-surface-300 rounded-lg"
                                    appendTo="body"
                                    [disabled]="ref.already_costed">
                                </p-select>
                            </div>

                            <!-- Costo Input -->
                            <div class="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">
                                    {{ providerInfo().is_national ? 'Costo COP' : 'Costo USD' }}
                                </label>
                                <p-inputNumber 
                                    [(ngModel)]="ref.form_costo"
                                    [mode]="'currency'" 
                                    [currency]="providerInfo().is_national ? 'COP' : 'USD'" 
                                    [locale]="providerInfo().is_national ? 'es-CO' : 'en-US'" 
                                    inputStyleClass="w-full font-bold text-lg h-[46px] border-surface-300 rounded-lg"
                                    styleClass="w-full"
                                    [min]="0"
                                    [disabled]="ref.already_costed">
                                </p-inputNumber>
                            </div>

                            <!-- Observaciones -->
                            <div class="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                                <label class="text-[10px] font-bold uppercase text-surface-400 ml-1 tracking-wider">Observaciones</label>
                                <input pInputText [(ngModel)]="ref.form_comentario" class="w-full h-[46px] border-surface-300 rounded-lg" placeholder="Stock, origen..." [disabled]="ref.already_costed" />
                            </div>

                            <!-- Submit Button -->
                            <div class="col-span-12 md:col-span-2 flex justify-end">
                                <p-button 
                                    *ngIf="!ref.already_costed; else alreadyCostedState"
                                    label="Agregar" 
                                    icon="pi pi-plus" 
                                    [loading]="ref.submitting"
                                    [disabled]="!ref.form_costo || ref.form_dias_entrega === undefined"
                                    (onClick)="submitCost(ref)"
                                    styleClass="w-full bg-blue-600 border-none hover:bg-blue-700 py-3 rounded-lg font-bold">
                                </p-button>
                                <ng-template #alreadyCostedState>
                                    <p-button 
                                        [label]="activeStatus() === 'sent' ? 'Enviado' : 'Aprobado'" 
                                        [icon]="activeStatus() === 'sent' ? 'pi pi-send' : 'pi pi-check'" 
                                        [disabled]="true"
                                        [outlined]="true"
                                        [severity]="activeStatus() === 'sent' ? 'secondary' : 'success'"
                                        styleClass="w-full py-3 rounded-lg font-bold">
                                    </p-button>
                                </ng-template>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty State -->
            <ng-template #emptyState>
                <div class="bg-surface-0 dark:bg-surface-900 rounded-2xl p-12 text-center border-2 border-dashed border-surface-200 dark:border-surface-700 flex flex-col items-center gap-4">
                    <div class="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center">
                        <i class="pi pi-inbox text-4xl text-surface-400"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 m-0">Sin oportunidades pendientes</h3>
                        <p class="text-surface-500 mt-2 max-w-md mx-auto">No hay piezas que coincidan con su especialidad en este momento. Le notificaremos cuando los analistas publiquen nuevos requerimientos.</p>
                    </div>
                    <p-button label="Verificar de nuevo" icon="pi pi-refresh" [text]="true" (onClick)="loadOpportunities()"></p-button>
                </div>
            </ng-template>
        </div>

        <p-toast></p-toast>
    `,
    styles: [`
        :host ::ng-deep .p-select {
            border-radius: 0.5rem;
        }
        :host ::ng-deep .p-inputnumber-input {
            border-radius: 0.5rem;
        }
        :host ::ng-deep .p-button {
            border-radius: 0.5rem;
        }
    `]
})
export class CostingOpportunitiesComponent implements OnInit {
    private providerPortalService = inject(ProviderPortalService);
    private listaService = inject(ListaService);
    private messageService = inject(MessageService);

    opportunities = signal<any[]>([]);
    providerInfo = signal<{id?: number, nombre?: string, is_national: boolean}>({ is_national: true });
    loading = signal(false);
    activeStatus = signal<'pending' | 'sent' | 'approved'>('pending');
    marcas: any[] = [];
    tiemposEntrega = [
        { label: 'Inmediato', value: 0 },
        { label: '1-3 días', value: 3 },
        { label: '4-7 días', value: 7 },
        { label: '8-15 días', value: 15 },
        { label: 'Más de 15 días', value: 20 }
    ];

    ngOnInit(): void {
        this.loadOpportunities();
        this.loadMarcas();
    }

    loadOpportunities(): void {
        this.loading.set(true);
        this.providerPortalService.getOpportunities({ status: this.activeStatus() }).subscribe({
            next: (response: any) => {
                const items = (response.data || []).map((item: any) => ({
                    ...item,
                    form_costo: item.form_costo || null,
                    form_dias_entrega: item.form_dias_entrega !== undefined ? item.form_dias_entrega : 0,
                    form_marca_id: item.form_marca_id || item.marca_id,
                    form_comentario: item.form_comentario || '',
                    submitting: false,
                    already_costed: item.already_costed || false
                }));
                this.opportunities.set(items);
                
                if (response.provider) {
                    this.providerInfo.set(response.provider);
                }
                this.loading.set(false);
            },
            error: (error) => {
                const errorMsg = error.error?.message || 'No se pudieron cargar las oportunidades.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.loading.set(false);
            }
        });
    }

    private loadMarcas(): void {
        this.listaService.getByTipo('Fabricantes').subscribe({
            next: (marcas: Lista[]) => {
                this.marcas = marcas.map((m: Lista) => ({ label: m.nombre, value: m.id }));
            }
        });
    }

    submitCost(ref: any): void {
        ref.submitting = true;

        const payload = {
            pedido_referencia_id: ref.id,
            costo_unidad: ref.form_costo,
            dias_entrega: ref.form_dias_entrega,
            marca_id: ref.form_marca_id,
            comentario: ref.form_comentario
        };

        this.providerPortalService.submitCost(payload).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Oferta enviada correctamente.' });
                this.opportunities.set(this.opportunities().filter(o => o.id !== ref.id));
            },
            error: (error: any) => {
                const errorMsg = error.error?.message || 'Error al enviar la oferta.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                ref.submitting = false;
            }
        });
    }

    onStatusChange(status: any): void {
        if (status) {
            this.activeStatus.set(status);
            this.loadOpportunities();
        }
    }
}
