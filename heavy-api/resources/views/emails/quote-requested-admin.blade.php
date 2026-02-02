<x-mail::message>
# Nueva Solicitud de Cotización

Se ha generado una nueva solicitud desde la landing page.

**Información del Cliente:**
- **Nombre:** {{ $pedido->tercero->nombre }}
- **Email:** {{ $pedido->tercero->email }}
- **Teléfono:** {{ $pedido->tercero->telefono }}
- **Empresa:** {{ $pedido->tercero->nombre }} {{-- O la empresa si se guardó --}}

**Detalles del Pedido:**
- **ID del Pedido:** {{ $pedido->id }}
- **Comentario/Máquina:** {{ $pedido->comentario }}

**Ítems Solicitados:**
@foreach($pedido->referencias as $item)
- **{{ $item->cantidad }}x {{ $item->definicion }}** (Sistema: {{ $item->sistema?->nombre ?? 'N/A' }})
@endforeach

<x-mail::button :url="config('app.url') . '/admin/pedidos/' . $pedido->id">
Ver pedido en el Panel
</x-mail::button>

Este es un correo automático generado por el sistema.
</x-mail::message>
