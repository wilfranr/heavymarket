import { Component, OnInit, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, FilterService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MultiSelectModule } from 'primeng/multiselect';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';
import { BadgeModule } from 'primeng/badge';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { createPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { CreatePedidoDto, CreatePedidoReferenciaDto, PedidoEstado } from '../../../core/models/pedido.model';
import { PEDIDO_ESTADO_ETIQUETA } from '../../../core/utils/pedido-estado-tag';
import { TerceroService } from '../../../core/services/tercero.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { PedidoReferenciaProveedorService } from '../../../core/services/pedido-referencia-proveedor.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { ContactoService } from '../../../core/services/contacto.service';
import { TerceroCreateModalComponent } from '../../../shared/components/tercero-create-modal/tercero-create-modal.component';
import { MaquinaCreateModalComponent } from '../../../shared/components/maquina-create-modal/maquina-create-modal.component';
import { ReferenciaEditModalComponent } from '../../../shared/components/referencia-edit-modal/referencia-edit-modal.component';
import { ContactoCreateModalComponent } from '../../../shared/components/contacto-create-modal/contacto-create-modal.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type TipoListaSelectOption = {
    label: string;
    value: number;
    descripcion?: string;
    _search: string;
};

type RowTiposCatalogEntry = {
    ready: boolean;
    options: TipoListaSelectOption[];
};

/**
 * Componente de creación de pedido con Wizard de 2 pasos
 */
@Component({
    selector: 'app-pedido-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        DividerModule,
        StepsModule,
        ToggleButtonModule,
        InputNumberModule,
        DialogModule,
        TableModule,
        CheckboxModule,
        TooltipModule,
        TagModule,
        SkeletonModule,
        MultiSelectModule,
        TerceroCreateModalComponent,
        MaquinaCreateModalComponent,
        ContactoCreateModalComponent,
        ReferenciaEditModalComponent,
        ImageModule,
        GalleriaModule,
        BadgeModule,
        ConfirmDialogModule,
        AutoCompleteModule
    ],
    providers: [MessageService],
    templateUrl: './create.html',
    styleUrl: './create.scss'
})
export class CreateComponent implements OnInit {
    private static readonly DEFAULT_ARTICLE_TYPE_LISTA_ID = 3425;

