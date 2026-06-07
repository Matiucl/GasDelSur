// ============================================================
// GAS DEL SUR — Hooks reactivos sobre la capa de persistencia
// ============================================================
import { useState, useCallback, useEffect } from 'react'
import { OrdersDB, CylindersDB, StatsDB, UsersDB, ProductsDB } from '@/lib/db'
import type { Order, Cylinder, OrderStatus, User, Product } from '@/types'

function useStorageSync(keys: string[], onChange: () => void) {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || keys.some((k) => e.key?.startsWith(k))) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [keys, onChange])
}

// ─── Orders ──────────────────────────────────────────────────
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(() => OrdersDB.all())
  const refresh = useCallback(() => setOrders(OrdersDB.all()), [])
  useStorageSync(['gds:orders'], refresh)

  const createOrder = useCallback((data: Parameters<typeof OrdersDB.create>[0]) => {
    const o = OrdersDB.create(data)
    refresh()
    return o
  }, [refresh])

  const updateStatus = useCallback((id: string, status: OrderStatus) => {
    OrdersDB.updateStatus(id, status)
    refresh()
  }, [refresh])

  const assignDriver = useCallback(
    (id: string, driverId: string, driverName: string, plate: string) => {
      OrdersDB.assignDriver(id, driverId, driverName, plate)
      refresh()
    },
    [refresh]
  )

  const deleteOrder = useCallback((id: string) => {
    OrdersDB.delete(id)
    refresh()
  }, [refresh])

  const updateOrder = useCallback((id: string, data: Partial<Order>) => {
    OrdersDB.update(id, data)
    refresh()
  }, [refresh])

  return { orders, refresh, createOrder, updateStatus, assignDriver, deleteOrder, updateOrder }
}

// ─── Cylinders ───────────────────────────────────────────────
export function useCylinders() {
  const [cylinders, setCylinders] = useState<Cylinder[]>(() => CylindersDB.all())
  const refresh = useCallback(() => setCylinders(CylindersDB.all()), [])
  useStorageSync(['gds:cylinders'], refresh)

  const validate = useCallback((id: string, newSerial: string) => {
    CylindersDB.validate(id, newSerial)
    refresh()
  }, [refresh])

  return { cylinders, refresh, validate }
}

// ─── Stats ───────────────────────────────────────────────────
export function useStats() {
  const [stats, setStats] = useState(() => StatsDB.overview())
  const refresh = useCallback(() => setStats(StatsDB.overview()), [])
  useStorageSync(['gds:orders', 'gds:cylinders'], refresh)
  return { stats, refresh }
}

// ─── Users (admin) ───────────────────────────────────────────
export function useUsers() {
  const [users, setUsers] = useState<User[]>(() => UsersDB.all())
  const refresh = useCallback(() => setUsers(UsersDB.all()), [])
  useStorageSync(['gds:users'], refresh)
  return { users, refresh }
}

// ─── Products ────────────────────────────────────────────────
export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => ProductsDB.all())
  const refresh = useCallback(() => setProducts(ProductsDB.all()), [])
  return { products, refresh }
}
