// ============================================================
// GAS DEL SUR — Cliente API (Django backend)
// Reemplaza progresivamente las funciones de db.ts (localStorage)
// ============================================================

import type { User } from '@/types'

const API_BASE = 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('gds:token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      data?.detail ||
      data?.error ||
      (typeof data === 'object' && data ? Object.values(data).flat().join(' ') : null) ||
      'Error en la solicitud'
    throw new ApiError(message, res.status)
  }
  return data
}

// ─── AUTH ───────────────────────────────────────────────────
export interface RegisterPayload {
  name: string
  rut: string
  email: string
  phone: string
  role: 'admin' | 'driver' | 'client'
  password: string
}

export async function registerUser(payload: RegisterPayload): Promise<User> {
  const data = await apiFetch('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  localStorage.setItem('gds:token', data.access)
  localStorage.setItem('gds:refresh', data.refresh)
  return data.user
}

export async function loginUser(rut: string, password: string): Promise<User> {
  const data = await apiFetch('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ rut, password }),
  })
  localStorage.setItem('gds:token', data.access)
  localStorage.setItem('gds:refresh', data.refresh)
  return data.user
}

export function logoutApi() {
  localStorage.removeItem('gds:token')
  localStorage.removeItem('gds:refresh')
}

export { apiFetch }