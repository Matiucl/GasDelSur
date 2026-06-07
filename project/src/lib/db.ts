// ============================================================
// GAS DEL SUR — Capa de persistencia (localStorage → PostgreSQL)
// Cada colección mapea 1:1 a una tabla Postgres.
// Para migrar: reemplazar read()/write() por fetch() al API.
// ============================================================

import type { Order, Cylinder, User, OrderStatus, Product } from '@/types'

// ─── Helpers internos ────────────────────────────────────────
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}
function genId(): string {
  return crypto.randomUUID()
}
function now(): string {
  return new Date().toISOString()
}
// Hash de contraseña usando Web Crypto API (SHA-256)
// Cuando se integre el backend, reemplazar por bcrypt server-side.
async function hashPassword(plain: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(plain))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return await hashPassword(plain) === hash
}
export { hashPassword }

// ─── PRODUCTS (catálogo — configurable por admin) ─────────────
const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cilindro Gas 5kg',  kg: 5,  price: 12500, stock: 0 },
  { id: 'p2', name: 'Cilindro Gas 11kg', kg: 11, price: 18900, stock: 0 },
  { id: 'p3', name: 'Cilindro Gas 15kg', kg: 15, price: 24200, stock: 0 },
  { id: 'p4', name: 'Cilindro Gas 45kg', kg: 45, price: 72000, stock: 0 },
]

export const ProductsDB = {
  all(): Product[] {
    return read<Product[]>('gds:products', DEFAULT_PRODUCTS)
  },
  update(id: string, data: Partial<Product>): Product | null {
    const products = this.all()
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return null
    products[idx] = { ...products[idx], ...data }
    write('gds:products', products)
    return products[idx]
  },
}

// ─── ORDERS ──────────────────────────────────────────────────
export const OrdersDB = {
  all(): Order[] {
    return read<Order[]>('gds:orders', [])
  },
  find(id: string): Order | undefined {
    return this.all().find((o) => o.id === id)
  },
  byClient(clientId: string): Order[] {
    return this.all().filter((o) => o.clientId === clientId)
  },
  byDriver(driverId: string): Order[] {
    return this.all().filter((o) => o.driverId === driverId)
  },
  byStatus(status: OrderStatus): Order[] {
    return this.all().filter((o) => o.status === status)
  },
  activeByDriver(driverId: string): Order[] {
    return this.all().filter(
      (o) => o.driverId === driverId &&
      ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
    )
  },
  create(data: {
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
  }): Order {
    const orders = this.all()
    // Número correlativo basado en la cantidad total de pedidos históricos
    const seq = (read<number>('gds:order_seq', 1000) + 1)
    write('gds:order_seq', seq)
    const order: Order = {
      ...data,
      id: genId(),
      orderNumber: `GDS-${seq}`,
      status: 'Solicitado',
      securityToken: String(Math.floor(1000 + Math.random() * 9000)),
      createdAt: now(),
      updatedAt: now(),
    }
    write('gds:orders', [order, ...orders])
    return order
  },
  updateStatus(id: string, status: OrderStatus): Order | null {
    const orders = this.all()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orders[idx] = { ...orders[idx], status, updatedAt: now() }
    write('gds:orders', orders)
    return orders[idx]
  },
  assignDriver(id: string, driverId: string, driverName: string, plate: string): Order | null {
    const orders = this.all()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orders[idx] = {
      ...orders[idx],
      driverId,
      driverName,
      driverPlate: plate,
      status: 'Asignado',
      updatedAt: now(),
    }
    write('gds:orders', orders)
    return orders[idx]
  },
  update(id: string, data: Partial<Order>): Order | null {
    const orders = this.all()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orders[idx] = { ...orders[idx], ...data, updatedAt: now() }
    write('gds:orders', orders)
    return orders[idx]
  },
  delete(id: string): void {
    write('gds:orders', this.all().filter((o) => o.id !== id))
  },
}

