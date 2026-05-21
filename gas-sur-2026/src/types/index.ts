// ============================================================
// GAS DEL SUR — Types
// ============================================================

export type UserRole = 'admin' | 'driver' | 'client'

export interface User {
  id: string
  name: string
  rut: string
  email: string
  phone: string
  role: UserRole
  password: string
  avatarUrl?: string
}

export type OrderStatus =
  | 'Solicitado'
  | 'Asignado'
  | 'En Ruta'
  | 'En Punto de Entrega'
  | 'En Validación'
  | 'Entregado'
  | 'Finalizado'
  | 'Fallido'
  | 'Cancelado'

export interface Order {
  id: string
  orderNumber: string
  clientName: string
  clientPhone: string
  address: string
  lat: number
  lng: number
  product: string
  quantity: number
  total: number
  status: OrderStatus
  driverName?: string
  driverPlate?: string
  createdAt: string
  securityToken?: string
  paymentMethod: 'cash' | 'remote' | 'card'
}

export interface Cylinder {
  id: string
  serialNumber: string
  type: '5kg' | '11kg' | '15kg' | '45kg'
  status: 'full' | 'empty' | 'illegible'
  driverName?: string
  captureUrl?: string
  needsManualValidation: boolean
}

export interface RouteStop {
  order: Order
  estimatedArrival: string
  distanceKm: number
  sequence: number
}

export type ExceptionCode = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8'

export interface Exception {
  code: ExceptionCode
  name: string
  description: string
  active: boolean
}
