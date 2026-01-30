import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

import { loadMaquinaById, updateMaquina } from '../../../store/maquinas/actions/maquinas.actions';
import { selectMaquinaById } from '../../../store/maquinas/selectors/maquinas.selectors';
import { UpdateMaquinaDto } from '../../../core/models/maquina.model';
import { ListaService } from '../../../core/services/lista.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { Lista } from '../../../core/models/lista.model';
import { Fabricante } from '../../../core/models/fabricante.model';

/**
 * Componente de edición de máquina
 */
@Component({
    selector: 'app-maquina-edit',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, CardModule, ButtonModule, InputTextModule, SelectModule, ToastModule, DividerModule],
    providers: [MessageService],
    templateUrl: './edit.html'
})
export class EditComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly store = inject(Store);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly messageService = inject(MessageService);
    private readonly listaService = inject(ListaService);
    private readonly fabricanteService = inject(FabricanteService);

    maquinaForm!: FormGroup;
    maquina$!: Observable<any>;
    maquinaId!: number;
    loading = false;
    tipos: Lista[] = [];
    fabricantes: Fabricante[] = [];

    ngOnInit(): void {
        this.cargarTipos();
        this.cargarFabricantes();

        this.route.params.subscribe((params) => {
            this.maquinaId = +params['id'];
            this.store.dispatch(loadMaquinaById({ id: this.maquinaId }));
            this.maquina$ = this.store.select(selectMaquinaById(this.maquinaId));

            this.maquina$.subscribe((maquina) => {
                if (maquina) {
                    this.initForm(maquina);
                }
            });
        });
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
     * Inicializa el formulario con los datos de la máquina
     */
    private initForm(maquina: any): void {
        this.maquinaForm = this.fb.group({
            tipo: [maquina.tipo, [Validators.required]],
            modelo: [maquina.modelo, [Validators.required, Validators.maxLength(255)]],
            fabricante_id: [maquina.fabricante_id, [Validators.required]],
            serie: [maquina.serie || ''],
            arreglo: [maquina.arreglo || ''],
            foto: [maquina.foto || null],
            fotoId: [maquina.fotoId || null]
        });
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
        const data: UpdateMaquinaDto = {
            tipo: formValue.tipo,
            modelo: formValue.modelo,
            fabricante_id: formValue.fabricante_id,
            serie: formValue.serie || undefined,
            arreglo: formValue.arreglo || undefined,
            foto: formValue.foto || undefined,
            fotoId: formValue.fotoId || undefined
        };

        this.store.dispatch(updateMaquina({ id: this.maquinaId, data }));

        // Escuchar el resultado de la acción
        this.store
            .select((state) => (state as any).maquinas)
            .subscribe((maquinasState: any) => {
                if (!maquinasState.loading && !maquinasState.error && this.loading) {
                    this.loading = false;
                    this.router.navigate(['/app/maquinas', this.maquinaId]);
                } else if (!maquinasState.loading && maquinasState.error && this.loading) {
                    this.loading = false;
                }
            });
    }

    /**
     * Cancela y regresa al detalle
     */
    cancelar(): void {
        this.router.navigate(['/app/maquinas', this.maquinaId]);
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
