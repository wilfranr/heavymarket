import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { ListaCreateModalComponent } from '../../../shared/components/lista-create-modal/lista-create-modal.component';
import { createMaquina } from '../../../store/maquinas/actions/maquinas.actions';
import { CreateMaquinaDto } from '../../../core/models/maquina.model';
import { ListaService } from '../../../core/services/lista.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { Lista } from '../../../core/models/lista.model';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de creación de máquina
 */
@Component({
    selector: 'app-maquina-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        DividerModule,
        InputGroupModule,
        InputGroupAddonModule,
        ImageUploadComponent,
        ListaCreateModalComponent
    ],
    providers: [MessageService],
    templateUrl: './create.html'
})
export class CreateComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);
    private readonly fabricanteService = inject(FabricanteService);

    maquinaForm!: FormGroup;
    loading = false;
    tipos: Lista[] = [];
    fabricantes: Fabricante[] = [];

    showTipoModal = false;
    showFabricanteModal = false;

    fotoFile: File | null = null;
    fotoIdFile: File | null = null;

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarFabricantes();
    }

    /**
     * Carga los tipos de máquina disponibles
     */
    cargarTipos(): void {
        this.listaService.getByTipo('Tipo de Máquina').subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
    }

    /**
     * Carga los fabricantes disponibles
     */
    cargarFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data;
            },
            error: (error) => {
                console.error('Error al cargar fabricantes:', error);
            }
        });
    }

    /**
     * Abre el modal para crear un nuevo tipo de máquina
     */
    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    /**
     * Maneja la creación de un nuevo tipo de máquina
     */
    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos();
        this.maquinaForm.patchValue({ tipo: nuevoTipo.id });
    }

    /**
     * Inicializa el formulario con validaciones
     */
    private initForm(): void {
        this.maquinaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            modelo: ['', [Validators.required, Validators.maxLength(255)]],
            fabricante_id: [null, [Validators.required]],
            serie: ['', [Validators.maxLength(255)]],
            arreglo: ['', [Validators.maxLength(255)]],
            foto: [null],
            fotoId: [null]
        });
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onFotoIdSelected(file: File): void {
        this.fotoIdFile = file;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if (this.maquinaForm.invalid) {
            this.markFormGroupTouched(this.maquinaForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;

        const formValue = this.maquinaForm.value;
        const formData = new FormData();

        formData.append('tipo', formValue.tipo);
        formData.append('modelo', formValue.modelo);
        formData.append('fabricante_id', formValue.fabricante_id);
        if (formValue.serie) formData.append('serie', formValue.serie);
        if (formValue.arreglo) formData.append('arreglo', formValue.arreglo);

        if (this.fotoFile) formData.append('foto', this.fotoFile);
        if (this.fotoIdFile) formData.append('fotoId', this.fotoIdFile);

        this.store.dispatch(createMaquina({ data: formData }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).maquinas)
            .subscribe((maquinasState: any) => {
                if (!maquinasState.loading && !maquinasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/maquinas']);
                } else if (!maquinasState.loading && maquinasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa a la lista
     */
    cancelar(): void {
        this.router.navigate(['/app/maquinas']);
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
