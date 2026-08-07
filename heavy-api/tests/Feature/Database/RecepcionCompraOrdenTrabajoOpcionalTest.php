<?php

use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

it('permite orden_trabajo_id nulo en el esquema de recepciones_compra', function () {
    $column = DB::selectOne(
        "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recepciones_compra' AND COLUMN_NAME = 'orden_trabajo_id'"
    );

    expect($column->IS_NULLABLE)->toBe('YES');
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
