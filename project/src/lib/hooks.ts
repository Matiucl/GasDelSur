// ============================================================
// GAS DEL SUR — Hooks reactivos sobre la capa de persistencia
// Antes: sincronizaban con localStorage (evento 'storage').
// Ahora: consultan la API al montar y exponen refresh() para
// volver a consultar tras cada mutación.
// ============================================================
import { useState, useCallback, useEffect } from 'react'
import { OrdersDB, CylindersDB, StatsDB, UsersDB, ProductsDB } from '@/lib/db'
import type { Order, Cylinder, OrderStatus, User, Product } from '@/types'

// ─── Orders ──────────────────────────────────────────────────
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setOrders(await OrdersDB.all())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const createOrder = useCallback(async (data: Parameters<typeof OrdersDB.create>[0]) => {
    const o = await OrdersDB.create(data)
    await refresh()
    return o
  }, [refresh])

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    await OrdersDB.updateStatus(id, status)
    await refresh()
  }, [refresh])

  const assignDriver = useCallback(
    async (id: string, driverId: string, driverName: string, plate: string) => {
      await OrdersDB.assignDriver(id, driverId, driverName, plate)
      await refresh()
    },
    [refresh]
  )

  const deleteOrder = useCallback(async (id: string) => {
    await OrdersDB.delete(id)
    await refresh()
  }, [refresh])

  const updateOrder = useCallback(async (id: string, data: Partial<Order>) => {
    await OrdersDB.update(id, data)
    await refresh()
  }, [refresh])

  return { orders, loading, refresh, createOrder, updateStatus, assignDriver, deleteOrder, updateOrder }
}

// ─── Cylinders ───────────────────────────────────────────────
export function useCylinders() {
  const [cylinders, setCylinders] = useState<Cylinder[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setCylinders(await CylindersDB.all())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const validate = useCallback(async (id: string, newSerial: string) => {
    await CylindersDB.validate(id, newSerial)
    await refresh()
  }, [refresh])

  return { cylinders, loading, refresh, validate }
}

// ─── Stats ───────────────────────────────────────────────────
export function useStats() {
  const [stats, setStats] = useState(() => ({
    totalOrders: 0, todayOrders: 0, active: 0, delivered: 0,
    failed: 0, pending: 0, pendingCylinders: 0, revenue: 0,
  }))
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await StatsDB.overview())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { stats, loading, refresh }
}

// ─── Users (admin) ───────────────────────────────────────────
export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await UsersDB.all())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { users, loading, refresh }
}

// ─── Products ────────────────────────────────────────────────
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await ProductsDB.all())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  return { products, loading, refresh }
}
