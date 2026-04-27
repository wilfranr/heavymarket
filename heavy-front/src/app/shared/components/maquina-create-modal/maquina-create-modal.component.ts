import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { take } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import { DividerModule } from 'primeng/divider';
import { TextareaModule } from 'primeng/textarea';
import { PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { ListaService } from '../../../core/services/lista.service';
import { SistemaService } from '../../../core/services/sistema.service';
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
        DividerModule,
        TextareaModule,
        PopoverModule,
        TooltipModule,
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
    private readonly sistemaService = inject(SistemaService);
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
    sistemas: any[] = [];
    marcasYFabricantes: any[] = [];

    // Modales secundarios
    showCreateTipoModal = false;

    ngOnInit(): void {
        this.initForm();
        this.loadTiposMaquina();
        this.loadFabricantes();
        this.loadSistemas();
        this.loadMarcasYFabricantes();
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
                next: (res: any) => {
                    const m = res.data;
                    this.createMaquinaForm.patchValue({
                        tipo: m.tipo_id ? Number(m.tipo_id) : (m.tipo?.id ? Number(m.tipo.id) : (m.tipo ? Number(m.tipo) : null)),
                        fabricante_id: m.fabricante_id ? Number(m.fabricante_id) : (m.fabricante?.id ? Number(m.fabricante.id) : null),
                        modelo: m.modelo,
                        serie: m.serie ?? '',
                        arreglo: m.arreglo ?? '',
                        foto: null,
                        fotoId: null
                    });

                    // Cargar componentes
                    this.componentes.clear();
                    if (m.componentes && m.componentes.length > 0) {
                        m.componentes.forEach((comp: any) => {
                            this.addComponente(comp);
                        });
                    }

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
            fotoId: [null],
            componentes: this.fb.array([])
        });
    }

    /** Getter para componentes */
    get componentes(): FormArray {
        return this.createMaquinaForm.get('componentes') as FormArray;
    }

    /** Agrega un nuevo componente */
    addComponente(data?: any): void {
        const componenteForm = this.fb.group({
            id: [data?.id ? Number(data.id) : null],
            sistema_id: [data?.sistema_id ? Number(data.sistema_id) : null],
            marca_id: [data?.marca_id ? Number(data.marca_id) : null],
            modelo: [data?.modelo || ''],
            serie: [data?.serie || ''],
            comentario: [data?.comentario || ''],
            foto_placa: [data?.foto_placa || null],
            fotoPlacaFile: [null]
        });
        this.componentes.push(componenteForm);
    }

    /** Elimina un componente */
    removeComponente(index: number): void {
        this.componentes.removeAt(index);
    }

    /** Duplica un componente */
    duplicateComponente(index: number): void {
        const source = this.componentes.at(index).value;
        this.addComponente({
            sistema_id: source.sistema_id,
            marca_id: source.marca_id,
            modelo: source.modelo,
            serie: source.serie,
            comentario: source.comentario
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
                this.fabricantes = response.data;
            }
        });
    }

    private loadSistemas(): void {
        this.sistemaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.sistemas = response.data;
            }
        });
    }

    private loadMarcasYFabricantes(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (marcas) => {
                this.marcasYFabricantes = marcas;
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
        this.loading = true;
        const formValue = this.createMaquinaForm.value;

        const formData = new FormData();

        // Datos básicos
        formData.append('tipo', String(formValue.tipo));
        formData.append('modelo', formValue.modelo);
        formData.append('fabricante_id', String(formValue.fabricante_id));
        if (formValue.serie) formData.append('serie', formValue.serie);
        if (formValue.arreglo) formData.append('arreglo', formValue.arreglo);
        if (this.terceroId) formData.append('tercero_id', this.terceroId.toString());

        // Fotos
        if (formValue.foto instanceof File) formData.append('foto', formValue.foto);
        if (formValue.fotoId instanceof File) formData.append('fotoId', formValue.fotoId);

        // Componentes
        formValue.componentes.forEach((comp: any, index: number) => {
            if (comp.id) formData.append(`componentes[${index}][id]`, String(comp.id));
            if (comp.sistema_id) formData.append(`componentes[${index}][sistema_id]`, String(comp.sistema_id));
            if (comp.marca_id) formData.append(`componentes[${index}][marca_id]`, String(comp.marca_id));
            if (comp.modelo) formData.append(`componentes[${index}][modelo]`, comp.modelo);
            if (comp.serie) formData.append(`componentes[${index}][serie]`, comp.serie);
            if (comp.comentario) formData.append(`componentes[${index}][comentario]`, comp.comentario);
            
            if (comp.fotoPlacaFile) {
                formData.append(`componentes[${index}][foto_placa]`, comp.fotoPlacaFile);
            }
        });

        if (this.isEditMode && this.maquinaId) {
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
                    this.componentes.clear();
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

    onFotoPlacaSelected(file: File, index: number): void {
        const control = this.componentes.at(index);
        control.patchValue({ fotoPlacaFile: file });
    }
}
