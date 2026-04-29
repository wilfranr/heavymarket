<?php

/**
 * Tests para PedidoPolicy
 * 
 * Valida todas las reglas de autorización para pedidos
 */

use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    seedRoles();
    seedPermissions();
});

// === viewAny ===

it('super_admin puede ver cualquier pedido', function () {
    $user = createUserWithRole('super_admin');
    expect($user->can('viewAny', Pedido::class))->toBeTrue();
});

it('administrador puede ver cualquier pedido', function () {
    $user = createUserWithRole('Administrador');
    expect($user->can('viewAny', Pedido::class))->toBeTrue();
});

it('vendedor puede ver pedidos', function () {
    $user = createUserWithRole('Vendedor');
    expect($user->can('viewAny', Pedido::class))->toBeTrue();
});

it('analista puede ver pedidos', function () {
    $user = createUserWithRole('Analista');
    expect($user->can('viewAny', Pedido::class))->toBeTrue();
});

it('logística puede ver pedidos', function () {
    $user = createUserWithRole('Logistica');
    expect($user->can('viewAny', Pedido::class))->toBeTrue();
});

it('cliente no puede listar pedidos', function () {
    $user = createUserWithRole('Cliente');
    expect($user->can('viewAny', Pedido::class))->toBeFalse();
});

// === view ===

it('admin puede ver cualquier pedido', function () {
    $admin = createUserWithRole('Administrador');
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($admin->can('view', $pedido))->toBeTrue();
});

it('analista solo ve pedidos en análisis', function () {
    $analista = createUserWithRole('Analista');

    $pedidoAnalisis = Pedido::factory()->create(['estado' => 'En_Analisis']);
    $pedidoNuevo = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($analista->can('view', $pedidoAnalisis))->toBeTrue()
        ->and($analista->can('view', $pedidoNuevo))->toBeFalse();
});

it('vendedor ve sus propios pedidos', function () {
    $vendedor = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create(['user_id' => $vendedor->id]);

    expect($vendedor->can('view', $pedido))->toBeTrue();
});

it('vendedor ve pedidos de clientes', function () {
    $vendedor = createUserWithRole('Vendedor');
    $cliente = createUserWithRole('Cliente');
    $pedido = Pedido::factory()->create(['user_id' => $cliente->id]);

    expect($vendedor->can('view', $pedido))->toBeTrue();
});

it('vendedor no ve pedidos de otros vendedores', function () {
    $vendedor1 = createUserWithRole('Vendedor');
    $vendedor2 = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create(['user_id' => $vendedor2->id]);

    expect($vendedor1->can('view', $pedido))->toBeFalse();
});

// === create ===

it('super_admin puede crear pedidos', function () {
    $user = createUserWithRole('super_admin');
    expect($user->can('create', Pedido::class))->toBeTrue();
});

it('administrador puede crear pedidos', function () {
    $user = createUserWithRole('Administrador');
    expect($user->can('create', Pedido::class))->toBeTrue();
});

it('vendedor puede crear pedidos', function () {
    $user = createUserWithRole('Vendedor');
    expect($user->can('create', Pedido::class))->toBeTrue();
});

it('analista no puede crear pedidos', function () {
    $user = createUserWithRole('Analista');
    expect($user->can('create', Pedido::class))->toBeFalse();
});

it('cliente no puede crear pedidos', function () {
    $user = createUserWithRole('Cliente');
    expect($user->can('create', Pedido::class))->toBeFalse();
});

// === update ===

it('admin puede actualizar cualquier pedido', function () {
    $admin = createUserWithRole('Administrador');
    $pedido = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($admin->can('update', $pedido))->toBeTrue();
});

it('analista solo puede actualizar pedidos en análisis', function () {
    $analista = createUserWithRole('Analista');

    $pedidoAnalisis = Pedido::factory()->create(['estado' => 'En_Analisis']);
    $pedidoNuevo = Pedido::factory()->create(['estado' => 'Nuevo']);

    expect($analista->can('update', $pedidoAnalisis))->toBeTrue()
        ->and($analista->can('update', $pedidoNuevo))->toBeFalse();
});

it('vendedor no puede actualizar pedido en análisis', function () {
    $vendedor = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create([
        'user_id' => $vendedor->id,
        'estado' => 'En_Analisis',
    ]);

    expect($vendedor->can('update', $pedido))->toBeFalse();
});

it('vendedor puede actualizar sus pedidos fuera de análisis', function () {
    $vendedor = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create([
        'user_id' => $vendedor->id,
        'estado' => 'Nuevo',
    ]);

    expect($vendedor->can('update', $pedido))->toBeTrue();
});

it('vendedor puede actualizar pedidos de clientes', function () {
    $vendedor = createUserWithRole('Vendedor');
    $cliente = createUserWithRole('Cliente');
    $pedido = Pedido::factory()->create([
        'user_id' => $cliente->id,
        'estado' => 'Nuevo',
    ]);

    expect($vendedor->can('update', $pedido))->toBeTrue();
});

// === delete ===

it('super_admin puede eliminar cualquier pedido', function () {
    $admin = createUserWithRole('super_admin');
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

    expect($admin->can('delete', $pedido))->toBeTrue();
});

it('administrador puede eliminar cualquier pedido', function () {
    $admin = createUserWithRole('Administrador');
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

    expect($admin->can('delete', $pedido))->toBeTrue();
});

it('vendedor puede eliminar sus pedidos fuera de análisis', function () {
    $vendedor = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create([
        'user_id' => $vendedor->id,
        'estado' => 'Nuevo',
    ]);

    expect($vendedor->can('delete', $pedido))->toBeTrue();
});

it('vendedor no puede eliminar pedidos en análisis', function () {
    $vendedor = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create([
        'user_id' => $vendedor->id,
        'estado' => 'En_Analisis',
    ]);

    expect($vendedor->can('delete', $pedido))->toBeFalse();
});

it('vendedor no puede eliminar pedidos de otros', function () {
    $vendedor1 = createUserWithRole('Vendedor');
    $vendedor2 = createUserWithRole('Vendedor');
    $pedido = Pedido::factory()->create(['user_id' => $vendedor2->id]);

    expect($vendedor1->can('delete', $pedido))->toBeFalse();
});

it('analista no puede eliminar pedidos', function () {
    $analista = createUserWithRole('Analista');
    $pedido = Pedido::factory()->create(['estado' => 'En_Analisis']);

    expect($analista->can('delete', $pedido))->toBeFalse();
});

it('cliente no puede eliminar pedidos', function () {
    $cliente = createUserWithRole('Cliente');
    $pedido = Pedido::factory()->create(['user_id' => $cliente->id]);

    expect($cliente->can('delete', $pedido))->toBeFalse();
});
