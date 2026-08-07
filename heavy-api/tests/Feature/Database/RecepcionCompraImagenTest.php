<?php

use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\RecepcionCompraImagen;
use App\Models\User;

function crearRecepcionCompra(): RecepcionCompra
{
    $ordenCompra = OrdenCompra::factory()->create();
    $usuario = User::factory()->create();

    return RecepcionCompra::create([
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => $usuario->id,
        'fecha_recepcion' => now(),
        'estado' => RecepcionCompra::ESTADO_ACTIVA,
    ]);
}

it('expone imagenes tipadas a traves de la relacion de RecepcionCompra', function () {
    $recepcion = crearRecepcionCompra();

    RecepcionCompraImagen::create([
        'recepcion_compra_id' => $recepcion->id,
        'ruta' => 'recepciones/1/foto.jpg',
        'nombre_original' => 'foto.jpg',
        'mime' => 'image/jpeg',
        'size' => 1024,
        'tipo' => RecepcionCompraImagen::TIPO_FOTO,
    ]);

    $imagenes = RecepcionCompra::find($recepcion->id)->imagenes;

    expect($imagenes)->toHaveCount(1)
        ->and($imagenes->first())->toBeInstanceOf(RecepcionCompraImagen::class)
        ->and($imagenes->first()->tipo)->toBe(RecepcionCompraImagen::TIPO_FOTO);
});

it('elimina las imagenes en cascada al eliminar la recepcion', function () {
    $recepcion = crearRecepcionCompra();

    $imagen = RecepcionCompraImagen::create([
        'recepcion_compra_id' => $recepcion->id,
        'ruta' => 'recepciones/1/guia.pdf',
        'nombre_original' => 'guia.pdf',
        'mime' => 'application/pdf',
        'size' => 2048,
        'tipo' => RecepcionCompraImagen::TIPO_GUIA,
    ]);

    $recepcion->delete();

    $this->assertDatabaseMissing('recepcion_compra_imagenes', ['id' => $imagen->id]);
});
