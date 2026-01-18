<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReferenciaResource;
use App\Models\Referencia;
use Illuminate\Http\{JsonResponse, Request};

/**
 * Controlador API para gestión de Referencias
 */
class ReferenciaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Referencia::query()->with(['fabricante', 'sistema']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        if ($request->filled('fabricante_id')) {
            $query->where('fabricante_id', $request->input('fabricante_id'));
        }

        $referencias = $query->orderBy('codigo')
            ->paginate($request->input('per_page', 15));

        return response()->json([
            'data' => ReferenciaResource::collection($referencias),
            'meta' => [
                'current_page' => $referencias->currentPage(),
                'total' => $referencias->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:255', 'unique:referencias,codigo'],
            'descripcion' => ['nullable', 'string'],
            'fabricante_id' => ['nullable', 'integer', 'exists:fabricantes,id'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'precio' => ['nullable', 'numeric', 'min:0'],
        ]);

        $referencia = Referencia::create($validated);

        return response()->json([
            'data' => new ReferenciaResource($referencia->load(['fabricante', 'sistema'])),
            'message' => 'Referencia creada exitosamente',
        ], 201);
    }

    public function show(Referencia $referencia): JsonResponse
    {
        return response()->json([
            'data' => new ReferenciaResource($referencia->load(['fabricante', 'sistema'])),
        ]);
    }

    public function update(Request $request, Referencia $referencia): JsonResponse
    {
        $validated = $request->validate([
            'codigo' => ['sometimes', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'fabricante_id' => ['nullable', 'integer', 'exists:fabricantes,id'],
            'sistema_id' => ['nullable', 'integer', 'exists:sistemas,id'],
            'precio' => ['nullable', 'numeric', 'min:0'],
        ]);

        $referencia->update($validated);

        return response()->json([
            'data' => new ReferenciaResource($referencia->load(['fabricante', 'sistema'])),
            'message' => 'Referencia actualizada exitosamente',
        ]);
    }

    public function destroy(Referencia $referencia): JsonResponse
    {
        $referencia->delete();

        return response()->json([
            'message' => 'Referencia eliminada exitosamente',
        ], 204);
    }
}
