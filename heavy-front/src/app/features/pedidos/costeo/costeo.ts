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
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PedidoService } from '../../../core/services/pedido.service';

import { loadPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { Pedido, PedidoEstado } from '../../../core/models/pedido.model';
import { pedidoEstadoEtiqueta, pedidoEstadoTagClass } from '../../../core/utils/pedido-estado-tag';
import { TerceroService } from '../../../core/services/tercero.service';
import { Tercero } from '../../../core/models/tercero.model';
import { TRMService } from '../../../core/services/trm.service';
import { EmpresaService } from '../../../core/services/empresa.service';
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
        TextareaModule,
        ConfirmDialogModule,
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

    readonly pedidoEstadoEtiqueta = pedidoEstadoEtiqueta;

    pedidoId = signal<number>(0);
    pedido$!: Observable<Pedido | undefined>;
    pedido = signal<Pedido | null>(null);
    loading$!: Observable<boolean>;
    
    estadoActual: PedidoEstado = 'En_Costeo';
    trmCargada: number = 0;
    fleteCargado: number = 0;
    
    // Devolución
    displayDevolucionDialog = false;
    devolucionComentario = '';
    submitting = false;
    
    // Formulario principal
    costeoForm!: FormGroup;

    // Modales de creación
    showTerceroModal = false;
    showMarcaModal = false;
    activeRefIndex: number = -1;
    activeProvIndex: number = -1;
    
    // Datos maestros
    proveedores: any[] = [];
    proveedoresCompletos: Tercero[] = [];
    marcas: any[] = [];
    entregas: any[] = [
        { label: 'Inmediato', value: '0' },
        { label: '1 - 3 días', value: '3' },
        { label: '5 - 7 días', value: '7' },
        { label: '15 días', value: '15' },
        { label: '30+ días', value: '30' }
    ];

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
                this.marcas = marcas.map((m: Lista) => ({
                    label: m.nombre,
                    value: m.id
                }));
            }
        });
    }

    private loadProveedores(): void {
        this.terceroService.getProveedores({ per_page: 1000 }).subscribe({
            next: (resp) => {
                this.proveedoresCompletos = resp.data;
                this.proveedores = resp.data.map(p => ({
                    label: p.nombre,
                    value: p.id
                }));
            }
        });
    }

    private loadTRM(): void {
        this.trmService.getLatest().subscribe({
            next: (resp) => {
                this.trmCargada = resp.data.trm;
                this.messageService.add({ severity: 'info', summary: 'TRM Actualizada', detail: `Se está usando una TRM de $${this.trmCargada.toLocaleString()}` });
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
                    this.fleteCargado = resp.data[0].flete || 0;
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
            
            this.pedido$ = this.store.select(selectPedidoById(parsedId));
            this.loading$ = this.store.select(selectPedidosLoading);

            // Sincronizar carga de pedido y proveedores para evitar condiciones de carrera
            import('rxjs').then(({ combineLatest }) => {
                combineLatest([
                    this.pedido$.pipe(filter((pedido) => !!pedido && pedido.referencias !== undefined)),
                    this.terceroService.getProveedores({ per_page: 1000 })
                ]).pipe(take(1)).subscribe(([pedido, providersResp]) => {
                    this.proveedoresCompletos = providersResp.data;
                    this.proveedores = providersResp.data.map(p => ({
                        label: p.nombre,
                        value: p.id
                    }));
                    
                    if (pedido) {
                        this.pedido.set(pedido);
                        this.estadoActual = pedido.estado;
                        this.poblarFormulario(pedido);
                    }
                });
            });
        }
    }

    private poblarFormulario(pedido: Pedido): void {
        this.referenciasFormArray.clear();
        
        if (pedido.referencias && pedido.referencias.length > 0) {
            pedido.referencias.forEach(ref => {
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
                    peso: [ref.referencia?.articulo?.peso || 0],
                    estado_str: ['Preparado'], 
                    proveedores: this.fb.array([])
                });
                
                const proveedoresArray = refFormGroup.get('proveedores') as FormArray;
                
                // 1. Cargar proveedores que ya tienen datos guardados
                if (ref.proveedores && ref.proveedores.length > 0) {
                    ref.proveedores.forEach(p => {
                        this.agregarProveedorFila(proveedoresArray, p);
                    });
                }

                // 2. Cargar proveedores que coincidan con Fabricante y Categoría Comercial (si no están ya)
                if (this.proveedoresCompletos.length > 0 && ref.referencia?.marca_id && ref.lista_id) {
                    const coincidentes = this.proveedoresCompletos.filter(p => {
                        const tieneFabricante = p.fabricante_ids?.length === 0 || p.fabricante_ids?.some(id => Number(id) === Number(ref.referencia?.marca_id));
                        const tieneCategoria = p.categoria_comercial_ids?.some(id => Number(id) === Number(ref.lista_id));
                        return tieneFabricante && tieneCategoria;
                    });

                    coincidentes.forEach(p => {
                        const yaExiste = ref.proveedores?.some(rp => rp.tercero_id === p.id);
                        if (!yaExiste) {
                            this.agregarProveedorFila(proveedoresArray, { tercero_id: p.id });
                        }
                    });
                }

                // Si después de todo no hay filas, añadir una vacía
                if (proveedoresArray.length === 0) {
                    this.agregarProveedorVacio(proveedoresArray);
                }
                
                // Disparar validación/cálculo inicial para cada fila
                setTimeout(() => {
                    const idx = this.referenciasFormArray.length;
                    (refFormGroup.get('proveedores') as FormArray).controls.forEach((_, pIdx) => {
                        this.onProveedorChange(idx, pIdx);
                    });
                }, 500);

                this.referenciasFormArray.push(refFormGroup);
            });
        }
    }

    getProveedoresFiltrados(refIndex: number): any[] {
        const refGroup = this.referenciasFormArray.at(refIndex);
        if (!refGroup) return this.proveedores;
        
        const marcaId = refGroup.get('marca_id')?.value || this.pedido()?.referencias?.[refIndex]?.referencia?.marca_id;
        const listaId = refGroup.get('lista_id')?.value;
        
        if (!marcaId || !listaId) return this.proveedores;

        return this.proveedoresCompletos
            .filter(p => {
                const tieneFabricante = p.fabricante_ids?.length === 0 || p.fabricante_ids?.some(id => Number(id) === Number(marcaId));
                const tieneCategoria = p.categoria_comercial_ids?.some(id => Number(id) === Number(listaId));
                return tieneFabricante && tieneCategoria;
            })
            .map(p => ({
                label: p.nombre,
                value: p.id
            }));
    }

    agregarProveedorFila(proveedoresArray: FormArray, data?: any): void {
        const group = this.fb.group({
            seleccionado: [data?.seleccionado || false],
            cantidad: [data?.cantidad || 1],
            proveedor_id: [data?.tercero_id || null],
            marca_id: [data?.marca_id || null],
            entrega: [data?.dias_entrega?.toString() || null],
            costo_usd: [data?.costo_unidad_usd || null],
            costo_cop: [data?.costo_unidad || null],
            utilidad: [data?.utilidad || null],
            venta: [data?.precio_venta || null]
        });
        
        proveedoresArray.push(group);
    }

    agregarProveedorVacio(proveedoresArray: FormArray): void {
        proveedoresArray.push(this.fb.group({
            seleccionado: [false],
            cantidad: [1],
            proveedor_id: [null],
            marca_id: [null],
            entrega: [null],
            costo_usd: [null],
            costo_cop: [null],
            utilidad: [null],
            venta: [null]
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

    // --- Métodos de creación ---
    openCreateProveedor(refIndex: number, provIndex: number): void {
        this.activeRefIndex = refIndex;
        this.activeProvIndex = provIndex;
        this.showTerceroModal = true;
    }

    onProveedorCreated(tercero: any): void {
        if (this.activeRefIndex !== -1 && this.activeProvIndex !== -1) {
            this.terceroService.getProveedores({ per_page: 1000 }).subscribe({
                next: (resp) => {
                    this.proveedoresCompletos = resp.data;
                    this.proveedores = resp.data.map(p => ({
                        label: p.nombre,
                        value: p.id
                    }));
                    
                    const proveedoresArray = this.referenciasFormArray.at(this.activeRefIndex).get('proveedores') as FormArray;
                    const provGroup = proveedoresArray.at(this.activeProvIndex) as FormGroup;
                    
                    provGroup.patchValue({ proveedor_id: tercero.id });
                    this.onProveedorChange(this.activeRefIndex, this.activeProvIndex);
                }
            });
        }
    }

    openCreateMarca(refIndex: number, provIndex: number): void {
        this.activeRefIndex = refIndex;
        this.activeProvIndex = provIndex;
        this.showMarcaModal = true;
    }

    onMarcaCreated(marca: any): void {
        if (this.activeRefIndex !== -1 && this.activeProvIndex !== -1) {
            this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
                next: (marcas: Lista[]) => {
                    this.marcas = marcas.map((m: Lista) => ({
                        label: m.nombre,
                        value: m.id
                    }));
                    
                    const proveedoresArray = this.referenciasFormArray.at(this.activeRefIndex).get('proveedores') as FormArray;
                    const provGroup = proveedoresArray.at(this.activeProvIndex) as FormGroup;
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

        const proveedor = this.proveedoresCompletos.find(p => p.id === proveedorId);
        if (!proveedor) return;

        // Validar país (Colombia = ID 48, ISO 'CO' o Nombre 'Colombia')
        const esNacional = proveedor.country?.iso2 === 'CO' || 
                          proveedor.country?.name?.toLowerCase().includes('colombia') || 
                          proveedor.country_id === 48 || 
                          proveedor.country?.id === 48;

        if (esNacional) {
            // Proveedor Nacional: Deshabilitar USD, habilitar COP
            provGroup.get('costo_usd')?.disable();
            provGroup.get('costo_usd')?.setValue(null);
            provGroup.get('costo_cop')?.enable();
            this.messageService.add({ severity: 'info', summary: 'Proveedor Nacional', detail: 'Solo se permite costo en pesos (COP).' });
        } else {
            // Proveedor Internacional: Deshabilitar COP, habilitar USD
            provGroup.get('costo_cop')?.disable();
            provGroup.get('costo_cop')?.setValue(null);
            provGroup.get('costo_usd')?.enable();
            this.messageService.add({ severity: 'info', summary: 'Proveedor Internacional', detail: 'Solo se permite costo en dólares (USD).' });
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

        if (!this.trmCargada) return;

        let finalValorUnidadCOP = 0;

        if (proveedorId) {
            const proveedor = this.proveedoresCompletos.find(p => p.id === proveedorId);
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
                const calculatedUSD = costoCOP / this.trmCargada;
                provGroup.get('costo_usd')?.patchValue(parseFloat(calculatedUSD.toFixed(2)), { emitEvent: false });
            } else {
                // FÓRMULA INTERNACIONAL:
                // 1. peso_en_libras = peso_gramos / 453.59
                // 2. costo_base_usd = (peso_en_libras * flete) + costo_unidad
                // 3. costo_base_cop = costo_base_usd * trm
                // 4. valor_unidad = round(costo_base_cop + (utilidad * costo_base_cop / 100) / 100) * 100 (centenas)
                
                const pesoLibras = pesoGramos / 453.59;
                const costoBaseUSD = (pesoLibras * this.fleteCargado) + costoUSD;
                const costoBaseCOP = costoBaseUSD * this.trmCargada;
                const vUnidad = costoBaseCOP + (utilidad * costoBaseCOP / 100);
                
                // Redondear a centenas
                finalValorUnidadCOP = Math.round(vUnidad / 100) * 100;
                
                // Actualizar COP informativo (basado en costo base o solo costo unidad?)
                // El usuario dice "costo_base_cop", lo usaremos para valor_unidad.
                // Mantendremos el costo_cop del input solo como referencia del costo_unidad_usd * trm
                provGroup.get('costo_cop')?.patchValue(Math.round(costoUSD * this.trmCargada), { emitEvent: false });
            }
        } else {
            // Sin proveedor, cálculo simple de markup
            const baseCOP = costoCOP || (costoUSD * this.trmCargada);
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

    guardarCosteo(): void {
        this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Costeo guardado exitosamente.' });
    }
    
    finalizarCosteo(): void {
        this.messageService.add({ severity: 'info', summary: 'Finalizar', detail: 'Aquí se generaría la cotización con los seleccionados.' });
    }

    volver(): void {
        this.router.navigate(['/app/pedidos', this.pedidoId()]);
    }

    confirmarDevolucion(): void {
        this.devolucionComentario = '';
        this.displayDevolucionDialog = true;
    }

    devolverAAnalista(): void {
        const texto = this.devolucionComentario.trim();
        if (texto.length < 10) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Comentario muy corto',
                detail: 'Por favor, explique detalladamente por qué devuelve el pedido (mínimo 10 caracteres).'
            });
            return;
        }

        this.submitting = true;
        this.pedidoService.devolverAAnalista(this.pedidoId(), texto).subscribe({
            next: () => {
                this.submitting = false;
                this.displayDevolucionDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Pedido devuelto',
                    detail: 'El pedido ha sido enviado nuevamente a la fase de análisis.'
                });
                setTimeout(() => this.router.navigate(['/app/pedidos']), 1500);
            },
            error: (err) => {
                this.submitting = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error?.message ?? 'No se pudo devolver el pedido'
                });
            }
        });
    }
}
