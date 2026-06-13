<?php

use App\Enums\PedidoOrigen;
use App\Http\Requests\StorePedidoRequest;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\Tercero;

/**
 * Tests de Feature para Pedidos
 */
beforeEach(function () {
    seedRoles();
    seedPermissions();

    $this->user = createUserWithRole('Vendedor');
    $this->tercero = Tercero::factory()->create();
});

it('requiere autenticación para listar pedidos', function () {
    $this->getJson('/v1/pedidos')->assertStatus(401);
});

it('permite listar pedidos a usuario autenticado', function () {
    Pedido::factory()->count(5)->create();

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/pedidos');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'user_id', 'tercero_id', 'estado', 'created_at'],
            ],
            'meta' => ['current_page', 'total'],
        ]);
});

it('permite crear pedido con datos válidos', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/pedidos', [
            'tercero_id' => $this->tercero->id,
            'estado' => 'Nuevo',
            'direccion' => 'Calle 123 #45-67',
            'comentario' => 'Pedido de prueba',
        ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'data' => ['id', 'tercero_id', 'estado'],
            'message',
        ]);

    expectDatabaseHas('pedidos', [
        'tercero_id' => $this->tercero->id,
        'estado' => 'Nuevo',
    ]);
});

it('permite crear pedido en estado borrador', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/pedidos', [
            'tercero_id' => $this->tercero->id,
            'estado' => 'Borrador',
            'direccion' => 'Calle 45 #12-34',
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.estado', 'Borrador');

    expectDatabaseHas('pedidos', [
        'tercero_id' => $this->tercero->id,
        'estado' => 'Borrador',
    ]);
});

it('rechaza crear pedido sin tercero_id', function () {
    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/pedidos', [
            'estado' => 'Nuevo',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['tercero_id']);
});

it('permite ver detalle de pedido', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson("/v1/pedidos/{$pedido->id}");

    $response->assertStatus(200)
        ->assertJson([
            'data' => [
                'id' => $pedido->id,
                'tercero_id' => $this->tercero->id,
            ],
        ]);
});

it('permite actualizar pedido', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
        'estado' => 'Nuevo',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'estado' => 'En_Analisis',
            'comentario' => 'Actualizado',
        ]);

    $response->assertStatus(200)
        ->assertJson([
            'data' => ['estado' => 'En_Analisis'],
            'message' => 'Pedido actualizado exitosamente',
        ]);

    expectDatabaseHas('pedidos', [
        'id' => $pedido->id,
        'estado' => 'En_Analisis',
    ]);
});

it('vendedor no puede actualizar pedido en análisis', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
        'estado' => 'En_Analisis',
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'comentario' => 'Intento de edición',
        ])->assertForbidden();
});

it('admin no puede actualizar comercialmente pedido en costeo', function () {
    $admin = createUserWithRole('Administrador');
    $pedido = Pedido::factory()->create([
        'tercero_id' => $this->tercero->id,
        'estado' => 'En_Costeo',
    ]);

    $this->actingAs($admin, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'comentario' => 'Intento admin en costeo',
        ])->assertForbidden();
});

it('super_admin no puede actualizar comercialmente pedido en costeo', function () {
    $superAdmin = createUserWithRole('super_admin');
    $pedido = Pedido::factory()->create([
        'tercero_id' => $this->tercero->id,
        'estado' => 'En_Costeo',
    ]);

    $this->actingAs($superAdmin, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'comentario' => 'Intento super_admin en costeo',
        ])->assertForbidden();
});

it('vendedor no puede eliminar pedido en análisis', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
        'estado' => 'En_Analisis',
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson("/v1/pedidos/{$pedido->id}")->assertForbidden();
});

it('vendedor no puede pasar pedido a costeo', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
        'estado' => 'Nuevo',
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'estado' => 'En_Costeo',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['estado']);

    expectDatabaseHas('pedidos', [
        'id' => $pedido->id,
        'estado' => 'Nuevo',
    ]);
});

it('permite eliminar pedido', function () {
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);

    $this->actingAs($this->user, 'sanctum')
        ->deleteJson("/v1/pedidos/{$pedido->id}")->assertStatus(204);

    expectDatabaseMissing('pedidos', ['id' => $pedido->id]);
});

