// ============================================================
// GAS DEL SUR — Hooks para datos reactivos desde DB local
// ============================================================
import { useState, useCallback, useEffect } from 'react'
import { OrdersDB, CylindersDB, StatsDB } from '@/lib/db'
import type { Order, Cylinder, OrderStatus } from '@/types'

// ─── Hook genérico para re-render en cambios de localStorage
function useStorageSync(keys: string[], onChange: () => void) {
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (!e.key || keys.some((k) => e.key?.startsWith(k))) onChange()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [keys, onChange])
}

// ─── Orders
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(() => OrdersDB.all())
  const refresh = useCallback(() => setOrders(OrdersDB.all()), [])
  useStorageSync(['gds:orders'], refresh)

  const updateStatus = useCallback((id: string, status: OrderStatus) => {
    OrdersDB.updateStatus(id, status)
    refresh()
  }, [refresh])

  const assignDriver = useCallback((id: string, driverName: string, plate: string) => {
    OrdersDB.assignDriver(id, driverName, plate)
    refresh()
  }, [refresh])

  const createOrder = useCallback((data: Parameters<typeof OrdersDB.create>[0]) => {
    const order = OrdersDB.create(data)
    refresh()
    return order
  }, [refresh])

  const deleteOrder = useCallback((id: string) => {
    OrdersDB.delete(id)
    refresh()
  }, [refresh])

  return { orders, refresh, updateStatus, assignDriver, createOrder, deleteOrder }
}

// ─── Cylinders
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

// ─── Stats
export function useStats() {
  const [stats, setStats] = useState(() => StatsDB.today())
  const refresh = useCallback(() => setStats(StatsDB.today()), [])
  useStorageSync(['gds:orders', 'gds:cylinders'], refresh)
  return { stats, refresh }
}
