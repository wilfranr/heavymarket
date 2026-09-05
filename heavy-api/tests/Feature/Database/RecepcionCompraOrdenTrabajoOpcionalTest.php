<?php

use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Schema;

it('permite orden_trabajo_id nulo en el esquema de recepciones_compra', function () {
    // Schema::getColumns() es portable entre drivers (MySQL en dev/prod,
    // SQLite en la suite de tests de CI), a diferencia de una consulta
    // directa a INFORMATION_SCHEMA (especifica de MySQL).
    $column = collect(Schema::getColumns('recepciones_compra'))->firstWhere('name', 'orden_trabajo_id');

    expect($column['nullable'])->toBeTrue();
});

it('permite crear una recepcion_compra sin orden de trabajo', function () {
    $ordenCompra = OrdenCompra::factory()->create();
    $usuario = User::factory()->create();

    $recepcion = RecepcionCompra::create([
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => $usuario->id,
        'fecha_recepcion' => now(),
        'estado' => RecepcionCompra::ESTADO_ACTIVA,
    ]);

    expect($recepcion->fresh()->orden_trabajo_id)->toBeNull();

    $this->assertDatabaseHas('recepciones_compra', [
        'id' => $recepcion->id,
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
    ]);
});

it('rechaza eliminar la orden de compra referenciada por una recepcion', function () {
    $ordenCompra = OrdenCompra::factory()->create();
    $usuario = User::factory()->create();

    RecepcionCompra::create([
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => $usuario->id,
        'fecha_recepcion' => now(),
        'estado' => RecepcionCompra::ESTADO_ACTIVA,
    ]);

    expect(fn () => $ordenCompra->delete())->toThrow(QueryException::class);
});
