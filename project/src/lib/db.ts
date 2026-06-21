// ============================================================
// GAS DEL SUR — Capa de persistencia (localStorage → PostgreSQL)
// Antes: leía/escribía localStorage directamente.
// Ahora: llama al backend Django REST (ver lib/api.ts).
// Mantiene los mismos nombres exportados (UsersDB, OrdersDB, etc.)
// para no tener que tocar las páginas que ya los consumen.
// ============================================================

import type { Order, Cylinder, User, OrderStatus, Product } from '@/types'
import { apiRequest } from '@/lib/api'

// ─── Helpers de mapeo snake_case (backend) ↔ camelCase (frontend) ──

interface RawUser {
  id: string
  name: string
  rut: string
  email: string
  phone: string
  role: User['role']
  created_at: string
}
function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    name: raw.name,
    rut: raw.rut,
    email: raw.email,
    phone: raw.phone,
    role: raw.role,
    createdAt: raw.created_at,
  }
}

interface RawProduct {
  id: string
  name: string
  kg: string | number
  price: number
  stock: number
}
function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    kg: Number(raw.kg),
    price: raw.price,
    stock: raw.stock,
  }
}

interface RawOrder {
  id: string
  order_number: string
  client: string
  client_name: string
  client_phone: string
  address: string
  lat: number
  lng: number
  product: string
  product_detail?: RawProduct
  quantity: number
  total: number
  payment_method: Order['paymentMethod']
  notes: string | null
  status: OrderStatus
  security_token: string | null
  driver: string | null
  driver_name: string | null
  driver_plate: string | null
  created_at: string
  updated_at: string
}
function mapOrder(raw: RawOrder): Order {
  // El backend guarda 'product' como FK al catálogo (p1..p4); el frontend
  // históricamente usa un string descriptivo ("Cilindro 15kg"). Lo
  // reconstruimos a partir de product_detail para no tocar las páginas
  // que ya muestran order.product como texto.
  const productLabel = raw.product_detail
    ? `Cilindro ${Number(raw.product_detail.kg)}kg`
    : raw.product

  return {
    id: raw.id,
    orderNumber: raw.order_number,
    clientId: raw.client,
    clientName: raw.client_name,
    clientPhone: raw.client_phone,
    address: raw.address,
    lat: raw.lat,
    lng: raw.lng,
    product: productLabel,
    quantity: raw.quantity,
    total: raw.total,
    status: raw.status,
    driverId: raw.driver ?? undefined,
    driverName: raw.driver_name ?? undefined,
    driverPlate: raw.driver_plate ?? undefined,
    securityToken: raw.security_token ?? undefined,
    paymentMethod: raw.payment_method,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    notes: raw.notes ?? undefined,
  }
}

interface RawCylinder {
  id: string
  serial_number: string
  type: Cylinder['type']
  status: Cylinder['status']
  driver: string | null
  driver_name: string | null
  capture_url: string | null
  needs_manual_validation: boolean
  registered_at: string
}
function mapCylinder(raw: RawCylinder): Cylinder {
  return {
    id: raw.id,
    serialNumber: raw.serial_number,
    type: raw.type,
    status: raw.status,
    driverId: raw.driver ?? undefined,
    driverName: raw.driver_name ?? undefined,
    captureUrl: raw.capture_url ?? undefined,
    needsManualValidation: raw.needs_manual_validation,
    registeredAt: raw.registered_at,
  }
}

// Resuelve el product_id (p1..p4) del catálogo a partir del string
// descriptivo "Cilindro 15kg" que siguen mandando las páginas de pedido.
// Si el string no calza con ningún producto conocido, usa el más cercano
// por kg o el primero del catálogo como último recurso.
async function resolveProductId(productLabel: string): Promise<string> {
  const products = await ProductsDB.all()
  const kgMatch = productLabel.match(/(\d+)\s*kg/i)
  const kg = kgMatch ? Number(kgMatch[1]) : null
  const found = kg !== null ? products.find((p) => p.kg === kg) : null
  return (found ?? products[0])?.id ?? 'p1'
}

