import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { PopoverModule } from 'primeng/popover';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { loadMaquinaById, updateMaquina } from '../../../store/maquinas/actions/maquinas.actions';
import { selectMaquinaById } from '../../../store/maquinas/selectors/maquinas.selectors';
import { ESTADO_REVISION_LABELS, Maquina, normalizeEstadoRevision } from '../../../core/models/maquina.model';
import { ListaService } from '../../../core/services/lista.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { Lista } from '../../../core/models/lista.model';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de edición de máquina
 */
@Component({
    selector: 'app-maquina-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, SelectModule, ToastModule, TooltipModule, DividerModule, TagModule, TextareaModule, PopoverModule, ImageUploadComponent],
    providers: [MessageService],
    templateUrl: './edit.html'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly sistemaService = inject(SistemaService);

    maquinaForm!: FormGroup;
    maquina$!: Observable<any>;
    maquinaId!: number;
    loading = false;
    tipos: Lista[] = [];
    fabricantes: Fabricante[] = [];
    sistemas: any[] = [];
    marcasYFabricantes: Lista[] = [];

    fotoFile: File | null = null;
    fotoIdFile: File | null = null;

    ngOnInit(): void {
        this.cargarTipos();
        this.cargarFabricantes();
        this.cargarSistemas();
        this.cargarMarcasYFabricantes();

        this.route.params.subscribe((params) => {
            this.maquinaId = +params['id'];
            this.store.dispatch(loadMaquinaById({ id: this.maquinaId }));
            this.maquina$ = this.store.select(selectMaquinaById(this.maquinaId));

            this.maquina$.subscribe((maquina) => {
                if (maquina) {
                    this.initForm(maquina);
                }
            });
        });
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
     * Inicializa el formulario con los datos de la máquina
     */
    private initForm(maquina: any): void {
        this.maquinaForm = this.fb.group({
            tipo: [maquina.tipo_id ? +maquina.tipo_id : maquina.tipo?.id ? +maquina.tipo.id : maquina.tipo ? +maquina.tipo : null, [Validators.required]],
            modelo: [maquina.modelo, [Validators.required, Validators.maxLength(255)]],
            fabricante_id: [maquina.fabricante_id ? +maquina.fabricante_id : maquina.fabricante?.id ? +maquina.fabricante.id : null, [Validators.required]],
            serie: [maquina.serie || ''],
            arreglo: [maquina.arreglo || ''],
            foto: [maquina.foto || null],
            fotoId: [maquina.fotoId || null],
            componentes: this.fb.array([])
        });

        // Poblar componentes si existen
        if (maquina.componentes && maquina.componentes.length > 0) {
            maquina.componentes.forEach((comp: any) => {
                this.addComponente(comp);
            });
        }
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
    addComponente(data?: any): void {
        const componenteForm = this.fb.group({
            id: [data?.id ? +data.id : null],
            sistema_id: [data?.sistema_id ? +data.sistema_id : null],
            marca_id: [data?.marca_id ? +data.marca_id : null],
            modelo: [data?.modelo || ''],
            serie: [data?.serie || ''],
            comentario: [data?.comentario || ''],
            foto_placa: [data?.foto_placa || null],
            fotoPlacaFile: [null]
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
        this.addComponente({
            sistema_id: source.sistema_id,
            marca_id: source.marca_id,
            modelo: source.modelo,
            serie: source.serie,
            comentario: source.comentario
        });
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
            if (comp.id) formData.append(`componentes[${index}][id]`, comp.id);
            if (comp.sistema_id) formData.append(`componentes[${index}][sistema_id]`, comp.sistema_id);
            if (comp.marca_id) formData.append(`componentes[${index}][marca_id]`, comp.marca_id);
            if (comp.modelo) formData.append(`componentes[${index}][modelo]`, comp.modelo);
            if (comp.serie) formData.append(`componentes[${index}][serie]`, comp.serie);
            if (comp.comentario) formData.append(`componentes[${index}][comentario]`, comp.comentario);

            if (comp.fotoPlacaFile) {
                formData.append(`componentes[${index}][foto_placa]`, comp.fotoPlacaFile);
            }
        });

        this.store.dispatch(updateMaquina({ id: this.maquinaId, data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).maquinas)
            .subscribe((maquinasState: any) => {
                if (!maquinasState.loading && !maquinasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/maquinas', this.maquinaId]);
                } else if (!maquinasState.loading && maquinasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/maquinas', this.maquinaId]);
    }

    /**
     * Marca todos los campos del formulario como touched
     */
    etiquetaEstadoRevision(m: Maquina): string {
        return ESTADO_REVISION_LABELS[normalizeEstadoRevision(m.estado_revision)];
    }

    severidadEstadoRevision(m: Maquina): 'success' | 'warn' {
        return normalizeEstadoRevision(m.estado_revision) === 'revisado' ? 'success' : 'warn';
    }

    esPorRevisar(m: Maquina): boolean {
        return normalizeEstadoRevision(m.estado_revision) === 'por_revisar';
    }

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
