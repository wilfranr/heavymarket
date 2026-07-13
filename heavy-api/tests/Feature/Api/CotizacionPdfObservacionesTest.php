<?php

use App\Models\Cotizacion;
use App\Models\Pedido;
use App\Models\Tercero;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;

uses(RefreshDatabase::class);

function renderCotizacionPdfHtml(?string $observaciones, string|array|null $comentarioPedido): string
{
    $cliente = Tercero::factory()->create([
        'tipo' => 'Cliente',
        'nombre' => 'Cliente PDF Observaciones',
        'email' => 'cliente.pdf@example.com',
    ]);

    $pedido = Pedido::factory()->create([
        'tercero_id' => $cliente->id,
        'comentario' => $comentarioPedido,
    ]);

    $cotizacion = Cotizacion::factory()->create([
        'pedido_id' => $pedido->id,
        'tercero_id' => $cliente->id,
        'user_id' => User::factory(),
        'observaciones' => $observaciones,
        'total' => 100000,
    ]);

    $cotizacion->load(['pedido', 'tercero', 'user', 'referenciasProveedores']);

    return View::make('pdf.cotizacion', [
        'cotizacion' => $cotizacion,
        'empresa' => null,
    ])->render();
}

it('no usa comentarios internos del pedido como observaciones del PDF', function () {
    $html = renderCotizacionPdfHtml(null, [
        ['comentario' => 'Comentario interno que no debe salir al cliente'],
        ['comentario' => 'Nota privada del ítem'],
    ]);

    expect($html)
        ->not->toContain('Comentario interno que no debe salir al cliente')
        ->not->toContain('Nota privada del ítem');
});

it('muestra solamente las observaciones comerciales de la cotización en el PDF', function () {
    $html = renderCotizacionPdfHtml(
        "Observación comercial de cotización\nSegunda línea visible",
        'Comentario interno del pedido'
    );

    expect($html)
        ->toContain('Observación comercial de cotización')
        ->toContain('Segunda línea visible')
        ->not->toContain('Comentario interno del pedido');
});
