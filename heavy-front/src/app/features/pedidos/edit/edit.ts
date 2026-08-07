import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, filter, forkJoin, of, take } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService, FilterService } from 'primeng/api';
import { ContactoService } from '../../../core/services/contacto.service';
import { ContactoCreateModalComponent } from '../../../shared/components/contacto-create-modal/contacto-create-modal.component';
import { MaquinaCreateModalComponent } from '../../../shared/components/maquina-create-modal/maquina-create-modal.component';
import { TerceroCreateModalComponent } from '../../../shared/components/tercero-create-modal/tercero-create-modal.component';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { MultiSelectModule } from 'primeng/multiselect';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';
import { AutoCompleteModule } from 'primeng/autocomplete';

import { updatePedido, loadPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { Pedido, UpdatePedidoDto, PedidoEstado, PedidoReferencia } from '../../../core/models/pedido.model';
import { PEDIDO_ESTADO_ETIQUETA, pedidoEstadoEtiqueta } from '../../../core/utils/pedido-estado-tag';
import { selectPedidoById, selectPedidosError, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { PedidoService } from '../../../core/services/pedido.service';
import { TerceroService } from '../../../core/services/tercero.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { PedidoReferenciaProveedorService } from '../../../core/services/pedido-referencia-proveedor.service';
import { PedidoArticuloService } from '../../../core/services/pedido-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { PedidoReferenciaProveedor, CreatePedidoReferenciaProveedorDto, PedidoArticulo, CreatePedidoArticuloDto } from '../../../core/models/pedido.model';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Tercero } from '../../../core/models/tercero.model';

import { MaquinaDetailComponent } from '../../../shared/components/maquina-detail/maquina-detail.component';
import { PedidoInfoCardComponent } from '../../../shared/components/pedido-info-card/pedido-info-card.component';
import { MaquinaInfoCardComponent } from '../../../shared/components/maquina-info-card/maquina-info-card.component';
import { TerceroInfoCardComponent } from '../../../shared/components/tercero-info-card/tercero-info-card.component';
import { AutoFocusDirective } from '../../../shared/directives/auto-focus.directive';

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
 * Componente de edición de pedido
 * Formulario para editar un pedido existente con gestión de referencias
 */
@Component({
    selector: 'app-pedido-edit',
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
        SkeletonModule,
        ToggleButtonModule,
        InputNumberModule,
        MultiSelectModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        DialogModule,
        TableModule,
        CheckboxModule,
        ImageModule,
        GalleriaModule,
        AutoCompleteModule,
        TimelineModule,
        ContactoCreateModalComponent,
        MaquinaCreateModalComponent,
        TerceroCreateModalComponent,
        MaquinaDetailComponent,
        PedidoInfoCardComponent,
        MaquinaInfoCardComponent,
        TerceroInfoCardComponent,
        AutoFocusDirective
    ],
    providers: [MessageService],
    templateUrl: './edit.html',
    styleUrl: './edit.scss'
})
export class EditComponent implements OnInit {
    private static readonly DEFAULT_ARTICLE_TYPE_LISTA_ID = 3425;

    private readonly fb = inject(FormBuilder);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly filterService = inject(FilterService);
    private readonly contactoService = inject(ContactoService);
    private readonly terceroService = inject(TerceroService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly proveedorService = inject(PedidoReferenciaProveedorService);
    private readonly articuloService = inject(ArticuloService);
    private readonly pedidoArticuloService = inject(PedidoArticuloService);
    private readonly pedidoApi = inject(PedidoService);
    private readonly authService = inject(AuthService);

    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;

    // Verifica si el usuario actual tiene rol de Vendedor
    private get isVendedor(): boolean {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Vendedor') ?? false;
    }

    // Verifica si el usuario actual es Admin o Super_admin
    private get isAdmin(): boolean {
        const user = this.authService.currentUser();
        const roles = user?.roles ?? [];
        return roles.includes('Administrador') || roles.includes('super_admin');
    }

    // Verifica si el usuario actual es Analista
    private get isAnalista(): boolean {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Analista') ?? false;
    }

    pedidoForm!: FormGroup;
    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;
    pedidoResponse = signal<Pedido | null>(null);

    pedidoId = signal<number>(0);
    terceros: any[] = [];
    tercerosOriginal: any[] = [];

    /** Controles tipados para los selects compartidos (pedidoForm es FormGroup sin tipos). */
    get maquinaIdControl(): FormControl<number | null> {
        return this.pedidoForm.get('maquina_id') as FormControl<number | null>;
    }

    get terceroIdControl(): FormControl<number | null> {
        return this.pedidoForm.get('tercero_id') as FormControl<number | null>;
    }

    get contactoIdControl(): FormControl<number | null> {
        return this.pedidoForm.get('contacto_id') as FormControl<number | null>;
    }
    sistemas: any[] = [];
    marcas: any[] = [];
    maquinas: any[] = [];
    maquinasList: any[] = []; // Lista completa de máquinas con todos sus datos
    currentMaquinaInfo = signal<any>(null);
    fabricantes: any[] = [];
    referencias: any[] = [];
    contactos: any[] = [];
    private contactosDetalle: Array<{ id: number; telefono?: string | null; email?: string | null }> = [];
    displayCreateContactoDialog = false;
    displayEditTerceroDialog = false;
    terceroToEdit: Tercero | null = null;

    displayEditMaquinaModal = false;
    maquinaModalEdicionId: number | null = null;

    // Opciones en cascada por fila (índice del FormArray)
    readonly rowTiposCatalog = signal<Record<number, RowTiposCatalogEntry>>({});
    referenciasPorFila: any[][] = [];
    tiposArticuloCatalog: TipoListaSelectOption[] = [];
    readonly tiposArticuloCatalogReady = signal(false);
    private readonly tiposPanelFilter: Record<number, string> = {};
    private readonly TIPOS_PANEL_MAX = 100;
    private tiposLotePanelFilter = '';

    proveedores: any[] = []; // Lista de proveedores (terceros tipo Proveedor)
    articulos: any[] = []; // Lista de artículos disponibles

    // Mapa de proveedores por referencia
    proveedoresPorReferencia: Map<number, PedidoReferenciaProveedor[]> = new Map();
    referenciasExpandidas: Set<number> = new Set();

    // Formulario para nuevo proveedor
    nuevoProveedorForm: FormGroup | null = null;
    referenciaIndexParaProveedor: number | null = null;

    // Modal de comparación de proveedores
    mostrarComparacion = false;
    proveedoresComparacion: PedidoReferenciaProveedor[] = [];
    referenciaComparacion: any = null;

    // Artículos del pedido
    articulosPedido: PedidoArticulo[] = [];

    mostrarArticulos = false;

    // Validación de ítems para enviar a costeo
    itemsConErrores = signal<Map<number, string[]>>(new Map());
    enviandoACosteo = false;

    // Carga masiva
    showBulkImport = false;
    private loadingBulkImport = false;
    displayHelpDialog = false;

    /**
     * Abre el diálogo de ayuda para la importación masiva
     */
    openHelpDialog(): void {
        this.displayHelpDialog = true;
    }

    // Modal de detalle de máquina (signals: en Zoneless los callbacks HTTP no agendan CD)
    displayMaquinaDialog = signal(false);
    selectedMaquina = signal<any>(null);

    // Lote de Referencias
    displayLoteDialog = false;
    loteForm!: FormGroup;
    readonly tiposLoteCatalog = signal<RowTiposCatalogEntry>({ ready: false, options: [] });
    tiposLoteOriginal: TipoListaSelectOption[] = [];
    referenciasLote: any[] = [];
    filterMode: any = 'flexible';

    // Respaldos para filtrado flexible
    sistemasOriginal: any[] = [];
    tiposPorFilaOriginal: TipoListaSelectOption[][] = [];

    // Dialogos de comentario e imagen
    displayComentarioDialog = false;
    displayImagenDialog = false;
    displayImagenesCarouselModal = false;

    // Dialogo de devolución al vendedor
    displayDevolucionDialog = false;
    comentarioDevolucion = new FormControl('');

    // Estado de revisión de la máquina
    maquinaRevisada: boolean | null = null;

    // Estado para la galería de imágenes
    displayGallery = false;
    galleriaImagesArray: any[] = [];
    selectedItemIndex: number = -1;
    activeIndexGallery: number = 0;

    activeItemIndex: number | null = null;
    activeImagenesFilaIndex: number | null = null;
    comentarioControl = new FormControl('');
    origenComentarioControl = new FormControl('Asesor');
    comentariosItemActual: { origen: string; comentario: string; fecha?: string }[] = [];
    comentariosDelPedido: { origen: string; comentario: string; fecha?: string }[] = [];
    displayComentariosPedidoDialog = false;
    imagenControl = new FormControl('');

    estadosOptions = [
        // TODO: Rehabilitar cuando se active el estado Borrador
        // { label: PEDIDO_ESTADO_ETIQUETA.Borrador, value: 'Borrador' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Nuevo, value: 'Nuevo' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.En_Analisis, value: 'En_Analisis' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Enviado, value: 'Enviado' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.En_Costeo, value: 'En_Costeo' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Cotizado, value: 'Cotizado' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Aprobado, value: 'Aprobado' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Entregado, value: 'Entregado' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Rechazado, value: 'Rechazado' as PedidoEstado },
        { label: PEDIDO_ESTADO_ETIQUETA.Cancelado, value: 'Cancelado' as PedidoEstado }
    ];

    // Estado actual del pedido (para validar transiciones)
    estadoActual: PedidoEstado = 'Nuevo';

    // Mapa de transiciones válidas
    // TODO: Rehabilitar transiciones de Borrador cuando se active el estado
    transicionesValidas: Record<PedidoEstado, PedidoEstado[]> = {
        Borrador: [], // TODO: Restaurar ['Nuevo', 'En_Analisis', 'Cancelado'] cuando se active
        Nuevo: ['En_Analisis', 'Enviado', 'En_Costeo', 'Cancelado'],
        En_Analisis: ['Enviado', 'En_Costeo', 'Cancelado'],
        Enviado: ['En_Costeo', 'Cancelado'],
        En_Costeo: ['Cotizado', 'Rechazado', 'Cancelado'],
        Cotizado: ['Aprobado', 'Rechazado', 'Cancelado'],
        Aprobado: ['Entregado', 'Cancelado'],
        Entregado: [],
        Rechazado: [],
        Cancelado: []
    };

    submitting = false;

    /**
     * Botón enviar a análisis - visible para Admin o Vendedor
     */
    get puedeEnviarAAnalisis(): boolean {
        const transiciones = this.transicionesValidas[this.estadoActual] || [];
        // TODO: Rehabilitar condición de Borrador cuando se active el estado
        return transiciones.includes('En_Analisis') && (this.isVendedor || this.isAdmin);
    }

    /**
     * Tooltip del bouton envoyer a analisis
     */
    get mensajeTooltipAnalisis(): string {
        if (this.maquinaRevisada === false) {
            return 'La máquina debe estar en estado "Revisado" para enviar a análisis';
        }
        return 'Enviar a analistas para que comience el análisis';
    }

    /**
     * Indica si el analyst peut devolver el pedido
     */
    get puedeDevolver(): boolean {
        return this.isAnalista || this.isAdmin;
    }

    /**
     * Envía le pedido a análisis, notificando aux analistas
     */
    enviarAAnalisis(): void {
        if (this.maquinaRevisada === false) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Máquina sin revisar',
                detail: 'La máquina debe estar en estado "Revisado" para enviar a análisis'
            });
            return;
        }

        if (this.pedidoForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario incompleto',
                detail: 'Por favor complete todos los campos requeridos antes de enviar a análisis'
            });
            Object.keys(this.pedidoForm.controls).forEach((key) => {
                this.pedidoForm.get(key)?.markAsTouched();
            });
            return;
        }

        const tieneReferencias = this.referenciasFormArray.length > 0;
        if (!tieneReferencias) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Referencias requeridas',
                detail: 'Debe agregar al menos una referencia para enviar a análisis'
            });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de enviar este pedido a análisis? Se guardarán los cambios actuales y los analistas serán notificados.',
            header: 'Enviar a Análisis',
            icon: 'pi pi-search',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            rejectButtonProps: { severity: 'secondary' },
            accept: () => {
                this.pedidoForm.patchValue({ estado: 'En_Analisis' });
                this.onSubmit();
            }
        });
    }

    /**
     * TODO: Rehabilitar cuando se active el estado Borrador
     * Convierte un borrador en pedido operativo (Nuevo o pregunta si enviar a análisis, como en crear pedido).
     */
    /*
    generarPedidoDesdeBorrador(): void {
        if (this.estadoActual !== 'Borrador' || this.submitting) {
            return;
        }

        if (this.pedidoForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            Object.keys(this.pedidoForm.controls).forEach((key) => {
                this.pedidoForm.get(key)?.markAsTouched();
            });
            return;
        }

        const tieneReferencias = this.referenciasFormArray.length > 0;
        const maquinaId = this.pedidoForm.get('maquina_id')?.value;
        let puedeEnviarAAnalisis = false;

        if (maquinaId) {
            const maquinaBuscada = this.maquinasList.find((m: any) => m.id === maquinaId);
            puedeEnviarAAnalisis = !!(maquinaBuscada && maquinaBuscada.estado_revision === 'revisado');
        }

        if (puedeEnviarAAnalisis) {
            this.confirmationService.confirm({
                message: '¿Desea enviar este pedido a análisis ahora? Los analistas serán notificados.',
                header: 'Enviar a Análisis',
                icon: 'pi pi-search',
                acceptLabel: 'Sí',
                rejectLabel: 'No',
                rejectButtonProps: { severity: 'secondary' },
                accept: () => {
                    if (!tieneReferencias) {
                        this.messageService.add({
                            severity: 'warn',
                            summary: 'Referencias requeridas',
                            detail: 'Debe agregar al menos una referencia para enviar a análisis'
                        });
                        return;
                    }
                    this.pedidoForm.patchValue({ estado: 'En_Analisis' });
                    this.onSubmit();
                },
                reject: () => {
                    this.pedidoForm.patchValue({ estado: 'Nuevo' });
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Pedido guardado',
                        detail: `El pedido queda pendiente. Cuando esté listo, envíelo a ${PEDIDO_ESTADO_ETIQUETA.En_Analisis} desde el detalle.`
                    });
                    this.onSubmit();
                }
            });
        } else {
            this.pedidoForm.patchValue({ estado: 'Nuevo' });
            this.onSubmit();
        }
    }
    */

    /**
     * Renvoie le pedido al vendedor para correction
     */
    devolverAVendedor(): void {
        this.displayDevolucionDialog = true;
    }

    /**
     * Confirma la devolución al vendedor
     */
    confirmarDevolucion(): void {
        const comentario = this.comentarioDevolucion?.value?.trim();
        if (!comentario) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Comentario requerido',
                detail: 'Indique qué debe corregir el vendedor'
            });
            return;
        }

        this.pedidoForm.patchValue({
            estado: 'Nuevo',
            comentario: (this.pedidoForm.get('comentario')?.value || '') + '\n\n[DEVOLUCIÓN]: ' + comentario
        });

        this.displayDevolucionDialog = false;
        this.comentarioDevolucion?.setValue('');
        this.onSubmit();

        this.messageService.add({
            severity: 'info',
            summary: 'Pedido devuelto',
            detail: 'El vendedor recibirá una notificación'
        });
    }

    /**
     * Force reload del estado de revisión de la máquina
     */
    forceReloadMaquinaRevision(): void {
        const maquinaId = this.pedidoForm.get('maquina_id')?.value;
        if (maquinaId) {
            this.maquinaService.getById(maquinaId).subscribe({
                next: (response: any) => {
                    const maquinaData = response.data || response;
                    this.maquinaRevisada = maquinaData?.estado_revision === 'revisado';
                }
            });
        }
    }

    private removeAccents(str: string): string {
        return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
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

    private mapListasToOptions(listas: { id: number; nombre: string; definicion?: string | null }[]): TipoListaSelectOption[] {
        return listas.map((lista) => ({
            label: lista.nombre,
            value: lista.id,
            descripcion: lista.definicion ?? undefined,
            _search: `${lista.nombre} ${lista.definicion || ''}`
        }));
    }

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

        const byId = tipos.find((t) => t.value === EditComponent.DEFAULT_ARTICLE_TYPE_LISTA_ID);
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

    private getDefaultSistemaId(): number | null {
        const defaultSistema = this.sistemas.find((s) => this.normalizeLabel(s.label) === 'por defecto');
        return defaultSistema?.value ?? null;
    }

    private tiposSourceForRow(index: number): TipoListaSelectOption[] {
        const row = this.referenciasFormArray.at(index);
        const sistemaId = row?.get('sistema_id')?.value as number | null;
        if (this.isSistemaPorDefecto(sistemaId)) {
            return this.tiposArticuloCatalog;
        }
        return this.rowTiposCatalog()[index]?.options ?? [];
    }

    /**
     * Muestra el diálogo para crear un nuevo contacto
     */
    openCreateContactoDialog(): void {
        const terceroId = this.pedidoForm.get('tercero_id')?.value;
        if (!terceroId) {
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
        const clienteId = this.pedidoForm.get('tercero_id')?.value;
        if (clienteId) {
            this.loadContactos(clienteId);
            // Seleccionar el nuevo contacto
            setTimeout(() => {
                this.pedidoForm.patchValue({ contacto_id: contacto.id });
            }, 500);
        }
        this.displayCreateContactoDialog = false;
    }

    private loadContactos(terceroId: number): void {
        this.contactoService.getAll({ tercero_id: terceroId }).subscribe({
            next: (response) => {
                this.contactosDetalle = response.data.map((c: { id: number; telefono?: string | null; email?: string | null }) => ({
                    id: c.id,
                    telefono: c.telefono,
                    email: c.email
                }));
                this.contactos = response.data.map((c: any) => ({
                    label: `${c.nombre}${c.cargo ? ' - ' + c.cargo : ''}`,
                    value: c.id
                }));
            }
        });
    }
    onFilterTerceros(event: any) {
        const query = (event.filter || '').trim();
        if (!query) {
            this.terceros = [...this.tercerosOriginal];
            return;
        }
        this.terceros = this.tercerosOriginal.filter((t) => this.flexibleMatch(t.label, query));
    }

    ngOnInit(): void {
        this.registerFlexibleFilter();
        this.initForm();
        this.loadInitialData();
        this.loadPedido();
    }

    private registerFlexibleFilter(): void {
        this.filterService.register('flexible', (value: any, filter: any): boolean => {
            if (filter === undefined || filter === null || filter.trim() === '') {
                return true;
            }
            if (value === undefined || value === null) {
                return false;
            }
            return this.flexibleMatch(String(value), String(filter));
        });
    }

    /**
     * Inicializa el formulario
     */
    private initForm(): void {
        this.pedidoForm = this.fb.group({
            tercero_id: [null, [Validators.required]],
            direccion: ['', [Validators.maxLength(500)]],
            comentario: ['', [Validators.maxLength(1000)]],
            estado: ['Nuevo' as PedidoEstado, [Validators.required]],
            maquina_id: [null],
            fabricante_id: [null],
            contacto_id: [null],
            referencias: this.fb.array([]),
            motivo_rechazo: [''],
            referencias_copiadas: ['']
        });

        // Cuando cambia el tercero, filtrar las máquinas asociadas a ese cliente
        this.pedidoForm.get('tercero_id')?.valueChanges.subscribe((terceroId: number | null) => {
            if (terceroId) {
                this.loadMaquinasPorCliente(terceroId);
                this.loadContactos(terceroId);
            } else {
                this.maquinas = [];
                this.maquinasList = [];
                this.contactos = [];
                this.contactosDetalle = [];
                this.pedidoForm.patchValue({ maquina_id: null, contacto_id: null }, { emitEvent: false });
                this.currentMaquinaInfo.set(null);
            }
        });

        // Mantiene la señal de la máquina seleccionada sincronizada con el control
        // (el select vive en el componente compartido; en Zoneless el padre no se
        // re-renderiza por sí solo, así que la señal es la fuente de verdad reactiva).
        this.pedidoForm.get('maquina_id')?.valueChanges.subscribe(() => this.syncCurrentMaquina());

        this.loteForm = this.fb.group({
            sistema_id: [null, [Validators.required]],
            articulo_id: [{ value: null, disabled: true }, [Validators.required]],
            referencias_seleccionadas: [{ value: [], disabled: true }, [Validators.required, Validators.minLength(1)]],
            cantidad_lote: [1, [Validators.required, Validators.min(1)]]
        });
    }

    /**
     * Carga datos iniciales para los selects
     */
    private loadInitialData(): void {
        this.refreshTercerosOptions();
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

        // Cargar referencias
        this.loadReferencias();

        // Cargar proveedores (terceros tipo Proveedor)
        this.loadProveedores();

        // Cargar artículos disponibles
        this.loadArticulos();

        this.preloadTiposPorDefecto();
    }

    /**
     * Carga las referencias disponibles
     */
    private loadReferencias(): void {
        this.referenciaService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.referencias = response.data.map((r) => ({
                    label: r.referencia,
                    value: r.id
                }));
            }
        });
    }

    /**
     * Carga los artículos disponibles
     */
    private loadArticulos(): void {
        this.articuloService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.articulos = response.data.map((a) => ({
                    label: a.descripcionEspecifica || a.definicion || `Artículo ${a.id}`,
                    value: a.id
                }));
            }
        });
    }

    /**
     * Carga los proveedores disponibles (terceros tipo Proveedor)
     */
    private loadProveedores(): void {
        this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe({
            next: (response) => {
                this.proveedores = response.data.map((p) => ({
                    label: p.nombre || `Proveedor ${p.id}`,
                    value: p.id,
                    ubicacion: (p as any).pais === 'Colombia' || (p as any).country_id === 48 ? 'Nacional' : 'Internacional',
                    dias_entrega: (p as any).dias_entrega || 0,
                    costo_unidad: (p as any).costo_unidad || 0,
                    utilidad: (p as any).utilidad || 0
                }));
            }
        });
    }

    /**
     * Carga las máquinas asociadas a un cliente específico
     */
    private loadMaquinasPorCliente(terceroId: number): void {
        this.maquinaService.getAll({ tercero_id: terceroId }).subscribe({
            next: (response) => {
                this.maquinasList = response.data;
                this.maquinas = response.data.map((m: any) => ({
                    label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''}`,
                    value: m.id
                }));
                this.syncCurrentMaquina();
            }
        });
    }

    /** Recarga opciones de máquina tras crear/editar en el modal. */
    private reloadMaquinasParaPedido(): void {
        const terceroId = this.pedidoForm.get('tercero_id')?.value;
        if (terceroId) {
            this.loadMaquinasPorCliente(terceroId);
        } else {
            this.maquinas = [];
            this.maquinasList = [];
        }
    }

    onEditMaquinaModalVisibleChange(visible: boolean): void {
        this.displayEditMaquinaModal = visible;
        if (!visible) {
            this.maquinaModalEdicionId = null;
        }
    }

    abrirModalEditarMaquina(maquina: { id: number }): void {
        if (!maquina?.id) {
            return;
        }
        this.maquinaModalEdicionId = maquina.id;
        this.displayEditMaquinaModal = true;
    }

    onMaquinaActualizadaDesdeModal(_m: any): void {
        this.reloadMaquinasParaPedido();

        // Actualizar estado revisión
        this.forceReloadMaquinaRevision();
    }

    /**
     * Carga los datos del pedido
     */
    private loadPedido(): void {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');

            if (id) {
                const pedidoId = parseInt(id, 10);
                this.pedidoId.set(pedidoId);

                this.store.dispatch(loadPedido({ id: pedidoId }));

                this.pedido$ = this.store.select(selectPedidoById(pedidoId));
                this.loading$ = this.store.select(selectPedidosLoading);

                this.pedido$
                    .pipe(
                        filter((pedido) => !!pedido && pedido.referencias !== undefined),
                        take(1)
                    )
                    .subscribe((pedido) => {
                        if (pedido) {
                            this.pedidoResponse.set(pedido);
                            this.estadoActual = this.normalizePedidoEstado(pedido.estado);

                            this.pedidoForm.patchValue({
                                tercero_id: pedido.tercero_id,
                                direccion: pedido.direccion || '',
                                comentario: pedido.comentario || '',
                                estado: pedido.estado,
                                maquina_id: pedido.maquina_id || null,
                                fabricante_id: pedido.fabricante_id || null,
                                contacto_id: pedido.contacto_id || null
                            });

                            // Cargar comentarios del pedido para visualización
                            this.comentariosDelPedido = this.parseComentariosRaw(pedido.comentario);

                            // Cargar estado de revisión de la máquina
                            if (pedido.maquina_id) {
                                this.maquinaService.getById(pedido.maquina_id).subscribe({
                                    next: (response: any) => {
                                        const maquinaData = response.data || response;
                                        this.maquinaRevisada = maquinaData?.estado_revision === 'revisado';
                                    },
                                    error: () => {
                                        this.maquinaRevisada = null;
                                    }
                                });
                            } else {
                                this.maquinaRevisada = null;
                            }

                            // Cargar referencias del pedido
                            if (pedido.referencias && pedido.referencias.length > 0) {
                                this.cargarReferenciasAlFormArray(pedido.referencias);

                                // Cargar proveedores de cada referencia
                                pedido.referencias.forEach((ref) => {
                                    if (ref.proveedores && ref.proveedores.length > 0) {
                                        this.proveedoresPorReferencia.set(ref.id, ref.proveedores);
                                    }
                                });
                            }

                            // Cargar artículos del pedido
                            if (pedido.articulos && pedido.articulos.length > 0) {
                                this.articulosPedido = pedido.articulos;
                            }
                        }
                    });
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'ID de pedido inválido'
                });
                this.router.navigate(['/app/pedidos']);
            }
        });
    }

    /**
     * Carga las referencias del pedido al FormArray
     */
    private cargarReferenciasAlFormArray(referencias: PedidoReferencia[]): void {
        referencias.forEach((ref, idx) => {
            const index = this.referenciasFormArray.length;

            this.referenciasPorFila[index] = [];

            const articuloId = (ref.referencia as any)?.articulo_id || null;
            const codigoReferencia = (ref.referencia as any)?.referencia || null;

            const referenciaForm = this.fb.group({
                id: [ref.id],
                estado: [ref.estado ?? true],
                seleccionado: [false],
                sistema_id: [ref.sistema_id || null],
                lista_id: [ref.lista_id || null],
                articulo_id: [articuloId],
                referencia_id: [ref.referencia_id || null],
                marca_id: [ref.marca_id || null],
                cantidad: [ref.cantidad, [Validators.required, Validators.min(1)]],
                comentario: [ref.comentario || ''],
                definicion: [codigoReferencia || ref.definicion || ''],
                imagen: [ref.imagen || null],
                imagenes: [ref.imagenes || []]
            });

            this.referenciasFormArray.push(referenciaForm);

            if (ref.sistema_id) {
                this.cargarTiposPorSistema(ref.sistema_id, index, ref.referencia_id ?? null, ref.lista_id ?? undefined);
            }

            if (articuloId) {
                this.cargarReferenciasPorArticulo(articuloId, index);
            }
        });
    }

    /**
     * Getter para el FormArray de referencias
     */
    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    agregarReferencia(data: any = {}): void {
        const index = this.referenciasFormArray.length;

        if (data.tipos?.length) {
            this.setRowTiposCatalog(index, { ready: true, options: data.tipos });
        }

        this.referenciasPorFila[index] = data.referencias || [];

        const defaultSistemaId = this.getDefaultSistemaId();
        const sistemaInicialId = (data.sistema_id ?? defaultSistemaId) as number | null;
        const esSistemaPorDefecto = this.isSistemaPorDefecto(sistemaInicialId);
        const defaultListaId = data.lista_id ?? (esSistemaPorDefecto && data.referencia_id == null ? this.resolveDefaultListaIdFromCache() : null);

        const referenciaForm = this.fb.group({
            id: [data?.id ?? null],
            estado: [data?.estado ?? true],
            seleccionado: [false],
            sistema_id: [sistemaInicialId],
            lista_id: [data.lista_id ?? defaultListaId],
            articulo_id: [data?.articulo_id ?? null],
            referencia_id: [data?.referencia_id ?? null],
            marca_id: [data?.marca_id ?? null],
            cantidad: [data?.cantidad ?? 1, [Validators.required, Validators.min(1)]],
            comentario: [data?.comentario ?? ''],
            definicion: [data?.definicion ?? ''],
            imagen: [data?.imagen ?? null],
            imagenes: [data?.imagenes ?? []],
            files: [[]]
        });

        this.referenciasFormArray.push(referenciaForm);

        if (sistemaInicialId) {
            this.cargarTiposPorSistema(sistemaInicialId, index, data.referencia_id ?? null, data.lista_id ?? defaultListaId ?? undefined);
        }

        if (data.articulo_id && (!data.referencias || data.referencias.length === 0)) {
            this.cargarReferenciasPorArticulo(data.articulo_id, index);
        }
    }

    /**
     * Procesa las referencias copiadas en carga masiva
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

        this.loadingBulkImport = true;
        const lineas = texto.split('\n');
        const referenciasParaProcesar: Array<{ cantidad: number; codigo: string }> = [];

        lineas.forEach((linea: string) => {
            const trimmed = linea.trim();
            if (!trimmed) return;

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
            this.loadingBulkImport = false;
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'No se encontraron referencias válidas en el formato correcto (Cantidad [Espacio] Referencia)'
            });
            return;
        }

        this.referenciaService.bulkSearchOrCreate(referenciasParaProcesar).subscribe({
            next: (response) => {
                this.loadingBulkImport = false;
                const resultados = response.data;

                if (resultados && resultados.length > 0) {
                    resultados.forEach((item: any) => {
                        const existeEnGlobal = this.referencias.find((r) => r.value === item.referencia_id);
                        if (!existeEnGlobal) {
                            this.referencias.push({
                                label: item.codigo,
                                value: item.referencia_id
                            });
                        }

                        this.agregarReferencia({
                            referencia_id: item.referencia_id,
                            cantidad: item.cantidad,
                            definicion: item.codigo
                        });
                    });

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: `${resultados.length} referencia(s) procesada(s) exitosamente`
                    });

                    this.pedidoForm.get('referencias_copiadas')?.setValue('');
                    this.showBulkImport = false;
                }
            },
            error: (err) => {
                this.loadingBulkImport = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron procesar las referencias: ' + (err.error?.message || err.message)
                });
            }
        });
    }

    /**
     * Maneja el cambio de sistema en una fila (cascada)
     */
    onSistemaChange(sistemaId: number | null, index: number): void {
        const row = this.referenciasFormArray.at(index);
        row.patchValue({ lista_id: null, articulo_id: null, referencia_id: null }, { emitEvent: false });
        this.referenciasPorFila[index] = [];

        if (!sistemaId) {
            this.clearRowTiposCatalog(index);
            return;
        }

        const systemLabel = this.sistemas.find((s) => s.value === sistemaId)?.label;
        const fetchTipos = () => {
            if (this.isSistemaPorDefecto(sistemaId) && this.tiposArticuloCatalogReady()) {
                this.applyRowTiposReadyPorDefecto(index, row, systemLabel);
                return;
            }

            this.fetchTiposArticuloOptions(sistemaId).subscribe({
                next: (options) => this.applyRowTiposLoaded(index, options, row, systemLabel)
            });
        };

        this.clearRowTiposCatalog(index, fetchTipos);
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
                    this.cargarReferenciasPorArticulo(articulo.id, index);
                }
            }
        });
    }

    /**
     * Carga los tipos de artículo (Listas) asociados a un sistema
     */
    private cargarTiposPorSistema(sistemaId: number, index: number, referenciaIdPreseleccionada?: number | null, listaIdPreseleccionado?: number | null): void {
        const row = this.referenciasFormArray.at(index);
        const systemLabel = this.sistemas.find((s) => s.value === sistemaId)?.label;
        const applyDefault = listaIdPreseleccionado == null;

        const finalizePreselect = () => {
            if (listaIdPreseleccionado == null) {
                if (referenciaIdPreseleccionada) {
                    this.autoseleccionarArticuloPorReferencia(index, referenciaIdPreseleccionada);
                }
                return;
            }

            row.patchValue({ lista_id: listaIdPreseleccionado }, { emitEvent: false });
            const opciones = this.tiposSourceForRow(index);
            const listaNombre = opciones.find((o) => o.value === listaIdPreseleccionado)?.label ?? this.tiposArticuloCatalog.find((o) => o.value === listaIdPreseleccionado)?.label ?? '';

            if (!listaNombre) {
                if (referenciaIdPreseleccionada) {
                    this.autoseleccionarArticuloPorReferencia(index, referenciaIdPreseleccionada);
                }
                return;
            }

            this.articuloService.getAll({ per_page: 500 }).subscribe({
                next: (resArt) => {
                    const articulo = resArt.data.find((a: any) => (a.definicion && a.definicion.toLowerCase() === listaNombre.toLowerCase()) || (a.descripcionEspecifica && a.descripcionEspecifica.toLowerCase() === listaNombre.toLowerCase()));
                    if (articulo) {
                        row.patchValue({ articulo_id: articulo.id }, { emitEvent: false });
                        this.cargarReferenciasPorArticulo(articulo.id, index);
                    } else if (referenciaIdPreseleccionada) {
                        this.autoseleccionarArticuloPorReferencia(index, referenciaIdPreseleccionada);
                    }
                }
            });
        };

        const loadTipos = (options: TipoListaSelectOption[]) => {
            if (this.isSistemaPorDefecto(sistemaId)) {
                this.tiposPanelFilter[index] = '';
                this.deferViewUpdate(() => {
                    this.rowTiposCatalog.update((state) => ({ ...state, [index]: { ready: true, options: [] } }));
                    this.deferViewUpdate(() => {
                        if (applyDefault) {
                            this.patchDefaultListaForRow(row, this.tiposArticuloCatalog, systemLabel);
                        }
                        finalizePreselect();
                    });
                });
                return;
            }

            this.deferViewUpdate(() => {
                this.rowTiposCatalog.update((state) => ({ ...state, [index]: { ready: true, options } }));
                this.tiposPorFilaOriginal[index] = [...options];
                this.deferViewUpdate(() => {
                    if (applyDefault) {
                        this.patchDefaultListaForRow(row, options, systemLabel);
                    }
                    finalizePreselect();
                });
            });
        };

        if (this.isSistemaPorDefecto(sistemaId) && this.tiposArticuloCatalogReady()) {
            loadTipos(this.tiposArticuloCatalog);
            return;
        }

        this.fetchTiposArticuloOptions(sistemaId).subscribe({
            next: (options) => loadTipos(options)
        });
    }

    /**
     * Autoselecciona el artículo y lista que contienen la referencia dada (para carga inicial / legacy)
     */
    private autoseleccionarArticuloPorReferencia(index: number, referenciaId: number): void {
        const row = this.referenciasFormArray.at(index);
        const sistemaId = row.get('sistema_id')?.value;
        this.referenciaService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                const ref = response.data.find((r) => r.id === referenciaId);
                if (ref && (ref as any).articulo_id) {
                    const articuloId = (ref as any).articulo_id;
                    row.patchValue({ articulo_id: articuloId }, { emitEvent: false });
                    this.cargarReferenciasPorArticulo(articuloId, index);
                    if (sistemaId) {
                        this.articuloService.getAll({ per_page: 500 }).subscribe({
                            next: (resArt) => {
                                const articulo = resArt.data.find((a: any) => a.id === articuloId);
                                if (articulo?.definicion) {
                                    this.listaService.getAll({ sistema_id: sistemaId, tipo: 'Tipo de Artículo', per_page: 200 }).subscribe({
                                        next: (listRes) => {
                                            const lista = listRes.data.find((l: any) => l.nombre && l.nombre.toLowerCase() === articulo.definicion.toLowerCase());
                                            if (lista) {
                                                row.patchValue({ lista_id: lista.id }, { emitEvent: false });
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
    }

    /**
     * Maneja el cambio de artículo (tipo) en una fila (cascada)
     */
    onArticuloChange(articuloId: number | null, index: number): void {
        const row = this.referenciasFormArray.at(index);
        row.patchValue({ referencia_id: null }, { emitEvent: false });
        this.referenciasPorFila[index] = [];

        if (!articuloId) return;

        this.cargarReferenciasPorArticulo(articuloId, index);
    }

    onReferenciaManualInput(index: number): void {
        const row = this.referenciasFormArray.at(index);
        if (!row) return;
        // Si cambia el código manual, invalidar referencia previamente enlazada.
        row.patchValue({ referencia_id: null }, { emitEvent: false });
    }

    buscarReferencias(event: any, index: number): void {
        const row = this.referenciasFormArray.at(index);
        if (!row) return;
        this.onReferenciaManualInput(index);
        const articuloId = row.get('articulo_id')?.value;
        const search = (event?.query || '').toString().trim();
        const params: any = { search, per_page: 30 };
        if (articuloId) {
            params.articulo_id = articuloId;
        }

        this.referenciaService.getAll(params).subscribe({
            next: (response) => {
                // Si por artículo no hay coincidencias, buscar global por código.
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

        // Guardamos label explícito para evitar texto parcial.
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

        // Fallback: si hubo selección visual pero no quedó referencia_id,
        // mapear contra sugerencias cargadas antes de crear temporal.
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

        if (!marcaId && this.selectedMaquina()?.fabricante_id) {
            marcaId = Number(this.selectedMaquina()?.fabricante_id);
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
                    const articuloId = created?.referencia?.articulo_id || row.get('articulo_id')?.value;
                    if (articuloId) {
                        this.cargarReferenciasPorArticulo(articuloId, index);
                    }
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

    /**
     * Carga las referencias asociadas a un artículo
     */
    private cargarReferenciasPorArticulo(articuloId: number, index: number): void {
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
     * Valida todos los ítems del pedido y envía a costeo si todo es correcto.
     * Campos obligatorios: sistema_id, articulo_id, referencia_id, cantidad
     */
    enviarACosteo(): void {
        if (!this.puedeEnviarACosteo) {
            return;
        }
        const errores = new Map<number, string[]>();
        let hayErrores = false;

        this.referenciasFormArray.controls.forEach((control, index) => {
            const camposFaltantes: string[] = [];

            if (!control.get('sistema_id')?.value) {
                camposFaltantes.push('Sistema');
            }
            if (!control.get('lista_id')?.value) {
                camposFaltantes.push('Tipo de artículo');
            }
            if (!control.get('referencia_id')?.value) {
                camposFaltantes.push('Referencia');
            }
            if (!control.get('cantidad')?.value || control.get('cantidad')?.value < 1) {
                camposFaltantes.push('Cantidad');
            }

            if (camposFaltantes.length > 0) {
                errores.set(index, camposFaltantes);
                hayErrores = true;
            }
        });

        this.itemsConErrores.set(errores);

        if (this.referenciasFormArray.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin ítems',
                detail: 'Debe agregar al menos un ítem antes de enviar a costeo'
            });
            return;
        }

        if (hayErrores) {
            this.messageService.add({
                severity: 'error',
                summary: 'Campos obligatorios faltantes',
                detail: 'Algunos ítems no tienen todos los campos obligatorios. Revise los campos resaltados en rojo.'
            });
            return;
        }

        // Confirmar el envío a costeo
        this.confirmationService.confirm({
            message: `¿Está seguro de enviar este pedido a costeo? El estado cambiará a "${PEDIDO_ESTADO_ETIQUETA.En_Costeo}".`,
            header: 'Confirmar envío a costeo',
            icon: 'pi pi-send',
            accept: () => {
                this.enviandoACosteo = true;

                // Primero guardar el pedido actual, luego cambiar estado
                const formValue = this.pedidoForm.value;
                const pedidoData: UpdatePedidoDto = {
                    tercero_id: formValue.tercero_id,
                    direccion: formValue.direccion || undefined,
                    comentario: formValue.comentario || undefined,
                    maquina_id: formValue.maquina_id || undefined,
                    fabricante_id: formValue.fabricante_id || undefined,
                    contacto_id: formValue.contacto_id || undefined,
                    estado: 'En_Costeo'
                };

                this.store.dispatch(
                    updatePedido({
                        id: this.pedidoId(),
                        changes: pedidoData
                    })
                );

                combineLatest([this.store.select(selectPedidosLoading), this.store.select(selectPedidosError)])
                    .pipe(
                        filter(([loading]) => !loading && this.enviandoACosteo),
                        take(1)
                    )
                    .subscribe(([_, error]) => {
                        if (!this.enviandoACosteo) {
                            return;
                        }
                        this.enviandoACosteo = false;
                        if (!error) {
                            this.estadoActual = 'En_Costeo';
                            this.pedidoForm.patchValue({ estado: 'En_Costeo' });
                            this.messageService.add({
                                severity: 'success',
                                summary: `Enviado a ${PEDIDO_ESTADO_ETIQUETA.En_Costeo}`,
                                detail: 'El pedido ha sido enviado a costeo exitosamente'
                            });
                            setTimeout(() => {
                                this.router.navigate(['/app/pedidos', this.pedidoId()]);
                            }, 1500);
                        } else {
                            this.pedidoForm.patchValue({ estado: this.estadoActual });
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: error || 'No se pudo enviar el pedido a costeo'
                            });
                        }
                    });
            }
        });
    }

    /**
     * Verifica si un ítem tiene errores de validación de costeo
     */
    itemTieneError(index: number): boolean {
        return this.itemsConErrores().has(index);
    }

    /**
     * Obtiene los campos con error de un ítem
     */
    getErroresItem(index: number): string[] {
        return this.itemsConErrores().get(index) || [];
    }

    /**
     * Verifica si un campo específico de un ítem tiene error de costeo
     */
    campoTieneErrorCosteo(index: number, campo: string): boolean {
        const errores = this.itemsConErrores().get(index);
        if (!errores) return false;

        const mapaCampos: Record<string, string> = {
            sistema_id: 'Sistema',
            lista_id: 'Tipo de artículo',
            referencia_id: 'Referencia',
            cantidad: 'Cantidad'
        };

        return errores.includes(mapaCampos[campo] || '');
    }

    /**
     * Verifica si el botón de enviar a costeo debe estar habilitado
     */
    get puedeEnviarACosteo(): boolean {
        if (!this.authService.hasAnyRole(['Analista', 'analista', 'Administrador', 'super_admin'])) {
            return false;
        }
        const transiciones = this.transicionesValidas[this.estadoActual] || [];
        return transiciones.includes('En_Costeo') && this.referenciasFormArray.length > 0;
    }

    /**
     * Elimina una referencia del FormArray
     */
    eliminarReferencia(index: number): void {
        const referencia = this.referenciasFormArray.at(index);
        const referenciaId = referencia.get('id')?.value;

        if (referenciaId) {
            this.confirmationService.confirm({
                message: '¿Está seguro de eliminar esta referencia del pedido?',
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.quitarFilaReferencia(index);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Referencia eliminada'
                    });
                }
            });
        } else {
            this.quitarFilaReferencia(index);
        }
    }

    private quitarFilaReferencia(index: number): void {
        this.referenciasFormArray.removeAt(index);
        if (index < this.referenciasPorFila.length) {
            this.referenciasPorFila.splice(index, 1);
        }
        if (index < this.tiposPorFilaOriginal.length) {
            this.tiposPorFilaOriginal.splice(index, 1);
        }
        delete this.tiposPanelFilter[index];
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
     * Maneja la selección de nuevos archivos para un ítem
     */
    onFilesSelected(event: any, index: number): void {
        const files = Array.from(event.target.files as FileList);
        if (files.length > 0) {
            const control = this.referenciasFormArray.at(index).get('files');
            const currentFiles = control?.value || [];
            const existingImages = this.referenciasFormArray.at(index).get('imagenes')?.value || [];

            // Límite total de 10 imágenes (existentes + nuevas)
            const remaining = 10 - (currentFiles.length + existingImages.length);
            if (remaining <= 0) {
                this.messageService.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Máximo 10 imágenes por ítem' });
                return;
            }

            const toAdd = files.slice(0, remaining);
            control?.setValue([...currentFiles, ...toAdd]);

            if (files.length > remaining) {
                this.messageService.add({ severity: 'info', summary: 'Límite parcial', detail: 'Solo se agregaron las imágenes permitidas hasta completar 10' });
            }

            if (this.displayGallery && this.selectedItemIndex === index) {
                this.updateGalleriaImages(index);
            }
        }
        event.target.value = '';
    }

    /**
     * Elimina un archivo nuevo (aún no guardado)
     */
    removeFile(itemIndex: number, fileIndex: number): void {
        const control = this.referenciasFormArray.at(itemIndex).get('files');
        const currentFiles = [...(control?.value || [])];

        if (currentFiles[fileIndex]) {
            currentFiles.splice(fileIndex, 1);
            control?.setValue(currentFiles);

            if (this.displayGallery && this.selectedItemIndex === itemIndex) {
                this.updateGalleriaImages(itemIndex);
            }
        }
    }

    isDragging = false;

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent, index: number): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const mockEvent = {
                target: {
                    files: files
                }
            };
            this.onFilesSelected(mockEvent, index);
        }
    }

    /**
     * Abre la galería unificada
     */
    openGallery(index: number): void {
        this.selectedItemIndex = index;
        this.activeIndexGallery = 0;
        this.updateGalleriaImages(index);
        this.displayGallery = true;
    }

    /**
     * Prepara las imágenes para Galleria (mezcla existentes de DB con nuevas de File)
     */
    private updateGalleriaImages(index: number): void {
        const control = this.referenciasFormArray.at(index);
        const newFiles = control.get('files')?.value || [];
        const existingImages = control.get('imagenes')?.value || [];

        // Limpiar blobs previos
        this.galleriaImagesArray.forEach((img) => {
            if (img.itemImageSrc.startsWith('blob:')) {
                URL.revokeObjectURL(img.itemImageSrc);
            }
        });

        // 1. Mapear imágenes existentes (desde DB)
        const mappedExisting = existingImages.map((img: any) => {
            let src = img.imagen;
            if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                src = `/storage/${src.replace(/^\/+/, '')}`;
            }
            return {
                itemImageSrc: src,
                thumbnailImageSrc: src,
                alt: 'Imagen guardada',
                title: 'Existente',
                isExisting: true,
                id: img.id
            };
        });

        // 2. Mapear archivos nuevos (en memoria)
        const mappedNew = newFiles.map((file: File) => {
            const url = URL.createObjectURL(file);
            return {
                itemImageSrc: url,
                thumbnailImageSrc: url,
                alt: file.name,
                title: 'Nueva para cargar',
                isExisting: false,
                file: file
            };
        });

        this.galleriaImagesArray = [...mappedExisting, ...mappedNew];
    }

    /**
     * Devuelve todas las imágenes del ítem sin duplicar (legacy + imagenes[], evitando misma URL dos veces)
     */
    getImagenesParaFila(index: number): { url: string; origen?: string }[] {
        const row = this.referenciasFormArray.at(index);
        const imagen = row.get('imagen')?.value;
        const imagenes: { id?: number; imagen: string; origen?: string }[] = row.get('imagenes')?.value || [];
        const out: { url: string; origen?: string }[] = [];
        const urlsVistos = new Set<string>();

        // Primero las de la tabla imagenes (origen cliente/asesor/costeo)
        imagenes.forEach((img: any) => {
            if (img && img.imagen) {
                const url = typeof img.imagen === 'string' ? img.imagen : (img.imagen?.url ?? img.imagen);
                if (url && !urlsVistos.has(url)) {
                    urlsVistos.add(url);
                    out.push({ url, origen: img.origen || 'cliente' });
                }
            }
        });
        // Legacy solo si no está ya en imagenes (evita duplicado cuando landing guarda en ambos)
        if (imagen) {
            const urlLegacy = typeof imagen === 'string' ? imagen : (imagen?.url ?? imagen);
            if (urlLegacy && !urlsVistos.has(urlLegacy)) {
                out.unshift({ url: urlLegacy, origen: 'Legacy' });
            }
        }
        return out;
    }

    abrirModalImagenes(index: number): void {
        this.activeImagenesFilaIndex = index;
        this.displayImagenesCarouselModal = true;
    }

    cerrarModalImagenes(): void {
        this.displayImagenesCarouselModal = false;
        this.activeImagenesFilaIndex = null;
    }

    get imagenesCarouselActual(): { url: string; origen?: string }[] {
        if (this.activeImagenesFilaIndex === null) return [];
        return this.getImagenesParaFila(this.activeImagenesFilaIndex);
    }

    /** Formato para p-galleria (Sakai uikit/media): itemImageSrc y thumbnailImageSrc */
    get galleriaImages(): { itemImageSrc: string; thumbnailImageSrc: string; origen?: string }[] {
        return this.imagenesCarouselActual.map((img) => ({
            itemImageSrc: img.url,
            thumbnailImageSrc: img.url,
            origen: img.origen
        }));
    }

    /** Opciones responsivas para Galleria (igual que Sakai uikit/media) */
    galleriaResponsiveOptions = [
        { breakpoint: '1024px', numVisible: 5 },
        { breakpoint: '960px', numVisible: 4 },
        { breakpoint: '768px', numVisible: 3 },
        { breakpoint: '560px', numVisible: 1 }
    ];

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
            const refModel = this.referenciasLote.find((r) => r.value === refId);

            this.agregarReferencia({
                sistema_id: data.sistema_id,
                lista_id: data.articulo_id,
                articulo_id: null,
                referencia_id: refId,
                cantidad: data.cantidad_lote,
                definicion: refModel?.definicion || '',
                tipos: [...(this.tiposLoteCatalog().options.length > 0 ? this.tiposLoteCatalog().options : this.tiposArticuloCatalog)],
                referencias: [...this.referenciasLote]
            });
        });

        this.messageService.add({ severity: 'success', summary: 'Agregado en Lote', detail: `Se insertaron ${refs.length} referencias exitosamente.` });
        this.cerrarDialogoLote();
    }

    /**
     * Valida si una transición de estado es válida
     */
    validarTransicionEstado(estadoAnterior: PedidoEstado, estadoNuevo: PedidoEstado): boolean {
        if (estadoAnterior === estadoNuevo) {
            return true; // No hay cambio
        }

        const transicionesPermitidas = this.transicionesValidas[estadoAnterior] || [];
        return transicionesPermitidas.includes(estadoNuevo);
    }

    /**
     * Obtiene los estados disponibles según el estado actual
     */
    getEstadosDisponibles(): Array<{ label: string; value: PedidoEstado }> {
        const transicionesPermitidas = this.transicionesValidas[this.estadoActual] || [];

        // Incluir el estado actual y las transiciones permitidas
        const estadosDisponibles = [
            { label: this.estadosOptions.find((e) => e.value === this.estadoActual)?.label || this.estadoActual, value: this.estadoActual },
            ...(transicionesPermitidas.map((e) => this.estadosOptions.find((o) => o.value === e)).filter(Boolean) as Array<{ label: string; value: PedidoEstado }>)
        ];

        return estadosDisponibles;
    }

    /**
     * Maneja el cambio de estado con validación
     */
    onEstadoChange(): void {
        const nuevoEstado = this.normalizePedidoEstado(this.pedidoForm.get('estado')?.value);

        if (!this.validarTransicionEstado(this.estadoActual, nuevoEstado)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Transición inválida',
                detail: `No se puede cambiar de "${this.pedidoEstadoEtiqueta(this.estadoActual)}" a "${this.pedidoEstadoEtiqueta(nuevoEstado)}". Transiciones válidas: ${(this.transicionesValidas[this.estadoActual] ?? []).map((e) => this.pedidoEstadoEtiqueta(e)).join(', ') || 'ninguna'}`
            });

            // Revertir al estado anterior
            this.pedidoForm.patchValue({ estado: this.estadoActual });
            return;
        }

        // Si se rechaza, requerir motivo
        if (nuevoEstado === 'Rechazado') {
            const motivoControl = this.pedidoForm.get('motivo_rechazo');
            if (motivoControl) {
                motivoControl.setValidators([Validators.required, Validators.minLength(10)]);
                motivoControl.updateValueAndValidity();
            }
        } else {
            // Si no es rechazado, limpiar validación de motivo
            const motivoControl = this.pedidoForm.get('motivo_rechazo');
            if (motivoControl) {
                motivoControl.clearValidators();
                motivoControl.updateValueAndValidity();
            }
        }

        // Validaciones adicionales según el estado
        if (nuevoEstado === 'En_Costeo' || nuevoEstado === 'Cotizado') {
            const tienePorDefecto = this.referenciasFormArray.controls.some((control) => {
                const sistemaId = control.get('sistema_id')?.value;
                const listaId = control.get('lista_id')?.value;
                return Number(sistemaId) === 62 && Number(listaId) === 3425;
            });

            if (tienePorDefecto) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se puede cambiar el estado a costeo si hay referencias con sistema y tipo de artículo por defecto.'
                });
                this.pedidoForm.patchValue({ estado: this.estadoActual });
                return;
            }

            // Verificar que haya referencias con proveedores
            const tieneProveedores = Array.from(this.proveedoresPorReferencia.values()).some((proveedores) => proveedores.length > 0);

            if (!tieneProveedores) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Advertencia',
                    detail: 'Se recomienda tener al menos una referencia con proveedores antes de cambiar a este estado'
                });
            }
        }
    }

    /**
     * El p-select de estado usa { label, value }; sin optionValue el control puede ser el objeto completo.
     */
    private normalizePedidoEstado(raw: unknown): PedidoEstado {
        if (raw !== null && typeof raw === 'object' && 'value' in (raw as object)) {
            return (raw as { value: PedidoEstado }).value;
        }
        return raw as PedidoEstado;
    }

    /**
     * Envía el formulario para actualizar el pedido
     */
    onSubmit(): void {
        if (this.pedidoForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            Object.keys(this.pedidoForm.controls).forEach((key) => {
                this.pedidoForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValue = this.pedidoForm.value;
        const nuevoEstado = this.normalizePedidoEstado(formValue.estado);

        // Validar transición antes de enviar
        if (!this.validarTransicionEstado(this.estadoActual, nuevoEstado)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Transición inválida',
                detail: `No se puede cambiar de "${this.estadoActual}" a "${nuevoEstado}"`
            });
            return;
        }

        if (nuevoEstado === 'En_Costeo') {
            const tienePorDefecto = this.referenciasFormArray.controls.some((control) => {
                const sistemaId = control.get('sistema_id')?.value;
                const listaId = control.get('lista_id')?.value;
                return Number(sistemaId) === 62 && Number(listaId) === 3425;
            });

            if (tienePorDefecto) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error de Validación',
                    detail: 'No se puede enviar a costeo con sistema y tipo de artículo por defecto en las líneas de análisis.'
                });
                return;
            }
        }

        this.submitting = true;
        this.resolverReferenciasAntesDeGuardar().subscribe({
            next: () => {
                const formData = new FormData();
                formData.append('_method', 'PUT'); // Importante para que Laravel reconozca el PUT con FormData

                // Datos básicos
                formData.append('tercero_id', formValue.tercero_id.toString());
                if (formValue.direccion) formData.append('direccion', formValue.direccion);
                if (formValue.comentario) formData.append('comentario', formValue.comentario);
                if (formValue.maquina_id) formData.append('maquina_id', formValue.maquina_id.toString());
                if (formValue.fabricante_id) formData.append('fabricante_id', formValue.fabricante_id.toString());
                if (formValue.contacto_id) formData.append('contacto_id', formValue.contacto_id.toString());
                formData.append('estado', nuevoEstado);
                if (nuevoEstado === 'Rechazado' && formValue.motivo_rechazo) {
                    formData.append('motivo_rechazo', formValue.motivo_rechazo);
                }

                // Referencias
                this.referenciasFormArray.controls.forEach((control, index) => {
                    const rawRef = control.value;
                    const definicionRaw = rawRef.definicion && typeof rawRef.definicion === 'object' ? rawRef.definicion.label || '' : rawRef.definicion || '';
                    const definicion = rawRef.referencia_id ? '' : definicionRaw;
                    if (rawRef.id) formData.append(`referencias[${index}][id]`, rawRef.id.toString());

                    formData.append(`referencias[${index}][referencia_id]`, rawRef.referencia_id ? rawRef.referencia_id.toString() : '');
                    formData.append(`referencias[${index}][sistema_id]`, rawRef.sistema_id ? rawRef.sistema_id.toString() : '');
                    formData.append(`referencias[${index}][lista_id]`, rawRef.lista_id ? rawRef.lista_id.toString() : '');
                    formData.append(`referencias[${index}][marca_id]`, rawRef.marca_id ? rawRef.marca_id.toString() : '');
                    formData.append(`referencias[${index}][cantidad]`, rawRef.cantidad.toString());
                    const comentarioRaw = rawRef.comentario;
                    const comentarioStr = typeof comentarioRaw === 'object' && comentarioRaw !== null ? JSON.stringify(comentarioRaw) : comentarioRaw || '';
                    formData.append(`referencias[${index}][comentario]`, comentarioStr);
                    formData.append(`referencias[${index}][estado]`, (rawRef.estado ?? true) ? '1' : '0');
                    formData.append(`referencias[${index}][definicion]`, definicion);

                    // Nuevos archivos de imagen
                    const files = rawRef.files || [];
                    files.forEach((file: File, fileIndex: number) => {
                        formData.append(`referencias[${index}][imagenes_nuevas][${fileIndex}]`, file);
                    });
                });

                this.store.dispatch(
                    updatePedido({
                        id: this.pedidoId(),
                        changes: formData as any
                    })
                );

                combineLatest([this.store.select(selectPedidosLoading), this.store.select(selectPedidosError)])
                    .pipe(
                        filter(([loading]) => !loading && this.submitting),
                        take(1)
                    )
                    .subscribe(([_, error]) => {
                        if (!this.submitting) {
                            return;
                        }
                        this.submitting = false;
                        if (!error) {
                            this.estadoActual = nuevoEstado;
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Éxito',
                                detail: 'Pedido actualizado correctamente'
                            });
                            setTimeout(() => {
                                this.router.navigate(['/app/pedidos', this.pedidoId()]);
                            }, 1500);
                        } else {
                            this.pedidoForm.patchValue({ estado: this.estadoActual });
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: error
                            });
                        }
                    });
            },
            error: () => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron resolver las referencias ingresadas'
                });
            }
        });
    }

    /**
     * Cancela y vuelve al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId()]);
    }

    /**
     * Verifica si un campo es inválido
     */
    isFieldInvalid(field: string): boolean {
        const control = this.pedidoForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    /**
     * Obtiene los proveedores de una referencia
     */
    getProveedoresReferencia(referenciaId: number | null): PedidoReferenciaProveedor[] {
        if (!referenciaId) return [];
        return this.proveedoresPorReferencia.get(referenciaId) || [];
    }

    /**
     * Verifica si una referencia está expandida
     */
    isReferenciaExpandida(index: number): boolean {
        const referenciaControl = this.referenciasFormArray.at(index);
        const referenciaId = referenciaControl.get('id')?.value;
        return this.referenciasExpandidas.has(referenciaId || index);
    }

    /**
     * Alterna la expansión de una referencia y muestra formulario de proveedor
     */
    toggleReferenciaExpandida(index: number): void {
        const referenciaControl = this.referenciasFormArray.at(index);
        const referenciaId = referenciaControl.get('id')?.value;

        if (!referenciaId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe guardar la referencia primero antes de agregar proveedores'
            });
            return;
        }

        if (this.referenciaIndexParaProveedor === index && this.nuevoProveedorForm) {
            // Cerrar formulario
            this.nuevoProveedorForm = null;
            this.referenciaIndexParaProveedor = null;
        } else {
            // Abrir formulario
            this.referenciaIndexParaProveedor = index;
            this.initNuevoProveedorForm();
        }
    }

    /**
     * Inicializa el formulario para nuevo proveedor
     */
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

        // Auto-completar datos cuando se selecciona un proveedor
        this.nuevoProveedorForm.get('tercero_id')?.valueChanges.subscribe((terceroId) => {
            const proveedor = this.proveedores.find((p) => p.value === terceroId);
            if (proveedor) {
                this.nuevoProveedorForm?.patchValue({
                    ubicacion: proveedor.ubicacion,
                    dias_entrega: proveedor.dias_entrega,
                    costo_unidad: proveedor.costo_unidad,
                    utilidad: proveedor.utilidad
                });
            }
        });
    }

    /**
     * Guarda el nuevo proveedor
     */
    guardarProveedor(): void {
        if (!this.nuevoProveedorForm || this.nuevoProveedorForm.invalid || this.referenciaIndexParaProveedor === null) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        const referenciaControl = this.referenciasFormArray.at(this.referenciaIndexParaProveedor);
        const referenciaId = referenciaControl.get('id')?.value;

        if (!referenciaId) {
            return;
        }

        const proveedorData: CreatePedidoReferenciaProveedorDto = this.nuevoProveedorForm.value;
        this.agregarProveedor(this.referenciaIndexParaProveedor, proveedorData);

        // Limpiar formulario
        this.nuevoProveedorForm = null;
        this.referenciaIndexParaProveedor = null;
    }

    /**
     * Agrega un proveedor a una referencia
     */
    private agregarProveedor(referenciaIndex: number, proveedor: CreatePedidoReferenciaProveedorDto): void {
        const referenciaControl = this.referenciasFormArray.at(referenciaIndex);
        const referenciaId = referenciaControl.get('id')?.value;

        if (!referenciaId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Debe guardar la referencia primero antes de agregar proveedores'
            });
            return;
        }

        this.proveedorService.addProveedor(this.pedidoId(), referenciaId, proveedor).subscribe({
            next: (response) => {
                const proveedores = this.proveedoresPorReferencia.get(referenciaId) || [];
                proveedores.push(response.data);
                this.proveedoresPorReferencia.set(referenciaId, proveedores);

                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Proveedor agregado correctamente'
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Error al agregar el proveedor'
                });
            }
        });
    }

    /**
     * Elimina un proveedor de una referencia
     */
    eliminarProveedor(referenciaIndex: number, proveedorId: number): void {
        const referenciaControl = this.referenciasFormArray.at(referenciaIndex);
        const referenciaId = referenciaControl.get('id')?.value;

        if (!referenciaId) {
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de eliminar este proveedor?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.proveedorService.deleteProveedor(this.pedidoId(), referenciaId, proveedorId).subscribe({
                    next: () => {
                        const proveedores = this.proveedoresPorReferencia.get(referenciaId) || [];
                        const index = proveedores.findIndex((p) => p.id === proveedorId);
                        if (index > -1) {
                            proveedores.splice(index, 1);
                            this.proveedoresPorReferencia.set(referenciaId, proveedores);
                        }

                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Proveedor eliminado correctamente'
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error al eliminar el proveedor'
                        });
                    }
                });
            }
        });
    }

    /**
     * Agrega un artículo al pedido
     */
    agregarArticulo(articulo: CreatePedidoArticuloDto): void {
        this.pedidoArticuloService.addArticulo(this.pedidoId(), articulo).subscribe({
            next: (response) => {
                this.articulosPedido.push(response.data);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Artículo agregado correctamente'
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Error al agregar el artículo'
                });
            }
        });
    }

    private syncCurrentMaquina(): void {
        const id = this.pedidoForm.get('maquina_id')?.value;
        if (!id) {
            this.currentMaquinaInfo.set(null);
            return;
        }
        this.currentMaquinaInfo.set(this.maquinasList.find((m) => m.id === id) ?? null);
    }

    /**
     * Muestra el modal con el detalle de la máquina
     */
    viewMaquina(maquina: any): void {
        if (!maquina) return;

        // Cargamos la máquina completa para asegurar que tenga los componentes
        this.maquinaService.getById(maquina.id).subscribe({
            next: (response: any) => {
                this.selectedMaquina.set(response.data || response);
                this.displayMaquinaDialog.set(true);
            },
            error: () => {
                // Fallback a los datos que ya tenemos si falla la carga
                this.selectedMaquina.set(maquina);
                this.displayMaquinaDialog.set(true);
            }
        });
    }

    /**
     * Elimina un artículo del pedido
     */
    eliminarArticulo(articuloId: number): void {
        this.confirmationService.confirm({
            message: '¿Está seguro de eliminar este artículo del pedido?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.pedidoArticuloService.deleteArticulo(this.pedidoId(), articuloId).subscribe({
                    next: () => {
                        const index = this.articulosPedido.findIndex((a) => a.id === articuloId);
                        if (index > -1) {
                            this.articulosPedido.splice(index, 1);
                        }
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: 'Artículo eliminado correctamente'
                        });
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: error.error?.message || 'Error al eliminar el artículo'
                        });
                    }
                });
            }
        });
    }

    /**
     * Abre el modal de comparación de proveedores
     */
    abrirComparacionProveedores(referenciaIndex: number): void {
        const referenciaControl = this.referenciasFormArray.at(referenciaIndex);
        const referenciaId = referenciaControl.get('id')?.value;

        if (!referenciaId) {
            return;
        }

        const proveedores = this.proveedoresPorReferencia.get(referenciaId) || [];

        if (proveedores.length < 2) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Advertencia',
                detail: 'Se necesitan al menos 2 proveedores para comparar'
            });
            return;
        }

        this.proveedoresComparacion = proveedores;
        this.referenciaComparacion = {
            referencia: referenciaControl.get('referencia_id')?.value,
            cantidad: referenciaControl.get('cantidad')?.value,
            referenciaIndex: referenciaIndex
        };
        this.mostrarComparacion = true;
    }

    /**
     * Cierra el modal de comparación
     */
    cerrarComparacion(): void {
        this.mostrarComparacion = false;
        this.proveedoresComparacion = [];
        this.referenciaComparacion = null;
    }

    /**
     * Obtiene el proveedor con mejor precio
     */
    getMejorProveedor(): PedidoReferenciaProveedor | null {
        if (this.proveedoresComparacion.length === 0) return null;

        return this.proveedoresComparacion.reduce((mejor, actual) => {
            return actual.valor_total < mejor.valor_total ? actual : mejor;
        });
    }

    /**
     * Obtiene el proveedor con mejor tiempo de entrega
     */
    getMejorTiempoEntrega(): PedidoReferenciaProveedor | null {
        if (this.proveedoresComparacion.length === 0) return null;

        return this.proveedoresComparacion.reduce((mejor, actual) => {
            const diasActual = actual.es_backorder ? Number.POSITIVE_INFINITY : (actual.dias_entrega ?? Number.POSITIVE_INFINITY);
            const diasMejor = mejor.es_backorder ? Number.POSITIVE_INFINITY : (mejor.dias_entrega ?? Number.POSITIVE_INFINITY);

            return diasActual < diasMejor ? actual : mejor;
        });
    }

    /**
     * Elimina un proveedor desde el modal de comparación
     */
    eliminarProveedorDesdeComparacion(proveedorId: number): void {
        if (!this.referenciaComparacion?.referenciaIndex) {
            return;
        }

        this.eliminarProveedor(this.referenciaComparacion.referenciaIndex, proveedorId);

        // Actualizar lista de comparación
        const index = this.proveedoresComparacion.findIndex((p) => p.id === proveedorId);
        if (index > -1) {
            this.proveedoresComparacion.splice(index, 1);
        }

        // Si quedan menos de 2 proveedores, cerrar el modal
        if (this.proveedoresComparacion.length < 2) {
            this.cerrarComparacion();
        }
    }

    /**
     * Abre el modal de edición de cliente (mismo wizard de 4 pasos que en creación de pedido).
     */
    abrirModalEditarCliente(): void {
        const terceroId = this.pedidoForm.get('tercero_id')?.value as number | null;
        if (!terceroId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin cliente',
                detail: 'Seleccione un cliente antes de editarlo.'
            });
            return;
        }
        this.terceroToEdit = { id: terceroId } as Tercero;
        this.displayEditTerceroDialog = true;
    }

    onTerceroModalVisibleChange(visible: boolean): void {
        this.displayEditTerceroDialog = visible;
        if (!visible) {
            this.terceroToEdit = null;
        }
    }

    onTerceroUpdated(tercero: Tercero): void {
        this.displayEditTerceroDialog = false;
        this.terceroToEdit = null;
        this.refreshTercerosOptions();

        const pedido = this.pedidoResponse();
        if (pedido && pedido.tercero_id === tercero.id) {
            this.pedidoResponse.set({
                ...pedido,
                tercero: {
                    ...pedido.tercero,
                    ...tercero
                } as Pedido['tercero']
            });
        }

        if (this.pedidoForm.get('tercero_id')?.value === tercero.id) {
            this.loadContactos(tercero.id);
        }
    }

    private refreshTercerosOptions(): void {
        this.terceroService.list({ per_page: 100, tipo: 'Cliente' }).subscribe({
            next: (response) => {
                this.terceros = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id,
                    telefono: t.telefono ?? '',
                    email: t.email ?? ''
                }));
                this.tercerosOriginal = [...this.terceros];
            }
        });
    }

    get currentTerceroInfo(): any {
        return this.pedidoResponse()?.tercero || null;
    }

    /** Teléfono del contacto seleccionado o del cliente, para enlace wa.me */
    get telefonoClienteWhatsApp(): string | undefined {
        const contactoId = this.pedidoForm.get('contacto_id')?.value as number | null;
        if (contactoId) {
            const contacto = this.contactosDetalle.find((c) => c.id === contactoId);
            const telefonoContacto = contacto?.telefono?.trim();
            if (telefonoContacto) {
                return telefonoContacto;
            }
        }

        const pedido = this.pedidoResponse();
        if (pedido?.contacto?.telefono?.trim() && (!contactoId || pedido.contacto.id === contactoId)) {
            return pedido.contacto.telefono.trim();
        }

        const terceroId = this.pedidoForm.get('tercero_id')?.value as number | null;
        if (terceroId) {
            const tercero = this.terceros.find((t) => t.value === terceroId) as { telefono?: string } | undefined;
            if (tercero?.telefono?.trim()) {
                return tercero.telefono.trim();
            }
        }

        return pedido?.tercero?.telefono?.trim() || undefined;
    }

    get emailCliente(): string | undefined {
        const contactoId = this.pedidoForm.get('contacto_id')?.value as number | null;
        if (contactoId) {
            const contacto = this.contactosDetalle.find((c) => c.id === contactoId);
            const emailContacto = contacto?.email?.trim();
            if (emailContacto) {
                return emailContacto;
            }
        }

        const pedido = this.pedidoResponse();
        if (pedido?.contacto?.email?.trim() && (!contactoId || pedido.contacto.id === contactoId)) {
            return pedido.contacto.email.trim();
        }

        const terceroId = this.pedidoForm.get('tercero_id')?.value as number | null;
        if (terceroId) {
            const tercero = this.terceros.find((t) => t.value === terceroId) as { email?: string } | undefined;
            if (tercero?.email?.trim()) {
                return tercero.email.trim();
            }
        }

        return pedido?.tercero?.email?.trim() || undefined;
    }

    sendEmail(email: string | undefined): void {
        if (email) {
            window.open(`mailto:${email}`, '_blank');
        }
    }

    sendWhatsApp(phone: string | undefined): void {
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
            return;
        }
        this.messageService.add({
            severity: 'warn',
            summary: 'Sin teléfono',
            detail: 'No hay número de teléfono registrado para el cliente o contacto seleccionado.'
        });
    }
}
