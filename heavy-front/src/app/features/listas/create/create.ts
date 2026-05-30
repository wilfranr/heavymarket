import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { createLista } from '../../../store/listas/actions/listas.actions';
import { ListaTipo } from '../../../core/models/lista.model';
import { SistemaService } from '../../../core/services/sistema.service';
import { SistemaSelectOption } from '../../../core/models/sistema.model';
import { appendSistemaIdsToFormData } from '../../../core/utils/lista-form-data.util';

/**
 * Componente de creación de lista
 * Formulario para crear un nuevo catálogo (marca, tipo de máquina, etc.)
 */
@Component({
    selector: 'app-lista-create',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, MultiSelectModule, ToastModule, DividerModule, SkeletonModule, ImageUploadComponent],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly sistemaService = inject(SistemaService);

    listaForm!: FormGroup;

    readonly sistemasCatalog = toSignal(
        this.sistemaService.getAll({ per_page: 200, sort_by: 'nombre', sort_order: 'asc' }).pipe(
            map((response) => ({
                ready: true,
                options: response.data.map(
                    (s): SistemaSelectOption => ({
                        label: s.nombre,
                        value: s.id
                    })
                )
            }))
        ),
        { initialValue: { ready: false, options: [] as SistemaSelectOption[] } }
    );

    tiposOptions = [
        { label: 'Marca', value: 'Marca' as ListaTipo },
        { label: 'Tipo de Máquina', value: 'Tipo de Máquina' as ListaTipo },
        { label: 'Tipo de Artículo', value: 'Tipo de Artículo' as ListaTipo },
        { label: 'Categoría Comercial', value: 'Categoría Comercial' as ListaTipo },
        { label: 'Unidad de Medida', value: 'Unidad de Medida' as ListaTipo },
        { label: 'Tipo de Medida', value: 'Tipo de Medida' as ListaTipo },
        { label: 'Nombre de Medida', value: 'Nombre de Medida' as ListaTipo },
        { label: 'Piezas Estandar', value: 'Piezas Estandar' as ListaTipo }
    ];

    fotoFile: File | null = null;
    fotoMedidaFile: File | null = null;

    loading = false;

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.listaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            definicion: ['', [Validators.maxLength(1000)]],
            foto: [null],
            fotoMedida: [null],
            sistema_ids: [[] as number[]]
        });
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onFotoMedidaSelected(file: File): void {
        this.fotoMedidaFile = file;
    }

    onSubmit(): void {
        if (this.listaForm.invalid) {
            this.markFormGroupTouched(this.listaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.listaForm.value;
        const formData = new FormData();

        formData.append('tipo', formValue.tipo);
        formData.append('nombre', formValue.nombre);
        if (formValue.definicion) formData.append('definicion', formValue.definicion);

        if (formValue.tipo === 'Tipo de Artículo') {
            appendSistemaIdsToFormData(formData, formValue.sistema_ids ?? []);
        }

        if (this.fotoFile) formData.append('foto', this.fotoFile);
        if (this.fotoMedidaFile) formData.append('fotoMedida', this.fotoMedidaFile);

        this.store.dispatch(createLista({ data: formData }));

        this.store
            .select((state) => (state as { listas: { loading: boolean; error: string | null } }).listas)
            .subscribe((listasState) => {
                if (!listasState.loading && !listasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/listas']);
                } else if (!listasState.loading && listasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    cancelar(): void {
        this.router.navigate(['/app/listas']);
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
