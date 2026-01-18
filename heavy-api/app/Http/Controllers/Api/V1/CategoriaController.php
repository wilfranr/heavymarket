<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\{JsonResponse, Request};

class CategoriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categorias = Categoria::orderBy('nombre')
            ->paginate($request->input('per_page', 15));

        return response()->json(['data' => $categorias->items(), 'total' => $categorias->total()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $categoria = Categoria::create($validated);

        return response()->json(['data' => $categoria, 'message' => 'Categoría creada exitosamente'], 201);
    }

    public function show(Categoria $categoria): JsonResponse
    {
        return response()->json(['data' => $categoria]);
    }

    public function update(Request $request, Categoria $categoria): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['sometimes', 'string', 'max:255']]);
        $categoria->update($validated);

        return response()->json(['data' => $categoria, 'message' => 'Categoría actualizada']);
    }

    public function destroy(Categoria $categoria): JsonResponse
    {
        $categoria->delete();
        return response()->json(['message' => 'Categoría eliminada'], 204);
    }
}
