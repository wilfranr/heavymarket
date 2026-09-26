<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Orden de Trabajo OT-{{ $ordenTrabajo->id }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1e293b;
            font-size: 9px;
            line-height: 1.3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }

        .page-frame {
            border: 1.4px solid #1e293b;
            padding: 14px 16px 16px 16px;
        }

        /* Header */
        .header-table {
            margin-bottom: 14px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-cell {
            width: 26%;
            text-align: left;
        }
        .logo {
            max-width: 140px;
            max-height: 65px;
            object-fit: contain;
        }
        .company-cell {
            width: 48%;
            text-align: center;
        }
        .company-name {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 3px 0;
        }
        .company-info {
            font-size: 8.5px;
            color: #334155;
            line-height: 1.5;
        }
        .doc-cell {
            width: 26%;
            text-align: right;
        }
        .doc-type {
            font-size: 10px;
            color: #334155;
        }
        .doc-number {
            font-size: 15px;
            font-weight: bold;
            color: #0f172a;
        }

        /* Supplier + dates block */
        .supplier-outer {
            margin-bottom: 12px;
        }
        .supplier-outer td {
            vertical-align: top;
            padding: 0;
        }
        .supplier-left {
            width: 78%;
        }
        .supplier-right {
            width: 22%;
        }
        .supplier-table, .dates-table {
            border: 1px solid #334155;
        }
        .supplier-table td, .dates-table td {
            border: 0.5px solid #94a3b8;
            padding: 4px 6px;
            font-size: 8.5px;
            height: 12px;
        }
        .label-cell {
            background-color: #e5e7eb;
            font-weight: bold;
            width: 90px;
            text-transform: uppercase;
            font-size: 7.5px;
            color: #334155;
        }
        .value-cell {
            background-color: #ffffff;
            color: #0f172a;
        }
        .dates-label {
            background-color: #e5e7eb;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 7.5px;
            color: #334155;
            text-align: center;
        }
        .dates-value {
            background-color: #ffffff;
            color: #0f172a;
            text-align: center;
        }

        /* Extra info block (pedido / maquina) */
        .extra-table {
            border: 1px solid #334155;
            margin-bottom: 2px;
        }
        .extra-table td {
            border: 0.5px solid #94a3b8;
            padding: 4px 6px;
            font-size: 8.5px;
            height: 12px;
        }

        /* Items Table */
        .items-table {
            margin-top: 10px;
            border: 1px solid #334155;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #1e293b;
            padding: 6px;
            font-weight: bold;
            font-size: 9px;
            border: 0.5px solid #cbd5e1;
        }
        .items-table td {
            padding: 6px;
            border: 0.5px solid #cbd5e1;
            font-size: 8.5px;
            height: 15px;
            color: #1e293b;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* Signatures */
        .signatures {
            clear: both;
            margin-top: 60px;
            width: 100%;
        }
        .signatures-table td {
            width: 50%;
            padding: 0 10px;
        }
        .signature-line {
            border-top: 1px solid #334155;
            margin-bottom: 4px;
        }
        .signature-caption {
            font-size: 7.5px;
            font-weight: bold;
            text-align: center;
            color: #334155;
            text-transform: uppercase;
        }
    </style>
</head>
<body>

    @php
        $logoPath = null;
        if (file_exists(public_path('images/logo-pdf.png'))) {
            $logoPath = public_path('images/logo-pdf.png');
        } elseif (isset($empresa->logo_dark) && file_exists(public_path('storage/' . $empresa->logo_dark))) {
            $logoPath = public_path('storage/' . $empresa->logo_dark);
        } elseif (isset($empresa->logo_light) && file_exists(public_path('storage/' . $empresa->logo_light))) {
            $logoPath = public_path('storage/' . $empresa->logo_light);
        } elseif (file_exists(public_path('images/logo.png'))) {
            $logoPath = public_path('images/logo.png');
        }

        $cliente = $ordenTrabajo->tercero ?? $ordenTrabajo->pedido?->tercero;
        $maquina = $ordenTrabajo->pedido?->maquina;

        // Marca y entrega del proveedor aprobado (estado 1) o del primero, igual que en pantalla. La OT no lleva precios.
        $lineas = $ordenTrabajo->referencias->map(function ($item) {
            $pedidoReferencia = $item->pedidoReferencia;
            $proveedores = $pedidoReferencia?->proveedores ?? collect();
            $proveedor = $proveedores->firstWhere('estado', 1) ?? $proveedores->first();
            $referencia = $pedidoReferencia?->referencia;
            $articulo = $referencia?->articulo;

            return (object) [
                'descripcion' => $articulo?->descripcionEspecifica ?: ($articulo?->definicion ?: $pedidoReferencia?->definicion),
                'referencia' => $referencia?->referencia ?? 'N/A',
                'marca' => $proveedor?->marca?->nombre ?? $referencia?->marca?->nombre ?? $pedidoReferencia?->marca?->nombre,
                'entrega' => $proveedor?->entrega_label ?? 'Inmediata',
                'cantidad' => (int) ($item->cantidad_cotizada ?? 0),
            ];
        });
    @endphp

    <div class="page-frame">

        <!-- Header -->
        <table class="header-table">
            <tr>
                <td class="logo-cell">
                    @if($logoPath)
                        <img src="{{ $logoPath }}" class="logo">
                    @else
                        <div style="background: #334155; color: white; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; display: inline-block;">HEAVYMARKET</div>
                    @endif
                </td>
                <td class="company-cell">
                    <div class="company-name">{{ strtoupper($empresa->nombre ?? 'HEAVYMARKET S.A.S') }}</div>
                    <div class="company-info">
                        {{ $empresa->nit ?? '901881206' }}<br>
                        {{ $empresa->direccion ?? 'CRA 79 C 40 A 72' }}<br>
                        {{ $empresa->telefono ?? '+573046292601' }}<br>
                        {{ $empresa->email ?? 'contabilidad@heavymarket.net' }}
                    </div>
                </td>
                <td class="doc-cell">
                    <div class="doc-type">Orden de trabajo</div>
                    <div class="doc-number">No. {{ $ordenTrabajo->id }}</div>
                </td>
            </tr>
        </table>

        <!-- Cliente + Fechas -->
        <table class="supplier-outer">
            <tr>
                <td class="supplier-left">
                    <table class="supplier-table">
                        <tr>
                            <td class="label-cell">SEÑOR(ES)</td>
                            <td class="value-cell" colspan="3">{{ mb_strtoupper($cliente->razon_social ?? $cliente->nombre ?? 'N/A') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">DIRECCIÓN</td>
                            <td class="value-cell" colspan="3">{{ mb_strtoupper($ordenTrabajo->direccion->direccion ?? $cliente->direccion ?? 'N/A') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">CIUDAD</td>
                            <td class="value-cell" colspan="3">{{ mb_strtoupper($cliente->city->name ?? 'N/A') }}</td>
                        </tr>
                        <tr>
                            <td class="label-cell">TELÉFONO</td>
                            <td class="value-cell">{{ $cliente->telefono ?? $cliente->celular ?? 'N/A' }}</td>
                            <td class="label-cell" style="width: 50px;">NIT</td>
                            <td class="value-cell">{{ $cliente->numero_documento ?? $cliente->documento ?? 'N/A' }}</td>
                        </tr>
                    </table>
                </td>
                <td class="supplier-right">
                    <table class="dates-table">
                        <tr>
                            <td class="dates-label">FECHA DE INGRESO</td>
                        </tr>
                        <tr>
                            <td class="dates-value">{{ $ordenTrabajo->fecha_ingreso ? $ordenTrabajo->fecha_ingreso->format('d/m/Y') : date('d/m/Y') }}</td>
                        </tr>
                        <tr>
                            <td class="dates-label">FECHA DE ENTREGA</td>
                        </tr>
                        <tr>
                            <td class="dates-value">{{ $ordenTrabajo->fecha_entrega ? $ordenTrabajo->fecha_entrega->format('d/m/Y') : 'Por definir' }}</td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <!-- Pedido / Cotizacion / Maquina -->
        <table class="extra-table">
            <tr>
                <td class="label-cell">PEDIDO</td>
                <td class="value-cell">#{{ $ordenTrabajo->pedido_id ?? 'N/A' }}</td>
                <td class="label-cell">COTIZACIÓN</td>
                <td class="value-cell">COT-{{ $ordenTrabajo->cotizacion_id ?? 'N/A' }}</td>
                <td class="label-cell">TRANSPORTADORA</td>
                <td class="value-cell">{{ mb_strtoupper($ordenTrabajo->transportadora->nombre ?? 'N/A') }}</td>
            </tr>
            @if($maquina)
                <tr>
                    <td class="label-cell">MÁQUINA</td>
                    <td class="value-cell">{{ mb_strtoupper($maquina->listas?->nombre ?? 'N/A') }}</td>
                    <td class="label-cell">FABRICANTE</td>
                    <td class="value-cell">{{ mb_strtoupper($maquina->fabricante?->nombre ?? 'N/A') }}</td>
                    <td class="label-cell">MODELO / SERIE</td>
                    <td class="value-cell">{{ mb_strtoupper($maquina->modelo ?? 'N/A') }} / {{ mb_strtoupper($maquina->serie ?? 'N/A') }}</td>
                </tr>
            @endif
            @if($ordenTrabajo->observaciones)
                <tr>
                    <td class="label-cell">OBSERVACIONES</td>
                    <td class="value-cell" colspan="5">{{ $ordenTrabajo->observaciones }}</td>
                </tr>
            @endif
        </table>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 66%; text-align: left;">Referencia / Ítem</th>
                    <th style="width: 18%;" class="text-center">Entrega</th>
                    <th style="width: 16%;" class="text-center">Cantidad</th>
                </tr>
            </thead>
            <tbody>
                @foreach($lineas as $linea)
                    <tr>
                        <td>
                            @if($linea->descripcion)
                                {{ mb_strtoupper($linea->descripcion) }} ({{ $linea->referencia }})
                            @else
                                {{ $linea->referencia }}
                            @endif
                            @if($linea->marca)
                                <span style="color: #64748b; font-size: 7.5px;"> - Marca: {{ mb_strtoupper($linea->marca) }}</span>
                            @endif
                        </td>
                        <td class="text-center">{{ $linea->entrega }}</td>
                        <td class="text-center">{{ $linea->cantidad }}</td>
                    </tr>
                @endforeach
                @for($i = $lineas->count(); $i < 8; $i++)
                    <tr>
                        <td>&nbsp;</td>
                        <td class="text-center"></td>
                        <td class="text-center"></td>
                    </tr>
                @endfor
            </tbody>
        </table>

        <!-- Signatures -->
        <div class="signatures">
            <table class="signatures-table">
                <tr>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-caption">Elaborado por</div>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-caption">Aceptada, firma y/o sello y fecha</div>
                    </td>
                </tr>
            </table>
        </div>

    </div>
</body>
</html>
