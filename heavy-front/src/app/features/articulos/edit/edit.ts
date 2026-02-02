import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

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
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

import { loadArticuloById, updateArticulo } from '../../../store/articulos/actions/articulos.actions';
import { selectArticuloById } from '../../../store/articulos/selectors/articulos.selectors';
import { Articulo, ArticuloJuego, Medida, UpdateArticuloDto } from '../../../core/models/articulo.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { Referencia } from '../../../core/models/referencia.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Componente de edición de artículo
 */
@Component({
    selector: 'app-articulo-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DividerModule, DialogModule, InputNumberModule, TooltipModule, TableModule, TabsModule, TagModule, FallbackImageDirective, InputGroupModule, InputGroupAddonModule, ListaCreateModalComponent, ReferenciaCreateModalComponent, ImageUploadComponent],
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
    private readonly articuloService = inject(ArticuloService);
    private readonly referenciaService = inject(ReferenciaService);

    articuloForm!: FormGroup;
    articulo$!: Observable<any>;
    articuloId!: number;
    loading = false;
    tipos: Lista[] = [];
    referenciasDisponibles: Referencia[] = [];
    articuloActual: Articulo | null = null;

    // Variables para el modal de creación de tipo
    showTipoModal = false;

    // Variables para el modal de creación de referencia
    showReferenciaModal = false;
    currentReferenciaArrayIndex: number | null = null;

    // Variables para diálogos de relaciones
    showReferenciaDialog = false;
    selectedReferenciaId: number | null = null;

    showJuegoDialog = false;
    juegoData = { referencia_id: 0, cantidad: 1, comentario: '' };

    showMedidaDialog = false;
    isEditingMedida = false;
    medidaData: any = { identificador: '', nombre: '', unidad: '', valor: '', tipo: '' };
    editingMedidaId: number | null = null;

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
        this.cargarTipos();
        this.cargarReferencias();

        this.route.params.subscribe((params) => {
            this.articuloId = +params['id'];
            this.store.dispatch(loadArticuloById({ id: this.articuloId }));
            this.articulo$ = this.store.select(selectArticuloById(this.articuloId));

            this.articulo$.subscribe((articulo) => {
                if (articulo) {
                    this.articuloActual = articulo;
                    // Asegurar que tenemos el tipo en la lista para que el selector lo muestre
                    if (articulo.definicion) {
                        const exists = this.tipos.find(t => t.nombre === articulo.definicion);
                        if (!exists) {
                            this.tipos = [...this.tipos, { nombre: articulo.definicion } as any];
                        }
                    }
                    this.initForm(articulo);
                }
            });
        });
    }

    /**
     * Carga los tipos de artículo disponibles
     * @param search Término de búsqueda opcional
     */
    cargarTipos(search?: string): void {
        this.listaService.getByTipo('Piezas Estandar', search).subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
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
     * Abre el modal para crear un nuevo tipo
     */
    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    /**
     * Maneja la creación exitosa de un tipo
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos(); // Recargar la lista
        this.articuloForm.patchValue({ definicion: nuevoTipo.nombre }); // Seleccionarlo
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
     * Inicializa el formulario con los datos del artículo
     */
    private initForm(articulo: any): void {
        this.articuloForm = this.fb.group({
            definicion: [articulo.definicion, [Validators.required, Validators.maxLength(255)]],
            descripcionEspecifica: [articulo.descripcionEspecifica, [Validators.required, Validators.maxLength(500)]],
            peso: [articulo.peso || null],
            comentarios: [articulo.comentarios || ''],
            fotoDescriptiva: [articulo.fotoDescriptiva || null],
            foto_medida: [articulo.foto_medida || null],
            referenciasCruzadas: this.fb.array([])
        });

        // Cargar referencias existentes en el FormArray
        if (articulo.referencias && articulo.referencias.length > 0) {
            // Asegurar que las referencias actuales estén en la lista de disponibles
            articulo.referencias.forEach((ref: any) => {
                const exists = this.referenciasDisponibles.find(d => d.id === ref.id);
                if (!exists) {
                    this.referenciasDisponibles = [...this.referenciasDisponibles, ref];
                }

                this.referenciasCruzadas.push(this.fb.group({
                    referencia_id: [ref.id, Validators.required]
                }));
            });
        }
    }

    /**
     * Getter para el FormArray de referencias cruzadas
     */
    get referenciasCruzadas(): FormArray {
        return this.articuloForm.get('referenciasCruzadas') as FormArray;
    }

    /**
     * Obtiene el detalle de una referencia seleccionada para mostrar en la tabla
     */
    getReferenciaDetail(id: number): Referencia | undefined {
        return this.referenciasDisponibles.find(r => r.id === id) ||
            this.articuloActual?.referencias?.find(r => r.id === id);
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

    /**
     * Carga las referencias mediante búsqueda remota
     */
    cargarReferencias(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                this.referenciasDisponibles = res.data;
            }
        });
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

        const resultado = Math.round(pesoKg * 1000) / 1000;
        this.articuloForm.patchValue({ peso: resultado });
        this.showWeightConverter = false;
        this.pesoOrigen = null;
    }

    /**
     * Dispara la selección de archivo desde el input oculto
     */
    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onPlanoSelected(file: File): void {
        this.planoFile = file;
    }

    private reloadArticulo(): void {
        this.store.dispatch(loadArticuloById({ id: this.articuloId }));
    }

    /**
     * Gestión de Juegos (Kits)
     */
    abrirDialogoJuego(): void {
        this.cargarReferencias();
        this.juegoData = { referencia_id: 0, cantidad: 1, comentario: '' };
        this.showJuegoDialog = true;
    }


    asociarJuego(): void {
        if (!this.juegoData.referencia_id) return;
        this.articuloService.addJuego(this.articuloId, this.juegoData).subscribe(() => {
            this.reloadArticulo();
            this.showJuegoDialog = false;
        });
    }

    eliminarJuego(juego: ArticuloJuego): void {
        this.articuloService.removeJuego(this.articuloId, juego.referencia_id).subscribe(() => {
            this.reloadArticulo();
        });
    }

    /**
     * Gestión de Medidas Técnicas
     */
    abrirDialogoMedida(): void {
        this.isEditingMedida = false;
        this.medidaData = { identificador: '', nombre: '', unidad: '', valor: '', tipo: '' };
        this.showMedidaDialog = true;
    }

    editarMedida(medida: Medida): void {
        this.isEditingMedida = true;
        this.editingMedidaId = medida.id;
        this.medidaData = { ...medida };
        this.showMedidaDialog = true;
    }

    guardarMedida(): void {
        if (this.isEditingMedida && this.editingMedidaId) {
            this.articuloService.updateMedida(this.articuloId, this.editingMedidaId, this.medidaData).subscribe(() => {
                this.reloadArticulo();
                this.showMedidaDialog = false;
            });
        } else {
            this.articuloService.addMedida(this.articuloId, this.medidaData).subscribe(() => {
                this.reloadArticulo();
                this.showMedidaDialog = false;
            });
        }
    }

    eliminarMedida(medida: Medida): void {
        this.articuloService.removeMedida(this.articuloId, medida.id).subscribe(() => {
            this.reloadArticulo();
        });
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
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

        const referenciasIds = formValue.referenciasCruzadas?.map((ref: any) => ref.referencia_id) || [];
        referenciasIds.forEach((id: number) => {
            formData.append('referencias_ids[]', id.toString());
        });

        this.store.dispatch(updateArticulo({ id: this.articuloId, data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).articulos)
            .subscribe((articulosState: any) => {
                if (!articulosState.loading && !articulosState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/articulos', this.articuloId]);
                } else if (!articulosState.loading && articulosState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/articulos', this.articuloId]);
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
