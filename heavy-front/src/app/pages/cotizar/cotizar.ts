import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../landing/components/navbar/navbar';
import { FooterSection } from '../../landing/components/footer-section/footer-section';
import { LandingService, Category } from '../../core/services/landing';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { Country, State, City } from '../../core/models/ubicacion.model';

@Component({
    selector: 'app-cotizar',
    standalone: true,
    imports: [CommonModule, FormsModule, Navbar, FooterSection],
    templateUrl: './cotizar.html',
    styleUrls: ['./cotizar.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Cotizar implements OnInit {
    // View State
    currentView: 'grid' | 'form' = 'grid';
    formStep: 1 | 2 | 3 = 1;

    // Data from API
    categories: Category[] = [];
    brands: { id: number; nombre: string }[] = [];
    systems: { id: number; nombre: string }[] = [];
    models: string[] = [];

    // Location Data
    countries: Country[] = [];
    states: State[] = [];
    cities: City[] = [];

    // Form Data Helpers
    items: any[] = [
        { system: '', description: '', quantity: 1, reference: '', file: null }
    ];

    userData = {
        name: '',
        email: '',
        phone: '',
        company: '',
        country: null as Country | null,
        state: null as State | null,
        city: null as City | null,
        address: ''
    };

    // Dropdown States
    openBrand = false;
    openType = false;
    openModel = false;
    openSeries = false;

    // Selections
    selectedBrand = '';
    selectedType = '';
    selectedModel = '';
    selectedSeries = '';
    selectedCard: any = null; // Changed to object to hold the full subcategory

    // Tabs
    activeTab = '';

    constructor(
        private landingService: LandingService,
        private ubicacionService: UbicacionService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit() {
        // Load Quote Data
        this.landingService.getQuoteData().subscribe(data => {
            this.categories = data.categories || [];
            this.brands = data.brands || [];
            this.systems = data.systems || [];
            this.models = data.models || [];

            if (this.categories.length > 0) {
                this.activeTab = this.categories[0].slug;
            }
            this.cd.markForCheck();
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
        return this.categories.flatMap(c => c.subcategorias).sort((a, b) => a.nombre.localeCompare(b.nombre));
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
        this.openBrand = !this.openBrand;
        if (this.openBrand) this.closeOthers('brand');
    }

    toggleType() {
        this.openType = !this.openType;
        if (this.openType) this.closeOthers('type');
    }

    toggleModel() {
        this.openModel = !this.openModel;
        if (this.openModel) this.closeOthers('model');
    }

    toggleSeries() {
        this.openSeries = !this.openSeries;
        if (this.openSeries) this.closeOthers('series');
    }

    closeOthers(current: string) {
        if (current !== 'brand') this.openBrand = false;
        if (current !== 'type') this.openType = false;
        if (current !== 'model') this.openModel = false;
        if (current !== 'series') this.openSeries = false;
    }

    selectBrand(brand: any) {
        this.selectedBrand = brand.nombre; // We store the name for now as the filter expects string
        this.openBrand = false;
    }

    selectType(type: any) {
        this.selectedType = type.nombre;
        this.openType = false;
    }

    selectModel(model: string) {
        this.selectedModel = model;
        this.openModel = false;
    }

    selectSeries(serie: string) {
        this.selectedSeries = serie;
        this.openSeries = false;
    }

    // Navigation
    goToForm() {
        if (!this.selectedBrand && !this.selectedType && !this.selectedCard) {
            alert('Por favor selecciona una máquina o utiliza los filtros.');
            return;
        }

        // Populate inputs if card selected
        if (this.selectedCard) {
            // If a card was selected, we assume that IS the type
            this.selectedType = this.selectedCard.nombre;
            // Ensure at least one item exists
            if (this.items.length === 0) this.addItem();
        }

        this.currentView = 'form';
        this.formStep = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    goBackToGrid() {
        this.currentView = 'grid';
        this.selectedCard = null;
    }

    nextFormStep() {
        if (this.formStep === 1) {
            // Validation Logic Step 1
            this.formStep = 2;
        } else if (this.formStep === 2) {
            // Validation Logic Step 2 (Optional for now)
            if (!this.userData.name || !this.userData.email || !this.userData.phone) {
                alert('Por favor complete los campos requeridos (Nombre, Email, Teléfono)');
                return;
            }
            this.formStep = 3;
        }
    }

    prevFormStep() {
        if (this.formStep > 1) {
            this.formStep = (this.formStep - 1) as 1 | 2;
        } else {
            this.goBackToGrid();
        }
    }

    // Form Items Logic
    addItem() {
        this.items.push({ system: '', description: '', quantity: 1, reference: '', file: null });
    }

    removeItem(index: number) {
        if (this.items.length > 1) {
            this.items.splice(index, 1);
        }
    }

    duplicateItem(index: number) {
        const item = { ...this.items[index] };
        this.items.splice(index + 1, 0, item);
    }

    clearFilters() {
        this.selectedBrand = '';
        this.selectedType = '';
        this.selectedModel = '';
        this.selectedSeries = '';
        this.selectedCard = null;
    }

    setActiveTab(tabId: string) {
        this.activeTab = tabId;
    }

    selectCard(card: any) {
        this.selectedCard = card;
        this.goToForm();
    }
}
