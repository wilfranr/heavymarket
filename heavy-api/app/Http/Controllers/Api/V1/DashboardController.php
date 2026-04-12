<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\OrdenCompra;
use App\Models\Pedido;
use App\Models\Tercero;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Helper para verificar si el usuario debe ver solo sus propios datos
     */
    private function shouldFilterByUser(Request $request): bool
    {
        $user = $request->user();

        return ! $user->hasAnyRole(['super_admin', 'Administrador', 'Analista']);
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $this->shouldFilterByUser($request);

        return response()->json([
            'pedidos' => Pedido::query()
                ->when($user->hasRole('Analista'), fn ($q) => $q->where('estado', 'En_Analisis'))
                ->when($filter, fn ($q) => $q->where('user_id', $user->id))
                ->count(),
            'cotizaciones' => Cotizacion::query()
                ->when($user->hasRole('Analista'), fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('estado', 'En_Analisis')))
                ->when($filter, fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('user_id', $user->id)))
                ->count(),
            'terceros' => Tercero::when($filter, fn ($q) => $q->where(fn ($sq) => $sq->where('user_id', $user->id)->orWhereNull('user_id')))->count(),
            'ordenes' => OrdenCompra::query()
                ->when($user->hasRole('Analista'), fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('estado', 'En_Analisis')))
                ->when($filter, fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('user_id', $user->id)))
                ->count(),
        ]);
    }

    public function revenueStream(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $this->shouldFilterByUser($request);

        // Get revenue for the last 6 months from OrdenCompra
        $data = OrdenCompra::select(
            DB::raw('SUM(valor_total) as total'),
            DB::raw("DATE_FORMAT(orden_compras.created_at, '%Y-%m') as period")
        )
            ->where('orden_compras.created_at', '>=', Carbon::now()->subMonths(6))
            ->when($filter, fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('user_id', $user->id)))
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $labels = [];
        $values = [];

        foreach ($data as $item) {
            $labels[] = Carbon::createFromFormat('Y-m', $item->period)->format('M');
            $values[] = (float) $item->total;
        }

        return response()->json([
            'labels' => $labels,
            'data' => $values,
        ]);
    }

    public function bestSelling(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $this->shouldFilterByUser($request);

        // Top 5 selling references based on OrdenCompra count
        $query = DB::table('orden_compra_referencia')
            ->join('referencias', 'orden_compra_referencia.referencia_id', '=', 'referencias.id')
            ->join('orden_compras', 'orden_compra_referencia.orden_compra_id', '=', 'orden_compras.id')
            ->leftJoin('pedidos', 'orden_compras.pedido_id', '=', 'pedidos.id') // Join with pedidos to filter by user_id
            ->select(
                'referencias.referencia as name',
                'referencias.referencia as code',
                DB::raw('SUM(orden_compra_referencia.cantidad) as total_quantity'),
                DB::raw('SUM(orden_compra_referencia.valor_total) as total_value')
            )
            ->when($filter, fn ($q) => $q->where('pedidos.user_id', $user->id))
            ->groupBy('referencias.id', 'referencias.referencia')
            ->orderByDesc('total_value')
            ->limit(5);

        return response()->json($query->get());
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $this->shouldFilterByUser($request);
        $notifications = [];

        // Latest Pedidos
        $pedidos = Pedido::with('tercero')
            ->when($user->hasRole('Analista'), fn ($q) => $q->where('estado', 'En_Analisis'))
            ->when($filter, fn ($q) => $q->where('user_id', $user->id))
            ->latest()
            ->take(5)
            ->get();

        foreach ($pedidos as $pedido) {
            $notifications[] = [
                'id' => 'p-'.$pedido->id,
                'type' => 'pedido_creado',
                'title' => 'Nuevo Pedido #'.$pedido->id,
                'message' => 'Cliente: '.($pedido->tercero->nombre ?? 'Desconocido'),
                'icon' => 'pi-shopping-cart',
                'iconColor' => 'blue',
                'read' => false,
                'created_at' => $pedido->created_at->toISOString(),
            ];
        }

        // Latest Cotizaciones
        $cotizaciones = Cotizacion::with(['tercero', 'pedido'])
            ->when($user->hasRole('Analista'), fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('estado', 'En_Analisis')))
            ->when($filter, fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('user_id', $user->id)))
            ->latest()
            ->take(5)
            ->get();

        foreach ($cotizaciones as $cot) {
            $notifications[] = [
                'id' => 'c-'.$cot->id,
                'type' => 'cotizacion_nueva',
                'title' => 'Nueva Cotización #'.$cot->id,
                'message' => 'Cliente: '.($cot->tercero->nombre ?? 'Desconocido'),
                'icon' => 'pi-file',
                'iconColor' => 'orange',
                'read' => false,
                'created_at' => $cot->created_at->toISOString(),
            ];
        }

        // Latest Ordenes
        $ordenes = OrdenCompra::with(['proveedor', 'pedido'])
            ->when($user->hasRole('Analista'), fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('estado', 'En_Analisis')))
            ->when($filter, fn ($q) => $q->whereHas('pedido', fn ($pq) => $pq->where('user_id', $user->id)))
            ->latest()
            ->take(5)
            ->get();

        foreach ($ordenes as $orden) {
            $notifications[] = [
                'id' => 'o-'.$orden->id,
                'type' => 'orden_confirmada',
                'title' => 'Orden de Compra #'.$orden->id,
                'message' => 'Proveedor: '.($orden->proveedor->nombre ?? 'Desconocido'),
                'icon' => 'pi-check-circle',
                'iconColor' => 'green',
                'read' => false,
                'created_at' => $orden->created_at->toISOString(),
            ];
        }

        // Sort by created_at desc
        usort($notifications, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return response()->json(array_slice($notifications, 0, 10));
    }
}
