import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService, MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MultiSelectModule } from 'primeng/multiselect';
import { PanelModule } from 'primeng/panel';
import { StepsModule } from 'primeng/steps';
import { FileUploadModule } from 'primeng/fileupload';

import { TerceroService } from '../../../core/services/tercero.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { Country, State, City } from '../../../core/models/ubicacion.model';
import { Tercero } from '../../../core/models/tercero.model'; // Added import
import { MaquinaCreateModalComponent } from '../maquina-create-modal/maquina-create-modal.component';
import { HM_FIELD_INPUT_CLASSES, HM_DIALOG_STYLE_CLASS } from '../../../core/theme/form-field-classes';

@Component({
    selector: 'app-tercero-create-modal',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        DialogModule,
        ButtonModule,
        InputTextModule,
        SelectModule,
        SelectButtonModule,
        ToastModule,
        InputGroupModule,
        InputGroupAddonModule,
        MultiSelectModule,
        PanelModule,
        StepsModule,
        FileUploadModule,
        MaquinaCreateModalComponent
    ],
    templateUrl: './tercero-create-modal.component.html',
    styleUrl: './tercero-create-modal.component.scss'
})
export class TerceroCreateModalComponent implements OnInit, OnChanges {
    readonly fieldLabelClass = 'block mb-2 text-sm font-semibold text-gray-800 dark:text-slate-100';
    readonly fieldInputClass = HM_FIELD_INPUT_CLASSES;
    readonly fieldSelectClass = 'w-full';
    readonly sectionCardClass = 'rounded-lg border border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-white/5';
    readonly footerDividerClass = 'border-t border-gray-200 dark:border-slate-700';

    private readonly fb = inject(FormBuilder);
    private readonly terceroService = inject(TerceroService);
    private readonly ubicacionService = inject(UbicacionService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly sistemaService = inject(SistemaService);
    private readonly messageService = inject(MessageService);

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() onTerceroCreated = new EventEmitter<Tercero>();

    @Input() tipoTercero: string = 'Cliente';
    @Input() terceroToEdit: Tercero | null = null;
    @Input() isViewMode: boolean = false;
    @Input() initialData: { nombre?: string; telefono?: string; email?: string } | null = null;

    createTerceroForm!: FormGroup;
    loadingTercero = false;

    // Sub-modals visibility
    displayCreateMaquinaDialog = false;

    // Wizard Data
    steps: MenuItem[] = [];
    activeIndex: number = 0;

    // Location Data
    paises = signal<Country[]>([]);
    departamentos = signal<State[]>([]);
    ciudades = signal<City[]>([]);

    // Listas auxiliares
    maquinas = signal<any[]>([]);
    fabricantes = signal<any[]>([]);
    sistemas = signal<any[]>([]);

    tiposDocumento = [
        { label: 'NIT', value: 'NIT' },
        { label: 'Cédula de Ciudadanía', value: 'CC' },
        { label: 'Cédula de Extranjería', value: 'CE' },
        { label: 'Pasaporte', value: 'Pasaporte' }
    ];

    tiposTerceroOptions = [
        { label: 'Cliente', value: 'Cliente', styleClass: 'text-cliente' },
        { label: 'Proveedor', value: 'Proveedor', styleClass: 'text-proveedor' },
        { label: 'Ambos', value: 'Ambos', styleClass: 'text-ambos' }
    ];

    formasPago = [
        { label: 'Contado', value: 'contado' },
        { label: 'Crédito', value: 'credito' }
    ];

    ngOnInit(): void {
        this.initForm();
        this.initSteps();
        this.loadPaises();
        this.loadMaquinas();
        this.loadFabricantes();
        this.loadSistemas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && changes['visible'].currentValue === true) {
            this.resetForm();
            if (this.terceroToEdit) {
                this.loadTerceroData(this.terceroToEdit.id);
            } else if (this.initialData) {
                // Pre-fill from lead data
                this.createTerceroForm.patchValue({
                    nombre: this.initialData.nombre || '',
                    telefono: this.initialData.telefono || '',
                    email: this.initialData.email || ''
                });
            }
        }
        if (changes['tipoTercero'] && !this.terceroToEdit) {
            if (this.createTerceroForm) {
                this.createTerceroForm.patchValue({ tipo: this.tipoTercero });
            }
        }
    }

