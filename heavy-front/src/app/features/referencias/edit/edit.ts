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

import { loadReferenciaById, updateReferencia } from '../../../store/referencias/actions/referencias.actions';
import { selectReferenciaById } from '../../../store/referencias/selectors/referencias.selectors';
import { UpdateReferenciaDto } from '../../../core/models/referencia.model';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';

/**
 * Componente de edición de referencia
 */
@Component({
    selector: 'app-referencia-edit',
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

    referenciaForm!: FormGroup;
    referencia$!: Observable<any>;
    referenciaId!: number;
    loading = false;
    marcas: Lista[] = [];

    ngOnInit(): void {
        this.cargarMarcas();

        this.route.params.subscribe((params) => {
            this.referenciaId = +params['id'];
            this.store.dispatch(loadReferenciaById({ id: this.referenciaId }));
            this.referencia$ = this.store.select(selectReferenciaById(this.referenciaId));

            this.referencia$.subscribe((referencia) => {
                if (referencia) {
                    this.initForm(referencia);
                }
            });
        });
    }

    /**
     * Carga las marcas disponibles
     */
    cargarMarcas(): void {
        this.listaService.getByTipo('Marca').subscribe({
            next: (marcas) => {
                this.marcas = marcas;
            },
            error: (error) => {
                console.error('Error al cargar marcas:', error);
            }
        });
    }

    /**
     * Inicializa el formulario con los datos de la referencia
     */
    private initForm(referencia: any): void {
        this.referenciaForm = this.fb.group({
            referencia: [referencia.referencia, [Validators.required, Validators.maxLength(255)]],
            marca_id: [referencia.marca_id || null],
            comentario: [referencia.comentario || '', [Validators.maxLength(500)]]
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
        const data: UpdateReferenciaDto = {
            referencia: formValue.referencia,
            marca_id: formValue.marca_id || undefined,
            comentario: formValue.comentario || undefined
        };

        this.store.dispatch(updateReferencia({ id: this.referenciaId, data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).referencias)
            .subscribe((referenciasState: any) => {
                if (!referenciasState.loading && !referenciasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/referencias', this.referenciaId]);
                } else if (!referenciasState.loading && referenciasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/referencias', this.referenciaId]);
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
