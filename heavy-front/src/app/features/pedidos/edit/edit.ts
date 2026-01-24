import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, take } from 'rxjs';

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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { CurrencyPipe } from '@angular/common';

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
import { PedidoReferenciaProveedor, CreatePedidoReferenciaProveedorDto, PedidoArticulo, CreatePedidoArticuloDto } from '../../../core/models/pedido.model';

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
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        DialogModule,
        TableModule,
        CurrencyPipe
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './edit.html',
    styleUrl: './edit.scss'
})
export class EditComponent implements OnInit {
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
    private readonly proveedorService = inject(PedidoReferenciaProveedorService);
    private readonly articuloService = inject(ArticuloService);
    private readonly pedidoArticuloService = inject(PedidoArticuloService);

    pedidoForm!: FormGroup;
    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;
    
    pedidoId = signal<number>(0);
    terceros: any[] = [];
    sistemas: any[] = [];
    marcas: any[] = [];
    maquinas: any[] = [];
    fabricantes: any[] = [];
    referencias: any[] = [];
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
    
    estadosOptions = [
        { label: 'Nuevo', value: 'Nuevo' as PedidoEstado },
        { label: 'Enviado', value: 'Enviado' as PedidoEstado },
        { label: 'En Costeo', value: 'En_Costeo' as PedidoEstado },
        { label: 'Cotizado', value: 'Cotizado' as PedidoEstado },
        { label: 'Aprobado', value: 'Aprobado' as PedidoEstado },
        { label: 'Entregado', value: 'Entregado' as PedidoEstado },
        { label: 'Rechazado', value: 'Rechazado' as PedidoEstado },
        { label: 'Cancelado', value: 'Cancelado' as PedidoEstado }
    ];

    // Estado actual del pedido (para validar transiciones)
    estadoActual: PedidoEstado = 'Nuevo';
    
    // Mapa de transiciones válidas
    transicionesValidas: Record<PedidoEstado, PedidoEstado[]> = {
        'Nuevo': ['Enviado', 'En_Costeo', 'Cancelado'],
        'Enviado': ['En_Costeo', 'Cancelado'],
        'En_Costeo': ['Cotizado', 'Rechazado', 'Cancelado'],
        'Cotizado': ['Aprobado', 'Rechazado', 'Cancelado'],
        'Aprobado': ['Entregado', 'Cancelado'],
        'Entregado': [],
        'Rechazado': [],
        'Cancelado': []
    };

