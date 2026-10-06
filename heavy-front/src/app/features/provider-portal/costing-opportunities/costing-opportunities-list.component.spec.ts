import { agruparOportunidadesPorPedido } from './costing-opportunities-list.component';

describe('agruparOportunidadesPorPedido', () => {
    it('agrupa varias filas del mismo pedido en un solo resumen, contando los items', () => {
        const filas = [
            { pedido_id: 10, pedido: { id: 10, estado: 'En_Costeo', user: { name: 'Vendedor A' }, maquina: { marca: 'Komatsu', modelo: 'PC200' } } },
            { pedido_id: 10, pedido: { id: 10, estado: 'En_Costeo', user: { name: 'Vendedor A' }, maquina: { marca: 'Komatsu', modelo: 'PC200' } } },
            { pedido_id: 11, pedido: { id: 11, estado: 'En_Costeo', user: { name: 'Vendedor B' }, maquina: null } }
        ];

        const resumen = agruparOportunidadesPorPedido(filas);

        expect(resumen).toEqual([
            { pedidoId: 11, estadoPedido: 'En_Costeo', vendedor: 'Vendedor B', maquina: 'Sin máquina asociada', cantidadItems: 1 },
            { pedidoId: 10, estadoPedido: 'En_Costeo', vendedor: 'Vendedor A', maquina: 'Komatsu PC200', cantidadItems: 2 }
        ]);
    });

    it('ignora filas sin pedido_id resoluble y ordena por pedido mas reciente primero', () => {
        const filas = [{ pedido_id: undefined, pedido: null }, { pedido: { id: 5 } }, { pedido_id: 7 }];

        const resumen = agruparOportunidadesPorPedido(filas);

        expect(resumen.map((r) => r.pedidoId)).toEqual([7, 5]);
    });
});
