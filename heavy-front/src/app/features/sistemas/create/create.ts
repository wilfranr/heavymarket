import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { createSistema } from '../../../store/sistemas/actions/sistemas.actions';
import { CreateSistemaDto } from '../../../core/models/sistema.model';

/**
 * Componente de creación de sistema
 */
@Component({
    selector: 'app-sistema-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, ToastModule, DividerModule, ImageUploadComponent],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    sistemaForm!: FormGroup;
    loading = false;
    imagenFile: File | null = null;

    ngOnInit(): void {
        this.initForm();
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.sistemaForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            descripcion: [''],
            imagen: [null]
        });
    }

    /**
     * Maneja la selección de imagen
     */
    onImagenSelected(file: any): void {
        this.imagenFile = file;
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
        const formData = new FormData();

        formData.append('nombre', formValue.nombre);
        if (formValue.descripcion) formData.append('descripcion', formValue.descripcion);

        if (this.imagenFile) {
            formData.append('imagen', this.imagenFile);
        } else if (formValue.imagen) {
            formData.append('imagen', formValue.imagen);
        }

        this.store.dispatch(createSistema({ data: formData as any }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).sistemas)
            .subscribe((sistemasState: any) => {
                if (!sistemasState.loading && !sistemasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/sistemas']);
                } else if (!sistemasState.loading && sistemasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/sistemas']);
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
