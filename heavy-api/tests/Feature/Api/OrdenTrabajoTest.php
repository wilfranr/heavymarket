<?php

use App\Models\OrdenTrabajo;
use App\Models\OrdenTrabajoReferencia;
use App\Models\Tercero;
use Illuminate\Foundation\Testing\RefreshDatabase;

beforeEach(function () {
    $roles = ['super_admin', 'Administrador', 'Logistica', 'Vendedor', 'Analista'];
    foreach ($roles as $roleName) {
        \Spatie\Permission\Models\Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
});

describe('Órdenes de Trabajo - API Tests', function () {
    it('lista órdenes de trabajo', function () {
        $user = createUserWithRole('Logistica');
        OrdenTrabajo::factory()->count(3)->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/v1/ordenes-trabajo');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    });

    it('crea orden de trabajo con datos válidos', function () {
        $user = createUserWithRole('Logistica');
        $tercero = Tercero::factory()->create();

        $data = [
            'tercero_id' => $tercero->id,
            'fecha_ingreso' => now()->toDateString(),
            'telefono' => '3001234567',
            'estado' => 'Pendiente',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/v1/ordenes-trabajo', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('orden_trabajos', [
            'tercero_id' => $tercero->id,
        ]);
    });

    it('valida datos requeridos al crear', function () {
        $user = createUserWithRole('Logistica');

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/v1/ordenes-trabajo', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['fecha_ingreso', 'telefono']);
    });

    it('muestra detalle de una orden', function () {
        $user = createUserWithRole('Logistica');
        $orden = OrdenTrabajo::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/v1/ordenes-trabajo/{$orden->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'estado', 'fecha_ingreso']
            ]);
    });

    it('filtra por estado', function () {
        $user = createUserWithRole('Logistica');
        OrdenTrabajo::factory()->create(['estado' => 'Pendiente']);
        OrdenTrabajo::factory()->create(['estado' => 'En Proceso']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/v1/ordenes-trabajo?estado=Pendiente');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    });

    it('respuesta con paginación', function () {
        $user = createUserWithRole('Logistica');
        OrdenTrabajo::factory()->count(10)->create();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/v1/ordenes-trabajo?per_page=5');

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    });

    it('actualiza el estado de la orden', function () {
        $user = createUserWithRole('Logistica');
        $orden = OrdenTrabajo::factory()->create(['estado' => 'Pendiente']);

        $data = ['estado' => 'En Proceso'];

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/v1/ordenes-trabajo/{$orden->id}", $data);

        $response->assertStatus(200);
        
        // Verificar que se actualizó en la BD
        $this->assertDatabaseHas('orden_trabajos', [
            'id' => $orden->id,
            'estado' => 'En Proceso',
        ]);
    });

    it('actualiza fecha de entrega', function () {
        $user = createUserWithRole('Logistica');
        $orden = OrdenTrabajo::factory()->create();

        $newDate = now()->addDays(10)->toDateString();
        $data = ['fecha_entrega' => $newDate];

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/v1/ordenes-trabajo/{$orden->id}", $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orden_trabajos', [
            'id' => $orden->id,
            'fecha_entrega' => $newDate,
        ]);
    });

    it('permite cancelar orden con motivo', function () {
        $user = createUserWithRole('Administrador');
        $orden = OrdenTrabajo::factory()->create();

        $data = [
            'estado' => 'Cancelado',
            'motivo_cancelacion' => 'Cliente canceló el pedido',
        ];

        $response = $this->actingAs($user, 'sanctum')
            ->putJson("/v1/ordenes-trabajo/{$orden->id}", $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orden_trabajos', [
            'id' => $orden->id,
            'estado' => 'Cancelado',
            'motivo_cancelacion' => 'Cliente canceló el pedido',
        ]);
    });

    it('elimina orden y sus referencias', function () {
        $user = createUserWithRole('Administrador');
        $orden = OrdenTrabajo::factory()->create();
        
        // Crear referencias asociadas
        OrdenTrabajoReferencia::factory()->count(2)->create([
            'orden_trabajo_id' => $orden->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson("/v1/ordenes-trabajo/{$orden->id}");

        $response->assertStatus(204);
        
        // Verificar que se eliminó la orden
        $this->assertDatabaseMissing('orden_trabajos', ['id' => $orden->id]);
        
        // Verificar que se eliminaron las referencias
        $this->assertDatabaseMissing('orden_trabajo_referencias', [
            'orden_trabajo_id' => $orden->id,
        ]);
    });
});