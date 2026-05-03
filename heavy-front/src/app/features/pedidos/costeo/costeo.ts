import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, take } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { SkeletonModule } from 'primeng/skeleton';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DialogModule } from 'primeng/dialog';
import { GalleriaModule } from 'primeng/galleria';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PopoverModule, Popover } from 'primeng/popover';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PedidoService } from '../../../core/services/pedido.service';

import { loadPedido, loadPedidoSuccess } from '../../../store/pedidos/actions/pedidos.actions';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { Pedido, PedidoEstado } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import { TerceroService } from '../../../core/services/tercero.service';
import { Tercero } from '../../../core/models/tercero.model';
import { TRMService } from '../../../core/services/trm.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { TerceroCreateModalComponent } from '../../../shared/components/tercero-create-modal/tercero-create-modal.component';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';

@Component({
    selector: 'app-pedido-costeo',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        CheckboxModule,
        TooltipModule,
        MultiSelectModule,
        SkeletonModule,
        InputGroupModule,
        InputGroupAddonModule,
        DialogModule,
        GalleriaModule,
        TextareaModule,
        ConfirmDialogModule,
        PopoverModule,
        ToggleSwitchModule,
        TerceroCreateModalComponent,
        ListaCreateModalComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './costeo.html',
    styleUrl: '../edit/edit.scss' // Reusing edit styles
})
export class CosteoComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly confirmationService = inject(ConfirmationService);
    private readonly pedidoService = inject(PedidoService);
    private readonly terceroService = inject(TerceroService);
    private readonly trmService = inject(TRMService);
    private readonly empresaService = inject(EmpresaService);
    private readonly listaService = inject(ListaService);
    private readonly cotizacionService = inject(CotizacionService);

    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;

    pedidoId = signal<number>(0);
    pedido = signal<Pedido | null>(null);
    loading = signal<boolean>(false);
    
    estadoActual = signal<PedidoEstado>('En_Costeo');
    trmCargada = signal<number>(0);
    fleteCargado = signal<number>(0);
    
    // Devolución
    displayDevolucionDialog = signal<boolean>(false);
    devolucionComentario = signal<string>('');
    submitting = signal<boolean>(false);
    
    // Formulario principal
    costeoForm!: FormGroup;

    // Modales de creación
    showTerceroModal = signal<boolean>(false);
    showMarcaModal = signal<boolean>(false);
    activeRefIndex = signal<number>(-1);
    activeProvIndex = signal<number>(-1);
    expandedRefIndices = signal<Set<number>>(new Set([0])); // Por defecto el primero expandido
    
    // Popover info
    popoverData: any = {
        title: '',
        subtitle: '',
        description: '',
        image: null,
        type: '',
        es_estandar: false,
        peso: 0,
        referencias_cruzadas: []
    };
    
    // Imágenes y Comentarios
    displayGallery = false;
    displayComentarioDialog = false;
    selectedItemIndex = -1;
    activeIndexGallery = 0;
    galleriaImagesArray: any[] = [];
    comentariosItemActual: any[] = [];
    galleriaResponsiveOptions: any[] = [
        { breakpoint: '1024px', numVisible: 5 },
        { breakpoint: '768px', numVisible: 3 },
        { breakpoint: '560px', numVisible: 1 }
    ];
    
    // Datos maestros
    proveedores = signal<any[]>([]);
    proveedoresCompletos = signal<Tercero[]>([]);
    marcas = signal<any[]>([]);
    entregas = signal<any[]>([
        { label: 'Inmediato', value: '0' },
        { label: '1 - 3 días', value: '3' },
        { label: '5 - 7 días', value: '7' },
        { label: '15 días', value: '15' },
        { label: '30+ días', value: '30' }
    ]);

    ngOnInit(): void {
        this.initForm();
        this.loadPedido();
        this.loadTRM();
        this.loadEmpresaConfig();
        this.loadMarcas();
    }

    private loadMarcas(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (marcas: Lista[]) => {
                this.marcas.set(marcas.map((m: Lista) => ({
                    label: m.nombre,
                    value: m.id
                })));
            }
        });
    }

    private loadProveedores(): void {
        this.terceroService.getProveedores({ per_page: 1000 }).subscribe({
            next: (resp) => {
                this.proveedoresCompletos.set(resp.data);
                this.proveedores.set(resp.data.map(p => ({
                    label: p.nombre,
                    value: p.id
                })));
            }
        });
    }

    private loadTRM(): void {
        this.trmService.getLatest().subscribe({
            next: (resp) => {
                this.trmCargada.set(resp.data.trm);
                this.messageService.add({ severity: 'info', summary: 'TRM Actualizada', detail: `Se está usando una TRM de $${this.trmCargada().toLocaleString()}` });
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error TRM', detail: 'No se pudo cargar la TRM actual. Los cálculos podrían ser incorrectos.' });
            }
        });
    }

    private loadEmpresaConfig(): void {
        this.empresaService.getAll().subscribe({
            next: (resp) => {
                if (resp.data.length > 0) {
                    this.fleteCargado.set(resp.data[0].flete || 0);
                }
            }
        });
    }

    private initForm(): void {
        this.costeoForm = this.fb.group({
            referencias: this.fb.array([])
        });
    }

    get referenciasFormArray() {
        return this.costeoForm.get('referencias') as FormArray;
    }
    
    getProveedoresParaReferencia(refIndex: number) {
        return (this.referenciasFormArray.at(refIndex).get('proveedores') as FormArray).controls;
    }

    private loadPedido(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const parsedId = parseInt(id, 10);
            this.pedidoId.set(parsedId);
            this.store.dispatch(loadPedido({ id: parsedId }));
            
            this.store.select(selectPedidosLoading).subscribe(l => this.loading.set(l));

            // Sincronizar carga de pedido y proveedores para evitar condiciones de carrera
            import('rxjs').then(({ combineLatest }) => {
                combineLatest([
                    this.store.select(selectPedidoById(parsedId)).pipe(filter((pedido) => !!pedido && pedido.referencias !== undefined)),
                    this.terceroService.getProveedores({ per_page: 1000 })
                ]).pipe(take(1)).subscribe(([pedido, providersResp]) => {
                    this.proveedoresCompletos.set(providersResp.data);
                    this.proveedores.set(providersResp.data.map(p => ({
                        label: p.nombre,
                        value: p.id
                    })));
                    
                    if (pedido) {
                        this.pedido.set(pedido);
                        this.estadoActual.set(pedido.estado);
                        this.poblarFormulario(pedido);
                    }
                });
            });
        }
    }

    private poblarFormulario(pedido: Pedido): void {
        this.referenciasFormArray.clear();
        
        if (pedido.referencias && pedido.referencias.length > 0) {
            pedido.referencias.forEach((ref, refIdx) => {
                const refFormGroup = this.fb.group({
                    id: [ref.id],
                    sistema_id: [ref.sistema_id],
                    lista_id: [ref.lista_id],
                    sistema_nombre: [ref.sistema?.nombre || 'Sin Sistema'],
                    definicion: [ref.definicion || ref.referencia?.articulo?.definicion || 'Sin Definición'],
                    referencia_codigo: [ref.referencia?.referencia || 'N/A'],
                    cantidad: [ref.cantidad || 1],
                    referencia_id: [ref.referencia_id],
                    categoria_nombre: [ref.lista?.nombre || 'General'],
                    categoria_comercial_nombre: [ref.categoria_comercial?.nombre || 'Sin Categoría'],
                    categoria_comercial_id: [ref.categoria_comercial_id],
                    marca_nombre: [ref.marca?.nombre || (ref.referencia as any)?.marca?.nombre || 'Sin Marca'],
                    peso: [ref.referencia?.articulo?.peso || 0],
                    estado_str: ['Preparado'], 
                    imagen: [ref.imagen || null],
                    imagenes: [ref.imagenes || []],
                    descripcion_especifica: [ref.referencia?.articulo?.descripcionEspecifica || 'Sin descripción adicional'],
                    sistema_imagen: [ref.sistema?.imagen || null],
                    sistema_descripcion: [ref.sistema?.descripcion || 'Sistema mecánico o funcional asociado a este ítem de la máquina.'],
                    es_estandar: [ref.referencia?.articulo?.es_pieza_estandar || (ref.referencia as any)?.articulo_es_pieza_estandar || false],
                    articulo_peso: [ref.referencia?.articulo?.peso || 0],
                    articulo_definicion: [ref.referencia?.articulo?.definicion || null],
                    referencias_cruzadas: [ref.referencia?.articulo?.referencias_cruzadas || ref.referencia?.articulo?.referencias || []],
                    articulo_imagen: [ref.referencia?.articulo?.fotoDescriptiva || null],
                    mostrar_referencia: [true],
                    proveedores: this.fb.array(ref.proveedores && ref.proveedores.length > 0 
                        ? ref.proveedores.map(prov => this.crearProveedorFormGroup(prov)) 
                        : [this.crearProveedorFormGroup()])
                });
                
                const proveedoresArray = refFormGroup.get('proveedores') as FormArray;

                // SUGERENCIA: Solo cargar proveedores sugeridos si la referencia NO tiene proveedores en la base de datos
                const tieneProveedoresEnDB = ref.proveedores && ref.proveedores.length > 0;
                
                if (!tieneProveedoresEnDB && this.proveedoresCompletos().length > 0 && ref.referencia?.marca_id && ref.lista_id) {
                    const coincidentes = this.proveedoresCompletos().filter(p => {
                        const tieneFabricante = p.fabricante_ids?.length === 0 || p.fabricante_ids?.some(id => Number(id) === Number(ref.referencia?.marca_id));
                        const tieneCategoria = p.categoria_comercial_ids?.some(id => Number(id) === Number(ref.lista_id));
                        return tieneFabricante && tieneCategoria;
                    });

                    coincidentes.forEach(p => {
                        this.agregarProveedorFila(proveedoresArray, { proveedor_id: p.id });
                    });
                }

                // Si después de todo no hay filas, añadir una vacía
                if (proveedoresArray.length === 0) {
                    this.agregarProveedorVacio(proveedoresArray);
                }
                
                this.referenciasFormArray.push(refFormGroup);
            });
        }
    }

    getProveedoresFiltrados(refIndex: number): any[] {
        const refGroup = this.referenciasFormArray.at(refIndex);
        if (!refGroup) return this.proveedores();
        
        const marcaId = refGroup.get('marca_id')?.value || this.pedido()?.referencias?.[refIndex]?.referencia?.marca_id;
        const categoriaComercialId = refGroup.get('categoria_comercial_id')?.value;
        
        if (!marcaId || !categoriaComercialId) return this.proveedores();

        return this.proveedoresCompletos()
            .filter(p => {
                const tieneFabricante = p.fabricante_ids?.length === 0 || p.fabricante_ids?.some(id => Number(id) === Number(marcaId));
                const tieneCategoria = p.categoria_comercial_ids?.some(id => Number(id) === Number(categoriaComercialId));
                return tieneFabricante && tieneCategoria;
            })
            .map(p => ({
                label: p.nombre,
                value: p.id
            }));
    }

    agregarProveedorListado(refIndex: number): void {
        const proveedoresArray = this.referenciasFormArray.at(refIndex).get('proveedores') as FormArray;
        this.agregarProveedorVacio(proveedoresArray);
    }
    
    eliminarProveedor(refIndex: number, provIndex: number): void {
        const proveedoresArray = this.referenciasFormArray.at(refIndex).get('proveedores') as FormArray;
        proveedoresArray.removeAt(provIndex);
    }

    getEstadoClase(estado: PedidoEstado): string {
        return pedidoEstadoTagClass(estado);
    }

    // --- Imágenes y Galería ---
    openGallery(index: number): void {
        const row = this.referenciasFormArray.at(index);
        const imagen = row.get('imagen')?.value;
        const imagenes = row.get('imagenes')?.value || [];
        
        if (!imagen && imagenes.length === 0) return;

        this.selectedItemIndex = index;
        this.activeIndexGallery = 0;
        this.updateGalleriaImages(index);
        this.displayGallery = true;
    }

    private updateGalleriaImages(index: number): void {
        const row = this.referenciasFormArray.at(index);
        const imagen = row.get('imagen')?.value;
        const imagenes = row.get('imagenes')?.value || [];

        const mapped: any[] = [];
        
        // Imagen principal (legacy)
        if (imagen) {
            const src = this.formatImageUrl(imagen);
            mapped.push({
                itemImageSrc: src,
                thumbnailImageSrc: src,
                alt: 'Imagen Principal',
                title: 'Principal',
                origen: 'Legacy'
            });
        }

        // Imágenes adicionales
        imagenes.forEach((img: any) => {
            const src = this.formatImageUrl(img.imagen);
            mapped.push({
                itemImageSrc: src,
                thumbnailImageSrc: src,
                alt: 'Imagen adicional',
                title: img.origen || 'Adicional',
                origen: img.origen
            });
        });

        this.galleriaImagesArray = mapped;
    }

    getImagenesCount(index: number): number {
        const row = this.referenciasFormArray.at(index);
        const imagen = row.get('imagen')?.value;
        const imagenes = row.get('imagenes')?.value || [];
        return (imagen ? 1 : 0) + imagenes.length;
    }

    // --- Comentarios ---
    abrirDialogoComentario(refIndex: number): void {
        const refGroup = this.referenciasFormArray.at(refIndex);
        this.comentariosItemActual = refGroup.get('comentarios')?.value || [];
        this.displayComentarioDialog = true;
    }

    // --- Popover y Expansión ---
    
    isExpanded(index: number): boolean {
        return this.expandedRefIndices().has(index);
    }

    toggleExpand(index: number): void {
        const current = new Set(this.expandedRefIndices());
        if (current.has(index)) {
            current.delete(index);
        } else {
            current.add(index);
        }
        this.expandedRefIndices.set(current);
    }

    showInfo(event: any, type: 'sistema' | 'articulo' | 'referencia', refIndex: number, op: Popover): void {
        const refGroup = this.referenciasFormArray.at(refIndex);
        
        switch(type) {
            case 'sistema':
                this.popoverData = {
                    title: 'Sistema',
                    subtitle: refGroup.get('sistema_nombre')?.value,
                    description: refGroup.get('sistema_descripcion')?.value,
                    image: this.formatImageUrl(refGroup.get('sistema_imagen')?.value)
                };
                break;
            case 'articulo':
                const defOriginal = refGroup.get('articulo_definicion')?.value;
                const descEsp = refGroup.get('descripcion_especifica')?.value;
                this.popoverData = {
                    title: 'Artículo',
                    subtitle: descEsp || defOriginal,
                    standard_name: defOriginal !== descEsp ? defOriginal : null,
                    description: null, // Ya no necesitamos descripción duplicada
                    image: this.formatImageUrl(refGroup.get('articulo_imagen')?.value),
                    type: 'articulo',
                    es_estandar: refGroup.get('es_estandar')?.value,
                    peso: refGroup.get('articulo_peso')?.value,
                    referencias_cruzadas: refGroup.get('referencias_cruzadas')?.value || []
                };
                break;
            case 'referencia':
                this.popoverData = {
                    title: 'Referencia',
                    subtitle: refGroup.get('referencia_codigo')?.value,
                    brand: refGroup.get('marca_nombre')?.value,
                    category: refGroup.get('categoria_nombre')?.value,
                    commercial_category: refGroup.get('categoria_comercial_nombre')?.value,
                    description: 'Código de parte específico para esta pieza.',
                    image: this.formatImageUrl(refGroup.get('imagen')?.value),
                    type: 'referencia'
                };
                break;
        }
        
        op.toggle(event);
    }

    private formatImageUrl(url: string | null): string | null {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `/storage/${url.replace(/^\/+/, '')}`;
    }

    private crearProveedorFormGroup(data?: any): FormGroup {
        const proveedorId = data?.tercero_id || data?.proveedor_id || null;
        
        // Determinar si es nacional para ubicar el costo en el campo correcto
        // Prioridad 1: Usar el campo 'ubicacion' que ya viene en los datos (más confiable)
        // Prioridad 2: Buscar en la lista de proveedores cargada
        let esNacional = data?.ubicacion === 'Nacional';
        
        if (!data?.ubicacion && proveedorId && this.proveedoresCompletos().length > 0) {
            const proveedor = this.proveedoresCompletos().find(p => p.id === proveedorId);
            esNacional = proveedor?.country?.iso2 === 'CO' || 
                         proveedor?.country?.name?.toLowerCase().includes('colombia') || 
                         proveedor?.country_id === 48 || 
                         proveedor?.country?.id === 48;
        }

        return this.fb.group({
            id: [data?.id || null],
            // El backend devuelve 'estado' para indicar si está seleccionado
            seleccionado: [data?.seleccionado || data?.estado === 1 || data?.estado === true || false],
            proveedor_id: [proveedorId],
            marca_id: [data?.marca_id || null],
            // PrimeNG Select requiere string si los valores en las opciones son strings
            entrega: [data?.dias_entrega !== undefined ? String(data.dias_entrega) : '0'],
            costo_usd: [{ value: !esNacional ? (data?.costo_unidad || 0) : 0, disabled: esNacional }],
            costo_cop: [{ value: esNacional ? (data?.costo_unidad || 0) : 0, disabled: !esNacional }],
            ubicacion: [esNacional ? 'Nacional' : 'Internacional'],
            utilidad: [data?.utilidad || 0],
            venta: [data?.valor_unidad || 0],
            cantidad: [data?.cantidad || 1]
        });
    }

    agregarProveedorFila(formArray: FormArray, data?: any): void {
        formArray.push(this.crearProveedorFormGroup(data));
    }

    agregarProveedorVacio(formArray: FormArray): void {
        this.agregarProveedorFila(formArray);
    }

    private parseComentariosRaw(raw: string): any[] {
        if (!raw) return [];
        try {
            // Intentar parsear si es JSON
            if (raw.startsWith('[') || raw.startsWith('{')) {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [parsed];
            }
        } catch (e) {
            // Si falla, tratar como texto plano
        }
        
        // Si no es JSON, dividir por separadores comunes o tratar como uno solo
        return [{ comentario: raw, origen: 'Vendedor', fecha: new Date() }];
    }

    getComentariosCount(index: number): number {
        const row = this.referenciasFormArray.at(index);
        const raw = row.get('comentario')?.value || '';
        return this.parseComentariosRaw(raw).length;
    }

    // --- Métodos de creación ---
    openCreateProveedor(refIndex: number, provIndex: number): void {
        this.activeRefIndex.set(refIndex);
        this.activeProvIndex.set(provIndex);
        this.showTerceroModal.set(true);
    }

    onProveedorCreated(tercero: any): void {
        if (this.activeRefIndex() !== -1 && this.activeProvIndex() !== -1) {
            this.terceroService.getProveedores({ per_page: 1000 }).subscribe({
                next: (resp) => {
                    this.proveedoresCompletos.set(resp.data);
                    this.proveedores.set(resp.data.map(p => ({
                        label: p.nombre,
                        value: p.id
                    })));
                    
                    const proveedoresArray = this.referenciasFormArray.at(this.activeRefIndex()).get('proveedores') as FormArray;
                    const provGroup = proveedoresArray.at(this.activeProvIndex()) as FormGroup;
                    
                    provGroup.patchValue({ proveedor_id: tercero.id });
                    this.onProveedorChange(this.activeRefIndex(), this.activeProvIndex());
                }
            });
        }
    }

    openCreateMarca(refIndex: number, provIndex: number): void {
        this.activeRefIndex.set(refIndex);
        this.activeProvIndex.set(provIndex);
        this.showMarcaModal.set(true);
    }

    onMarcaCreated(marca: any): void {
        if (this.activeRefIndex() !== -1 && this.activeProvIndex() !== -1) {
            this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
                next: (marcas: Lista[]) => {
                    this.marcas.set(marcas.map((m: Lista) => ({
                        label: m.nombre,
                        value: m.id
                    })));
                    
                    const proveedoresArray = this.referenciasFormArray.at(this.activeRefIndex()).get('proveedores') as FormArray;
                    const provGroup = proveedoresArray.at(this.activeProvIndex()) as FormGroup;
                    provGroup.patchValue({ marca_id: marca.id });
                }
            });
        }
    }

    onProveedorChange(refIndex: number, provIndex: number): void {
        const proveedoresArray = this.referenciasFormArray.at(refIndex).get('proveedores') as FormArray;
        const provGroup = proveedoresArray.at(provIndex) as FormGroup;
        const proveedorId = provGroup.get('proveedor_id')?.value;

        if (!proveedorId) {
            provGroup.get('costo_usd')?.enable();
            provGroup.get('costo_cop')?.enable();
            return;
        }

        const proveedor = this.proveedoresCompletos().find(p => p.id === proveedorId);
        if (!proveedor) return;

        // Validar país (Colombia = ID 48, ISO 'CO' o Nombre 'Colombia')
        const esNacional = proveedor.country?.iso2 === 'CO' || 
                          proveedor.country?.name?.toLowerCase().includes('colombia') || 
                          proveedor.country_id === 48 || 
                          proveedor.country?.id === 48;

        if (esNacional) {
            // Proveedor Nacional: Deshabilitar USD, habilitar COP
            const valorActualUSD = provGroup.get('costo_usd')?.value;
            const valorActualCOP = provGroup.get('costo_cop')?.value;

            provGroup.get('ubicacion')?.setValue('Nacional', { emitEvent: false });
            provGroup.get('costo_usd')?.disable();
            provGroup.get('costo_usd')?.setValue(0, { emitEvent: false });
            provGroup.get('costo_cop')?.enable();
            
            // Si hay un valor en USD y COP está en 0, lo movemos (posible carga inicial o cambio manual)
            if (valorActualUSD > 0 && (valorActualCOP === 0 || valorActualCOP === null)) {
                provGroup.get('costo_cop')?.setValue(valorActualUSD, { emitEvent: false });
            }
        } else {
            // Proveedor Internacional: Deshabilitar COP, habilitar USD
            const valorActualUSD = provGroup.get('costo_usd')?.value;
            const valorActualCOP = provGroup.get('costo_cop')?.value;

            provGroup.get('ubicacion')?.setValue('Internacional', { emitEvent: false });
            provGroup.get('costo_cop')?.disable();
            provGroup.get('costo_cop')?.setValue(0, { emitEvent: false });
            provGroup.get('costo_usd')?.enable();

            // Si hay un valor en COP y USD está en 0, lo movemos
            if (valorActualCOP > 0 && (valorActualUSD === 0 || valorActualUSD === null)) {
                provGroup.get('costo_usd')?.setValue(valorActualCOP, { emitEvent: false });
            }
        }

        this.calcularFila(refIndex, provIndex);
    }

    calcularFila(refIndex: number, provIndex: number): void {
        const proveedoresArray = this.referenciasFormArray.at(refIndex).get('proveedores') as FormArray;
        const provGroup = proveedoresArray.at(provIndex) as FormGroup;
        
        const costoUSD = Math.max(0, provGroup.get('costo_usd')?.value || 0);
        const costoCOP = Math.max(0, provGroup.get('costo_cop')?.value || 0);
        const utilidad = Math.max(0, provGroup.get('utilidad')?.value || 0);
        const proveedorId = provGroup.get('proveedor_id')?.value;
        const pesoGramos = this.referenciasFormArray.at(refIndex).get('peso')?.value || 0;

        if (!this.trmCargada()) return;

        let finalValorUnidadCOP = 0;

        if (proveedorId) {
            const proveedor = this.proveedoresCompletos().find((p: any) => p.id === proveedorId);
            const esNacional = proveedor?.country?.iso2 === 'CO' || 
                              proveedor?.country?.name?.toLowerCase().includes('colombia') || 
                              proveedor?.country_id === 48 || 
                              proveedor?.country?.id === 48;

            if (esNacional) {
                // FÓRMULA NACIONAL:
                // 1. valor_unidad = costo_unidad + (costo_unidad * utilidad / 100)
                // 2. Redondear al entero más cercano
                const vUnidad = costoCOP + (costoCOP * utilidad / 100);
                finalValorUnidadCOP = Math.round(vUnidad);
                
                // Actualizar USD informativo
                const calculatedUSD = costoCOP / this.trmCargada();
                provGroup.get('costo_usd')?.patchValue(parseFloat(calculatedUSD.toFixed(2)), { emitEvent: false });
            } else {
                // FÓRMULA INTERNACIONAL:
                // 1. peso_en_libras = peso_gramos / 453.59
                // 2. costo_base_usd = (peso_en_libras * flete) + costo_unidad
                // 3. costo_base_cop = costo_base_usd * trm
                // 4. valor_unidad = round(costo_base_cop + (utilidad * costo_base_cop / 100) / 100) * 100 (centenas)
                
                const pesoLibras = pesoGramos / 453.59;
                const costoBaseUSD = (pesoLibras * this.fleteCargado()) + costoUSD;
                const costoBaseCOP = costoBaseUSD * this.trmCargada();
                const vUnidad = costoBaseCOP + (utilidad * costoBaseCOP / 100);
                
                // Redondear a centenas
                finalValorUnidadCOP = Math.round(vUnidad / 100) * 100;
                
                // Actualizar COP informativo (basado en costo base o solo costo unidad?)
                // El usuario dice "costo_base_cop", lo usaremos para valor_unidad.
                // Mantendremos el costo_cop del input solo como referencia del costo_unidad_usd * trm
                provGroup.get('costo_cop')?.patchValue(Math.round(costoUSD * this.trmCargada()), { emitEvent: false });
            }
        } else {
            // Sin proveedor, cálculo simple de markup
            const baseCOP = costoCOP || (costoUSD * this.trmCargada());
            finalValorUnidadCOP = Math.round(baseCOP + (baseCOP * utilidad / 100));
        }

        // El valor_unidad ya incluye la utilidad según las fórmulas de arriba
        provGroup.get('venta')?.patchValue(finalValorUnidadCOP, { emitEvent: false });
    }

    calcularSubtotal(): number {
        let total = 0;
        this.referenciasFormArray.controls.forEach((ref) => {
            const proveedores = (ref.get('proveedores') as FormArray).controls;
            proveedores.forEach((prov) => {
                if (prov.get('seleccionado')?.value) {
                    const venta = prov.get('venta')?.value || 0;
                    const cantidad = prov.get('cantidad')?.value || 0;
                    total += (venta * cantidad);
                }
            });
        });
        return total;
    }

    private getCosteoPayload(): any {
        return {
            referencias: this.referenciasFormArray.getRawValue().map((ref: any) => ({
                id: ref.id,
                proveedores: (ref.proveedores || [])
                    .filter((prov: any) => prov.proveedor_id)
                    .map((prov: any) => ({
                        id: prov.id,
                        proveedor_id: prov.proveedor_id,
                        marca_id: prov.marca_id,
                        dias_entrega: parseInt(prov.entrega, 10) || 0,
                        costo_unidad: prov.ubicacion === 'Nacional' ? (prov.costo_cop || 0) : (prov.costo_usd || 0),
                        utilidad: prov.utilidad || 0,
                        cantidad: prov.cantidad || 1,
                        seleccionado: !!prov.seleccionado
                    }))
            }))
        };
    }

    guardarCosteo(): void {
        const payload = this.getCosteoPayload();

        this.submitting.set(true);
        this.pedidoService.guardarCosteo(this.pedidoId(), payload).subscribe({
            next: (resp: any) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Costeo guardado exitosamente.' });
                
                if (resp.data) {
                    this.store.dispatch(loadPedidoSuccess({ pedido: resp.data }));
                }
            },
            error: (err: any) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo guardar el costeo' });
            }
        });
    }
    
    finalizarCosteo(): void {
        // 1. Verificar que haya al menos un item seleccionado (con o sin ID)
        const hasSelection = this.referenciasFormArray.controls.some(ref => {
            const proveedores = (ref.get('proveedores') as FormArray).controls;
            return proveedores.some(prov => prov.get('seleccionado')?.value);
        });

        if (!hasSelection) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Atención', 
                detail: 'Debe seleccionar al menos un proveedor (check) para generar la cotización.' 
            });
            return;
        }

        // 2. Confirmación
        this.confirmationService.confirm({
            message: `¿Está seguro de finalizar el costeo y generar la cotización? Se guardarán los cambios actuales automáticamente.`,
            header: 'Confirmar Finalización',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.guardarYGenerarCotizacion();
            }
        });
    }

    private guardarYGenerarCotizacion(): void {
        this.submitting.set(true);
        const payload = this.getCosteoPayload();
        
        // Paso 1: Guardado automático para asegurar que todo tenga ID en la DB
        this.pedidoService.guardarCosteo(this.pedidoId(), payload).subscribe({
            next: (resp: any) => {
                const pedidoActualizado = resp.data;
                const selectedItems: { id: number; mostrar_referencia: boolean }[] = [];
                
                // Paso 2: Extraer los IDs reales y sus flags desde el formulario
                pedidoActualizado.referencias?.forEach((ref: any, idx: number) => {
                    const refGroup = this.referenciasFormArray.at(idx);
                    const mostrarRef = refGroup.get('mostrar_referencia')?.value ?? true;

                    ref.proveedores?.forEach((prov: any) => {
                        if (prov.estado === 1 || prov.estado === true) {
                            selectedItems.push({
                                id: Number(prov.id),
                                mostrar_referencia: mostrarRef
                            });
                        }
                    });
                });

                if (selectedItems.length === 0) {
                    this.submitting.set(false);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se detectaron ítems seleccionados tras el guardado.' });
                    return;
                }

                // Paso 3: Proceder con la generación de la cotización
                this.ejecutarFinalizacion(selectedItems);
            },
            error: (err: any) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error de Auto-guardado', detail: 'No se pudo guardar el costeo antes de cotizar.' });
            }
        });
    }

    private ejecutarFinalizacion(selectedItems: { id: number; mostrar_referencia: boolean }[]): void {
        this.submitting.set(true);
        this.cotizacionService.finalizarCosteo({
            pedido_id: this.pedidoId(),
            items: selectedItems
        }).subscribe({
            next: (resp: any) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cotización generada correctamente.' });
                
                // Opción: Descargar PDF automáticamente o redirigir
                if (resp.data && resp.data.id) {
                    this.descargarPDF(resp.data.id);
                    setTimeout(() => this.router.navigate(['/app/cotizaciones']), 2000);
                }
            },
            error: (err: any) => {
                this.submitting.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo finalizar el costeo' });
            }
        });
    }

    private descargarPDF(cotizacionId: number): void {
        this.cotizacionService.downloadPDF(cotizacionId).subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `COT-${cotizacionId}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'Error PDF', detail: 'No se pudo descargar el archivo PDF.' });
            }
        });
    }

    volver(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId()]);
    }

    confirmarDevolucion(): void {
        this.devolucionComentario.set('');
        this.displayDevolucionDialog.set(true);
    }

    devolverAAnalista(): void {
        const texto = this.devolucionComentario().trim();
        if (texto.length < 10) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Comentario muy corto',
                detail: 'Por favor, explique detalladamente por qué devuelve el pedido (mínimo 10 caracteres).'
            });
            return;
        }

        this.submitting.set(true);
        this.pedidoService.devolverAAnalista(this.pedidoId(), texto).subscribe({
            next: () => {
                this.submitting.set(false);
                this.displayDevolucionDialog.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Pedido devuelto',
                    detail: 'El pedido ha sido enviado nuevamente a la fase de análisis.'
                });
                setTimeout(() => this.router.navigate(['/app/pedidos']), 1500);
            },
            error: (err: any) => {
                this.submitting.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message ?? 'No se pudo devolver el pedido'
                });
            }
        });
    }
}
