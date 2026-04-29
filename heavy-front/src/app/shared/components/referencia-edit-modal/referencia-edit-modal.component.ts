import {
    Component,
    OnInit,
    inject,
    Input,
    Output,
    EventEmitter,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy,
    signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { ReferenciaService } from '../../../core/services/referencia.service';
import { ListaService } from '../../../core/services/lista.service';
import { Lista } from '../../../core/models/lista.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Referencia, UpdateReferenciaDto } from '../../../core/models/referencia.model';
import { Articulo } from '../../../core/models/articulo.model';

@Component({
    selector: 'app-referencia-edit-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToastModule,
        ProgressSpinnerModule
    ],
    templateUrl: './referencia-edit-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [MessageService]
})
export class ReferenciaEditModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly listaService = inject(ListaService);
    private readonly articuloService = inject(ArticuloService);
    private readonly messageService = inject(MessageService);

    @Input() visible = false;
    @Input() referenciaId: number | null = null;
    @Input() title = 'Editar referencia';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onReferenciaUpdated = new EventEmitter<Referencia>();

    referenciaForm!: FormGroup;
    loading = false;
    loadingData = false;
    marcas = signal<Lista[]>([]);
    articulos = signal<Articulo[]>([]);

    ngOnInit(): void {
        this.initForm();
        this.cargarMarcas();
        this.cargarArticulos();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']?.currentValue === true && this.referenciaId) {
            this.cargarReferencia();
        }
    }

    private initForm(): void {
        this.referenciaForm = this.fb.group({
            referencia: ['', [Validators.required, Validators.maxLength(255)]],
            marca_id: [null as number | null],
            articulo_id: [null as number | null],
            comentario: ['', [Validators.maxLength(500)]]
        });
    }

    private cargarMarcas(): void {
        this.listaService.getMarcasYFabricantesParaReferencia().subscribe({
            next: (items) => {
                this.marcas.set(items);
            }
        });
    }

    private cargarArticulos(): void {
        this.articuloService.getAll({ per_page: 500 }).subscribe({
            next: (response) => {
                this.articulos.set(response.data);
            }
        });
    }

    private cargarReferencia(): void {
        if (!this.referenciaId) {
            return;
        }

        this.loadingData = true;
        this.referenciaForm.reset();

        this.referenciaService.getById(this.referenciaId).subscribe({
            next: (res) => {
                const r = res.data;
                this.referenciaForm.patchValue({
                    referencia: r.referencia,
                    marca_id: r.marca_id,
                    articulo_id: r.articulo_id,
                    comentario: r.comentario ?? ''
                });
                if (r.marca && !this.marcas().some((m) => m.id === r.marca!.id)) {
                    this.marcas.update(prev => [r.marca as Lista, ...prev]);
                }
                this.loadingData = false;
            },
            error: () => {
                this.loadingData = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo cargar la referencia.'
                });
                this.closeDialog();
            }
        });
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    guardar(): void {
        if (!this.referenciaId || this.referenciaForm.invalid) {
            this.referenciaForm.markAllAsTouched();
            return;
        }

        const raw = this.referenciaForm.value;
        const data: UpdateReferenciaDto = {
            referencia: raw.referencia,
            marca_id: raw.marca_id ?? null,
            articulo_id: raw.articulo_id ?? null,
            comentario: raw.comentario?.trim() ? raw.comentario : null
        };

        this.loading = true;

        this.referenciaService.update(this.referenciaId, data).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Referencia actualizada correctamente.'
                });
                this.onReferenciaUpdated.emit(response.data);
                this.closeDialog();
            },
            error: (error) => {
                this.loading = false;
                const msg =
                    error.error?.message ||
                    (typeof error.error?.error === 'string' ? error.error.error : null) ||
                    'No se pudo actualizar la referencia.';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
