<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Pedido;
use App\Models\PedidoReferenciaProveedor;

// Analizar Pedido #15
$pedido = Pedido::find(15);

if (!$pedido) {
    echo "No hay pedidos en la base de datos.\n";
    exit;
}

echo "Analizando Pedido #{$pedido->id}\n";
foreach ($pedido->referencias as $ref) {
    echo "  Referencia [{$ref->id}]: {$ref->definicion}\n";
    $proveedores = $ref->proveedores;
    if ($proveedores->isEmpty()) {
        echo "    (Sin proveedores)\n";
    }
    foreach ($proveedores as $prov) {
        echo "    - ID: {$prov->id} | Tercero: {$prov->proveedor_id} | Costo: {$prov->costo_unidad} | Ubicacion: {$prov->ubicacion} | Estado: {$prov->estado}\n";
    }
}
