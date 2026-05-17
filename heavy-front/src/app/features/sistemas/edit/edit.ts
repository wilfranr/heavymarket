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
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { loadSistemaById, updateSistema } from '../../../store/sistemas/actions/sistemas.actions';
import { selectSistemaById } from '../../../store/sistemas/selectors/sistemas.selectors';
import { Sistema } from '../../../core/models/sistema.model';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';

/**
 * Componente de edición de sistema
 */
@Component({
    selector: 'app-sistema-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, MultiSelectModule, ToastModule, DividerModule, ImageUploadComponent],
    providers: [MessageService],
    templateUrl: './edit.html'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);

    sistemaForm!: FormGroup;
    sistema$!: Observable<Sistema | null>;
    sistemaId!: number;
    loading = false;
    imagenFile: File | null = null;
    previewUrl: string | null = null;

    tiposArticuloOptions: { label: string; value: number }[] = [];
    private formInitialized = false;

    ngOnInit(): void {
        this.loadTiposArticuloCatalog();

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

    private loadTiposArticuloCatalog(): void {
        this.listaService.getAll({ tipo: 'Tipo de Artículo', per_page: 500, sort_by: 'nombre', sort_order: 'asc' }).subscribe({
            next: (response) => {
                this.tiposArticuloOptions = response.data.map((lista) => ({
                    label: lista.nombre,
                    value: lista.id
                }));
            }
        });
    }

    private initForm(sistema: Sistema): void {
        if (this.formInitialized) {
            return;
        }
        this.formInitialized = true;

        this.previewUrl = sistema.imagen;
        const listaIds = (sistema.articulos ?? []).map((a) => a.id);

        this.sistemaForm = this.fb.group({
            nombre: [sistema.nombre, [Validators.required, Validators.maxLength(255)]],
            descripcion: [sistema.descripcion || ''],
            imagen: [sistema.imagen || null],
            lista_ids: [listaIds]
        });
    }

    onImagenSelected(file: File): void {
        this.imagenFile = file;
    }

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
        }

        const listaIds: number[] = formValue.lista_ids ?? [];

        this.sistemaService.syncTiposArticulo(this.sistemaId, { lista_ids: listaIds }).subscribe({
            next: () => {
                this.store.dispatch(updateSistema({ id: this.sistemaId, data: formData }));

                this.store
                    .select((state) => (state as { sistemas: { loading: boolean; error: string | null } }).sistemas)
                    .subscribe((sistemasState) => {
                        if (!sistemasState.loading && !sistemasState.error && this.loading) {
                            this.loading = false;
                            this.store.dispatch(loadSistemaById({ id: this.sistemaId }));
                            this.router.navigate(['/app/sistemas', this.sistemaId]);
                        } else if (!sistemasState.loading && sistemasState.error && this.loading) {
                            this.loading = false;
                        }
                    });
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron guardar los tipos de artículo'
                });
            }
        });
    }

    cancelar(): void {
        this.router.navigate(['/app/sistemas', this.sistemaId]);
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
