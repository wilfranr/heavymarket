import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ProviderPortalService } from '../services/provider-portal.service';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';

@Component({
    selector: 'app-costing-opportunities',
    standalone: true,
    imports: [CommonModule, TableModule, ButtonModule, DialogModule, ReactiveFormsModule, InputTextModule, InputNumberModule, ToastModule, SelectModule, TagModule],
    providers: [MessageService],
    template: `
        <div class="card">
            <div class="flex justify-content-between align-items-center mb-4">
                <h2 class="m-0"><i class="pi pi-bolt text-emerald-600 mr-2"></i>Oportunidades de Costeo</h2>
                <p-button icon="pi pi-refresh" [loading]="loading()" (onClick)="loadOpportunities()" [outlined]="true" label="Actualizar"></p-button>
            </div>

            <p-table [value]="opportunities()" [loading]="loading()" [rows]="10" [paginator]="true" responsiveLayout="scroll" styleClass="p-datatable-gridlines">
                <ng-template pTemplate="header">
                    <tr>
                        <th>Ref. Pedido</th>
                        <th>Descripción / Definición</th>
                        <th>Marca Requerida</th>
                        <th>Categoría</th>
                        <th class="text-center">Cantidad</th>
                        <th class="text-center">Acción</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-ref>
                    <tr>
                        <td class="font-bold text-primary">#{{ ref.id }}</td>
                        <td>
                            <div class="flex flex-column">
                                <span class="font-medium">{{ ref.referencia?.referencia || 'N/A' }}</span>
                                <small class="text-gray-500">{{ ref.definicion }}</small>
                            </div>
                        </td>
                        <td>
                            <p-tag [value]="ref.marca?.nombre || 'N/A'" severity="info"></p-tag>
                        </td>
                        <td>{{ ref.categoria_comercial?.nombre || 'N/A' }}</td>
                        <td class="text-center font-bold">{{ ref.cantidad }}</td>
                        <td class="text-center">
                            <p-button label="Costear" icon="pi pi-dollar" severity="success" (onClick)="openCostingDialog(ref)"></p-button>
                        </td>
                    </tr>
                </ng-template>
                <ng-template pTemplate="emptymessage">
                    <tr>
                        <td colspan="6" class="text-center py-5">
                            <i class="pi pi-info-circle text-4xl text-gray-400 mb-3"></i>
                            <p class="text-gray-500">No hay nuevas piezas disponibles para su especialidad en este momento.</p>
                        </td>
                    </tr>
                </ng-template>
            </p-table>
        </div>

        <!-- Diálogo de Costeo -->
        <p-dialog [(visible)]="displayDialog" [header]="'Enviar Oferta de Costeo'" [modal]="true" [style]="{ width: '450px' }" [draggable]="false">
            @if (selectedRef) {
                <div class="mb-4 p-3 bg-surface-50 dark:bg-surface-800 border-round">
                    <div class="mb-2"><strong>Pieza:</strong> {{ selectedRef.referencia?.referencia }}</div>
                    <div><strong>Cantidad Requerida:</strong> {{ selectedRef.cantidad }} unidades</div>
                </div>

                <form [formGroup]="costingForm" (ngSubmit)="onSubmit()">
                    <div class="field mb-4">
                        <label for="costo" class="block font-bold mb-2">Precio de Costo (Unidad) <span class="text-red-500">*</span></label>
                        <p-inputNumber id="costo" formControlName="costo_unidad" mode="currency" currency="USD" locale="en-US" styleClass="w-full" [min]="0"></p-inputNumber>
                        @if (costingForm.get('costo_unidad')?.invalid && costingForm.get('costo_unidad')?.touched) {
                            <small class="p-error">El precio de costo es requerido.</small>
                        }
                    </div>

                    <div class="field mb-4">
                        <label for="dias" class="block font-bold mb-2">Días de Entrega <span class="text-red-500">*</span></label>
                        <p-inputNumber id="dias" formControlName="dias_entrega" [showButtons]="true" [min]="0" suffix=" días" styleClass="w-full"></p-inputNumber>
                        @if (costingForm.get('dias_entrega')?.invalid && costingForm.get('dias_entrega')?.touched) {
                            <small class="p-error">Especifique el tiempo de entrega.</small>
                        }
                    </div>

                    <div class="field mb-4">
                        <label for="marca" class="block font-bold mb-2">Marca Ofrecida (Opcional)</label>
                        <p-select [options]="marcas" formControlName="marca_id" optionLabel="label" optionValue="value" [filter]="true" placeholder="Dejar original ({{ selectedRef.marca?.nombre }})" styleClass="w-full" [showClear]="true"></p-select>
                    </div>

                    <div class="field mb-4">
                        <label for="comentario" class="block font-bold mb-2">Observaciones</label>
                        <textarea pInputTextarea id="comentario" formControlName="comentario" rows="3" class="w-full p-inputtext p-component" placeholder="Notas adicionales sobre stock, procedencia, etc."></textarea>
                    </div>

                    <div class="flex justify-content-end gap-2 mt-5">
                        <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (onClick)="displayDialog = false" [disabled]="submitting()"></p-button>
                        <p-button label="Enviar Costeo" icon="pi pi-check" severity="success" type="submit" [loading]="submitting()" [disabled]="costingForm.invalid"></p-button>
                    </div>
                </form>
            }
        </p-dialog>

        <p-toast></p-toast>
    `,
    styles: []
})
export class CostingOpportunitiesComponent implements OnInit {
    private providerPortalService = inject(ProviderPortalService);
    private listaService = inject(ListaService);
    private fb = inject(FormBuilder);
    private messageService = inject(MessageService);

    opportunities = signal<any[]>([]);
    loading = signal(false);
    submitting = signal(false);
    displayDialog = false;
    selectedRef: any = null;
    marcas: any[] = [];
    costingForm!: FormGroup;

    ngOnInit(): void {
        this.initForm();
        this.loadOpportunities();
        this.loadMarcas();
    }

    private initForm(): void {
        this.costingForm = this.fb.group({
            costo_unidad: [null, [Validators.required, Validators.min(0)]],
            dias_entrega: [null, [Validators.required, Validators.min(0)]],
            marca_id: [null],
            comentario: ['']
        });
    }

    loadOpportunities(): void {
        this.loading.set(true);
        this.providerPortalService.getOpportunities().subscribe({
            next: (response) => {
                this.opportunities.set(response.data);
                this.loading.set(false);
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las oportunidades.' });
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

    openCostingDialog(ref: any): void {
        this.selectedRef = ref;
        this.costingForm.reset({
            costo_unidad: null,
            dias_entrega: null,
            marca_id: null,
            comentario: ''
        });
        this.displayDialog = true;
    }

    onSubmit(): void {
        if (this.costingForm.invalid || !this.selectedRef) return;

        this.submitting.set(true);
        const formValue = this.costingForm.value;

        this.providerPortalService.submitCost({
            pedido_referencia_id: this.selectedRef.id,
            ...formValue
        }).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Oferta enviada correctamente.' });
                this.displayDialog = false;
                this.submitting.set(false);
                this.loadOpportunities(); // Recargar para quitar la pieza ya costeada
            },
            error: (error: any) => {
                const errorMsg = error.error?.message || 'Error al enviar la oferta.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
                this.submitting.set(false);
            }
        });
    }
}
