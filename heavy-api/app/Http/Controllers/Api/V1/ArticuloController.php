<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticuloResource;
use App\Models\Articulo;
use Illuminate\Http\{JsonResponse, Request};

/**
 * Controlador API para gestión de Artículos
 */
class ArticuloController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Articulo::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('nombre', 'like', "%{$search}%");
        }

        $articulos = $query->orderBy('nombre')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => ArticuloResource::collection($articulos),
            'meta' => [
                'current_page' => $articulos->currentPage(),
                'total' => $articulos->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
        ]);

        $articulo = Articulo::create($validated);

        return response()->json([
            'data' => new ArticuloResource($articulo),
            'message' => 'Artículo creado exitosamente',
        ], 201);
    }

    public function show(Articulo $articulo): JsonResponse
    {
        return response()->json([
            'data' => new ArticuloResource($articulo),
        ]);
    }

    public function update(Request $request, Articulo $articulo): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'precio' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'integer', 'min:0'],
        ]);

        $articulo->update($validated);

        return response()->json([
            'data' => new ArticuloResource($articulo),
            'message' => 'Artículo actualizado exitosamente',
        ]);
    }

    public function destroy(Articulo $articulo): JsonResponse
    {
        $articulo->delete();

        return response()->json([
            'message' => 'Artículo eliminado exitosamente',
        ], 204);
    }
}
