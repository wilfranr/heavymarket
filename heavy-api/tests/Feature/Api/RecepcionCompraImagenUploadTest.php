<?php

use App\Models\OrdenCompra;
use App\Models\RecepcionCompra;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Logistica', 'Vendedor'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }

    $this->logistica = createUserWithRole('Logistica');
    $this->vendedor = createUserWithRole('Vendedor');

    Storage::fake('public');
});

function crearRecepcionCompraActiva(): RecepcionCompra
{
    $ordenCompra = OrdenCompra::factory()->create();

    return RecepcionCompra::create([
        'orden_trabajo_id' => null,
        'orden_compra_id' => $ordenCompra->id,
        'recibido_por' => User::factory()->create()->id,
        'fecha_recepcion' => now(),
        'estado' => RecepcionCompra::ESTADO_ACTIVA,
    ]);
}

it('sube una imagen y la persiste en storage', function () {
    $recepcion = crearRecepcionCompraActiva();
    $archivo = UploadedFile::fake()->image('foto.jpg', 100, 100)->size(200);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->withHeaders(['Accept' => 'application/json'])
        ->post("/v1/recepciones-compra/{$recepcion->id}/imagenes", [
            'imagen' => $archivo,
            'tipo' => 'foto',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.tipo', 'foto')
        ->assertJsonPath('data.nombre_original', 'foto.jpg');

    $ruta = $response->json('data.ruta');
    Storage::disk('public')->assertExists($ruta);
});

it('rechaza tipo/extensión inválidos con 422', function () {
    $recepcion = crearRecepcionCompraActiva();
    $archivo = UploadedFile::fake()->create('documento.exe', 100);

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->withHeaders(['Accept' => 'application/json'])
        ->post("/v1/recepciones-compra/{$recepcion->id}/imagenes", [
            'imagen' => $archivo,
            'tipo' => 'foto',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('imagen');
});

it('rechaza adjuntar imagen a una recepción anulada', function () {
    $recepcion = crearRecepcionCompraActiva();
    $recepcion->update(['estado' => RecepcionCompra::ESTADO_ANULADA]);
    $archivo = UploadedFile::fake()->image('foto.jpg');

    $response = $this->actingAs($this->logistica, 'sanctum')
        ->withHeaders(['Accept' => 'application/json'])
        ->post("/v1/recepciones-compra/{$recepcion->id}/imagenes", [
            'imagen' => $archivo,
            'tipo' => 'foto',
        ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors('recepcion');
});

it('rechaza el registro sin permisos con 403', function () {
    $recepcion = crearRecepcionCompraActiva();
    $archivo = UploadedFile::fake()->image('foto.jpg');

    $response = $this->actingAs($this->vendedor, 'sanctum')
        ->withHeaders(['Accept' => 'application/json'])
        ->post("/v1/recepciones-compra/{$recepcion->id}/imagenes", [
            'imagen' => $archivo,
            'tipo' => 'foto',
        ]);

    $response->assertForbidden();
});
