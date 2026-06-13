<?php

use App\Models\Tercero;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Vendedor', 'super_admin', 'Administrador'] as $roleName) {
        Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
    }
    $this->user = createUserWithRole('Vendedor');
});

it('permite cargar documentos al crear un tercero', function () {
    Storage::fake('public');

    $rut = UploadedFile::fake()->create('rut.pdf', 100);
    $camara = UploadedFile::fake()->create('camara.pdf', 100);

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros', [
            'tipo_documento' => 'NIT',
            'numero_documento' => '900999888-7',
            'nombre' => 'Tercero con Documentos',
            'tipo' => 'Proveedor',
            'telefono' => '1234567',
            'rut' => $rut,
            'camara_comercio' => $camara,
        ]);

    $response->assertStatus(201);

    $tercero = Tercero::where('numero_documento', '900999888-7')->first();

    expect($tercero->rut)->not->toBeNull();
    expect($tercero->camara_comercio)->not->toBeNull();

    Storage::disk('public')->assertExists($tercero->rut);
    Storage::disk('public')->assertExists($tercero->camara_comercio);
});

it('permite cargar documentos al actualizar un tercero', function () {
    Storage::fake('public');
    $tercero = Tercero::factory()->create();

    $cert = UploadedFile::fake()->create('certificacion.pdf', 100);

    // Para PUT con archivos en Laravel, a veces es necesario usar POST con _method=PUT
    // o asegurar que el multipart/form-data se maneje correctamente.
    // TerceroController maneja UpdateTerceroRequest que hereda de FormRequest.

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson("/v1/terceros/{$tercero->id}", [
            '_method' => 'PUT',
            'nombre' => 'Tercero Actualizado',
            'tipo' => $tercero->tipo,
            'certificacion_bancaria' => $cert,
        ]);

    $response->assertStatus(200);

    $tercero->refresh();
    expect($tercero->certificacion_bancaria)->not->toBeNull();
    Storage::disk('public')->assertExists($tercero->certificacion_bancaria);
});

it('permite subir un documento de forma asincrona y retorna su path y url', function () {
    Storage::fake('public');

    $file = UploadedFile::fake()->create('documento.pdf', 100, 'application/pdf');

    $response = $this->actingAs($this->user, 'sanctum')
        ->postJson('/v1/terceros/upload', [
            'file' => $file,
        ]);

    $response->assertStatus(200);
    $response->assertJson([
        'success' => true,
    ]);

    $data = $response->json();
    expect($data)->toHaveKey('file_url');
    expect($data)->toHaveKey('file_name');
    expect($data['original_name'])->toBe('documento.pdf');
    expect($data['size'])->toBeGreaterThan(0);

    Storage::disk('public')->assertExists($data['file_name']);
});

