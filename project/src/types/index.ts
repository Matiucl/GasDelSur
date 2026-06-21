// ============================================================
// GAS DEL SUR — Tipos del dominio
// ============================================================

export type UserRole = 'admin' | 'driver' | 'client'

export interface User {
  id: string
  name: string
  rut: string
  email: string
  phone: string
  role: UserRole
  createdAt: string
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
  clientId: string        // FK → User.id
  clientName: string
  clientPhone: string
  address: string
  lat: number
  lng: number
  product: string
  quantity: number
  total: number
  status: OrderStatus
  driverId?: string       // FK → User.id
  driverName?: string
  driverPlate?: string
  driverLat?: number
  driverLng?: number
  securityToken?: string
  paymentMethod: 'cash' | 'remote' | 'card'
  createdAt: string
  updatedAt: string
  notes?: string
}

export interface Cylinder {
  id: string
  serialNumber: string
  type: '5kg' | '11kg' | '15kg' | '45kg'
  status: 'full' | 'empty' | 'illegible'
  driverId?: string
  driverName?: string
  captureUrl?: string
  needsManualValidation: boolean
  registeredAt: string
}

export interface Product {
  id: string
  name: string
  kg: number
  price: number
  stock: number
}

export type ExceptionCode = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6' | 'E7' | 'E8'

// Posición en tiempo real del chofer (se actualiza desde DriverHomePage)
export interface DriverPosition {
  driverId: string
  lat: number
  lng: number
  updatedAt: string
}
