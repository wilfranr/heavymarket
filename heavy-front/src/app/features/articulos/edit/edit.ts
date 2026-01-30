import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { loadArticuloById, updateArticulo } from '../../../store/articulos/actions/articulos.actions';
import { selectArticuloById } from '../../../store/articulos/selectors/articulos.selectors';
import { UpdateArticuloDto } from '../../../core/models/articulo.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';

/**
 * Componente de edición de artículo
 */
@Component({
    selector: 'app-articulo-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DividerModule],
    providers: [MessageService],
    templateUrl: './edit.html'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);

    articuloForm!: FormGroup;
    articulo$!: Observable<any>;
    articuloId!: number;
    loading = false;
    tipos: Lista[] = [];

    ngOnInit(): void {
        this.cargarTipos();

        this.route.params.subscribe((params) => {
            this.articuloId = +params['id'];
            this.store.dispatch(loadArticuloById({ id: this.articuloId }));
            this.articulo$ = this.store.select(selectArticuloById(this.articuloId));

            this.articulo$.subscribe((articulo) => {
                if (articulo) {
                    this.initForm(articulo);
                }
            });
        });
    }

    /**
     * Carga los tipos de artículo disponibles
     */
    cargarTipos(): void {
        this.listaService.getByTipo('Pieza Estandar').subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
    }

    /**
     * Inicializa el formulario con los datos del artículo
     */
    private initForm(articulo: any): void {
        this.articuloForm = this.fb.group({
            definicion: [articulo.definicion, [Validators.required, Validators.maxLength(255)]],
            descripcionEspecifica: [articulo.descripcionEspecifica, [Validators.required, Validators.maxLength(500)]],
            peso: [articulo.peso || null],
            comentarios: [articulo.comentarios || ''],
            fotoDescriptiva: [articulo.fotoDescriptiva || null],
            foto_medida: [articulo.foto_medida || null]
        });
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.articuloForm.invalid) {
            this.markFormGroupTouched(this.articuloForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.articuloForm.value;
        const data: UpdateArticuloDto = {
            definicion: formValue.definicion,
            descripcionEspecifica: formValue.descripcionEspecifica,
            peso: formValue.peso || undefined,
            comentarios: formValue.comentarios || undefined,
            fotoDescriptiva: formValue.fotoDescriptiva || undefined,
            foto_medida: formValue.foto_medida || undefined
        };

        this.store.dispatch(updateArticulo({ id: this.articuloId, data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).articulos)
            .subscribe((articulosState: any) => {
                if (!articulosState.loading && !articulosState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/articulos', this.articuloId]);
                } else if (!articulosState.loading && articulosState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/articulos', this.articuloId]);
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
