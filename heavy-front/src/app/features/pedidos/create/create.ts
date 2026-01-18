import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { createPedido } from '../../../store/pedidos/actions/pedidos.actions';
import { CreatePedidoDto, PedidoEstado } from '../../../core/models/pedido.model';
import { TerceroService } from '../../../core/services/tercero.service';

/**
 * Componente de creación de pedido
 * Formulario para crear un nuevo pedido
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
        InputTextModule,
        SelectModule,
        ToastModule,
        DividerModule
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

    pedidoForm!: FormGroup;
    terceros: any[] = [];
    maquinas: any[] = [];
    fabricantes: any[] = [];
    
    estadosOptions = [
        { label: 'Pendiente', value: 'pendiente' as PedidoEstado },
        { label: 'En Proceso', value: 'en_proceso' as PedidoEstado },
        { label: 'Completado', value: 'completado' as PedidoEstado },
        { label: 'Cancelado', value: 'cancelado' as PedidoEstado },
        { label: 'Entregado', value: 'entregado' as PedidoEstado }
    ];

    loading = false;

    ngOnInit(): void {
        this.initForm();
        this.loadTerceros();
    }

    /**
     * Inicializa el formulario con validaciones
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
     * Carga la lista de terceros (clientes)
     */
    private loadTerceros(): void {
        this.terceroService.list({ per_page: 100, tipo: 'cliente' })
            .subscribe({
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
    }

    /**
     * Envía el formulario para crear el pedido
     */
    onSubmit(): void {
        if (this.pedidoForm.valid) {
            this.loading = true;
            
            const pedidoData: CreatePedidoDto = this.pedidoForm.value;
            
            this.store.dispatch(createPedido({ pedido: pedidoData }));
            
            this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Pedido creado correctamente'
            });

            setTimeout(() => {
                this.loading = false;
                this.router.navigate(['/pedidos']);
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
