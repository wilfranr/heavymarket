<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->assertSafeTestDatabase();
    }

    private function assertSafeTestDatabase(): void
    {
        $default = config('database.default');

        if ($default !== 'mysql') {
            return;
        }

        $database = (string) config('database.connections.mysql.database');

        if ($database === 'heavymarket') {
            throw new RuntimeException(
                'BLOQUEADO: los tests apuntan a la base de desarrollo "heavymarket". '
                .'Configure .env.testing con DB_DATABASE=heavymarket_test y ejecute solo ./vendor/bin/pest '
                .'sin sobrescribir DB_* en la línea de comandos.'
            );
        }

        if ($database !== 'heavymarket_test') {
            throw new RuntimeException(
                'BLOQUEADO: con MySQL los tests solo pueden usar DB_DATABASE=heavymarket_test. '
                ."Base detectada: {$database}"
            );
        }
    }
}
