import { Component, OnInit, inject, signal } from '@angular/core';
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
import { Referencia, UpdateReferenciaDto } from '../../../core/models/referencia.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista, ListaTipo } from '../../../core/models/lista.model';
import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';
import { AutoFocusDirective } from '../../../shared/directives/auto-focus.directive';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Componente de edición de artículo
 */
@Component({
    selector: 'app-articulo-edit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        DividerModule,
        DialogModule,
        InputNumberModule,
        TooltipModule,
        TableModule,
        TabsModule,
        TagModule,
        FallbackImageDirective,
        InputGroupModule,
        InputGroupAddonModule,
        ListaCreateModalComponent,
        ReferenciaCreateModalComponent,
        ImageUploadComponent,
        AutoFocusDirective
    ],
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
    referenciasJuegosDisponibles: Referencia[] = [];
    articuloActual: Articulo | null = null;

    // Variables para el modal de creación de tipo (Piezas Estandar)
    showTipoModal = false;

    // Variables para creación de listas genéricas (Medidas)
    showListaModal = false;
    currentListaTipo: ListaTipo = 'Unidad de Medida';

    // Variables para el modal de creación de referencia
    showReferenciaModal = false;
    currentReferenciaArrayIndex: number | null = null;
    referenciaJuegosIndex: number | null = null;
    marcasReferencias = signal<Lista[]>([]);
    editingReferenciaIndex = signal<number | null>(null);
    editingReferenciaJuegoIndex = signal<number | null>(null);

    // Variables para diálogos de relaciones
    showReferenciaDialog = false;
    selectedReferenciaId: number | null = null;

    showJuegoDialog = false;
    juegoData = { referencia_id: 0, cantidad: 1, comentario: '' };

    showMedidaDialog = false;
    isEditingMedida = false;
    medidaData: any = { identificador: '', unidad: '', valor: null, tipo: '' };
    editingMedidaId: number | null = null;
    guardandoMedida = false;
    currentSearchTipoMedida = '';
    currentSearchUnidadMedida = '';

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

    // Variables para el CRUD de medidas
    unidadesMedida = signal<Lista[]>([]);
    tiposMedida = signal<Lista[]>([]);

    // Archivos seleccionados
    fotoFile: File | null = null;
    planoFile: File | null = null;

    // Término de búsqueda para referencias cruzadas
    searchTermReferences = '';

    ngOnInit(): void {
        this.cargarTipos();
        this.cargarReferencias();
        this.cargarReferenciasJuegos();
        this.cargarMarcasReferencias();
        this.cargarListasMedidas();

        this.route.params.subscribe((params) => {
            this.articuloId = +params['id'];
            this.store.dispatch(loadArticuloById({ id: this.articuloId }));
            this.articulo$ = this.store.select(selectArticuloById(this.articuloId));

            this.articulo$.subscribe((articulo) => {
                if (articulo) {
                    this.articuloActual = articulo;

                    // Asegurar que tenemos el tipo en la lista para que el selector lo muestre
                    if (articulo.definicion) {
                        const exists = this.tipos.find((t) => t.nombre === articulo.definicion);
                        if (!exists) {
                            // Buscar el tipo específico en el backend para tener sus fotos
                            this.listaService.getByTipo('Piezas Estandar', articulo.definicion).subscribe({
                                next: (tiposEncontrados) => {
                                    const found = tiposEncontrados.find((t) => t.nombre === articulo.definicion);
                                    if (found) {
                                        this.tipos = [...this.tipos, found];
                                        this.checkInitialInheritance(found);
                                    } else {
                                        this.tipos = [...this.tipos, { nombre: articulo.definicion } as any];
                                    }
                                }
                            });
                        } else {
                            this.checkInitialInheritance(exists);
                        }
                    }
                    this.initForm(articulo);
                }
            });
        });
    }

    /**
     * Carga las listas de configuración para medidas
     */
    cargarListasMedidas(): void {
        this.listaService.getByTipo('Unidad de Medida').subscribe((res) => this.unidadesMedida.set(res));
        this.listaService.getByTipo('Tipo de Medida').subscribe((res) => this.tiposMedida.set(res));
    }

    /**
     * Carga las piezas estándar disponibles
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
     * Abre el modal para crear una nueva pieza estándar
     */
    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    /**
     * Abre el modal para crear cualquier tipo de lista (Medidas)
     */
    abrirCrearLista(tipo: ListaTipo): void {
        this.currentListaTipo = tipo;
        this.showListaModal = true;
    }

    /**
     * Maneja la creación de listas genéricas
     */
    onListaGeneralCreated(nueva: any): void {
        this.cargarListasMedidas(); // Recargar todas por seguridad

        // Seleccionar automáticamente en el objeto de medida que se está editando
        if (this.currentListaTipo === 'Unidad de Medida') {
            this.medidaData.unidad = nueva.nombre;
        } else if (this.currentListaTipo === 'Tipo de Medida') {
            this.medidaData.tipo = nueva.nombre;
        }

        this.showListaModal = false;
    }

    /**
     * Maneja el cambio de la pieza estándar seleccionada
     */
    onTipoChange(event: any): void {
        const nombre = event.value;
        if (nombre && this.articuloActual) {
            const found = this.tipos.find((t) => t.nombre === nombre);
            if (found) {
                // Pre-diligenciar descripción específica si está vacía
                const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
                if (!currentDesc && found.nombre) {
                    this.articuloForm.patchValue({ descripcionEspecifica: found.nombre });
                }

                if (found.fotoMedida) {
                    // Actualizar la previsualización
                    this.articuloActual = {
                        ...this.articuloActual,
                        foto_medida: found.fotoMedida
                    };
                    // Limpiar cualquier selección manual que haya hecho el usuario en el plano
                    this.planoFile = null;
                }
            }
        }
    }

    /**
     * Maneja la creación exitosa de una pieza estándar
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos(); // Recargar la lista

        const updates: any = { definicion: nuevoTipo.nombre };

        // Pre-diligenciar descripción específica si está vacía
        const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
        if (!currentDesc && nuevoTipo.nombre) {
            updates.descripcionEspecifica = nuevoTipo.nombre;
        }

        this.articuloForm.patchValue(updates); // Seleccionarlo

        if (nuevoTipo.fotoMedida && this.articuloActual) {
            this.articuloActual = {
                ...this.articuloActual,
                foto_medida: nuevoTipo.fotoMedida
            };
            this.planoFile = null;
        }

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
     * Abre el modal para crear una nueva referencia desde la pestaña de Juegos
     * @param index Índice del FormArray
     */
    abrirCrearReferenciaJuegos(index: number): void {
        this.referenciaJuegosIndex = index;
        this.showReferenciaModal = true;
    }

    /**
     * Maneja la creación exitosa de una referencia
     */
    onReferenciaCreada(nuevaRef: any): void {
        // Añadir inmediatamente a las listas locales para que el renderizado sea instantáneo
        if (nuevaRef) {
            if (!this.referenciasDisponibles.find((r) => r.id === nuevaRef.id)) {
                this.referenciasDisponibles = [...this.referenciasDisponibles, nuevaRef];
            }
            if (!this.referenciasJuegosDisponibles.find((r) => r.id === nuevaRef.id)) {
                this.referenciasJuegosDisponibles = [...this.referenciasJuegosDisponibles, nuevaRef];
            }
        }

        if (this.currentReferenciaArrayIndex !== null) {
            const control = this.referenciasCruzadas.at(this.currentReferenciaArrayIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
            this.currentReferenciaArrayIndex = null;
        } else if (this.referenciaJuegosIndex !== null) {
            const control = this.articuloJuegos.at(this.referenciaJuegosIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
            this.referenciaJuegosIndex = null;
        }

        this.cargarReferencias(); // Sincronizar con el servidor
        this.cargarReferenciasJuegos();
        this.showReferenciaModal = false;
    }

    iniciarEdicionReferencia(index: number): void {
        const referencia = this.getReferenciaDetail(this.referenciasCruzadas.at(index)?.get('referencia_id')?.value);
        if (!referencia) {
            return;
        }

        this.cancelarEdicionReferencia();

        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.addControl('referencia', this.fb.control(referencia.referencia, [Validators.required, Validators.maxLength(255)]));
        row.addControl('marca_id', this.fb.control(referencia.marca_id));
        this.editingReferenciaIndex.set(index);
    }

    guardarEdicionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        const referenciaId = row.get('referencia_id')?.value;

        if (!referenciaId || row.get('referencia')?.invalid) {
            row.get('referencia')?.markAsTouched();
            return;
        }

        const actual = this.getReferenciaDetail(referenciaId);
        const data: UpdateReferenciaDto = {
            referencia: row.get('referencia')?.value,
            marca_id: row.get('marca_id')?.value ?? null,
            articulo_id: actual?.articulo_id ?? null,
            comentario: actual?.comentario ?? null
        };

        this.referenciaService.update(referenciaId, data).subscribe({
            next: ({ data: actualizada }) => {
                this.referenciasDisponibles = this.actualizarReferenciaEnLista(this.referenciasDisponibles, actualizada);
                this.referenciasJuegosDisponibles = this.actualizarReferenciaEnLista(this.referenciasJuegosDisponibles, actualizada);

                if (this.articuloActual?.referencias) {
                    this.articuloActual = {
                        ...this.articuloActual,
                        referencias: this.actualizarReferenciaEnLista(this.articuloActual.referencias, actualizada)
                    };
                }

                this.finalizarEdicionReferencia(index);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Referencia actualizada',
                    detail: 'Los cambios se guardaron correctamente.'
                });
            }
        });
    }

    cancelarEdicionReferencia(): void {
        const index = this.editingReferenciaIndex();
        if (index !== null) {
            this.finalizarEdicionReferencia(index);
        }
    }

    private finalizarEdicionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.removeControl('referencia');
        row.removeControl('marca_id');
        this.editingReferenciaIndex.set(null);
    }

    private actualizarReferenciaEnLista(referencias: Referencia[], actualizada: Referencia): Referencia[] {
        const existe = referencias.some((referencia) => referencia.id === actualizada.id);
        return existe ? referencias.map((referencia) => (referencia.id === actualizada.id ? actualizada : referencia)) : [...referencias, actualizada];
    }

    private cargarMarcasReferencias(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (marcas) => this.marcasReferencias.set(marcas)
        });
    }

    /**
     * Inicializa el formulario con los datos del artículo
     */
    private initForm(articulo: any): void {
        this.articuloForm = this.fb.group({
            definicion: [articulo.definicion, [Validators.required, Validators.maxLength(255)]],
            descripcionEspecifica: [articulo.descripcionEspecifica, [Validators.required, Validators.maxLength(500)]],
            peso: [articulo.peso ?? null, [Validators.required, Validators.min(0)]],
            comentarios: [articulo.comentarios || ''],
            fotoDescriptiva: [articulo.fotoDescriptiva || null],
            foto_medida: [articulo.foto_medida || null],
            referenciasCruzadas: this.fb.array([]),
            articuloJuegos: this.fb.array([])
        });

        // Cargar referencias existentes en el FormArray
        if (articulo.referencias && articulo.referencias.length > 0) {
            // Asegurar que las referencias actuales estén en la lista de disponibles
            articulo.referencias.forEach((ref: any) => {
                const exists = this.referenciasDisponibles.find((d) => d.id === ref.id);
                if (!exists) {
                    this.referenciasDisponibles = [...this.referenciasDisponibles, ref];
                }

                this.referenciasCruzadas.push(
                    this.fb.group({
                        referencia_id: [ref.id, Validators.required]
                    })
                );
            });
        }

        // Cargar juegos existentes en el FormArray
        if (articulo.articuloJuegos && articulo.articuloJuegos.length > 0) {
            articulo.articuloJuegos.forEach((aj: any) => {
                if (aj.referencia) {
                    const exists = this.referenciasJuegosDisponibles.find((d) => d.id === aj.referencia.id);
                    if (!exists) {
                        this.referenciasJuegosDisponibles = [...this.referenciasJuegosDisponibles, aj.referencia];
                    }
                }
                this.articuloJuegos.push(
                    this.fb.group({
                        referencia_id: [aj.referencia_id, Validators.required],
                        cantidad: [aj.cantidad, [Validators.required, Validators.min(1)]],
                        comentario: [aj.comentario || '']
                    })
                );
            });
        }
    }

    /**
     * Revisa si se debe heredar visualmente la fotoMedida al cargar la vista
     */
    private checkInitialInheritance(tipo: Lista): void {
        if (this.articuloActual && !this.articuloActual.foto_medida && tipo.fotoMedida) {
            this.articuloActual = {
                ...this.articuloActual,
                foto_medida: tipo.fotoMedida
            };
        }
    }

    /**
     * Getter para el FormArray de referencias cruzadas
     */
    get referenciasCruzadas(): FormArray {
        return this.articuloForm.get('referenciasCruzadas') as FormArray;
    }

    /**
     * Getter para el FormArray de juegos (kits)
     */
    get articuloJuegos(): FormArray {
        return this.articuloForm.get('articuloJuegos') as FormArray;
    }

    /**
     * Obtiene el detalle de una referencia seleccionada para mostrar en la tabla
     */
    getReferenciaDetail(id: number): Referencia | undefined {
        return this.referenciasDisponibles.find((r) => r.id === id) || this.articuloActual?.referencias?.find((r) => r.id === id);
    }

    /**
     * Determina si una fila de referencia debe mostrarse según el término de búsqueda
     */
    shouldShowReference(id: number): boolean {
        if (!this.searchTermReferences) return true;

        const ref = this.getReferenciaDetail(id);
        if (!ref) return false;

        const term = this.searchTermReferences.toLowerCase();
        return ref.referencia.toLowerCase().includes(term) || ref.marca?.nombre?.toLowerCase().includes(term) || false;
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
        this.referenciaService.getAll({ search, per_page: 50, disponibles: true }).subscribe({
            next: (res) => {
                const nuevas = res.data;
                // Combinar con las que ya tiene el artículo para no perderlas de la vista
                const actuales = this.articuloActual?.referencias || [];

                // Usar un Map para evitar duplicados por ID
                const map = new Map<number, Referencia>();
                actuales.forEach((r) => map.set(r.id, r));
                nuevas.forEach((r: Referencia) => map.set(r.id, r));

                this.referenciasDisponibles = Array.from(map.values());
            }
        });
    }

    /**
     * Carga las referencias para el juego/kit sin la restricción de disponibilidad
     */
    cargarReferenciasJuegos(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                const nuevas = res.data;
                const actuales = (this.articuloActual?.articuloJuegos?.map((aj) => aj.referencia).filter(Boolean) as Referencia[]) || [];

                const map = new Map<number, Referencia>();
                actuales.forEach((r) => map.set(r.id, r));
                nuevas.forEach((r: Referencia) => map.set(r.id, r));

                this.referenciasJuegosDisponibles = Array.from(map.values());
            }
        });
    }

    onFilterReferenciasJuegos(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarReferenciasJuegos(search);
        } else if (!search) {
            this.cargarReferenciasJuegos();
        }
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
    agregarJuego(): void {
        const row = this.fb.group({
            referencia_id: [null, Validators.required],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            comentario: ['']
        });
        this.articuloJuegos.push(row);
    }

    eliminarJuego(index: number): void {
        this.articuloJuegos.removeAt(index);
    }

    iniciarEdicionReferenciaJuego(index: number): void {
        const referencia = this.getReferenciaJuegoDetail(this.articuloJuegos.at(index)?.get('referencia_id')?.value);
        if (!referencia) {
            return;
        }

        this.cancelarEdicionReferenciaJuego();

        const row = this.articuloJuegos.at(index) as FormGroup;
        row.addControl('referencia', this.fb.control(referencia.referencia, [Validators.required, Validators.maxLength(255)]));
        row.addControl('marca_id', this.fb.control(referencia.marca_id));
        this.editingReferenciaJuegoIndex.set(index);
    }

    guardarEdicionReferenciaJuego(index: number): void {
        const row = this.articuloJuegos.at(index) as FormGroup;
        const referenciaId = row.get('referencia_id')?.value;

        if (!referenciaId || row.get('referencia')?.invalid) {
            row.get('referencia')?.markAsTouched();
            return;
        }

        const actual = this.getReferenciaJuegoDetail(referenciaId);
        const data: UpdateReferenciaDto = {
            referencia: row.get('referencia')?.value,
            marca_id: row.get('marca_id')?.value ?? null,
            articulo_id: actual?.articulo_id ?? null,
            comentario: actual?.comentario ?? null
        };

        this.referenciaService.update(referenciaId, data).subscribe({
            next: ({ data: actualizada }) => {
                this.referenciasDisponibles = this.actualizarReferenciaEnLista(this.referenciasDisponibles, actualizada);
                this.referenciasJuegosDisponibles = this.actualizarReferenciaEnLista(this.referenciasJuegosDisponibles, actualizada);
                this.finalizarEdicionReferenciaJuego(index);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Referencia de juego actualizada',
                    detail: 'Los cambios se guardaron correctamente.'
                });
            }
        });
    }

    cancelarEdicionReferenciaJuego(): void {
        const index = this.editingReferenciaJuegoIndex();
        if (index !== null) {
            this.finalizarEdicionReferenciaJuego(index);
        }
    }

    private finalizarEdicionReferenciaJuego(index: number): void {
        const row = this.articuloJuegos.at(index) as FormGroup;
        row.removeControl('referencia');
        row.removeControl('marca_id');
        this.editingReferenciaJuegoIndex.set(null);
    }

    getReferenciaJuegoDetail(id: number): Referencia | undefined {
        return this.referenciasJuegosDisponibles.find((referencia) => referencia.id === id);
    }

    /**
     * Gestión de Medidas Técnicas
     */
    agregarMedida(): void {
        if (!this.articuloActual || this.editingMedidaId !== null) {
            return;
        }
        const idTemporal = -(this.articuloActual.medidas?.length || 0) - 1;
        const nuevaMedida: any = { id: idTemporal, identificador: '', unidad: '', valor: null, tipo: '', articulo_id: this.articuloId };
        this.articuloActual = {
            ...this.articuloActual,
            medidas: [...(this.articuloActual.medidas || []), nuevaMedida]
        };
        this.iniciarEdicionMedida(nuevaMedida);
    }

    iniciarEdicionMedida(medida: any): void {
        this.isEditingMedida = true;
        this.editingMedidaId = medida.id;
        this.medidaData = { ...medida };
    }

    cancelarEdicionMedida(): void {
        if (!this.articuloActual || this.editingMedidaId === null) {
            return;
        }
        if (this.editingMedidaId < 0) {
            this.articuloActual = {
                ...this.articuloActual,
                medidas: (this.articuloActual.medidas || []).filter((m: any) => m.id !== this.editingMedidaId)
            };
        }
        this.editingMedidaId = null;
        this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
    }

    guardarMedida(): void {
        if (this.guardandoMedida || !this.medidaData.identificador || this.medidaData.valor === null || this.editingMedidaId === null) {
            return;
        }

        this.guardandoMedida = true;

        if (this.editingMedidaId > 0) {
            this.articuloService.updateMedida(this.articuloId, this.editingMedidaId, this.medidaData).subscribe({
                next: () => {
                    this.reloadArticulo();
                    this.editingMedidaId = null;
                    this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
                    this.guardandoMedida = false;
                },
                error: () => {
                    this.guardandoMedida = false;
                }
            });
        } else {
            this.articuloService.addMedida(this.articuloId, this.medidaData).subscribe({
                next: () => {
                    this.reloadArticulo();
                    this.editingMedidaId = null;
                    this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
                    this.guardandoMedida = false;
                },
                error: () => {
                    this.guardandoMedida = false;
                }
            });
        }
    }

    eliminarMedida(medida: Medida): void {
        if (!this.articuloActual) {
            return;
        }
        if (medida.id < 0) {
            this.articuloActual = {
                ...this.articuloActual,
                medidas: (this.articuloActual.medidas || []).filter((m: any) => m.id !== medida.id)
            };
            if (this.editingMedidaId === medida.id) {
                this.editingMedidaId = null;
                this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
            }
            return;
        }

        this.articuloService.removeMedida(this.articuloId, medida.id).subscribe(() => {
            this.reloadArticulo();
            if (this.editingMedidaId === medida.id) {
                this.editingMedidaId = null;
                this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
            }
        });
    }

    onFilterTipoMedida(event: any): void {
        this.currentSearchTipoMedida = event.filter || '';
    }

    onFilterUnidadMedida(event: any): void {
        this.currentSearchUnidadMedida = event.filter || '';
    }

    crearTipoMedidaEnCaliente(nombre: string): void {
        if (!nombre || !nombre.trim()) {
            return;
        }
        const nombreLimpio = nombre.trim();
        this.listaService.create({ tipo: 'Tipo de Medida', nombre: nombreLimpio }).subscribe({
            next: (res: any) => {
                const nuevoItem = res;
                this.tiposMedida.set([...this.tiposMedida(), nuevoItem]);
                this.medidaData.tipo = nuevoItem.nombre;
                this.currentSearchTipoMedida = '';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Creado',
                    detail: `Tipo de medida "${nombreLimpio}" creado correctamente`
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `No se pudo crear el tipo de medida "${nombreLimpio}"`
                });
            }
        });
    }

    crearUnidadMedidaEnCaliente(nombre: string): void {
        if (!nombre || !nombre.trim()) {
            return;
        }
        const nombreLimpio = nombre.trim();
        this.listaService.create({ tipo: 'Unidad de Medida', nombre: nombreLimpio }).subscribe({
            next: (res: any) => {
                const nuevoItem = res;
                this.unidadesMedida.set([...this.unidadesMedida(), nuevoItem]);
                this.medidaData.unidad = nuevoItem.nombre;
                this.currentSearchUnidadMedida = '';
                this.messageService.add({
                    severity: 'success',
                    summary: 'Creado',
                    detail: `Unidad de medida "${nombreLimpio}" creada correctamente`
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: `No se pudo crear la unidad de medida "${nombreLimpio}"`
                });
            }
        });
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

        if (formValue.peso !== null && formValue.peso !== undefined) formData.append('peso', formValue.peso.toString());
        if (formValue.comentarios) formData.append('comentarios', formValue.comentarios);

        if (this.fotoFile) formData.append('fotoDescriptiva', this.fotoFile);
        if (this.planoFile) formData.append('foto_medida', this.planoFile);

        referenciasIds.forEach((id: number) => {
            formData.append('referencias_ids[]', id.toString());
        });

        const juegosValores = this.articuloForm.get('articuloJuegos')?.value || [];
        formData.append('juegos', JSON.stringify(juegosValores));

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
