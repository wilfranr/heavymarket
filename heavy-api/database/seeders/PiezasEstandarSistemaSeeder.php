<?php

namespace Database\Seeders;

use App\Models\Lista;
use App\Models\Sistema;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PiezasEstandarSistemaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Iniciando vinculación inteligente de Piezas Estándar con Sistemas...');

        // 1. Obtener todas las Piezas Estándar
        $piezas = Lista::where('tipo', 'Piezas Estandar')->get();
        
        // 2. Obtener todos los Sistemas
        $sistemas = Sistema::all();

        // 3. Definir palabras clave para mejorar la coincidencia
        $mapaKeywords = [
            'Motor' => ['motor', 'pistón', 'cigueñal', 'culata', 'válvula', 'escape', 'admisión', 'biela', 'camisa', 'bloque', 'inyección', 'turbo', 'diesel'],
            'Hidráulico' => ['hidráulic', 'bomba', 'cilindro', 'manguera', 'presión', 'sello', 'cartucho', 'hydraulic', 'pistones', 'engranajes'],
            'Eléctricos' => ['eléctric', 'batería', 'cable', 'fusible', 'relé', 'sensor', 'interruptor', 'alternador', 'arranque', 'luz', 'faro', 'bombillo', 'solenoide'],
            'Electrónicos' => ['electrónic', 'computadora', 'display', 'monitor', 'panel', 'controlador', 'ecm', 'ecu'],
            'Frenos' => ['freno', 'disco', 'pastilla', 'tambor', 'cáliper', 'líquido de freno', 'balata'],
            'Tren de Rodaje' => ['rodaje', 'oruga', 'cadena', 'zapata', 'rueda guía', 'tensor', 'rodillo', 'sprocket', 'rueda cabilla'],
            'Transmisión' => ['transmisión', 'caja', 'marcha', 'engranaje', 'cardan', 'convertidor', 'eje', 'cruceta', 'diferencial'],
            'Cabina' => ['cabina', 'asiento', 'vidrio', 'puerta', 'aire acondicionado', 'joystick', 'pedal', 'espejo', 'limpiaparabrisas', 'climatización'],
            'Herramienta de Corte' => ['diente', 'cuchilla', 'puntero', 'cizalla', 'cucharon', 'balde', 'ripper'],
            'Filtración' => ['filtro', 'separador'],
            'Tornillería' => ['tornillo', 'tuerca', 'arandela', 'hexagonal', 'perno', 'esparrago', 'remache'],
            'Empaquetaduras' => ['empaque', 'sello', 'oring', 'junta', 'retenedor', 'kit de sello'],
            'Refrigeración' => ['radiador', 'enfriador', 'ventilador', 'termostato', 'refrigerante', 'bomba de agua'],
        ];

        $vinculaciones = 0;

        foreach ($piezas as $pieza) {
            $textoBusqueda = Str::lower($pieza->nombre . ' ' . $pieza->definicion);
            $sistemasEncontradosIds = [];

            foreach ($sistemas as $sistema) {
                $nombreSistema = Str::lower($sistema->nombre);
                
                // Coincidencia Directa: Nombre del sistema está en el nombre/def de la pieza
                // Ejemplo: Pieza "Bomba Hidráulica" -> Sistema "Bomba Hidráulica"
                if (Str::contains($textoBusqueda, $nombreSistema) || Str::contains($nombreSistema, Str::lower($pieza->nombre))) {
                    $sistemasEncontradosIds[] = $sistema->id;
                    continue;
                }

                // Coincidencia por Palabras Clave
                foreach ($mapaKeywords as $key => $keywords) {
                    // Si el nombre del sistema contiene la clave (ej: "Sistema Hidráulico" contiene "Hidráulico")
                    if (Str::contains($nombreSistema, Str::lower($key))) {
                        // Verificar si la pieza contiene alguna de las keywords asociadas
                        foreach ($keywords as $keyword) {
                            if (Str::contains($textoBusqueda, Str::lower($keyword))) {
                                $sistemasEncontradosIds[] = $sistema->id;
                                break 2; // Salir de keywords y sistema actual si ya encontramos match
                            }
                        }
                    }
                }
            }
            
            // Si no encontró nada específico, intentar asignar a "General" o similar si existiera
            // Por ahora, solo vinculamos lo que encontramos
            if (!empty($sistemasEncontradosIds)) {
                $uniqueIds = array_unique($sistemasEncontradosIds);
                $pieza->sistemas()->syncWithoutDetaching($uniqueIds);
                $vinculaciones += count($uniqueIds);
            }
        }

        $this->command->info("¡Proceso completado! Se crearon $vinculaciones relaciones entre Piezas Estándar y Sistemas.");
    }
}
