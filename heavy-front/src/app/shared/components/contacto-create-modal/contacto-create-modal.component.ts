import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ContactoService } from '../../../core/services/contacto.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { CreateContactoDto } from '../../../core/models/contacto.model';

@Component({
    selector: 'app-contacto-create-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, ToastModule],
    template: `
        <p-dialog [(visible)]="visible" [modal]="true" [style]="{ width: '600px' }" header="Crear contacto" (onHide)="closeDialog()" styleClass="p-fluid theme-dialog">
            <form [formGroup]="createContactoForm" (ngSubmit)="saveContacto(false)">
                <!-- Nombre y Cargo -->
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="field">
                        <label for="nombre" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre <span class="text-red-500">*</span></label>
                        <input
                            type="text"
                            pInputText
                            id="nombre"
                            formControlName="nombre"
                            placeholder="Nombre completo"
                            class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                        />
                        <small *ngIf="createContactoForm.get('nombre')?.invalid && createContactoForm.get('nombre')?.touched" class="text-red-400 text-xs block mt-1"> Requerido </small>
                    </div>

                    <div class="field">
                        <label for="cargo" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Cargo</label>
                        <input
                            type="text"
                            pInputText
                            id="cargo"
                            formControlName="cargo"
                            placeholder="Ej. Gerente Comercial"
                            class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                        />
                    </div>
                </div>

                <!-- País y Teléfono -->
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="field">
                        <label for="pais" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">País</label>
                        <p-select
                            [options]="paises"
                            formControlName="pais"
                            optionLabel="name"
                            placeholder="Seleccionar"
                            styleClass="w-full !bg-white dark:!bg-slate-900 !border-slate-300 dark:!border-slate-700 !text-slate-900 dark:!text-slate-100"
                            (onChange)="onPaisChange($event)"
                            [filter]="true"
                            filterBy="name"
                        ></p-select>
                    </div>
                    <div class="field">
                        <label for="telefono" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Teléfono <span class="text-red-500">*</span></label>
                        <!-- Input Group Unificado -->
                        <div class="flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500 transition-all overflow-hidden relative">
                            <span class="flex items-center justify-center px-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-r border-slate-300 dark:border-slate-700 min-w-[3.5rem]">
                                {{ createContactoForm.get('indicativo')?.value || '+??' }}
                            </span>
                            <input type="text" pInputText id="telefono" formControlName="telefono" placeholder="300 123 4567" class="w-full border-none bg-transparent text-slate-900 dark:text-slate-100 focus:ring-0 shadow-none px-3" />
                            <span class="flex items-center justify-center px-3 text-slate-500">
                                <i class="pi pi-phone text-sm"></i>
                            </span>
                        </div>
                        <small *ngIf="createContactoForm.get('telefono')?.invalid && createContactoForm.get('telefono')?.touched" class="text-red-400 text-xs block mt-1"> Requerido </small>
                    </div>
                </div>

                <!-- Email y Principal -->
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="field">
                        <label for="email" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Email</label>
                        <div class="flex rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500 transition-all overflow-hidden">
                            <input type="email" pInputText id="email" formControlName="email" placeholder="nombre@empresa.com" class="w-full border-none bg-transparent text-slate-900 dark:text-slate-100 focus:ring-0 shadow-none px-3" />
                            <span class="flex items-center justify-center px-3 text-slate-500 border-l border-slate-100 dark:border-slate-800">
                                <i class="pi pi-envelope text-sm"></i>
                            </span>
                        </div>
                        <small *ngIf="createContactoForm.get('email')?.invalid && createContactoForm.get('email')?.touched" class="text-red-400 text-xs block mt-1"> Email inválido </small>
                    </div>
                    <div class="field flex items-center mt-6">
                        <p-toggleSwitch formControlName="principal" inputId="principal" styleClass="scale-75"></p-toggleSwitch>
                        <label for="principal" class="ml-3 text-slate-600 dark:text-slate-300 text-sm cursor-pointer select-none">Contacto Principal</label>
                    </div>
                </div>

                <!-- Botones / Footer -->
                <div class="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        pButton
                        pRipple
                        type="button"
                        label="Cancelar"
                        class="p-button-text text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                        (click)="closeDialog()"
                    ></button>

                    <button
                        pButton
                        pRipple
                        type="button"
                        label="Guardar y crear otro"
                        class="p-button-outlined border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500"
                        [loading]="loading"
                        [disabled]="createContactoForm.invalid"
                        (click)="saveContacto(true)"
                    ></button>

                    <button pButton pRipple type="submit" label="Crear Contacto" class="bg-yellow-500 text-zinc-900 border-yellow-500 hover:bg-yellow-400 font-bold px-6" [loading]="loading" [disabled]="createContactoForm.invalid"></button>
                </div>
            </form>
        </p-dialog>
    `,
    // Estilos para forzar sobreescritura limpia de PrimeNG solo en modo oscuro
    styles: [
        `
            :host ::ng-deep .p-inputtext:enabled:focus {
                box-shadow: none !important;
            }

            /* Solo aplicar overrides de colores oscuros cuando la clase .app-dark está presente */
            :host ::ng-deep .app-dark .p-dropdown {
                background: #0f172a !important; /* slate-900 */
                border-color: #334155 !important; /* slate-700 */
            }
            :host ::ng-deep .app-dark .p-dropdown-label {
                color: #f1f5f9 !important; /* slate-100 */
            }
            :host ::ng-deep .app-dark .p-dropdown-trigger {
                color: #94a3b8 !important; /* slate-400 */
            }
            :host ::ng-deep .app-dark .p-dropdown-panel {
                background: #1e293b !important; /* slate-800 */
                border-color: #334155 !important;
            }
            :host ::ng-deep .app-dark .p-dropdown-item {
                color: #e2e8f0 !important;
            }
            :host ::ng-deep .app-dark .p-dropdown-item:hover,
            :host ::ng-deep .app-dark .p-dropdown-item.p-highlight {
                background: #334155 !important; /* slate-700 */
                color: #f8fafc !important;
            }
        `
    ]
})
export class ContactoCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly contactoService = inject(ContactoService);
    private readonly ubicacionService = inject(UbicacionService);
    private readonly messageService = inject(MessageService);

    @Input() visible = false;
    @Input() terceroId: number | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onContactoCreated = new EventEmitter<any>();

    createContactoForm: FormGroup;
    loading = false;
    paises: any[] = [];

    constructor() {
        this.createContactoForm = this.fb.group({
            nombre: ['', [Validators.required]],
            cargo: [''],
            pais: [null],
            indicativo: ['+57'],
            telefono: ['', [Validators.required]],
            email: ['', [Validators.email]],
            principal: [false],
            tercero_id: [null]
        });
    }

    ngOnInit(): void {
        this.loadPaises();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue) {
            if (!this.paises.length) {
                this.loadPaises();
            } else {
                this.resetForm();
            }
        }

        if (changes['terceroId'] && changes['terceroId'].currentValue) {
            this.createContactoForm.patchValue({ tercero_id: this.terceroId });
        }
    }

    loadPaises(): void {
        this.ubicacionService.getCountries().subscribe({
            next: (response) => {
                this.paises = response.data;
                const colombia = this.paises.find((p) => p.iso2 === 'CO' || p.name === 'Colombia');
                if (colombia) {
                    this.createContactoForm.patchValue({
                        pais: colombia,
                        indicativo: `+${colombia.phonecode}`
                    });
                }
            },
            error: (err) => console.error('Error cargando países', err)
        });
    }

    onPaisChange(event: any): void {
        const pais = event.value;
        if (pais && pais.phonecode) {
            this.createContactoForm.patchValue({ indicativo: `+${pais.phonecode}` });
        }
    }

    resetForm(): void {
        const colombia = this.paises.find((p) => p.iso2 === 'CO' || p.name === 'Colombia');
        this.createContactoForm.reset({
            pais: colombia,
            indicativo: colombia ? `+${colombia.phonecode}` : '+57',
            principal: false,
            tercero_id: this.terceroId
        });
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveContacto(createAnother: boolean): void {
        if (this.createContactoForm.invalid) {
            this.createContactoForm.markAllAsTouched();
            return;
        }

        if (!this.terceroId && !this.createContactoForm.get('tercero_id')?.value) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Es necesario asociar un cliente al contacto.'
            });
            return;
        }

        this.loading = true;

        const formValue = this.createContactoForm.value;
        const contactoData: CreateContactoDto = {
            tercero_id: this.terceroId || formValue.tercero_id,
            nombre: formValue.nombre,
            cargo: formValue.cargo,
            indicativo: formValue.indicativo,
            telefono: formValue.telefono,
            email: formValue.email,
            principal: formValue.principal
        };

        this.contactoService.create(contactoData).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Contacto creado correctamente' });
                this.onContactoCreated.emit(response.data);

                if (createAnother) {
                    this.resetForm();
                } else {
                    this.closeDialog();
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando contacto', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el contacto' });
            }
        });
    }
}
