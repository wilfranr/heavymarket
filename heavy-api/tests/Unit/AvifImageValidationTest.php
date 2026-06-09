<?php

uses(Tests\TestCase::class);

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;

test('la regla de validacion image acepta archivos avif', function () {
    $file = UploadedFile::fake()->create('test-image.avif', 100, 'image/avif');

    $validator = Validator::make(
        ['foto' => $file],
        ['foto' => 'image']
    );

    expect($validator->passes())->toBeTrue();
});

test('la regla de validacion image rechaza archivos no permitidos', function () {
    $file = UploadedFile::fake()->create('test-file.pdf', 100, 'application/pdf');

    $validator = Validator::make(
        ['foto' => $file],
        ['foto' => 'image']
    );

    expect($validator->passes())->toBeFalse();
});
