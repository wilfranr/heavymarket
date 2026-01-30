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
import { FileUploadModule } from 'primeng/fileupload';

import { ListaService } from '../../../core/services/lista.service';
import { ListaTipo } from '../../../core/models/lista.model';

@Component({
    selector: 'app-lista-create-modal',
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
        FileUploadModule
    ],
    templateUrl: './lista-create-modal.component.html',
    providers: [MessageService],
    styles: []
})
export class ListaCreateModalComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly listaService = inject(ListaService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Input() tipoDefault: ListaTipo = 'Piezas Estandar';
    @Input() title: string = 'Crear Nueva Opción';

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onListaCreated = new EventEmitter<any>();

    listaForm!: FormGroup;
    loading = false;

    tiposOptions = [
        { label: 'Marca', value: 'Marca' as ListaTipo },
        { label: 'Tipo de Máquina', value: 'Tipo de Máquina' as ListaTipo },
        { label: 'Tipo de Artículo', value: 'Tipo de Artículo' as ListaTipo },
        { label: 'Unidad de Medida', value: 'Unidad de Medida' as ListaTipo },
        { label: 'Tipo de Medida', value: 'Tipo de Medida' as ListaTipo },
        { label: 'Nombre de Medida', value: 'Nombre de Medida' as ListaTipo },
        { label: 'Piezas Estandar', value: 'Piezas Estandar' as ListaTipo }
    ];

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            this.resetForm();
            if (this.listaForm) {
                this.listaForm.patchValue({ tipo: this.tipoDefault });
            }
        }
    }

    private initForm(): void {
        this.listaForm = this.fb.group({
            tipo: [this.tipoDefault, [Validators.required]],
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            definicion: ['', [Validators.maxLength(1000)]],
            foto: [null],
            fotoMedida: [null],
            sistema_id: [null]
        });
    }

    resetForm(): void {
        if (this.listaForm) {
            this.listaForm.reset({
                tipo: this.tipoDefault,
                nombre: '',
                definicion: '',
                foto: null,
                fotoMedida: null,
                sistema_id: null
            });
        }
    }

    onFileSelect(event: any, fieldName: string): void {
        if (event.files && event.files.length > 0) {
            this.listaForm.patchValue({ [fieldName]: event.files[0] });
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    saveLista(createAnother: boolean = false): void {
        if (this.listaForm.invalid) {
            this.listaForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        const formValue = this.listaForm.value;
        const formData = new FormData();

        Object.keys(formValue).forEach(key => {
            const value = formValue[key];
            if (value !== null && value !== undefined && value !== '') {
                formData.append(key, value);
            }
        });

        this.listaService.create(formData).subscribe({
            next: (response) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: `${formValue.tipo} creado correctamente`
                });

                this.onListaCreated.emit(response.data);

                if (createAnother) {
                    this.resetForm();
                } else {
                    this.closeDialog();
                }
            },
            error: (error) => {
                this.loading = false;
                console.error('Error creando lista', error);
                const msg = error.error?.message || 'Fallo al crear registro en la lista';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
            }
        });
    }
}
