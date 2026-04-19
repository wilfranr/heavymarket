import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { createEmpresa } from '../../../store/empresas/actions/empresas.actions';
import { CreateEmpresaDto } from '../../../core/models/empresa.model';
import { DividerModule } from 'primeng/divider';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Componente de creación de empresa
 */
@Component({
    selector: 'app-empresa-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule, ImageUploadComponent, DividerModule],
    providers: [MessageService],
    templateUrl: './create.component.html',
    styles: []
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    empresaForm!: FormGroup;
    loading = false;

    estadoOptions = [
        { label: 'Activa', value: true },
        { label: 'Inactiva', value: false }
    ];

    logoLightFile: File | null = null;
    logoDarkFile: File | null = null;

    ngOnInit(): void {
        this.initForm();
    }

    onLogoLightSelected(file: File): void {
        this.logoLightFile = file;
    }

    onLogoDarkSelected(file: File): void {
        this.logoDarkFile = file;
    }

    private initForm(): void {
        this.empresaForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(300)]],
            siglas: ['', [Validators.maxLength(10)]],
            direccion: ['', [Validators.required, Validators.maxLength(255)]],
            telefono: ['', [Validators.maxLength(255)]],
            celular: ['', [Validators.required, Validators.maxLength(255)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
            nit: ['', [Validators.required, Validators.maxLength(255)]],
            representante: ['', [Validators.required, Validators.maxLength(255)]],
            country_id: [null],
            state_id: [null],
            city_id: [null],
            estado: [false],
            flete: [2.2],
            trm: [0],
            logo_light: [null],
            logo_dark: [null]
        });
    }

    onSubmit(): void {
        if (this.empresaForm.invalid) {
            this.markFormGroupTouched(this.empresaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.empresaForm.value;

        const formData = new FormData();

        formData.append('nombre', formValue.nombre);
        if (formValue.siglas) formData.append('siglas', formValue.siglas);
        formData.append('direccion', formValue.direccion);
        if (formValue.telefono) formData.append('telefono', formValue.telefono);
        formData.append('celular', formValue.celular);
        formData.append('email', formValue.email);
        formData.append('nit', formValue.nit);
        formData.append('representante', formValue.representante);
        if (formValue.country_id) formData.append('country_id', formValue.country_id);
        if (formValue.state_id) formData.append('state_id', formValue.state_id);
        if (formValue.city_id) formData.append('city_id', formValue.city_id);
        formData.append('estado', formValue.estado ? '1' : '0');
        if (formValue.flete) formData.append('flete', formValue.flete);
        if (formValue.trm) formData.append('trm', formValue.trm);

        if (this.logoLightFile) formData.append('logo_light', this.logoLightFile);
        if (this.logoDarkFile) formData.append('logo_dark', this.logoDarkFile);

        this.store.dispatch(createEmpresa({ data: formData }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.empresas)
            .subscribe((empresasState: any) => {
                if (!empresasState.loading && this.loading) {
                    this.loading = false;
                    subscription.unsubscribe();

                    if (empresasState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: empresasState.error
                        });
                    } else {
                        this.router.navigate(['/app/empresas']);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/empresas']);
    }

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
