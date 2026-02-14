<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Pedido;
use App\Models\Cotizacion;
use App\Models\Tercero;
use App\Models\OrdenCompra;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'pedidos' => Pedido::count(),
            'cotizaciones' => Cotizacion::count(),
            'terceros' => Tercero::count(),
            'ordenes' => OrdenCompra::count(),
        ]);
    }

    public function revenueStream(): JsonResponse
    {
        // Get revenue for the last 6 months from OrdenCompra
        // Assuming 'completed' or 'approved' status, but for now take all for "real data" demo
        $data = OrdenCompra::select(
                DB::raw('SUM(valor_total) as total'),
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period")
            )
            ->where('created_at', '>=', Carbon::now()->subMonths(6))
            ->groupBy('period')
            ->orderBy('period')
            ->get();
            
        // Format for frontend chart
        // Example: labels: ['Jan', 'Feb'], data: [100, 200]
        $labels = [];
        $values = [];
        
        // Fill gaps if needed, but for now simple
        foreach ($data as $item) {
            $labels[] = Carbon::createFromFormat('Y-m', $item->period)->format('M');
            $values[] = (float) $item->total;
        }

        return response()->json([
            'labels' => $labels,
            'data' => $values
        ]);
    }

    public function bestSelling(): JsonResponse
    {
        // Top 5 selling references based on OrdenCompra count (or quantity sum)
        $topRefs = DB::table('orden_compra_referencia')
            ->join('referencias', 'orden_compra_referencia.referencia_id', '=', 'referencias.id')
            ->select(
                'referencias.referencia as name',
                'referencias.referencia as code',
                DB::raw('SUM(orden_compra_referencia.cantidad) as total_quantity'),
                DB::raw('SUM(orden_compra_referencia.valor_total) as total_value')
            )
            ->groupBy('referencias.id', 'referencias.referencia')
            ->orderByDesc('total_value')
            ->limit(5)
            ->get();



        return response()->json($topRefs);
    }

    public function notifications(): JsonResponse
    {
        $notifications = [];

        // Latest Pedidos
        $pedidos = Pedido::with('tercero')->latest()->take(5)->get();
        foreach ($pedidos as $pedido) {
            $notifications[] = [
                'id' => 'p-' . $pedido->id,
                'type' => 'pedido_creado',
                'title' => 'Nuevo Pedido #' . $pedido->id,
                'message' => 'Cliente: ' . ($pedido->tercero->nombre ?? 'Desconocido'),
                'icon' => 'pi-shopping-cart',
                'iconColor' => 'blue',
                'read' => false,
                'created_at' => $pedido->created_at->toISOString(),
            ];
        }

        // Latest Cotizaciones
        $cotizaciones = Cotizacion::with('tercero')->latest()->take(5)->get();
        foreach ($cotizaciones as $cot) {
            $notifications[] = [
                'id' => 'c-' . $cot->id,
                'type' => 'cotizacion_nueva',
                'title' => 'Nueva Cotización #' . $cot->id,
                'message' => 'Cliente: ' . ($cot->tercero->nombre ?? 'Desconocido'),
                'icon' => 'pi-file',
                'iconColor' => 'orange',
                'read' => false,
                'created_at' => $cot->created_at->toISOString(),
            ];
        }
        
         // Latest Ordenes
        $ordenes = OrdenCompra::with('proveedor')->latest()->take(5)->get();
        foreach ($ordenes as $orden) {
            $notifications[] = [
                'id' => 'o-' . $orden->id,
                'type' => 'orden_confirmada',
                'title' => 'Orden de Compra #' . $orden->id,
                'message' => 'Proveedor: ' . ($orden->proveedor->nombre ?? 'Desconocido'),
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
