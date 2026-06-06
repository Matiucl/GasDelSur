import type { Order, Cylinder, User, OrderStatus } from '@/types'
import {
  MOCK_ORDERS,
  MOCK_CYLINDERS,
  MOCK_ADMIN_USER,
  MOCK_DRIVER_USER,
  MOCK_CLIENT_USER,
} from './mockData'

// ─── helpers ────────────────────────────────────────────────
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
  return Math.random().toString(36).slice(2, 9).toUpperCase()
}
function now(): string {
  return new Date().toISOString()
}

// ─── SEED (primera vez) ─────────────────────────────────────
export function seedIfEmpty(): void {
  if (!localStorage.getItem('gds:seeded')) {
    write('gds:orders', MOCK_ORDERS)
    write('gds:cylinders', MOCK_CYLINDERS)
    write('gds:users', [MOCK_ADMIN_USER, MOCK_DRIVER_USER, MOCK_CLIENT_USER])
    write('gds:seeded', true)
  }
}

// ─── ORDERS ─────────────────────────────────────────────────
export const OrdersDB = {
  all(): Order[] {
    return read<Order[]>('gds:orders', [])
  },
  find(id: string): Order | undefined {
    return this.all().find((o) => o.id === id)
  },
  byStatus(status: OrderStatus): Order[] {
    return this.all().filter((o) => o.status === status)
  },
  byClient(clientId: string): Order[] {
    // clientId se mapea con clientName por ahora (sin FK real)
    return this.all().filter((o) => o.clientName.toLowerCase().includes(clientId.toLowerCase()))
  },
  create(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'securityToken'>): Order {
    const orders = this.all()
    const nextNum = 8300 + orders.length
    const order: Order = {
      ...data,
      id: genId(),
      orderNumber: `GDS-${nextNum}`,
      createdAt: now(),
      securityToken: String(Math.floor(1000 + Math.random() * 9000)),
      status: 'Solicitado',
    }
    write('gds:orders', [order, ...orders])
    return order
  },
  updateStatus(id: string, status: OrderStatus): Order | null {
    const orders = this.all()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orders[idx] = { ...orders[idx], status }
    write('gds:orders', orders)
    return orders[idx]
  },
  assignDriver(id: string, driverName: string, plate: string): Order | null {
    const orders = this.all()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return null
    orders[idx] = { ...orders[idx], driverName, driverPlate: plate, status: 'Asignado' }
    write('gds:orders', orders)
    return orders[idx]
  },
  delete(id: string): void {
    write(
      'gds:orders',
      this.all().filter((o) => o.id !== id)
    )
  },
}

// ─── CYLINDERS ──────────────────────────────────────────────
export const CylindersDB = {
  all(): Cylinder[] {
    return read<Cylinder[]>('gds:cylinders', [])
  },
  find(id: string): Cylinder | undefined {
    return this.all().find((c) => c.id === id)
  },
  needsValidation(): Cylinder[] {
    return this.all().filter((c) => c.needsManualValidation)
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
  registerIllegible(driverName: string, type: Cylinder['type'], captureUrl?: string): Cylinder {
    const cylinders = this.all()
    const cylinder: Cylinder = {
      id: genId(),
      serialNumber: 'E8-ILEGIBLE',
      type,
      status: 'illegible',
      driverName,
      captureUrl: captureUrl ?? '',
      needsManualValidation: true,
    }
    write('gds:cylinders', [...cylinders, cylinder])
    return cylinder
  },
}

// ─── USERS / AUTH ────────────────────────────────────────────
export const UsersDB = {
  all(): User[] {
    return read<User[]>('gds:users', [])
  },
  findByRut(rut: string): User | undefined {
    return this.all().find((u) => u.rut.replace(/[.\-]/g, '') === rut.replace(/[.\-]/g, ''))
  },
  // Credenciales fijas para demo (sin hash — simulado)
  authenticate(rut: string, _password: string): User | null {
    const user = this.findByRut(rut)
    return user ?? null
  },
}

// ─── STATS (para admin dashboard) ───────────────────────────
export const StatsDB = {
  today() {
    const orders = OrdersDB.all()
    const today = new Date().toDateString()
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
    return {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      active: orders.filter((o) =>
        ['Asignado', 'En Ruta', 'En Punto de Entrega', 'En Validación'].includes(o.status)
      ).length,
      delivered: orders.filter((o) => ['Entregado', 'Finalizado'].includes(o.status)).length,
      failed: orders.filter((o) => o.status === 'Fallido').length,
      illegibleCylinders: CylindersDB.needsValidation().length,
      revenue: orders
        .filter((o) => ['Entregado', 'Finalizado'].includes(o.status))
        .reduce((sum, o) => sum + o.total, 0),
    }
  },
}

// ─── RESET (útil en desarrollo) ──────────────────────────────
export function resetDB(): void {
  localStorage.removeItem('gds:seeded')
  seedIfEmpty()
}
