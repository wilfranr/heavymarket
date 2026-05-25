import { Component, OnInit, inject, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
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
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { PasswordModule } from 'primeng/password';

import { TerceroService } from '../../../core/services/tercero.service';
import { UbicacionService } from '../../../core/services/ubicacion.service';
import { MaquinaService } from '../../../core/services/maquina.service';
import { FabricanteService } from '../../../core/services/fabricante.service';
import { SistemaService } from '../../../core/services/sistema.service';
import { ListaService } from '../../../core/services/lista.service';
import { Country, State, City } from '../../../core/models/ubicacion.model';
import { Tercero } from '../../../core/models/tercero.model';
import { MaquinaCreateModalComponent } from '../maquina-create-modal/maquina-create-modal.component';

@Component({
    selector: 'app-tercero-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
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
        TooltipModule,
        MaquinaCreateModalComponent,
        ToggleSwitchModule,
        PasswordModule
    ],
    templateUrl: './tercero-form.component.html',
    styles: [
        `
            /* --- WIZARD STEPS OVERRIDES --- */

            /* CLIENTE (Amarillo) */
            :host ::ng-deep .theme-cliente .p-steps .p-steps-item.p-highlight .p-steps-number {
                background: #eab308 !important;
                color: #000 !important;
            }
            :host ::ng-deep .theme-cliente .p-steps .p-steps-item.p-highlight .p-steps-title {
                color: #eab308 !important;
                font-weight: bold;
            }

            /* PROVEEDOR (Azul) */
            :host ::ng-deep .theme-proveedor .p-steps .p-steps-item.p-highlight .p-steps-number {
                background: #3b82f6 !important;
                color: #fff !important;
            }
            :host ::ng-deep .theme-proveedor .p-steps .p-steps-item.p-highlight .p-steps-title {
                color: #3b82f6 !important;
                font-weight: bold;
            }

            /* AMBOS (Verde) */
            :host ::ng-deep .theme-ambos .p-steps .p-steps-item.p-highlight .p-steps-number {
                background: #22c55e !important;
                color: #fff !important;
            }
            :host ::ng-deep .theme-ambos .p-steps .p-steps-item.p-highlight .p-steps-title {
                color: #22c55e !important;
                font-weight: bold;
            }

            /* --- BUTTON OVERRIDES --- */
            /* Only target primary buttons (not secondary, text, etc) */

            /* CLIENTE */
            :host ::ng-deep .theme-cliente button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success) {
                background: #eab308 !important;
                border-color: #eab308 !important;
                color: #000 !important;
            }
            /* Focus ring for accessibility/aesthetics match */
            :host ::ng-deep .theme-cliente button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success):focus {
                box-shadow:
                    0 0 0 2px #18181b,
                    0 0 0 4px #eab308 !important;
            }

            /* PROVEEDOR */
            :host ::ng-deep .theme-proveedor button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success) {
                background: #3b82f6 !important;
                border-color: #3b82f6 !important;
                color: #fff !important;
            }
            :host ::ng-deep .theme-proveedor button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success):focus {
                box-shadow:
                    0 0 0 2px #18181b,
                    0 0 0 4px #3b82f6 !important;
            }

            /* AMBOS */
            :host ::ng-deep .theme-ambos button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success) {
                background: #22c55e !important;
                border-color: #22c55e !important;
                color: #fff !important;
            }
            :host ::ng-deep .theme-ambos button.p-button:not(.p-button-secondary):not(.p-button-text):not(.p-button-outlined):not(.p-button-success):focus {
                box-shadow:
                    0 0 0 2px #18181b,
                    0 0 0 4px #22c55e !important;
            }

            /* SelectButton Text Colors - Helper classes */
            .text-cliente {
                color: #eab308;
                font-weight: bold;
            }
            .text-proveedor {
                color: #3b82f6;
                font-weight: bold;
            }
            .text-ambos {
                color: #22c55e;
                font-weight: bold;
            }

            /* Responsive adjustments for save button */
            @media (max-width: 768px) {
                :host ::ng-deep .p-steps .p-steps-item .p-menuitem-link .p-steps-title {
                    display: none;
                }
            }
        `
    ]
})
export class TerceroFormComponent implements OnInit, OnChanges {
    private readonly fb = inject(FormBuilder);
    private readonly terceroService = inject(TerceroService);
    private readonly ubicacionService = inject(UbicacionService);
    private readonly maquinaService = inject(MaquinaService);
    private readonly fabricanteService = inject(FabricanteService);
    private readonly sistemaService = inject(SistemaService);
    private readonly listaService = inject(ListaService);
    private readonly messageService = inject(MessageService);

    @Input() terceroId: number | null = null;
    @Input() isViewMode: boolean = false;
    @Input() showLandingAccess: boolean = true;
    @Output() onSave = new EventEmitter<Tercero>();
    @Output() onCancel = new EventEmitter<void>();

