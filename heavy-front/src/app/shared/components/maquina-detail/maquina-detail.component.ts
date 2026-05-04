import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageModule } from 'primeng/image';

@Component({
  selector: 'app-maquina-detail',
  standalone: true,
  imports: [CommonModule, ImageModule],
  template: `
    @if (maquina(); as m) {
        <div class="p-6 rounded-lg dark:bg-[#1a1a1a]">
            <!-- Specs Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Serie</span>
                    <span class="text-sm font-bold text-gray-800 dark:text-white">{{ m.serie || 'N/A' }}</span>
                </div>
                <div class="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">ID Interno</span>
                    <span class="text-sm font-bold text-gray-800 dark:text-white">{{ m.id_interno || 'N/A' }}</span>
                </div>
                <div class="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Arreglo</span>
                    <span class="text-sm font-bold text-gray-800 dark:text-white">{{ m.arreglo || 'N/A' }}</span>
                </div>
                <div class="bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1">
                    <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Estado</span>
                    <span class="text-sm font-bold uppercase" [class.text-green-500]="m.estado_revision === 'revisado'">
                        {{ m.estado_revision || 'N/A' }}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <h3 class="font-bold mb-2 uppercase text-sm text-gray-700 dark:text-white">FOTO DE MÁQUINA</h3>
                    <div class="aspect-video bg-gray-100 dark:bg-black/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <p-image [src]="m.imagen_url || 'assets/images/no-image.png'" alt="Foto Máquina" [preview]="true" width="100%" height="100%" imageClass="w-full h-full object-cover"></p-image>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold mb-2 uppercase text-sm text-gray-700 dark:text-white">FOTO ID</h3>
                    <div class="aspect-video bg-gray-100 dark:bg-black/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <p-image [src]="m.imagen_placa_url || 'assets/images/no-image.png'" alt="Foto Placa" [preview]="true" width="100%" height="100%" imageClass="w-full h-full object-cover"></p-image>
                    </div>
                </div>
            </div>

            <!-- Componentes Dinámicos -->
            @if (m.componentes && m.componentes.length > 0) {
                <div class="space-y-8">
                    @for (comp of m.componentes; track comp.id) {
                        <div class="mb-6">
                            <h3 class="font-bold mb-2 text-lg text-gray-800 dark:text-white uppercase tracking-tight">
                                {{ comp.sistema?.nombre || 'Componente' }}
                            </h3>
                            <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                <div class="grid grid-cols-5 machine-table-header text-sm">
                                    <div>Marca</div><div>Modelo</div><div>Serie</div><div>Comentario</div><div>Foto</div>
                                </div>
                                <div class="grid grid-cols-5 items-center text-sm bg-white dark:bg-[#262626] text-gray-800 dark:text-[#e5e5e5]">
                                    <div class="p-3">{{ comp.marca?.nombre || 'N/A' }}</div>
                                    <div class="p-3">{{ comp.modelo || 'N/A' }}</div>
                                    <div class="p-3">{{ comp.serie || 'N/A' }}</div>
                                    <div class="p-3 text-xs">{{ comp.comentario || 'N/A' }}</div>
                                    <div class="p-3">
                                        <div class="h-16 w-16 bg-gray-100 dark:bg-black/20 rounded border border-gray-300 dark:border-gray-600 overflow-hidden">
                                            <p-image [src]="comp.foto_placa || 'assets/images/no-image.png'" [preview]="true" width="100%" height="100%" imageClass="w-full h-full object-cover"></p-image>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            } @else {
                <div class="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-transparent">
                    <i class="pi pi-box text-4xl text-gray-400 mb-2"></i>
                    <p class="text-gray-500 dark:text-gray-400">Esta máquina no tiene componentes registrados aún.</p>
                </div>
            }
        </div>
    }
  `,
  styles: [`
    .machine-table-header {
        background-color: #FDB831;
        color: #000;
        font-weight: bold;
        padding: 0.5rem;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
    }
  `]
})
export class MaquinaDetailComponent {
  maquina = input<any>(null);
}
