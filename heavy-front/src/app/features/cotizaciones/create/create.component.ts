import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DatePickerModule } from 'primeng/datepicker';
import { createCotizacion } from '../../../store/cotizaciones/actions/cotizaciones.actions';
import { CreateCotizacionDto, CotizacionEstado } from '../../../core/models/cotizacion.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';

/**
 * Componente de creación de cotización
 */
@Component({
  selector: 'app-cotizacion-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    ToastModule,
    DatePickerModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Crear Cotización</h2>

      <form [formGroup]="cotizacionForm" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="pedido_id" class="block mb-2">
              Pedido <span class="text-red-500">*</span>
            </label>
            <p-select
              formControlName="pedido_id"
              [options]="pedidos"
              placeholder="Seleccione un pedido"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
            @if (cotizacionForm.get('pedido_id')?.invalid && cotizacionForm.get('pedido_id')?.touched) {
              <small class="text-red-500">El pedido es requerido</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="tercero_id" class="block mb-2">
              Cliente <span class="text-red-500">*</span>
            </label>
            <p-select
              formControlName="tercero_id"
              [options]="terceros"
              placeholder="Seleccione un cliente"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
            @if (cotizacionForm.get('tercero_id')?.invalid && cotizacionForm.get('tercero_id')?.touched) {
              <small class="text-red-500">El cliente es requerido</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="estado" class="block mb-2">Estado</label>
            <p-select
              formControlName="estado"
              [options]="estadosOptions"
              placeholder="Seleccione un estado"
              styleClass="w-full">
            </p-select>
          </div>

          <div class="col-12 md:col-6">
            <label for="fecha_vencimiento" class="block mb-2">Fecha de Vencimiento</label>
            <input
              type="date"
              formControlName="fecha_vencimiento"
              [min]="minDate.toISOString().split('T')[0]"
              class="w-full p-inputtext p-component">
          </div>

          <div class="col-12">
            <label for="observaciones" class="block mb-2">Observaciones</label>
            <textarea
              formControlName="observaciones"
              pInputTextarea
              rows="4"
              placeholder="Observaciones adicionales..."
              styleClass="w-full">
            </textarea>
          </div>
        </div>

        <div class="flex justify-content-end gap-2 mt-4">
          <p-button
            label="Cancelar"
            severity="secondary"
            icon="pi pi-times"
            type="button"
            [outlined]="true"
            (onClick)="onCancel()">
          </p-button>
          <p-button
            label="Crear Cotización"
            icon="pi pi-check"
            type="submit"
            [loading]="loading"
            [disabled]="cotizacionForm.invalid">
          </p-button>
        </div>
      </form>
    </div>
    <p-toast></p-toast>
  `,
  styles: [],
})
export class CreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly terceroService = inject(TerceroService);
  private readonly pedidoService = inject(PedidoService);

  cotizacionForm!: FormGroup;
  loading = false;
  terceros: any[] = [];
  pedidos: any[] = [];
  minDate = new Date();

  estadosOptions: Array<{ label: string; value: CotizacionEstado }> = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'Enviada', value: 'Enviada' },
    { label: 'Aprobada', value: 'Aprobada' },
    { label: 'Rechazada', value: 'Rechazada' },
    { label: 'Vencida', value: 'Vencida' },
    { label: 'En Proceso', value: 'En_Proceso' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadOptions();
  }

  private initForm(): void {
    this.cotizacionForm = this.fb.group({
      pedido_id: [null, [Validators.required]],
      tercero_id: [null, [Validators.required]],
      estado: ['En_Proceso'],
      fecha_vencimiento: [null],
      observaciones: [''],
    });
  }

  private loadOptions(): void {
    // Cargar terceros
    this.terceroService.list({ per_page: 200, es_cliente: true }).subscribe({
      next: (response) => {
        this.terceros = response.data.map((t) => ({
          label: t.razon_social || t.nombre_comercial || `Tercero ${t.id}`,
          value: t.id,
        }));
      },
    });

    // Cargar pedidos
    this.pedidoService.list({ per_page: 200 }).subscribe({
      next: (response) => {
        this.pedidos = response.data.map((p: any) => ({
          label: `Pedido #${p.id} - ${p.tercero?.razon_social || 'N/A'}`,
          value: p.id,
        }));
      },
    });
  }

  onSubmit(): void {
    if (this.cotizacionForm.invalid) {
      this.markFormGroupTouched(this.cotizacionForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.loading = true;

    const formValue = this.cotizacionForm.value;
    const data: CreateCotizacionDto = {
      pedido_id: formValue.pedido_id,
      tercero_id: formValue.tercero_id,
      estado: formValue.estado,
      fecha_vencimiento: formValue.fecha_vencimiento
        ? new Date(formValue.fecha_vencimiento).toISOString().split('T')[0]
        : undefined,
      observaciones: formValue.observaciones || undefined,
    };

    this.store.dispatch(createCotizacion({ data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.cotizaciones)
      .subscribe((cotizacionesState: any) => {
        if (!cotizacionesState.loading && this.loading) {
          this.loading = false;
          subscription.unsubscribe();

          if (cotizacionesState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: cotizacionesState.error,
            });
          } else {
            this.router.navigate(['/app/cotizaciones']);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/cotizaciones']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