    createTerceroForm!: FormGroup;
    loadingTercero = signal(false);

    // Sub-modals visibility
    displayCreateMaquinaDialog = false;

    // Wizard Data
    steps: MenuItem[] = [];
    activeIndex: number = 0;

    // Location Data
    paises = signal<Country[]>([]);
    departamentos = signal<State[]>([]);
    ciudades = signal<City[]>([]);
    fletePaisSeleccionado = signal<number | null>(null);

    // Listas auxiliares
    maquinas: any[] = [];
    fabricantes: any[] = [];
    categoriasComerciales: any[] = [];
    sistemas: any[] = [];

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
        this.loadCategoriasComerciales();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['terceroId'] && this.terceroId) {
            this.loadTerceroData(this.terceroId);
        }
    }

    private loadTerceroData(id: number): void {
        this.loadingTercero.set(true);
        this.terceroService.getById(id).subscribe({
            next: (response) => {
                this.loadingTercero.set(false);
                this.patchForm(response.data);
                if (this.isViewMode) {
                    this.createTerceroForm.disable();
                } else {
                    this.createTerceroForm.enable();
                }
            },
            error: (err) => {
                this.loadingTercero.set(false);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del tercero' });
                this.onCancel.emit();
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
            maquina_id: data.maquinas ? data.maquinas.map((m: any) => m.id) : [],
            fabricante_id: data.fabricantes ? data.fabricantes.map((f: any) => f.id) : [],
            categoria_comercial_id: data.categorias_comerciales ? data.categorias_comerciales.map((c: any) => c.id) : [],
            contactos: [],
            landing_access: data.landing_access ?? false,
            landing_password: ''
        });

        // Set contacts
        this.contactos.clear();
        if (data.contactos && data.contactos.length > 0) {
            data.contactos.forEach((c: any) => this.addContacto(c));
        }

        if (data.country_id) {
            this.ubicacionService.getStates(data.country_id).subscribe((r) => {
                this.departamentos.set(r.data);
            });
            const pais = this.paises().find((p) => p.id === data.country_id);
            if (pais && pais.flete) {
                this.fletePaisSeleccionado.set(pais.flete);
            }
        }
        if (data.state_id) {
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
            tipo: ['Cliente', [Validators.required]],
            tipo_documento: ['NIT', [Validators.required]],
            numero_documento: ['', [Validators.required, Validators.maxLength(20)]],
            dv: [''],
            telefono: ['', [Validators.required]],
            email: ['', [Validators.email]],
            forma_pago: [''],
            email_factura_electronica: ['', [Validators.email]],
            sitio_web: [''],

            maquina_id: [[]],
            fabricante_id: [[]],
            categoria_comercial_id: [[]],

            direccion: ['', [Validators.required]],
            country_id: [null],
            state_id: [null],
            city_id: [null],

            rut: [null],
            certificacion_bancaria: [null],
            camara_comercio: [null],
            cedula_representante_legal: [null],
            contactos: this.fb.array([]),
            estado: ['activo'],

            // Acceso Landing
            landing_access: [false],
            landing_password: ['']
        });

        // Sync Signals with Form
        this.createTerceroForm
            .get('tipo')!
            .valueChanges.pipe(startWith(this.createTerceroForm.get('tipo')?.value || 'Cliente'))
            .subscribe((val) => this.tipoTercero.set(val));
        this.createTerceroForm
            .get('tipo_documento')!
            .valueChanges.pipe(startWith(this.createTerceroForm.get('tipo_documento')?.value || 'NIT'))
            .subscribe((val) => this.tipoDocumento.set(val));
        this.createTerceroForm
            .get('landing_access')!
            .valueChanges.pipe(startWith(this.createTerceroForm.get('landing_access')?.value || false))
            .subscribe((val) => this.landingAccessEnabled.set(val));

        // Controlar obligatoriedad de la contraseña al activar el toggle
        this.createTerceroForm.get('landing_access')!.valueChanges.subscribe((enabled: boolean) => {
            const pwControl = this.createTerceroForm.get('landing_password')!;
            if (enabled && !this.terceroId) {
                // En creación es obligatoria
                pwControl.setValidators([Validators.required, Validators.minLength(6)]);
            } else {
                pwControl.clearValidators();
            }
            pwControl.updateValueAndValidity();
        });
    }

    // Reactive signals based on form state
    tipoTercero = signal<string>('Cliente');
    tipoDocumento = signal<string>('NIT');
    activeTheme = computed(() => {
        const tipo = this.tipoTercero();
        if (tipo === 'Cliente') return 'theme-cliente';
        if (tipo === 'Proveedor') return 'theme-proveedor';
        if (tipo === 'Ambos') return 'theme-ambos';
        return 'theme-cliente';
    });

    isCliente = computed(() => this.tipoTercero() === 'Cliente' || this.tipoTercero() === 'Ambos');
    isProveedor = computed(() => this.tipoTercero() === 'Proveedor' || this.tipoTercero() === 'Ambos');
    isNit = computed(() => {
        const val = this.tipoDocumento();
        return val === 'nit' || val === 'NIT';
    });
    landingAccessEnabled = signal(false);

    resetForm(): void {
        this.activeIndex = 0;
        if (this.createTerceroForm) {
            this.createTerceroForm.enable();
            this.createTerceroForm.reset({
                tipo_documento: 'NIT',
                tipo: 'Cliente',
                estado: 'activo',
                maquina_id: [],
                fabricante_id: [],
                categoria_comercial_id: [],
                contactos: [],
                landing_access: false,
                landing_password: ''
            });
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
        const currentMaquinas = this.createTerceroForm.get('maquina_id')?.value || [];
        this.createTerceroForm.patchValue({ maquina_id: [...currentMaquinas, maquina.id] });
    }
    openCreateFabricanteDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Funcionalidad de crear fabricante próximamente' });
    }
    openCreateSistemaDialog(): void {
        this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Funcionalidad de crear sistema próximamente' });
    }

    onPaisChange(): void {
        const countryId = this.createTerceroForm.get('country_id')?.value;
        this.departamentos.set([]);
        this.ciudades.set([]);
        this.fletePaisSeleccionado.set(null);
        this.createTerceroForm.patchValue({ state_id: null, city_id: null });
        if (countryId) {
            this.ubicacionService.getStates(countryId).subscribe({ next: (r) => this.departamentos.set(r.data) });
            const pais = this.paises().find((p) => p.id === countryId);
            if (pais && pais.flete) {
                this.fletePaisSeleccionado.set(pais.flete);
            }
        }
    }

    onDepartamentoChange(): void {
        const stateId = this.createTerceroForm.get('state_id')?.value;
        this.ciudades.set([]);
        this.createTerceroForm.patchValue({ city_id: null });
        if (stateId) {
            this.ubicacionService.getCities(stateId).subscribe({ next: (r) => this.ciudades.set(r.data) });
        }
    }

    onFileSelect(event: any, fieldName: string): void {
        if (event.files && event.files.length > 0) {
            this.createTerceroForm.patchValue({ [fieldName]: event.files[0] });
        }
    }

    cancel(): void {
        this.onCancel.emit();
    }

    private loadPaises(): void {
        this.ubicacionService.getCountriesAdmin({ per_page: 300 }).subscribe({ next: (r) => this.paises.set(r.data) });
    }
    private loadMaquinas(): void {
        this.maquinaService.getAll({ per_page: 100 }).subscribe({ next: (r) => (this.maquinas = r.data.map((m) => ({ label: `${m.modelo} - ${m.serie || 'Sin Serie'}`, value: m.id }))) });
    }
    private loadFabricantes(): void {
        this.fabricanteService.getAll({ per_page: 200 }).subscribe({ next: (r) => (this.fabricantes = r.data.map((f) => ({ label: f.nombre, value: f.id }))) });
    }
    private loadCategoriasComerciales(): void {
        this.listaService.getByTipo('Categoría Comercial').subscribe({
            next: (listas) => (this.categoriasComerciales = listas.map((l) => ({ label: l.nombre, value: l.id })))
        });
    }

    saveTercero(): void {
        if (this.isViewMode) {
            this.cancel();
            return;
        }

        if (this.createTerceroForm.invalid) {
            this.createTerceroForm.markAllAsTouched();
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Revise los campos obligatorios' });
            return;
        }

        this.loadingTercero.set(true);
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

        if (formValue.maquina_id && Array.isArray(formValue.maquina_id)) {
            formValue.maquina_id.forEach((id: any) => formData.append('maquina_id[]', id));
        }

        if (formValue.fabricante_id && Array.isArray(formValue.fabricante_id)) {
            formValue.fabricante_id.forEach((id: any) => formData.append('fabricante_id[]', id));
        }
        if (formValue.categoria_comercial_id && Array.isArray(formValue.categoria_comercial_id)) {
            formValue.categoria_comercial_id.forEach((id: any) => formData.append('categoria_comercial_id[]', id));
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

        // Acceso Landing
        formData.append('landing_access', formValue.landing_access ? '1' : '0');
        if (formValue.landing_access && formValue.landing_password) {
            formData.append('landing_password', formValue.landing_password);
        }

        let request$: any;
        if (this.terceroId) {
            formData.append('_method', 'PUT');
            request$ = this.terceroService.update(this.terceroId, formData);
        } else {
            request$ = this.terceroService.create(formData);
        }

        request$.subscribe({
            next: (response: any) => {
                this.loadingTercero.set(false);
                const action = this.terceroId ? 'actualizado' : 'creado';
                this.messageService.add({ severity: 'success', summary: 'Éxito', detail: `Tercero ${action} correctamente` });
                this.onSave.emit(response.data);
            },
            error: (error: any) => {
                this.loadingTercero.set(false);
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