// ─── PRODUCTS (catálogo — configurable por admin) ─────────────
export const ProductsDB = {
  async all(): Promise<Product[]> {
    const raw = await apiRequest<RawProduct[]>('/products/')
    return raw.map(mapProduct)
  },
  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    const payload: Record<string, unknown> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.kg !== undefined) payload.kg = data.kg
    if (data.price !== undefined) payload.price = data.price
    if (data.stock !== undefined) payload.stock = data.stock
    const raw = await apiRequest<RawProduct>(`/products/${id}/`, { method: 'PATCH', body: payload })
    return mapProduct(raw)
  },
}

// ─── ORDERS ──────────────────────────────────────────────────
export const OrdersDB = {
  async all(): Promise<Order[]> {
    const raw = await apiRequest<RawOrder[]>('/orders/')
    return raw.map(mapOrder)
  },
  async find(id: string): Promise<Order | undefined> {
    try {
      const raw = await apiRequest<RawOrder>(`/orders/${id}/`)
      return mapOrder(raw)
    } catch {
      return undefined
    }
  },
  async create(data: {
    clientId: string
    clientName: string
    clientPhone: string
    address: string
    lat: number
    lng: number
    product: string
    quantity: number
    total: number
    paymentMethod: Order['paymentMethod']
    notes?: string
  }): Promise<Order> {
    const productId = await resolveProductId(data.product)
    const raw = await apiRequest<RawOrder>('/orders/', {
      method: 'POST',
      body: {
        client: data.clientId,
        client_name: data.clientName,
        client_phone: data.clientPhone,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        product: productId,
        quantity: data.quantity,
        total: data.total,
        payment_method: data.paymentMethod,
        notes: data.notes ?? null,
        status: 'Solicitado',
        security_token: String(Math.floor(1000 + Math.random() * 9000)),
      },
    })
    return mapOrder(raw)
  },
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const raw = await apiRequest<RawOrder>(`/orders/${id}/`, { method: 'PATCH', body: { status } })
    return mapOrder(raw)
  },
  async assignDriver(id: string, driverId: string, driverName: string, plate: string): Promise<Order | null> {
    const raw = await apiRequest<RawOrder>(`/orders/${id}/`, {
      method: 'PATCH',
      body: { driver: driverId, driver_name: driverName, driver_plate: plate, status: 'Asignado' },
    })
    return mapOrder(raw)
  },
  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    const payload: Record<string, unknown> = {}
    if (data.status !== undefined) payload.status = data.status
    if (data.driverId !== undefined) payload.driver = data.driverId
    if (data.driverName !== undefined) payload.driver_name = data.driverName
    if (data.driverPlate !== undefined) payload.driver_plate = data.driverPlate
    if (data.notes !== undefined) payload.notes = data.notes
    if (data.address !== undefined) payload.address = data.address
    if (data.lat !== undefined) payload.lat = data.lat
    if (data.lng !== undefined) payload.lng = data.lng
    const raw = await apiRequest<RawOrder>(`/orders/${id}/`, { method: 'PATCH', body: payload })
    return mapOrder(raw)
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/orders/${id}/`, { method: 'DELETE' })
  },
}

// ─── CYLINDERS ───────────────────────────────────────────────
export const CylindersDB = {
  async all(): Promise<Cylinder[]> {
    const raw = await apiRequest<RawCylinder[]>('/cylinders/')
    return raw.map(mapCylinder)
  },
  async find(id: string): Promise<Cylinder | undefined> {
    try {
      const raw = await apiRequest<RawCylinder>(`/cylinders/${id}/`)
      return mapCylinder(raw)
    } catch {
      return undefined
    }
  },
  async register(data: {
    serialNumber: string
    type: Cylinder['type']
    status: Cylinder['status']
    driverId?: string
    driverName?: string
    captureUrl?: string
    needsManualValidation: boolean
  }): Promise<Cylinder> {
    const raw = await apiRequest<RawCylinder>('/cylinders/', {
      method: 'POST',
      body: {
        id: crypto.randomUUID(),
        serial_number: data.serialNumber,
        type: data.type,
        status: data.status,
        driver: data.driverId ?? null,
        driver_name: data.driverName ?? null,
        capture_url: data.captureUrl ?? null,
        needs_manual_validation: data.needsManualValidation,
        registered_at: new Date().toISOString(),
      },
    })
    return mapCylinder(raw)
  },
  async validate(id: string, newSerial: string): Promise<Cylinder | null> {
    const raw = await apiRequest<RawCylinder>(`/cylinders/${id}/`, {
      method: 'PATCH',
      body: { serial_number: newSerial, status: 'full', needs_manual_validation: false },
    })
    return mapCylinder(raw)
  },
}

// ─── USERS ───────────────────────────────────────────────────
export const UsersDB = {
  async all(): Promise<User[]> {
    const raw = await apiRequest<RawUser[]>('/users/')
    return raw.map(mapUser)
  },
  async find(id: string): Promise<User | undefined> {
    try {
      const raw = await apiRequest<RawUser>(`/users/${id}/`)
      return mapUser(raw)
    } catch {
      return undefined
    }
  },
  async findByRut(rut: string): Promise<User | undefined> {
    const clean = (s: string) => s.replace(/[.\-]/g, '').toLowerCase()
    const users = await this.all()
    return users.find((u) => clean(u.rut) === clean(rut))
  },
  async findByEmail(email: string): Promise<User | undefined> {
    const users = await this.all()
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  },
  async drivers(): Promise<User[]> {
    const users = await this.all()
    return users.filter((u) => u.role === 'driver')
  },
  // Crea un usuario con rol arbitrario (driver/admin/client) — requiere
  // estar autenticado como admin. Usado por AdminClientsPage y
  // AdminSettingsPage para crear choferes y otros administradores.
  async create(data: {
    name: string
    rut: string
    email: string
    phone: string
    role: User['role']
    password: string
  }): Promise<User> {
    const raw = await apiRequest<{ user: RawUser }>('/auth/admin-create-user/', {
      method: 'POST',
      body: { name: data.name, rut: data.rut, email: data.email, phone: data.phone, role: data.role, password: data.password },
    })
    return mapUser(raw.user)
  },
  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    const raw = await apiRequest<RawUser>(`/users/${id}/`, { method: 'PATCH', body: data })
    return mapUser(raw)
  },
  async delete(id: string): Promise<void> {
    await apiRequest(`/users/${id}/`, { method: 'DELETE' })
  },
}

// ─── STATS ───────────────────────────────────────────────────
// Calculadas en el cliente a partir de /orders/ y /cylinders/ (no hay
// endpoint dedicado de estadísticas en el backend).
export const StatsDB = {
  async overview() {
    const [orders, cylinders] = await Promise.all([OrdersDB.all(), CylindersDB.all()])
    const today = new Date().toDateString()
    return {
      totalOrders: orders.length,
      todayOrders: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length,
      active: orders.filter((o) =>
        ['Asignado', 'En Ruta', 'En Punto de Entrega', 'En Validación'].includes(o.status)
      ).length,
      delivered: orders.filter((o) => ['Entregado', 'Finalizado'].includes(o.status)).length,
      failed: orders.filter((o) => o.status === 'Fallido').length,
      pending: orders.filter((o) => o.status === 'Solicitado').length,
      pendingCylinders: cylinders.filter((c) => c.needsManualValidation).length,
      revenue: orders
        .filter((o) => ['Entregado', 'Finalizado'].includes(o.status))
        .reduce((s, o) => s + o.total, 0),
    }
  },
}

// ─── DRIVER POSITIONS (tiempo real) ──────────────────────────
export const PositionsDB = {
  async set(driverId: string, lat: number, lng: number): Promise<void> {
    await apiRequest(`/driver-positions/${driverId}/set/`, { method: 'POST', body: { lat, lng } })
  },
  async get(driverId: string): Promise<{ lat: number; lng: number; updatedAt: string } | null> {
    try {
      const raw = await apiRequest<{ lat: number; lng: number; updated_at: string }>(
        `/driver-positions/${driverId}/`
      )
      return { lat: raw.lat, lng: raw.lng, updatedAt: raw.updated_at }
    } catch {
      return null
    }
  },
}

// ─── Utilidad: distancia Haversine en km ─────────────────────
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Tiempo estimado en minutos dado distancia km y velocidad promedio urbana
export function etaMinutes(distanceKm: number, speedKmh = 30): number {
  return Math.max(5, Math.round((distanceKm / speedKmh) * 60))
}
