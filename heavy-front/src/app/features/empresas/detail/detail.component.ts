import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { loadEmpresaById } from '../../../store/empresas/actions/empresas.actions';
import * as EmpresasSelectors from '../../../store/empresas/selectors/empresas.selectors';
import { Empresa } from '../../../core/models/empresa.model';

/**
 * Componente de detalle de empresa
 */
@Component({
    selector: 'app-empresa-detail',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule, TagModule, DividerModule],
    template: `
        <div class="container mx-auto p-4 max-w-6xl">
            @if (loading()) {
                <div class="flex flex-col items-center justify-center py-20">
                    <i class="pi pi-spin pi-spinner text-4xl text-indigo-600 mb-4"></i>
                    <span class="text-lg text-slate-500 font-medium">Cargando empresa...</span>
                </div>
            } @else if (empresa()) {
                <!-- Botón de retorno y acciones principales -->
                <div class="flex justify-between items-center mb-6">
                    <p-button label="Volver" icon="pi pi-arrow-left" severity="secondary" [text]="true" (onClick)="onBack()"> </p-button>
                    <p-button label="Editar Empresa" icon="pi pi-pencil" severity="warn" (onClick)="onEdit()"> </p-button>
                </div>

                <!-- Banner Principal (Hero Card) -->
                <div class="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-8 shadow-sm">
                    <!-- Degradado del banner -->
                    <div class="h-32 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950"></div>
                    
                    <!-- Información de la cabecera del perfil -->
                    <div class="px-6 pb-6 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-10">
                        <!-- Avatar / Logo -->
                        <div class="w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 shadow-md flex items-center justify-center overflow-hidden">
                            @if (empresa()?.logo_light) {
                                <img [src]="empresa()?.logo_light" [alt]="empresa()?.nombre" class="w-full h-full object-contain p-2" />
                            } @else {
                                <div class="w-full h-full flex items-center justify-center bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-4xl">
                                    {{ (empresa()?.nombre || '') | slice:0:1 | uppercase }}
                                </div>
                            }
                        </div>

                        <!-- Título y metadatos principales -->
                        <div class="flex-1 text-center md:text-left mt-2 md:mt-0">
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                                <h1 class="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
                                    {{ empresa()?.nombre }}
                                </h1>
                                @if (empresa()?.siglas) {
                                    <span class="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {{ empresa()?.siglas }}
                                    </span>
                                }
                            </div>
                            <div class="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1.5 text-sm text-slate-500 dark:text-slate-400">
                                <span class="flex items-center gap-1.5">
                                    <i class="pi pi-id-card text-indigo-500"></i>
                                    <strong>NIT:</strong> {{ empresa()?.nit }}
                                </span>
                                <span class="hidden md:inline text-slate-300 dark:text-slate-700">•</span>
                                <span class="flex items-center gap-1.5">
                                    <i class="pi pi-user text-indigo-500"></i>
                                    <strong>Representante:</strong> {{ empresa()?.representante }}
                                </span>
                            </div>
                        </div>

                        <!-- Tag de Estado -->
                        <div class="mt-4 md:mt-0 self-center md:self-end">
                            <p-tag 
                                [value]="empresa()?.estado ? 'Activa' : 'Inactiva'" 
                                [severity]="empresa()?.estado ? 'success' : 'secondary'"
                                styleClass="text-sm px-4 py-1.5 font-semibold rounded-full shadow-sm">
                            </p-tag>
                        </div>
                    </div>
                </div>

                <!-- Grilla de Detalles -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <!-- Columna Izquierda: Contacto y Ubicación -->
                    <div class="space-y-8">
                        <!-- Tarjeta de Contacto -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <i class="pi pi-envelope text-indigo-500"></i>
                                Información de Contacto
                            </h2>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Email Corporativo</span>
                                    <a [href]="'mailto:' + empresa()?.email" class="text-slate-700 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 break-all">
                                        <i class="pi pi-envelope text-slate-400 flex-shrink-0"></i>
                                        {{ empresa()?.email }}
                                    </a>
                                </div>

                                <div class="space-y-1">
                                    <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Teléfono Celular</span>
                                    <a [href]="'tel:' + empresa()?.celular" class="text-slate-700 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                                        <i class="pi pi-mobile text-slate-400"></i>
                                        {{ empresa()?.celular }}
                                    </a>
                                </div>

                                @if (empresa()?.telefono) {
                                    <div class="space-y-1">
                                        <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Teléfono Fijo</span>
                                        <a [href]="'tel:' + empresa()?.telefono" class="text-slate-700 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2">
                                            <i class="pi pi-phone text-slate-400"></i>
                                            {{ empresa()?.telefono }}
                                        </a>
                                    </div>
                                }
                            </div>
                        </div>

                        <!-- Tarjeta de Ubicación -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <i class="pi pi-map-marker text-indigo-500"></i>
                                Ubicación y Dirección
                            </h2>
                            
                            <div class="space-y-6">
                                <div class="space-y-1">
                                    <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Dirección Principal</span>
                                    <span class="text-slate-700 dark:text-slate-300 font-medium flex items-start gap-2">
                                        <i class="pi pi-map-marker text-slate-400 mt-1"></i>
                                        {{ empresa()?.direccion }}
                                    </span>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div class="space-y-1">
                                        <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Ciudad</span>
                                        <span class="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                            <i class="pi pi-map text-slate-400"></i>
                                            {{ empresa()?.city?.name || 'N/A' }}
                                        </span>
                                    </div>

                                    <div class="space-y-1">
                                        <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Estado / Depto.</span>
                                        <span class="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                            <i class="pi pi-compass text-slate-400"></i>
                                            {{ empresa()?.state?.name || 'N/A' }}
                                        </span>
                                    </div>

                                    <div class="space-y-1">
                                        <span class="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">País</span>
                                        <span class="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                            <i class="pi pi-globe text-slate-400"></i>
                                            {{ empresa()?.country?.name || 'N/A' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Columna Derecha: Configuración Comercial y Logos -->
                    <div class="space-y-8">
                        <!-- Tarjeta de Configuración Comercial -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <i class="pi pi-truck text-indigo-500"></i>
                                Configuración Comercial
                            </h2>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/65 flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                                        <i class="pi pi-truck"></i>
                                    </div>
                                    <div class="space-y-0.5">
                                        <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Costo de Flete (por kg)</span>
                                        <span class="text-lg font-bold text-slate-800 dark:text-white">
                                            {{ (empresa()?.flete | currency:'USD':'symbol':'1.2-2') || 'N/A' }}
                                        </span>
                                    </div>
                                </div>

                                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/65 flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xl">
                                        <i class="pi pi-dollar"></i>
                                    </div>
                                    <div class="space-y-0.5">
                                        <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">TRM Establecida</span>
                                        <span class="text-lg font-bold text-slate-800 dark:text-white">
                                            {{ (empresa()?.trm | number:'1.2-2') || 'N/A' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta de Logos de Identidad -->
                        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                <i class="pi pi-image text-indigo-500"></i>
                                Logos de Identidad
                            </h2>
                            
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <!-- Logo Light -->
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white">
                                    <div class="text-xs font-semibold text-slate-400 p-3 border-b border-slate-100 uppercase tracking-wider flex items-center justify-between">
                                        <span>Logo Tema Claro</span>
                                        <i class="pi pi-sun text-yellow-500"></i>
                                    </div>
                                    <div class="h-32 flex items-center justify-center p-4 bg-slate-50">
                                        @if (empresa()?.logo_light) {
                                            <img [src]="empresa()?.logo_light" [alt]="empresa()?.nombre + ' Logo Light'" class="max-h-full max-w-full object-contain" />
                                        } @else {
                                            <div class="text-slate-400 text-sm flex flex-col items-center gap-1">
                                                <i class="pi pi-image text-2xl"></i>
                                                <span>No configurado</span>
                                            </div>
                                        }
                                    </div>
                                </div>

                                <!-- Logo Dark -->
                                <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                                    <div class="text-xs font-semibold text-slate-500 p-3 border-b border-slate-900 uppercase tracking-wider flex items-center justify-between">
                                        <span>Logo Tema Oscuro</span>
                                        <i class="pi pi-moon text-indigo-400"></i>
                                    </div>
                                    <div class="h-32 flex items-center justify-center p-4 bg-slate-900">
                                        @if (empresa()?.logo_dark) {
                                            <img [src]="empresa()?.logo_dark" [alt]="empresa()?.nombre + ' Logo Dark'" class="max-h-full max-w-full object-contain" />
                                        } @else {
                                            <div class="text-slate-600 text-sm flex flex-col items-center gap-1">
                                                <i class="pi pi-image text-2xl"></i>
                                                <span>No configurado</span>
                                            </div>
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <p-divider />

                <!-- Pie de página de Auditoría -->
                <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 text-xs text-slate-400 dark:text-slate-500">
                    <span class="flex items-center gap-1.5">
                        <i class="pi pi-calendar-plus"></i>
                        Creado: {{ empresa()?.created_at | date:'medium' }}
                    </span>
                    <span class="flex items-center gap-1.5">
                        <i class="pi pi-history"></i>
                        Última Actualización: {{ empresa()?.updated_at | date:'medium' }}
                    </span>
                </div>
            } @else {
                <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
                    <i class="pi pi-exclamation-triangle text-4xl text-amber-500 mb-4"></i>
                    <h3 class="text-lg font-bold text-slate-800 dark:text-white mb-2">Empresa no encontrada</h3>
                    <p class="text-slate-500 dark:text-slate-400 mb-6">La empresa solicitada no existe o no se pudo cargar.</p>
                    <p-button label="Volver a la lista" icon="pi pi-arrow-left" severity="secondary" (onClick)="onBack()"> </p-button>
                </div>
            }
        </div>
    `,
    styles: []
})
export class DetailComponent implements OnInit {
    private readonly store = inject(Store);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    empresa = signal<Empresa | null>(null);
    empresaId = signal<number>(0);
    loading = signal(true);

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.empresaId.set(+id);
            this.loadEmpresa(+id);
        }
    }

    private loadEmpresa(id: number): void {
        this.store.dispatch(loadEmpresaById({ id }));

        this.store.select(EmpresasSelectors.selectEmpresaById(id)).subscribe((empresa) => {
            if (empresa) {
                this.empresa.set(empresa);
                this.loading.set(false);
            }
        });
    }

    onEdit(): void {
        this.router.navigate(['/app/empresas', this.empresaId(), 'edit']);
    }

    onBack(): void {
        this.router.navigate(['/app/empresas']);
    }
}

