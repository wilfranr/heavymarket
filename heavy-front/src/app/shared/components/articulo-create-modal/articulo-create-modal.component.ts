import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';

import { ArticuloService } from '../../../core/services/articulo.service';
import { ListaService } from '../../../core/services/lista.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { Lista } from '../../../core/models/lista.model';
import { Referencia } from '../../../core/models/referencia.model';
import { ListaCreateModalComponent } from '../lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../referencia-create-modal/referencia-create-modal.component';

@Component({
    selector: 'app-articulo-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        InputGroupModule,
        InputGroupAddonModule,
        ToastModule,
        TextareaModule,
        InputNumberModule,
        ListaCreateModalComponent,
        ReferenciaCreateModalComponent
    ],
    providers: [MessageService],
    templateUrl: './articulo-create-modal.component.html'
})
export class ArticuloCreateModalComponent implements OnInit {
    @Input() visible = false;
    @Input() title = 'Crear Artículo';
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onArticuloCreated = new EventEmitter<any>();

    private readonly fb = inject(FormBuilder);
    private readonly articuloService = inject(ArticuloService);
    private readonly listaService = inject(ListaService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly messageService = inject(MessageService);

    articuloForm!: FormGroup;
    loading = false;

    // Listas para dropdowns
    tipos: Lista[] = [];
    referenciasDisponibles: Referencia[] = [];

    // Modales anidados
    showTipoModal = false;
    showReferenciaModal = false;
    currentReferenciaArrayIndex: number | null = null;

    // Tipo seleccionado para previsualización
    selectedTipoData: Lista | null = null;

    // Conversor de peso
    showWeightConverter = false;
    pesoOrigen: number | null = null;
    unidadOrigen = 'g';
    unidadesPeso = [
        { label: 'Gramos (gr)', value: 'g' },
        { label: 'Libras (lb)', value: 'lb' },
        { label: 'Onzas (oz)', value: 'oz' },
        { label: 'Toneladas (t)', value: 't' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarReferencias();
    }

    private initForm(): void {
        this.articuloForm = this.fb.group({
            definicion: [null, [Validators.required]],
            descripcionEspecifica: ['', [Validators.required, Validators.maxLength(500)]],
            peso: [null],
            comentarios: [''],
            referenciasCruzadas: this.fb.array([])
        });
    }

    get referenciasCruzadas(): FormArray {
        return this.articuloForm.get('referenciasCruzadas') as FormArray;
    }

    cargarTipos(search?: string): void {
        this.listaService.getByTipo('Piezas Estandar', search).subscribe({
            next: (tipos) => {
                this.tipos = tipos;
            },
            error: (error) => {
                console.error('Error al cargar tipos:', error);
            }
        });
    }

    onFilter(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarTipos(search);
        } else if (!search) {
            this.cargarTipos();
        }
    }

    onTipoChange(event: any): void {
        const nombre = event.value;
        if (nombre) {
            // Buscamos el objeto completo en la lista actual para la previsualización
            const found = this.tipos.find(t => t.nombre === nombre);
            if (found) {
                this.selectedTipoData = found;
                
                // Pre-diligenciar descripción específica si está vacía
                const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
                if (!currentDesc && found.definicion) {
                    this.articuloForm.patchValue({ descripcionEspecifica: found.definicion });
                }
            }
        } else {
            this.selectedTipoData = null;
        }
    }

    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos();
        
        const updates: any = { definicion: nuevoTipo.nombre };
        // Pre-diligenciar descripción específica si está vacía
        const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
        if (!currentDesc && nuevoTipo.definicion) {
            updates.descripcionEspecifica = nuevoTipo.definicion;
        }
        
        this.articuloForm.patchValue(updates);
        this.selectedTipoData = nuevoTipo;
        this.showTipoModal = false;
    }

    cargarReferencias(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                const nuevas = res.data;
                // Preservar las que ya están seleccionadas en el formulario
                const seleccionadasIds = this.referenciasCruzadas.value
                    .map((r: any) => r.referencia_id)
                    .filter((id: any) => id !== null);
                
                const yaCargadas = this.referenciasDisponibles.filter(r => seleccionadasIds.includes(r.id));
                
                const map = new Map();
                yaCargadas.forEach(r => map.set(r.id, r));
                nuevas.forEach((r: any) => map.set(r.id, r));
                
                this.referenciasDisponibles = Array.from(map.values());
            }
        });
    }

    onFilterReferencias(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarReferencias(search);
        } else if (!search) {
            this.cargarReferencias();
        }
    }

    getReferenciaDetail(id: number): Referencia | undefined {
        return this.referenciasDisponibles.find(r => r.id === id);
    }

    agregarReferencia(): void {
        const row = this.fb.group({
            referencia_id: [null, Validators.required]
        });
        this.referenciasCruzadas.push(row);
    }

    eliminarReferencia(index: number): void {
        this.referenciasCruzadas.removeAt(index);
    }

    abrirCrearReferencia(index: number): void {
        this.currentReferenciaArrayIndex = index;
        this.showReferenciaModal = true;
    }

    onReferenciaCreada(nuevaRef: any): void {
        // Añadir inmediatamente a la lista local para que el renderizado sea instantáneo
        if (nuevaRef && !this.referenciasDisponibles.find(r => r.id === nuevaRef.id)) {
            this.referenciasDisponibles = [...this.referenciasDisponibles, nuevaRef];
        }

        if (this.currentReferenciaArrayIndex !== null) {
            const control = this.referenciasCruzadas.at(this.currentReferenciaArrayIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
        }

        this.cargarReferencias(); // Sincronizar con el servidor en segundo plano
        this.showReferenciaModal = false;
        this.currentReferenciaArrayIndex = null;
    }

    abrirConversor(): void {
        this.showWeightConverter = true;
    }

    convertirPeso(): void {
        if (this.pesoOrigen === null) return;

        let pesoKg = 0;
        const valor = this.pesoOrigen;

        switch (this.unidadOrigen) {
            case 'g':
                pesoKg = valor / 1000;
                break;
            case 'lb':
                pesoKg = valor * 0.453592;
                break;
            case 'oz':
                pesoKg = valor * 0.0283495;
                break;
            case 't':
                pesoKg = valor * 1000;
                break;
            default:
                pesoKg = valor;
        }

        const resultado = Math.round(pesoKg * 1000) / 1000;
        this.articuloForm.patchValue({ peso: resultado });
        this.showWeightConverter = false;
        this.pesoOrigen = null;
    }

    saveArticulo(): void {
        if (this.articuloForm.invalid) {
            this.markFormGroupTouched(this.articuloForm);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validación',
                detail: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        this.loading = true;
        const formValue = this.articuloForm.value;

        const payload = {
            definicion: formValue.definicion,
            descripcionEspecifica: formValue.descripcionEspecifica,
            peso: formValue.peso || null,
            comentarios: formValue.comentarios || '',
            referencias_ids: formValue.referenciasCruzadas?.map((ref: any) => ref.referencia_id) || []
        };

        this.articuloService.create(payload).subscribe({
            next: (articulo) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Artículo creado correctamente'
                });
                this.onArticuloCreated.emit(articulo);
                this.closeDialog();
                this.loading = false;
            },
            error: (error) => {
                console.error('Error al crear artículo:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'No se pudo crear el artículo'
                });
                this.loading = false;
            }
        });
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
        this.articuloForm.reset();
        this.referenciasCruzadas.clear();
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
