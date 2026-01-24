import { Component, OnInit, inject } from '@angular/core';
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

import { createPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { CreatePedidoDto, CreatePedidoReferenciaDto, PedidoEstado } from '../../../core/models/pedido.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';

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
        InputNumberModule
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

    pedidoForm!: FormGroup;
    activeIndex = 0;
    loading = false;

    // Opciones para selects
    terceros: any[] = [];
    sistemas: any[] = [];
    marcas: any[] = [];
    maquinas: any[] = [];
    fabricantes: any[] = [];
    referencias: any[] = [];

    // Items del wizard
    items: MenuItem[] = [
        { label: 'Cliente' },
        { label: 'Referencias Masivas' },
        { label: 'Referencias Detalladas' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.loadInitialData();
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
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los clientes'
                });
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

        // Cargar referencias (para el select del paso 3)
        this.loadReferencias();
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
                    const referenciaEncontrada = response.data.find(r => r.referencia.toUpperCase() === codigo);

                    if (referenciaEncontrada) {
                        referenciaId = referenciaEncontrada.id;
                        this.agregarReferenciaAlFormArray(referenciaId, cantidad);
                        procesadas++;
                    } else {
                        // Crear nueva referencia
                        this.referenciaService.create({
                            referencia: codigo,
                            marca_id: undefined,
                            comentario: 'Creada desde importación masiva'
                        }).subscribe({
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
            comentario: ['']
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
            const invalid = this.referenciasFormArray.controls.find(c => c.invalid);
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
        const referencias: CreatePedidoReferenciaDto[] = this.referenciasFormArray.controls.map(control => ({
            referencia_id: control.get('referencia_id')?.value,
            sistema_id: control.get('sistema_id')?.value || undefined,
            marca_id: control.get('marca_id')?.value || undefined,
            cantidad: control.get('cantidad')?.value,
            comentario: control.get('comentario')?.value || undefined,
            estado: control.get('estado')?.value ?? true
        }));

        const pedidoData: CreatePedidoDto = {
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
        this.store.select((state: any) => state.pedidos).subscribe((pedidosState: any) => {
            if (!pedidosState.loading && !pedidosState.error && this.loading) {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Pedido creado correctamente'
                });
                setTimeout(() => {
                    this.router.navigate(['/pedidos']);
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
        this.router.navigate(['/pedidos']);
    }

    /**
     * Verifica si un campo es inválido y ha sido tocado
     */
    isFieldInvalid(field: string): boolean {
        const control = this.pedidoForm.get(field);
        return !!(control && control.invalid && control.touched);
    }
}
