import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { createLista } from '../../../store/listas/actions/listas.actions';
import { CreateListaDto, ListaTipo } from '../../../core/models/lista.model';

/**
 * Componente de creación de lista
 * Formulario para crear un nuevo catálogo (marca, tipo de máquina, etc.)
 */
@Component({
    selector: 'app-lista-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        InputTextareaModule,
        SelectModule,
        ToastModule,
        DividerModule
    ],
    providers: [MessageService],
    templateUrl: './create.html',
    styleUrl: './create.scss'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);

    listaForm!: FormGroup;
    
    tiposOptions = [
        { label: 'Marca', value: 'Marca' as ListaTipo },
        { label: 'Tipo de Máquina', value: 'Tipo de Máquina' as ListaTipo },
        { label: 'Tipo de Artículo', value: 'Tipo de Artículo' as ListaTipo },
        { label: 'Unidad de Medida', value: 'Unidad de Medida' as ListaTipo },
        { label: 'Tipo de Medida', value: 'Tipo de Medida' as ListaTipo },
        { label: 'Nombre de Medida', value: 'Nombre de Medida' as ListaTipo },
    ];

    loading = false;

    ngOnInit(): void {
        this.initForm();
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.listaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            definicion: ['', [Validators.maxLength(1000)]],
            foto: [null],
            fotoMedida: [null],
            sistema_id: [null]
        });
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
        const data: CreateListaDto = {
            tipo: formValue.tipo,
            nombre: formValue.nombre,
            definicion: formValue.definicion || undefined,
            foto: formValue.foto || undefined,
            fotoMedida: formValue.fotoMedida || undefined,
            sistema_id: formValue.sistema_id || undefined,
        };

        this.store.dispatch(createLista({ data }));

        // Escuchar el resultado de la acción
        this.store.select(state => (state as any).listas).subscribe((listasState: any) => {
            if (!listasState.loading && !listasState.error && this.loading) {
                this.loading = false;
                this.router.navigate(['/listas']);
            } else if (!listasState.loading && listasState.error && this.loading) {
                this.loading = false;
            }
        });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/listas']);
    }

    /**
     * Marca todos los campos del formulario como touched
     */
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }
}
