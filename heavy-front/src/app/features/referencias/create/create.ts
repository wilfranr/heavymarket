import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { createReferencia } from '../../../store/referencias/actions/referencias.actions';
import { CreateReferenciaDto } from '../../../core/models/referencia.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Articulo } from '../../../core/models/articulo.model';

/**
 * Componente de creación de referencia
 */
@Component({
    selector: 'app-referencia-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DividerModule],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);
    private readonly articuloService = inject(ArticuloService);

    referenciaForm!: FormGroup;
    loading = false;
    marcas: Lista[] = [];
    articulos: Articulo[] = [];

    ngOnInit(): void {
        this.initForm();
        this.cargarMarcas();
        this.cargarArticulos();
    }

    /**
     * Carga los artículos disponibles
     */
    cargarArticulos(): void {
        this.articuloService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.articulos = response.data;
            },
            error: (error) => {
                console.error('Error al cargar artículos:', error);
            }
        });
    }

    /**
     * Carga las marcas disponibles
     */
    cargarMarcas(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (items) => {
                this.marcas = items;
            },
            error: (error) => {
                console.error('Error al cargar marcas y fabricantes:', error);
            }
        });
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.referenciaForm = this.fb.group({
            referencia: ['', [Validators.required, Validators.maxLength(255)]],
            marca_id: [null],
            articulo_id: [null],
            comentario: ['', [Validators.maxLength(500)]]
        });
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.referenciaForm.invalid) {
            this.markFormGroupTouched(this.referenciaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.referenciaForm.value;
        const data: CreateReferenciaDto = {
            referencia: formValue.referencia,
            marca_id: formValue.marca_id || undefined,
            articulo_id: formValue.articulo_id || undefined,
            comentario: formValue.comentario || undefined
        };

        this.store.dispatch(createReferencia({ data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).referencias)
            .subscribe((referenciasState: any) => {
                if (!referenciasState.loading && !referenciasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/referencias']);
                } else if (!referenciasState.loading && referenciasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/referencias']);
    }

    /**
     * Marca todos los campos del formulario como touched
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((key) => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
