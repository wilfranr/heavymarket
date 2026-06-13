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
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

@Component({
    selector: 'app-contacto-create-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, ToastModule, AutoFocusDirective],
    template: `
        <p-dialog [(visible)]="visible" [modal]="true" [style]="{ width: '600px' }" header="Crear contacto" (onHide)="closeDialog()" styleClass="hm-dialog p-fluid">
            <form [formGroup]="createContactoForm" (ngSubmit)="saveContacto(false)">
                <!-- Nombre y Cargo -->
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="field">
                        <label for="nombre" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre <span class="text-red-500">*</span></label>
                        <input appAutoFocus type="text" pInputText id="nombre" formControlName="nombre" placeholder="Nombre completo" class="w-full" />
                        <small *ngIf="createContactoForm.get('nombre')?.invalid && createContactoForm.get('nombre')?.touched" class="text-red-400 text-xs block mt-1"> Requerido </small>
                    </div>

                    <div class="field">
                        <label for="cargo" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Cargo</label>
                        <input type="text" pInputText id="cargo" formControlName="cargo" placeholder="Ej. Gerente Comercial" class="w-full" />
                    </div>
                </div>

                <!-- País y Teléfono -->
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="field">
                        <label for="pais" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">País</label>
                        <p-select [options]="paises" formControlName="pais" optionLabel="name" placeholder="Seleccionar" styleClass="w-full" (onChange)="onPaisChange($event)" [filter]="true" filterBy="name" appendTo="body"></p-select>
                    </div>
                    <div class="field">
                        <label for="telefono" class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Teléfono <span class="text-red-500">*</span></label>
                        <!-- Input Group Unificado con Variables de Theming -->
                        <div class="flex rounded-md border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] focus-within:border-[var(--p-primary-color)] transition-all overflow-hidden relative w-full">
                            <span class="flex items-center justify-center px-3 bg-[var(--p-content-background)] text-[var(--p-text-muted-color)] text-sm border-r border-[var(--p-content-border-color)] min-w-[3.5rem]">
                                {{ createContactoForm.get('indicativo')?.value || '+??' }}
                            </span>
                            <input type="text" pInputText id="telefono" formControlName="telefono" placeholder="300 123 4567" class="w-full border-none bg-transparent text-[var(--p-text-color)] focus:ring-0 shadow-none px-3" />
                            <span class="flex items-center justify-center px-3 text-[var(--p-text-muted-color)]">
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
                        <div class="flex rounded-md border border-[var(--p-content-border-color)] bg-[var(--p-content-background)] focus-within:border-[var(--p-primary-color)] transition-all overflow-hidden w-full">
                            <input type="email" pInputText id="email" formControlName="email" placeholder="nombre@empresa.com" class="w-full border-none bg-transparent text-[var(--p-text-color)] focus:ring-0 shadow-none px-3" />
                            <span class="flex items-center justify-center px-3 text-[var(--p-text-muted-color)] border-l border-[var(--p-content-border-color)] bg-[var(--p-content-background)]">
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
                <div class="flex items-center justify-end gap-3 pt-6 border-t border-[var(--p-content-border-color)] bg-[var(--p-content-background)]">
                    <p-button label="Cancelar" [text]="true" severity="secondary" (onClick)="closeDialog()"></p-button>

                    <p-button label="Guardar y crear otro" [outlined]="true" severity="secondary" [loading]="loading" [disabled]="createContactoForm.invalid" (onClick)="saveContacto(true)"></p-button>

                    <p-button type="submit" label="Crear Contacto" [loading]="loading" [disabled]="createContactoForm.invalid"></p-button>
                </div>
            </form>
        </p-dialog>
    `,
    styles: []
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
