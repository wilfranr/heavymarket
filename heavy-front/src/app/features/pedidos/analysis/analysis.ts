import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Observable, filter, take, map, forkJoin, merge, catchError, of } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
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
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PopoverModule } from 'primeng/popover';
import { Popover } from 'primeng/popover';

import { updatePedido, loadPedido, updatePedidoSuccess, updatePedidoFailure } from '../../../store/pedidos/actions/pedidos.actions';
import { Pedido, UpdatePedidoDto, PedidoEstado, PedidoReferencia, PedidoReferenciaImagen } from '../../../core/models/pedido.model';
import { PEDIDO_ESTADO_ETIQUETA } from '../../../core/utils/pedido-estado-tag';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { TerceroService } from '../../../core/services/tercero.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { PedidoReferenciaProveedorService } from '../../../core/services/pedido-referencia-proveedor.service';
import { PedidoArticuloService } from '../../../core/services/pedido-articulo.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';
import { ReferenciaEditModalComponent } from '../../../shared/components/referencia-edit-modal/referencia-edit-modal.component';
import { ArticuloCreateModalComponent } from '../../../shared/components/articulo-create-modal/articulo-create-modal.component';
import { ArticuloEditModalComponent } from '../../../shared/components/articulo-edit-modal/articulo-edit-modal.component';
import { PedidoInfoCardComponent } from '../../../shared/components/pedido-info-card/pedido-info-card.component';
import { MaquinaInfoCardComponent } from '../../../shared/components/maquina-info-card/maquina-info-card.component';
import { Referencia } from '../../../core/models/referencia.model';

