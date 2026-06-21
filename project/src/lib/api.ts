// ============================================================
// GAS DEL SUR — Cliente HTTP hacia el backend Django REST
// Reemplaza la antigua capa de persistencia en localStorage.
// ============================================================
const API_BASE_URL = 'http://localhost:8000/api'

// ─── Tokens ──────────────────────────────────────────────────
// Se guardan junto al resto de la sesión en 'gds:session' (ver AuthContext),
// pero el cliente HTTP necesita acceso directo y rápido a ellos.
function getAccessToken(): string | null {
  return localStorage.getItem('gds:access')
}
function getRefreshToken(): string | null {
  return localStorage.getItem('gds:refresh')
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem('gds:access', access)
  localStorage.setItem('gds:refresh', refresh)
}
export function clearTokens(): void {
  localStorage.removeItem('gds:access')
  localStorage.removeItem('gds:refresh')
}

// ─── Error de API ────────────────────────────────────────────
export class ApiError extends Error {
  status: number
  body: unknown
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `Error de API (status ${status})`)
    this.status = status
    this.body = body
  }
}

// Intenta extraer un mensaje legible del cuerpo de error que devuelve DRF
// (puede venir como {detail: '...'} o como {campo: ['error1', 'error2']}).
function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return 'Ocurrió un error inesperado.'
  const obj = body as Record<string, unknown>
  if (typeof obj.detail === 'string') return obj.detail
  const firstKey = Object.keys(obj)[0]
  if (firstKey) {
    const val = obj[firstKey]
    if (Array.isArray(val) && typeof val[0] === 'string') return val[0]
    if (typeof val === 'string') return val
  }
  return 'Ocurrió un error inesperado.'
}

// ─── Refresh de token ────────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken()
  if (!refresh) return null

  // Evita disparar múltiples refresh en paralelo si varias requests
  // fallan con 401 al mismo tiempo.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL.replace(/\/api$/, '')}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json()
        localStorage.setItem('gds:access', data.access)
        return data.access as string
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// ─── Request genérico ───────────────────────────────────────
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  auth?: boolean   // por defecto true: adjunta el Bearer token
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options

  const doFetch = async (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (auth && token) headers.Authorization = `Bearer ${token}`
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  let res = await doFetch(auth ? getAccessToken() : null)

  // Si el access token expiró, intenta refrescar UNA vez y reintenta.
  if (res.status === 401 && auth && getRefreshToken()) {
    const newAccess = await refreshAccessToken()
    if (newAccess) {
      res = await doFetch(newAccess)
    } else {
      clearTokens()
    }
  }

  if (!res.ok) {
    let parsedBody: unknown = null
    try {
      parsedBody = await res.json()
    } catch {
      // sin body o no es JSON
    }
    throw new ApiError(res.status, parsedBody, extractErrorMessage(parsedBody))
  }

  // 204 No Content u otras respuestas vacías
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}
