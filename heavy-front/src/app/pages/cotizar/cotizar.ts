import { Component, OnInit, ChangeDetectorRef, ViewEncapsulation, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../landing/components/navbar/navbar';
import { FooterSection } from '../../landing/components/footer-section/footer-section';
import { LandingService, Category } from '../../core/services/landing';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { Country, State, City } from '../../core/models/ubicacion.model';
import { ClientAuthService } from '../../core/services/client-auth.service';
import { ReferenciaService } from '../../core/services/referencia.service';

import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DialogModule } from 'primeng/dialog';
import { GalleriaModule } from 'primeng/galleria';

@Component({
    selector: 'app-cotizar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, Navbar, FooterSection, DialogModule, GalleriaModule],
    templateUrl: './cotizar.html',
    styleUrls: ['../../../assets/css/landing.css', '../../../assets/css/cotizador.css', './cotizar.css'],
    encapsulation: ViewEncapsulation.None
})
export class Cotizar implements OnInit {
    private static readonly DEFAULT_ARTICLE_TYPE_ID = 3425;

    // View State
    currentView: 'grid' | 'form' = 'grid';
    formStep: 1 | 2 | 3 = 1;
    submitting = false;
    success = false;

    // Data from API
    readonly categories = signal<Category[]>([]);
    readonly brands = signal<{ id: number; nombre: string; logo?: string }[]>([]);
    systems: { id: number; nombre: string }[] = [];
    articleTypes: { id: number; nombre: string; sistema_ids: number[] }[] = [];
    models: string[] = [];
    errorMessage = '';
    typeSearch = '';
    readonly brandSearch = signal('');
    bulkText = '';
    showBulkImport = false;
    processingBulk = false;
    displayHelpDialog = false;

    // Location Data
    countries: Country[] = [];
    states: State[] = [];
    cities: City[] = [];

    // Helper para autocompletar ubicación desde tercero
    private pendingTerceroLocation: {
        country_id?: number | null;
        state_id?: number | null;
        city_id?: number | null;
    } | null = null;

    // Form Data Helpers
    items: any[] = [{ system: '', description: '', quantity: 1, reference: '', files: [] as File[], openSystem: false, systemSearch: '', openDescription: false, descriptionSearch: '', comment: '' }];

    // Image Modal Control
    displayImagesModal: boolean = false;
    selectedItemIndex: number = -1;
    galleriaImages: any[] = [];
    galleriaResponsiveOptions: any[] = [
        { breakpoint: '1024px', numVisible: 5 },
        { breakpoint: '960px', numVisible: 4 },
        { breakpoint: '768px', numVisible: 3 },
        { breakpoint: '560px', numVisible: 1 }
    ];

    userData = {
        name: '',
        email: '',
        phone: '',
        company: '',
        documentType: 'NIT',
        documentNumber: '',
        country: null as Country | null,
        state: null as State | null,
        city: null as City | null,
        address: ''
    };

    // Dropdowns
    openBrand = signal(false);

    readonly filteredBrands = computed(() => {
        const list = this.brands();
        const search = this.brandSearch();
        if (!search) {
            return list;
        }

        return list.filter((b) => this.flexibleMatch(b.nombre, search));
    });

    readonly selectedBrandObj = computed(() => {
        if (!this.selectedBrand) {
            return null;
        }

        return this.brands().find((b) => b.nombre === this.selectedBrand) ?? null;
    });

    readonly activeCategory = computed(() => this.categories().find((c) => c.slug === this.activeTab()));

    readonly allTypes = computed(() => {
        const categories = this.categories();
        if (!categories.length) {
            return [];
        }

        let types = categories
            .flatMap((c) => c.subcategorias || [])
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        const search = this.typeSearch;
        if (search) {
            types = types.filter((t) => this.flexibleMatch(t.nombre, search));
        }

        return types;
    });

    openType = false;

    // Location Dropdowns
    openCountry = false;
    openState = false;
    openCity = false;
    countrySearch = '';
    stateSearch = '';
    citySearch = '';

