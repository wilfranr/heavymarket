import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, take } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';

import { updatePedido } from '../../../store/pedidos/actions/pedidos.actions';
import { Pedido, UpdatePedidoDto, PedidoEstado } from '../../../core/models/pedido.model';
import { selectPedidoById, selectPedidosLoading } from '../../../store/pedidos/selectors/pedidos.selectors';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de edición de pedido
 * Formulario para editar un pedido existente
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
        InputTextareaModule,
        DropdownModule,
        ToastModule,
        DividerModule,
        SkeletonModule
    ],
    providers: [MessageService],
    templateUrl: './edit.html',
    styleUrl: './edit.scss'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly terceroService = inject(TerceroService);

    pedidoForm!: FormGroup;
    pedido$!: Observable<Pedido | undefined>;
    loading$!: Observable<boolean>;
    
    pedidoId = signal<number>(0);
    terceros: any[] = [];
    
    estadosOptions = [
        { label: 'Pendiente', value: 'pendiente' as PedidoEstado },
        { label: 'En Proceso', value: 'en_proceso' as PedidoEstado },
        { label: 'Completado', value: 'completado' as PedidoEstado },
        { label: 'Cancelado', value: 'cancelado' as PedidoEstado },
        { label: 'Entregado', value: 'entregado' as PedidoEstado }
    ];

    submitting = false;

    ngOnInit(): void {
        this.initForm();
        this.loadPedido();
        this.loadTerceros();
    }

    /**
     * Inicializa el formulario
     */
    private initForm(): void {
        this.pedidoForm = this.fb.group({
            tercero_id: [null, [Validators.required]],
            direccion: ['', [Validators.maxLength(500)]],
            comentario: ['', [Validators.maxLength(1000)]],
            estado: ['pendiente' as PedidoEstado, [Validators.required]],
            maquina_id: [null],
            fabricante_id: [null],
            contacto_id: [null]
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
                    }
                });
        } else {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'ID de pedido inválido'
            });
            this.router.navigate(['/pedidos']);
        }
    }

    /**
     * Carga la lista de terceros
     */
    private loadTerceros(): void {
        this.terceroService.list({ per_page: 100, tipo: 'cliente' })
            .subscribe({
                next: (response) => {
                    this.terceros = response.data.map(t => ({
                        label: t.nombre,
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
    }

    /**
     * Envía el formulario para actualizar el pedido
     */
    onSubmit(): void {
        if (this.pedidoForm.valid) {
            this.submitting = true;
            
            const pedidoData: UpdatePedidoDto = this.pedidoForm.value;
            
            this.store.dispatch(updatePedido({ 
                id: this.pedidoId(), 
                pedido: pedidoData 
            }));
            
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Pedido actualizado correctamente'
            });

            setTimeout(() => {
                this.submitting = false;
                this.router.navigate(['/pedidos', this.pedidoId()]);
            }, 1500);
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Formulario inválido',
                detail: 'Por favor complete los campos requeridos'
            });
            Object.keys(this.pedidoForm.controls).forEach(key => {
                this.pedidoForm.get(key)?.markAsTouched();
            });
        }
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
}
