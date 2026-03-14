<x-mail::message>
# Hola {{ $pedido->tercero->nombre }},

Gracias por interesarte en **HeavyMarket**. Hemos recibido tu solicitud de cotización y nuestro equipo comercial ya está trabajando en ella.

**Detalles de la solicitud:**
- **Pedido #:** {{ $pedido->id }}
- **Fecha:** {{ $pedido->created_at->format('d/m/Y') }}

### Ítems Solicitados:
| Cant. | Referencia / Descripción | Sistema |
| :--- | :--- | :--- |
@foreach($pedido->referencias as $item)
| {{ $item->cantidad }} | {{ $item->referencia?->referencia ?? $item->definicion }} | {{ $item->sistema?->nombre ?? 'N/A' }} |
@endforeach

Pronto nos pondremos en contacto contigo para enviarte los mejores precios del mercado.

Si tienes alguna duda urgente, puedes contactarnos a través de **comercial@heavymarket.net** o a nuestro soporte de WhatsApp.

<x-mail::button :url="'https://www.heavymarket.net'">
Visitar HeavyMarket
</x-mail::button>

Gracias,<br>
El equipo de {{ config('app.name') }}
</x-mail::message>