@Component({
    selector: 'app-pedido-analysis',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
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
        InputGroupModule,
        InputGroupAddonModule,
        ReferenciaCreateModalComponent,
        ReferenciaEditModalComponent,
        ArticuloCreateModalComponent,
        ArticuloEditModalComponent,
        PopoverModule,
        PedidoInfoCardComponent,
        MaquinaInfoCardComponent
    ],
    providers: [MessageService],
    templateUrl: './analysis.html',
    styleUrl: './analysis.scss'
})
export class AnalysisComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly actions$ = inject(Actions);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly terceroService = inject(TerceroService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly authService = inject(AuthService);
    private readonly articuloService = inject(ArticuloService);
    private readonly pedidoService = inject(PedidoService);
    private readonly cdr = inject(ChangeDetectorRef);

    pedidoForm!: FormGroup;
    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;

    pedidoId = signal<number>(0);
    sistemas: any[] = [];
    referencias: any[] = [];
    tiposArticulo: any[] = [];
    tiposEdit: any[] = [];

    // Opciones en cascada por fila (si aplica)
    tiposPorFila: any[][] = [];
    referenciasPorFila: any[][] = [];

    // Popover data
    popoverData: any = null;
    sistemasFull: any[] = [];
    tiposArticuloFull: any[] = [];

    submitting = false;
    finalizing = false;
    itemsLoading = false;

    /** Solo analistas y administración pueden pasar el pedido a costeo (no vendedores). */
    get puedePasarACosteo(): boolean {
        return this.authService.hasAnyRole(['Analista', 'analista', 'Administrador', 'super_admin']);
    }

    /** Verifica si el usuario actual es Analista (no admin) */
    get isAnalista(): boolean {
        const user = this.authService.currentUser();
        return user?.roles?.includes('Analista') ?? false;
    }

    // Estados para modales (si se necesitan similares a edit)
    displayMaquinaDialog = false;
    selectedMaquina: any = null;

    // Gestión de Comentarios (Replicado de Edit)
    displayComentarioDialog = false;
    comentariosItemActual: any[] = [];
    comentarioControl = new FormControl('');
    origenComentarioControl = new FormControl('');

    // Comentarios generales del pedido
    displayComentariosPedidoDialog = false;
    comentariosDelPedido: any[] = [];

    // Gestión de Imágenes (Replicado de Edit)
    displayImagenesCarouselModal = false;
    activeImagenesFilaIndex: number | null = null;
    galleriaResponsiveOptions = [
        { breakpoint: '1024px', numVisible: 5 },
        { breakpoint: '960px', numVisible: 4 },
        { breakpoint: '768px', numVisible: 3 },
        { breakpoint: '560px', numVisible: 1 }
    ];

    // Estados para modales de creación rápida (se mantienen los necesarios)
    showReferenciaModal = false;
    createReferenciaArticuloId: number | null = null;
    createReferenciaMarcaId: number | null = null;
    showReferenciaEditModal = false;
    editReferenciaId: number | null = null;
    private editReferenciaItemIndex = -1;
    private editReferenciaParteIndex = -1;
    activeItemIndex = -1;
    activeParteIndex = -1;

    // Estados para modales de artículo
    showArticuloCreateModal = false;
    showArticuloEditModal = false;
    editArticuloId: number | null = null;
    articuloContextItemIndex = -1;
    articuloContextParteIndex = -1;
    articuloContextReferenciaId: number | null = null;

    // Lógica de agregado en lote (similar a edit)
    displayLoteDialog = false;
    loteForm!: FormGroup;
    tiposLote: any[] = [];
    referenciasLote: any[] = [];

    /** Carga masiva (mismo flujo que landing cotizar + API que create pedido): panel + bulkSearchOrCreate */
    showBulkImport = false;
    activeBulkImportIndex: number | null = null;
    bulkText = '';
    processingBulk = false;
    /** Guía visual (misma UX que creación de pedido / importación masiva) */
    displayHelpDialog = false;

    ngOnInit(): void {
        this.initForm();
        this.initLoteForm();
        this.loadInitialData();
        this.loadPedido();
    }

    openHelpDialog(): void {
        this.displayHelpDialog = true;
    }

    abrirCargaMasiva(index: number | null = null): void {
        this.activeBulkImportIndex = index;
        this.showBulkImport = true;
        this.bulkText = '';
    }

    cerrarCargaMasiva(): void {
        this.showBulkImport = false;
        this.activeBulkImportIndex = null;
        this.bulkText = '';
    }

    private initLoteForm(): void {
        this.loteForm = this.fb.group({
            sistema_id: [null, Validators.required],
            articulo_id: [{ value: null, disabled: true }, Validators.required],
            referencias_seleccionadas: [{ value: [], disabled: true }, [Validators.required, Validators.minLength(1)]],
            cantidad_lote: [1, [Validators.required, Validators.min(1)]]
        });
    }

    /**
     * Igual que landing `cotizar.procesarMasivo`: una línea por referencia;
     * formato "CANTIDAD [espacios/tab] REFERENCIA" o solo código (cantidad 1).
     */
    private parseLineasCargaMasivaComoCotizar(texto: string): { codigo: string; cantidad: number }[] {
        const out: { codigo: string; cantidad: number }[] = [];
        const lines = texto.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                continue;
            }

            const match = trimmed.match(/^(\d+)\s+(.+)$/);
            if (match) {
                const cantidad = parseInt(match[1], 10);
                const codigoReferencia = match[2].trim().toUpperCase();
                if (cantidad > 0 && codigoReferencia) {
                    out.push({ cantidad, codigo: codigoReferencia });
                }
            } else {
                out.push({ cantidad: 1, codigo: trimmed.toUpperCase() });
            }
        }

        return out;
    }

    /**
     * Una tarjeta por referencia (como una fila por ítem en cotizar tras procesar).
     * Usa bulkSearchOrCreate como el paso 2 de creación de pedido (no temporal).
     */
    private agregarTarjetaDesdeResultadoBulk(row: any): void {
        const ref = row.referencia;
        const definicion = ref?.articulo?.definicion || ref?.referencia || row.codigo || 'Referencia';

        const opt = this.opcionReferenciaDesdeApi(ref);
        const parte = this.fb.group({
            id: [null],
            referencia_id: [row.referencia_id],
            cantidad: [row.cantidad || 1, [Validators.required, Validators.min(1)]],
            descripcion: [this.descripcionAnalisisDesdeOpcion(opt)],
            categoria: [null],
            categoria_ids: [[]]
        });

        const itemForm = this.fb.group({
            id: [null],
            estado_item: ['Pendiente'],
            sistema_id: [null],
            lista_id: [null],
            definicion: [definicion],
            cantidad: [row.cantidad || 1],
            comentario: [''],
            imagen: [null],
            imagenes: [[] as PedidoReferenciaImagen[]],
            expandido: [true],
            partes: this.fb.array([parte])
        });

        this.referenciasFormArray.push(itemForm);
    }

    private agregarParteDesdeResultadoBulk(itemIndex: number, row: any): void {
        const ref = row.referencia;
        const opt = this.opcionReferenciaDesdeApi(ref);
        const partes = this.getPartesFormArray(itemIndex);

        const parte = this.fb.group({
            id: [null],
            referencia_id: [row.referencia_id],
            cantidad: [row.cantidad || 1, [Validators.required, Validators.min(1)]],
            descripcion: [this.descripcionAnalisisDesdeOpcion(opt)],
            categoria: [null],
            categoria_ids: [[]]
        });

        partes.push(parte);
    }

    /**
     * Misma idea que cotizar: pegar listado y procesar; API como create pedido (bulkSearchOrCreate).
     */
    procesarCargaMasiva(): void {
        if (!this.bulkText?.trim() || this.processingBulk) {
            return;
        }

        const items = this.parseLineasCargaMasivaComoCotizar(this.bulkText);
        if (items.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Listado vacío',
                detail: 'Ingrese al menos una línea con un código de referencia.'
            });
            return;
        }

        this.processingBulk = true;

        // Obtenemos la marca de la máquina actual para asignarla a las referencias nuevas/temporales
        const marcaId = this.selectedMaquina?.fabricante_id || null;

        this.referenciaService.bulkSearchOrCreate(items, false, marcaId).subscribe({
            next: (response: any) => {
                this.processingBulk = false;
                const resultados = response.data;

                if (resultados && resultados.length > 0) {
                    if (this.activeBulkImportIndex !== null && this.activeBulkImportIndex >= 0) {
                        resultados.forEach((row: any) => this.agregarParteDesdeResultadoBulk(this.activeBulkImportIndex!, row));
                    } else {
                        resultados.forEach((row: any) => this.agregarTarjetaDesdeResultadoBulk(row));
                    }

                    this.loadReferencias();
                    this.cerrarCargaMasiva();
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Carga masiva',
                        detail: `${resultados.length} referencia(s) procesada(s) e incorporada(s) al análisis.`
                    });
                } else {
                    this.messageService.add({
                        severity: 'warn',
                        summary: 'Sin resultados',
                        detail: 'No se pudo procesar ninguna línea del listado.'
                    });
                }
            },
            error: (err) => {
                this.processingBulk = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message ?? err.error?.error ?? err.message ?? 'No se pudieron procesar las referencias.'
                });
            }
        });
    }

    /**
     * Opciones del p-select de referencia: por tipo (lista_id) o, si aún no hay tipo, desde catálogo global / fila.
     */
    getOpcionesReferenciaParaFila(itemIndex: number): any[] {
        try {
            if (!this.referenciasFormArray) return [];
            const item = this.referenciasFormArray.at(itemIndex);
            if (!item) return [];

            const listaId = item.get('lista_id')?.value;

            // Verificación ultra-segura de catálogo por tipo
            let porTipo: any[] = [];
            if (listaId && this.referenciasPorTipo) {
                const data = this.referenciasPorTipo[listaId];
                if (Array.isArray(data)) {
                    porTipo = data;
                }
            }

            // Clonamos el array base de forma segura sin usar spread operator (...)
            const out: any[] = [].concat(porTipo as any);
            const seen = new Set<number>();

            // Registrar IDs ya vistos en el catálogo por tipo
            for (let k = 0; k < out.length; k++) {
                if (out[k] && out[k].value) seen.add(out[k].value);
            }

            // Añadir el resto del catálogo global (No restrictivo - Issue #119)
            const globalCatalog = this.referencias || [];
            for (let k = 0; k < globalCatalog.length; k++) {
                const r = globalCatalog[k];
                if (r && r.value && !seen.has(r.value)) {
                    out.push(r);
                    seen.add(r.value);
                }
            }

            const partes = this.getPartesFormArray(itemIndex);
            if (partes && partes.controls) {
                const controls = partes.controls;
                for (let k = 0; k < controls.length; k++) {
                    const c = controls[k];
                    const id = c.get('referencia_id')?.value;
                    if (!id || seen.has(id)) {
                        continue;
                    }
                    seen.add(id);
                    const global = (this.referencias || []).find((r: any) => r.value === id);
                    const descFila = String(c.get('descripcion')?.value ?? '').trim();
                    const label = (global?.label ?? descFila) || String(id);
                    out.push({
                        label,
                        value: id,
                        descripcion: global?.descripcion ?? c.get('descripcion')?.value ?? '',
                        articulo_id: global?.articulo_id ?? null,
                        articulo_nombre: global?.articulo_nombre ?? global?.descripcion ?? '',
                        es_pieza_estandar: global?.es_pieza_estandar ?? false,
                        es_temporal: global?.es_temporal ?? false,
                        definicion_articulo: global?.definicion_articulo,
                        descripcion_especifica_articulo: global?.descripcion_especifica_articulo
                    });
                }
            }
            return out;
        } catch (e) {
            console.error('Análisis Error (getOpcionesReferenciaParaFila):', e);
            return [];
        }
    }

    abrirDialogoLote(index: number): void {
        this.activeItemIndex = index;
        this.loteForm.reset({ cantidad_lote: 1 });
        this.displayLoteDialog = true;
    }

    onSistemaLoteChange(sistemaId: number | null): void {
        this.loteForm.patchValue({ articulo_id: null, referencias_seleccionadas: [] });
        this.loteForm.get('articulo_id')?.disable();
        this.loteForm.get('referencias_seleccionadas')?.disable();
        this.tiposLote = [];
        this.referenciasLote = [];

        if (!sistemaId) return;

        // Cargar tipos vinculados al sistema desde el SistemaController
        this.sistemaService
            .getById(sistemaId)
            .pipe(take(1))
            .subscribe({
                next: (resp) => {
                    const sistema = resp.data;
                    if (sistema && sistema.articulos) {
                        this.tiposLote = sistema.articulos.map((l: any) => ({ label: l.nombre, value: l.id }));
                        this.loteForm.get('articulo_id')?.enable();
                    }
                }
            });
    }

    onTipoLoteChange(tipoId: number | null): void {
        this.loteForm.patchValue({ referencias_seleccionadas: [] });
        this.loteForm.get('referencias_seleccionadas')?.disable();
        this.referenciasLote = [];

        if (!tipoId) return;

        // Cargar referencias de ese tipo
        this.referenciaService.getAll({ articulo_id: tipoId, per_page: 500 }).subscribe({
            next: (response) => {
                this.referenciasLote = response.data.map((r: any) => ({
                    ...this.opcionReferenciaDesdeApi(r),
                    definicion: r.referencia
                }));
                this.loteForm.get('referencias_seleccionadas')?.enable();
            }
        });
    }

    confirmarLote(): void {
        if (this.loteForm.invalid) return;

        const { referencias_seleccionadas, cantidad_lote, articulo_id, sistema_id } = this.loteForm.value;

        if (this.activeItemIndex !== -1) {
            // Agregar sub-referencias al ítem actual
            const partes = this.getPartesFormArray(this.activeItemIndex);
            referencias_seleccionadas.forEach((refId: number) => {
                const refModel = this.referenciasLote.find((r) => r.value === refId);
                partes.push(
                    this.fb.group({
                        cantidad: [cantidad_lote],
                        referencia_id: [refId],
                        descripcion: [this.descripcionAnalisisDesdeOpcion(refModel ?? { descripcion: '', articulo_nombre: '' })],
                        categoria: [articulo_id],
                        categoria_ids: [articulo_id ? [articulo_id] : []]
                    })
                );
            });
        } else {
            // Agregar nuevos Requerimientos (Items) al Pedido
            referencias_seleccionadas.forEach((refId: number) => {
                const refModel = this.referenciasLote.find((r) => r.value === refId);
                const itemForm = this.fb.group({
                    id: [null],
                    estado_item: ['Preparado'],
                    sistema_id: [sistema_id],
                    lista_id: [articulo_id],
                    referencia_id: [refId],
                    definicion: [refModel?.label || ''],
                    cantidad: [cantidad_lote],
                    comentario: [''],
                    imagen: [null],
                    imagenes: [[] as PedidoReferenciaImagen[]],
                    expandido: [true],
                    partes: this.fb.array([
                        this.fb.group({
                            cantidad: [cantidad_lote, [Validators.required, Validators.min(1)]],
                            referencia_id: [refId],
                            descripcion: [this.descripcionAnalisisDesdeOpcion(refModel ?? { descripcion: '', articulo_nombre: '' })],
                            categoria: [articulo_id],
                            categoria_ids: [articulo_id ? [articulo_id] : []]
                        })
                    ])
                });
                this.referenciasFormArray.push(itemForm);
            });
        }

        this.displayLoteDialog = false;

        const tipoLote = this.tiposLote.find((t) => t.value === articulo_id);
        if (articulo_id != null && tipoLote?.label) {
            this.nombresTipoListaPorId[articulo_id] = tipoLote.label;
        }

        this.messageService.add({ severity: 'success', summary: 'Agregado exitoso', detail: `Se insertaron los elementos correctamente.` });
    }

    abrirDialogoLoteGlobal(): void {
        this.activeItemIndex = -1;
        this.loteForm.reset({ cantidad_lote: 1 });
        this.displayLoteDialog = true;
    }

    agregarNuevoItem(): void {
        const itemForm = this.fb.group({
            id: [null],
            estado_item: ['Pendiente'],
            sistema_id: [null],
            lista_id: [null],
            referencia_id: [null],
            definicion: ['Nuevo ítem manual'],
            cantidad: [1],
            comentario: [''],
            imagen: [null],
            imagenes: [[] as PedidoReferenciaImagen[]],
            expandido: [true],
            partes: this.fb.array([
                this.fb.group({
                    cantidad: [1, [Validators.required, Validators.min(1)]],
                    referencia_id: [null],
                    descripcion: [''],
                    categoria: [null],
                    categoria_ids: [[]]
                })
            ])
        });
        this.referenciasFormArray.push(itemForm);

        // Scroll suave al final de la lista para visibilidad
        setTimeout(() => {
            const cardElements = document.querySelectorAll('.figma-card-analysis');
            if (cardElements.length > 0) {
                cardElements[cardElements.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
    }

    removeItem(index: number): void {
        this.confirmationService.confirm({
            message: '¿Está seguro de eliminar este requerimiento del pedido? Se perderá todo el análisis asociado a este ítem.',
            header: 'Eliminar Requerimiento',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.referenciasFormArray.removeAt(index);

                if (this.activeItemIndex === index) {
                    this.activeItemIndex = -1;
                } else if (this.activeItemIndex > index) {
                    this.activeItemIndex--;
                }

                this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'El requerimiento ha sido removido del pedido.' });
            }
        });
    }

    referenciasPorTipo: { [tipoId: number]: any[] } = {};

    /**
     * Nombres de listas tipo "Tipo de Artículo" (id en pedido_referencia.lista_id).
     * Se rellena desde la relación `lista` del API al cargar el pedido; `tiposArticulo` usa otro catálogo
     * ("Categoría Comercial") y por eso no puede resolver el label en la primera pintada.
     */
    private nombresTipoListaPorId: Record<number, string> = {};

    private cargarReferenciasParaTipo(tipoId: number): void {
        if (!tipoId || this.referenciasPorTipo[tipoId]) return;

        this.referenciaService.getAll({ articulo_id: tipoId, per_page: 500 }).subscribe({
            next: (resp) => {
                this.referenciasPorTipo[tipoId] = resp.data.map((r: any) => this.opcionReferenciaDesdeApi(r));
            }
        });
    }

    onReferenciaFilaChange(event: any, itemIndex: number, parteIndex: number): void {
        const refId = event.value;
        if (!refId) return;

        const item = this.referenciasFormArray.at(itemIndex);
        const listaId = item.get('lista_id')?.value;

        const refObj = (listaId ? this.referenciasPorTipo[listaId]?.find((r) => r.value === refId) : undefined) ?? this.referencias.find((r) => r.value === refId) ?? this.getOpcionesReferenciaParaFila(itemIndex).find((r) => r.value === refId);

        const partes = this.getPartesFormArray(itemIndex);
        const parte = partes.at(parteIndex);

        if (refObj) {
            const payload: any = {
                categoria: refObj.lista_id || refObj.articulo_id,
                descripcion: this.descripcionAnalisisDesdeOpcion(refObj)
            };

            parte.patchValue(payload);
        }

        // Actualizar estado del ítem: verificar referencia principal + partes
        this.actualizarEstadoItem(itemIndex);
    }

    private actualizarEstadoItem(itemIndex: number): void {
        const item = this.referenciasFormArray.at(itemIndex);
        const itemRef = item.get('referencia_id')?.value;

        // Verificar estado basado en referencia del ítem Y partes
        const partes = this.getPartesFormArray(itemIndex);
        let partesConRef = 0;
        let partesConCat = 0;

        for (const parte of partes.controls) {
            if (parte.get('referencia_id')?.value) partesConRef++;
            if (parte.get('categoria')?.value) partesConCat++;
        }

        // Completo si tiene referencia principal O todas las partes tienen referencia + categoría
        const itemCompleto = !!itemRef || (partesConRef === partes.length && partesConCat === partes.length);

        item.get('estado_item')?.setValue(itemCompleto ? 'Analizado' : 'En proceso');
    }

    // --- MÉTODOS DE COMENTARIOS E IMÁGENES (REPLICADOS DE EDIT) ---

    abrirDialogoComentario(index: number): void {
        this.activeItemIndex = index;
        const item = this.referenciasFormArray.at(index);
        const rawComentario = item?.get('comentario')?.value;
        this.comentariosItemActual = this.parseComentariosRaw(rawComentario);
        this.comentarioControl.setValue('');
        const user = this.authService.currentUser();
        const rol = user && user.roles && user.roles.length > 0 ? user.roles[0] : 'Analista';
        this.origenComentarioControl.setValue(rol);
        this.displayComentarioDialog = true;
    }

    guardarComentario(): void {
        if (this.activeItemIndex !== -1) {
            const texto = (this.comentarioControl.value || '').toString().trim();
            if (texto) {
                const row = this.referenciasFormArray.at(this.activeItemIndex);
                const rawAnterior = row.get('comentario')?.value;
                const existentes = this.parseComentariosRaw(rawAnterior);

                existentes.push({
                    origen: (this.origenComentarioControl.value || 'Analista').toString(),
                    comentario: texto,
                    fecha: new Date().toISOString()
                });

                row.patchValue({ comentario: this.buildComentariosPayload(existentes) });
            }
        }
        this.displayComentarioDialog = false;
        this.activeItemIndex = -1;
        this.comentariosItemActual = [];
        this.comentarioControl.setValue('');
    }

    private parseComentariosRaw(raw: unknown): { origen: string; comentario: string; fecha?: string }[] {
        if (!raw) return [];

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
            if (esTextoInvalido(trimmed)) return [];
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
                /* Formato legacy */
            }
            if (esTextoInvalido(trimmed)) return [];
            return [{ origen: 'Legacy', comentario: trimmed }];
        }
        return [];
    }

    private buildComentariosPayload(comentarios: any[]): any[] {
        return comentarios;
    }

    /** Conteo para badge (#68); alineado con el historial del diálogo de comentarios. */
    conteoComentariosItem(index: number): number {
        const raw = this.referenciasFormArray.at(index)?.get('comentario')?.value;
        return this.parseComentariosRaw(raw).length;
    }

    /** Conteo para badge (#68); misma lógica que la galería del modal de imágenes. */
    conteoImagenesItem(index: number): number {
        const row = this.referenciasFormArray.at(index);
        if (!row) {
            return 0;
        }
        return this.buildImagenesListaDesdeItemRow(row).length;
    }

    private mergeImagenesPedidoReferencia(base: PedidoReferenciaImagen[], extra?: PedidoReferenciaImagen[] | null): PedidoReferenciaImagen[] {
        const seen = new Set<string>();
        const out: PedidoReferenciaImagen[] = [];
        const pushUnique = (img: PedidoReferenciaImagen) => {
            const url = this.urlNormalizadaImagenPedidoRef(img);
            if (url && !seen.has(url)) {
                seen.add(url);
                out.push(img);
            }
        };
        for (const img of base || []) {
            pushUnique(img);
        }
        for (const img of extra || []) {
            pushUnique(img);
        }
        return out;
    }

    private urlNormalizadaImagenPedidoRef(img: PedidoReferenciaImagen | Record<string, unknown>): string {
        const raw = (img as { imagen?: unknown }).imagen;
        if (typeof raw === 'string') {
            return raw;
        }
        if (raw && typeof raw === 'object' && 'url' in raw && typeof (raw as { url: unknown }).url === 'string') {
            return (raw as { url: string }).url;
        }
        return '';
    }

    private buildImagenesListaDesdeItemRow(row: AbstractControl): {
        itemImageSrc: string;
        thumbnailImageSrc: string;
        origen?: string;
    }[] {
        const imagen = row.get('imagen')?.value;
        const imagenes = row.get('imagenes')?.value || [];
        const out: { itemImageSrc: string; thumbnailImageSrc: string; origen?: string }[] = [];
        const seen = new Set<string>();

        (imagenes as PedidoReferenciaImagen[]).forEach((img: PedidoReferenciaImagen) => {
            const url = this.urlNormalizadaImagenPedidoRef(img);
            if (url && !seen.has(url)) {
                seen.add(url);
                out.push({
                    itemImageSrc: url,
                    thumbnailImageSrc: url,
                    origen: img.origen
                });
            }
        });
        if (imagen) {
            const url = typeof imagen === 'string' ? imagen : ((imagen as { url?: string }).url ?? (imagen as unknown as string));
            if (url && typeof url === 'string' && !seen.has(url)) {
                seen.add(url);
                out.unshift({ itemImageSrc: url, thumbnailImageSrc: url, origen: 'Original' });
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

    get galleriaImages(): { itemImageSrc: string; thumbnailImageSrc: string; origen?: string }[] {
        if (this.activeImagenesFilaIndex === null) {
            return [];
        }
        return this.buildImagenesListaDesdeItemRow(this.referenciasFormArray.at(this.activeImagenesFilaIndex));
    }

    abrirCrearReferencia(itemIndex: number, parteIndex: number): void {
        this.activeItemIndex = itemIndex;
        this.activeParteIndex = parteIndex;

        // 1. Resolver Marca ID (Fabricante del Pedido)
        this.createReferenciaMarcaId = null;
        this.pedido$.pipe(take(1)).subscribe((pedido) => {
            if (pedido?.fabricante_id) {
                this.createReferenciaMarcaId = pedido.fabricante_id;
            }
        });

        // 2. NO pre-asociar artículo automáticamente. La referencia se creará como temporal
        // y el analista podrá asociarla a un artículo existente o crear uno nuevo después.
        this.createReferenciaArticuloId = null;

        this.showReferenciaModal = true;
    }

    abrirCrearArticuloDesdeParte(itemIndex: number, parteIndex: number): void {
        this.articuloContextItemIndex = itemIndex;
        this.articuloContextParteIndex = parteIndex;
        this.articuloContextReferenciaId = this.getPartesFormArray(itemIndex).at(parteIndex).get('referencia_id')?.value;
        this.showArticuloCreateModal = true;
    }

    onReferenciaCreada(nuevaRef: any): void {
        // Recargar la lista de referencias
        this.loadReferencias();

        // Asignar al formulario si hay un índice activo
        if (this.activeItemIndex !== -1 && this.activeParteIndex !== -1) {
            const partes = this.getPartesFormArray(this.activeItemIndex);
            const parte = partes.at(this.activeParteIndex);
            parte.get('referencia_id')?.setValue(nuevaRef.id);

            const currentDesc = (parte.get('descripcion')?.value ?? '').trim();
            if (this.debeSobrescribirDescripcion(currentDesc)) {
                parte.patchValue({
                    descripcion: this.descripcionAnalisisDesdeOpcion(this.opcionReferenciaDesdeApi(nuevaRef))
                });
            }
        }

        this.showReferenciaModal = false;
        this.activeItemIndex = -1;
        this.activeParteIndex = -1;

        this.messageService.add({ severity: 'success', summary: 'Referencia Creada', detail: `La referencia ${nuevaRef.referencia} ha sido creada y asignada.` });
    }

    abrirEditarReferencia(itemIndex: number, parteIndex: number): void {
        const parte = this.getPartesFormArray(itemIndex).at(parteIndex);
        const refId = parte.get('referencia_id')?.value;
        if (!refId) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Sin referencia',
                detail: 'Seleccione o cree una referencia antes de continuar.'
            });
            return;
        }

        // Obtener datos de la referencia desde las opciones cargadas
        const listaId = this.referenciasFormArray.at(itemIndex).get('lista_id')?.value;

        let opt = listaId ? this.referenciasPorTipo[listaId]?.find((x) => x.value === refId) : this.referencias.find((x) => x.value === refId);

        // Búsqueda exhaustiva en todos los catálogos si no se encontró
        if (!opt) {
            for (const catId in this.referenciasPorTipo) {
                const found = this.referenciasPorTipo[catId].find((x) => x.value === refId);
                if (found) {
                    opt = found;
                    break;
                }
            }
        }

        // Si aún no se encuentra, buscar en el catálogo global
        if (!opt) {
            opt = this.referencias.find((x) => x.value === refId);
        }

        if (!opt) {
            // Fallback: buscar directamente en el API
            this.referenciaService
                .getById(refId)
                .pipe(take(1))
                .subscribe({
                    next: (resp) => {
                        const refData = resp.data;
                        if (refData) {
                            const optFallback = this.opcionReferenciaDesdeApi(refData);
                            this.procesarEditarReferencia(optFallback, itemIndex, parteIndex);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'No se encontraron datos de la referencia.'
                            });
                        }
                    },
                    error: (err) => {
                        console.error('Error buscando referencia en API:', err);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudieron cargar los datos de la referencia.'
                        });
                    }
                });
            return;
        }

        this.procesarEditarReferencia(opt, itemIndex, parteIndex);
    }

    private procesarEditarReferencia(opt: any, itemIndex: number, parteIndex: number): void {
        // Guardar contexto para actualizar después
        this.articuloContextItemIndex = itemIndex;
        this.articuloContextParteIndex = parteIndex;
        this.articuloContextReferenciaId = opt.value;

        // Evaluar estado de la referencia
        const tieneArticulo = !!opt.articulo_id && !opt.es_temporal;

        if (tieneArticulo) {
            // Caso 1: Referencia asociada a artículo existente → Editar artículo
            this.editArticuloId = opt.articulo_id;
            this.showArticuloEditModal = true;
            this.showArticuloCreateModal = false;
        } else {
            // Caso 2: Referencia sin artículo → Crear artículo desde referencia
            this.showArticuloCreateModal = true;
            this.showArticuloEditModal = false;
            this.showReferenciaEditModal = false;
        }
    }

    onReferenciaEditVisibleChange(visible: boolean): void {
        this.showReferenciaEditModal = visible;
        if (!visible) {
            this.editReferenciaId = null;
            this.editReferenciaItemIndex = -1;
            this.editReferenciaParteIndex = -1;
        }
    }

    onReferenciaActualizada(ref: Referencia): void {
        const i = this.editReferenciaItemIndex;
        const j = this.editReferenciaParteIndex;

        this.loadReferencias();

        if (i >= 0 && j >= 0) {
            const parte = this.getPartesFormArray(i).at(j);
            const opt = this.opcionReferenciaDesdeApi(ref);

            const currentDesc = (parte.get('descripcion')?.value ?? '').trim();
            if (this.debeSobrescribirDescripcion(currentDesc)) {
                parte.patchValue({ descripcion: this.descripcionAnalisisDesdeOpcion(opt) });
            }

            const listaId = this.referenciasFormArray.at(i).get('lista_id')?.value;
            if (listaId && this.referenciasPorTipo[listaId]) {
                const idx = this.referenciasPorTipo[listaId].findIndex((x) => x.value === ref.id);
                const entry = opt;
                if (idx >= 0) {
                    this.referenciasPorTipo[listaId][idx] = entry;
                } else {
                    this.referenciasPorTipo[listaId].push(entry);
                }
            }
        }
    }

    // Handlers para modales de artículo
    onArticuloCreated(payload: any): void {
        const i = this.articuloContextItemIndex;
        const j = this.articuloContextParteIndex;
        const refId = this.articuloContextReferenciaId;
        const referenciaActualizada = payload?.referencia;

        // Recargar referencias para obtener el artículo recién creado
        this.loadReferencias();

        if (i >= 0 && j >= 0 && refId) {
            const parte = this.getPartesFormArray(i).at(j);
            const optActualizada = referenciaActualizada ? this.opcionReferenciaDesdeApi(referenciaActualizada) : null;
            if (referenciaActualizada) {
                this.actualizarReferenciaLocal(referenciaActualizada, i);
            }

            // Actualizar descripción con los datos del artículo recién creado sin esperar recargas.
            const opt =
                optActualizada ||
                this.referencias.find((x) => x.value === refId) ||
                Object.values(this.referenciasPorTipo)
                    .flat()
                    .find((x) => x.value === refId);
            if (opt) {
                const currentDesc = (parte.get('descripcion')?.value ?? '').trim();
                if (referenciaActualizada || this.debeSobrescribirDescripcion(currentDesc)) {
                    parte.patchValue({ descripcion: this.descripcionAnalisisDesdeOpcion(opt) });
                }
            }
            this.actualizarEstadoItem(i);
            this.cdr.detectChanges();
        }

        // Reset context
        this.articuloContextItemIndex = -1;
        this.articuloContextParteIndex = -1;
        this.articuloContextReferenciaId = null;
    }

    private actualizarReferenciaLocal(ref: Referencia, itemIndex: number): void {
        const entry = this.opcionReferenciaDesdeApi(ref);
        const upsert = (items: any[]): any[] => {
            const index = items.findIndex((item) => item.value === entry.value);
            if (index >= 0) {
                const next = [...items];
                next[index] = entry;
                return next;
            }
            return [entry, ...items];
        };

        this.referencias = upsert(this.referencias || []);

        const listaId = this.referenciasFormArray.at(itemIndex)?.get('lista_id')?.value;
        if (listaId) {
            this.referenciasPorTipo[listaId] = upsert(this.referenciasPorTipo[listaId] || []);
        }
    }

    onArticuloUpdated(articulo: any): void {
        const i = this.articuloContextItemIndex;
        const j = this.articuloContextParteIndex;
        const refId = this.articuloContextReferenciaId;

        if (i >= 0 && j >= 0 && refId && articulo) {
            const parte = this.getPartesFormArray(i).at(j);
            const referenciaActualizada = this.referenciaDesdeArticuloActualizado(articulo, refId);
            const optActualizada = this.opcionReferenciaDesdeApi(referenciaActualizada);

            this.actualizarReferenciaLocal(referenciaActualizada, i);
            parte.patchValue({ descripcion: this.descripcionAnalisisDesdeOpcion(optActualizada) });
            this.actualizarEstadoItem(i);
            this.cdr.detectChanges();
        }
    }

    onArticuloEditVisibleChange(visible: boolean): void {
        if (!visible) {
            this.onArticuloEditClosed();
        }
    }

    private referenciaDesdeArticuloActualizado(articulo: any, refId: number): Referencia {
        const referenciasArticulo = Array.isArray(articulo?.referencias) ? articulo.referencias : [];
        const referenciaArticulo = referenciasArticulo.find((ref: any) => (ref.id ?? ref.referencia_id) === refId);
        const referenciaLocal =
            this.referencias.find((ref: any) => ref.value === refId) ||
            Object.values(this.referenciasPorTipo)
                .flat()
                .find((ref: any) => ref.value === refId);

        return {
            ...(referenciaArticulo || {}),
            id: refId,
            referencia: referenciaArticulo?.referencia ?? referenciaLocal?.label ?? String(refId),
            marca_id: referenciaArticulo?.marca_id ?? referenciaLocal?.marca_id ?? null,
            articulo_id: articulo.id,
            es_temporal: false,
            comentario: referenciaArticulo?.comentario ?? referenciaLocal?.descripcion ?? null,
            created_at: referenciaArticulo?.created_at ?? '',
            updated_at: referenciaArticulo?.updated_at ?? '',
            marca: referenciaArticulo?.marca,
            lista_id: referenciaArticulo?.lista_id ?? referenciaLocal?.lista_id ?? null,
            articulo,
            articulo_es_pieza_estandar: articulo.es_pieza_estandar,
            articulo_definicion: articulo.definicion,
            articulo_descripcion_especifica: articulo.descripcionEspecifica
        } as Referencia;
    }

    private onArticuloEditClosed(): void {
        this.editArticuloId = null;
        this.articuloContextItemIndex = -1;
        this.articuloContextParteIndex = -1;
        this.articuloContextReferenciaId = null;
        // Recargar referencias por si hubo cambios
        this.loadReferencias();
    }

    private loadReferencias(): void {
        this.referenciaService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                this.referencias = response.data.map((r: any) => this.opcionReferenciaDesdeApi(r));
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Normaliza una fila del API de referencias para selectores del análisis (#69).
     */
    private opcionReferenciaDesdeApi(r: any): {
        label: string;
        value: number;
        descripcion: string;
        articulo_id: number | null;
        articulo_nombre: string;
        es_pieza_estandar: boolean;
        es_temporal: boolean;
        definicion_articulo?: string;
        descripcion_especifica_articulo?: string;
        articulo_imagen?: string;
        articulo_peso?: number;
        referencias_cruzadas?: any[];
        lista_id: number | null;
        marca_nombre?: string;
        es_juego: boolean;
    } {
        const art = r.articulo;
        const esPieza = !!(art?.es_pieza_estandar ?? r.articulo_es_pieza_estandar);
        const def = (art?.definicion ?? r.articulo_definicion ?? '') as string;
        const esp = (art?.descripcionEspecifica ?? r.articulo_descripcion_especifica ?? '') as string;
        const esJuego = !!(art?.articuloJuegos && art.articuloJuegos.length > 0) || !!(r.articulo_juegos && r.articulo_juegos.length > 0);

        return {
            label: r.referencia,
            value: r.id,
            descripcion: r.comentario || '',
            articulo_id: r.articulo_id ?? null,
            articulo_nombre: (def || esp || '').trim(),
            es_pieza_estandar: esPieza,
            es_temporal: !!r.es_temporal,
            definicion_articulo: def.trim() || undefined,
            descripcion_especifica_articulo: esp.trim() || undefined,
            articulo_imagen: art?.fotoDescriptiva || r.articulo_imagen,
            articulo_peso: art?.peso ?? r.articulo_peso,
            referencias_cruzadas: art?.referencias || r.articulo_referencias || [],
            lista_id: r.lista_id ?? null,
            marca_nombre: r.marca?.nombre || r.marca_nombre || 'N/A',
            es_juego: esJuego
        };
    }

    /** En análisis, la descripción de la fila corresponde a descripcionEspecifica del artículo. */
    private descripcionAnalisisDesdeOpcion(opt: {
        articulo_id?: number | null;
        es_temporal?: boolean;
        es_pieza_estandar?: boolean;
        definicion_articulo?: string;
        descripcion_especifica_articulo?: string;
        articulo_nombre?: string;
        descripcion?: string;
    }): string {
        if (opt.articulo_id && !opt.es_temporal) {
            return String(opt.descripcion_especifica_articulo || '').trim() || String(opt.articulo_nombre || '').trim() || String(opt.definicion_articulo || '').trim() || String(opt.descripcion || '').trim() || 'Sin descripción';
        }
        return opt.descripcion || opt.articulo_nombre || 'Sin descripción';
    }

    /**
     * Determina si una descripción debe ser sobrescrita al cambiar referencia.
     * Retorna true si está vacía o es el comentario genérico de landing.
     */
    private debeSobrescribirDescripcion(currentDesc: string): boolean {
        const trimmed = currentDesc.trim();
        if (!trimmed) return true;
        const normalized = trimmed.toLowerCase();
        return normalized.includes('referencia manual desde landing') || normalized.includes('referencia temporal') || normalized.includes('pedido interno') || normalized.includes('requiere revisión');
    }

    /** Misma lógica desde una línea `PedidoReferencia` con `referencia.articulo` cargado. */
    private textoDescripcionArticuloDesdePedidoLinea(r: PedidoReferencia): string {
        const art = r.referencia?.articulo;
        const parts = [art?.definicion, art?.descripcionEspecifica].filter((x) => x && String(x).trim());
        if (parts.length > 0) {
            return parts.join(' — ');
        }
        const com = r.referencia?.comentario;
        if (typeof com === 'string' && com.trim()) {
            return com.trim();
        }
        return '';
    }

    /** Código de referencia para listados en modales. */
    getEtiquetaCodigoReferenciaParte(itemIndex: number, parteIndex: number): string {
        const item = this.referenciasFormArray.at(itemIndex);
        const parte = this.getPartesFormArray(itemIndex).at(parteIndex);
        const refId = parte?.get('referencia_id')?.value;
        if (!refId) {
            return '—';
        }
        const listaId = item?.get('lista_id')?.value;
        const opt = (listaId ? this.referenciasPorTipo[listaId]?.find((x) => x.value === refId) : undefined) ?? this.referencias.find((x) => x.value === refId);
        return opt?.label ?? String(refId);
    }

    private initForm(): void {
        this.pedidoForm = this.fb.group({
            referencias: this.fb.array([])
        });
    }

    addParte(index: number): void {
        const partes = this.getPartesFormArray(index);
        partes.push(
            this.fb.group({
                cantidad: [1, [Validators.required, Validators.min(1)]],
                referencia_id: [null],
                descripcion: [''],
                categoria: [null],
                categoria_ids: [[]]
            })
        );
    }

    removeParte(itemIndex: number, parteIndex: number): void {
        const partes = this.getPartesFormArray(itemIndex);
        if (partes.length > 1) {
            partes.removeAt(parteIndex);
        }
    }

    private loadInitialData(): void {
        forkJoin({
            sistemas: this.sistemaService.getAll({ per_page: 100 }),
            tipos: this.listaService.getByTipo('Categoría Comercial')
        }).subscribe({
            next: ({ sistemas, tipos }) => {
                this.sistemasFull = sistemas.data;
                this.tiposArticuloFull = tipos;
                this.sistemas = sistemas.data.map((s) => ({ label: s.nombre, value: s.id }));
                this.tiposArticulo = tipos.map((l: any) => ({ label: l.nombre, value: l.id }));
                this.loadReferencias();
                this.cdr.detectChanges();
            }
        });
    }

    getSistemaNombre(id: number | null): string {
        if (!id) return 'Sin sistema';
        return this.sistemas.find((s) => s.value === id)?.label || 'Sistema desconocido';
    }

    getTipoNombre(id: number | null): string {
        if (!id) return 'Sin tipo';
        const cached = this.nombresTipoListaPorId[id];
        if (cached) {
            return cached;
        }
        // tiposEdit: tipos del sistema (mismo origen que el modal de edición). tiposArticulo: otro catálogo.
        const tipo = (this.tiposEdit || []).find((t) => t.value === id) || (this.tiposArticulo || []).find((t) => t.value === id);
        return tipo?.label || 'Tipo desconocido';
    }

    private loadPedido(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const pedidoId = parseInt(id, 10);
            this.pedidoId.set(pedidoId);
            this.store.dispatch(loadPedido({ id: pedidoId }));
            this.pedido$ = this.store.select(selectPedidoById(pedidoId));
            this.loading$ = this.store.select(selectPedidosLoading);

            this.pedido$
                .pipe(
                    filter((p) => !!p && p.referencias !== undefined),
                    take(1)
                )
                .subscribe((pedido) => {
                    if (pedido) {
                        if (pedido.referencias && pedido.referencias.length > 0) {
                            this.itemsLoading = true;
                            // 1. Recolectar todos los lista_id únicos
                            const tiposUnicos = new Set<number>();
                            pedido.referencias.forEach((r) => {
                                if (r.lista_id) tiposUnicos.add(r.lista_id);
                                if (r.lista_id && r.lista?.nombre) {
                                    this.nombresTipoListaPorId[r.lista_id] = r.lista.nombre;
                                }
                            });

                            // 2. Cargar TODAS las referencias por tipo ANTES de construir el formulario
                            const cargas = Array.from(tiposUnicos).map((tipoId) =>
                                this.referenciaService.getAll({ articulo_id: tipoId, per_page: 500 }).pipe(
                                    map((resp) => ({ tipoId, data: resp.data })),
                                    catchError((err) => {
                                        console.error(`Error cargando referencias para tipo ${tipoId}:`, err);
                                        return of({ tipoId, data: [] });
                                    })
                                )
                            );

                            if (cargas.length > 0) {
                                forkJoin(cargas).subscribe({
                                    next: (resultados) => {
                                        resultados.forEach(({ tipoId, data }) => {
                                            this.referenciasPorTipo[tipoId] = data.map((r: any) => this.opcionReferenciaDesdeApi(r));
                                        });
                                        // 3. Ahora sí construir el formulario con las opciones ya disponibles
                                        if (pedido.referencias) {
                                            this.cargarReferenciasAlFormArray(pedido.referencias);
                                            this.itemsLoading = false;
                                            this.cdr.detectChanges();
                                        }
                                    },
                                    error: (err) => {
                                        console.error('Error en forkJoin de cargas:', err);
                                        // Fallback: construir formulario aunque fallen las cargas
                                        if (pedido.referencias) {
                                            this.cargarReferenciasAlFormArray(pedido.referencias);
                                            this.itemsLoading = false;
                                            this.cdr.detectChanges();
                                        }
                                    }
                                });
                            } else if (pedido.referencias) {
                                this.cargarReferenciasAlFormArray(pedido.referencias);
                                this.itemsLoading = false;
                                this.cdr.detectChanges();
                            }
                        }
                        this.comentariosDelPedido = this.parseComentariosRaw(pedido.comentario);
                    }
                });
        }
    }

    private cargarReferenciasAlFormArray(referencias: PedidoReferencia[]): void {
        this.referenciasFormArray.clear();

        // Agrupar las referencias por lista_id (el concepto/requerimiento) y sistema_id
        // Esto permite que el backend (lista plana) se vea como tarjetas agrupadas en el frontend
        const grupos: { [key: string]: any } = {};

        referencias.forEach((r) => {
            // Clave única por requerimiento: sistema + tipo + descripcion + cantidad + id
            // Se incluye el r.id para asegurar que cada línea del pedido sea un card independiente si ya existe en DB.
            // Si el id es nulo (items nuevos), se agrupan por metadata para permitir añadir alternativas.
            const key = `${r.sistema_id}_${r.lista_id}_${r.definicion}_${r.cantidad}_${r.id || 'new'}`;

            if (!grupos[key]) {
                grupos[key] = {
                    referencia_id: r.referencia_id, // Guardar referencia_id del primer item
                    sistema_id: r.sistema_id,
                    lista_id: r.lista_id,
                    definicion: r.definicion || r.lista?.nombre || 'Sin definición',
                    cantidad: r.cantidad,
                    comentario: r.comentario ?? null,
                    imagen: r.imagen ?? null,
                    imagenes: [...(r.imagenes ?? [])] as PedidoReferenciaImagen[],
                    partes: []
                };
            } else {
                const g = grupos[key];
                const comActual = g.comentario;
                if ((!comActual || !String(comActual).trim()) && r.comentario != null && String(r.comentario).trim() !== '') {
                    g.comentario = r.comentario;
                }
                g.imagenes = this.mergeImagenesPedidoReferencia(g.imagenes, r.imagenes);
                if (!g.imagen && r.imagen) {
                    g.imagen = r.imagen;
                }
            }

            // Añadir esta referencia técnica como una fila dentro de la tarjeta
            grupos[key].partes.push({
                id: r.id,
                referencia_id: r.referencia_id,
                cantidad: r.cantidad,
                descripcion: r.referencia
                    ? this.descripcionAnalisisDesdeOpcion(
                          this.opcionReferenciaDesdeApi({
                              ...r.referencia,
                              id: r.referencia.id ?? r.referencia_id
                          })
                      )
                    : this.textoDescripcionArticuloDesdePedidoLinea(r) || r.definicion || '',
                categoria: r.categoria_comercial_id || r.lista_id,
                categorias: r.categoria_comercial_ids || (r.categoria_comercial_id ? [r.categoria_comercial_id] : [])
            });
        });

        // Poblar el formulario con los grupos procesados
        Object.values(grupos).forEach((g) => {
            // Verificar si el grupo tiene referencia_id (viene de la primera referencia del grupo)
            const tieneRefId = g.referencia_id && typeof g.referencia_id === 'number' && g.referencia_id > 0;

            const itemGroup = this.fb.group({
                id: [null],
                referencia_id: [g.referencia_id ?? null], // Campo de referencia del ítem principal
                estado_item: [tieneRefId ? 'Analizado' : 'Pendiente'],
                sistema_id: [g.sistema_id],
                lista_id: [g.lista_id],
                definicion: [g.definicion],
                cantidad: [g.cantidad],
                comentario: [g.comentario],
                imagen: [g.imagen ?? null],
                imagenes: [g.imagenes ?? []],
                expandido: [true],
                partes: this.fb.array(
                    g.partes.map((p: any) =>
                        this.fb.group({
                            id: [p.id],
                            referencia_id: [p.referencia_id || null],
                            cantidad: [p.cantidad || 1, [Validators.required, Validators.min(1)]],
                            descripcion: [p.descripcion || ''],
                            categoria: [p.categoria || null],
                            categoria_ids: [p.categorias || []]
                        })
                    )
                )
            });
            this.referenciasFormArray.push(itemGroup);
        });
    }

    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    getPartesFormArray(index: number): FormArray {
        const control = this.referenciasFormArray.at(index);
        if (!control) {
            return this.fb.array([]);
        }
        return control.get('partes') as FormArray;
    }

    isItemCompleto(index: number): boolean {
        const itemControl = this.referenciasFormArray.at(index);
        if (!itemControl) return false;
        const itemRef = itemControl.get('referencia_id')?.value;

        // Verificar que el ítem principal tenga referencia asignada
        const itemRefOk = !!itemRef && (typeof itemRef === 'number' ? itemRef > 0 : typeof itemRef === 'string' && itemRef.trim().length > 0);
        if (itemRefOk) return true; // Si tiene referencia principal, está completo

        const partes = this.getPartesFormArray(index);
        if (!partes || partes.length === 0) return true; // Si no hay partes, el item principal basta

        // Un ítem está completo solo si TODAS sus filas tienen referencia y
        // una categoría que coincida con nuestro catálogo de Tipos de Artículo.
        for (const control of partes.controls) {
            const ref = control.get('referencia_id')?.value;
            const catIds = control.get('categoria_ids')?.value || [];

            // Verificación de existencia real en el catálogo cargado para al menos una de las categorías seleccionadas
            const catValida = Array.isArray(catIds) && catIds.length > 0 && catIds.every((id: any) => this.tiposArticulo.some((t) => t.value === id));
            const refOk = !!ref && (typeof ref === 'number' ? ref > 0 : ref.trim().length > 0);

            if (!refOk || !catValida) {
                return false;
            }
        }

        return true;
    }

    toggleExpand(index: number): void {
        const item = this.referenciasFormArray.at(index);
        const control = item?.get('expandido');
        control?.setValue(!control.value);
    }

    private buildPayload(): any {
        const referenciasPayload: any[] = [];

        // Iteramos cada tarjeta (Requerimiento)
        this.referenciasFormArray.controls.forEach((itemControl) => {
            const itemValue = itemControl.value;
            const partes = (itemControl.get('partes') as FormArray).controls;

            // Cada fila de la tabla técnica es una PedidoReferencia en el backend
            // Es vital enviar todas las filas, tengan o no referencia_id, para que el sync del backend
            // sepa qué existe y qué debe borrarse.
            partes.forEach((parteControl) => {
                const parteValue = parteControl.value;

                const comentarioRaw = itemValue.comentario;
                const comentarioStr = typeof comentarioRaw === 'object' && comentarioRaw !== null ? JSON.stringify(comentarioRaw) : comentarioRaw || '';

                referenciasPayload.push({
                    id: parteValue.id || null,
                    referencia_id: parteValue.referencia_id || null,
                    sistema_id: itemValue.sistema_id,
                    lista_id: itemValue.lista_id, // Usar SIEMPRE el del requerimiento/tarjeta (Tipo Técnico)
                    categoria_comercial_id: parteValue.categoria, // Categoría Comercial para filtrado de proveedores
                    categoria_comercial_ids: parteValue.categoria_ids || [],
                    cantidad: parteValue.cantidad || 1,
                    definicion: itemValue.definicion,
                    comentario: comentarioStr,
                    estado: 1
                });
            });
        });

        return {
            referencias: referenciasPayload
        };
    }

    guardar(): void {
        if (this.submitting) {
            return;
        }
        this.submitting = true;
        const id = this.pedidoId();
        const changes = this.buildPayload();

        merge(
            this.actions$.pipe(
                ofType(updatePedidoSuccess),
                filter((a) => a.pedido.id === id),
                take(1)
            ),
            this.actions$.pipe(ofType(updatePedidoFailure), take(1))
        )
            .pipe(take(1))
            .subscribe((action) => {
                this.submitting = false;
                if (action.type === updatePedidoSuccess.type) {
                    const pedido = action.pedido;
                    if (pedido.referencias != null) {
                        this.cargarReferenciasAlFormArray(pedido.referencias);
                    }
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Guardado',
                        detail: 'Análisis guardado permanentemente.'
                    });
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error al guardar',
                        detail: action.error || 'No se pudo guardar el análisis.'
                    });
                }
            });

        this.store.dispatch(updatePedido({ id, changes }));
    }

    finalizar(): void {
        if (!this.puedePasarACosteo) {
            return;
        }
        // Solo para pasar a costeo: exigir referencia, categoría válida y cantidades (no aplica al botón Guardar).
        let hayIncompleto = false;
        this.referenciasFormArray.controls.forEach((item, i) => {
            if (!this.isItemCompleto(i)) {
                hayIncompleto = true;
                item.get('expandido')?.setValue(true);
            }
        });
        if (hayIncompleto) {
            this.messageService.add({
                severity: 'error',
                summary: 'Incompleto o inválido',
                detail: 'Para pasar a costeo, cada fila debe tener referencia del catálogo, categoría comercial válida y cantidad mayor a cero.'
            });
            return;
        }

        this.confirmationService.confirm({
            message: `¿Está seguro de finalizar el análisis? El pedido pasará a estado "${PEDIDO_ESTADO_ETIQUETA.En_Costeo}" y no podrá ser editado por usted.`,
            header: 'Finalizar Análisis',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: () => {
                this.finalizing = true;
                const id = this.pedidoId();

                merge(
                    this.actions$.pipe(
                        ofType(updatePedidoSuccess),
                        filter((a) => a.pedido.id === id),
                        take(1)
                    ),
                    this.actions$.pipe(ofType(updatePedidoFailure), take(1))
                )
                    .pipe(take(1))
                    .subscribe((action) => {
                        this.finalizing = false;
                        if (action.type === updatePedidoSuccess.type) {
                            const pedido = action.pedido;
                            this.messageService.add({ severity: 'success', summary: 'Pedido Finalizado', detail: 'El pedido ha sido enviado a costeo. El vendedor será notificado.' });
                            setTimeout(() => {
                                this.router.navigate(['/app/pedidos']);
                            }, 1500);
                        } else {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error al finalizar',
                                detail: action.error || 'No se pudo enviar el pedido a costeo.'
                            });
                        }
                    });

                const payload = this.buildPayload();
                this.store.dispatch(
                    updatePedido({
                        id: id,
                        changes: { ...payload, estado: 'En_Costeo' }
                    })
                );
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/app/pedidos']);
    }

    /**
     * Mostrar diálogo para confirmar devolución al vendedor
     */
    displayDevolucionDialog = false;
    devolucionComentario = '';

    confirmarDevolucion(): void {
        this.devolucionComentario = '';
        this.displayDevolucionDialog = true;
    }

    ejecutarDevolucion(): void {
        if (!this.devolucionComentario || this.devolucionComentario.trim().length < 10) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Comentario requerido',
                detail: 'Debe proporcionar un motivo de devolución (mínimo 10 caracteres)'
            });
            return;
        }

        const payload = this.buildPayload();
        this.pedidoService.devolverAVendedor(this.pedidoId(), this.devolucionComentario, payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Pedido devuelto',
                    detail: 'El pedido ha sido devuelto al vendedor para completar información'
                });
                this.displayDevolucionDialog = false;
                this.router.navigate(['/app/pedidos']);
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message ?? 'No se pudo devolver el pedido'
                });
            }
        });
    }

    maquinasList: any[] = [];

    get currentMaquinaInfo() {
        if (!this.pedidoId()) return null;
        // Buscamos la máquina en la lista o la sacamos directamente del pedido si ya viene cargada con todo
        return this.selectedMaquina;
    }

    viewMaquina(maquina: any): void {
        this.selectedMaquina = maquina;
        this.displayMaquinaDialog = true;
    }

    /**
     * Verifica si la referencia seleccionada en una parte es temporal.
     */
    isReferenciaTemporal(itemIndex: number, parteIndex: number): boolean {
        const parte = this.getPartesFormArray(itemIndex).at(parteIndex);
        const refId = parte?.get('referencia_id')?.value;
        if (!refId) return false;
        const listaId = this.referenciasFormArray.at(itemIndex)?.get('lista_id')?.value;
        const opciones = listaId ? this.referenciasPorTipo[listaId] || [] : this.referencias;
        const ref = opciones.find((r: any) => r.value === refId);
        return !!ref?.es_temporal;
    }

    // --- Lógica de Popovers Técnicos ---

    showInfo(event: MouseEvent, type: string, id: number | null, popover: Popover, itemIndex?: number): void {
        if (!id || !popover) return;

        switch (type) {
            case 'sistema':
                const sistema = this.sistemasFull.find((s) => s.id === id);
                if (sistema) {
                    this.popoverData = {
                        title: 'Sistema',
                        subtitle: sistema.nombre,
                        description: sistema.descripcion || 'Sistema mecánico o funcional asociado a este ítem de la máquina.',
                        image: this.formatImageUrl(sistema.imagen),
                        type: 'sistema'
                    };
                    popover.toggle(event);
                }
                break;
            case 'articulo':
                // El tipoId es el tipo de artículo. Buscar refs del pedido con este tipo para obtener articulo_id
                const tipoId = id;
                let articuloId: number | null = null;

                // Buscar en las referencias del formulario
                for (let i = 0; i < this.referenciasFormArray.length; i++) {
                    const item = this.referenciasFormArray.at(i);
                    if (item.get('lista_id')?.value === tipoId) {
                        // Buscar en las partes
                        const partes = this.getPartesFormArray(i);
                        for (let j = 0; j < partes.length; j++) {
                            const refId = partes.at(j).get('referencia_id')?.value;
                            if (refId) {
                                const refData = this.referencias.find((r) => r.value === refId);
                                if (refData?.articulo_id) {
                                    articuloId = refData.articulo_id;
                                    break;
                                }
                            }
                        }
                        if (!articuloId) {
                            // También revisar la referencia principal del item
                            const refId = item.get('referencia_id')?.value;
                            if (refId) {
                                const refData = this.referencias.find((r) => r.value === refId);
                                if (refData?.articulo_id) {
                                    articuloId = refData.articulo_id;
                                }
                            }
                        }
                    }
                    if (articuloId) break;
                }

                // Si tenemos articulo_id, buscar refs cruzadas e imagen del artículo
                let refsCruzadas: any[] = [];
                let fotoArticulo: string | null = null;
                let pesoArticulo: number | null = null;
                if (articuloId) {
                    // Buscar refs cruzadas
                    for (const tipoKey in this.referenciasPorTipo) {
                        const refsDelTipo = this.referenciasPorTipo[tipoKey] || [];
                        const encontradas = refsDelTipo.filter((r: any) => r.articulo_id === articuloId);
                        refsCruzadas.push(...encontradas);
                    }
                    // Buscar foto y peso del artículo en las refs (viene incluido cuando se carga la referencia)
                    const refConInfo = refsCruzadas.find((r: any) => r.articulo_imagen || r.articulo_peso !== undefined);
                    if (refConInfo) {
                        fotoArticulo = refConInfo.articulo_imagen || null;
                        pesoArticulo = refConInfo.articulo_peso ?? null;
                        if (fotoArticulo) {
                            fotoArticulo = this.formatImageUrl(fotoArticulo);
                        }
                    }
                }

                this.popoverData = {
                    title: 'Tipo de Artículo',
                    subtitle: this.getTipoNombre(tipoId),
                    description: 'Tipo de artículo comercial. refs cruzadas: ' + refsCruzadas.length,
                    image: fotoArticulo,
                    type: 'articulo',
                    peso: pesoArticulo || 0,
                    referencias_cruzadas: refsCruzadas.slice(0, 20)
                };
                popover.toggle(event);
                break;
            case 'referencia':
                // Buscar la data técnica de la referencia (artículo real)
                let refId = id;
                const idx = itemIndex;
                if (idx === undefined) return;

                const item = this.referenciasFormArray.at(idx);

                // Fallback: si no hay id de referencia en el ítem (común en manuales), usar la de la primera parte
                if (!refId) {
                    const partes = this.getPartesFormArray(idx);
                    refId = partes.at(0)?.get('referencia_id')?.value;
                }

                if (!refId) return;

                const listaId = item?.get('lista_id')?.value;

                // Búsqueda exhaustiva en catálogos
                let ref = (listaId ? this.referenciasPorTipo[listaId] || [] : []).find((r: any) => r.value === refId);

                if (!ref) {
                    ref = this.referencias.find((r: any) => r.value === refId);
                }

                if (!ref) {
                    // Buscar en cualquier otro catálogo cargado por si acaso
                    for (const catId in this.referenciasPorTipo) {
                        const found = this.referenciasPorTipo[catId].find((r: any) => r.value === refId);
                        if (found) {
                            ref = found;
                            break;
                        }
                    }
                }

                if (ref) {
                    this.popoverData = {
                        title: 'Artículo Analizado',
                        subtitle: ref.descripcion_especifica_articulo || ref.articulo_nombre,
                        standard_name: ref.definicion_articulo !== (ref.descripcion_especifica_articulo || ref.articulo_nombre) ? ref.definicion_articulo : null,
                        description: null,
                        image: this.formatImageUrl(ref.articulo_imagen),
                        type: 'articulo',
                        es_estandar: ref.es_pieza_estandar,
                        peso: ref.articulo_peso,
                        referencias_cruzadas: ref.referencias_cruzadas || []
                    };
                    popover.toggle(event);
                }
                break;
        }
    }

    hideInfo(popover: Popover): void {
        if (popover) {
            popover.hide();
        }
    }

    private formatImageUrl(url: string | null): string {
        if (!url) return 'assets/images/no-image.png';
        if (url.startsWith('http')) return url;
        return `https://heavymarket.com.co/storage/${url}`;
    }
}
