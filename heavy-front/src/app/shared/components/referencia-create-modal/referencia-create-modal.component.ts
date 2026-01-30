import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { ReferenciaService } from '../../../core/services/referencia.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { CreateReferenciaDto } from '../../../core/models/referencia.model';

@Component({
    selector: 'app-referencia-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        ToastModule
    ],
    templateUrl: './referencia-create-modal.component.html',
    providers: [MessageService]
})
export class ReferenciaCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly referenciaService = inject(ReferenciaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() title: string = 'Crear Nueva Referencia';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onReferenciaCreated = new EventEmitter<any>();

    referenciaForm!: FormGroup;
    loading = false;
    marcas: any[] = [];

    ngOnInit(): void {
        this.initForm();
        this.cargarMarcas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            this.resetForm();
        }
    }

    private initForm(): void {
        this.referenciaForm = this.fb.group({
            referencia: ['', [Validators.required, Validators.maxLength(255)]],
            marca_id: [null, [Validators.required]],
            comentario: ['', [Validators.maxLength(500)]]
        });
    }

    private cargarMarcas(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.marcas = response.data;
            }
        });
    }

    resetForm(): void {
        if (this.referenciaForm) {
            this.referenciaForm.reset();
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveReferencia(): void {
        if (this.referenciaForm.invalid) {
            this.referenciaForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const data: CreateReferenciaDto = this.referenciaForm.value;

        this.referenciaService.create(data).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Referencia creada correctamente`
                });

                this.onReferenciaCreated.emit(response.data);
                this.closeDialog();
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando referencia', error);
                const msg = error.error?.message || 'Fallo al crear la referencia';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
