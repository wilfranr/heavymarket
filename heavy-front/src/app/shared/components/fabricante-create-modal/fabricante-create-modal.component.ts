import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { FabricanteService } from '../../../core/services/fabricante.service';
import { CreateFabricanteDto } from '../../../core/models/fabricante.model';

@Component({
    selector: 'app-fabricante-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        TextareaModule,
        ToastModule
    ],
    templateUrl: './fabricante-create-modal.component.html',
    providers: [MessageService]
})
export class FabricanteCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() title: string = 'Crear Nueva Marca';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onFabricanteCreated = new EventEmitter<any>();

    fabricanteForm!: FormGroup;
    loading = false;

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            this.resetForm();
        }
    }

    private initForm(): void {
        this.fabricanteForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            descripcion: ['', [Validators.maxLength(500)]]
        });
    }

    resetForm(): void {
        if (this.fabricanteForm) {
            this.fabricanteForm.reset();
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveFabricante(): void {
        if (this.fabricanteForm.invalid) {
            this.fabricanteForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const data: CreateFabricanteDto = this.fabricanteForm.value;

        this.fabricanteService.create(data).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Marca creada correctamente`
                });

                this.onFabricanteCreated.emit(response.data);
                this.closeDialog();
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando marca', error);
                const msg = error.error?.message || 'Fallo al crear la marca';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