it('permite filtrar pedidos por estado', function () {
    Pedido::factory()->create([
        'estado' => 'Nuevo',
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);
    Pedido::factory()->create([
        'estado' => 'Enviado',
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);
    Pedido::factory()->create([
        'estado' => 'Nuevo',
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/pedidos?estado=Nuevo');

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

it('paginación funciona correctamente', function () {
    Pedido::factory()->count(20)->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/pedidos?per_page=10');

    $response->assertStatus(200)
        ->assertJsonCount(10, 'data')
        ->assertJsonPath('meta.per_page', 10);
});

it('enviar a análisis persiste estado con máquina revisada', function () {
    $maquina = Maquina::factory()->revisada()->create();
    $pedido = Pedido::factory()->create([
        'user_id' => $this->user->id,
        'tercero_id' => $this->tercero->id,
        'estado' => 'Nuevo',
        'maquina_id' => $maquina->id,
    ]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson("/v1/pedidos/{$pedido->id}/enviar-a-analisis");

    $response->assertStatus(200)
        ->assertJsonPath('data.estado', 'En_Analisis');

    expectDatabaseHas('pedidos', [
        'id' => $pedido->id,
        'estado' => 'En_Analisis',
    ]);
});

it('estado En_Analisis es válido en request', function () {
    $rules = (new StorePedidoRequest)->rules();

    expect($rules)->toHaveKey('estado');
});

it('analista solo ve pedidos en análisis', function () {
    $analista = createUserWithRole('Analista');

    Pedido::factory()->create(['estado' => 'En_Analisis']);
    Pedido::factory()->create(['estado' => 'Nuevo']);
    Pedido::factory()->create(['estado' => 'Enviado']);

    $response = $this->actingAs($analista, 'sanctum')
        ->getJson('/v1/pedidos');

    $response->assertStatus(200);
    $data = $response->json('data');
    expect($data)->toHaveCount(1)
        ->and($data[0]['estado'])->toBe('En_Analisis');
});

it('analista no puede ver pedido fuera de análisis', function () {
    $analista = createUserWithRole('Analista');
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    $this->actingAs($analista, 'sanctum')
        ->getJson("/v1/pedidos/{$pedido->id}")->assertStatus(403);
});

it('vendedor ve pedidos landing y los propios', function () {
    $cliente = createUserWithRole('Cliente');

    $pedidoLanding = Pedido::factory()->landing()->create(['user_id' => $cliente->id]);
    $pedidoDelVendedor = Pedido::factory()->create(['user_id' => $this->user->id]);
    Pedido::factory()->create(['user_id' => $cliente->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/pedidos');

    $response->assertStatus(200);
    $ids = array_column($response->json('data'), 'id');

    expect($ids)->toHaveCount(2)
        ->and($ids)->toContain($pedidoLanding->id, $pedidoDelVendedor->id);
});

it('vendedor no ve pedidos de otros vendedores', function () {
    $otroVendedor = createUserWithRole('Vendedor');

    Pedido::factory()->create(['user_id' => $otroVendedor->id]);
    $pedidoDelVendedor = Pedido::factory()->create(['user_id' => $this->user->id]);

    $response = $this->actingAs($this->user, 'sanctum')
        ->getJson('/v1/pedidos');

    $response->assertStatus(200);
    $data = $response->json('data');

    expect($data)->toHaveCount(1)
        ->and($data[0]['id'])->toBe($pedidoDelVendedor->id);
});

it('vendedor user_id 9 ve pedido landing id 5 en listado y detalle', function () {
    $vendedor = createUserWithRole('Vendedor', ['id' => 9]);
    $cliente = createUserWithRole('Cliente', ['id' => 7]);

    Pedido::factory()->landing()->create([
        'id' => 5,
        'user_id' => $cliente->id,
        'comentario' => 'Cotización Landing: Excavadora 320',
    ]);
    Pedido::factory()->create(['user_id' => createUserWithRole('Vendedor')->id]);

    $this->actingAs($vendedor, 'sanctum')
        ->getJson('/v1/pedidos/5')
        ->assertOk()
        ->assertJsonPath('data.id', 5)
        ->assertJsonPath('data.origen', 'landing');

    $ids = array_column(
        $this->actingAs($vendedor, 'sanctum')->getJson('/v1/pedidos')->json('data'),
        'id'
    );

    expect($ids)->toContain(5)->and($ids)->toHaveCount(1);
});

it('auto-asigna pedido landing al editar', function () {
    $pedido = Pedido::factory()->landing()->create(['user_id' => null]);

    $this->actingAs($this->user, 'sanctum')
        ->putJson("/v1/pedidos/{$pedido->id}", [
            'comentario' => 'Atendido por vendedor',
        ])->assertStatus(200);

    $pedido->refresh();
    expect($pedido->user_id)->toBe($this->user->id)
        ->and($pedido->origen)->toBe(PedidoOrigen::Landing);
});

it('auto-asigna pedido landing id 5 al editar como vendedor user_id 9', function () {
    $vendedor = createUserWithRole('Vendedor', ['id' => 9]);
    $pedido = Pedido::factory()->landing()->create([
        'id' => 5,
        'user_id' => createUserWithRole('Cliente', ['id' => 7])->id,
    ]);

    $this->actingAs($vendedor, 'sanctum')
        ->putJson('/v1/pedidos/5', [
            'comentario' => 'Tomado por vendedor 9',
        ])->assertStatus(200);

    $pedido->refresh();
    expect($pedido->user_id)->toBe(9)
        ->and($pedido->id)->toBe(5)
        ->and($pedido->origen)->toBe(PedidoOrigen::Landing);
});