    private readonly fb = inject(FormBuilder);
    // ... services injections ...
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly filterService = inject(FilterService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly terceroService = inject(TerceroService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly proveedorService = inject(PedidoReferenciaProveedorService);
    private readonly articuloService = inject(ArticuloService);
    private readonly contactoService = inject(ContactoService);
    private readonly authService = inject(AuthService);

    pedidoForm!: FormGroup;
    activeIndex = 0;
    loading = false;
    showBulkImport = false;

    // Modales
    displayCreateTerceroDialog = false;
    displayCreateMaquinaDialog = false;
    /** Modo edición del mismo modal de máquina (lápiz en tarjeta). */
    maquinaIdEdicionModal: number | null = null;
    displayCreateContactoDialog = false;
    displayHelpDialog = false;

    today = new Date();

    // Opciones para selects
    terceros: any[] = [];
    sistemas: any[] = [];
    marcas: any[] = [];
    maquinas = signal<any[]>([]);
    fabricantes: any[] = [];
    referencias: any[] = [];
    contactos: any[] = [];
    tiposArticulos: any[] = []; // Opciones globales si se necesita

    // Cascading options por fila (índice del FormArray)
    readonly rowTiposCatalog = signal<Record<number, RowTiposCatalogEntry>>({});
    referenciasPorFila: any[][] = [];
    /** Catálogo completo en memoria (como `sistemas`); no se pasa entero al p-select. */
    tiposArticuloCatalog: TipoListaSelectOption[] = [];
    readonly tiposArticuloCatalogReady = signal(false);
    private readonly tiposPanelFilter: Record<number, string> = {};
    private readonly TIPOS_PANEL_MAX = 100;
    private tiposLotePanelFilter = '';

    // Terceros completos para info cards
    tercerosFull: any[] = [];
    maquinasFull: any[] = [];

    // Respaldos para filtrado flexible
    tercerosOriginal: any[] = [];
    sistemasOriginal: any[] = [];
    tiposPorFilaOriginal: any[][] = [];

    // Signals para reactividad en cards
    terceroId = signal<number | null>(null);
    maquinaId = signal<number | null>(null);

    selectedTercero = computed(() => {
        const id = this.terceroId();
        return id ? this.tercerosFull.find((t) => t.id === id) : null;
    });

    selectedMaquina = computed(() => {
        const id = this.maquinaId();
        return id ? this.maquinasFull.find((m) => m.id === id) : null;
    });

    // Modal de detalle de máquina
    displayMaquinaDialog = false;
    selectedMaquinaDetail: any = null;

    // Estado de proveedores por referencia
    referenciaIndexParaProveedor: number | null = null;
    nuevoProveedorForm: FormGroup | null = null;

    // Lote de Referencias
    displayLoteDialog = false;
    loteForm!: FormGroup;
    readonly tiposLoteCatalog = signal<RowTiposCatalogEntry>({ ready: false, options: [] });
    tiposLoteOriginal: TipoListaSelectOption[] = [];
    referenciasLote: any[] = [];
    filterMode: any = 'flexible';

    // Dialogos de comentario e imagen
    displayComentarioDialog = false;
    displayImagenDialog = false;
    activeItemIndex: number | null = null;
    comentarioControl = new FormControl('');
    origenComentarioControl = new FormControl('Asesor');
    comentariosItemActual: { origen: string; comentario: string; fecha?: string }[] = [];
    imagenControl = new FormControl('');

    // Modal de edición de referencia (inline desde pedido)
    showReferenciaEditModal = false;
    editReferenciaId: number | null = null;
    editReferenciaIndex: number = -1;

    // Estado para la galería de imágenes (replicado de la landing)
    displayGallery = false;
    galleriaImages: any[] = [];
    selectedItemIndex: number = -1;
    activeIndexGallery: number = 0;

    // Respaldos para filtrado flexible
    items: MenuItem[] = [{ label: 'Cliente' }, { label: 'Referencias' }];

     ngOnInit(): void {
        this.registerFlexibleFilter();
        this.initForm();
        this.loadInitialData();
    }

    private registerFlexibleFilter(): void {
        this.filterService.register('flexible', (value: unknown, filter: unknown): boolean => {
            if (filter === undefined || filter === null || String(filter).trim() === '') {
                return true;
            }
            if (value === undefined || value === null) {
                return false;
            }
            return this.flexibleMatch(String(value), String(filter));
        });
    }
    

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.pedidoForm = this.fb.group({
            // Paso 1: Cliente
            tercero_id: [null, [Validators.required]],
            direccion: ['', [Validators.maxLength(500)]],
            comentario: ['', [Validators.maxLength(1000)]],
            maquina_id: [null],
            fabricante_id: [null],
            contacto_id: [null],
            estado: ['Nuevo' as PedidoEstado, [Validators.required]],

            // Paso 2: Referencias Masivas
            referencias_copiadas: [''],

            // Paso 3: Referencias Detalladas
            referencias: this.fb.array([])
        });

        this.loteForm = this.fb.group({
            sistema_id: [null, [Validators.required]],
            articulo_id: [{ value: null, disabled: true }, [Validators.required]],
            referencias_seleccionadas: [{ value: [], disabled: true }, [Validators.required, Validators.minLength(1)]],
            cantidad_lote: [1, [Validators.required, Validators.min(1)]]
        });

        // Suscribirse a cambios globales si es necesario
        this.pedidoForm.get('tercero_id')?.valueChanges.subscribe((id) => {
            this.terceroId.set(id);
            if (id) {
                this.loadContactos(id);
                this.loadMaquinasPorCliente(id);

                // Cargar datos adicionales del tercero si están en tercerosFull
                const t = this.tercerosFull.find((x) => x.id === id);
                if (t) {
                    this.pedidoForm.patchValue(
                        {
                            direccion: t.direccion || ''
                        },
                        { emitEvent: false }
                    );
                }
            } else {
                this.contactos = [];
                this.maquinas.set([]);
                this.pedidoForm.patchValue(
                    {
                        direccion: '',
                        contacto_id: null,
                        maquina_id: null
                    },
                    { emitEvent: false }
                );
            }
        });
        this.pedidoForm.get('maquina_id')?.valueChanges.subscribe((id) => this.maquinaId.set(id));
    }

    private removeAccents(str: string): string {
        return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    }

    private mapListasToOptions(listas: { id: number; nombre: string; definicion?: string | null }[]): TipoListaSelectOption[] {
        return listas.map((lista) => ({
            label: lista.nombre,
            value: lista.id,
            descripcion: lista.definicion ?? undefined,
            _search: `${lista.nombre} ${lista.definicion || ''}`
        }));
    }

    /** Aplaza mutaciones de vista al siguiente macrotask (evita NG0100 en modo dev). */
    private deferViewUpdate(fn: () => void): void {
        setTimeout(() => {
            fn();
            this.cdr.markForCheck();
        }, 0);
    }

    private setRowTiposCatalog(index: number, entry: RowTiposCatalogEntry): void {
        this.deferViewUpdate(() => {
            this.rowTiposCatalog.update((state) => ({ ...state, [index]: entry }));
            this.tiposPorFilaOriginal[index] = [...entry.options];
        });
    }

    private clearRowTiposCatalog(index: number, after?: () => void): void {
        this.deferViewUpdate(() => {
            this.rowTiposCatalog.update((state) => ({ ...state, [index]: { ready: false, options: [] } }));
            this.tiposPorFilaOriginal[index] = [];
            after?.();
        });
    }

    private shiftRowTiposCatalogAfterRemove(removedIndex: number): void {
        this.deferViewUpdate(() => {
            this.rowTiposCatalog.update((state) => {
                const next: Record<number, RowTiposCatalogEntry> = {};
                Object.entries(state).forEach(([key, entry]) => {
                    const i = Number(key);
                    if (i < removedIndex) {
                        next[i] = entry;
                    } else if (i > removedIndex) {
                        next[i - 1] = entry;
                    }
                });
                return next;
            });
        });
    }

    private normalizeLabel(value: string): string {
        return this.removeAccents(value.toLowerCase().trim());
    }

    private patchDefaultListaForRow(row: AbstractControl | null, options: TipoListaSelectOption[], systemLabel?: string): void {
        if (!row || this.normalizeLabel(systemLabel ?? '') !== 'por defecto') {
            return;
        }

        const currentListaId = row.get('lista_id')?.value;
        if (currentListaId != null && options.some((o) => o.value === currentListaId)) {
            return;
        }

        const defaultListaId = this.resolveDefaultListaId(options);
        if (defaultListaId) {
            row.patchValue({ lista_id: defaultListaId }, { emitEvent: true });
        }
    }

    private applyRowTiposLoaded(index: number, options: TipoListaSelectOption[], row: AbstractControl | null, systemLabel?: string): void {
        if (this.normalizeLabel(systemLabel ?? '') === 'por defecto') {
            this.applyRowTiposReadyPorDefecto(index, row, systemLabel);
            return;
        }

        this.deferViewUpdate(() => {
            this.rowTiposCatalog.update((state) => ({ ...state, [index]: { ready: true, options } }));
            this.tiposPorFilaOriginal[index] = [...options];
            this.deferViewUpdate(() => {
                this.patchDefaultListaForRow(row, options, systemLabel);
            });
        });
    }

    private applyRowTiposReadyPorDefecto(index: number, row: AbstractControl | null, systemLabel?: string): void {
        this.tiposPanelFilter[index] = '';
        this.deferViewUpdate(() => {
            this.rowTiposCatalog.update((state) => ({ ...state, [index]: { ready: true, options: [] } }));
            this.deferViewUpdate(() => {
                this.patchDefaultListaForRow(row, this.tiposArticuloCatalog, systemLabel);
            });
        });
    }

    private syncPendingPorDefectoRows(): void {
        this.referenciasFormArray.controls.forEach((row, index) => {
            const sistemaId = row.get('sistema_id')?.value as number | null;
            if (!this.isSistemaPorDefecto(sistemaId)) {
                return;
            }

            const system = this.sistemas.find((s) => s.value === sistemaId);
            const catalog = this.rowTiposCatalog()[index];
            if (!catalog?.ready) {
                this.applyRowTiposReadyPorDefecto(index, row, system?.label);
            } else {
                this.deferViewUpdate(() => {
                    this.patchDefaultListaForRow(row, this.tiposArticuloCatalog, system?.label);
                });
            }
        });
    }

    private buildTiposPanelSlice(source: TipoListaSelectOption[], filter: string, selectedId: number | null): TipoListaSelectOption[] {
        const list = filter ? source.filter((t) => this.flexibleMatch(t._search, filter)) : source;
        if (list.length <= this.TIPOS_PANEL_MAX) {
            return list;
        }

        const slice = list.slice(0, this.TIPOS_PANEL_MAX);
        if (selectedId == null) {
            return slice;
        }

        const selected = source.find((t) => t.value === selectedId);
        if (selected && !slice.some((t) => t.value === selectedId)) {
            return [selected, ...list.filter((t) => t.value !== selectedId).slice(0, this.TIPOS_PANEL_MAX - 1)];
        }

        return slice;
    }

    isRowTiposReady(index: number): boolean {
        const row = this.referenciasFormArray.at(index);
        const sistemaId = row?.get('sistema_id')?.value as number | null;
        if (this.isSistemaPorDefecto(sistemaId)) {
            return this.tiposArticuloCatalogReady();
        }
        return !!this.rowTiposCatalog()[index]?.ready;
    }

    getTiposPanelOptions(index: number): TipoListaSelectOption[] {
        const row = this.referenciasFormArray.at(index);
        const sistemaId = row?.get('sistema_id')?.value as number | null;
        const selectedId = (row?.get('lista_id')?.value ?? null) as number | null;
        const filter = this.tiposPanelFilter[index] ?? '';

        if (this.isSistemaPorDefecto(sistemaId)) {
            return this.buildTiposPanelSlice(this.tiposArticuloCatalog, filter, selectedId);
        }

        const rowOptions = this.rowTiposCatalog()[index]?.options ?? [];
        if (!filter) {
            return rowOptions;
        }
        return rowOptions.filter((t) => this.flexibleMatch(t._search, filter));
    }

    onTiposPanelShow(index: number): void {
        this.tiposPanelFilter[index] = '';
        this.cdr.markForCheck();
    }

    onFilterTiposPanel(event: { filter?: string }, index: number): void {
        this.tiposPanelFilter[index] = (event.filter ?? '').trim();
        this.cdr.markForCheck();
    }

    getTiposLotePanelOptions(): TipoListaSelectOption[] {
        const selectedId = (this.loteForm.get('articulo_id')?.value ?? null) as number | null;
        const source = this.tiposLoteCatalog().options.length > 0 ? this.tiposLoteCatalog().options : this.tiposArticuloCatalog;
        return this.buildTiposPanelSlice(source, this.tiposLotePanelFilter, selectedId);
    }

    onTiposLotePanelShow(): void {
        this.tiposLotePanelFilter = '';
        this.cdr.markForCheck();
    }

    onFilterTiposLotePanel(event: { filter?: string }): void {
        this.tiposLotePanelFilter = (event.filter ?? '').trim();
        this.cdr.markForCheck();
    }

    private isSistemaPorDefecto(sistemaId: number | null): boolean {
        const system = this.sistemas.find((s) => s.value === sistemaId);
        return this.normalizeLabel(system?.label ?? '') === 'por defecto';
    }

    private fetchTiposArticuloOptions(sistemaId: number): Observable<TipoListaSelectOption[]> {
        const esPorDefecto = this.isSistemaPorDefecto(sistemaId);
        if (esPorDefecto && this.tiposArticuloCatalogReady()) {
            return of(this.tiposArticuloCatalog);
        }

        return this.listaService.getTiposArticuloPorSistema(sistemaId, esPorDefecto).pipe(
            map((listas) => {
                const options = this.mapListasToOptions(listas);
                if (esPorDefecto) {
                    this.tiposArticuloCatalog = options;
                    this.tiposArticuloCatalogReady.set(true);
                }
                return options;
            })
        );
    }

    private preloadTiposPorDefecto(): void {
        this.listaService.getByTipo('Tipo de Artículo', undefined, 5000).subscribe({
            next: (listas) => {
                const options = this.mapListasToOptions(listas);
                this.deferViewUpdate(() => {
                    this.tiposArticuloCatalog = options;
                    this.tiposArticuloCatalogReady.set(true);
                    this.syncPendingPorDefectoRows();
                });
            }
        });
    }

    private resolveDefaultListaId(tipos: { label: string; value: number }[]): number | null {
        if (!tipos.length) {
            return null;
        }

        const byId = tipos.find((t) => t.value === CreateComponent.DEFAULT_ARTICLE_TYPE_LISTA_ID);
        if (byId) {
            return byId.value;
        }

        const byName = tipos.find((t) => this.normalizeLabel(t.label) === 'por defecto');
        return byName?.value ?? null;
    }

    private resolveDefaultListaIdFromCache(): number | null {
        if (!this.tiposArticuloCatalog.length) {
            return null;
        }
        return this.resolveDefaultListaId(this.tiposArticuloCatalog);
    }

    private tiposSourceForRow(index: number): TipoListaSelectOption[] {
        const row = this.referenciasFormArray.at(index);
        const sistemaId = row?.get('sistema_id')?.value as number | null;
        if (this.isSistemaPorDefecto(sistemaId)) {
            return this.tiposArticuloCatalog;
        }
        return this.rowTiposCatalog()[index]?.options ?? [];
    }

    private getDefaultSistemaId(): number | null {
        const defaultSistema = this.sistemas.find((s) => this.normalizeLabel(s.label) === 'por defecto');
        return defaultSistema?.value ?? null;
    }

    public flexibleMatch(text: string, search: string): boolean {
        if (!search) return true;
        const normalizedText = this.removeAccents(text.toLowerCase());
        const searchTerms = this.removeAccents(search.toLowerCase())
            .split(/\s+/)
            .filter((t) => t.length > 0);
        return searchTerms.every((term) => normalizedText.includes(term));
    }

    onFilterSistemas(event: any) {
        const query = (event.filter || '').trim();
        if (!query) {
            this.sistemas = [...this.sistemasOriginal];
            return;
        }
        this.sistemas = this.sistemasOriginal.filter((s) => this.flexibleMatch(s._search, query));
    }

    onFilterTerceros(event: any) {
        const query = (event.filter || '').trim();
        if (!query) {
            this.terceros = [...this.tercerosOriginal];
            return;
        }
        this.terceros = this.tercerosOriginal.filter((t) => this.flexibleMatch(t.label, query));
    }


    /**
     * Muestra el diálogo para crear un nuevo tercero
     */
    openCreateTerceroDialog(): void {
        this.displayCreateTerceroDialog = true;
    }

    /**
     * Maneja el evento cuando se crea un tercero exitosamente
     */
    onTerceroCreated(tercero: any): void {
        // Recargar lista de terceros y seleccionar el nuevo
        this.loadTerceros(tercero.id);
        this.displayCreateTerceroDialog = false;
    }

    loadTerceros(preselectId: number | null = null): void {
        this.terceroService.list({ per_page: 200, tipo: 'Cliente' }).subscribe({
            next: (response) => {
                this.tercerosFull = response.data;
                this.terceros = response.data
                    .map((t) => ({
                        label: t.nombre || `Tercero ${t.id}`,
                        value: t.id
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label));
                this.tercerosOriginal = [...this.terceros];

                if (preselectId) {
                    this.pedidoForm.patchValue({ tercero_id: preselectId });
                }
            }
        });
    }

    /**
     * Muestra el diálogo para crear un nuevo contacto
     */
    openCreateContactoDialog(): void {
        if (!this.terceroId()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe seleccionar un cliente primero'
            });
            return;
        }
        this.displayCreateContactoDialog = true;
    }