// ─── CYLINDERS ───────────────────────────────────────────────
export const CylindersDB = {
  all(): Cylinder[] {
    return read<Cylinder[]>('gds:cylinders', [])
  },
  find(id: string): Cylinder | undefined {
    return this.all().find((c) => c.id === id)
  },
  pending(): Cylinder[] {
    return this.all().filter((c) => c.needsManualValidation)
  },
  register(data: {
    serialNumber: string
    type: Cylinder['type']
    status: Cylinder['status']
    driverId?: string
    driverName?: string
    captureUrl?: string
    needsManualValidation: boolean
  }): Cylinder {
    const cylinders = this.all()
    const c: Cylinder = { ...data, id: genId(), registeredAt: now() }
    write('gds:cylinders', [...cylinders, c])
    return c
  },
  validate(id: string, newSerial: string): Cylinder | null {
    const cylinders = this.all()
    const idx = cylinders.findIndex((c) => c.id === id)
    if (idx === -1) return null
    cylinders[idx] = {
      ...cylinders[idx],
      serialNumber: newSerial,
      status: 'full',
      needsManualValidation: false,
    }
    write('gds:cylinders', cylinders)
    return cylinders[idx]
  },
}

// ─── USERS ───────────────────────────────────────────────────
export const UsersDB = {
  all(): User[] {
    return read<User[]>('gds:users', [])
  },
  find(id: string): User | undefined {
    return this.all().find((u) => u.id === id)
  },
  findByRut(rut: string): User | undefined {
    const clean = (s: string) => s.replace(/[.\-]/g, '').toLowerCase()
    return this.all().find((u) => clean(u.rut) === clean(rut))
  },
  findByEmail(email: string): User | undefined {
    return this.all().find((u) => u.email.toLowerCase() === email.toLowerCase())
  },
  drivers(): User[] {
    return this.all().filter((u) => u.role === 'driver')
  },
  async create(data: {
    name: string
    rut: string
    email: string
    phone: string
    role: User['role']
    password: string
  }): Promise<User> {
    const users = this.all()
    const user: User = {
      id: genId(),
      name: data.name,
      rut: data.rut,
      email: data.email,
      phone: data.phone,
      role: data.role,
      passwordHash: await hashPassword(data.password),
      createdAt: now(),
    }
    write('gds:users', [...users, user])
    return user
  },
  update(id: string, data: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>>): User | null {
    const users = this.all()
    const idx = users.findIndex((u) => u.id === id)
    if (idx === -1) return null
    users[idx] = { ...users[idx], ...data }
    write('gds:users', users)
    return users[idx]
  },
  async changePassword(id: string, newPassword: string): Promise<boolean> {
    const users = this.all()
    const idx = users.findIndex((u) => u.id === id)
    if (idx === -1) return false
    users[idx] = { ...users[idx], passwordHash: await hashPassword(newPassword) }
    write('gds:users', users)
    return true
  },
  delete(id: string): void {
    write('gds:users', this.all().filter((u) => u.id !== id))
  },
}

// ─── STATS ───────────────────────────────────────────────────
export const StatsDB = {
  overview() {
    const orders = OrdersDB.all()
    const today = new Date().toDateString()
    return {
      totalOrders: orders.length,
      todayOrders: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length,
      active: orders.filter((o) =>
        ['Asignado','En Ruta','En Punto de Entrega','En Validación'].includes(o.status)
      ).length,
      delivered: orders.filter((o) => ['Entregado','Finalizado'].includes(o.status)).length,
      failed: orders.filter((o) => o.status === 'Fallido').length,
      pending: orders.filter((o) => o.status === 'Solicitado').length,
      pendingCylinders: CylindersDB.pending().length,
      revenue: orders
        .filter((o) => ['Entregado','Finalizado'].includes(o.status))
        .reduce((s, o) => s + o.total, 0),
    }
  },
}

// ─── DRIVER POSITIONS (tiempo real) ──────────────────────────
// Guarda lat/lng actual de cada chofer. Se sobrescribe en cada actualización.
export const PositionsDB = {
  set(driverId: string, lat: number, lng: number): void {
    const all = read<Record<string, { lat: number; lng: number; updatedAt: string }>>('gds:positions', {})
    all[driverId] = { lat, lng, updatedAt: new Date().toISOString() }
    write('gds:positions', all)
  },
  get(driverId: string): { lat: number; lng: number; updatedAt: string } | null {
    const all = read<Record<string, { lat: number; lng: number; updatedAt: string }>>('gds:positions', {})
    return all[driverId] ?? null
  },
  all(): Record<string, { lat: number; lng: number; updatedAt: string }> {
    return read('gds:positions', {})
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


export async function initDB() {
  const users = UsersDB.all()
  if (users.length === 0) {
    await UsersDB.create({
      name: 'Administrador',
      rut: '11.111.111-1',       
      email: 'admin@gasdelsur.cl',
      phone: '+56 9 0000 0000',
      role: 'admin',
      password: 'admin123',       
    })
  }
}