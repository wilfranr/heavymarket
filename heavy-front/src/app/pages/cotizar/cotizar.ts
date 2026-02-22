import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../landing/components/navbar/navbar';
import { FooterSection } from '../../landing/components/footer-section/footer-section';
import { LandingService, Category } from '../../core/services/landing';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { Country, State, City } from '../../core/models/ubicacion.model';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-cotizar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, Navbar, FooterSection],
    templateUrl: './cotizar.html',
    styleUrls: ['./cotizar.css']
})
export class Cotizar implements OnInit {
    // View State
    currentView: 'grid' | 'form' = 'grid';
    formStep: 1 | 2 | 3 = 1;
    submitting = false;
    success = false;

    // Data from API
    categories: Category[] = [];
    brands: { id: number; nombre: string }[] = [];
    systems: { id: number; nombre: string; listas?: { id: number; nombre: string }[] }[] = [];
    models: string[] = [];
    errorMessage = '';
    typeSearch = '';
    brandSearch = '';

    // Location Data
    countries: Country[] = [];
    states: State[] = [];
    cities: City[] = [];

    // Form Data Helpers
    items: any[] = [
        { system: '', description: '', quantity: 1, reference: '', file: null, openSystem: false, systemSearch: '', openDescription: false, descriptionSearch: '' }
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

    // Dropsdowns
    openBrand = false;
    openType = false;

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
    activeTab = '';

    constructor(
        private landingService: LandingService,
        private ubicacionService: UbicacionService,
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

        // Load Quote Data
        this.landingService.getQuoteData().subscribe({
            next: data => {
                console.log('Quote data received:', data);
                this.categories = data.categories || [];
                this.brands = data.brands || [];
                this.systems = data.systems || [];
                this.models = data.models || [];

                if (this.categories.length > 0) {
                    this.activeTab = this.categories[0].slug;
                }
                this.cd.detectChanges();
            },
            error: err => {
                console.error('Error in getQuoteData:', err);
            }
        });

        // Load Countries
        this.ubicacionService.getCountries().subscribe(res => {
            if (res && res.data) {
                this.countries = res.data;
                this.cd.markForCheck();
            }
        });
    }

    // Get active category for iteration in template
    get activeCategory() {
        return this.categories.find(c => c.slug === this.activeTab);
    }

    get allTypes() {
        if (!this.categories) return [];
        let types = this.categories
            .flatMap(c => c.subcategorias || [])
            .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        if (this.typeSearch) {
            const search = this.typeSearch.toLowerCase();
            types = types.filter(t => t.nombre.toLowerCase().includes(search));
        }
        return types;
    }

    get filteredBrands() {
        if (!this.brands) return [];
        if (!this.brandSearch) return this.brands;
        const search = this.brandSearch.toLowerCase();
        return this.brands.filter(b => b.nombre.toLowerCase().includes(search));
    }

    get filteredSystems() {
        if (!this.systems) return [];
        return this.systems; // We use per-item search instead for better UX in lists
    }

    // Location Handlers
    onCountryChange() {
        this.userData.state = null;
        this.userData.city = null;
        this.states = [];
        this.cities = [];

        if (this.userData.country) {
            this.ubicacionService.getStates(this.userData.country.id).subscribe(res => {
                this.states = res.data || [];
                this.cd.markForCheck();
            });
        }
    }

    onStateChange() {
        this.userData.city = null;
        this.cities = [];

        if (this.userData.state) {
            this.ubicacionService.getCities(this.userData.state.id).subscribe(res => {
                this.cities = res.data || [];
                this.cd.markForCheck();
            });
        }
    }

    // Functions
    toggleBrand() {
        console.log('Toggle Brand');
        this.openBrand = !this.openBrand;
        if (this.openBrand) this.closeOthers('brand');
        this.cd.markForCheck();
    }

    toggleType() {
        console.log('Toggle Type');
        this.openType = !this.openType;
        if (this.openType) this.closeOthers('type');
        this.cd.detectChanges();
    }

    closeOthers(current: string) {
        if (current !== 'brand') this.openBrand = false;
        if (current !== 'type') this.openType = false;
    }

    selectBrand(brand: any) {
        this.selectedBrand = brand.nombre; // We store the name for now as the filter expects string
        this.openBrand = false;
        this.brandSearch = '';
        this.cd.markForCheck();
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
        console.log('goToForm called', {
            brand: this.selectedBrand,
            type: this.selectedType,
            model: this.selectedModel,
            series: this.selectedSeries,
            card: this.selectedCard
        });

        if (!this.selectedBrand && !this.selectedType && !this.selectedCard && !this.selectedModel && !this.selectedSeries) {
            this.errorMessage = 'Por favor selecciona una máquina o utiliza los filtros.';
            this.cd.detectChanges();
            return;
        }

        // Populate inputs if selections exist
        if (this.selectedCard) {
            this.selectedType = this.selectedCard.nombre;
        }

        this.currentView = 'form';
        this.formStep = 1;
        this.cd.detectChanges();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    goBackToGrid() {
        this.currentView = 'grid';
        this.selectedCard = null;
        this.cd.markForCheck();
    }

    nextFormStep() {
        if (this.formStep === 1) {
            // Validation Logic Step 1
            const hasEmptySystem = this.items.some(item => !item.system);
            if (hasEmptySystem) {
                alert('Por favor selecciona un sistema para cada ítem.');
                return;
            }
            this.formStep = 2;
        } else if (this.formStep === 2) {
            // Validation Logic Step 2
            if (!this.userData.name || !this.userData.email || !this.userData.phone) {
                alert('Por favor complete los campos requeridos (Nombre, Email, Teléfono)');
                return;
            }
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
        this.items.push({ system: '', description: '', quantity: 1, reference: '', file: null, openSystem: false, systemSearch: '', openDescription: false, descriptionSearch: '' });
        this.cd.markForCheck();
    }

    removeItem(index: number) {
        if (this.items.length > 1) {
            this.items.splice(index, 1);
        }
        this.cd.markForCheck();
    }

    duplicateItem(index: number) {
        const item = { ...this.items[index], openSystem: false, systemSearch: '', openDescription: false, descriptionSearch: '' };
        this.items.splice(index + 1, 0, item);
        this.cd.markForCheck();
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
        const file = event.target.files[0];
        if (file) {
            this.items[index].file = file;
            this.cd.markForCheck();
        }
    }

    selectItemSystem(index: number, system: any) {
        // Reset description if system changes
        if (this.items[index].system !== system.nombre) {
            this.items[index].description = '';
        }
        this.items[index].system = system.nombre;
        this.items[index].openSystem = false;
        this.items[index].systemSearch = '';
        this.cd.markForCheck();
    }

    selectItemDescription(index: number, desc: any) {
        this.items[index].description = desc.nombre;
        this.items[index].openDescription = false;
        this.items[index].descriptionSearch = '';
        this.cd.markForCheck();
    }

    getFilteredSystems(item: any) {
        if (!this.systems) return [];
        if (!item.systemSearch) return this.systems;
        const search = item.systemSearch.toLowerCase();
        return this.systems.filter(s => s.nombre.toLowerCase().includes(search));
    }

    getFilteredDescriptions(item: any) {
        const selectedSys = this.systems.find(s => s.nombre === item.system);
        if (!selectedSys || !selectedSys.listas) return [];

        let descList = selectedSys.listas;
        if (item.descriptionSearch) {
            const search = item.descriptionSearch.toLowerCase();
            descList = descList.filter((d: any) => d.nombre.toLowerCase().includes(search));
        }
        return descList;
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
        this.activeTab = tabId;
        this.cd.markForCheck();
    }

    selectCard(card: any) {
        this.selectedCard = card;
        this.goToForm();
    }
}
