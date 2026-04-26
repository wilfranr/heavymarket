import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

import { createArticulo } from '../../../store/articulos/actions/articulos.actions';
import { CreateArticuloDto } from '../../../core/models/articulo.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { Referencia } from '../../../core/models/referencia.model';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';

/**
 * Componente de creación de artículo
 */
@Component({
    selector: 'app-articulo-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DividerModule, DialogModule, InputNumberModule, InputGroupModule, InputGroupAddonModule, ListaCreateModalComponent, ReferenciaCreateModalComponent],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);

    articuloForm!: FormGroup;
    loading = false;
    tipos: Lista[] = [];
    referenciasDisponibles: Referencia[] = [];
    referenciaService = inject(ReferenciaService);

    // Variables para el modal de creación de tipo
    showTipoModal = false;

    // Variables para el modal de creación de referencia
    showReferenciaModal = false;
    currentReferenciaArrayIndex: number | null = null;

    // Tipo seleccionado para previsualización
    selectedTipoData: Lista | null = null;

    // Variables para el conversor de peso
    showWeightConverter = false;
    pesoOrigen: number | null = null;
    unidadOrigen = 'g';
    unidadesPeso = [
        { label: 'Gramos (gr)', value: 'g' },
        { label: 'Libras (lb)', value: 'lb' },
        { label: 'Onzas (oz)', value: 'oz' },
        { label: 'Toneladas (t)', value: 't' }
    ];



    // Archivos seleccionados
    fotoFile: File | null = null;
    planoFile: File | null = null;

    // Término de búsqueda para referencias cruzadas
    searchTermReferences = '';

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarReferencias();
    }

    /**
     * Determina si una fila de referencia debe mostrarse según el término de búsqueda
     */
    shouldShowReference(id: number): boolean {
        if (!this.searchTermReferences) return true;

        const ref = this.getReferenciaDetail(id);
        if (!ref) return false;

        const term = this.searchTermReferences.toLowerCase();
        return ref.referencia.toLowerCase().includes(term) ||
            (ref.marca?.nombre?.toLowerCase().includes(term) || false);
    }

    /**
     * Carga las piezas estándar disponibles (Pieza Estandar)
     * @param search Término de búsqueda opcional
     */
    cargarTipos(search?: string): void {
        this.listaService.getByTipo('Piezas Estandar', search).subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                 console.error('Error al cargar piezas estándar:', error);
            }
        });
    }

    /**
     * Carga las referencias disponibles para el selector de referencias cruzadas
     * @param search Término de búsqueda opcional
     */
    cargarReferencias(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                this.referenciasDisponibles = res.data;
            }
        });
    }

    /**
     * Abre el modal para crear una nueva pieza estándar
     */
    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    /**
     * Maneja la creación exitosa de una pieza estándar
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos(); // Recargar la lista
        this.articuloForm.patchValue({ definicion: nuevoTipo.nombre }); // Seleccionarlo
        this.selectedTipoData = nuevoTipo;
        this.showTipoModal = false;
    }

    /**
     * Abre el modal para crear una nueva referencia
     * @param index Índice del FormArray
     */
    abrirCrearReferencia(index: number): void {
        this.currentReferenciaArrayIndex = index;
        this.showReferenciaModal = true;
    }

    /**
     * Maneja la creación exitosa de una referencia
     */
    onReferenciaCreada(nuevaRef: any): void {
        this.cargarReferencias(); // Recargar disponibles

        if (this.currentReferenciaArrayIndex !== null) {
            const control = this.referenciasCruzadas.at(this.currentReferenciaArrayIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
        }

        this.showReferenciaModal = false;
        this.currentReferenciaArrayIndex = null;
    }

    /**
     * Maneja el evento de filtrado de referencias
     */
    onFilterReferencias(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarReferencias(search);
        } else if (!search) {
            this.cargarReferencias();
        }
    }

    getReferenciaDetail(id: number): Referencia | undefined {
        return this.referenciasDisponibles.find(r => r.id === id);
    }

    /**
     * Maneja el evento de filtrado del dropdown
     */
    onFilter(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarTipos(search);
        } else if (!search) {
            this.cargarTipos();
        }
    }

    /**
     * Maneja el cambio de selección en el dropdown
     */
    onTipoChange(event: any): void {
        const nombre = event.value;
        if (nombre) {
            const found = this.tipos.find(t => t.nombre === nombre);
            if (found) {
                this.selectedTipoData = found;
            }
        } else {
            this.selectedTipoData = null;
        }
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.articuloForm = this.fb.group({
            definicion: ['', [Validators.required, Validators.maxLength(255)]],
            descripcionEspecifica: ['', [Validators.required, Validators.maxLength(500)]],
            peso: [null],
            comentarios: [''],
            fotoDescriptiva: [null],
            foto_medida: [null],
            referenciasCruzadas: this.fb.array([])
        });
    }

    /**
     * Getter para el FormArray de referencias cruzadas
     */
    get referenciasCruzadas(): FormArray {
        return this.articuloForm.get('referenciasCruzadas') as FormArray;
    }

    /**
     * Agrega una nueva fila de referencia cruzada
     */
    agregarReferencia(): void {
        const row = this.fb.group({
            referencia_id: [null, Validators.required]
        });
        this.referenciasCruzadas.push(row);
    }

    /**
     * Elimina una fila de referencia cruzada
     */
    eliminarReferencia(index: number): void {
        this.referenciasCruzadas.removeAt(index);
    }

    /**
     * Abre el conversor de peso
     */
    abrirConversor(): void {
        this.showWeightConverter = true;
    }

    /**
     * Realiza la conversión de peso a Kg
     */
    convertirPeso(): void {
        if (this.pesoOrigen === null) return;

        let pesoKg = 0;
        const valor = this.pesoOrigen;

        switch (this.unidadOrigen) {
            case 'g':
                pesoKg = valor / 1000;
                break;
            case 'lb':
                pesoKg = valor * 0.453592;
                break;
            case 'oz':
                pesoKg = valor * 0.0283495;
                break;
            case 't':
                pesoKg = valor * 1000;
                break;
            default:
                pesoKg = valor;
        }

        // Redondear a 3 decimales
        const resultado = Math.round(pesoKg * 1000) / 1000;
        this.articuloForm.patchValue({ peso: resultado });
        this.showWeightConverter = false;
        this.pesoOrigen = null;
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onPlanoSelected(file: File): void {
        this.planoFile = file;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        const referenciasIds = this.articuloForm.get('referenciasCruzadas')?.value?.map((ref: any) => ref.referencia_id) || [];
        
        if (referenciasIds.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validación',
                detail: 'Debe asociar al menos una referencia al artículo'
            });
            return;
        }

        if (this.articuloForm.invalid) {
            this.markFormGroupTouched(this.articuloForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.articuloForm.value;
        const formData = new FormData();

        formData.append('definicion', formValue.definicion);
        formData.append('descripcionEspecifica', formValue.descripcionEspecifica);

        if (formValue.peso) formData.append('peso', formValue.peso.toString());
        if (formValue.comentarios) formData.append('comentarios', formValue.comentarios);

        if (this.fotoFile) formData.append('fotoDescriptiva', this.fotoFile);
        if (this.planoFile) formData.append('foto_medida', this.planoFile);

        referenciasIds.forEach((id: number) => {
            formData.append('referencias_ids[]', id.toString());
        });

        this.store.dispatch(createArticulo({ data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).articulos)
            .subscribe((articulosState: any) => {
                if (!articulosState.loading && !articulosState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/articulos']);
                } else if (!articulosState.loading && articulosState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/articulos']);
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