    private loadTerceroData(id: number): void {
        this.loadingTercero = true;
        this.terceroService.getById(id).subscribe({
            next: (response) => {
                this.loadingTercero = false;
                this.patchForm(response.data);
                if (this.isViewMode) {
                    this.createTerceroForm.disable();
                } else {
                    this.createTerceroForm.enable();
                }
            },
            error: (err) => {
                this.loadingTercero = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del tercero' });
                this.closeDialog();
            }
        });
    }

    private patchForm(data: any): void {
        this.createTerceroForm.patchValue({
            nombre: data.nombre,
            tipo: data.tipo,
            tipo_documento: data.tipo_documento,
            numero_documento: data.numero_documento,
            dv: data.dv,
            telefono: data.telefono,
            email: data.email,
            forma_pago: data.forma_pago,
            email_factura_electronica: data.email_factura_electronica,
            sitio_web: data.sitio_web,
            direccion: data.direccion,
            country_id: data.country_id,
            state_id: data.state_id,
            city_id: data.city_id,
            maquina_id: data.maquinas && data.maquinas.length > 0 ? data.maquinas[0].id : null,
            fabricante_id: data.fabricantes ? data.fabricantes.map((f: any) => f.id) : [],
            sistema_id: data.sistemas ? data.sistemas.map((s: any) => s.id) : [],
            contactos: [] // Will be populated below
        });

        // Set contacts
        this.contactos.clear();
        if (data.contactos && data.contactos.length > 0) {
            data.contactos.forEach((c: any) => this.addContacto(c));
        } else {
            // If creating and no contacts, could add one empty, but maybe better to leave empty
        }

        if (data.country_id) {
            if (!this.isViewMode) {
                this.createTerceroForm.get('state_id')?.enable({ emitEvent: false });
            }
            this.ubicacionService.getStates(data.country_id).subscribe((r) => {
                this.departamentos.set(r.data);
            });
        }
        if (data.state_id) {
            if (!this.isViewMode) {
                this.createTerceroForm.get('city_id')?.enable({ emitEvent: false });
            }
            this.ubicacionService.getCities(data.state_id).subscribe((r) => {
                this.ciudades.set(r.data);
            });
        }
    }

    private initSteps(): void {
        this.steps = [{ label: 'Información general' }, { label: 'Ubicación' }, { label: 'Contactos' }, { label: 'Documentos' }];
    }

    get contactos(): FormArray {
        return this.createTerceroForm.get('contactos') as FormArray;
    }

    addContacto(contacto: any = null): void {
        const contactoForm = this.fb.group({
            id: [contacto?.id || null],
            nombre: [contacto?.nombre || '', [Validators.required]],
            cargo: [contacto?.cargo || ''],
            email: [contacto?.email || '', [Validators.email]],
            telefono: [contacto?.telefono || ''],
            principal: [contacto?.principal || false]
        });
        this.contactos.push(contactoForm);
    }

    removeContacto(index: number): void {
        this.contactos.removeAt(index);
    }

    setPrincipal(index: number): void {
        this.contactos.controls.forEach((control, i) => {
            control.get('principal')?.setValue(i === index);
        });
    }

