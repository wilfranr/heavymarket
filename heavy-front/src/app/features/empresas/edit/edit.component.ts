import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { updateEmpresa, loadEmpresaById } from '../../../store/empresas/actions/empresas.actions';
import * as EmpresasSelectors from '../../../store/empresas/selectors/empresas.selectors';
import { UpdateEmpresaDto } from '../../../core/models/empresa.model';
import { DividerModule } from 'primeng/divider';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Componente de edición de empresa
 */
@Component({
    selector: 'app-empresa-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule, ToastModule, ImageUploadComponent, DividerModule],
    providers: [MessageService],
    templateUrl: './edit.component.html',
    styles: []
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    empresaForm!: FormGroup;
    empresaId = signal<number>(0);
    loading = signal(true);
    saving = signal(false);

    estadoOptions = [
        { label: 'Activa', value: true },
        { label: 'Inactiva', value: false }
    ];

    logoLightFile: File | null = null;
    logoDarkFile: File | null = null;

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.empresaId.set(+id);
            this.loadEmpresa(+id);
        }
    }

    onLogoLightSelected(file: File): void {
        this.logoLightFile = file;
    }

    onLogoDarkSelected(file: File): void {
        this.logoDarkFile = file;
    }

    private loadEmpresa(id: number): void {
        this.store.dispatch(loadEmpresaById({ id }));

        this.store.select(EmpresasSelectors.selectEmpresaById(id)).subscribe((empresa) => {
            if (empresa) {
                this.initForm(empresa);
                this.loading.set(false);
            }
        });

        // También escuchar errores
        this.store.select(EmpresasSelectors.selectEmpresasError).subscribe((error) => {
            if (error) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error
                });
                this.loading.set(false);
            }
        });
    }

    private initForm(empresa: any): void {
        this.empresaForm = this.fb.group({
            nombre: [empresa.nombre || ''],
            siglas: [empresa.siglas || ''],
            direccion: [empresa.direccion || ''],
            telefono: [empresa.telefono || ''],
            celular: [empresa.celular || ''],
            email: [empresa.email || ''],
            nit: [empresa.nit || ''],
            representante: [empresa.representante || ''],
            flete: [empresa.flete || 2.2],
            trm: [empresa.trm || 0],
            estado: [empresa.estado || false],
            logo_light: [empresa.logo_light || null],
            logo_dark: [empresa.logo_dark || null]
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

        this.saving.set(true);

        const formValue = this.empresaForm.value;
        const formData = new FormData();

        if (formValue.nombre) formData.append('nombre', formValue.nombre);
        if (formValue.siglas) formData.append('siglas', formValue.siglas);
        if (formValue.direccion) formData.append('direccion', formValue.direccion);
        if (formValue.telefono) formData.append('telefono', formValue.telefono);
        if (formValue.celular) formData.append('celular', formValue.celular);
        if (formValue.email) formData.append('email', formValue.email);
        if (formValue.nit) formData.append('nit', formValue.nit);
        if (formValue.representante) formData.append('representante', formValue.representante);
        if (formValue.flete) formData.append('flete', formValue.flete);
        if (formValue.trm) formData.append('trm', formValue.trm);
        formData.append('estado', formValue.estado ? '1' : '0');

        if (this.logoLightFile) formData.append('logo_light', this.logoLightFile);
        if (this.logoDarkFile) formData.append('logo_dark', this.logoDarkFile);

        this.store.dispatch(updateEmpresa({ id: this.empresaId(), data: formData }));

        // Escuchar el resultado
        const subscription = this.store
            .select((state: any) => state.empresas)
            .subscribe((empresasState: any) => {
                if (!empresasState.loading && this.saving()) {
                    this.saving.set(false);
                    subscription.unsubscribe();

                    if (empresasState.error) {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: empresasState.error
                        });
                    } else {
                        this.router.navigate(['/app/empresas', this.empresaId()]);
                    }
                }
            });
    }

    onCancel(): void {
        this.router.navigate(['/app/empresas', this.empresaId()]);
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
