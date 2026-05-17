import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';
import { ImageUploadComponent } from '../image-upload/image-upload.component';

@Component({
    selector: 'app-articulo-edit-modal',
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
        FallbackImageDirective,
        ListaCreateModalComponent,
        ReferenciaCreateModalComponent,
        ImageUploadComponent
    ],
    providers: [MessageService],
    templateUrl: './articulo-edit-modal.component.html'
})
export class ArticuloEditModalComponent implements OnInit, OnChanges {
    @Input() visible = false;
    @Input() title = 'Editar Artículo';
    @Input() articuloId: number | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onArticuloUpdated = new EventEmitter<any>();

    private readonly fb = inject(FormBuilder);
    private readonly articuloService = inject(ArticuloService);
    private readonly listaService = inject(ListaService);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

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

    // Archivos de imagen
    fotoFile: File | null = null;
    planoFile: File | null = null;
    fotoMedidaHeredada: string | null = null;

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarReferencias();
        if (this.articuloId) {
            this.cargarArticulo();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['articuloId'] && changes['articuloId'].currentValue) {
            this.cargarArticulo();
        }
        if (changes['visible'] && changes['visible'].currentValue && this.articuloId) {
            this.cargarArticulo();
        }
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

    cargarArticulo(): void {
        if (!this.articuloId) return;
        this.loading = true;
        this.articuloService.getById(this.articuloId).subscribe({
            next: (response) => {
                const articulo = response.data;
                this.articuloForm.patchValue({
                    definicion: articulo.definicion,
                    descripcionEspecifica: articulo.descripcionEspecifica,
                    peso: articulo.peso,
                    comentarios: articulo.comentarios
                });

                // Cargar referencias cruzadas existentes
                this.referenciasCruzadas.clear();
                if (articulo.referencias && articulo.referencias.length > 0) {
                    articulo.referencias.forEach((ref: any) => {
                        this.referenciasCruzadas.push(this.fb.group({
                            referencia_id: [ref.id || ref.referencia_id]
                        }));
                    });
                }

                // Cargar tipos y seleccionar el actual
                this.cargarTipos(articulo.definicion);

                // Heredar foto de medida si existe en el artículo o en el tipo
                this.fotoMedidaHeredada = articulo.foto_medida || null;
                if (!this.fotoMedidaHeredada && articulo.definicion) {
                    const tipoActual = this.tipos.find((t) => t.nombre === articulo.definicion);
                    if (tipoActual?.fotoMedida) {
                        this.fotoMedidaHeredada = tipoActual.fotoMedida;
                    }
                }

                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error al cargar artículo:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar el artículo'
                });
                this.loading = false;
            }
        });
    }

    cargarTipos(search?: string): void {
        this.listaService.getByTipo('Piezas Estandar', search).subscribe({
            next: (tipos) => {
                this.tipos = tipos;
                // Seleccionar el tipo actual si coincide
                const currentDef = this.articuloForm.get('definicion')?.value;
                if (currentDef) {
                    this.selectedTipoData = tipos.find((t) => t.nombre === currentDef) || null;
                }
                this.cdr.detectChanges();
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
            const found = this.tipos.find((t) => t.nombre === nombre);
            if (found) {
                this.selectedTipoData = found;
                this.fotoMedidaHeredada = found.fotoMedida || null;

                // Pre-diligenciar descripción específica si está vacía (mismo comportamiento que create)
                const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
                if (!currentDesc && found.nombre) {
                    this.articuloForm.patchValue({ descripcionEspecifica: found.nombre });
                }
            }
        } else {
            this.selectedTipoData = null;
            this.fotoMedidaHeredada = null;
        }
    }

    onFotoSelected(file: File): void {
        this.fotoFile = file;
    }

    onPlanoSelected(file: File): void {
        this.planoFile = file;
    }

    abrirCrearTipo(): void {
        this.showTipoModal = true;
    }

    onTipoCreado(nuevoTipo: any): void {
        this.cargarTipos();

        const updates: any = { definicion: nuevoTipo.nombre };
        // Pre-diligenciar descripción específica si está vacía
        const currentDesc = this.articuloForm.get('descripcionEspecifica')?.value;
        if (!currentDesc && nuevoTipo.nombre) {
            updates.descripcionEspecifica = nuevoTipo.nombre;
        }

        this.articuloForm.patchValue(updates);
        this.selectedTipoData = nuevoTipo;
        this.fotoMedidaHeredada = nuevoTipo.fotoMedida || null;
        this.showTipoModal = false;
    }

    cargarReferencias(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                const nuevas = res.data;
                const seleccionadasIds = this.referenciasCruzadas.value.map((r: any) => r.referencia_id).filter((id: any) => id !== null);
                const yaCargadas = this.referenciasDisponibles.filter((r) => seleccionadasIds.includes(r.id));

                const map = new Map();
                yaCargadas.forEach((r) => map.set(r.id, r));
                nuevas.forEach((r: any) => map.set(r.id, r));

                this.referenciasDisponibles = Array.from(map.values());
                this.cdr.detectChanges();
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
        return this.referenciasDisponibles.find((r) => r.id === id);
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
        if (nuevaRef && !this.referenciasDisponibles.find((r) => r.id === nuevaRef.id)) {
            this.referenciasDisponibles = [...this.referenciasDisponibles, nuevaRef];
        }

        if (this.currentReferenciaArrayIndex !== null) {
            const control = this.referenciasCruzadas.at(this.currentReferenciaArrayIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
        }

        this.cargarReferencias();
        this.showReferenciaModal = false;
        this.currentReferenciaArrayIndex = null;
    }

    saveArticulo(): void {
        if (this.articuloForm.invalid || !this.articuloId) {
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
        const referenciasIds = formValue.referenciasCruzadas?.map((ref: any) => ref.referencia_id) || [];

        if (this.fotoFile || this.planoFile) {
            const formData = new FormData();
            formData.append('definicion', formValue.definicion);
            formData.append('descripcionEspecifica', formValue.descripcionEspecifica);
            if (formValue.peso !== null && formValue.peso !== undefined) {
                formData.append('peso', String(formValue.peso));
            }
            formData.append('comentarios', formValue.comentarios || '');
            referenciasIds.forEach((id: number) => formData.append('referencias_ids[]', String(id)));
            if (this.fotoFile) formData.append('fotoDescriptiva', this.fotoFile);
            if (this.planoFile) formData.append('foto_medida', this.planoFile);

            this.articuloService.update(this.articuloId, formData).subscribe({
                next: (response) => this.handleUpdateSuccess(response.data),
                error: (error) => this.handleUpdateError(error)
            });
        } else {
            const payload = {
                definicion: formValue.definicion,
                descripcionEspecifica: formValue.descripcionEspecifica,
                peso: formValue.peso || null,
                comentarios: formValue.comentarios || '',
                referencias_ids: referenciasIds
            };

            this.articuloService.update(this.articuloId, payload).subscribe({
                next: (response) => this.handleUpdateSuccess(response.data),
                error: (error) => this.handleUpdateError(error)
            });
        }
    }

    private handleUpdateSuccess(articulo: any): void {
        this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Artículo actualizado correctamente'
        });
        this.onArticuloUpdated.emit(articulo);
        this.closeDialog();
        this.loading = false;
    }

    private handleUpdateError(error: any): void {
        console.error('Error al actualizar artículo:', error);
        this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.error?.message || 'No se pudo actualizar el artículo'
        });
        this.loading = false;
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
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
