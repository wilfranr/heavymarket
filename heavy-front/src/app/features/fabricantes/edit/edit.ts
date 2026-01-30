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
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { loadFabricanteById, updateFabricante } from '../../../store/fabricantes/actions/fabricantes.actions';
import { selectFabricanteById } from '../../../store/fabricantes/selectors/fabricantes.selectors';
import { UpdateFabricanteDto } from '../../../core/models/fabricante.model';

/**
 * Componente de edición de fabricante
 */
@Component({
    selector: 'app-fabricante-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, ToastModule, DividerModule],
    providers: [MessageService],
    templateUrl: './edit.html'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    fabricanteForm!: FormGroup;
    fabricante$!: Observable<any>;
    fabricanteId!: number;
    loading = false;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.fabricanteId = +params['id'];
            this.store.dispatch(loadFabricanteById({ id: this.fabricanteId }));
            this.fabricante$ = this.store.select(selectFabricanteById(this.fabricanteId));

            this.fabricante$.subscribe((fabricante) => {
                if (fabricante) {
                    this.initForm(fabricante);
                }
            });
        });
    }

    /**
     * Inicializa el formulario con los datos del fabricante
     */
    private initForm(fabricante: any): void {
        this.fabricanteForm = this.fb.group({
            nombre: [fabricante.nombre, [Validators.required, Validators.maxLength(255)]],
            descripcion: [fabricante.descripcion, [Validators.required, Validators.maxLength(500)]],
            logo: [fabricante.logo || null]
        });
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.fabricanteForm.invalid) {
            this.markFormGroupTouched(this.fabricanteForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.fabricanteForm.value;
        const data: UpdateFabricanteDto = {
            nombre: formValue.nombre,
            descripcion: formValue.descripcion,
            logo: formValue.logo || undefined
        };

        this.store.dispatch(updateFabricante({ id: this.fabricanteId, data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).fabricantes)
            .subscribe((fabricantesState: any) => {
                if (!fabricantesState.loading && !fabricantesState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/fabricantes', this.fabricanteId]);
                } else if (!fabricantesState.loading && fabricantesState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/fabricantes', this.fabricanteId]);
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
