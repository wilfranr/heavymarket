import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
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

import { createPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { CreatePedidoDto, CreatePedidoReferenciaDto, PedidoEstado } from '../../../core/models/pedido.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { Country, State, City } from '../../../core/models/ubicacion.model';
import { PedidoReferenciaProveedorService } from '../../../core/services/pedido-referencia-proveedor.service';
import { ArticuloService } from '../../../core/services/articulo.service';

/**
 * Componente de creación de pedido con Wizard de 3 pasos
 * Paso 1: Cliente
 * Paso 2: Referencias Masivas
 * Paso 3: Referencias Detalladas
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
        SkeletonModule
    ],
    providers: [MessageService],
    templateUrl: './create.html',
    styleUrl: './create.scss'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly terceroService = inject(TerceroService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly ubicacionService = inject(UbicacionService);
    private readonly proveedorService = inject(PedidoReferenciaProveedorService);
    private readonly articuloService = inject(ArticuloService);

    pedidoForm!: FormGroup;
    createTerceroForm!: FormGroup;
    activeIndex = 0;
    loading = false;
    loadingTercero = false;
    displayCreateTerceroDialog = false;

    today = new Date();

    // Opciones para selects
    terceros: any[] = [];
    sistemas: any[] = [];
    marcas: any[] = [];
    maquinas: any[] = [];
    fabricantes: any[] = [];
    referencias: any[] = [];

    // Terceros completos para info cards
    tercerosFull: any[] = [];
    maquinasFull: any[] = [];

    // Signals para reactividad en cards
    terceroId = signal<number | null>(null);
    maquinaId = signal<number | null>(null);

    selectedTercero = computed(() => {
        const id = this.terceroId();
        return id ? this.tercerosFull.find(t => t.id === id) : null;
    });

    selectedMaquina = computed(() => {
        const id = this.maquinaId();
        return id ? this.maquinasFull.find(m => m.id === id) : null;
    });

    // Estado de proveedores por referencia (para 'Crear', se guardarán localmente antes de enviar o se manejarán como FormArrays)
    referenciaIndexParaProveedor: number | null = null;
    nuevoProveedorForm: FormGroup | null = null;

    // Ubicación para creación de tercero
    paises: Country[] = [];
    departamentos: State[] = [];
    ciudades: City[] = [];

    tiposDocumento = [
        { label: 'NIT', value: 'nit' },
        { label: 'Cédula de Ciudadanía', value: 'cc' },
        { label: 'Cédula de Extranjería', value: 'ce' },
        { label: 'Pasaporte', value: 'pasaporte' }
    ];

    // tiposTercero ya no es necesario en la vista si lo forzamos a "Cliente", 
    // pero lo dejamos por si acaso o lo simplificamos.
    // El backend espera 'Cliente', 'Proveedor', 'Ambos'
    tiposTercero = [
        { label: 'Cliente', value: 'Cliente' }
    ];

    // Items del wizard
    items: MenuItem[] = [{ label: 'Cliente' }, { label: 'Referencias Masivas' }, { label: 'Referencias Detalladas' }];

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
        this.loadPaises();
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

        // Listen for changes to update cards
        this.pedidoForm.get('tercero_id')?.valueChanges.subscribe(id => this.terceroId.set(id));
        this.pedidoForm.get('maquina_id')?.valueChanges.subscribe(id => this.maquinaId.set(id));

        // Formulario para crear tercero (Cliente)
        this.createTerceroForm = this.fb.group({
            tipo_documento: ['nit', [Validators.required]],
            numero_documento: ['', [Validators.required, Validators.maxLength(20)]],
            nombre: ['', [Validators.required, Validators.maxLength(255)]], // Razón social / Nombre
            telefono: ['', [Validators.required]], // Teléfono requerido
            email: ['', [Validators.email]],
            direccion: [''],
            // Ubicación
            country_id: [null],
            state_id: [null],
            city_id: [null],
            // Campos por defecto para cliente
            tipo: ['Cliente'],
            estado: ['activo']
        });
    }

    /**
     * Muestra el diálogo para crear un nuevo tercero
     */
    openCreateTerceroDialog(): void {
        this.createTerceroForm.reset({
            tipo_documento: 'nit',
            tipo: 'Cliente',
            estado: 'activo'
        });

        // Resetear selectores dependientes
        this.departamentos = [];
        this.ciudades = [];

        this.displayCreateTerceroDialog = true;
    }

    /**
     * Carga la lista de países
     */
    private loadPaises(): void {
        this.ubicacionService.getCountries().subscribe({
            next: (response) => {
                this.paises = response.data;
            }
        });
    }

    /**
     * Maneja el cambio de país en el formulario de tercero
     */
    onPaisChange(): void {
        const countryId = this.createTerceroForm.get('country_id')?.value;
        this.departamentos = [];
        this.ciudades = [];
        this.createTerceroForm.patchValue({ state_id: null, city_id: null });

        if (countryId) {
            this.ubicacionService.getStates(countryId).subscribe({
                next: (response) => {
                    this.departamentos = response.data;
                    if (this.departamentos.length === 0) {
                        this.loadCiudades(undefined, countryId);
                    }
                }
            });
        }
    }

    /**
     * Maneja el cambio de departamento en el formulario de tercero
     */
    onDepartamentoChange(): void {
        const stateId = this.createTerceroForm.get('state_id')?.value;
        this.ciudades = [];
        this.createTerceroForm.patchValue({ city_id: null });

        if (stateId) {
            this.loadCiudades(stateId);
        }
    }

    /**
     * Carga ciudades basado en estado o país
     */
    private loadCiudades(stateId?: number, countryId?: number): void {
        this.ubicacionService.getCities(stateId, countryId).subscribe({
            next: (response) => {
                this.ciudades = response.data;
            }
        });
    }

    /**
     * Cierra el diálogo de creación de tercero
     */
    closeCreateTerceroDialog(): void {
        this.displayCreateTerceroDialog = false;
    }

    /**
     * Guarda el nuevo tercero
     */
    saveTercero(): void {
        if (this.createTerceroForm.invalid) {
            this.createTerceroForm.markAllAsTouched();
            return;
        }

        this.loadingTercero = true;
        const formValue = this.createTerceroForm.value;

        // Mapear al DTO incluyendo ubicaciones
        const data = {
            ...formValue,
            country_id: formValue.country_id || undefined,
            state_id: formValue.state_id || undefined,
            city_id: formValue.city_id || undefined
        };

        this.terceroService.create(data).subscribe({
            next: (response) => {
                this.loadingTercero = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Cliente creado correctamente'
                });

                // Recargar lista de terceros y seleccionar el nuevo
                this.loadTerceros(response.data.id);
                this.closeCreateTerceroDialog();
            },
            error: (error) => {
                this.loadingTercero = false;
                // El servicio ya maneja errores globales, pero podemos ser específicos si es necesario
                console.error('Error al crear tercero', error);
            }
        });
    }

    /**
     * Carga datos iniciales para los selects
     */
    private loadInitialData(): void {
        // Cargar terceros (clientes)
        this.loadTerceros();

        // Cargar sistemas
        this.sistemaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.sistemas = response.data.map((s) => ({
                    label: s.nombre,
                    value: s.id
                }));
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

        // Cargar máquinas
        this.maquinaService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.maquinasFull = response.data;
                this.maquinas = response.data.map((m) => ({
                    label: `${m.modelo}${m.serie ? ' - ' + m.serie : ''}`,
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
     * Getter para el FormArray de referencias
     */
    get referenciasFormArray(): FormArray {
        return this.pedidoForm.get('referencias') as FormArray;
    }

    /**
     * Agrega una nueva referencia al FormArray
     */
    agregarReferencia(): void {
        const referenciaForm = this.fb.group({
            estado: [true],
            sistema_id: [null],
            referencia_id: [null, [Validators.required]],
            marca_id: [null],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            comentario: [''],
            definicion: [''],
            imagen: [null],
            proveedores: this.fb.array([])
        });

        this.referenciasFormArray.push(referenciaForm);
    }

    /**
     * Elimina una referencia del FormArray
     */
    eliminarReferencia(index: number): void {
        this.referenciasFormArray.removeAt(index);
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

        // Primero, parsear todas las líneas
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
                detail: 'No se encontraron referencias válidas en el formato correcto'
            });
            return;
        }

        // Procesar todas las referencias
        let procesadas = 0;
        let pendientes = referenciasParaProcesar.length;

        referenciasParaProcesar.forEach(({ cantidad, codigo }) => {
            // Buscar referencia existente
            this.referenciaService.getAll({ search: codigo, per_page: 10 }).subscribe({
                next: (response) => {
                    let referenciaId: number | null = null;

                    // Buscar coincidencia exacta
                    const referenciaEncontrada = response.data.find((r) => r.referencia.toUpperCase() === codigo);

                    if (referenciaEncontrada) {
                        referenciaId = referenciaEncontrada.id;
                        this.agregarReferenciaAlFormArray(referenciaId, cantidad);
                        procesadas++;
                    } else {
                        // Crear nueva referencia
                        this.referenciaService
                            .create({
                                referencia: codigo,
                                marca_id: undefined,
                                comentario: 'Creada desde importación masiva'
                            })
                            .subscribe({
                                next: (createResponse) => {
                                    referenciaId = createResponse.data.id;
                                    this.agregarReferenciaAlFormArray(referenciaId, cantidad);
                                    procesadas++;
                                    this.verificarProcesamientoCompleto(procesadas, pendientes);
                                },
                                error: () => {
                                    pendientes--;
                                    this.verificarProcesamientoCompleto(procesadas, pendientes);
                                }
                            });
                        return;
                    }

                    pendientes--;
                    this.verificarProcesamientoCompleto(procesadas, pendientes);
                },
                error: () => {
                    pendientes--;
                    this.verificarProcesamientoCompleto(procesadas, pendientes);
                }
            });
        });
    }

    /**
     * Verifica si el procesamiento masivo está completo
     */
    private verificarProcesamientoCompleto(procesadas: number, pendientes: number): void {
        if (pendientes === 0) {
            this.loading = false;
            if (procesadas > 0) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `${procesadas} referencia(s) procesada(s)`
                });
                // Limpiar el campo de texto
                this.pedidoForm.get('referencias_copiadas')?.setValue('');
            } else {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron procesar las referencias'
                });
            }
        }
    }

    /**
     * Agrega una referencia al FormArray
     */
    private agregarReferenciaAlFormArray(referenciaId: number, cantidad: number): void {
        const referenciaForm = this.fb.group({
            estado: [true],
            sistema_id: [null],
            referencia_id: [referenciaId, [Validators.required]],
            marca_id: [null],
            cantidad: [cantidad, [Validators.required, Validators.min(1)]],
            comentario: [''],
            definicion: [''],
            imagen: [null],
            proveedores: this.fb.array([])
        });

        this.referenciasFormArray.push(referenciaForm);
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
        } else if (this.activeIndex === 1) {
            // Paso 2: Referencias Masivas - no requiere validación
        } else if (this.activeIndex === 2) {
            // Paso 3: Validar que haya al menos una referencia
            if (this.referenciasFormArray.length === 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validación',
                    detail: 'Debe agregar al menos una referencia'
                });
                return;
            }

            // Validar todas las referencias
            const invalid = this.referenciasFormArray.controls.find((c) => c.invalid);
            if (invalid) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validación',
                    detail: 'Por favor complete todos los campos requeridos de las referencias'
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
        if (this.pedidoForm.invalid || this.referenciasFormArray.length === 0) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.pedidoForm.value;
        const referencias: CreatePedidoReferenciaDto[] = this.referenciasFormArray.controls.map((control) => ({
            referencia_id: control.get('referencia_id')?.value,
            sistema_id: control.get('sistema_id')?.value || undefined,
            marca_id: control.get('marca_id')?.value || undefined,
            cantidad: control.get('cantidad')?.value,
            comentario: control.get('comentario')?.value || undefined,
            estado: control.get('estado')?.value ?? true,
            // Nuevos campos
            definicion: control.get('definicion')?.value || undefined,
            imagen: control.get('imagen')?.value || undefined,
            proveedores: (control.get('proveedores') as FormArray)?.value || []
        }));

        const pedidoData: any = {
            tercero_id: formValue.tercero_id,
            direccion: formValue.direccion || undefined,
            comentario: formValue.comentario || undefined,
            maquina_id: formValue.maquina_id || undefined,
            fabricante_id: formValue.fabricante_id || undefined,
            contacto_id: formValue.contacto_id || undefined,
            estado: formValue.estado || 'Nuevo',
            referencias
        };

        this.store.dispatch(createPedido({ pedido: pedidoData }));

        // Escuchar el resultado
        this.store
            .select((state: any) => state.pedidos)
            .subscribe((pedidosState: any) => {
                if (!pedidosState.loading && !pedidosState.error && this.loading) {
                    this.loading = false;
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Éxito',
                        detail: 'Pedido creado correctamente'
                    });
                    setTimeout(() => {
                        this.router.navigate(['/app/pedidos']);
                    }, 1500);
                } else if (!pedidosState.loading && pedidosState.error && this.loading) {
                    this.loading = false;
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
     * Verifica si un campo del formulario de tercero es inválido
     */
    isTerceroFieldInvalid(field: string): boolean {
        const control = this.createTerceroForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    /**
     * Carga la lista de terceros (clientes)
     * @param selectedId ID opcional para seleccionar automáticamente
     */
    private loadTerceros(selectedId?: number): void {
        this.terceroService.list({ per_page: 100, tipo: 'Cliente' }).subscribe({
            next: (response) => {
                this.tercerosFull = response.data;
                this.terceros = response.data.map((t) => ({
                    label: t.nombre || `Tercero ${t.id}`,
                    value: t.id
                }));

                // Si se proporcionó un ID, seleccionarlo
                if (selectedId) {
                    this.pedidoForm.patchValue({ tercero_id: selectedId });
                }
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los clientes'
                });
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
        return this.terceros.find(t => t.value === id)?.label || 'Proveedor';
    }

    getMarcaLabel(id: number): string {
        return this.marcas.find(m => m.value === id)?.label || 'GEN';
    }

    calculateTotal(proveedor: any): number {
        const costo = proveedor.costo_unidad || 0;
        const cantidad = proveedor.cantidad || 0;
        const utilidad = proveedor.utilidad || 0;
        return costo * cantidad * (1 + utilidad / 100);
    }
}
