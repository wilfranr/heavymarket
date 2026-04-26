import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';

import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { ListaService } from '../../../core/services/lista.service';
import { ListaCreateModalComponent } from '../lista-create-modal/lista-create-modal.component';
@Component({
    selector: 'app-maquina-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        ProgressSpinnerModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        FileUploadModule,
        ListaCreateModalComponent
    ],
    templateUrl: './maquina-create-modal.component.html',
    styles: []
})
export class MaquinaCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly listaService = inject(ListaService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() terceroId: number | null = null;
    /** Si se indica, el modal actúa en modo edición (misma UI que crear, con datos cargados). */
    @Input() maquinaId: number | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onMaquinaCreated = new EventEmitter<any>();
    @Output() onMaquinaUpdated = new EventEmitter<any>();

    createMaquinaForm!: FormGroup;
    loading = false;
    loadingMaquina = false;

    get isEditMode(): boolean {
        return this.maquinaId != null && this.maquinaId > 0;
    }

    // Listas
    tiposMaquina: any[] = [];
    fabricantes: any[] = [];

    // Modales secundarios
    showCreateTipoModal = false;

    ngOnInit(): void {
        this.initForm();
        this.loadTiposMaquina();
        this.loadFabricantes();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (!this.visible) {
            return;
        }
        if (this.isEditMode && (changes['visible'] || changes['maquinaId'])) {
            this.loadMaquinaForEdit();
            return;
        }
        if (changes['visible']?.currentValue === true && !this.isEditMode) {
            this.resetForm();
        }
    }

    private loadMaquinaForEdit(): void {
        if (!this.maquinaId) {
            return;
        }
        this.loadingMaquina = true;
        this.maquinaService
            .getById(this.maquinaId)
            .pipe(take(1))
            .subscribe({
                next: (res) => {
                    const m = res.data;
                    this.createMaquinaForm.patchValue({
                        tipo: m.tipo ? Number(m.tipo) : null,
                        fabricante_id: m.fabricante_id ? Number(m.fabricante_id) : null,
                        modelo: m.modelo,
                        serie: m.serie ?? '',
                        arreglo: m.arreglo ?? '',
                        foto: null,
                        fotoId: null
                    });
                    this.loadingMaquina = false;
                },
                error: () => {
                    this.loadingMaquina = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo cargar la máquina'
                    });
                    this.closeDialog();
                }
            });
    }

    private initForm(): void {
        this.createMaquinaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            fabricante_id: [null, [Validators.required]],
            modelo: ['', [Validators.required]],
            serie: [''],
            arreglo: [''],
            foto: [null],
            fotoId: [null]
        });
    }

    resetForm(): void {
        if (this.createMaquinaForm) {
            this.createMaquinaForm.reset();
        }
    }

    private loadTiposMaquina(): void {
        this.listaService.getAll({ tipo: 'Tipo de Máquina', per_page: 500 }).subscribe({
            next: (response) => {
                this.tiposMaquina = response.data.map(t => ({
                    label: t.nombre,
                    value: t.id
                }));
            }
        });
    }

    private loadFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data.map(f => ({
                    label: f.nombre,
                    value: f.id
                }));
            }
        });
    }

    openCreateTipoDialog(): void {
        this.showCreateTipoModal = true;
    }

    onTipoCreated(tipo: any): void {
        this.loadTiposMaquina();
        this.createMaquinaForm.patchValue({ tipo: tipo.id });
    }

    onFileSelect(event: any, fieldName: string): void {
        if (event.files && event.files.length > 0) {
            this.createMaquinaForm.patchValue({ [fieldName]: event.files[0] });
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.loadingMaquina = false;
    }

    saveMaquina(createAnother: boolean = false): void {
        if (this.createMaquinaForm.invalid) {
            this.createMaquinaForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.createMaquinaForm.value;

        if (this.isEditMode && this.maquinaId) {
            const formData = new FormData();
            formData.append('tipo', String(formValue.tipo));
            formData.append('modelo', formValue.modelo);
            formData.append('fabricante_id', String(formValue.fabricante_id));
            if (formValue.serie) {
                formData.append('serie', formValue.serie);
            }
            if (formValue.arreglo) {
                formData.append('arreglo', formValue.arreglo);
            }
            if (formValue.foto instanceof File) {
                formData.append('foto', formValue.foto);
            }
            if (formValue.fotoId instanceof File) {
                formData.append('fotoId', formValue.fotoId);
            }

            this.maquinaService.update(this.maquinaId, formData).subscribe({
                next: (response) => {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Máquina actualizada correctamente'
                    });
                    this.onMaquinaUpdated.emit(response.data);
                    this.closeDialog();
                },
                error: (error) => {
                    this.loading = false;
                    console.error('Error actualizando máquina', error);
                    let msg = 'Fallo al actualizar la máquina';
                    if (error.status === 422 && error.error?.errors) {
                        const first = Object.values(error.error.errors)[0] as string[];
                        msg = first[0] || msg;
                    } else if (error.error?.message) {
                        msg = error.error.message;
                    }
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                }
            });
            return;
        }

        const formData = new FormData();

        if (this.terceroId) {
            formData.append('tercero_id', this.terceroId.toString());
        }

        Object.keys(formValue).forEach((key) => {
            const value = formValue[key];
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });

        this.maquinaService.create(formData).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Máquina creada correctamente`
                });

                this.onMaquinaCreated.emit(response.data);

                if (createAnother) {
                    this.resetForm();
                } else {
                    this.closeDialog();
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando maquina', error);
                const msg = error.error?.message || 'Fallo al crear máquina';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
