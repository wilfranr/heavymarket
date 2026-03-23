import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, take, map } from 'rxjs';

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

import { updatePedido, loadPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { Pedido, UpdatePedidoDto, PedidoEstado, PedidoReferencia } from '../../../core/models/pedido.model';
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
import { ReferenciaCreateModalComponent } from '../../../shared/components/referencia-create-modal/referencia-create-modal.component';

@Component({
    selector: 'app-pedido-analysis',
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
        InputGroupModule,
        InputGroupAddonModule,
        ReferenciaCreateModalComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './analysis.html',
    styleUrl: './analysis.scss'
})
export class AnalysisComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
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

    submitting = false;
    finalizing = false;

    // Estados para modales (si se necesitan similares a edit)
    displayMaquinaDialog = false;
    selectedMaquina: any = null;

    // Gestión de Comentarios (Replicado de Edit)
    displayComentarioDialog = false;
    comentariosItemActual: any[] = [];
    comentarioControl = new FormControl('');
    origenComentarioControl = new FormControl('');

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
    activeItemIndex = -1;
    activeParteIndex = -1;

    // Lógica de agregado en lote (similar a edit)
    displayLoteDialog = false;
    loteForm!: FormGroup;
    tiposLote: any[] = [];
    referenciasLote: any[] = [];

    ngOnInit(): void {
        this.initForm();
        this.initLoteForm();
        this.loadInitialData();
        this.loadPedido();
    }

    private initLoteForm(): void {
        this.loteForm = this.fb.group({
            sistema_id: [null, Validators.required],
            articulo_id: [{ value: null, disabled: true }, Validators.required],
            referencias_seleccionadas: [{ value: [], disabled: true }, [Validators.required, Validators.minLength(1)]],
            cantidad_lote: [1, [Validators.required, Validators.min(1)]]
        });
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
        this.sistemaService.getById(sistemaId).pipe(take(1)).subscribe({
            next: (resp) => {
                const sistema = resp.data;
                if (sistema && sistema.articulos) {
                    this.tiposLote = sistema.articulos.map((l: any) => ({ label: l.nombre, value: l.id }));
                    this.loteForm.get('articulo_id')?.enable();
                }
            }
        });
    }

    onSistemaEditChange(sistemaId: number | null): void {
        this.tiposEdit = [];
        this.itemEditForm.get('lista_id')?.setValue(null);
        
        if (!sistemaId) return;

        this.sistemaService.getById(sistemaId).pipe(take(1)).subscribe({
            next: (resp) => {
                const sistema = resp.data;
                if (sistema && sistema.articulos) {
                    this.tiposEdit = sistema.articulos.map((l: any) => ({ label: l.nombre, value: l.id }));
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
                    label: r.referencia,
                    value: r.id,
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
                const refModel = this.referenciasLote.find(r => r.value === refId);
                partes.push(this.fb.group({
                    cantidad: [cantidad_lote],
                    referencia_id: [refId],
                    descripcion: [refModel?.label || ''],
                    categoria: [articulo_id]
                }));
            });
        } else {
            // Agregar nuevos Requerimientos (Items) al Pedido
            referencias_seleccionadas.forEach((refId: number) => {
                const refModel = this.referenciasLote.find(r => r.value === refId);
                const itemForm = this.fb.group({
                    id: [null],
                    estado_item: ['Preparado'],
                    sistema_id: [sistema_id],
                    lista_id: [articulo_id],
                    referencia_id: [refId],
                    definicion: [refModel?.label || ''],
                    cantidad: [cantidad_lote],
                    comentario: [''],
                    expandido: [true],
                    partes: this.fb.array([
                        this.fb.group({
                            cantidad: [cantidad_lote, [Validators.required, Validators.min(1)]],
                            referencia_id: [refId, [Validators.required]],
                            descripcion: [refModel?.label || ''],
                            categoria: [articulo_id]
                        })
                    ])
                });
                this.referenciasFormArray.push(itemForm);
            });
        }

        this.displayLoteDialog = false;
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
            expandido: [true],
            partes: this.fb.array([
                this.fb.group({
                    cantidad: [1, [Validators.required, Validators.min(1)]],
                    referencia_id: [null, [Validators.required]],
                    descripcion: [''],
                    categoria: [null]
                })
            ])
        });
        this.referenciasFormArray.push(itemForm);
        
        // Abrir modal automáticamente para definir el nuevo ítem
        const newIndex = this.referenciasFormArray.length - 1;
        this.editItem(newIndex);
        
        this.messageService.add({ severity: 'info', summary: 'Defina el ítem', detail: 'Indique sistema y tipo para el nuevo requerimiento.' });

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
            accept: () => {
                this.referenciasFormArray.removeAt(index);
                this.messageService.add({ severity: 'warn', summary: 'Eliminado', detail: 'El requerimiento ha sido removido del pedido.' });
            }
        });
    }

    displayItemEditDialog = false;
    itemEditForm!: FormGroup;

    private initItemEditForm(): void {
        this.itemEditForm = this.fb.group({
            sistema_id: [null],
            lista_id: [null],
            cantidad: [1]
        });
    }

    referenciasPorTipo: { [tipoId: number]: any[] } = {};

    private cargarReferenciasParaTipo(tipoId: number): void {
        if (!tipoId || this.referenciasPorTipo[tipoId]) return;
        
        this.referenciaService.getAll({ articulo_id: tipoId, per_page: 500 }).subscribe({
            next: (resp) => {
                this.referenciasPorTipo[tipoId] = resp.data.map((r: any) => ({
                    label: r.referencia,
                    value: r.id,
                    articulo_id: r.articulo_id,
                    articulo_nombre: r.articulo?.nombre || ''
                }));
            }
        });
    }

    editItem(index: number): void {
        this.activeItemIndex = index;
        const item = this.referenciasFormArray.at(index);
        
        if (!this.itemEditForm) this.initItemEditForm();
        
        const sistemaId = item.get('sistema_id')?.value;
        this.onSistemaEditChange(sistemaId);

        this.itemEditForm.patchValue({
            sistema_id: sistemaId,
            lista_id: item.get('lista_id')?.value,
            cantidad: item.get('cantidad')?.value
        });
        
        this.displayItemEditDialog = true;
    }

    confirmarEdicionItem(): void {
        if (this.activeItemIndex === -1) return;
        
        const values = this.itemEditForm.value;
        const itemControl = this.referenciasFormArray.at(this.activeItemIndex);
        const currentSistema = itemControl.get('sistema_id')?.value;
        const currentLista = itemControl.get('lista_id')?.value;
        
        // Solo alertar si estamos CAMBIANDO un tipo ya definido y hay partes seleccionadas reales
        const hasPartesSeleccionadas = this.getPartesFormArray(this.activeItemIndex).controls
            .some(p => !!p.get('referencia_id')?.value);

        const isChanging = (currentSistema !== null && currentSistema !== values.sistema_id) || 
                           (currentLista !== null && currentLista !== values.lista_id);

        if (isChanging && hasPartesSeleccionadas) {
            this.confirmationService.confirm({
                message: 'Cambiar el sistema o tipo de artículo reseteará las referencias seleccionadas en este análisis. ¿Desea continuar?',
                header: 'Confirmar cambio estructural',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    this.aplicarCambiosRequerimiento(values, itemControl);
                    this.getPartesFormArray(this.activeItemIndex).clear();
                    this.messageService.add({ severity: 'warn', summary: 'Reset completo', detail: 'Se borró el análisis previo del ítem.' });
                }
            });
        } else {
            this.aplicarCambiosRequerimiento(values, itemControl);
        }
    }

    private aplicarCambiosRequerimiento(values: any, itemControl: AbstractControl): void {
        const isNew = !itemControl.get('id')?.value;
        const selectedTipo = this.tiposEdit.find(t => t.value === values.lista_id) || 
                            this.tiposArticulo.find(t => t.value === values.lista_id);

        itemControl.patchValue({
            sistema_id: values.sistema_id,
            lista_id: values.lista_id,
            cantidad: values.cantidad,
            // Actualizar definición para el banner con el nombre real del tipo
            definicion: selectedTipo?.label || 'Ítem definido'
        });
        
        if (values.lista_id) {
            this.cargarReferenciasParaTipo(values.lista_id);
        }

        const hasRef = itemControl.get('referencia_id')?.value;
        itemControl.get('estado_item')?.setValue(hasRef ? 'Preparado' : 'En proceso');

        this.displayItemEditDialog = false;
        
        const summary = isNew ? 'Ítem agregado' : 'Actualizado';
        const detail = isNew ? 'El nuevo requerimiento se ha añadido exitosamente.' : 'Los datos del requerimiento han sido actualizados.';
        
        this.messageService.add({ severity: 'success', summary, detail });
    }

    onReferenciaFilaChange(event: any, itemIndex: number, parteIndex: number): void {
        const refId = event.value;
        if (!refId) return;

        const item = this.referenciasFormArray.at(itemIndex);
        const listaId = item.get('lista_id')?.value;
        
        // Buscar en el cache de ese tipo específico
        const refObj = this.referenciasPorTipo[listaId]?.find(r => r.value === refId);
        
        const partes = this.getPartesFormArray(itemIndex);
        const parte = partes.at(parteIndex);
        
        if (refObj) {
            parte.patchValue({
                descripcion: refObj.articulo_nombre || 'Sin descripción',
                categoria: refObj.articulo_id
            });
        }
    }

    // --- MÉTODOS DE COMENTARIOS E IMÁGENES (REPLICADOS DE EDIT) ---

    abrirDialogoComentario(index: number): void {
        this.activeItemIndex = index;
        const rawComentario = this.referenciasFormArray.at(index).get('comentario')?.value;
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
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            if (!trimmed || trimmed === 'Sin comentario adicional') return [];
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.filter(c => c && typeof c.comentario === 'string').map(c => ({
                        origen: (c.origen as string) || 'Interno',
                        comentario: c.comentario as string,
                        fecha: typeof c.fecha === 'string' ? c.fecha : undefined
                    }));
                }
            } catch { /* Formato legacy */ }
            return [{ origen: 'Legacy', comentario: trimmed }];
        }
        return [];
    }

    private buildComentariosPayload(comentarios: any[]): string {
        return JSON.stringify(comentarios);
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
        if (this.activeImagenesFilaIndex === null) return [];
        const row = this.referenciasFormArray.at(this.activeImagenesFilaIndex);
        const imagen = row.get('imagen')?.value;
        const imagenes = row.get('imagenes')?.value || [];
        const out: any[] = [];
        const seen = new Set();

        imagenes.forEach((img: any) => {
            const url = typeof img.imagen === 'string' ? img.imagen : (img.imagen?.url ?? img.imagen);
            if (url && !seen.has(url)) {
                seen.add(url);
                out.push({ itemImageSrc: url, thumbnailImageSrc: url, origen: img.origen });
            }
        });
        if (imagen) {
            const url = typeof imagen === 'string' ? imagen : (imagen?.url ?? imagen);
            if (url && !seen.has(url)) {
                out.unshift({ itemImageSrc: url, thumbnailImageSrc: url, origen: 'Original' });
            }
        }
        return out;
    }

    abrirCrearReferencia(itemIndex: number, parteIndex: number): void {
        this.activeItemIndex = itemIndex;
        this.activeParteIndex = parteIndex;
        this.showReferenciaModal = true;
    }

    onReferenciaCreada(nuevaRef: any): void {
        // Recargar la lista de referencias
        this.loadReferencias();
        
        // Asignar al formulario si hay un índice activo
        if (this.activeItemIndex !== -1 && this.activeParteIndex !== -1) {
            const partes = this.getPartesFormArray(this.activeItemIndex);
            partes.at(this.activeParteIndex).get('referencia_id')?.setValue(nuevaRef.id);
        }
        
        this.showReferenciaModal = false;
        this.activeItemIndex = -1;
        this.activeParteIndex = -1;
        
        this.messageService.add({ severity: 'success', summary: 'Referencia Creada', detail: `La referencia ${nuevaRef.referencia} ha sido creada y asignada.` });
    }

    private loadReferencias(): void {
        this.referenciaService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                this.referencias = response.data.map((r: any) => ({
                    label: r.referencia,
                    value: r.id,
                    descripcion: r.descripcion
                }));
            }
        });
    }

    private initForm(): void {
        this.pedidoForm = this.fb.group({
            referencias: this.fb.array([])
        });
    }

    addParte(index: number): void {
        const partes = this.getPartesFormArray(index);
        partes.push(this.fb.group({
            cantidad: [1, [Validators.required, Validators.min(1)]],
            referencia_id: [null, [Validators.required]],
            descripcion: [''],
            categoria: [null]
        }));
    }

    removeParte(itemIndex: number, parteIndex: number): void {
        const partes = this.getPartesFormArray(itemIndex);
        if (partes.length > 1) {
            partes.removeAt(parteIndex);
        }
    }

    private loadInitialData(): void {
        // Cargar sistemas
        this.sistemaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.sistemas = response.data.map((s) => ({
                    label: s.nombre,
                    value: s.id
                }));
            }
        });

        // Cargar tipos de artículo (Listas)
        this.listaService.getByTipo('Tipo de Artículo').subscribe({
            next: (listas) => {
                this.tiposArticulo = listas.map((l) => ({
                    label: l.nombre,
                    value: l.id
                }));
            }
        });

        // Cargar referencias para el selector
        this.loadReferencias();
    }

    getSistemaNombre(id: number | null): string {
        if (!id) return 'Sin sistema';
        return this.sistemas.find(s => s.value === id)?.label || 'Sistema desconocido';
    }

    getTipoNombre(id: number | null): string {
        if (!id) return 'Sin tipo';
        // Buscar en tiposEdit (modal actual) y luego en tiposArticulo (cache global)
        const tipo = (this.tiposEdit || []).find(t => t.value === id) || 
                     (this.tiposArticulo || []).find(t => t.value === id);
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

            this.pedido$.pipe(
                filter(p => !!p),
                take(1)
            ).subscribe(pedido => {
                if (pedido && pedido.referencias) {
                    this.cargarReferenciasAlFormArray(pedido.referencias);
                    // Pre-cargar catálogos por cada tipo de artículo único
                    pedido.referencias.forEach(r => {
                        if (r.lista_id) this.cargarReferenciasParaTipo(r.lista_id);
                    });
                }
            });
        }
    }

    private cargarReferenciasAlFormArray(referencias: PedidoReferencia[]): void {
        this.referenciasFormArray.clear();
        
        // Agrupar las referencias por lista_id (el concepto/requerimiento) y sistema_id
        // Esto permite que el backend (lista plana) se vea como tarjetas agrupadas en el frontend
        const grupos: { [key: string]: any } = {};

        referencias.forEach(r => {
            // Clave única por requerimiento: sistema + tipo + descripcion (opcional para diferenciar ítems manuales similares)
            const key = `${r.sistema_id}_${r.lista_id}_${r.definicion}`;
            
            if (!grupos[key]) {
                grupos[key] = {
                    sistema_id: r.sistema_id,
                    lista_id: r.lista_id,
                    definicion: r.definicion || r.lista?.nombre || 'Sin definición',
                    cantidad: r.cantidad,
                    comentario: r.comentario,
                    partes: []
                };
            }
            
            // Añadir esta referencia técnica como una fila dentro de la tarjeta
            grupos[key].partes.push({
                id: r.id,
                referencia_id: r.referencia_id,
                cantidad: r.cantidad,
                descripcion: r.referencia?.referencia || r.definicion,
                categoria: r.lista_id
            });
        });

        // Poblar el formulario con los grupos procesados
        Object.values(grupos).forEach(g => {
            const itemGroup = this.fb.group({
                id: [null], // El ID es individual por parte, no por tarjeta
                estado_item: ['Procesado'],
                sistema_id: [g.sistema_id],
                lista_id: [g.lista_id],
                definicion: [g.definicion],
                cantidad: [g.cantidad],
                comentario: [g.comentario],
                expandido: [true],
                partes: this.fb.array(g.partes.map((p: any) => this.fb.group({
                    id: [p.id],
                    referencia_id: [p.referencia_id || null, [Validators.required]],
                    cantidad: [p.cantidad || 1, [Validators.required, Validators.min(1)]],
                    descripcion: [p.descripcion || ''],
                    categoria: [p.categoria || null]
                })))
            });
            this.referenciasFormArray.push(itemGroup);
        });
    }

    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    getPartesFormArray(index: number): FormArray {
        return this.referenciasFormArray.at(index).get('partes') as FormArray;
    }

    toggleExpand(index: number): void {
        const control = this.referenciasFormArray.at(index).get('expandido');
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
                
                referenciasPayload.push({
                    id: parteValue.id || null, 
                    referencia_id: parteValue.referencia_id || null,
                    sistema_id: itemValue.sistema_id,
                    lista_id: itemValue.lista_id,
                    cantidad: parteValue.cantidad || 1,
                    definicion: itemValue.definicion,
                    comentario: itemValue.comentario,
                    estado: 1 
                });
            });
        });

        return {
            referencias: referenciasPayload
        };
    }

    guardar(): void {
        this.submitting = true;
        const changes = this.buildPayload();
        
        this.store.dispatch(updatePedido({ 
            id: this.pedidoId(), 
            changes: changes 
        }));

        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Análisis guardado permanentemente.' });
        
        setTimeout(() => {
            this.submitting = false;
        }, 1000);
    }

    finalizar(): void {
        // Validar que el formulario sea válido (esto incluye las cantidades > 0 y referencias seleccionadas)
        if (this.pedidoForm.invalid) {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Incompleto o Inválido', 
                detail: 'Por favor, asegúrese de que todos los artículos tengan una referencia asignada y que las cantidades sean mayores a cero.' 
            });
            
            // Expandir los items con errores para facilitar la corrección
            this.referenciasFormArray.controls.forEach(item => {
                const partes = item.get('partes') as FormArray;
                if (partes.invalid) {
                    item.get('expandido')?.setValue(true);
                }
            });
            return;
        }

        this.confirmationService.confirm({
            message: '¿Está seguro de finalizar el análisis? El pedido pasará a estado "En Costeo" y no podrá ser editado por usted.',
            header: 'Finalizar Análisis',
            icon: 'pi pi-check-circle',
            accept: () => {
                this.finalizing = true;
                this.store.dispatch(updatePedido({ 
                    id: this.pedidoId(), 
                    changes: { estado: 'En_Costeo' } 
                }));
                
                setTimeout(() => {
                    this.messageService.add({ severity: 'success', summary: 'Pedido Finalizado', detail: 'El pedido ha sido enviado a costeo exitosamente' });
                    this.router.navigate(['/app/pedidos']);
                }, 1000);
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/app/pedidos']);
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
}
