<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sistema;
use Illuminate\Http\{JsonResponse, Request};

class SistemaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $sistemas = Sistema::orderBy('nombre')
            ->paginate($request->input('per_page', 15));

        return response()->json(['data' => $sistemas->items(), 'total' => $sistemas->total()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['required', 'string', 'max:255']]);
        $sistema = Sistema::create($validated);

        return response()->json(['data' => $sistema, 'message' => 'Sistema creado exitosamente'], 201);
    }

    public function show(Sistema $sistema): JsonResponse
    {
        return response()->json(['data' => $sistema]);
    }

    public function update(Request $request, Sistema $sistema): JsonResponse
    {
        $validated = $request->validate(['nombre' => ['sometimes', 'string', 'max:255']]);
        $sistema->update($validated);

        return response()->json(['data' => $sistema, 'message' => 'Sistema actualizado']);
    }

    public function destroy(Sistema $sistema): JsonResponse
    {
        $sistema->delete();
        return response()->json(['message' => 'Sistema eliminado'], 204);
    }
}