    /**
     * Maneja el evento cuando se crea un contacto exitosamente
     */
    onContactoCreated(contacto: any): void {
        const clienteId = this.terceroId();
        if (clienteId) {
            this.loadContactos(clienteId);
            // Seleccionar el nuevo contacto
            setTimeout(() => {
                this.pedidoForm.patchValue({ contacto_id: contacto.id });

                // Si es el contacto principal o único, actualizar info adicional si es necesario
                console.log('Contacto creado y seleccionado:', contacto);
            }, 500);
        }
        this.displayCreateContactoDialog = false;
    }

    /**
     * Muestra el diálogo para crear una nueva máquina
     */
    openCreateMaquinaDialog(): void {
        if (!this.terceroId()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Atención',
                detail: 'Debe seleccionar un cliente primero'
            });
            return;
        }
        this.maquinaIdEdicionModal = null;
        this.displayCreateMaquinaDialog = true;
    }

    onMaquinaModalFromPedidoVisibleChange(visible: boolean): void {
        this.displayCreateMaquinaDialog = visible;
        if (!visible) {
            this.maquinaIdEdicionModal = null;
        }
    }

    /** Abre el modal reutilizado (misma pieza que en terceros) para editar la máquina elegida. */
    abrirModalEditarMaquina(maquina: { id: number }): void {
        if (!maquina?.id) {
            return;
        }
        this.maquinaIdEdicionModal = maquina.id;
        this.displayCreateMaquinaDialog = true;
    }

    onMaquinaUpdatedFromPedidoModal(_m: any): void {
        const clienteId = this.terceroId();
        if (clienteId) {
            this.loadMaquinasPorCliente(clienteId);
        }
    }

    /**
     * Maneja el evento cuando se crea una máquina exitosamente
     */
    onMaquinaCreated(maquina: any): void {
        const clienteId = this.terceroId();
        if (clienteId) {
            this.loadMaquinasPorCliente(clienteId);
            // Seleccionar la nueva máquina
            setTimeout(() => {
                this.pedidoForm.patchValue({ maquina_id: maquina.id });
            }, 500);
        }
        this.displayCreateMaquinaDialog = false;
    }

    /**
     * Muestra el diálogo de ayuda para importación masiva
     */
    openHelpDialog(): void {
        this.displayHelpDialog = true;
    }

    /**
     * Carga datos iniciales para los selects
     */
    private loadInitialData(): void {
        // Cargar terceros (clientes)
        this.loadTerceros();

        // Cargar sistemas y enriquecer para búsqueda flexible
        this.sistemaService.getAll({ per_page: 100, include: 'listas' }).subscribe({
            next: (response) => {
                this.sistemas = response.data
                    .map((s: any) => {
                        // Combinar nombre del sistema con todos sus tipos de artículo para permitir buscar tipos dentro del sistema
                        const tiposRelacionados = (s.listas || [])
                            .filter((l: any) => l.tipo === 'Tipo de Artículo')
                            .map((l: any) => l.nombre)
                            .join(' ');

                        return {
                            label: s.nombre,
                            value: s.id,
                            _search: `${s.nombre} ${tiposRelacionados}`
                        };
                    })
                    .sort((a, b) => {
                        const labelA = a.label.toLowerCase();
                        const labelB = b.label.toLowerCase();
                        if (labelA === 'por defecto') return -1;
                        if (labelB === 'por defecto') return 1;
                        return labelA.localeCompare(labelB);
                    });
                this.sistemasOriginal = [...this.sistemas];
            }
        });

        // Cargar marcas
        this.listaService.getByTipo('Marca').subscribe({
            next: (marcas) => {
                this.marcas = marcas.map((m) => ({
                    label: m.nombre,
                    value: m.id
                }));
            }
        });

        // Cargar fabricantes
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data.map((f) => ({
                    label: f.nombre,
                    value: f.id
                }));
            }
        });

        // Cargar referencias (para el select del paso 3)
        this.loadReferencias();

        // Cargar tipos de artículos
        this.loadTiposArticulos();
        this.preloadTiposPorDefecto();
    }

    /**
     * Maneja el cambio de sistema en una fila
     */
    onSistemaChange(sistemaId: number | null, index: number, clear = true): void {
        const row = this.referenciasFormArray.at(index);

        if (clear && row) {
            row.patchValue({ lista_id: null, articulo_id: null, referencia_id: null }, { emitEvent: false });
            this.referenciasPorFila[index] = [];
        }

        if (!sistemaId) {
            if (clear) {
                this.clearRowTiposCatalog(index);
            }
            return;
        }

        const systemLabel = this.sistemas.find((s) => s.value === sistemaId)?.label;

        const loadTipos = (options: TipoListaSelectOption[]) => {
            this.applyRowTiposLoaded(index, options, row, systemLabel);
        };

        const fetchTipos = () => {
            if (this.isSistemaPorDefecto(sistemaId) && this.tiposArticuloCatalogReady()) {
                this.applyRowTiposReadyPorDefecto(index, row, systemLabel);
                return;
            }

            this.fetchTiposArticuloOptions(sistemaId).subscribe({
                next: (options) => loadTipos(options)
            });
        };

        if (clear) {
            this.clearRowTiposCatalog(index, fetchTipos);
        } else {
            fetchTipos();
        }
    }

    /**
     * Maneja el cambio de tipo de artículo (lista) en una fila
     */
    onListaChange(listaId: number | null, index: number): void {
        const row = this.referenciasFormArray.at(index);
        row.patchValue({ articulo_id: null, referencia_id: null }, { emitEvent: false });
        this.referenciasPorFila[index] = [];

        if (!listaId) return;

        const opciones = this.tiposSourceForRow(index);
        const opcion = opciones.find((o: any) => o.value === listaId);
        const listaNombre = opcion?.label ?? '';
        if (!listaNombre) return;

        this.articuloService.getAll({ per_page: 500 }).subscribe({
            next: (resArt) => {
                const articulo = resArt.data.find((a: any) => (a.definicion && a.definicion.toLowerCase() === listaNombre.toLowerCase()) || (a.descripcionEspecifica && a.descripcionEspecifica.toLowerCase() === listaNombre.toLowerCase()));
                if (articulo) {
                    row.patchValue({ articulo_id: articulo.id }, { emitEvent: false });
                    this.onArticuloChange(articulo.id, index, false);
                }
            }
        });
    }

    /**
     * Maneja el cambio de artículo (Tipo) en una fila
     */
    onArticuloChange(articuloId: number | null, index: number, clear = true): void {
        const row = this.referenciasFormArray.at(index);

        if (clear && row) {
            row.patchValue({ referencia_id: null }, { emitEvent: false });
            this.referenciasPorFila[index] = [];
        }

        if (!articuloId) return;

        // Cargar referencias asociadas a este artículo
        this.referenciaService.getAll({ articulo_id: articuloId, per_page: 100 }).subscribe({
            next: (response) => {
                this.referenciasPorFila[index] = response.data.map((r) => ({
                    label: r.referencia,
                    value: r.id
                }));
            }
        });
    }

    /**
     * Carga las referencias disponibles (globales, se mantiene por compatibilidad)
     */
    private loadReferencias(): void {
        this.referenciaService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                this.referencias = response.data.map((r) => ({
                    label: r.referencia,
                    value: r.id
                }));
            }
        });
    }

    /**
     * Carga los tipos de artículos (definiciones únicas)
     */
    private loadTiposArticulos(): void {
        this.articuloService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                // Obtener definiciones únicas
                const definicionesUnicas = response.data.map((a) => a.definicion).filter((v, i, a) => v && a.indexOf(v) === i);

                this.tiposArticulos = definicionesUnicas.map((d) => ({
                    label: d,
                    value: d
                }));
            }
        });
    }

    /**
     * Getter para el FormArray de referencias
     */
    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    /**
     * Validador personalizado para requerir referencia_id o texto manual.
     */
    private referenciaOrDefinicionValidator(group: FormGroup): any {
        const referenciaId = group.get('referencia_id')?.value;
        const definicion = (group.get('definicion')?.value || '').toString().trim();
        return referenciaId || definicion ? null : { requiredReferenciaOrDefinicion: true };
    }

    onReferenciaManualInput(index: number): void {
        const row = this.referenciasFormArray.at(index);
        if (!row) return;
        // Si el usuario modifica el texto manualmente, invalidamos la asociación previa.
        row.patchValue({ referencia_id: null }, { emitEvent: false });
    }

    buscarReferencias(event: any, index: number): void {
        const row = this.referenciasFormArray.at(index);
        if (!row) return;
        this.onReferenciaManualInput(index);
        const search = (event?.query || '').toString().trim();
        const articuloId = row.get('articulo_id')?.value;
        const params: any = { search, per_page: 30 };
        if (articuloId) {
            params.articulo_id = articuloId;
        }

        this.referenciaService.getAll(params).subscribe({
            next: (response) => {
                // Si el filtro por artículo no devolvió nada, hacemos fallback global.
                if (response.data.length === 0 && articuloId) {
                    this.referenciaService.getAll({ search, per_page: 30 }).subscribe({
                        next: (fallback) => {
                            this.referenciasPorFila[index] = fallback.data.map((r) => ({
                                label: r.referencia,
                                value: r.id
                            }));
                        },
                        error: () => {
                            this.referenciasPorFila[index] = [];
                        }
                    });
                    return;
                }

                this.referenciasPorFila[index] = response.data.map((r) => ({
                    label: r.referencia,
                    value: r.id
                }));
            },
            error: () => {
                this.referenciasPorFila[index] = [];
            }
        });
    }

    onReferenciaSelect(event: any, index: number): void {
        const row = this.referenciasFormArray.at(index);
        if (!row) return;
        const rawValue = event?.value;
        const suggestions = this.referenciasPorFila[index] || [];
        const option =
            rawValue && typeof rawValue === 'object'
                ? rawValue
                : suggestions.find((o: any) => (o?.label || '').toString().toLowerCase() === (rawValue || '').toString().toLowerCase()) ||
                  (suggestions.length === 1 &&
                  (suggestions[0]?.label || '')
                      .toString()
                      .toLowerCase()
                      .startsWith((rawValue || '').toString().toLowerCase())
                      ? suggestions[0]
                      : null);
        const referenciaId = option && typeof option === 'object' ? (option.value ?? null) : null;
        if (!referenciaId) return;

        // Guardamos label explícito para evitar que quede el texto parcial escrito.
        row.patchValue(
            {
                referencia_id: referenciaId,
                definicion: option.label ?? ''
            },
            { emitEvent: false }
        );
    }

    private getCodigoReferencia(row: FormGroup): string {
        const raw = row.get('definicion')?.value;
        if (raw && typeof raw === 'object') {
            return ((raw.label || '') as string).trim().toUpperCase();
        }
        return (raw || '').toString().trim().toUpperCase();
    }

    resolverReferenciaFila(index: number): void {
        this.resolverReferenciaFilaControl(index).subscribe();
    }

    private resolverReferenciaFilaControl(index: number): Observable<void> {
        const row = this.referenciasFormArray.at(index);
        if (!row) return of(void 0);

        let referenciaId = row.get('referencia_id')?.value;
        const codigo = this.getCodigoReferencia(row as FormGroup);

        // Si no llegó referencia_id desde onSelect, intentar resolverla
        // contra las sugerencias cargadas antes de crear temporal.
        if (!referenciaId && codigo) {
            const suggestions = this.referenciasPorFila[index] || [];
            const option = suggestions.find((o: any) => (o?.label || '').toString().toUpperCase() === codigo) || (suggestions.length === 1 && (suggestions[0]?.label || '').toString().toUpperCase().startsWith(codigo) ? suggestions[0] : null);
            if (option?.value) {
                referenciaId = option.value;
                row.patchValue(
                    {
                        referencia_id: option.value,
                        definicion: option.label ?? codigo
                    },
                    { emitEvent: false }
                );
            }
        }

        if (referenciaId || !codigo) return of(void 0);

        const cantidad = Number(row.get('cantidad')?.value || 1);
        let marcaId = row.get('marca_id')?.value ? Number(row.get('marca_id')?.value) : null;
        const articuloId = row.get('articulo_id')?.value ? Number(row.get('articulo_id')?.value) : null;
        const listaId = row.get('lista_id')?.value ? Number(row.get('lista_id')?.value) : null;

        if (!marcaId) {
            const maquina = this.selectedMaquina();
            if (maquina?.fabricante_id) {
                marcaId = Number(maquina.fabricante_id);
            }
        }

        const esTemporal = !articuloId;
        const comentarioTemporal = esTemporal ? 'Referencia temporal desde pedido interno - Requiere revision' : undefined;

        return this.referenciaService.bulkSearchOrCreate([{ codigo, cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1 }], esTemporal, marcaId, comentarioTemporal, articuloId, listaId).pipe(
            map((res) => {
                const created = res?.data?.[0];
                if (created?.referencia_id) {
                    row.patchValue(
                        {
                            referencia_id: created.referencia_id,
                            definicion: created.codigo || codigo
                        },
                        { emitEvent: false }
                    );
                }
            }),
            catchError(() => of(void 0))
        );
    }

    private resolverReferenciasAntesDeGuardar(): Observable<void> {
        const tasks: Observable<void>[] = [];
        this.referenciasFormArray.controls.forEach((_, index) => {
            tasks.push(this.resolverReferenciaFilaControl(index));
        });

        if (tasks.length === 0) return of(void 0);
        return forkJoin(tasks).pipe(map(() => void 0));
    }

    agregarReferencia(data: any = {}): void {
        const index = this.referenciasFormArray.length;

        if (data.tipos?.length) {
            this.setRowTiposCatalog(index, { ready: true, options: data.tipos });
        }
        this.referenciasPorFila[index] = data.referencias || [];

        const defaultSistemaId = this.getDefaultSistemaId();
        const sistemaInicialId = (data.sistema_id ?? defaultSistemaId) as number | null;
        const sistemaInicial = this.sistemas.find((s) => s.value === sistemaInicialId);
        const esSistemaPorDefecto = this.normalizeLabel(sistemaInicial?.label ?? '') === 'por defecto';
        const defaultListaId =
            data.lista_id ?? (esSistemaPorDefecto ? this.resolveDefaultListaIdFromCache() : null);

        const referenciaForm = this.fb.group({
            estado: [true],
            seleccionado: [false],
            sistema_id: [sistemaInicialId],
            lista_id: [defaultListaId],
            articulo_id: [data.articulo_id ?? null],
            referencia_id: [data.referencia_id ?? null],
            marca_id: [data.marca_id ?? null],
            cantidad: [data.cantidad ?? 1, [Validators.required, Validators.min(1)]],
            comentario: [data.comentario ?? ''],
            definicion: [data.definicion ?? ''],
            imagen: [data.imagen ?? null],
            files: [[]], // Campo para almacenar los objetos File seleccionados
            proveedores: this.fb.array(data.proveedores ?? [])
        });

        this.referenciasFormArray.push(referenciaForm);

        // Suscribirse a cambios de sistema para cargar tipos
        referenciaForm.get('sistema_id')?.valueChanges.subscribe((sistemaId) => {
            this.onSistemaChange(sistemaId as number | null, index); // por default clear = true
        });

        // Suscribirse a cambios de lista para cargar artículos
        referenciaForm.get('lista_id')?.valueChanges.subscribe((listaId) => {
            this.onListaChange(listaId as number | null, index);
        });

        // Suscribirse a cambios de artículo para cargar referencias
        referenciaForm.get('articulo_id')?.valueChanges.subscribe((articuloId) => {
            this.onArticuloChange(articuloId as number | null, index); // por default clear = true
        });

        if (sistemaInicialId && (!data.tipos || data.tipos.length === 0)) {
            this.onSistemaChange(sistemaInicialId, index, false);
        }
        if (data.articulo_id && (!data.referencias || data.referencias.length === 0)) {
            this.onArticuloChange(data.articulo_id, index, false);
        }
    }

    /**
     * Elimina una referencia del FormArray
     */
    eliminarReferencia(index: number): void {
        this.quitarFilaReferencia(index);
    }

    private quitarFilaReferencia(index: number): void {
        this.referenciasFormArray.removeAt(index);
        if (index < this.referenciasPorFila.length) {
            this.referenciasPorFila.splice(index, 1);
        }
        if (index < this.tiposPorFilaOriginal.length) {
            this.tiposPorFilaOriginal.splice(index, 1);
        }
        this.shiftRowTiposCatalogAfterRemove(index);
    }

    hayReferenciasSeleccionadas(): boolean {
        return this.referenciasFormArray.controls.some((c) => c.get('seleccionado')?.value === true);
    }

    eliminarReferenciasSeleccionadas(): void {
        const indices: number[] = [];
        this.referenciasFormArray.controls.forEach((c, i) => {
            if (c.get('seleccionado')?.value === true) {
                indices.push(i);
            }
        });
        if (indices.length === 0) {
            return;
        }
        this.confirmationService.confirm({
            message: `¿Eliminar ${indices.length} ítem(es) seleccionado(s)?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                indices
                    .sort((a, b) => b - a)
                    .forEach((i) => {
                        this.quitarFilaReferencia(i);
                    });
                this.messageService.add({
                    severity: 'success',
                    summary: 'Ítems eliminados',
                    detail: `Se quitaron ${indices.length} fila(s) del pedido.`
                });
            }
        });
    }

    /**
     * Inicia el flujo de agregado múltiple
     */
    abrirDialogoLote(): void {
        const defaultSistemaId = this.getDefaultSistemaId();
        const defaultListaId = this.resolveDefaultListaIdFromCache();
        this.loteForm.reset({
            cantidad_lote: 1,
            sistema_id: defaultSistemaId,
            articulo_id: defaultListaId,
            referencias_seleccionadas: []
        });
        this.displayLoteDialog = true;
        if (defaultSistemaId) {
            this.onSistemaLoteChange(defaultSistemaId);
        }
    }

    cerrarDialogoLote(): void {
        this.displayLoteDialog = false;
    }

    private parseComentariosRaw(raw: unknown): { origen: string; comentario: string; fecha?: string }[] {
        if (!raw) {
            return [];
        }

        const esTextoInvalido = (val: any): boolean => {
            if (val === undefined || val === null) return true;
            const s = String(val).trim();
            return s === '[object Object]' || s.includes('[object Object]') || s === 'Sin comentario adicional' || s === '';
        };

        // Si ya es un array (nuevo formato del API con casts)
        if (Array.isArray(raw)) {
            return raw
                .filter((c) => c && typeof c === 'object' && c.comentario && !esTextoInvalido(c.comentario))
                .map((c) => ({
                    origen: (c.origen as string) || 'Interno',
                    comentario: String(c.comentario),
                    fecha: typeof c.fecha === 'string' ? c.fecha : undefined
                }));
        }

        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (esTextoInvalido(trimmed)) {
                return [];
            }

            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter((c) => c && typeof c === 'object' && c.comentario && !esTextoInvalido(c.comentario))
                        .map((c) => ({
                            origen: (c.origen as string) || 'Interno',
                            comentario: String(c.comentario),
                            fecha: typeof c.fecha === 'string' ? c.fecha : undefined
                        }));
                }
            } catch {
                // No es JSON, continuar con formato legacy
            }

            const sinPrefijo = trimmed.startsWith('Comentario del cliente:') ? trimmed.replace('Comentario del cliente:', '').trim() : trimmed;

            if (esTextoInvalido(sinPrefijo)) {
                return [];
            }

            return [
                {
                    origen: 'Cliente',
                    comentario: sinPrefijo
                }
            ];
        }

        return [];
    }

    private buildComentariosPayload(comentarios: { origen: string; comentario: string; fecha?: string }[]): any[] {
        return comentarios;
    }

    abrirDialogoComentario(index: number): void {
        this.activeItemIndex = index;
        const rawComentario = this.referenciasFormArray.at(index).get('comentario')?.value;
        this.comentariosItemActual = this.parseComentariosRaw(rawComentario);
        this.comentarioControl.setValue('');
        const user = this.authService.currentUser();
        const rol = user && user.roles && user.roles.length > 0 ? user.roles[0] : 'Interno';
        this.origenComentarioControl.setValue(rol);
        this.displayComentarioDialog = true;
    }

    guardarComentario(): void {
        if (this.activeItemIndex !== null) {
            const texto = (this.comentarioControl.value || '').toString().trim();
            if (texto) {
                const row = this.referenciasFormArray.at(this.activeItemIndex);
                const rawAnterior = row.get('comentario')?.value;
                const existentes = this.parseComentariosRaw(rawAnterior);

                existentes.push({
                    origen: (this.origenComentarioControl.value || 'Interno').toString(),
                    comentario: texto,
                    fecha: new Date().toISOString()
                });

                row.patchValue({ comentario: this.buildComentariosPayload(existentes) });
            }
        }
        this.displayComentarioDialog = false;
        this.activeItemIndex = null;
        this.comentariosItemActual = [];
        this.comentarioControl.setValue('');
    }

    abrirDialogoImagen(index: number): void {
        this.activeItemIndex = index;
        const currentImagen = this.referenciasFormArray.at(index).get('imagen')?.value || '';
        this.imagenControl.setValue(currentImagen);
        this.displayImagenDialog = true;
    }

    guardarImagen(): void {
        if (this.activeItemIndex !== null) {
            this.referenciasFormArray.at(this.activeItemIndex).patchValue({ imagen: this.imagenControl.value });
        }
        this.displayImagenDialog = false;
        this.activeItemIndex = null;
    }

    /**
     * Maneja la selección de archivos para un ítem específico
     */
    onFilesSelected(event: any, index: number): void {
        const files = Array.from(event.target.files as FileList);
        if (files.length > 0) {
            const control = this.referenciasFormArray.at(index).get('files');
            const currentFiles = control?.value || [];

            // Límite de 10 imágenes por ítem
            const remaining = 10 - currentFiles.length;
            if (remaining <= 0) {
                this.messageService.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Máximo 10 imágenes por ítem' });
                return;
            }

            const toAdd = files.slice(0, remaining);
            control?.setValue([...currentFiles, ...toAdd]);

            if (files.length > remaining) {
                this.messageService.add({ severity: 'info', summary: 'Límite parcial', detail: 'Solo se agregaron las primeras 10 imágenes' });
            }

            // Si la galería está abierta, actualizarla
            if (this.displayGallery && this.selectedItemIndex === index) {
                this.updateGalleriaImages(index);
            }
        }
        // Resetear input para permitir seleccionar el mismo archivo
        event.target.value = '';
    }

    /**
     * Elimina un archivo de la lista de un ítem
     */
    removeFile(itemIndex: number, fileIndex: number): void {
        const control = this.referenciasFormArray.at(itemIndex).get('files');
        const currentFiles = [...(control?.value || [])];

        if (currentFiles[fileIndex]) {
            currentFiles.splice(fileIndex, 1);
            control?.setValue(currentFiles);

            // Actualizar galería si es necesario
            if (this.displayGallery && this.selectedItemIndex === itemIndex) {
                this.updateGalleriaImages(itemIndex);
                if (currentFiles.length === 0) {
                    this.displayGallery = false;
                }
            }
        }
    }

    /**
     * Abre la galería de imágenes para un ítem
     */
    openGallery(index: number): void {
        const files = this.referenciasFormArray.at(index).get('files')?.value || [];
        if (files.length === 0) return;

        this.selectedItemIndex = index;
        this.activeIndexGallery = 0; // Resetear índice al abrir
        this.updateGalleriaImages(index);
        this.displayGallery = true;
    }

    /**
     * Actualiza el array de previsualizaciones para la galería
     */
    private updateGalleriaImages(index: number): void {
        const files = this.referenciasFormArray.at(index).get('files')?.value || [];
        // Liberar URLs anteriores
        this.galleriaImages.forEach((img) => {
            if (img.itemImageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(img.itemImageSrc);
            }
        });

        this.galleriaImages = files.map((file: File) => {
            const url = URL.createObjectURL(file);
            return {
                itemImageSrc: url,
                thumbnailImageSrc: url,
                alt: file.name,
                title: file.name,
                file: file
            };
        });
    }

    onSistemaLoteChange(sistemaId: number | null): void {
        this.loteForm.patchValue({ articulo_id: null, referencias_seleccionadas: [] });
        this.loteForm.get('articulo_id')?.disable();
        this.loteForm.get('referencias_seleccionadas')?.disable();
        this.referenciasLote = [];

        if (!sistemaId) {
            this.deferViewUpdate(() => {
                this.tiposLoteCatalog.set({ ready: false, options: [] });
            });
            return;
        }

        const systemLabel = this.sistemas.find((s) => s.value === sistemaId)?.label;
        const esPorDefecto = this.isSistemaPorDefecto(sistemaId);

        const applyLoteTipos = (options: TipoListaSelectOption[]) => {
            this.deferViewUpdate(() => {
                this.tiposLoteOriginal = [...options];
                this.tiposLoteCatalog.set({ ready: true, options });
                if (options.length > 0) {
                    this.loteForm.get('articulo_id')?.enable();
                }
                if (esPorDefecto) {
                    this.deferViewUpdate(() => {
                        const defaultListaId = this.resolveDefaultListaId(options);
                        if (defaultListaId) {
                            this.loteForm.patchValue({ articulo_id: defaultListaId });
                            this.onArticuloLoteChange(defaultListaId);
                        }
                    });
                }
            });
        };

        this.deferViewUpdate(() => {
            this.tiposLoteCatalog.set({ ready: false, options: [] });

            if (esPorDefecto && this.tiposArticuloCatalogReady()) {
                this.tiposLotePanelFilter = '';
                this.deferViewUpdate(() => {
                    this.tiposLoteCatalog.set({ ready: true, options: [] });
                    this.loteForm.get('articulo_id')?.enable();
                    const defaultListaId = this.resolveDefaultListaId(this.tiposArticuloCatalog);
                    if (defaultListaId) {
                        this.loteForm.patchValue({ articulo_id: defaultListaId });
                        this.onArticuloLoteChange(defaultListaId);
                    }
                });
                return;
            }

            this.fetchTiposArticuloOptions(sistemaId).subscribe({
                next: (options) => applyLoteTipos(options)
            });
        });
    }

    onArticuloLoteChange(articuloId: number | null): void {
        this.loteForm.patchValue({ referencias_seleccionadas: [] });
        this.loteForm.get('referencias_seleccionadas')?.disable();
        this.referenciasLote = [];

        if (!articuloId) return;

        this.referenciaService.getAll({ articulo_id: articuloId, per_page: 200 }).subscribe({
            next: (response) => {
                this.referenciasLote = response.data.map((r) => ({
                    label: r.referencia,
                    value: r.id,
                    definicion: r.referencia
                }));
                if (this.referenciasLote.length > 0) {
                    this.loteForm.get('referencias_seleccionadas')?.enable();
                } else {
                    this.messageService.add({ severity: 'info', summary: 'Sin referencias', detail: 'Este artículo no tiene referencias parametrizadas.' });
                }
            }
        });
    }

    agregarNuevasLote(): void {
        if (this.loteForm.invalid) {
            this.loteForm.markAllAsTouched();
            return;
        }

        const data = this.loteForm.value;
        const refs = data.referencias_seleccionadas;

        refs.forEach((refId: number) => {
            const index = this.referenciasFormArray.length;

            const refModel = this.referenciasLote.find((r) => r.value === refId);

            this.agregarReferencia({
                sistema_id: data.sistema_id,
                lista_id: data.articulo_id, // El campo articulo_id del loteForm contiene en realidad el lista_id del tipo
                articulo_id: null,
                referencia_id: refId,
                cantidad: data.cantidad_lote,
                definicion: refModel?.definicion || '',
                tipos: [
                    ...(this.tiposLoteCatalog().options.length > 0 ? this.tiposLoteCatalog().options : this.tiposArticuloCatalog)
                ],
                referencias: [...this.referenciasLote]
            });
        });

        this.messageService.add({ severity: 'success', summary: 'Agregado en Lote', detail: `Se insertaron ${refs.length} referencias exitosamente.` });
        this.cerrarDialogoLote();
    }

    /**
     * Procesa las referencias copiadas del paso 2
     */
    procesarReferenciasMasivas(): void {
        const texto = this.pedidoForm.get('referencias_copiadas')?.value || '';
        if (!texto.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No hay referencias para procesar'
            });
            return;
        }

        this.loading = true;
        const lineas = texto.split('\n');
        const referenciasParaProcesar: Array<{ cantidad: number; codigo: string }> = [];

        // Parsear líneas
        lineas.forEach((linea: string) => {
            const trimmed = linea.trim();
            if (!trimmed) return;

            // Formato: CANTIDAD [TAB o espacios] REFERENCIA
            const match = trimmed.match(/^(\d+)\s+(.+)$/);
            if (match) {
                const cantidad = parseInt(match[1], 10);
                const codigoReferencia = match[2].trim().toUpperCase();

                if (cantidad > 0 && codigoReferencia) {
                    referenciasParaProcesar.push({ cantidad, codigo: codigoReferencia });
                }
            }
        });

        if (referenciasParaProcesar.length === 0) {
            this.loading = false;
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se encontraron referencias válidas en el formato correcto (Cantidad [Espacio] Referencia)'
            });
            return;
        }

        // Una sola petición al backend para buscar o crear todas las referencias
        this.referenciaService.bulkSearchOrCreate(referenciasParaProcesar).subscribe({
            next: (response) => {
                this.loading = false;
                const resultados = response.data;

                if (resultados && resultados.length > 0) {
                    resultados.forEach((item: any) => {
                        // 1. Asegurar que la referencia esté en el pool global de opciones para los selects
                        const existeEnGlobal = this.referencias.find((r) => r.value === item.referencia_id);
                        if (!existeEnGlobal) {
                            this.referencias.push({
                                label: item.codigo,
                                value: item.referencia_id
                            });
                        }

                        // 2. Agregar al FormArray pasando la información necesaria
                        this.agregarReferenciaAlFormArray(item.referencia_id, item.cantidad, item.codigo, item.referencia);
                    });

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `${resultados.length} referencia(s) procesada(s) exitosamente`
                    });

                    // Limpiar el campo de texto y cerrar el área de importación
                    this.pedidoForm.get('referencias_copiadas')?.setValue('');
                    this.showBulkImport = false;
                }
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron procesar las referencias: ' + (err.error?.message || err.message)
                });
            }
        });
    }

    /**
     * Agrega una referencia al FormArray (método privado)
     */
    private agregarReferenciaAlFormArray(referenciaId: number | null, cantidad: number, codigo: string = '', referenciaData: any = null): void {
        const data: any = {
            referencia_id: referenciaId,
            cantidad: cantidad,
            definicion: codigo // Usamos el código como definición inicial
        };

        // Si tenemos la data completa de la referencia, podemos pre-cargar más campos
        if (referenciaData) {
            data.marca_id = referenciaData.marca_id;
            data.lista_id = referenciaData.lista_id;
            data.articulo_id = referenciaData.articulo_id;

            // Si tiene artículo y sistema, los usamos
            if (referenciaData.articulo) {
                data.definicion = referenciaData.articulo.definicion;
                // Si el backend retornó el sistema a través del artículo o directamente
                if (referenciaData.articulo.sistema_id) {
                    data.sistema_id = referenciaData.articulo.sistema_id;
                }
            }

            // Para que el select de la fila tenga la opción disponible de inmediato
            data.referencias = [
                {
                    label: codigo,
                    value: referenciaId
                }
            ];
        }

        this.agregarReferencia(data);
    }

    /**
     * Navega al siguiente paso del wizard
     */
    nextStep(): void {
        // Validar paso actual antes de avanzar
        if (this.activeIndex === 0) {
            // Validar paso 1: Cliente
            if (!this.pedidoForm.get('tercero_id')?.valid) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validación',
                    detail: 'Por favor seleccione un cliente'
                });
                return;
            }
        }

        if (this.activeIndex < this.items.length - 1) {
            this.activeIndex++;
        }
    }

    /**
     * Navega al paso anterior del wizard
     */
    prevStep(): void {
        if (this.activeIndex > 0) {
            this.activeIndex--;
        }
    }

    /**
     * Envía el formulario para crear el pedido
     */
    onSubmit(): void {
        // Habilitar campos deshabilitados para poder validar correctamente
        this.pedidoForm.get('articulo_id')?.enable();
        this.pedidoForm.get('referencias_seleccionadas')?.enable();

        if (this.pedidoForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        // Validar que haya al menos una referencia solo si NO es estado nuevo
        const estado = this.pedidoForm.get('estado')?.value;
        const tieneReferencias = this.referenciasFormArray.length > 0;

        if (estado !== 'Nuevo' && !tieneReferencias) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Referencias requeridas',
                detail: 'Debe agregar al menos una referencia para estados diferentes de Nuevo'
            });
            return;
        }

        // Verificar si la máquina está seleccionada y revisada
        const maquinaId = this.pedidoForm.get('maquina_id')?.value;
        let puedeEnviarAAnalisis = false;

        if (maquinaId) {
            const maquinaBuscada = this.maquinasFull.find((m: any) => m.id === maquinaId);
            puedeEnviarAAnalisis = maquinaBuscada && maquinaBuscada.estado_revision === 'revisado';
        }

        // Si la máquina está revisada, preguntar si quiere enviar a análisis
        if (puedeEnviarAAnalisis) {
            this.confirmationService.confirm({
                message: '¿Desea enviar este pedido a análisis ahora? Los analistas serán notificados.',
                header: 'Enviar a Análisis',
                icon: 'pi pi-search',
                acceptLabel: 'Sí',
                rejectLabel: 'No',
                rejectButtonProps: { severity: 'secondary' },
                accept: () => {
                    this.pedidoForm.patchValue({ estado: 'En_Analisis' });
                    this.crearPedido();
                },
                reject: () => {
                    this.pedidoForm.patchValue({ estado: 'Nuevo' });
                    this.crearPedidoPendiente(true); // Usuario eligió no enviar a análisis
                }
            });
        } else {
            // Sin máquina o máquina sin revisar: crear directamente en estado Nuevo
            this.pedidoForm.patchValue({ estado: 'Nuevo' });
            this.crearPedidoPendiente();
        }
    }

    /**
     * Guarda el pedido como borrador.
     */
    onSaveDraft(): void {
        if (this.loading) {
            return;
        }

        if (!this.pedidoForm.get('tercero_id')?.value) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Cliente requerido',
                detail: 'Seleccione un cliente para guardar el pedido como borrador'
            });
            return;
        }

        this.pedidoForm.patchValue({ estado: 'Borrador' as PedidoEstado });
        this.crearPedidoPendiente();
    }

    /**
     * Crea el pedido y lo envía a análisis
     */
    private crearPedido(): void {
        this.loading = true;
        this.procesarYCrearPedido();
    }

    /**
     * Crea el pedido en estado Nuevo
     * @param esEnvioAnalisis - true si el usuario eligió NO enviar a análisis (confirm dialog)
     *                     - false o undefined si es flujo automático (sin máquina revisada)
     */
    private crearPedidoPendiente(esEnvioAnalisis: boolean = false): void {
        this.loading = true;

        // Solo mostrar mensaje si el usuario eligió NO enviar a análisis expresamente
        if (esEnvioAnalisis) {
            this.messageService.add({
                severity: 'info',
                summary: 'Pedido guardado',
                detail: `El pedido queda pendiente. Cuando esté listo, envíelo a ${PEDIDO_ESTADO_ETIQUETA.En_Analisis} desde el detalle.`
            });
        }

        this.procesarYCrearPedido();
    }

    /**
     * Procesa y crea el pedido (lógica común)
     */
    private procesarYCrearPedido(): void {
        this.resolverReferenciasAntesDeGuardar().subscribe({
            next: () => {
                const formValue = this.pedidoForm.value;
                const formData = new FormData();

                // Datos básicos del pedido
                formData.append('tercero_id', formValue.tercero_id.toString());
                if (formValue.direccion) formData.append('direccion', formValue.direccion);
                if (formValue.comentario) formData.append('comentario', formValue.comentario);
                if (formValue.maquina_id) formData.append('maquina_id', formValue.maquina_id.toString());
                if (formValue.fabricante_id) formData.append('fabricante_id', formValue.fabricante_id.toString());
                if (formValue.contacto_id) formData.append('contacto_id', formValue.contacto_id.toString());
                formData.append('estado', formValue.estado || 'Nuevo');

                // Procesar referencias y sus imágenes
                this.referenciasFormArray.controls.forEach((control, index) => {
                    const refId = control.get('referencia_id')?.value;
                    const rawDef = control.get('definicion')?.value;
                    const definicionRaw = rawDef && typeof rawDef === 'object' ? ((rawDef.label || '') as string).trim() : (rawDef || '').toString().trim();
                    const definicion = refId ? '' : definicionRaw;

                    formData.append(`referencias[${index}][referencia_id]`, refId ? refId.toString() : '');
                    formData.append(`referencias[${index}][sistema_id]`, control.get('sistema_id')?.value?.toString() || '');
                    formData.append(`referencias[${index}][lista_id]`, control.get('lista_id')?.value?.toString() || '');
                    formData.append(`referencias[${index}][marca_id]`, control.get('marca_id')?.value?.toString() || '');
                    formData.append(`referencias[${index}][cantidad]`, control.get('cantidad')?.value.toString());
                    const comentarioRaw = control.get('comentario')?.value;
                    const comentarioStr = typeof comentarioRaw === 'object' && comentarioRaw !== null
                        ? JSON.stringify(comentarioRaw)
                        : (comentarioRaw || '');
                    formData.append(`referencias[${index}][comentario]`, comentarioStr);
                    formData.append(`referencias[${index}][estado]`, (control.get('estado')?.value ?? true) ? '1' : '0');
                    formData.append(`referencias[${index}][definicion]`, definicion);

                    // Adjuntar múltiples archivos por referencia
                    const files = control.get('files')?.value || [];
                    files.forEach((file: File, fileIndex: number) => {
                        formData.append(`referencias[${index}][imagenes][${fileIndex}]`, file);
                    });

                    // Proveedores (si existen en el array)
                    const proveedores = (control.get('proveedores') as FormArray)?.value || [];
                    formData.append(`referencias[${index}][proveedores]`, JSON.stringify(proveedores));
                });

                // Despachar la acción pasando FormData
                this.store.dispatch(createPedido({ pedido: formData as any }));

                // Escuchar el resultado
                this.store
                    .select((state: any) => state.pedidos)
                    .subscribe((pedidosState: any) => {
                        if (!pedidosState.loading && this.loading) {
                            if (!pedidosState.error) {
                                this.loading = false;
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Éxito',
                                    detail: 'Pedido creado correctamente'
                                });
                                setTimeout(() => {
                                    this.router.navigate(['/app/pedidos']);
                                }, 1500);
                            } else {
                                this.loading = false;
                                // El error ya debería ser manejado por un efecto o interceptor global,
                                // pero nos aseguramos de detener el loading local.
                            }
                        }
                    });
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron resolver las referencias ingresadas'
                });
            }
        });
    }

    /**
     * Cancela y vuelve a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/pedidos']);
    }

    /**
     * Verifica si un campo es inválido y ha sido tocado
     */
    isFieldInvalid(field: string): boolean {
        const control = this.pedidoForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    /**
     * Carga los contactos de un cliente específico
     */
    private loadContactos(terceroId: number): void {
        this.contactoService.getAll({ tercero_id: terceroId }).subscribe({
            next: (response) => {
                this.contactos = response.data.map((c: any) => ({
                    label: c.nombre,
                    value: c.id
                }));
            }
        });
    }

    /**
     * Carga las máquinas de un cliente específico
     */
    private loadMaquinasPorCliente(terceroId: number): void {
        this.maquinaService.getAll({ tercero_id: terceroId }).subscribe({
            next: (response) => {
                this.maquinasFull = response.data;
                this.maquinas.set(response.data.map((m: any) => ({
                    label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''} ${m.estado_revision === 'revisado' ? '✓' : '(sin revisar)'}`,
                    value: m.id
                })));
            }
        });
    }

    /**
     * Métodos para manejo de proveedores en creación
     */
    getProveedoresControls(referenciaIndex: number): FormArray {
        return this.referenciasFormArray.at(referenciaIndex).get('proveedores') as FormArray;
    }

    toggleReferenciaExpandida(index: number): void {
        if (this.referenciaIndexParaProveedor === index) {
            this.referenciaIndexParaProveedor = null;
            this.nuevoProveedorForm = null;
        } else {
            this.referenciaIndexParaProveedor = index;
            this.initNuevoProveedorForm();
        }
    }

    private initNuevoProveedorForm(): void {
        this.nuevoProveedorForm = this.fb.group({
            tercero_id: [null, [Validators.required]],
            marca_id: [null],
            dias_entrega: [0, [Validators.required, Validators.min(0)]],
            costo_unidad: [0, [Validators.required, Validators.min(0)]],
            utilidad: [0, [Validators.required, Validators.min(0)]],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            ubicacion: ['Nacional', [Validators.required]],
            estado: [true]
        });
    }

    guardarProveedor(referenciaIndex: number): void {
        if (this.nuevoProveedorForm?.invalid) return;

        const proveedores = this.getProveedoresControls(referenciaIndex);
        proveedores.push(this.fb.group(this.nuevoProveedorForm?.value));

        this.referenciaIndexParaProveedor = null;
        this.nuevoProveedorForm = null;
    }

    removeProveedor(referenciaIndex: number, proveedorIndex: number): void {
        this.getProveedoresControls(referenciaIndex).removeAt(proveedorIndex);
    }

    getTerceroLabel(id: number): string {
        return this.terceros.find((t) => t.value === id)?.label || 'Proveedor';
    }

    getMarcaLabel(id: number): string {
        return this.marcas.find((m) => m.value === id)?.label || 'GEN';
    }

    contarLineas(): number {
        const texto = this.pedidoForm.get('referencias_copiadas')?.value || '';
        return texto.split('\n').filter((l: string) => l.trim()).length;
    }

    calculateTotal(proveedor: any): number {
        const costo = proveedor.costo_unidad || 0;
        const cantidad = proveedor.cantidad || 0;
        const utilidad = proveedor.utilidad || 0;
        return costo * cantidad * (1 + utilidad / 100);
    }

    get currentMaquinaInfo(): any {
        const id = this.pedidoForm.get('maquina_id')?.value;
        if (!id) return null;

        const maquina = this.maquinasFull.find((m) => m.id === id);
        return maquina || null;
    }

    viewMaquina(maquina: any): void {
        this.selectedMaquinaDetail = maquina;
        this.displayMaquinaDialog = true;
    }

    // ── Modal edición de referencia (inline desde pedido) ──

    abrirEditarReferenciaPedido(index: number): void {
        const row = this.referenciasFormArray.at(index);
        const refId = row?.get('referencia_id')?.value;
        if (!refId) return;
        this.editReferenciaIndex = index;
        this.editReferenciaId = typeof refId === 'number' ? refId : parseInt(String(refId), 10);
        this.showReferenciaEditModal = true;
    }

    onReferenciaEditVisibleChange(visible: boolean): void {
        this.showReferenciaEditModal = visible;
        if (!visible) {
            this.editReferenciaId = null;
            this.editReferenciaIndex = -1;
        }
    }

    onReferenciaActualizada(ref: any): void {
        // Actualizar la fila del formulario con los datos frescos
        if (this.editReferenciaIndex >= 0) {
            const row = this.referenciasFormArray.at(this.editReferenciaIndex);
            if (row) {
                row.patchValue(
                    {
                        definicion: ref?.referencia || row.get('definicion')?.value
                    },
                    { emitEvent: false }
                );
            }
        }
        this.showReferenciaEditModal = false;
        this.editReferenciaId = null;
        this.editReferenciaIndex = -1;
        if (ref?.referencia) {
            this.messageService.add({ severity: 'success', summary: 'Referencia actualizada', detail: `La referencia ${ref.referencia} ha sido actualizada en el catálogo.` });
        } else {
            this.messageService.add({ severity: 'success', summary: 'Referencia actualizada', detail: 'La referencia ha sido actualizada en el catálogo.' });
        }
    }
}
