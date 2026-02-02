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

import { createFabricante } from '../../../store/fabricantes/actions/fabricantes.actions';
import { CreateFabricanteDto } from '../../../core/models/fabricante.model';

/**
 * Componente de creación de fabricante
 */
@Component({
    selector: 'app-fabricante-create',
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

    fabricanteForm!: FormGroup;
    loading = false;
    logoFile: File | null = null;

    ngOnInit(): void {
        this.initForm();
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.fabricanteForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            descripcion: ['', [Validators.required, Validators.maxLength(500)]],
            logo: [null]
        });
    }

    onLogoSelected(file: File): void {
        this.logoFile = file;
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

        const formData = new FormData();

        formData.append('nombre', formValue.nombre);
        formData.append('descripcion', formValue.descripcion);
        if (this.logoFile) formData.append('logo', this.logoFile);

        this.store.dispatch(createFabricante({ data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).fabricantes)
            .subscribe((fabricantesState: any) => {
                if (!fabricantesState.loading && !fabricantesState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/fabricantes']);
                } else if (!fabricantesState.loading && fabricantesState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/fabricantes']);
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
