import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { TextareaModule } from 'primeng/textarea';
import { PopoverModule } from 'primeng/popover';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { createMaquina } from '../../../store/maquinas/actions/maquinas.actions';
import { CreateMaquinaDto } from '../../../core/models/maquina.model';
import { ListaService } from '../../../core/services/lista.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { Lista } from '../../../core/models/lista.model';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de creación de máquina
 */
@Component({
    selector: 'app-maquina-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        DividerModule,
        InputGroupModule,
        InputGroupAddonModule,
        TextareaModule,
        PopoverModule,
        TooltipModule,
        ImageUploadComponent,
        ListaCreateModalComponent
    ],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly sistemaService = inject(SistemaService);

    maquinaForm!: FormGroup;
    loading = false;
    tipos: Lista[] = [];
    fabricantes: Fabricante[] = [];
    sistemas: any[] = [];
    marcasYFabricantes: Lista[] = [];

    showTipoModal = false;
    showFabricanteModal = false;

    fotoFile: File | null = null;
    fotoIdFile: File | null = null;

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarFabricantes();
        this.cargarSistemas();
        this.cargarMarcasYFabricantes();
    }

    /**
     * Carga los tipos de máquina disponibles
     */
    cargarTipos(): void {
        this.listaService.getByTipo('Tipo de Máquina').subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
    }

    /**
     * Carga los fabricantes disponibles
     */
    cargarFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data;
            },
            error: (error) => {
                console.error('Error al cargar fabricantes:', error);
            }
        });
    }

    /**
     * Carga los sistemas disponibles
     */
    cargarSistemas(): void {
        this.sistemaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.sistemas = response.data;
            },
            error: (error) => {
                console.error('Error al cargar sistemas:', error);
            }
        });
    }

    /**
     * Carga las marcas y fabricantes unificados
     */
    cargarMarcasYFabricantes(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (marcas) => {
                this.marcasYFabricantes = marcas;
            },
            error: (error) => {
                console.error('Error al cargar marcas y fabricantes:', error);
            }
        });
    }

    /**
     * Abre el modal para crear un nuevo tipo de máquina
     */
    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    /**
     * Maneja la creación de un nuevo tipo de máquina
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos();
        this.maquinaForm.patchValue({ tipo: nuevoTipo.id });
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.maquinaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            modelo: ['', [Validators.required, Validators.maxLength(255)]],
            fabricante_id: [null, [Validators.required]],
            serie: ['', [Validators.maxLength(255)]],
            arreglo: ['', [Validators.maxLength(255)]],
            foto: [null],
            fotoId: [null],
            componentes: this.fb.array([])
        });
    }

    /**
     * Getter para el FormArray de componentes
     */
    get componentes(): FormArray {
        return this.maquinaForm.get('componentes') as FormArray;
    }

    /**
     * Agrega un nuevo componente al formulario
     */
    addComponente(): void {
        const componenteForm = this.fb.group({
            sistema_id: [null],
            marca_id: [null],
            modelo: [''],
            serie: [''],
            comentario: [''],
            foto_placa: [null],
            fotoPlacaFile: [null] // Helper para el archivo real
        });
        this.componentes.push(componenteForm);
    }

    /**
     * Elimina un componente del formulario
     */
    removeComponente(index: number): void {
        this.componentes.removeAt(index);
    }

    /**
     * Duplica un componente existente
     */
    duplicateComponente(index: number): void {
        const source = this.componentes.at(index).value;
        const componenteForm = this.fb.group({
            sistema_id: [source.sistema_id],
            marca_id: [source.marca_id],
            modelo: [source.modelo],
            serie: [source.serie],
            comentario: [source.comentario],
            foto_placa: [null],
            fotoPlacaFile: [null]
        });
        this.componentes.push(componenteForm);
    }

    /**
     * Maneja la selección de foto de placa para un componente
     */
    onFotoPlacaSelected(file: File, index: number): void {
        const control = this.componentes.at(index);
        control.patchValue({ fotoPlacaFile: file });
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onFotoIdSelected(file: File): void {
        this.fotoIdFile = file;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.maquinaForm.invalid) {
            this.markFormGroupTouched(this.maquinaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.maquinaForm.value;
        const formData = new FormData();

        formData.append('tipo', formValue.tipo);
        formData.append('modelo', formValue.modelo);
        formData.append('fabricante_id', formValue.fabricante_id);
        if (formValue.serie) formData.append('serie', formValue.serie);
        if (formValue.arreglo) formData.append('arreglo', formValue.arreglo);

        if (this.fotoFile) formData.append('foto', this.fotoFile);
        if (this.fotoIdFile) formData.append('fotoId', this.fotoIdFile);

        // Agregar componentes
        formValue.componentes.forEach((comp: any, index: number) => {
            if (comp.sistema_id) formData.append(`componentes[${index}][sistema_id]`, comp.sistema_id);
            if (comp.marca_id) formData.append(`componentes[${index}][marca_id]`, comp.marca_id);
            if (comp.modelo) formData.append(`componentes[${index}][modelo]`, comp.modelo);
            if (comp.serie) formData.append(`componentes[${index}][serie]`, comp.serie);
            if (comp.comentario) formData.append(`componentes[${index}][comentario]`, comp.comentario);

            if (comp.fotoPlacaFile) {
                formData.append(`componentes[${index}][foto_placa]`, comp.fotoPlacaFile);
            }
        });

        this.store.dispatch(createMaquina({ data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).maquinas)
            .subscribe((maquinasState: any) => {
                if (!maquinasState.loading && !maquinasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/maquinas']);
                } else if (!maquinasState.loading && maquinasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/maquinas']);
    }

    /**
     * Marca todos los campos del formulario como touched
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
