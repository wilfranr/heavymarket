import { Component, OnInit, inject, signal } from '@angular/core';
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
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

import { createArticulo } from '../../../store/articulos/actions/articulos.actions';
import { CreateArticuloDto } from '../../../core/models/articulo.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista, ListaTipo } from '../../../core/models/lista.model';
import { Referencia, UpdateReferenciaDto } from '../../../core/models/referencia.model';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';
import { AutoFocusDirective } from '../../../shared/directives/auto-focus.directive';

/**
 * Componente de creación de artículo
 */
@Component({
    selector: 'app-articulo-create',
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
        InputGroupModule,
        InputGroupAddonModule,
        TabsModule,
        TagModule,
        TooltipModule,
        AutoFocusDirective,
        FallbackImageDirective,
        ListaCreateModalComponent,
        ReferenciaCreateModalComponent,
        ImageUploadComponent
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

    articuloForm!: FormGroup;
    loading = false;
    tipos: Lista[] = [];
    referenciasDisponibles: Referencia[] = [];
    referenciasJuegosDisponibles: Referencia[] = [];
    referenciaJuegosIndex: number | null = null;
    referenciaService = inject(ReferenciaService);
    articuloService = inject(ArticuloService);

    // Variables para el CRUD de medidas
    unidadesMedida: Lista[] = [];
    tiposMedida: Lista[] = [];
    medidasLocales: any[] = [];
    showMedidaDialog = false;
    isEditingMedida = false;
    medidaData: any = { identificador: '', unidad: '', valor: null, tipo: '' };
    editingMedidaIndex: number | null = null;
    currentSearchTipoMedida = '';
    currentSearchUnidadMedida = '';

    // Variables para el modal de creación de tipo
    showTipoModal = false;

    // Variables para creación de listas genéricas (Medidas)
    showListaModal = false;
    currentListaTipo: ListaTipo = 'Unidad de Medida';

    // Variables para el modal de creación de referencia
    showReferenciaModal = false;
    currentReferenciaArrayIndex: number | null = null;
    marcasReferencias = signal<Lista[]>([]);
    editingReferenciaIndex = signal<number | null>(null);
    editingReferenciaJuegoIndex = signal<number | null>(null);

    // Tipo seleccionado para previsualización
    selectedTipoData: Lista | null = null;

    // Plano heredado de la Pieza Estandar seleccionada
    fotoMedidaHeredada: string | null = null;

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

    constructor() {
        console.log('=== CREATE COMPONENT CARGADO ===');
        console.log('Archivo: features/articulos/create/create.ts');
        console.log('medidaData inicial:', this.medidaData);
    }

    ngOnInit(): void {
        console.log('=== CREATE COMPONENT ngOnInit ===');
        this.initForm();
        this.cargarTipos();
        this.cargarReferencias();
        this.cargarReferenciasJuegos();
        this.cargarMarcasReferencias();
        this.cargarListasMedidas();
    }

    /**
     * Carga las listas de configuración para medidas
     */
    cargarListasMedidas(): void {
        this.listaService.getByTipo('Unidad de Medida').subscribe((res) => (this.unidadesMedida = res));
        this.listaService.getByTipo('Tipo de Medida').subscribe((res) => (this.tiposMedida = res));
    }

    /**
     * Gestión de Medidas Técnicas Locales
     */
    agregarMedida(): void {
        if (this.editingMedidaIndex !== null) {
            return;
        }
        const nuevaMedida = { identificador: '', unidad: '', valor: null, tipo: '' };
        this.medidasLocales.push(nuevaMedida);
        this.iniciarEdicionMedida(nuevaMedida, this.medidasLocales.length - 1);
    }

    iniciarEdicionMedida(medida: any, index: number): void {
        this.isEditingMedida = true;
        this.editingMedidaIndex = index;
        this.medidaData = { ...medida };
    }

    cancelarEdicionMedida(): void {
        if (this.editingMedidaIndex !== null) {
            const medida = this.medidasLocales[this.editingMedidaIndex];
            if (!medida.identificador && medida.valor === null) {
                this.medidasLocales.splice(this.editingMedidaIndex, 1);
            }
            this.editingMedidaIndex = null;
            this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
        }
    }

    guardarMedida(): void {
        if (!this.medidaData.identificador || this.medidaData.valor === null || this.editingMedidaIndex === null) {
            return;
        }

        this.medidasLocales[this.editingMedidaIndex] = { ...this.medidaData };
        this.editingMedidaIndex = null;
        this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
    }

    eliminarMedida(index: number): void {
        this.medidasLocales.splice(index, 1);
        if (this.editingMedidaIndex === index) {
            this.editingMedidaIndex = null;
            this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
        } else if (this.editingMedidaIndex !== null && this.editingMedidaIndex > index) {
            this.editingMedidaIndex--;
        }
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
                this.tiposMedida = [...this.tiposMedida, nuevoItem];
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
                this.unidadesMedida = [...this.unidadesMedida, nuevoItem];
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
        const seleccionadasIds = this.referenciasCruzadas.value.map((r: any) => r.referencia_id).filter((id: any) => id !== null);

        this.referenciaService.getAll({ search, per_page: 50, disponibles: true }).subscribe({
            next: (res) => {
                const nuevas = res.data;

                // Preservar las que ya están seleccionadas en el formulario
                const yaCargadas = this.referenciasDisponibles.filter((r) => seleccionadasIds.includes(r.id));

                const map = new Map<number, Referencia>();
                yaCargadas.forEach((r) => map.set(r.id, r));
                nuevas.forEach((r: Referencia) => map.set(r.id, r));

                this.referenciasDisponibles = Array.from(map.values());
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
     * Abre el modal para crear cualquier tipo de lista (Medidas)
     */
    abrirCrearLista(tipo: ListaTipo): void {
        this.currentListaTipo = tipo;
        this.showListaModal = true;
    }

    /**
     * Maneja la creación exitosa de una pieza estándar
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos(); // Recargar la lista

        const updates: any = { definicion: nuevoTipo.nombre };
        // Sobreescribir descripcion especifica con el nombre de la pieza estandar
        if (nuevoTipo.nombre) {
            updates.descripcionEspecifica = nuevoTipo.nombre;
        }

        this.articuloForm.patchValue(updates); // Seleccionarlo
        this.selectedTipoData = nuevoTipo;
        this.fotoMedidaHeredada = nuevoTipo.fotoMedida || null;
        this.showTipoModal = false;
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
     * Abre el modal para crear una nueva referencia
     * @param index Índice del FormArray
     */
    abrirCrearReferencia(index: number): void {
        this.currentReferenciaArrayIndex = index;
        this.showReferenciaModal = true;
    }

    /**
     * Abre el modal para crear una nueva referencia desde Juegos
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
        return this.referenciasDisponibles.find((r) => r.id === id);
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
            const found = this.tipos.find((t) => t.nombre === nombre);
            if (found) {
                this.selectedTipoData = found;
                this.fotoMedidaHeredada = found.fotoMedida || null;

                // Sobreescribir descripcion especifica con el nombre de la pieza estandar
                if (found.nombre) {
                    this.articuloForm.patchValue({ descripcionEspecifica: found.nombre });
                }
            }
        } else {
            this.selectedTipoData = null;
            this.fotoMedidaHeredada = null;
        }
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.articuloForm = this.fb.group({
            definicion: ['', [Validators.required, Validators.maxLength(255)]],
            descripcionEspecifica: ['', [Validators.required, Validators.maxLength(500)]],
            peso: [null, [Validators.required, Validators.min(0)]],
            comentarios: [''],
            fotoDescriptiva: [null],
            foto_medida: [null],
            referenciasCruzadas: this.fb.array([]),
            articuloJuegos: this.fb.array([])
        });
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

    cargarReferenciasJuegos(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                this.referenciasJuegosDisponibles = res.data;
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

        if (formValue.peso !== null && formValue.peso !== undefined) formData.append('peso', formValue.peso.toString());
        if (formValue.comentarios) formData.append('comentarios', formValue.comentarios);

        if (this.fotoFile) formData.append('fotoDescriptiva', this.fotoFile);
        if (this.planoFile) formData.append('foto_medida', this.planoFile);

        referenciasIds.forEach((id: number) => {
            formData.append('referencias_ids[]', id.toString());
        });

        if (this.medidasLocales.length > 0) {
            formData.append('medidas', JSON.stringify(this.medidasLocales));
        }

        const juegosValores = this.articuloForm.get('articuloJuegos')?.value || [];
        if (juegosValores.length > 0) {
            formData.append('juegos', JSON.stringify(juegosValores));
        }

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
