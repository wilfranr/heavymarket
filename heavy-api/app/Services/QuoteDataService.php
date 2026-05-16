<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Lista;
use App\Models\Maquina;
use App\Models\Sistema;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Arma el payload mínimo para el cotizador público (landing /cotizar).
 */
class QuoteDataService
{
    public function __construct(
        private readonly MachineTypeImageService $machineTypeImages,
        private readonly LandingBrandImageService $brandImages,
    ) {}

    /**
     * @return array{
     *     categories: list<array<string, mixed>>,
     *     brands: list<array<string, mixed>>,
     *     systems: list<array<string, mixed>>,
     *     articleTypes: list<array<string, mixed>>,
     *     models: list<string>
     * }
     */
    public function build(): array
    {
        return [
            'categories' => $this->buildCategories(),
            'brands' => $this->buildBrands(),
            'systems' => $this->buildSystems(),
            'articleTypes' => $this->buildArticleTypes(),
            'models' => $this->buildModels(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildCategories(): array
    {
        $categoriesData = Lista::query()
            ->where('tipo', 'Categoría de Máquina')
            ->with(['children' => function ($q) {
                $q->where('tipo', 'Tipo de Máquina')->orderBy('nombre');
            }])
            ->get();

        $categoriesMap = [];
        foreach ($categoriesData as $cat) {
            $slug = Str::slug($cat->nombre);
            $subcategorias = [];

            foreach ($cat->children as $item) {
                $subcategorias[] = [
                    'id' => $item->id,
                    'nombre' => $item->nombre,
                    'descripcion' => $item->definicion,
                    'imagen_url' => $this->machineTypeImages->resolveImagenUrl($item),
                    'slug' => Str::slug($item->nombre),
                ];
            }

            $categoriesMap[$slug] = [
                'nombre' => $cat->nombre,
                'slug' => $slug,
                'subcategorias' => $subcategorias,
            ];
        }

        $orderedCategories = [];
        $desiredOrder = ['construccion', 'equipo-ligero', 'mineria', 'pavimentacion', 'subterraneo', 'utilitarios', 'otros'];

        foreach ($desiredOrder as $slug) {
            if (isset($categoriesMap[$slug])) {
                $orderedCategories[] = $categoriesMap[$slug];
            }
        }

        foreach ($categoriesMap as $slug => $data) {
            if (! in_array($slug, $desiredOrder, true)) {
                $orderedCategories[] = $data;
            }
        }

        return $orderedCategories;
    }

    /**
     * @return list<array{id: int, nombre: string, logo: string}>
     */
    private function buildBrands(): array
    {
        return Lista::query()
            ->where('tipo', 'Fabricantes')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'foto', 'fabricante_id', 'updated_at'])
            ->map(function (Lista $lista) {
                $meta = $this->brandImages->logoMeta($lista);

                return [
                    'id' => $lista->id,
                    'nombre' => $lista->nombre,
                    'logo' => $meta['url'] ?? $lista->foto,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, nombre: string}>
     */
    private function buildSystems(): array
    {
        return Sistema::query()
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->map(fn (Sistema $sistema) => [
                'id' => $sistema->id,
                'nombre' => $sistema->nombre,
            ])
            ->values()
            ->all();
    }

    /**
     * Tipos de artículo una sola vez, con los sistemas a los que pertenecen (pivot).
     * El sistema "Por Defecto" en UI muestra todos los tipos (regla de negocio en frontend).
     *
     * @return list<array{id: int, nombre: string, sistema_ids: list<int>}>
     */
    private function buildArticleTypes(): array
    {
        /** @var Collection<int, list<int>> $sistemaIdsByLista */
        $sistemaIdsByLista = DB::table('sistema_lista')
            ->join('listas', 'listas.id', '=', 'sistema_lista.lista_id')
            ->where('listas.tipo', 'Tipo de Artículo')
            ->whereNull('listas.deleted_at')
            ->select('sistema_lista.lista_id', 'sistema_lista.sistema_id')
            ->get()
            ->groupBy('lista_id')
            ->map(fn (Collection $rows) => $rows->pluck('sistema_id')->unique()->map(fn ($id) => (int) $id)->values()->all());

        return Lista::query()
            ->where('tipo', 'Tipo de Artículo')
            ->orderBy('nombre')
            ->get(['id', 'nombre'])
            ->map(fn (Lista $lista) => [
                'id' => $lista->id,
                'nombre' => $lista->nombre,
                'sistema_ids' => $sistemaIdsByLista->get($lista->id, []),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    private function buildModels(): array
    {
        return Maquina::query()
            ->select('modelo')
            ->whereNotNull('modelo')
            ->distinct()
            ->orderBy('modelo')
            ->pluck('modelo')
            ->all();
    }
}
