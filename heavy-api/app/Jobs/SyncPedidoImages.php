<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\PedidoReferencia;
use App\Models\PedidoReferenciaImagen;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job para procesar y registrar imágenes de pedidos de forma asíncrona
 */
class SyncPedidoImages implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @var PedidoReferencia
     */
    protected $pedidoReferencia;

    /**
     * @var array
     */
    protected $imagePaths;

    /**
     * Create a new job instance.
     * 
     * @param PedidoReferencia $pedidoReferencia
     * @param array $imagePaths
     */
    public function __construct(PedidoReferencia $pedidoReferencia, array $imagePaths)
    {
        $this->pedidoReferencia = $pedidoReferencia;
        $this->imagePaths = $imagePaths;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            foreach ($this->imagePaths as $path) {
                $this->pedidoReferencia->imagenes()->create([
                    'imagen' => $path,
                    'origen' => PedidoReferenciaImagen::ORIGEN_ASESOR
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error procesando imágenes de pedido asíncronamente: ' . $e->getMessage(), [
                'pedido_referencia_id' => $this->pedidoReferencia->id,
                'paths' => $this->imagePaths
            ]);
        }
    }
}