    submitting = false;

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
        this.loadPedido();
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
            motivo_rechazo: ['']
        });
    }

    /**
     * Carga datos iniciales para los selects
     */
    private loadInitialData(): void {
        // Cargar terceros (clientes)
        this.terceroService.list({ per_page: 100, tipo: 'Cliente' }).subscribe({
            next: (response) => {
                this.terceros = response.data.map(t => ({
                    label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
                    value: t.id
                }));
            }
        });

        // Cargar sistemas
        this.sistemaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.sistemas = response.data.map(s => ({
                    label: s.nombre,
                    value: s.id
                }));
            }
        });

        // Cargar marcas
        this.listaService.getByTipo('Marca').subscribe({
            next: (marcas) => {
                this.marcas = marcas.map(m => ({
                    label: m.nombre,
                    value: m.id
                }));
            }
        });

        // Cargar máquinas
        this.maquinaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.maquinas = response.data.map(m => ({
                    label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''}`,
                    value: m.id
                }));
            }
        });

        // Cargar fabricantes
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data.map(f => ({
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
    }

    /**
     * Carga las referencias disponibles
     */
    private loadReferencias(): void {
        this.referenciaService.getAll({ per_page: 200 }).subscribe({
            next: (response) => {
                this.referencias = response.data.map(r => ({
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
                this.articulos = response.data.map(a => ({
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
                this.proveedores = response.data.map(p => ({
                    label: p.razon_social || p.nombre_comercial || `Proveedor ${p.id}`,
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
     * Carga los datos del pedido
     */
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
                    filter(pedido => !!pedido),
                    take(1)
                )
                .subscribe(pedido => {
                    if (pedido) {
                        this.pedidoForm.patchValue({
                            tercero_id: pedido.tercero_id,
                            direccion: pedido.direccion || '',
                            comentario: pedido.comentario || '',
                            estado: pedido.estado,
                            maquina_id: pedido.maquina_id || null,
                            fabricante_id: pedido.fabricante_id || null,
                            contacto_id: pedido.contacto_id || null
                        });

                        // Cargar referencias del pedido
                        if (pedido.referencias && pedido.referencias.length > 0) {
                            this.cargarReferenciasAlFormArray(pedido.referencias);
                            
                            // Cargar proveedores de cada referencia
                            pedido.referencias.forEach(ref => {
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
    }

    /**
     * Carga las referencias del pedido al FormArray
     */
    private cargarReferenciasAlFormArray(referencias: PedidoReferencia[]): void {
        referencias.forEach(ref => {
            const referenciaForm = this.fb.group({
                id: [ref.id],
                estado: [ref.estado ?? true],
                sistema_id: [ref.sistema_id || null],
                referencia_id: [ref.referencia_id, [Validators.required]],
                marca_id: [ref.marca_id || null],
                cantidad: [ref.cantidad, [Validators.required, Validators.min(1)]],
                comentario: [ref.comentario || '']
            });

            this.referenciasFormArray.push(referenciaForm);
        });
    }

    /**
     * Getter para el FormArray de referencias
     */
    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    /**
     * Agrega una nueva referencia al FormArray
     */
    addReferencia(): void {
        const referenciaForm = this.fb.group({
            id: [null],
            estado: [true],
            sistema_id: [null],
            referencia_id: [null, [Validators.required]],
            marca_id: [null],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            comentario: ['']
        });

        this.referenciasFormArray.push(referenciaForm);
    }

    /**
     * Elimina una referencia del FormArray
     */
    removeReferencia(index: number): void {
        const referencia = this.referenciasFormArray.at(index);
        const referenciaId = referencia.get('id')?.value;

        if (referenciaId) {
            // Si tiene ID, es una referencia existente - confirmar eliminación
            this.confirmationService.confirm({
                message: '¿Está seguro de eliminar esta referencia del pedido?',
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                accept: () => {
                    // TODO: Llamar al endpoint para eliminar la referencia
                    this.referenciasFormArray.removeAt(index);
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Referencia eliminada'
                    });
                }
            });
        } else {
            // Si no tiene ID, es nueva - solo remover del array
            this.referenciasFormArray.removeAt(index);
        }
    }

    /**
     * Selecciona todas las referencias
     */
    selectAllReferencias(): void {
        this.referenciasFormArray.controls.forEach(control => {
            control.get('estado')?.setValue(true);
        });
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Todas las referencias han sido seleccionadas'
        });
    }

    /**
     * Deselecciona todas las referencias
     */
    deselectAllReferencias(): void {
        this.referenciasFormArray.controls.forEach(control => {
            control.get('estado')?.setValue(false);
        });
        this.messageService.add({
            severity: 'info',
            summary: 'Información',
            detail: 'Todas las referencias han sido deseleccionadas'
        });
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
    getEstadosDisponibles(): Array<{label: string; value: PedidoEstado}> {
        const transicionesPermitidas = this.transicionesValidas[this.estadoActual] || [];
        
        // Incluir el estado actual y las transiciones permitidas
        const estadosDisponibles = [
            { label: this.estadosOptions.find(e => e.value === this.estadoActual)?.label || this.estadoActual, value: this.estadoActual },
            ...transicionesPermitidas.map(e => this.estadosOptions.find(o => o.value === e)).filter(Boolean) as Array<{label: string; value: PedidoEstado}>
        ];

        return estadosDisponibles;
    }

    /**
     * Maneja el cambio de estado con validación
     */
    onEstadoChange(): void {
        const nuevoEstado = this.pedidoForm.get('estado')?.value;
        
        if (!this.validarTransicionEstado(this.estadoActual, nuevoEstado)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Transición inválida',
                detail: `No se puede cambiar de "${this.estadoActual}" a "${nuevoEstado}". Transiciones válidas: ${this.transicionesValidas[this.estadoActual]?.join(', ') || 'ninguna'}`
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
            // Verificar que haya referencias con proveedores
            const tieneProveedores = Array.from(this.proveedoresPorReferencia.values())
                .some(proveedores => proveedores.length > 0);
            
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
     * Envía el formulario para actualizar el pedido
     */
    onSubmit(): void {
        if (this.pedidoForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            Object.keys(this.pedidoForm.controls).forEach(key => {
                this.pedidoForm.get(key)?.markAsTouched();
            });
            return;
        }

        const formValue = this.pedidoForm.value;
        const nuevoEstado = formValue.estado;

        // Validar transición antes de enviar
        if (!this.validarTransicionEstado(this.estadoActual, nuevoEstado)) {
            this.messageService.add({
                severity: 'error',
                summary: 'Transición inválida',
                detail: `No se puede cambiar de "${this.estadoActual}" a "${nuevoEstado}"`
            });
            return;
        }

        this.submitting = true;
        
        const pedidoData: UpdatePedidoDto = {
            tercero_id: formValue.tercero_id,
            direccion: formValue.direccion || undefined,
            comentario: formValue.comentario || undefined,
            maquina_id: formValue.maquina_id || undefined,
            fabricante_id: formValue.fabricante_id || undefined,
            contacto_id: formValue.contacto_id || undefined,
            estado: nuevoEstado,
            motivo_rechazo: nuevoEstado === 'Rechazado' ? formValue.motivo_rechazo : undefined
        };
        
        this.store.dispatch(updatePedido({ 
            id: this.pedidoId(), 
            changes: pedidoData 
        }));

        // Escuchar el resultado
        this.store.select((state: any) => state.pedidos).subscribe((pedidosState: any) => {
            if (!pedidosState.loading && !pedidosState.error && this.submitting) {
                this.submitting = false;
                this.estadoActual = nuevoEstado; // Actualizar estado actual
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Pedido actualizado correctamente'
                });
                setTimeout(() => {
                    this.router.navigate(['/app/pedidos', this.pedidoId()]);
                }, 1500);
            } else if (!pedidosState.loading && pedidosState.error && this.submitting) {
                this.submitting = false;
            }
        });
    }

    /**
     * Cancela y vuelve al detalle
     */
    cancelar(): void {
        this.router.navigate(['/pedidos', this.pedidoId()]);
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
        this.nuevoProveedorForm.get('tercero_id')?.valueChanges.subscribe(terceroId => {
            const proveedor = this.proveedores.find(p => p.value === terceroId);
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
                        const index = proveedores.findIndex(p => p.id === proveedorId);
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
                        const index = this.articulosPedido.findIndex(a => a.id === articuloId);
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
            return actual.dias_entrega < mejor.dias_entrega ? actual : mejor;
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
        const index = this.proveedoresComparacion.findIndex(p => p.id === proveedorId);
        if (index > -1) {
            this.proveedoresComparacion.splice(index, 1);
        }

        // Si quedan menos de 2 proveedores, cerrar el modal
        if (this.proveedoresComparacion.length < 2) {
            this.cerrarComparacion();
        }
    }
}
