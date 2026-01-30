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

import { loadSistemaById, updateSistema } from '../../../store/sistemas/actions/sistemas.actions';
import { selectSistemaById } from '../../../store/sistemas/selectors/sistemas.selectors';
import { UpdateSistemaDto } from '../../../core/models/sistema.model';

/**
 * Componente de edición de sistema
 */
@Component({
    selector: 'app-sistema-edit',
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

    sistemaForm!: FormGroup;
    sistema$!: Observable<any>;
    sistemaId!: number;
    loading = false;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.sistemaId = +params['id'];
            this.store.dispatch(loadSistemaById({ id: this.sistemaId }));
            this.sistema$ = this.store.select(selectSistemaById(this.sistemaId));

            this.sistema$.subscribe((sistema) => {
                if (sistema) {
                    this.initForm(sistema);
                }
            });
        });
    }

    /**
     * Inicializa el formulario con los datos del sistema
     */
    private initForm(sistema: any): void {
        this.sistemaForm = this.fb.group({
            nombre: [sistema.nombre, [Validators.required, Validators.maxLength(255)]],
            descripcion: [sistema.descripcion || ''],
            imagen: [sistema.imagen || null]
        });
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.sistemaForm.invalid) {
            this.markFormGroupTouched(this.sistemaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.sistemaForm.value;
        const data: UpdateSistemaDto = {
            nombre: formValue.nombre,
            descripcion: formValue.descripcion || undefined,
            imagen: formValue.imagen || undefined
        };

        this.store.dispatch(updateSistema({ id: this.sistemaId, data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).sistemas)
            .subscribe((sistemasState: any) => {
                if (!sistemasState.loading && !sistemasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/sistemas', this.sistemaId]);
                } else if (!sistemasState.loading && sistemasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/sistemas', this.sistemaId]);
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