    // Selections
    selectedBrand = '';
    selectedType = '';
    selectedModel = '';
    selectedSeries = '';
    selectedArrangement = '';
    selectedCard: any = null; // Changed to object to hold the full subcategory

    // Auth
    currentUser: any = null;

    // Tabs
    readonly activeTab = signal('');

    // Comment Modal State
    showCommentModal = false;
    activeCommentIndex: number | null = null;
    tempComment = '';

    constructor(
        private landingService: LandingService,
        private ubicacionService: UbicacionService,
        private clientAuthService: ClientAuthService,
        private referenciaService: ReferenciaService,
        private cd: ChangeDetectorRef
    ) {
        console.log('Cotizar Component Initialized');
    }

    ngOnInit() {
        console.log('Cotizar ngOnInit');

        // Load User from LocalStorage
        const storedUser = localStorage.getItem('clientUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
            this.userData.name = this.currentUser.name;
            this.userData.email = this.currentUser.email;
        }

        // Si hay token de cliente, obtener perfil completo (incluyendo tercero asociado)
        const clientToken = localStorage.getItem('clientToken');
        if (clientToken) {
            this.clientAuthService.me().subscribe({
                next: (data) => {
                    this.currentUser = data;
                    localStorage.setItem('clientUser', JSON.stringify(data));

                    if (data?.tercero) {
                        this.prefillUserDataFromTercero(data.tercero);
                    }
                    this.cd.markForCheck();
                },
                error: (err) => {
                    console.error('Error cargando perfil de cliente para cotizar', err);
                }
            });
        }

        forkJoin({
            quote: this.landingService.getQuoteData(),
            brands: this.landingService.getBrands().pipe(catchError(() => of([])))
        }).subscribe({
            next: ({ quote, brands }) => {
                this.categories.set(quote.categories || []);
                this.systems = quote.systems || [];
                this.articleTypes = quote.articleTypes || [];
                this.models = quote.models || [];

                const quoteBrands = (quote.brands || []) as { id: number; nombre: string; logo?: string }[];
                const endpointBrands = (brands || []).map((b) => ({
                    id: b.id,
                    nombre: b.nombre,
                    logo: b.logo ?? b.foto
                }));
                this.brands.set(quoteBrands.length > 0 ? quoteBrands : endpointBrands);

                this.items.forEach((item) => this.applyItemDefaults(item));

                const cats = this.categories();
                if (cats.length > 0) {
                    this.activeTab.set(cats[0].slug);
                }
            },
            error: (err) => {
                console.error('Error in getQuoteData:', err);
            }
        });

        // Load Countries
        this.ubicacionService.getCountries().subscribe((res) => {
            if (res && res.data) {
                this.countries = res.data;

                // Si hay ubicación pendiente desde el tercero, aplicarla ahora
                if (this.pendingTerceroLocation) {
                    this.applyLocationFromTercero(this.pendingTerceroLocation);
                }

                this.cd.markForCheck();
            }
        });
    }

    get filteredSystems() {
        if (!this.systems) return [];
        return this.systems; // We use per-item search instead for better UX in lists
    }