    private initForm(): void {
        this.createTerceroForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.maxLength(255)]],
            tipo: [this.tipoTercero, [Validators.required]],
            tipo_documento: ['NIT', [Validators.required]],
            numero_documento: ['', [Validators.required, Validators.maxLength(20)]],
            dv: [''],
            telefono: ['', [Validators.required]],
            email: ['', [Validators.email]],
            forma_pago: [''],
            email_factura_electronica: ['', [Validators.email]],
            sitio_web: [''],

            maquina_id: [null],
            fabricante_id: [[]],
            sistema_id: [[]],

            direccion: ['', [Validators.required]],
            country_id: [null],
            state_id: [{ value: null, disabled: true }],
            city_id: [{ value: null, disabled: true }],

            rut: [null],
            certificacion_bancaria: [null],
            camara_comercio: [null],
            cedula_representante_legal: [null],
            contactos: this.fb.array([]),
            estado: ['activo']
        });
    }

    get isNit(): boolean {
        const val = this.createTerceroForm.get('tipo_documento')?.value;
        return val === 'nit' || val === 'NIT';
    }
    get isCliente(): boolean {
        const t = this.createTerceroForm.get('tipo')?.value;
        return t === 'Cliente' || t === 'Ambos';
    }
    get isProveedor(): boolean {
        const t = this.createTerceroForm.get('tipo')?.value;
        return t === 'Proveedor' || t === 'Ambos';
    }
    get activeTheme(): string {
        const tipo = this.createTerceroForm?.get('tipo')?.value;
        if (tipo === 'Cliente') return 'theme-cliente';
        if (tipo === 'Proveedor') return 'theme-proveedor';
        if (tipo === 'Ambos') return 'theme-ambos';
        return 'theme-cliente';
    }

    resetForm(): void {
        this.activeIndex = 0;
        if (this.createTerceroForm) {
            this.createTerceroForm.enable();
            this.createTerceroForm.reset({
                tipo_documento: 'NIT',
                tipo: this.tipoTercero,
                estado: 'activo',
                fabricante_id: [],
                sistema_id: [],
                contactos: []
            });
            this.createTerceroForm.get('state_id')?.disable({ emitEvent: false });
            this.createTerceroForm.get('city_id')?.disable({ emitEvent: false });
            this.contactos.clear();
            this.departamentos.set([]);
            this.ciudades.set([]);
        }
    }

    nextStep(): void {
        if (this.isStepValid(this.activeIndex)) {
            this.activeIndex++;
        } else {
            this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios para continuar' });
            this.markStepAsTouched(this.activeIndex);
        }
    }

    prevStep(): void {
        if (this.activeIndex > 0) {
            this.activeIndex--;
        }
    }

    private isStepValid(step: number): boolean {
        if (this.isViewMode) return true;

        const controls = this.createTerceroForm.controls;
        if (step === 0) {
            return !controls['nombre'].invalid && !controls['tipo'].invalid && !controls['tipo_documento'].invalid && !controls['numero_documento'].invalid && !controls['telefono'].invalid;
        }
        if (step === 1) {
            return !controls['direccion'].invalid;
        }
        if (step === 2) {
            return this.contactos.valid;
        }
        return true;
    }

    private markStepAsTouched(step: number): void {
        if (step === 0) {
            this.createTerceroForm.get('nombre')?.markAsTouched();
            this.createTerceroForm.get('numero_documento')?.markAsTouched();
            this.createTerceroForm.get('telefono')?.markAsTouched();
        }
        if (step === 1) {
            this.createTerceroForm.get('direccion')?.markAsTouched();
        }
        if (step === 2) {
            this.contactos.markAllAsTouched();
        }
    }

    openCreateMaquinaDialog(): void {
        this.displayCreateMaquinaDialog = true;
    }
    onMaquinaCreated(maquina: any): void {
        this.loadMaquinas();
        this.displayCreateMaquinaDialog = false;
        this.createTerceroForm.patchValue({ maquina_id: maquina.id });
    }
    openCreateFabricanteDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Funcionalidad de crear fabricante próximamente' });
    }
    openCreateSistemaDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Funcionalidad de crear sistema próximamente' });
    }

    onPaisChange(): void {
        const countryId = this.createTerceroForm.get('country_id')?.value;
        const stateControl = this.createTerceroForm.get('state_id')!;
        const cityControl = this.createTerceroForm.get('city_id')!;
        this.departamentos.set([]);
        this.ciudades.set([]);
        this.createTerceroForm.patchValue({ state_id: null, city_id: null });
        if (countryId) {
            stateControl.enable({ emitEvent: false });
            this.ubicacionService.getStates(countryId).subscribe({ next: (r) => this.departamentos.set(r.data) });
        } else {
            stateControl.disable({ emitEvent: false });
            cityControl.disable({ emitEvent: false });
        }
    }

    onDepartamentoChange(): void {
        const stateId = this.createTerceroForm.get('state_id')?.value;
        const cityControl = this.createTerceroForm.get('city_id')!;
        this.ciudades.set([]);
        this.createTerceroForm.patchValue({ city_id: null });
        if (stateId) {
            cityControl.enable({ emitEvent: false });
            this.ubicacionService.getCities(stateId).subscribe({ next: (r) => this.ciudades.set(r.data) });
        } else {
            cityControl.disable({ emitEvent: false });
        }
    }

    onFileSelect(event: any, fieldName: string): void {
        if (event.files && event.files.length > 0) {
            this.createTerceroForm.patchValue({ [fieldName]: event.files[0] });
        }
    }

    closeDialog(): void {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    private loadPaises(): void {
        this.ubicacionService.getCountries().subscribe({ next: (r) => this.paises.set(r.data) });
    }
    private loadMaquinas(): void {
        this.maquinaService.getAll({ per_page: 100, disponibles: true }).subscribe({ next: (r) => this.maquinas.set(r.data.map((m) => ({ label: `${m.modelo} - ${m.serie || 'Sin Serie'}`, value: m.id }))) });
    }
    private loadFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 200 }).subscribe({ next: (r) => this.fabricantes.set(r.data.map((f) => ({ label: f.nombre, value: f.id }))) });
    }
    private loadSistemas(): void {
        this.sistemaService.getAll({ per_page: 200 }).subscribe({ next: (r) => this.sistemas.set(r.data.map((s) => ({ label: s.nombre, value: s.id }))) });
    }

    saveTercero(createAnother: boolean = false): void {
        if (this.isViewMode) {
            this.closeDialog();
            return;
        }

        if (this.createTerceroForm.invalid) {
            this.createTerceroForm.markAllAsTouched();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Revise los campos obligatorios' });
            return;
        }

        this.loadingTercero = true;
        const formValue = this.createTerceroForm.value;
        const formData = new FormData();

        formData.append('numero_documento', formValue.numero_documento);
        formData.append('nombre', formValue.nombre);
        formData.append('tipo', formValue.tipo);
        formData.append('tipo_documento', formValue.tipo_documento.toUpperCase());

        formData.append('telefono', formValue.telefono);
        formData.append('email', formValue.email || '');
        formData.append('direccion', formValue.direccion);
        formData.append('forma_pago', formValue.forma_pago || '');
        formData.append('sitio_web', formValue.sitio_web || '');
        formData.append('estado', 'Activo');

        if (formValue.country_id) formData.append('country_id', formValue.country_id);
        if (formValue.state_id) formData.append('state_id', formValue.state_id);
        if (formValue.city_id) formData.append('city_id', formValue.city_id);

        if (formValue.email_factura_electronica) formData.append('email_factura_electronica', formValue.email_factura_electronica);
        if (formValue.dv) formData.append('dv', formValue.dv);

        if (formValue.maquina_id) formData.append('maquina_id', formValue.maquina_id);

        if (formValue.fabricante_id && Array.isArray(formValue.fabricante_id)) {
            formValue.fabricante_id.forEach((id: any) => formData.append('fabricante_id[]', id));
        }
        if (formValue.sistema_id && Array.isArray(formValue.sistema_id)) {
            formValue.sistema_id.forEach((id: any) => formData.append('sistema_id[]', id));
        }

        if (formValue.contactos && Array.isArray(formValue.contactos)) {
            formValue.contactos.forEach((contacto: any, index: number) => {
                if (contacto.nombre) {
                    formData.append(`contactos[${index}][nombre]`, contacto.nombre);
                    formData.append(`contactos[${index}][cargo]`, contacto.cargo || '');
                    formData.append(`contactos[${index}][email]`, contacto.email || '');
                    formData.append(`contactos[${index}][telefono]`, contacto.telefono || '');
                    formData.append(`contactos[${index}][principal]`, contacto.principal ? '1' : '0');
                    if (contacto.id) {
                        formData.append(`contactos[${index}][id]`, contacto.id);
                    }
                }
            });
        }

        const fileFields = ['rut', 'certificacion_bancaria', 'camara_comercio', 'cedula_representante_legal'];
        fileFields.forEach((field) => {
            if (formValue[field] instanceof File) {
                formData.append(field, formValue[field]);
            }
        });

        let request$: any;
        if (this.terceroToEdit) {
            formData.append('_method', 'PUT');
            request$ = this.terceroService.update(this.terceroToEdit.id, formData);
        } else {
            request$ = this.terceroService.create(formData);
        }

        request$.subscribe({
            next: (response: any) => {
                this.loadingTercero = false;
                const action = this.terceroToEdit ? 'actualizado' : 'creado';
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Tercero ${action} correctamente` });
                this.onTerceroCreated.emit(response.data);
                if (createAnother && !this.terceroToEdit) {
                    this.resetForm();
                } else {
                    this.closeDialog();
                }
            },
            error: (error: any) => {
                this.loadingTercero = false;
                console.error('Error al guardar tercero', error);
                const msg = error.error?.message || 'Fallo al guardar tercero';
                if (error.error?.errors) {
                    const errors = Object.values(error.error.errors).flat().join('. ');
                    this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: errors });
                } else {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: msg });
                }
            }
        });
    }
}
