<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Lista;
use App\Models\Sistema;

/**
 * Sincroniza la relación N:N entre listas (tipo Tipo de Artículo) y sistemas.
 */
class ListaSistemaSyncService
{
    private const TIPO_ARTICULO = 'Tipo de Artículo';

    /**
     * @param  list<int>|null  $sistemaIds  null = no modificar pivot
     */
    public function syncListaSistemas(Lista $lista, ?array $sistemaIds, ?int $legacySistemaId = null): void
    {
        if ($lista->tipo !== self::TIPO_ARTICULO) {
            return;
        }

        if ($sistemaIds === null) {
            if ($legacySistemaId !== null) {
                $this->syncListaSistemas($lista, [$legacySistemaId]);
            }

            return;
        }

        $ids = array_values(array_unique(array_filter(array_map('intval', $sistemaIds))));

        $lista->sistemas()->sync($ids);
        $lista->update(['sistema_id' => $ids[0] ?? null]);
    }

    /**
     * @param  list<int>  $listaIds
     */
    public function syncSistemaTiposArticulo(Sistema $sistema, array $listaIds): void
    {
        $listaIds = array_values(array_unique(array_filter(array_map('intval', $listaIds))));

        $validIds = Lista::query()
            ->where('tipo', self::TIPO_ARTICULO)
            ->whereIn('id', $listaIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $currentlyAttached = $sistema->listas()
            ->where('listas.tipo', self::TIPO_ARTICULO)
            ->pluck('listas.id')
            ->map(fn ($id) => (int) $id)
            ->all();

        $toDetach = array_diff($currentlyAttached, $validIds);
        $toAttach = array_diff($validIds, $currentlyAttached);

        if ($toDetach !== []) {
            $sistema->listas()->detach($toDetach);
        }

        if ($toAttach !== []) {
            $sistema->listas()->attach($toAttach);
        }

        $affectedListaIds = array_unique(array_merge($validIds, $toDetach));

        foreach ($affectedListaIds as $listaId) {
            $lista = Lista::find($listaId);
            if ($lista === null) {
                continue;
            }
            $this->refreshLegacySistemaId($lista);
        }
    }

    /**
     * @return list<int>
     */
    public function resolveSistemaIdsFromPayload(?array $sistemaIds, ?int $sistemaId): ?array
    {
        if (is_array($sistemaIds)) {
            return $sistemaIds;
        }

        if ($sistemaId !== null) {
            return [$sistemaId];
        }

        return null;
    }

    private function refreshLegacySistemaId(Lista $lista): void
    {
        $firstSistemaId = $lista->sistemas()
            ->orderBy('sistemas.id')
            ->value('sistemas.id');

        $lista->update(['sistema_id' => $firstSistemaId !== null ? (int) $firstSistemaId : null]);
    }
}
