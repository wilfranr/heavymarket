import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { createOrdenCompra } from '../../../store/ordenes-compra/actions/ordenes-compra.actions';
import { CreateOrdenCompraDto, OrdenCompraEstado, OrdenCompraColor } from '../../../core/models/orden-compra.model';
import { TerceroService } from '../../../core/services/tercero.service';
import { PedidoService } from '../../../core/services/pedido.service';
import { CotizacionService } from '../../../core/services/cotizacion.service';

/**
 * Componente de creación de orden de compra
 */
@Component({
  selector: 'app-orden-compra-create',
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
    InputNumberModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <h2>Crear Orden de Compra</h2>

      <form [formGroup]="ordenCompraForm" (ngSubmit)="onSubmit()">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="proveedor_id" class="block mb-2">
              Proveedor <span class="text-red-500">*</span>
            </label>
            <p-select
              formControlName="proveedor_id"
              [options]="proveedores"
              placeholder="Seleccione un proveedor"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
            @if (ordenCompraForm.get('proveedor_id')?.invalid && ordenCompraForm.get('proveedor_id')?.touched) {
              <small class="text-red-500">El proveedor es requerido</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="pedido_id" class="block mb-2">Pedido</label>
            <p-select
              formControlName="pedido_id"
              [options]="pedidos"
              placeholder="Seleccione un pedido (opcional)"
              [filter]="true"
              [showClear]="true"
              styleClass="w-full">
            </p-select>
          </div>

          <div class="col-12 md:col-6">
            <label for="fecha_expedicion" class="block mb-2">
              Fecha de Expedición <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              formControlName="fecha_expedicion"
              [min]="minDate.toISOString().split('T')[0]"
              class="w-full p-inputtext p-component"
              style="width: 100%">
            @if (ordenCompraForm.get('fecha_expedicion')?.invalid && ordenCompraForm.get('fecha_expedicion')?.touched) {
              <small class="text-red-500">La fecha de expedición es requerida</small>
            }
          </div>

          <div class="col-12 md:col-6">
            <label for="fecha_entrega" class="block mb-2">
              Fecha de Entrega <span class="text-red-500">*</span>
            </label>
            <input
              type="date"
              formControlName="fecha_entrega"
              [min]="minDate.toISOString().split('T')[0]"
              class="w-full p-inputtext p-component"
              style="width: 100%">
            @if (ordenCompraForm.get('fecha_entrega')?.invalid && ordenCompraForm.get('fecha_entrega')?.touched) {
              <small class="text-red-500">La fecha de entrega es requerida</small>
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
            <label for="color" class="block mb-2">Color</label>
            <p-select
              formControlName="color"
              [options]="coloresOptions"
              placeholder="Seleccione un color"
              styleClass="w-full">
            </p-select>
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

          <div class="col-12 md:col-6">
            <label for="direccion" class="block mb-2">Dirección</label>
            <input
              type="text"
              formControlName="direccion"
              pInputText
              placeholder="Dirección de entrega"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="telefono" class="block mb-2">Teléfono</label>
            <input
              type="text"
              formControlName="telefono"
              pInputText
              placeholder="Teléfono de contacto"
              styleClass="w-full">
          </div>

          <div class="col-12 md:col-6">
            <label for="guia" class="block mb-2">Guía</label>
            <input
              type="text"
              formControlName="guia"
              pInputText
              placeholder="Número de guía"
              styleClass="w-full">
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
            label="Crear Orden de Compra"
            icon="pi pi-check"
            type="submit"
            [loading]="loading"
            [disabled]="ordenCompraForm.invalid">
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

  ordenCompraForm!: FormGroup;
  loading = false;
  proveedores: any[] = [];
  pedidos: any[] = [];
  minDate = new Date();

  estadosOptions: Array<{ label: string; value: OrdenCompraEstado }> = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En proceso', value: 'En proceso' },
    { label: 'Entregado', value: 'Entregado' },
    { label: 'Cancelado', value: 'Cancelado' },
  ];

  coloresOptions: Array<{ label: string; value: OrdenCompraColor }> = [
    { label: 'En proceso', value: '#FFFF00' },
    { label: 'Entregado', value: '#00ff00' },
    { label: 'Cancelado', value: '#ff0000' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadOptions();
  }

  private initForm(): void {
    this.ordenCompraForm = this.fb.group({
      proveedor_id: [null, [Validators.required]],
      pedido_id: [null],
      cotizacion_id: [null],
      tercero_id: [null],
      fecha_expedicion: [null, [Validators.required]],
      fecha_entrega: [null, [Validators.required]],
      estado: ['Pendiente'],
      color: ['#FFFF00'],
      observaciones: [''],
      direccion: [''],
      telefono: [''],
      guia: [''],
    });
  }

  private loadOptions(): void {
    // Cargar proveedores
    this.terceroService.list({ per_page: 200, es_proveedor: true }).subscribe({
      next: (response) => {
        this.proveedores = response.data.map((t) => ({
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
    if (this.ordenCompraForm.invalid) {
      this.markFormGroupTouched(this.ordenCompraForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Por favor completa todos los campos requeridos',
      });
      return;
    }

    this.loading = true;

    const formValue = this.ordenCompraForm.value;
    const data: CreateOrdenCompraDto = {
      proveedor_id: formValue.proveedor_id,
      pedido_id: formValue.pedido_id || undefined,
      cotizacion_id: formValue.cotizacion_id || undefined,
      tercero_id: formValue.tercero_id || undefined,
      fecha_expedicion: new Date(formValue.fecha_expedicion).toISOString().split('T')[0],
      fecha_entrega: new Date(formValue.fecha_entrega).toISOString().split('T')[0],
      estado: formValue.estado,
      color: formValue.color,
      observaciones: formValue.observaciones || undefined,
      direccion: formValue.direccion || undefined,
      telefono: formValue.telefono || undefined,
      guia: formValue.guia || undefined,
    };

    this.store.dispatch(createOrdenCompra({ data }));

    // Escuchar el resultado
    const subscription = this.store
      .select((state: any) => state.ordenesCompra)
      .subscribe((ordenesCompraState: any) => {
        if (!ordenesCompraState.loading && this.loading) {
          this.loading = false;
          subscription.unsubscribe();

          if (ordenesCompraState.error) {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: ordenesCompraState.error,
            });
          } else {
            this.router.navigate(['/app/ordenes-compra']);
          }
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/app/ordenes-compra']);
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