    private removeAccents(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    private getDefaultSystem(): { id: number; nombre: string } | null {
        if (!this.systems.length) {
            return null;
        }

        return this.systems.find((s) => s.nombre.toLowerCase() === 'por defecto') ?? this.systems[0];
    }

    private getDefaultArticleType(): { id: number; nombre: string; sistema_ids: number[] } | null {
        if (!this.articleTypes.length) {
            return null;
        }

        const byId = this.articleTypes.find((t) => t.id === Cotizar.DEFAULT_ARTICLE_TYPE_ID);
        if (byId) {
            return byId;
        }

        return this.articleTypes.find((t) => t.nombre.toLowerCase() === 'por defecto') ?? null;
    }

    private applyItemDefaults(item: { system?: string; description?: string }): void {
        if (!item.system) {
            const defaultSys = this.getDefaultSystem();
            if (defaultSys) {
                item.system = defaultSys.nombre;
            }
        }

        if (!item.description) {
            const defaultType = this.getDefaultArticleType();
            if (defaultType) {
                item.description = defaultType.nombre;
            }
        }
    }

    private flexibleMatch(text: string, search: string): boolean {
        if (!search) return true;
        const normalizedText = this.removeAccents(text.toLowerCase());
        const searchTerms = this.removeAccents(search.toLowerCase())
            .split(/\s+/)
            .filter((t) => t.length > 0);
        return searchTerms.every((term) => normalizedText.includes(term));
    }

    // Location Handlers
    onCountryChange() {
        this.userData.state = null;
        this.userData.city = null;
        this.states = [];
        this.cities = [];

        if (this.userData.country) {
            this.ubicacionService.getStates(this.userData.country.id).subscribe((res) => {
                this.states = res.data || [];
                this.cd.markForCheck();
            });
        }
    }

    onStateChange() {
        this.userData.city = null;
        this.cities = [];

        if (this.userData.state) {
            this.ubicacionService.getCities(this.userData.state.id).subscribe((res) => {
                this.cities = res.data || [];
                this.cd.markForCheck();
            });
        }
    }

    // Location Dropdown Toggles
    toggleCountry() {
        this.openCountry = !this.openCountry;
        if (this.openCountry) this.closeOthers('country');
        this.cd.markForCheck();
    }

    toggleState() {
        if (!this.userData.country) return;
        this.openState = !this.openState;
        if (this.openState) this.closeOthers('state');
        this.cd.markForCheck();
    }

    toggleCity() {
        if (!this.userData.state) return;
        this.openCity = !this.openCity;
        if (this.openCity) this.closeOthers('city');
        this.cd.markForCheck();
    }

    selectCountry(country: Country) {
        this.userData.country = country;
        this.openCountry = false;
        this.countrySearch = '';
        this.onCountryChange();
        this.cd.markForCheck();
    }

    selectState(state: State) {
        this.userData.state = state;
        this.openState = false;
        this.stateSearch = '';
        this.onStateChange();
        this.cd.markForCheck();
    }

    selectCity(city: City) {
        this.userData.city = city;
        this.openCity = false;
        this.citySearch = '';
        this.cd.markForCheck();
    }

    get filteredCities() {
        if (!this.cities) return [];
        if (!this.citySearch) return this.cities;
        return this.cities.filter((c) => this.flexibleMatch(c.name, this.citySearch));
    }

    get filteredCountries() {
        if (!this.countries) return [];
        if (!this.countrySearch) return this.countries;
        return this.countries.filter((c) => this.flexibleMatch(c.name, this.countrySearch));
    }

    get filteredStates() {
        if (!this.states) return [];
        if (!this.stateSearch) return this.states;
        return this.states.filter((st) => this.flexibleMatch(st.name, this.stateSearch));
    }

    /**
     * Autocompletar datos del solicitante usando la información del tercero asociado
     */
    private prefillUserDataFromTercero(tercero: any) {
        if (!tercero) return;

        // Datos básicos
        this.userData.name = tercero.nombre || this.userData.name;
        this.userData.email = tercero.email || this.userData.email;
        this.userData.phone = tercero.telefono || this.userData.phone;
        this.userData.address = tercero.direccion || this.userData.address;

        // Documento
        if (tercero.tipo_documento) {
            const tipo = (tercero.tipo_documento as string).toLowerCase();
            if (tipo === 'nit') this.userData.documentType = 'NIT';
            else if (tipo === 'cc') this.userData.documentType = 'CC';
            else if (tipo === 'ce') this.userData.documentType = 'CE';
            else this.userData.documentType = this.userData.documentType || 'NIT';
        }
        if (tercero.numero_documento) {
            this.userData.documentNumber = tercero.numero_documento;
        }

        // Guardar ubicación para aplicarla cuando tengamos catálogos cargados
        this.pendingTerceroLocation = {
            country_id: tercero.country_id ?? tercero.country?.id,
            state_id: tercero.state_id ?? tercero.state?.id,
            city_id: tercero.city_id ?? tercero.city?.id
        };

        if (this.countries && this.countries.length > 0) {
            this.applyLocationFromTercero(this.pendingTerceroLocation);
        }
    }

    /**
     * Aplicar ubicación (país/departamento/ciudad) a partir de IDs del tercero
     */
    private applyLocationFromTercero(
        location: {
            country_id?: number | null;
            state_id?: number | null;
            city_id?: number | null;
        } | null
    ) {
        if (!location || !location.country_id || !this.countries.length) {
            return;
        }

        const country = this.countries.find((c) => c.id === location.country_id);
        if (!country) {
            return;
        }

        this.userData.country = country;

        // Cargar departamentos y seleccionar el correspondiente
        this.ubicacionService.getStates(country.id).subscribe((res) => {
            this.states = res.data || [];

            if (location.state_id) {
                const state = this.states.find((s) => s.id === location.state_id);
                if (state) {
                    this.userData.state = state;

                    // Cargar ciudades y seleccionar la correspondiente
                    this.ubicacionService.getCities(state.id).subscribe((resCities) => {
                        this.cities = resCities.data || [];

                        if (location.city_id) {
                            const city = this.cities.find((c) => c.id === location.city_id);
                            if (city) {
                                this.userData.city = city;
                            }
                        }

                        this.cd.markForCheck();
                    });
                } else {
                    this.cd.markForCheck();
                }
            } else {
                this.cd.markForCheck();
            }
        });
    }

    // Functions
    toggleBrand() {
        console.log('Toggle Brand');
        this.openBrand.update((open) => !open);
        if (this.openBrand()) {
            this.closeOthers('brand');
        }
    }

    toggleType() {
        console.log('Toggle Type');
        this.openType = !this.openType;
        if (this.openType) this.closeOthers('type');
        this.cd.detectChanges();
    }

    closeOthers(current: string) {
        if (current !== 'brand') {
            this.openBrand.set(false);
        }
        if (current !== 'type') this.openType = false;
        if (current !== 'country') this.openCountry = false;
        if (current !== 'state') this.openState = false;
        if (current !== 'city') this.openCity = false;
    }

    selectBrand(brand: any) {
        this.selectedBrand = brand.nombre; // We store the name for now as the filter expects string
        this.openBrand.set(false);
        this.brandSearch.set('');
    }

    selectType(type: any) {
        this.selectedType = type.nombre;
        this.openType = false;
        this.typeSearch = '';
        this.cd.markForCheck();
    }

    // Navigation
    goToForm() {
        this.errorMessage = '';

        // Validar campos obligatorios (Issue #59)
        if (!this.selectedBrand || !this.selectedType || !this.selectedModel) {
            this.errorMessage = 'Por favor selecciona marca, tipo de máquina y modelo para continuar.';
            this.cd.detectChanges();
            return;
        }

        this.currentView = 'form';
        this.formStep = 1;
        this.cd.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    preventNegative(event: KeyboardEvent) {
        if (event.key === '-' || event.key === 'e') {
            event.preventDefault();
        }
    }

    goBackToGrid() {
        this.currentView = 'grid';
        this.selectedCard = null;
        this.cd.markForCheck();
    }

    nextFormStep() {
        if (this.formStep === 1) {
            // Validation Logic Step 1
            const hasEmptySystem = this.items.some((item) => !item.system);
            if (hasEmptySystem) {
                alert('Por favor selecciona un sistema para cada ítem.');
                return;
            }

            const hasInvalidQuantity = this.items.some((item) => item.quantity === null || item.quantity < 1);
            if (hasInvalidQuantity) {
                alert('Por favor corrige las cantidades. No se permiten datos negativos o iguales a cero.');
                return;
            }

            this.formStep = 2;
        } else if (this.formStep === 2) {
            // Solo validar marca, tipo y modelo - datos del cliente son opcionales
            this.submit();
        }
        this.cd.markForCheck();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    submit() {
        this.submitting = true;
        this.errorMessage = '';
        this.cd.markForCheck();

        const data = {
            userData: this.userData,
            items: this.items,
            selectedBrand: this.selectedBrand,
            selectedType: this.selectedType,
            selectedModel: this.selectedModel,
            selectedSeries: this.selectedSeries,
            selectedArrangement: this.selectedArrangement
        };

        this.landingService.submitQuote(data).subscribe({
            next: (response) => {
                console.log('Quote submitted successfully', response);
                this.submitting = false;
                this.success = true;
                this.formStep = 3;
                this.cd.markForCheck();
            },
            error: (err) => {
                console.error('Error submitting quote', err);
                this.submitting = false;
                this.errorMessage = 'Hubo un error al enviar tu solicitud. Inténtalo de nuevo.';
                this.cd.markForCheck();
            }
        });
    }

    prevFormStep() {
        if (this.formStep > 1) {
            this.formStep = (this.formStep - 1) as 1 | 2;
        } else {
            this.goBackToGrid();
        }
        this.cd.markForCheck();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Form Items Logic
    addItem() {
        const newItem = {
            system: '',
            description: '',
            quantity: 1,
            reference: '',
            files: [] as File[],
            openSystem: false,
            systemSearch: '',
            openDescription: false,
            descriptionSearch: '',
            comment: ''
        };
        this.applyItemDefaults(newItem);
        this.items.push(newItem);
        this.cd.markForCheck();
    }

    removeItem(index: number) {
        if (this.items.length > 1) {
            this.items.splice(index, 1);
        }
        this.cd.markForCheck();
    }

    duplicateItem(index: number) {
        const item = { ...this.items[index], openSystem: false, systemSearch: '', openDescription: false, descriptionSearch: '', comment: this.items[index].comment || '' };
        this.items.splice(index + 1, 0, item);
        this.cd.markForCheck();
    }

    procesarMasivo() {
        if (!this.bulkText || this.processingBulk) return;

        const lines = this.bulkText.split('\n');
        const referenciasParaProcesar: Array<{ cantidad: number; codigo: string }> = [];

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // Formato: CANTIDAD [TAB o espacios] REFERENCIA
            const match = trimmed.match(/^(\d+)\s+(.+)$/);
            if (match) {
                const cantidad = parseInt(match[1], 10);
                const codigoReferencia = match[2].trim().toUpperCase();

                if (cantidad > 0 && codigoReferencia) {
                    referenciasParaProcesar.push({ cantidad, codigo: codigoReferencia });
                }
            } else {
                // Si no coincide con el formato, asumimos cantidad 1
                referenciasParaProcesar.push({ cantidad: 1, codigo: trimmed.toUpperCase() });
            }
        });

        if (referenciasParaProcesar.length === 0) return;

        this.processingBulk = true;
        this.cd.markForCheck();

        // Buscar el ID de la marca seleccionada
        const brandObj = this.brands().find((b) => b.nombre === this.selectedBrand);
        const marcaId = brandObj ? brandObj.id : null;

        // Llamar al servicio optimizado con el flag esTemporal = true y el marcaId
        this.referenciaService.bulkSearchOrCreate(referenciasParaProcesar, true, marcaId).subscribe({
            next: (response: any) => {
                this.processingBulk = false;
                const resultados = response.data;

                if (resultados && resultados.length > 0) {
                    // Si el primer item está vacío, lo removemos
                    if (this.items.length === 1 && !this.items[0].reference && !this.items[0].description) {
                        this.items = [];
                    }

                    const defaultSys = this.systems.length > 0 ? this.systems[0].nombre : '';

                    resultados.forEach((item: any) => {
                        this.items.push({
                            system: item.referencia?.articulo?.sistema?.nombre || defaultSys,
                            description: item.referencia?.articulo?.definicion || '',
                            quantity: item.cantidad,
                            reference: item.codigo,
                            referencia_id: item.referencia_id, // Guardamos el ID para el submit
                            files: [] as File[],
                            openSystem: false,
                            systemSearch: '',
                            openDescription: false,
                            descriptionSearch: '',
                            comment: ''
                        });
                    });

                    this.bulkText = '';
                    this.showBulkImport = false;
                }
                this.cd.markForCheck();
            },
            error: (err: any) => {
                this.processingBulk = false;
                console.error('Error al procesar referencias masivas en landing', err);
                alert('Hubo un error al procesar las referencias. Inténtalo de nuevo.');
                this.cd.markForCheck();
            }
        });
    }

    toggleItemSystem(index: number) {
        this.items[index].openSystem = !this.items[index].openSystem;
        // Close others
        this.items.forEach((item, i) => {
            if (i !== index) item.openSystem = false;
            item.openDescription = false;
        });
        this.cd.markForCheck();
    }

    toggleItemDescription(index: number) {
        if (!this.items[index].system) return;
        this.items[index].openDescription = !this.items[index].openDescription;
        // Close others
        this.items.forEach((item, i) => {
            if (i !== index) item.openDescription = false;
            item.openSystem = false;
        });
        this.cd.markForCheck();
    }

    onFileSelected(event: any, index: number) {
        const files = Array.from(event.target.files as FileList);
        if (files.length > 0) {
            if (!this.items[index].files) this.items[index].files = [] as File[];

            // Limit to 10 total
            const remaining = 10 - this.items[index].files.length;

            if (remaining <= 0) {
                alert('Ya has alcanzado el máximo de 10 imágenes por ítem.');
                return;
            }

            const toAdd = files.slice(0, remaining);
            this.items[index].files.push(...toAdd);

            // Si el modal está abierto para este ítem, generar previsualizaciones adicionales
            if (this.displayImagesModal && this.selectedItemIndex === index) {
                const newPreviews = toAdd.map((file) => {
                    const url = URL.createObjectURL(file);
                    return { itemImageSrc: url, thumbnailImageSrc: url, file: file };
                });
                this.galleriaImages.push(...newPreviews);
            }

            if (files.length > remaining) {
                alert('Solo se agregaron ' + remaining + ' imágenes. Máximo 10 permitidas por ítem.');
            }

            // Reset input so searching the same file again triggers (change)
            event.target.value = '';

            this.cd.markForCheck();
        }
    }

    removeFile(itemIndex: number, fileIndex: number) {
        if (this.items[itemIndex].files) {
            this.items[itemIndex].files.splice(fileIndex, 1);

            // Si el modal está abierto para este ítem, actualizar las previsualizaciones
            if (this.displayImagesModal && this.selectedItemIndex === itemIndex) {
                if (this.galleriaImages[fileIndex]) {
                    URL.revokeObjectURL(this.galleriaImages[fileIndex].itemImageSrc);
                    this.galleriaImages.splice(fileIndex, 1);
                }

                // Forzar refresco de p-galleria recreando el array
                this.galleriaImages = [...this.galleriaImages];

                if (this.items[itemIndex].files.length === 0) {
                    this.closeImagesModal();
                }
            }
            this.cd.markForCheck();
        }
    }

    openImagesModal(index: number) {
        if (!this.items[index]?.files?.length) return;

        this.selectedItemIndex = index;

        // Limpiar previsualizaciones antiguas
        this.galleriaImages.forEach((p) => URL.revokeObjectURL(p.itemImageSrc));
        this.galleriaImages = [];

        // Crear nuevas previsualizaciones
        this.galleriaImages = this.items[index].files.map((file: File) => {
            const url = URL.createObjectURL(file);
            return { itemImageSrc: url, thumbnailImageSrc: url, file: file };
        });

        this.displayImagesModal = true;
        this.cd.markForCheck();
    }

    closeImagesModal() {
        this.displayImagesModal = false;
        this.selectedItemIndex = -1;
        this.galleriaImages.forEach((p) => URL.revokeObjectURL(p.itemImageSrc));
        this.galleriaImages = [];
        this.cd.markForCheck();
    }

    selectItemSystem(index: number, system: any) {
        if (this.items[index].system !== system.nombre) {
            if (system.nombre.toLowerCase() === 'por defecto') {
                const defaultType = this.getDefaultArticleType();
                this.items[index].description = defaultType?.nombre ?? '';
            } else {
                this.items[index].description = '';
            }
        }
        this.items[index].system = system.nombre;
        this.items[index].openSystem = false;
        this.items[index].systemSearch = '';
        this.cd.markForCheck();
    }

    selectItemDescription(index: number, desc: any) {
        this.items[index].description = desc.nombre;
        // Si el ítem seleccionado pertenece a un sistema diferente al actual, actualizar el sistema del ítem
        if (desc.systemName && this.items[index].system !== desc.systemName) {
            this.items[index].system = desc.systemName;
        }
        this.items[index].openDescription = false;
        this.items[index].descriptionSearch = '';
        this.cd.markForCheck();
    }

    getFilteredSystems(item: any) {
        if (!this.systems) return [];
        if (!item.systemSearch) return this.systems;
        return this.systems.filter((s) => this.flexibleMatch(s.nombre, item.systemSearch));
    }

    getFilteredDescriptions(item: any) {
        if (!this.articleTypes.length) return [];

        const search = item.descriptionSearch;
        const currentSystem = this.systems.find((s) => s.nombre.toLowerCase() === item.system.toLowerCase());

        const typesForSystem = (systemId: number, isDefaultSystem: boolean) => {
            if (isDefaultSystem) {
                return this.articleTypes;
            }

            return this.articleTypes.filter((type) => type.sistema_ids.includes(systemId));
        };

        if (!search) {
            if (!currentSystem) {
                return [];
            }

            const isDefault = currentSystem.nombre.toLowerCase() === 'por defecto';

            return typesForSystem(currentSystem.id, isDefault).map((type) => ({
                id: type.id,
                nombre: type.nombre
            }));
        }

        const allMatches: { id: number; nombre: string; systemName: string }[] = [];

        this.systems.forEach((sys) => {
            const isDefault = sys.nombre.toLowerCase() === 'por defecto';
            typesForSystem(sys.id, isDefault)
                .filter((type) => this.flexibleMatch(type.nombre, search))
                .forEach((type) => {
                    allMatches.push({ id: type.id, nombre: type.nombre, systemName: sys.nombre });
                });
        });

        return allMatches.sort((a, b) => {
            const aIsCurrent = a.systemName === item.system;
            const bIsCurrent = b.systemName === item.system;

            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;

            return a.nombre.localeCompare(b.nombre);
        });
    }

    clearFilters() {
        console.log('Clearing filters');
        this.selectedBrand = '';
        this.selectedType = '';
        this.selectedModel = '';
        this.selectedSeries = '';
        this.selectedCard = null;
        this.cd.markForCheck();
    }

    setActiveTab(tabId: string) {
        this.activeTab.set(tabId);
    }

    selectCard(card: any) {
        this.selectedCard = card;
        this.selectedType = card.nombre;
        this.openType = false;
        this.typeSearch = '';
        this.cd.markForCheck();
    }

    openCommentModal(index: number) {
        this.activeCommentIndex = index;
        this.tempComment = this.items[index].comment || '';
        this.showCommentModal = true;
        this.cd.markForCheck();
    }

    saveComment() {
        if (this.activeCommentIndex !== null) {
            this.items[this.activeCommentIndex].comment = this.tempComment;
        }
        this.closeCommentModal();
    }

    closeCommentModal() {
        this.showCommentModal = false;
        this.activeCommentIndex = null;
        this.tempComment = '';
        this.cd.markForCheck();
    }
}
