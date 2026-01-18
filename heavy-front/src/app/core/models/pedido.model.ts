/**
 * Modelo de Pedido
 */
export interface Pedido {
  id: number;
  user_id: number;
  tercero_id: number;
  direccion: string | null;
  comentario: string | null;
  contacto_id: number | null;
  estado: PedidoEstado;
  maquina_id: number | null;
  fabricante_id: number | null;
  motivo_rechazo: string | null;
  comentarios_rechazo: string | null;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  user?: {
    id: number;
    name: string;
    email: string;
  };
  tercero?: any;
  maquina?: any;
  fabricante?: any;
  contacto?: any;
  referencias?: any[];
  articulos?: any[];
  
  // Contadores
  total_referencias?: number;
  total_articulos?: number;
}

/**
 * Estados posibles del pedido
 */
export type PedidoEstado = 
  | 'Nuevo'
  | 'Enviado'
  | 'Entregado'
  | 'Cancelado'
  | 'Rechazado'
  | 'Cotizado'
  | 'En_Costeo'
  | 'Aprobado';

/**
 * Datos para crear un pedido
 */
export interface CreatePedidoDto {
  tercero_id: number;
  direccion?: string;
  comentario?: string;
  contacto_id?: number;
  estado?: PedidoEstado;
  maquina_id?: number;
  fabricante_id?: number;
  referencias?: {
    referencia_id: number;
    cantidad: number;
    precio_unitario?: number;
  }[];
  articulos?: {
    articulo_id: number;
    cantidad: number;
    precio_unitario?: number;
  }[];
}

/**
 * Datos para actualizar un pedido
 */
export interface UpdatePedidoDto {
  tercero_id?: number;
  direccion?: string;
  comentario?: string;
  contacto_id?: number;
  estado?: PedidoEstado;
  maquina_id?: number;
  fabricante_id?: number;
  motivo_rechazo?: string;
  comentarios_rechazo?: string;
}
