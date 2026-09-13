<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Enums\OrdenCompraEstado;
use App\Models\OrdenCompra;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\OrdenCompraLifecycleService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class AlertarTransitoProlongadoCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'compras:alertar-transito-prolongado {--dias=5 : Días máximos permitidos en tránsito antes de marcar la OC como Demorada}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Marca como Demorado las órdenes de compra que llevan más de X días en tránsito sin confirmación de entrega, y notifica a Logística.';

    /**
     * Execute the console command.
     */
    public function handle(OrdenCompraLifecycleService $lifecycleService): int
    {
        $diasLimite = (int) $this->option('dias');
        $fechaLimite = Carbon::now()->subDays($diasLimite);

        $this->info("Buscando órdenes de compra en tránsito despachadas el o antes de {$fechaLimite->toDateString()} (> {$diasLimite} días)...");

        $ordenes = OrdenCompra::query()
            ->where(function ($q) {
                $q->where('estado', OrdenCompraEstado::EnTransito->value)
                    ->orWhere('estado', OrdenCompraEstado::Despachada->value);
            })
            ->whereNotNull('fecha_despacho')
            ->where('fecha_despacho', '<=', $fechaLimite)
            ->where(function ($q) {
                $q->whereNull('transito_prorrogado_hasta')
                    ->orWhere('transito_prorrogado_hasta', '<=', now());
            })
            ->with(['proveedor', 'pedido.user', 'transportadora'])
            ->get();

        if ($ordenes->isEmpty()) {
            $this->info('No se encontraron órdenes con tránsito prolongado.');

            return self::SUCCESS;
        }

        $this->warn("Se encontraron {$ordenes->count()} órdenes con tránsito prolongado:");

        $usuariosLogistica = User::role('Logistica')->get();

        foreach ($ordenes as $oc) {
            $diasEnTransito = Carbon::parse($oc->fecha_despacho)->diffInDays(Carbon::now());

            try {
                $lifecycleService->transicionar($oc, OrdenCompraEstado::Demorado);
            } catch (\Throwable $exception) {
                $this->error("No se pudo marcar la OC #{$oc->id} como Demorado: {$exception->getMessage()}");
                Log::error('Error al transicionar OC a Demorado por transito prolongado', [
                    'orden_compra_id' => $oc->id,
                    'error' => $exception->getMessage(),
                ]);

                continue;
            }

            $mensaje = "OC #{$oc->id} marcada como Demorado tras {$diasEnTransito} días en tránsito. Guía: {$oc->guia}, Proveedor: {$oc->proveedor?->nombre}.";

            $this->line(" - OC #{$oc->id}: Despachada el {$oc->fecha_despacho->toDateString()} ({$diasEnTransito} días) - Guía: {$oc->guia}");

            Log::warning($mensaje, [
                'orden_compra_id' => $oc->id,
                'guia' => $oc->guia,
                'dias_en_transito' => $diasEnTransito,
                'fecha_despacho' => $oc->fecha_despacho->toIso8601String(),
                'asesor_id' => $oc->pedido?->user_id,
                'notificados_logistica' => $usuariosLogistica->pluck('id')->all(),
            ]);

            foreach ($usuariosLogistica as $usuarioLogistica) {
                $usuarioLogistica->notify(new SystemNotification(
                    'orden_compra_demorada',
                    'OC #'.$oc->id.' Demorada',
                    "La orden de compra #{$oc->id} lleva {$diasEnTransito} días en tránsito (proveedor {$oc->proveedor?->nombre}, guía {$oc->guia}) y fue marcada como Demorada. Reasigne un nuevo tiempo de entrega o depúrela si la mercancía se considera faltante definitivo.",
                    'pi-exclamation-triangle',
                    'orange',
                    ['orden_compra_id' => $oc->id]
                ));
            }
        }

        $this->info('Órdenes en tránsito prolongado procesadas exitosamente.');

        return self::SUCCESS;
    }
}
