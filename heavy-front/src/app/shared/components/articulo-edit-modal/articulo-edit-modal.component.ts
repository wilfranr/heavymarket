import { Component, EventEmitter, Input, OnInit, Output, inject, OnChanges, SimpleChanges, ChangeDetectorRef, signal } from '@angular/core';
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
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

import { ArticuloService } from '../../../core/services/articulo.service';
import { ListaService } from '../../../core/services/lista.service';
import { ReferenciaService } from '../../../core/services/referencia.service';
import { Lista, ListaTipo } from '../../../core/models/lista.model';
import { Referencia } from '../../../core/models/referencia.model';
import { ListaCreateModalComponent } from '../lista-create-modal/lista-create-modal.component';
import { ReferenciaCreateModalComponent } from '../referencia-create-modal/referencia-create-modal.component';
import { FallbackImageDirective } from '../../../core/directives/fallback-image.directive';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { AutoFocusDirective } from '../../directives/auto-focus.directive';

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
        TabsModule,
        TagModule,
        FallbackImageDirective,
        ListaCreateModalComponent,
        ReferenciaCreateModalComponent,
        ImageUploadComponent,
        AutoFocusDirective
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
    referenciasJuegosDisponibles: Referencia[] = [];
    referenciaJuegosIndex: number | null = null;

    // Edición y creación inline de referencias
    editingReferenciaIndex = signal<number | null>(null);
    creatingReferenciaIndex = signal<number | null>(null);
    editingReferenciaJuegoIndex = signal<number | null>(null);
    marcasReferencias = signal<Lista[]>([]);

    // Variables para el CRUD de medidas
    unidadesMedida = signal<Lista[]>([]);
    tiposMedida = signal<Lista[]>([]);
    medidasLocales: any[] = [];
    showMedidaDialog = false;
    isEditingMedida = false;
    medidaData: any = { identificador: '', unidad: '', valor: null, tipo: '' };
    editingMedidaId: number | null = null;

    // Modales anidados
    showTipoModal = false;
    showListaModal = false;
    currentListaTipo: ListaTipo = 'Unidad de Medida';
    showReferenciaModal = false;

    // Tipo seleccionado para previsualización
    selectedTipoData: Lista | null = null;

    // Archivos de imagen
    fotoFile: File | null = null;
    planoFile: File | null = null;
    fotoMedidaHeredada: string | null = null;

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

    // Término de búsqueda para referencias cruzadas
    searchTermReferences = '';

    articuloActual: any = null;

    ngOnInit(): void {
        this.initForm();
        this.cargarTipos();
        this.cargarReferencias();
        this.cargarReferenciasJuegos();
        this.cargarListasMedidas();
        this.cargarMarcasReferencias();
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
            peso: [null, [Validators.required, Validators.min(0)]],
            comentarios: [''],
            referenciasCruzadas: this.fb.array([]),
            articuloJuegos: this.fb.array([])
        });
    }

    get referenciasCruzadas(): FormArray {
        return this.articuloForm.get('referenciasCruzadas') as FormArray;
    }

    get articuloJuegos(): FormArray {
        return this.articuloForm.get('articuloJuegos') as FormArray;
    }

    cargarArticulo(): void {
        if (!this.articuloId) return;
        this.loading = true;
        this.articuloService.getById(this.articuloId).subscribe({
            next: (response) => {
                const articulo = response.data;
                this.articuloActual = articulo;
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
                        const exists = this.referenciasDisponibles.find((d) => d.id === ref.id);
                        if (!exists) {
                            this.referenciasDisponibles = [...this.referenciasDisponibles, ref];
                        }
                        this.referenciasCruzadas.push(
                            this.fb.group({
                                referencia_id: [ref.id || ref.referencia_id, Validators.required]
                            })
                        );
                    });
                }

                // Cargar juegos existentes en el FormArray
                this.articuloJuegos.clear();
                if (articulo.articuloJuegos && articulo.articuloJuegos.length > 0) {
                    articulo.articuloJuegos.forEach((aj: any) => {
                        if (aj.referencia) {
                            const exists = this.referenciasJuegosDisponibles.find((d) => d.id === aj.referencia.id);
                            if (!exists) {
                                this.referenciasJuegosDisponibles = [...this.referenciasJuegosDisponibles, aj.referencia];
                            }
                        }
                        this.articuloJuegos.push(
                            this.fb.group({
                                referencia_id: [aj.referencia_id, Validators.required],
                                cantidad: [aj.cantidad, [Validators.required, Validators.min(1)]],
                                comentario: [aj.comentario || '']
                            })
                        );
                    });
                }

                // Cargar medidas existentes
                this.medidasLocales = articulo.medidas || [];

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

    onReferenciaCreada(nuevaRef: any): void {
        if (nuevaRef) {
            if (!this.referenciasDisponibles.find((r) => r.id === nuevaRef.id)) {
                this.referenciasDisponibles = [...this.referenciasDisponibles, nuevaRef];
            }
            if (!this.referenciasJuegosDisponibles.find((r) => r.id === nuevaRef.id)) {
                this.referenciasJuegosDisponibles = [...this.referenciasJuegosDisponibles, nuevaRef];
            }
        }

        if (this.referenciaJuegosIndex !== null) {
            const control = this.articuloJuegos.at(this.referenciaJuegosIndex);
            control.patchValue({ referencia_id: nuevaRef.id });
            this.referenciaJuegosIndex = null;
        }

        this.cargarReferencias();
        this.cargarReferenciasJuegos();
        this.showReferenciaModal = false;
    }

    cargarListasMedidas(): void {
        this.listaService.getByTipo('Unidad de Medida').subscribe((res) => this.unidadesMedida.set(res));
        this.listaService.getByTipo('Tipo de Medida').subscribe((res) => this.tiposMedida.set(res));
    }

    abrirDialogoMedida(): void {
        this.isEditingMedida = false;
        this.medidaData = { identificador: '', unidad: '', valor: null, tipo: '' };
        this.showMedidaDialog = true;
    }

    editarMedida(medida: any): void {
        this.isEditingMedida = true;
        this.editingMedidaId = medida.id;
        this.medidaData = { ...medida };
        this.showMedidaDialog = true;
    }

    guardarMedida(): void {
        if (!this.articuloId) return;

        if (this.isEditingMedida && this.editingMedidaId) {
            this.articuloService.updateMedida(this.articuloId, this.editingMedidaId, this.medidaData).subscribe(() => {
                this.cargarArticulo();
                this.showMedidaDialog = false;
            });
        } else {
            this.articuloService.addMedida(this.articuloId, this.medidaData).subscribe(() => {
                this.cargarArticulo();
                this.showMedidaDialog = false;
            });
        }
    }

    eliminarMedida(medida: any): void {
        if (!this.articuloId) return;

        this.articuloService.removeMedida(this.articuloId, medida.id).subscribe(() => {
            this.cargarArticulo();
        });
    }

    shouldShowReference(id: number): boolean {
        if (!this.searchTermReferences) return true;

        const ref = this.getReferenciaDetail(id);
        if (!ref) return false;

        const term = this.searchTermReferences.toLowerCase();
        return ref.referencia.toLowerCase().includes(term) || ref.marca?.nombre?.toLowerCase().includes(term) || false;
    }

    agregarJuego(): void {
        const row = this.fb.group({
            referencia_id: [null, Validators.required],
            cantidad: [1, [Validators.required, Validators.min(1)]],
            comentario: ['']
        });
        this.articuloJuegos.push(row);
    }

    eliminarJuego(index: number): void {
        this.articuloJuegos.removeAt(index);
    }

    cargarReferenciasJuegos(search?: string): void {
        this.referenciaService.getAll({ search, per_page: 50 }).subscribe({
            next: (res) => {
                const nuevas = res.data;
                const actuales = this.articuloActual?.articuloJuegos?.map((aj: any) => aj.referencia).filter(Boolean) || [];

                const map = new Map<number, Referencia>();
                actuales.forEach((r: any) => map.set(r.id, r));
                nuevas.forEach((r: Referencia) => map.set(r.id, r));

                this.referenciasJuegosDisponibles = Array.from(map.values());
            }
        });
    }

    onFilterReferenciasJuegos(event: any): void {
        const search = event.filter;
        if (search && search.length >= 3) {
            this.cargarReferenciasJuegos(search);
        } else if (!search) {
            this.cargarReferenciasJuegos();
        }
    }

    abrirCrearLista(tipo: ListaTipo): void {
        this.currentListaTipo = tipo;
        this.showListaModal = true;
    }

    onListaGeneralCreated(nueva: any): void {
        this.cargarListasMedidas();

        if (this.currentListaTipo === 'Unidad de Medida') {
            this.medidaData.unidad = nueva.nombre;
        } else if (this.currentListaTipo === 'Tipo de Medida') {
            this.medidaData.tipo = nueva.nombre;
        }

        this.showListaModal = false;
    }

    abrirCrearReferenciaJuegos(index: number): void {
        this.referenciaJuegosIndex = index;
        this.showReferenciaModal = true;
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
        const referenciasIds = this.articuloForm.get('referenciasCruzadas')?.value?.map((ref: any) => ref.referencia_id) || [];

        if (referenciasIds.length === 0) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validación',
                detail: 'Debe asociar al menos una referencia al artículo'
            });
            return;
        }

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

        const formData = new FormData();
        formData.append('definicion', formValue.definicion);
        formData.append('descripcionEspecifica', formValue.descripcionEspecifica);
        if (formValue.peso !== null && formValue.peso !== undefined) {
            formData.append('peso', String(formValue.peso));
        }
        formData.append('comentarios', formValue.comentarios || '');

        referenciasIds.forEach((id: number) => {
            formData.append('referencias_ids[]', id.toString());
        });

        if (this.fotoFile) formData.append('fotoDescriptiva', this.fotoFile);
        if (this.planoFile) formData.append('foto_medida', this.planoFile);

        const juegosValores = this.articuloForm.get('articuloJuegos')?.value || [];
        formData.append('juegos', JSON.stringify(juegosValores));

        this.articuloService.update(this.articuloId, formData).subscribe({
            next: (response) => this.handleUpdateSuccess(response.data),
            error: (error) => this.handleUpdateError(error)
        });
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
        this.articuloForm.reset();
        this.referenciasCruzadas.clear();
        this.articuloJuegos.clear();
        this.medidasLocales = [];
        this.fotoFile = null;
        this.planoFile = null;
        this.fotoMedidaHeredada = null;
    }

    cargarMarcasReferencias(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe((res) => this.marcasReferencias.set(res));
    }

    iniciarEdicionReferencia(index: number): void {
        const referencia = this.getReferenciaDetail(this.referenciasCruzadas.at(index)?.get('referencia_id')?.value);
        if (!referencia) {
            return;
        }

        this.cancelarEdicionReferencia();
        this.cancelarCreacionReferencia();

        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.addControl('referencia', this.fb.control(referencia.referencia, [Validators.required, Validators.maxLength(255)]));
        row.addControl('marca_id', this.fb.control(referencia.marca_id));
        this.editingReferenciaIndex.set(index);
    }

    guardarEdicionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        const referenciaId = row.get('referencia_id')?.value;

        if (!referenciaId || row.get('referencia')?.invalid) {
            row.get('referencia')?.markAsTouched();
            return;
        }

        const actual = this.getReferenciaDetail(referenciaId);
        const data = {
            referencia: row.get('referencia')?.value,
            marca_id: row.get('marca_id')?.value ?? null,
            articulo_id: actual?.articulo_id ?? null,
            comentario: actual?.comentario ?? null
        };

        this.referenciaService.update(referenciaId, data).subscribe({
            next: ({ data: actualizada }) => {
                this.referenciasDisponibles = this.actualizarReferenciaEnLista(this.referenciasDisponibles, actualizada);
                this.referenciasJuegosDisponibles = this.actualizarReferenciaEnLista(this.referenciasJuegosDisponibles, actualizada);

                if (this.articuloActual?.referencias) {
                    this.articuloActual = {
                        ...this.articuloActual,
                        referencias: this.actualizarReferenciaEnLista(this.articuloActual.referencias, actualizada)
                    };
                }

                this.finalizarEdicionReferencia(index);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Referencia actualizada',
                    detail: 'Los cambios se guardaron correctamente.'
                });
            }
        });
    }

    cancelarEdicionReferencia(): void {
        const index = this.editingReferenciaIndex();
        if (index !== null) {
            this.finalizarEdicionReferencia(index);
        }
    }

    private finalizarEdicionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.removeControl('referencia');
        row.removeControl('marca_id');
        this.editingReferenciaIndex.set(null);
    }

    iniciarCreacionReferencia(index: number): void {
        this.cancelarEdicionReferencia();
        this.cancelarCreacionReferencia();

        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.addControl('referencia', this.fb.control('', [Validators.required, Validators.maxLength(255)]));
        row.addControl('marca_id', this.fb.control(null));
        this.creatingReferenciaIndex.set(index);
    }

    guardarCreacionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        const referenciaControl = row.get('referencia');

        if (referenciaControl?.invalid) {
            referenciaControl.markAsTouched();
            return;
        }

        const data = {
            referencia: referenciaControl?.value,
            marca_id: row.get('marca_id')?.value ?? null,
            articulo_id: this.articuloId ?? null,
            comentario: null
        };

        this.referenciaService.create(data).subscribe({
            next: ({ data: creada }) => {
                if (!this.referenciasDisponibles.some((referencia) => referencia.id === creada.id)) {
                    this.referenciasDisponibles = [...this.referenciasDisponibles, creada];
                }
                row.patchValue({ referencia_id: creada.id });
                this.finalizarCreacionReferencia(index);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Referencia creada',
                    detail: 'La referencia se creó y asoció correctamente.'
                });
            },
            error: (error) => {
                console.error('Error al crear referencia:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'No se pudo crear la referencia'
                });
            }
        });
    }

    cancelarCreacionReferencia(): void {
        const index = this.creatingReferenciaIndex();
        if (index !== null) {
            this.finalizarCreacionReferencia(index);
        }
    }

    private finalizarCreacionReferencia(index: number): void {
        const row = this.referenciasCruzadas.at(index) as FormGroup;
        row.removeControl('referencia');
        row.removeControl('marca_id');
        this.creatingReferenciaIndex.set(null);
    }

    private actualizarReferenciaEnLista(referencias: Referencia[], actualizada: Referencia): Referencia[] {
        const existe = referencias.some((referencia) => referencia.id === actualizada.id);
        if (existe) {
            return referencias.map((referencia) => (referencia.id === actualizada.id ? actualizada : referencia));
        }
        return referencias;
    }

    iniciarEdicionReferenciaJuego(index: number): void {
        const referencia = this.getReferenciaJuegoDetail(this.articuloJuegos.at(index)?.get('referencia_id')?.value);
        if (!referencia) {
            return;
        }

        this.cancelarEdicionReferenciaJuego();

        const row = this.articuloJuegos.at(index) as FormGroup;
        row.addControl('referencia', this.fb.control(referencia.referencia, [Validators.required, Validators.maxLength(255)]));
        row.addControl('marca_id', this.fb.control(referencia.marca_id));
        this.editingReferenciaJuegoIndex.set(index);
    }

    guardarEdicionReferenciaJuego(index: number): void {
        const row = this.articuloJuegos.at(index) as FormGroup;
        const referenciaId = row.get('referencia_id')?.value;

        if (!referenciaId || row.get('referencia')?.invalid) {
            row.get('referencia')?.markAsTouched();
            return;
        }

        const actual = this.getReferenciaJuegoDetail(referenciaId);
        const data = {
            referencia: row.get('referencia')?.value,
            marca_id: row.get('marca_id')?.value ?? null,
            articulo_id: actual?.articulo_id ?? null,
            comentario: actual?.comentario ?? null
        };

        this.referenciaService.update(referenciaId, data).subscribe({
            next: ({ data: actualizada }) => {
                this.referenciasDisponibles = this.actualizarReferenciaEnLista(this.referenciasDisponibles, actualizada);
                this.referenciasJuegosDisponibles = this.actualizarReferenciaEnLista(this.referenciasJuegosDisponibles, actualizada);

                if (this.articuloActual?.referencias) {
                    this.articuloActual = {
                        ...this.articuloActual,
                        referencias: this.actualizarReferenciaEnLista(this.articuloActual.referencias, actualizada)
                    };
                }

                this.finalizarEdicionReferenciaJuego(index);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Referencia de juego actualizada',
                    detail: 'Los cambios se guardaron correctamente.'
                });
            }
        });
    }

    cancelarEdicionReferenciaJuego(): void {
        const index = this.editingReferenciaJuegoIndex();
        if (index !== null) {
            this.finalizarEdicionReferenciaJuego(index);
        }
    }

    private finalizarEdicionReferenciaJuego(index: number): void {
        const row = this.articuloJuegos.at(index) as FormGroup;
        row.removeControl('referencia');
        row.removeControl('marca_id');
        this.editingReferenciaJuegoIndex.set(null);
    }

    getReferenciaJuegoDetail(id: number): Referencia | undefined {
        return this.referenciasJuegosDisponibles.find((r) => r.id === id);
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
