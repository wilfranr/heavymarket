<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Articulo;
use App\Models\Cotizacion;
use App\Models\Lista;
use App\Models\Maquina;
use App\Models\Pedido;
use App\Models\Referencia;
use App\Models\Sistema;
use App\Models\Tercero;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Handle global search across multiple modules.
     */
    public function index(Request $request)
    {
        $query = $request->input('q');

        if (! $query || strlen($query) < 2) {
            return response()->json(['data' => []]);
        }

        $results = [];
        $limit = 5; // Limita los resultados por entidad para no saturar

        // 1. Pedidos (buscar por id provisorio ya que usualmente son enteros, o algun string si aplica)
        $pedidos = Pedido::where('id', 'like', "%{$query}%")
            ->orWhere('estado', 'like', "%{$query}%")
            ->with('tercero')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => 'Pedido #'.$item->id,
                    'description' => 'Estado: '.$item->estado.($item->tercero ? ' - Cliente: '.$item->tercero->nombre : ''),
                    'type' => 'pedido',
                    'route' => '/app/pedidos',
                ];
            });
        $results = array_merge($results, $pedidos->toArray());

        // 2. Terceros (Clientes y Proveedores)
        $terceros = Tercero::where('nombre', 'like', "%{$query}%")
            ->orWhere('numero_documento', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->nombre,
                    'description' => 'Documento: '.$item->numero_documento.' - Tipo: '.ucfirst(strtolower($item->tipo)),
                    'type' => 'tercero',
                    'route' => '/app/terceros',
                ];
            });
        $results = array_merge($results, $terceros->toArray());

        // 3. Cotizaciones
        $cotizaciones = Cotizacion::where('id', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => 'Cotización #'.$item->id,
                    'description' => 'Cotización',
                    'type' => 'cotizacion',
                    'route' => '/app/cotizaciones',
                ];
            });
        $results = array_merge($results, $cotizaciones->toArray());

        // 4. Artículos
        $articulos = Articulo::where('definicion', 'like', "%{$query}%")
            ->orWhere('descripcionEspecifica', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->definicion,
                    'description' => 'Artículo',
                    'type' => 'articulo',
                    'route' => '/app/articulos',
                ];
            });
        $results = array_merge($results, $articulos->toArray());

        // 5. Máquinas
        $maquinas = Maquina::where('modelo', 'like', "%{$query}%")
            ->orWhere('serie', 'like', "%{$query}%")
            ->orWhere('arreglo', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->modelo,
                    'description' => 'Serie: '.$item->serie.' - Arreglo: '.$item->arreglo,
                    'type' => 'maquina',
                    'route' => '/app/maquinas',
                ];
            });
        $results = array_merge($results, $maquinas->toArray());

        // 6. Referencias
        $referencias = Referencia::where('referencia', 'like', "%{$query}%")
            ->orWhere('comentario', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->referencia,
                    'description' => mb_strimwidth($item->comentario ?? '', 0, 50, '...'),
                    'type' => 'referencia',
                    'route' => '/app/referencias',
                ];
            });
        $results = array_merge($results, $referencias->toArray());

        // 7. Listas
        $listas = Lista::where('nombre', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->nombre,
                    'description' => 'Lista de sistema',
                    'type' => 'lista',
                    'route' => '/app/listas',
                ];
            });
        $results = array_merge($results, $listas->toArray());

        // 8. Sistemas
        $sistemas = Sistema::where('nombre', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->nombre,
                    'description' => 'Sistema de maquinaria',
                    'type' => 'sistema',
                    'route' => '/app/sistemas',
                ];
            });
        $results = array_merge($results, $sistemas->toArray());

        // 9. Fabricantes
        $fabricantes = Lista::where('tipo', 'Fabricantes')
            ->where('nombre', 'like', "%{$query}%")
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->nombre,
                    'description' => 'Fabricante',
                    'type' => 'fabricante',
                    'route' => '/app/listas',
                ];
            });
        $results = array_merge($results, $fabricantes->toArray());

        return response()->json([
            'data' => $results,
        ]);
    }
}
