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
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

import { loadListaById, updateLista } from '../../../store/listas/actions/listas.actions';
import { selectListaById } from '../../../store/listas/selectors/listas.selectors';
import { UpdateListaDto, ListaTipo } from '../../../core/models/lista.model';

/**
 * Componente de edición de lista
 * Formulario para editar un catálogo existente
 */
@Component({
    selector: 'app-lista-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule, DividerModule, ImageUploadComponent],
    providers: [MessageService],
    templateUrl: './edit.html'
    // styleUrl: './edit.scss'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);

    listaForm!: FormGroup;
    lista$!: Observable<any>;
    listaId!: number;

    tiposOptions = [
        { label: 'Marca', value: 'Marca' as ListaTipo },
        { label: 'Tipo de Máquina', value: 'Tipo de Máquina' as ListaTipo },
        { label: 'Tipo de Artículo', value: 'Tipo de Artículo' as ListaTipo },
        { label: 'Unidad de Medida', value: 'Unidad de Medida' as ListaTipo },
        { label: 'Tipo de Medida', value: 'Tipo de Medida' as ListaTipo },
        { label: 'Nombre de Medida', value: 'Nombre de Medida' as ListaTipo },
        { label: 'Piezas Estandar', value: 'Piezas Estandar' as ListaTipo }
    ];

    fotoFile: File | null = null;
    fotoMedidaFile: File | null = null;

    loading = false;

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.listaId = +params['id'];
            this.store.dispatch(loadListaById({ id: this.listaId }));
            this.lista$ = this.store.select(selectListaById(this.listaId));

            this.lista$.subscribe((lista) => {
                if (lista) {
                    this.initForm(lista);
                }
            });
        });
    }

    /**
     * Inicializa el formulario con los datos de la lista
     */
    private initForm(lista: any): void {
        this.listaForm = this.fb.group({
            tipo: [lista.tipo, [Validators.required]],
            nombre: [lista.nombre, [Validators.required, Validators.maxLength(255)]],
            definicion: [lista.definicion || '', [Validators.maxLength(1000)]],
            foto: [lista.foto || null],
            fotoMedida: [lista.fotoMedida || null],
            sistema_id: [lista.sistema_id || null]
        });
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onFotoMedidaSelected(file: File): void {
        this.fotoMedidaFile = file;
    }

    /**
     * Maneja el envío del formulario
     */
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
        if (formValue.sistema_id) formData.append('sistema_id', formValue.sistema_id);

        if (this.fotoFile) formData.append('foto', this.fotoFile);
        if (this.fotoMedidaFile) formData.append('fotoMedida', this.fotoMedidaFile);

        // El servicio manejará el _method: PUT si recibe FormData

        this.store.dispatch(updateLista({ id: this.listaId, data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).listas)
            .subscribe((listasState: any) => {
                if (!listasState.loading && !listasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/listas', this.listaId]);
                } else if (!listasState.loading && listasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/listas', this.listaId]);
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
