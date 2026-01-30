import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';

import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { ListaService } from '../../../core/services/lista.service';

@Component({
    selector: 'app-maquina-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        ToastModule,
        FileUploadModule
    ],
    templateUrl: './maquina-create-modal.component.html',
    styles: []
})
export class MaquinaCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly listaService = inject(ListaService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onMaquinaCreated = new EventEmitter<any>();

    createMaquinaForm!: FormGroup;
    loading = false;

    // Listas
    tiposMaquina: any[] = [];
    fabricantes: any[] = [];

    ngOnInit(): void {
        this.initForm();
        this.loadTiposMaquina();
        this.loadFabricantes();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            this.resetForm();
        }
    }

    private initForm(): void {
        this.createMaquinaForm = this.fb.group({
            tipo: [null, [Validators.required]],
            fabricante_id: [null, [Validators.required]],
            modelo: ['', [Validators.required]],
            serie: [''],
            arreglo: [''],
            foto: [null],
            fotoId: [null]
        });
    }

    resetForm(): void {
        if (this.createMaquinaForm) {
            this.createMaquinaForm.reset();
        }
    }

    private loadTiposMaquina(): void {
        this.listaService.getAll({ tipo: 'Tipo de Máquina' }).subscribe({
            next: (response) => {
                this.tiposMaquina = response.data.map(t => ({
                    label: t.nombre,
                    value: t.id
                }));
            }
        });
    }

    private loadFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 100 }).subscribe({
            next: (response) => {
                this.fabricantes = response.data.map(f => ({
                    label: f.nombre,
                    value: f.id
                }));
            }
        });
    }

    openCreateTipoDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Crear Tipo próximamente' });
    }

    openCreateFabricanteDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Crear Fabricante próximamente' });
    }

    onFileSelect(event: any, fieldName: string): void {
        if (event.files && event.files.length > 0) {
            this.createMaquinaForm.patchValue({ [fieldName]: event.files[0] });
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveMaquina(createAnother: boolean = false): void {
        if (this.createMaquinaForm.invalid) {
            this.createMaquinaForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.createMaquinaForm.value;
        const formData = new FormData();

        Object.keys(formValue).forEach(key => {
            const value = formValue[key];
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });

        this.maquinaService.create(formData).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `Máquina creada correctamente`
                });

                this.onMaquinaCreated.emit(response.data);

                if (createAnother) {
                    this.resetForm();
                } else {
                    this.closeDialog();
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando maquina', error);
                const msg = error.error?.message || 'Fallo al crear máquina';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
